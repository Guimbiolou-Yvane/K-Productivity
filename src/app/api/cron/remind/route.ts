import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const DAY_MAP: Record<number, string> = {
  0: "Dim",
  1: "Lun",
  2: "Mar",
  3: "Mer",
  4: "Jeu",
  5: "Ven",
  6: "Sam",
};

async function sendOneSignalNotification(
  userId: string,
  title: string,
  body: string,
  appId: string,
  apiKey: string,
  sendAfter?: string,
) {
  const payload: Record<string, unknown> = {
    app_id: appId,
    include_aliases: { external_id: [userId] },
    target_channel: "push",
    headings: { en: title, fr: title },
    contents: { en: body, fr: body },
    url: "https://karisma-productivity.vercel.app/",
    chrome_web_icon: "https://karisma-productivity.vercel.app/Logo.png",
  };

  if (sendAfter) {
    payload.send_after = sendAfter;
  }

  try {
    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(`[Push] Erreur OneSignal pour ${userId}:`, body);
    }

    return response.ok;
  } catch (e) {
    console.error(`[Push] Fetch error pour ${userId}:`, e);
    return false;
  }
}

/**
 * Ce CRON s'exécute chaque jour à 6h UTC.
 *
 * Il fait 4 choses :
 * 1. Envoie un rappel MATINAL (7h locale utilisateur)
 * 2. Programme un rappel APRÈS-MIDI (14h) et SOIR (21h) via send_after
 * 3. Programme des rappels à l'heure exacte de chaque habitude + 10 min avant
 * 4. Programme des rappels pour les objectifs temporaires (todos) ayant une heure
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
  const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID!;
  const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY!;

  if (!ONESIGNAL_REST_API_KEY) {
    console.error("[CRON] ONESIGNAL_REST_API_KEY manquante !");
    return NextResponse.json({ error: "Config manquante" }, { status: 500 });
  }

  try {
    const now = new Date();

    // On utilise UTC comme référence neutre pour les filtres de date
    // (les dates start_date/end_date sont stockées en YYYY-MM-DD sans timezone)
    const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const todayDateUTC = `${todayUTC.getUTCFullYear()}-${String(todayUTC.getUTCMonth() + 1).padStart(2, "0")}-${String(todayUTC.getUTCDate()).padStart(2, "0")}`;
    const todayDayNameUTC = DAY_MAP[todayUTC.getUTCDay()];

    console.log(`[CRON] Rappels du ${todayDateUTC} (${todayDayNameUTC}) — UTC`);

    // 1. Récupérer les habitudes actives
    const { data: habits, error: habitsError } = await supabaseAdmin
      .from("habits")
      .select("id, user_id, name, frequency, icon, time, start_date, end_date")
      .lte("start_date", todayDateUTC)
      .gte("end_date", todayDateUTC);

    if (habitsError) throw habitsError;
    if (!habits || habits.length === 0) {
      return NextResponse.json({ message: "Aucune habitude active", sent: 0 });
    }

    // 2. Filtrer les habitudes programmées aujourd'hui
    const todaysHabits = habits.filter((h) =>
      h.frequency.includes(todayDayNameUTC),
    );
    if (todaysHabits.length === 0) {
      return NextResponse.json({
        message: "Aucune habitude aujourd'hui",
        sent: 0,
      });
    }

    // 3. Récupérer les logs déjà complétés aujourd'hui
    const { data: logs } = await supabaseAdmin
      .from("habit_logs")
      .select("habit_id, user_id")
      .eq("completed_date", todayDateUTC);

    const completedSet = new Set(
      (logs || []).map((l) => `${l.user_id}:${l.habit_id}`),
    );

    // 4. Récupérer les fuseaux horaires des utilisateurs concernés
    const userIds = [...new Set(todaysHabits.map(h => h.user_id))];
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, timezone")
      .in("id", userIds);

    const userTimezones: Record<string, string> = {};
    for (const p of profiles || []) {
      userTimezones[p.id] = p.timezone || "Europe/Paris";
    }

    // ============================
    // Construire les données par utilisateur
    // ============================
    const pendingByUser: Record<string, { 
      names: string[]; 
      icons: string[];
      timedHabits: { name: string; icon: string; time: string }[];
    }> = {};

    for (const habit of todaysHabits) {
      const key = `${habit.user_id}:${habit.id}`;
      if (!completedSet.has(key)) {
        if (!pendingByUser[habit.user_id]) {
          pendingByUser[habit.user_id] = { names: [], icons: [], timedHabits: [] };
        }
        pendingByUser[habit.user_id].names.push(habit.name);
        pendingByUser[habit.user_id].icons.push(habit.icon || "🎯");
        if (habit.time) {
          pendingByUser[habit.user_id].timedHabits.push({
            name: habit.name,
            icon: habit.icon || "⏰",
            time: habit.time,
          });
        }
      }
    }

    let generalSent = 0;
    let scheduledSent = 0;

    for (const [userId, pending] of Object.entries(pendingByUser)) {
      const count = pending.names.length;
      const icon = pending.icons[0];
      const habitList = pending.names.slice(0, 3).join(", ");
      const extra = count > 3 ? ` et ${count - 3} autre(s)` : "";

      // Fuseau horaire de l'utilisateur (fallback: Europe/Paris)
      const userTz = userTimezones[userId] || "Europe/Paris";
      const userOffset = getTimezoneOffsetHours(now, userTz);

      // Composants de la date locale de l'utilisateur
      const userLocalDate = new Date(now.toLocaleString("en-US", { timeZone: userTz }));
      const localYear = userLocalDate.getFullYear();
      const localMonth = userLocalDate.getMonth();
      const localDay = userLocalDate.getDate();

      // ============================
      // A) RAPPEL MATINAL (programmé — 7h locale utilisateur)
      // ============================
      const morningTime = new Date(Date.UTC(localYear, localMonth, localDay, 7 - userOffset, 0, 0, 0));

      const morningTitle = `☀️ ${count} objectif${count > 1 ? "s" : ""} aujourd'hui !`;
      const morningBody =
        count === 1
          ? `Bonjour ! N'oublie pas : ${pending.names[0]} 💪`
          : `Bonjour ! Au programme : ${habitList}${extra}. C'est parti ! 💪`;

      if (morningTime > now) {
        // Programmé pour plus tard
        const okMorning = await sendOneSignalNotification(
          userId,
          morningTitle,
          morningBody,
          ONESIGNAL_APP_ID,
          ONESIGNAL_REST_API_KEY,
          morningTime.toISOString(),
        );
        if (okMorning) scheduledSent++;
      } else {
        // 7h locale déjà passée → envoi immédiat
        const okMorning = await sendOneSignalNotification(
          userId,
          morningTitle,
          morningBody,
          ONESIGNAL_APP_ID,
          ONESIGNAL_REST_API_KEY,
        );
        if (okMorning) generalSent++;
      }

      // ============================
      // B) RAPPEL APRÈS-MIDI (programmé — 14h locale utilisateur)
      // ============================
      const afternoonTime = new Date(Date.UTC(localYear, localMonth, localDay, 14 - userOffset, 0, 0, 0));
      
      if (afternoonTime > now) {
        const afternoonTitle = `🔔 Mi-journée : ${count} objectif${count > 1 ? "s" : ""} en cours`;
        const afternoonBody = `N'oublie pas tes objectifs ! ${habitList}${extra}. Tu peux le faire ! 🔥`;

        const okAfternoon = await sendOneSignalNotification(
          userId,
          afternoonTitle,
          afternoonBody,
          ONESIGNAL_APP_ID,
          ONESIGNAL_REST_API_KEY,
          afternoonTime.toISOString(),
        );
        if (okAfternoon) scheduledSent++;
      }

      // ============================
      // C) RAPPEL SOIR (programmé — 21h locale utilisateur)
      // ============================
      const eveningTime = new Date(Date.UTC(localYear, localMonth, localDay, 21 - userOffset, 0, 0, 0));

      if (eveningTime > now) {
        const eveningTitle = `🌙 Bilan du soir`;
        const eveningBody = count === 1
          ? `As-tu complété "${pending.names[0]}" aujourd'hui ? Dernière chance ! ⏳`
          : `As-tu complété tous tes ${count} objectifs ? Dernière chance ! ⏳`;

        const okEvening = await sendOneSignalNotification(
          userId,
          eveningTitle,
          eveningBody,
          ONESIGNAL_APP_ID,
          ONESIGNAL_REST_API_KEY,
          eveningTime.toISOString(),
        );
        if (okEvening) scheduledSent++;
      }

      // ============================
      // D) RAPPELS À L'HEURE EXACTE + 10 MIN AVANT (dans le fuseau de l'utilisateur)
      // ============================
      for (const th of pending.timedHabits) {
        const [hours, minutes] = th.time.split(":").map(Number);

        // Construire l'heure exacte dans le fuseau de l'utilisateur, convertie en UTC
        const exactTimeMs = Date.UTC(localYear, localMonth, localDay, hours - userOffset, minutes, 0, 0);
        const exactTime = new Date(exactTimeMs);

        // Rappel 10 min avant
        const beforeTime = new Date(exactTimeMs - 10 * 60 * 1000);

        if (beforeTime > now) {
          const ok = await sendOneSignalNotification(
            userId,
            `${th.icon} ${th.name} dans 10 min`,
            `Prépare-toi pour "${th.name}" ! C'est bientôt l'heure 🔥`,
            ONESIGNAL_APP_ID,
            ONESIGNAL_REST_API_KEY,
            beforeTime.toISOString(),
          );
          if (ok) scheduledSent++;
        }

        if (exactTime > now) {
          const ok = await sendOneSignalNotification(
            userId,
            `${th.icon} C'est l'heure : ${th.name} !`,
            `C'est maintenant ! Lance-toi sur "${th.name}" et valide ton objectif ✅`,
            ONESIGNAL_APP_ID,
            ONESIGNAL_REST_API_KEY,
            exactTime.toISOString(),
          );
          if (ok) scheduledSent++;
        }
      }
    }

    // ============================
    // E) RAPPELS POUR OBJECTIFS TEMPORAIRES (TODOS) AVEC HEURE
    // ============================
    let todoSent = 0;

    // Récupérer les todos actifs (< 24h) avec une heure définie et non complétés
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const { data: timedTodos } = await supabaseAdmin
      .from("todos")
      .select("id, user_id, title, time, is_completed")
      .gte("created_at", yesterday)
      .eq("is_completed", false)
      .not("time", "is", null);

    if (timedTodos && timedTodos.length > 0) {
      // Regrouper par utilisateur
      const todosByUser: Record<string, { title: string; time: string }[]> = {};
      for (const todo of timedTodos) {
        if (!todosByUser[todo.user_id]) todosByUser[todo.user_id] = [];
        todosByUser[todo.user_id].push({ title: todo.title, time: todo.time });
      }

      // Récupérer les timezones des utilisateurs de todos pas encore connus
      const todoUserIds = Object.keys(todosByUser).filter(id => !userTimezones[id]);
      if (todoUserIds.length > 0) {
        const { data: todoProfiles } = await supabaseAdmin
          .from("profiles")
          .select("id, timezone")
          .in("id", todoUserIds);
        for (const p of todoProfiles || []) {
          userTimezones[p.id] = p.timezone || "Europe/Paris";
        }
      }
      for (const [userId, userTodos] of Object.entries(todosByUser)) {
        const userTz = userTimezones[userId] || "Europe/Paris";
        const userOffset = getTimezoneOffsetHours(now, userTz);
        const userLocalDate = new Date(now.toLocaleString("en-US", { timeZone: userTz }));
        const lYear = userLocalDate.getFullYear();
        const lMonth = userLocalDate.getMonth();
        const lDay = userLocalDate.getDate();

        for (const todo of userTodos) {
          const [hours, minutes] = todo.time.split(":").map(Number);

          const exactTimeMs = Date.UTC(lYear, lMonth, lDay, hours - userOffset, minutes, 0, 0);
          const exactTime = new Date(exactTimeMs);
          const beforeTime = new Date(exactTimeMs - 10 * 60 * 1000);

          if (beforeTime > now) {
            const ok = await sendOneSignalNotification(
              userId,
              `📌 ${todo.title} dans 10 min`,
              `Prépare-toi ! Ta tâche "${todo.title}" approche 🔥`,
              ONESIGNAL_APP_ID,
              ONESIGNAL_REST_API_KEY,
              beforeTime.toISOString(),
            );
            if (ok) todoSent++;
          }

          if (exactTime > now) {
            const ok = await sendOneSignalNotification(
              userId,
              `📌 C'est l'heure : ${todo.title} !`,
              `C'est maintenant ! Lance-toi sur "${todo.title}" ✅`,
              ONESIGNAL_APP_ID,
              ONESIGNAL_REST_API_KEY,
              exactTime.toISOString(),
            );
            if (ok) todoSent++;
          }
        }
      }
    }

    return NextResponse.json({
      message: "Rappels traités",
      generalSent,
      scheduledSent,
      todoSent,
      date: todayDateUTC,
    });
  } catch (error: any) {
    console.error("[CRON] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur interne", details: error.message },
      { status: 500 },
    );
  }
}

/**
 * Retourne le décalage horaire d'un fuseau IANA en heures par rapport à UTC.
 * Ex: "Europe/Paris" → 1 en hiver, 2 en été / "Africa/Douala" → 1 toujours
 */
function getTimezoneOffsetHours(date: Date, timezone: string): number {
  try {
    const utcDate = new Date(date.toLocaleString("en-US", { timeZone: "UTC" }));
    const tzDate = new Date(date.toLocaleString("en-US", { timeZone: timezone }));
    return Math.round((tzDate.getTime() - utcDate.getTime()) / (1000 * 60 * 60));
  } catch {
    // Fallback Europe/Paris si le fuseau est invalide
    const utcDate = new Date(date.toLocaleString("en-US", { timeZone: "UTC" }));
    const parisDate = new Date(date.toLocaleString("en-US", { timeZone: "Europe/Paris" }));
    return Math.round((parisDate.getTime() - utcDate.getTime()) / (1000 * 60 * 60));
  }
}


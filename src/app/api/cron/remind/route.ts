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
 * Ce CRON s'exécute chaque jour à 6h UTC (7h FR).
 *
 * Il fait 3 choses :
 * 1. Envoie un rappel MATINAL (immédiat, 7h FR)
 * 2. Programme un rappel APRÈS-MIDI (14h FR) et SOIR (21h FR) via send_after
 * 3. Programme des rappels à l'heure exacte de chaque habitude + 10 min avant
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
    // Fuseau horaire FR : UTC+1 en hiver (CET), UTC+2 en été (CEST)
    // Pour simplifier, on utilise Europe/Paris
    const now = new Date();
    const todayFR = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Paris" }));
    const todayDayName = DAY_MAP[todayFR.getDay()];
    const todayDate = `${todayFR.getFullYear()}-${String(todayFR.getMonth() + 1).padStart(2, "0")}-${String(todayFR.getDate()).padStart(2, "0")}`;

    console.log(`[CRON] Rappels du ${todayDate} (${todayDayName})`);

    // 1. Récupérer les habitudes actives (pas seulement le mois courant)
    const { data: habits, error: habitsError } = await supabaseAdmin
      .from("habits")
      .select("id, user_id, name, frequency, icon, time, start_date, end_date")
      .lte("start_date", todayDate)
      .gte("end_date", todayDate);

    if (habitsError) throw habitsError;
    if (!habits || habits.length === 0) {
      return NextResponse.json({ message: "Aucune habitude active", sent: 0 });
    }

    // 2. Filtrer les habitudes programmées aujourd'hui
    const todaysHabits = habits.filter((h) =>
      h.frequency.includes(todayDayName),
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
      .eq("completed_date", todayDate);

    const completedSet = new Set(
      (logs || []).map((l) => `${l.user_id}:${l.habit_id}`),
    );

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

    // Calculer les heures FR pour les rappels programmés
    // On calcule le décalage UTC pour Paris aujourd'hui
    const parisOffset = getParisOffsetHours(now);

    for (const [userId, pending] of Object.entries(pendingByUser)) {
      const count = pending.names.length;
      const icon = pending.icons[0];
      const habitList = pending.names.slice(0, 3).join(", ");
      const extra = count > 3 ? ` et ${count - 3} autre(s)` : "";

      // ============================
      // A) RAPPEL MATINAL (immédiat - 7h FR)
      // ============================
      const morningTitle = `☀️ ${count} objectif${count > 1 ? "s" : ""} aujourd'hui !`;
      const morningBody =
        count === 1
          ? `Bonjour ! N'oublie pas : ${pending.names[0]} 💪`
          : `Bonjour ! Au programme : ${habitList}${extra}. C'est parti ! 💪`;

      const okMorning = await sendOneSignalNotification(
        userId,
        morningTitle,
        morningBody,
        ONESIGNAL_APP_ID,
        ONESIGNAL_REST_API_KEY,
      );
      if (okMorning) generalSent++;

      // ============================
      // B) RAPPEL APRÈS-MIDI (programmé - 14h FR)
      // ============================
      const afternoonTime = new Date(now);
      afternoonTime.setUTCHours(14 - parisOffset, 0, 0, 0);
      
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
      // C) RAPPEL SOIR (programmé - 21h FR)
      // ============================
      const eveningTime = new Date(now);
      eveningTime.setUTCHours(21 - parisOffset, 0, 0, 0);

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
      // D) RAPPELS À L'HEURE EXACTE + 10 MIN AVANT
      // ============================
      for (const th of pending.timedHabits) {
        const [hours, minutes] = th.time.split(":").map(Number);

        // Rappel 10 min avant
        const beforeTime = new Date(now);
        beforeTime.setUTCHours(hours - parisOffset, minutes - 10, 0, 0);

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

        // Rappel à l'heure exacte
        const exactTime = new Date(now);
        exactTime.setUTCHours(hours - parisOffset, minutes, 0, 0);

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

    return NextResponse.json({
      message: "Rappels traités",
      generalSent,
      scheduledSent,
      date: todayDate,
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
 * Retourne le décalage horaire de Paris en heures (1 en hiver CET, 2 en été CEST).
 */
function getParisOffsetHours(date: Date): number {
  // On utilise Intl pour trouver le décalage exact de Europe/Paris
  const utcDate = new Date(date.toLocaleString("en-US", { timeZone: "UTC" }));
  const parisDate = new Date(date.toLocaleString("en-US", { timeZone: "Europe/Paris" }));
  return Math.round((parisDate.getTime() - utcDate.getTime()) / (1000 * 60 * 60));
}

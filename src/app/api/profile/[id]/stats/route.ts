import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * GET /api/profile/[id]/stats
 * Retourne les statistiques d'un utilisateur (pour affichage sur son profil public).
 * Utilise la service_role key pour accéder aux données sans restriction RLS.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: userId } = await params;

  if (!userId) {
    return NextResponse.json({ error: "ID manquant" }, { status: 400 });
  }

  // Utiliser le client admin (service_role) OU le client public si pas de service_role
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    // === 1. Récupérer les habitudes et logs du mois ===
    const { data: habits, error: habitsError } = await supabase
      .from("habits")
      .select(
        "id, name, frequency, color, icon, time, category, start_date, end_date, created_at, habit_logs(completed_date)",
      )
      .eq("user_id", userId)
      .eq("target_month", currentMonth)
      .order("created_at", { ascending: true });

    if (habitsError) throw habitsError;

    // === 2. Calculer les streaks ===
    const { data: allLogs } = await supabase
      .from("habit_logs")
      .select("completed_date, habit_id")
      .eq("user_id", userId)
      .order("completed_date", { ascending: false });

    let currentStreak = 0;
    let bestStreak = 0;

    if (allLogs && allLogs.length > 0) {
      // Obtenir les dates uniques triées desc
      const uniqueDates = [
        ...new Set(allLogs.map((l: any) => l.completed_date)),
      ]
        .sort()
        .reverse();

      // Calculer la série actuelle
      const today = new Date();
      // On fixe à 12h00 pour éviter tout problème de DST local ou UTC
      let checkDate = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0, 0));

      if (uniqueDates.length > 0) {
        const [fy, fm, fd] = uniqueDates[0].split("-").map(Number);
        const firstLogDate = new Date(Date.UTC(fy, fm - 1, fd, 12, 0, 0));
        const diffToServer = Math.round((checkDate.getTime() - firstLogDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffToServer < 0) {
          // L'utilisateur est dans un fuseau horaire en avance par rapport au serveur
          checkDate = firstLogDate;
        }
      }

      for (const dateStr of uniqueDates) {
        const [y, m, d] = dateStr.split("-").map(Number);
        const expectedDate = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
        
        const diff = Math.round((checkDate.getTime() - expectedDate.getTime()) / (1000 * 60 * 60 * 24));

        if (diff === 0) {
          currentStreak++;
          checkDate.setUTCDate(checkDate.getUTCDate() - 1);
        } else if (diff === 1) {
          // C'est hier (l'utilisateur n'a encore rien validé aujourd'hui)
          if (currentStreak === 0) {
            currentStreak++;
            checkDate.setUTCDate(checkDate.getUTCDate() - 2); // Recule pour vérifier avant-hier au prochain tour
          } else {
            break;
          }
        } else {
          break; // Trou dans la série
        }
      }

      // Calculer la meilleure série (avec gestion DST robuste)
      let tempStreak = 1;
      const sortedDates = [
        ...new Set(allLogs.map((l: any) => l.completed_date)),
      ].sort();
      for (let i = 1; i < sortedDates.length; i++) {
        const [y1, m1, d1] = sortedDates[i - 1].split("-").map(Number);
        const prev = new Date(Date.UTC(y1, m1 - 1, d1, 12, 0, 0));
        
        const [y2, m2, d2] = sortedDates[i].split("-").map(Number);
        const curr = new Date(Date.UTC(y2, m2 - 1, d2, 12, 0, 0));
        
        const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          tempStreak++;
        } else if (diffDays > 1) {
          bestStreak = Math.max(bestStreak, tempStreak);
          tempStreak = 1;
        }
      }
      bestStreak = Math.max(bestStreak, tempStreak, currentStreak);
    }

    // === 3. Calculer le bilan de complétion (mois courant) ===
    let completed = 0;
    let expected = 0;

    const DAY_NAMES = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

    if (habits) {
      for (const habit of habits) {
        const logs = (habit as any).habit_logs || [];
        const logDates = new Set(logs.map((l: any) => l.completed_date));

        // Pour chaque jour du mois jusqu'à aujourd'hui
        const [year, month] = currentMonth.split("-").map(Number);
        const daysInMonth = new Date(year, month, 0).getDate();
        const todayNum = now.getDate();

        for (let d = 1; d <= Math.min(daysInMonth, todayNum); d++) {
          const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          // JS Date utilise month (0-11)
          const dateObj = new Date(year, month - 1, d);
          const dayName = DAY_NAMES[dateObj.getDay()];

          // Vérification robuste en comparant directement les strings ISO "YYYY-MM-DD"
          const isAfterStart = !habit.start_date || dateStr >= habit.start_date;
          const isBeforeEnd = !habit.end_date || dateStr <= habit.end_date;

          if (habit.frequency && habit.frequency.includes(dayName) && isAfterStart && isBeforeEnd) {
            expected++;
            if (logDates.has(dateStr)) {
              completed++;
            }
          }
        }
      }
    }

    const rate = expected > 0 ? Math.round((completed / expected) * 100) : 0;
    const missed = expected - completed;

    // === 4. Activité récente (7 derniers jours avec activité) ===
    const recentLogs: { date: string; count: number; total: number }[] = [];
    if (allLogs) {
      const dateMap: Record<string, number> = {};
      for (const log of allLogs) {
        dateMap[log.completed_date] = (dateMap[log.completed_date] || 0) + 1;
      }
      const sortedRecent = Object.entries(dateMap)
        .sort(([a], [b]) => b.localeCompare(a))
        .slice(0, 7);
      for (const [date, count] of sortedRecent) {
        recentLogs.push({ date, count, total: habits?.length || 0 });
      }
    }

    return NextResponse.json({
      streak: { current: currentStreak, best: bestStreak },
      completion: { completed, expected, missed, rate },
      recentLogs,
    });
  } catch (error: any) {
    console.error("[Profile Stats] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur interne", details: error.message },
      { status: 500 },
    );
  }
}

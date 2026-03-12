import {
  UIHabit,
  HabitCategory,
  StreakStats,
  DailyActivityLog,
  MonthlyStatsData,
  HabitMonthlyStats,
  SuccessRatePoint,
  OverallCompletionStats,
} from "@/lib/models/habit";
import { supabase } from "@/lib/supabase/client";

export const habitService = {
  // Récupère les habitudes de l'utilisateur connecté + leurs logs
  async fetchHabits(userId?: string): Promise<UIHabit[]> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user && !userId) return [];
    const targetUserId = userId || user?.id;

    const now = new Date();
    const targetMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    // Récupérer les habitudes avec leurs logs (sans filtrer par target_month)
    const { data: habits, error } = await supabase
      .from("habits")
      .select("*, habit_logs(completed_date)")
      .eq("user_id", targetUserId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    if (!habits) return [];

    // Transformer en UIHabit : les logs sont indexés par DATE réelle ("2026-03-08": true)
    return habits.map((habit: any) => {
      const completedLogs: Record<string, boolean> = {};

      if (habit.habit_logs) {
        habit.habit_logs.forEach((log: any) => {
          completedLogs[log.completed_date] = true;
        });
      }

      return {
        id: habit.id,
        name: habit.name,
        category: habit.category as HabitCategory,
        frequency: habit.frequency || [],
        color: habit.color,
        icon: habit.icon,
        time: habit.time,
        target_month: habit.target_month,
        start_date: habit.start_date,
        end_date: habit.end_date,
        created_at: habit.created_at,
        completedLogs,
      };
    });
  },

  // Ajouter une habitude
  async addHabit(
    name: string,
    category: HabitCategory,
    frequency: string[],
    color: string,
    icon: string,
    startDate: string,
    endDate: string,
    time?: string,
  ): Promise<UIHabit> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Non connecté");

    const now = new Date();
    const targetMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const { data, error } = await supabase
      .from("habits")
      .insert({
        user_id: user.id,
        name,
        category,
        frequency,
        color,
        icon,
        time: time || null,
        target_month: targetMonth,
        start_date: startDate,
        end_date: endDate,
      })
      .select()
      .single();

    if (error) throw error;

    // 🔔 Notification de confirmation (fire-and-forget, on ne bloque pas l'UI)
    try {
      const emojiIcon = icon || "🎯";

      // Notification immédiate de confirmation
      fetch("/api/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          title: `${emojiIcon} Nouvel objectif créé !`,
          body: time
            ? `"${name}" ajouté à ton programme. Rappels prévus à ${time} !`
            : `"${name}" ajouté à ton programme. C'est parti ! 💪`,
        }),
      }).catch(() => {});

      // Si la tâche a une heure ET est programmée aujourd'hui, planifier les rappels
      if (time) {
        const dayMap: Record<number, string> = {
          0: "Dim",
          1: "Lun",
          2: "Mar",
          3: "Mer",
          4: "Jeu",
          5: "Ven",
          6: "Sam",
        };
        const todayDay = dayMap[now.getDay()];

        if (frequency.includes(todayDay)) {
          const [h, m] = time.split(":").map(Number);
          const offsets = [
            { min: 60, label: "dans 1 heure" },
            { min: 20, label: "dans 20 minutes" },
            { min: 10, label: "dans 10 minutes" },
          ];

          for (const offset of offsets) {
            const reminderTime = new Date();
            reminderTime.setHours(h, m, 0, 0);
            reminderTime.setMinutes(reminderTime.getMinutes() - offset.min);

            if (reminderTime > now) {
              fetch("/api/push/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  userId: user.id,
                  title: `${emojiIcon} ${name} ${offset.label}`,
                  body: `C'est bientôt l'heure ! Prépare-toi pour "${name}" 🔥`,
                  sendAfter: reminderTime.toISOString(),
                }),
              }).catch(() => {});
            }
          }
        }
      }
    } catch {
      // Les notifications ne doivent jamais bloquer la création
    }

    return {
      id: data.id,
      name: data.name,
      category: data.category as HabitCategory,
      frequency: data.frequency || [],
      color: data.color,
      icon: data.icon,
      time: data.time,
      target_month: data.target_month,
      start_date: data.start_date,
      end_date: data.end_date,
      created_at: data.created_at,
      completedLogs: {},
    };
  },

  // Toggle un log (cocher/décocher une habitude pour un jour)
  async toggleLog(habitId: string, dateStr: string): Promise<boolean> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Non connecté");

    // dateStr est toujours au format YYYY-MM-DD
    const completedDate = dateStr;

    // Vérifier si le log existe déjà
    const { data: existingLog } = await supabase
      .from("habit_logs")
      .select("id")
      .eq("habit_id", habitId)
      .eq("completed_date", completedDate)
      .maybeSingle();

    if (existingLog) {
      // Supprimer le log (décocher)
      const { error } = await supabase
        .from("habit_logs")
        .delete()
        .eq("id", existingLog.id);
      if (error) throw error;
      return false;
    } else {
      // Créer le log (cocher)
      const { error } = await supabase.from("habit_logs").insert({
        habit_id: habitId,
        user_id: user.id,
        completed_date: completedDate,
      });
      if (error) throw error;
      return true;
    }
  },

  // Mettre à jour une habitude
  async updateHabit(
    habitId: string,
    name: string,
    category: HabitCategory,
    frequency: string[],
    color: string,
    icon: string,
    startDate: string,
    endDate: string,
    time?: string,
  ): Promise<UIHabit> {
    const { data, error } = await supabase
      .from("habits")
      .update({
        name,
        category,
        frequency,
        color,
        icon,
        start_date: startDate,
        end_date: endDate,
        time: time || null,
      })
      .eq("id", habitId)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      category: data.category as HabitCategory,
      frequency: data.frequency || [],
      color: data.color,
      icon: data.icon,
      time: data.time,
      target_month: data.target_month,
      start_date: data.start_date,
      end_date: data.end_date,
      created_at: data.created_at,
      completedLogs: {},
    };
  },

  // Supprimer une habitude
  async deleteHabit(habitId: string): Promise<boolean> {
    const { error } = await supabase.from("habits").delete().eq("id", habitId);

    if (error) throw error;
    return true;
  },

  // === FONCTIONS STATISTIQUES ===

  // Helper pour calculer la série (streak) basée sur l'idée que TOUS les objectifs d'un jour sont accomplis
  async _evaluateStreak(targetUserId: string) {
    const DAYS_MAP = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
    const { data: habits } = await supabase.from("habits").select("id, frequency, start_date, end_date").eq("user_id", targetUserId);
    const { data: logs } = await supabase.from("habit_logs").select("habit_id, completed_date").eq("user_id", targetUserId);

    const evaluatedDays = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 365; i++) {
       const d = new Date(today);
       d.setDate(d.getDate() - i);
       const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
       const dayOfWeek = DAYS_MAP[d.getDay()];

       const applicableHabits = (habits || []).filter(h => {
          const inFreq = h.frequency ? h.frequency.includes(dayOfWeek) : true;
          const habitStart = new Date(h.start_date + "T00:00:00").getTime();
          const habitEnd = new Date(h.end_date + "T00:00:00").getTime();
          return inFreq && d.getTime() >= habitStart && d.getTime() <= habitEnd;
       });

       if (applicableHabits.length === 0) {
           evaluatedDays.push({ dateStr, isSuccessful: false, isNotApplicable: true, count: 0, dateObj: d });
           continue;
       }

       const completedCount = applicableHabits.filter(h => 
           (logs || []).some(l => l.habit_id === h.id && l.completed_date === dateStr)
       ).length;

       const isSuccessful = completedCount === applicableHabits.length && applicableHabits.length > 0;
       evaluatedDays.push({ dateStr, isSuccessful, isNotApplicable: false, count: completedCount, dateObj: d });
    }

    let streakCount = 0;
    let streakDates: any[] = [];
    
    for (let i = 0; i < evaluatedDays.length; i++) {
        const day = evaluatedDays[i];
        if (i === 0) { // today
            if (day.isSuccessful) {
                streakCount++;
                streakDates.push(day);
            }
            // If today is unsuccessful or not applicable, we simply continue to yesterday without breaking
            continue;
        }

        if (day.isNotApplicable) {
            continue; // Skip N/A days, they don't break or increment the streak
        }

        if (day.isSuccessful) {
            streakCount++;
            streakDates.push(day);
        } else {
            // Unsuccessful day breaks the streak.
            break; 
        }
    }
    
    streakDates.reverse(); // oldest to newest
    return { currentStreak: streakCount, streakDates };
  },

  // Calculer les streaks depuis les habit_logs
  async getStreak(userId?: string): Promise<StreakStats> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user && !userId) return { current: 0, best: 0 };
    const targetUserId = userId || user?.id;

    const { data: profile } = await supabase
      .from("profiles")
      .select("longest_streak")
      .eq("id", targetUserId)
      .maybeSingle();

    const { currentStreak } = await this._evaluateStreak(targetUserId as string);

    return {
      current: currentStreak,
      best: Math.max(profile?.longest_streak || 0, currentStreak),
    };
  },

  // Agréger UNIQUEMENT les jours composants la série actuelle
  async getRecentLogs(userId?: string): Promise<DailyActivityLog[]> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user && !userId) return [];
    const targetUserId = userId || user?.id;

    const { streakDates } = await this._evaluateStreak(targetUserId as string);

    const COLORS = [
      "#ffda59",
      "#4facff",
      "#9d4edd",
      "#1fb05a",
      "#ff9e00",
      "#ff6b6b",
      "#4facff",
    ];

    const todayStr = new Date().toISOString().split('T')[0];
    const result: DailyActivityLog[] = [];

    for (let i = 0; i < streakDates.length; i++) {
      const day = streakDates[i];
      const isToday = day.dateStr === todayStr;

      const displayDate = isToday
        ? "Auj."
        : day.dateObj.toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "2-digit",
          });

      result.push({
        date: displayDate,
        count: day.count,
        color: isToday ? "var(--primary)" : COLORS[i % COLORS.length],
        isToday,
      });
    }

    return result;
  },

  // Stats mensuelles
  async getMonthlyStats(
    targetDate: Date = new Date(),
    userId?: string,
  ): Promise<MonthlyStatsData> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user && !userId) return { allCompletions: [], habits: [] };
    const targetUserId = userId || user?.id;

    const year = targetDate.getFullYear();
    const month = targetDate.getMonth(); // 0-indexed
    const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
    const endDate = `${year}-${String(month + 1).padStart(2, "0")}-${new Date(year, month + 1, 0).getDate()}`;

    const targetMonth = `${year}-${String(month + 1).padStart(2, "0")}`;

    // Récupérer toutes les habitudes de l'utilisateur pour le mois en cours
    const { data: habits } = await supabase
      .from("habits")
      .select("id, name, frequency, start_date, end_date")
      .eq("user_id", targetUserId)
      .eq("target_month", targetMonth);

    if (!habits || habits.length === 0)
      return { allCompletions: [], habits: [] };

    // Récupérer tous les logs du mois
    const { data: logs } = await supabase
      .from("habit_logs")
      .select("habit_id, completed_date")
      .eq("user_id", targetUserId)
      .gte("completed_date", startDate)
      .lte("completed_date", endDate);

    if (!logs) return { allCompletions: [], habits: [] };

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const DAYS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

    // Construire les stats par habitude
    const habitStats: HabitMonthlyStats[] = habits.map((habit) => {
      const completions = logs
        .filter((l) => l.habit_id === habit.id)
        .map((l) => new Date(l.completed_date + "T00:00:00").getDate());
      
      const failed: number[] = [];
      const notApplicable: number[] = [];
      const habitStart = new Date(habit.start_date + "T00:00:00").getTime();
      const habitEnd = new Date(habit.end_date + "T00:00:00").getTime();

      for (let day = 1; day <= daysInMonth; day++) {
        const currentDayDate = new Date(year, month, day);
        const dayOfWeekStr = DAYS[currentDayDate.getDay()];
        
        const inFrequency = habit.frequency ? habit.frequency.includes(dayOfWeekStr) : true;
        const isApplicableDate = currentDayDate.getTime() >= habitStart && currentDayDate.getTime() <= habitEnd;

        if (!(inFrequency && isApplicableDate)) {
          notApplicable.push(day);
        } else if (!completions.includes(day)) {
          failed.push(day);
        }
      }

      return {
        id: habit.id,
        name: habit.name,
        completions,
        failed,
        notApplicable,
      };
    });

    // "Tous les objectifs" = jours où TOUTES les habitudes APPLICABLES ont été faites
    const allCompletions: number[] = [];
    const allFailed: number[] = [];
    const allNotApplicable: number[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const currentDayDate = new Date(year, month, day);
      const dayOfWeekStr = DAYS[currentDayDate.getDay()];

      // Filtrer les habitudes qui s'appliquent à ce jour précis
      const applicableHabits = habits.filter((habit) => {
        const inFrequency = habit.frequency ? habit.frequency.includes(dayOfWeekStr) : true;
        const habitStart = new Date(habit.start_date + "T00:00:00").getTime();
        const habitEnd = new Date(habit.end_date + "T00:00:00").getTime();
        return inFrequency && currentDayDate.getTime() >= habitStart && currentDayDate.getTime() <= habitEnd;
      });

      if (applicableHabits.length === 0) {
        allNotApplicable.push(day);
        continue;
      }

      const allDone = applicableHabits.every((habit) =>
        logs.some(
          (l) =>
            l.habit_id === habit.id &&
            new Date(l.completed_date + "T00:00:00").getDate() === day,
        ),
      );

      if (allDone) {
        allCompletions.push(day);
      } else {
        allFailed.push(day);
      }
    }

    return {
      allCompletions,
      habits: [
        {
          id: "all",
          name: "Tous les objectifs (Général)",
          completions: allCompletions,
          failed: allFailed,
          notApplicable: allNotApplicable,
        },
        ...habitStats,
      ],
    };
  },

  // Taux de réussite avec filtre jour/semaine/mois
  async getSuccessRate(
    filter: "day" | "week" | "month",
    userId?: string,
  ): Promise<SuccessRatePoint[]> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user && !userId) return [];
    const targetUserId = userId || user?.id;

    const DAYS_MAP = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let startDate: Date;
    if (filter === "day") {
      startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 6);
    } else if (filter === "week") {
      startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 27); // 4 semaines
    } else {
      startDate = new Date(today);
      startDate.setMonth(startDate.getMonth() - 5); // 6 mois
      startDate.setDate(1);
    }

    const startStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, "0")}-${String(startDate.getDate()).padStart(2, "0")}`;
    const endStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    // Récupérer toutes les habitudes (tous les mois)
    const { data: habits } = await supabase
      .from("habits")
      .select("id, name, frequency, start_date, end_date")
      .eq("user_id", targetUserId);

    if (!habits || habits.length === 0) return [];

    // Récupérer tous les logs de la plage
    const { data: logs } = await supabase
      .from("habit_logs")
      .select("habit_id, completed_date")
      .eq("user_id", targetUserId)
      .gte("completed_date", startStr)
      .lte("completed_date", endStr);

    if (!logs) return [];

    if (filter === "day") {
      const result: SuccessRatePoint[] = [];
      const dayLabels = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        const dayOfWeek = DAYS_MAP[d.getDay()];

        const applicable = habits.filter((h) => {
          const inFreq = h.frequency ? h.frequency.includes(dayOfWeek) : true;
          const habitStart = new Date(h.start_date + "T00:00:00");
          const habitEnd = new Date(h.end_date + "T00:00:00");
          return (
            inFreq &&
            d.getTime() >= habitStart.getTime() &&
            d.getTime() <= habitEnd.getTime()
          );
        });

        const total = applicable.length;
        const completed = applicable.filter((h) =>
          logs.some((l) => l.habit_id === h.id && l.completed_date === dateStr),
        ).length;

        const isToday = i === 0;
        result.push({
          label: isToday ? "Auj." : dayLabels[d.getDay()],
          rate: total === 0 ? 0 : Math.round((completed / total) * 100),
          completed,
          total,
        });
      }
      return result;
    }

    if (filter === "week") {
      const result: SuccessRatePoint[] = [];
      for (let w = 3; w >= 0; w--) {
        const weekEnd = new Date(today);
        weekEnd.setDate(weekEnd.getDate() - w * 7);
        const weekStart = new Date(weekEnd);
        weekStart.setDate(weekStart.getDate() - 6);

        let totalSum = 0;
        let completedSum = 0;

        for (let di = 0; di < 7; di++) {
          const d = new Date(weekStart);
          d.setDate(d.getDate() + di);
          d.setHours(0, 0, 0, 0);
          const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
          const dayOfWeek = DAYS_MAP[d.getDay()];

          const applicable = habits.filter((h) => {
            const inFreq = h.frequency ? h.frequency.includes(dayOfWeek) : true;
            const habitStart = new Date(h.start_date + "T00:00:00");
            const habitEnd = new Date(h.end_date + "T00:00:00");
            return (
              inFreq &&
              d.getTime() >= habitStart.getTime() &&
              d.getTime() <= habitEnd.getTime()
            );
          });

          totalSum += applicable.length;
          completedSum += applicable.filter((h) =>
            logs.some(
              (l) => l.habit_id === h.id && l.completed_date === dateStr,
            ),
          ).length;
        }

        const label = w === 0 ? "Cette sem." : `Sem. -${w}`;
        result.push({
          label,
          rate:
            totalSum === 0 ? 0 : Math.round((completedSum / totalSum) * 100),
          completed: completedSum,
          total: totalSum,
        });
      }
      return result;
    }

    // filter === "month"
    const result: SuccessRatePoint[] = [];
    const monthLabels = [
      "Jan",
      "Fév",
      "Mar",
      "Avr",
      "Mai",
      "Juin",
      "Juil",
      "Aoû",
      "Sep",
      "Oct",
      "Nov",
      "Déc",
    ];
    for (let m = 5; m >= 0; m--) {
      const target = new Date(today.getFullYear(), today.getMonth() - m, 1);
      const daysInMonth = new Date(
        target.getFullYear(),
        target.getMonth() + 1,
        0,
      ).getDate();
      const lastDay = m === 0 ? today.getDate() : daysInMonth;

      let totalSum = 0;
      let completedSum = 0;

      for (let day = 1; day <= lastDay; day++) {
        const d = new Date(target.getFullYear(), target.getMonth(), day);
        d.setHours(0, 0, 0, 0);
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        const dayOfWeek = DAYS_MAP[d.getDay()];

        const applicable = habits.filter((h) => {
          const inFreq = h.frequency ? h.frequency.includes(dayOfWeek) : true;
          const habitStart = new Date(h.start_date + "T00:00:00");
          const habitEnd = new Date(h.end_date + "T00:00:00");
          return (
            inFreq &&
            d.getTime() >= habitStart.getTime() &&
            d.getTime() <= habitEnd.getTime()
          );
        });

        totalSum += applicable.length;
        completedSum += applicable.filter((h) =>
          logs.some((l) => l.habit_id === h.id && l.completed_date === dateStr),
        ).length;
      }

      result.push({
        label: monthLabels[target.getMonth()],
        rate: totalSum === 0 ? 0 : Math.round((completedSum / totalSum) * 100),
        completed: completedSum,
        total: totalSum,
      });
    }
    return result;
  },

  // Statistiques globales de complétion avec filtre (semaine, mois, ou depuis le début)
  async getOverallCompletionStats(
    filter: "week" | "month" | "all" = "month",
    userId?: string,
  ): Promise<OverallCompletionStats> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user && !userId)
      return { completed: 0, expected: 0, missed: 0, rate: 0 };
    const targetUserId = userId || user?.id;

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    const DAYS_MAP: Record<number, string> = {
      0: "Dim",
      1: "Lun",
      2: "Mar",
      3: "Mer",
      4: "Jeu",
      5: "Ven",
      6: "Sam",
    };

    // === Déterminer la plage de dates selon le filtre ===
    let rangeStart: string;

    if (filter === "week") {
      // Lundi de la semaine courante
      const monday = new Date(now);
      const dayOfWeek = monday.getDay();
      const offsetToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      monday.setDate(monday.getDate() - offsetToMonday);
      rangeStart = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, "0")}-${String(monday.getDate()).padStart(2, "0")}`;
    } else if (filter === "month") {
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      rangeStart = `${currentMonth}-01`;
    } else {
      // "all" — depuis le tout début (on prend 2020-01-01 comme date minimale)
      rangeStart = "2020-01-01";
    }

    // === Récupérer les habitudes ===
    let habitsQuery = supabase
      .from("habits")
      .select("id, frequency, start_date, end_date, target_month")
      .eq("user_id", targetUserId);

    if (filter === "month") {
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      habitsQuery = habitsQuery.eq("target_month", currentMonth);
    } else if (filter === "week") {
      // Pour la semaine, on prend les habitudes du mois courant
      // (une semaine ne dépasse pas significativement le mois)
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      habitsQuery = habitsQuery.eq("target_month", currentMonth);
    }
    // filter === "all" → pas de filtre sur target_month

    const { data: habits } = await habitsQuery;
    if (!habits || habits.length === 0)
      return { completed: 0, expected: 0, missed: 0, rate: 0 };

    // === Récupérer les logs dans la plage ===
    const { data: logs } = await supabase
      .from("habit_logs")
      .select("habit_id, completed_date")
      .eq("user_id", targetUserId)
      .gte("completed_date", rangeStart)
      .lte("completed_date", todayStr);

    const completed = logs?.length || 0;

    // === Calculer le nombre d'objectifs attendus ===
    let expected = 0;
    const rangeStartDate = new Date(rangeStart + "T00:00:00");

    for (const habit of habits) {
      const freq: string[] = habit.frequency || [];
      if (freq.length === 0) continue;

      // Début effectif = le plus tard entre (début de la plage globale, date de début de l'habitude)
      const habitStart = new Date(habit.start_date + "T00:00:00");
      const startDate =
        habitStart > rangeStartDate ? habitStart : new Date(rangeStartDate);

      // Fin effective = le plus tôt entre (aujourd'hui, date de fin de l'habitude)
      let endDateLimit = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
      );
      const habitEnd = new Date(habit.end_date + "T00:00:00");
      let endDate = habitEnd < endDateLimit ? habitEnd : new Date(endDateLimit);

      if (startDate > endDate) continue;

      for (
        let d = new Date(startDate);
        d <= endDate;
        d.setDate(d.getDate() + 1)
      ) {
        const dayName = DAYS_MAP[d.getDay()];
        if (freq.includes(dayName)) {
          expected++;
        }
      }
    }

    const missed = Math.max(0, expected - completed);
    const rate = expected > 0 ? Math.round((completed / expected) * 100) : 0;

    return { completed, expected, missed, rate: Math.min(rate, 100) };
  },
};

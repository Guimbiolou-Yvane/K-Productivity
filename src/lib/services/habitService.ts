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
import { offlineCache } from "@/lib/offlineCache";

export const habitService = {
  // Récupère les habitudes de l'utilisateur connecté + leurs logs
  async fetchHabits(userId?: string): Promise<UIHabit[]> {
    const cacheKey = `habits_${userId || "me"}`;
    return offlineCache.withFallback(cacheKey, async () => {
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
          linked_goal_id: habit.linked_goal_id,
          created_at: habit.created_at,
          completedLogs,
        };
      });
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
    linked_goal_id?: string
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
        linked_goal_id: linked_goal_id || null,
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

          // Rappels avant l'heure
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

          // Rappel à l'heure exacte
          const exactTime = new Date();
          exactTime.setHours(h, m, 0, 0);

          if (exactTime > now) {
            fetch("/api/push/send", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: user.id,
                title: `${emojiIcon} C'est l'heure : ${name} !`,
                body: `C'est maintenant ! Lance-toi sur "${name}" et valide ton objectif ✅`,
                sendAfter: exactTime.toISOString(),
              }),
            }).catch(() => {});
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
      linked_goal_id: data.linked_goal_id,
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
    linked_goal_id?: string
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
        linked_goal_id: linked_goal_id || null,
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
      linked_goal_id: data.linked_goal_id,
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
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    for (let i = 0; i < 365; i++) {
       const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
       const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
       const dayOfWeek = DAYS_MAP[d.getDay()];

       // Utilise la comparaison ISO string pour éviter les problèmes de DST
       const applicableHabits = (habits || []).filter(h => {
          const inFreq = h.frequency ? h.frequency.includes(dayOfWeek) : true;
          const isAfterStart = !h.start_date || dateStr >= h.start_date;
          const isBeforeEnd = !h.end_date || dateStr <= h.end_date;
          return inFreq && isAfterStart && isBeforeEnd;
       });

       if (applicableHabits.length === 0) {
           evaluatedDays.push({ dateStr, isSuccessful: false, isNotApplicable: true, count: 0, dateObj: d });
           continue;
       }

       const completedCount = applicableHabits.filter(h => 
           (logs || []).some(l => l.habit_id === h.id && l.completed_date === dateStr)
       ).length;

       const isSuccessful = completedCount === applicableHabits.length;
       // Aujourd'hui en cours : si pas encore tout fait, ce n'est pas un échec
       const isToday = dateStr === todayStr;
       const isTodayIncomplete = isToday && !isSuccessful && completedCount > 0;
       evaluatedDays.push({ dateStr, isSuccessful, isNotApplicable: false, isTodayIncomplete, count: completedCount, dateObj: d });
    }

    let streakCount = 0;
    let streakDates: any[] = [];
    
    for (let i = 0; i < evaluatedDays.length; i++) {
        const day = evaluatedDays[i];

        if (day.isNotApplicable) {
            // Les jours non applicables ne brisent pas ni n'incrémentent le streak
            // Sauf si c'est le premier jour et qu'il est non applicable = on commence à hier
            continue;
        }

        if (i === 0 && !day.isSuccessful) {
            // Aujourd'hui pas encore terminé → on commence le comptage depuis hier
            continue;
        }

        if (day.isSuccessful) {
            streakCount++;
            streakDates.push(day);
        } else {
            // Jour non complété → le streak s'arrête
            break; 
        }
    }
    
    streakDates.reverse(); // du plus ancien au plus récent
    return { currentStreak: streakCount, streakDates };
  },

  // Calculer les streaks depuis les habit_logs
  async getStreak(userId?: string): Promise<StreakStats> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user && !userId) return { current: 0, best: 0 };
    const targetUserId = userId || user?.id;

    const cacheKey = `streak_${targetUserId}`;
    return offlineCache.withFallback(cacheKey, async () => {
      const { currentStreak } = await this._evaluateStreak(targetUserId as string);

      const { data: allLogs } = await supabase
        .from("habit_logs")
        .select("completed_date")
        .eq("user_id", targetUserId)
        .order("completed_date", { ascending: true });

      let bestStreak = currentStreak;

      if (allLogs && allLogs.length > 0) {
        const uniqueDates = [...new Set(allLogs.map((l: any) => l.completed_date))].sort();
        let tempStreak = 1;

        for (let i = 1; i < uniqueDates.length; i++) {
          const [y1, m1, d1] = uniqueDates[i - 1].split("-").map(Number);
          const [y2, m2, d2] = uniqueDates[i].split("-").map(Number);
          const prev = new Date(Date.UTC(y1, m1 - 1, d1, 12, 0, 0));
          const curr = new Date(Date.UTC(y2, m2 - 1, d2, 12, 0, 0));
          const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));

          if (diffDays === 1) {
            tempStreak++;
          } else if (diffDays > 1) {
            bestStreak = Math.max(bestStreak, tempStreak);
            tempStreak = 1;
          }
        }
        bestStreak = Math.max(bestStreak, tempStreak);
      }

      return { current: currentStreak, best: bestStreak };
    }, 60 * 60 * 1000); // 1h de cache pour les streaks (changent fréquemment)
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
    const month = targetDate.getMonth();
    const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
    const endDate = `${year}-${String(month + 1).padStart(2, "0")}-${new Date(year, month + 1, 0).getDate()}`;
    const targetMonth = `${year}-${String(month + 1).padStart(2, "0")}`;

    const cacheKey = `monthly_stats_${targetUserId}_${targetMonth}`;
    return offlineCache.withFallback(cacheKey, async () => {
    // Une habitude est "active" sur le mois si son start_date <= fin du mois ET end_date >= début du mois
    const { data: habits } = await supabase
      .from("habits")
      .select("id, name, frequency, start_date, end_date")
      .eq("user_id", targetUserId)
      .lte("start_date", endDate)
      .gte("end_date", startDate);

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

      for (let day = 1; day <= daysInMonth; day++) {
        const currentDayDate = new Date(year, month, day);
        const dayOfWeekStr = DAYS[currentDayDate.getDay()];
        const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        
        const inFrequency = habit.frequency ? habit.frequency.includes(dayOfWeekStr) : true;
        const isAfterStart = !habit.start_date || dateStr >= habit.start_date;
        const isBeforeEnd = !habit.end_date || dateStr <= habit.end_date;
        const isApplicableDate = isAfterStart && isBeforeEnd;

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

      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

      // Filtrer les habitudes qui s'appliquent à ce jour précis
      const applicableHabits = habits.filter((habit) => {
        const inFreq = habit.frequency ? habit.frequency.includes(dayOfWeekStr) : true;
        const isAfterStart = !habit.start_date || dateStr >= habit.start_date;
        const isBeforeEnd = !habit.end_date || dateStr <= habit.end_date;
        return inFreq && isAfterStart && isBeforeEnd;
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
    }); // offlineCache.withFallback
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
    const todayDateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    const cacheKey = `success_rate_${targetUserId}_${filter}_${todayDateStr}`;
    return offlineCache.withFallback(cacheKey, async () => {

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
          const isAfterStart = !h.start_date || dateStr >= h.start_date;
          const isBeforeEnd = !h.end_date || dateStr <= h.end_date;
          return inFreq && isAfterStart && isBeforeEnd;
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
            const isAfterStart = !h.start_date || dateStr >= h.start_date;
            const isBeforeEnd = !h.end_date || dateStr <= h.end_date;
            return inFreq && isAfterStart && isBeforeEnd;
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
            const isAfterStart = !h.start_date || dateStr >= h.start_date;
            const isBeforeEnd = !h.end_date || dateStr <= h.end_date;
            return inFreq && isAfterStart && isBeforeEnd;
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
    }); // offlineCache.withFallback
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

    const cacheKey = `completion_stats_${targetUserId}_${filter}_${todayStr}`;
    return offlineCache.withFallback(cacheKey, async () => {
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
        // "all" — depuis le tout début
        rangeStart = "2020-01-01";
      }

      // Récupérer les habitudes actives sur la plage
      const { data: habits } = await supabase
        .from("habits")
        .select("id, frequency, start_date, end_date")
        .eq("user_id", targetUserId)
        .lte("start_date", todayStr)
        .gte("end_date", rangeStart);

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

      for (const habit of habits) {
        const freq: string[] = habit.frequency || [];
        if (freq.length === 0) continue;

        const startDateStr = habit.start_date && habit.start_date > rangeStart ? habit.start_date : rangeStart;
        const endDateStr = habit.end_date && habit.end_date < todayStr ? habit.end_date : todayStr;

        if (startDateStr > endDateStr) continue;

        const [sy, sm, sd] = startDateStr.split("-").map(Number);
        const [ey, em, ed] = endDateStr.split("-").map(Number);
        const startDateObj = new Date(sy, sm - 1, sd);
        const endDateObj = new Date(ey, em - 1, ed);

        for (let d = new Date(startDateObj); d <= endDateObj; d.setDate(d.getDate() + 1)) {
          const dayOfWeekStr = DAYS_MAP[d.getDay()];
          if (freq.includes(dayOfWeekStr)) {
            expected++;
          }
        }
      }

      const missed = Math.max(0, expected - completed);
      const rate = expected > 0 ? Math.round((completed / expected) * 100) : 0;

      return { completed, expected, missed, rate: Math.min(rate, 100) };
    }); // offlineCache.withFallback
  },

  // Réinitialiser tous les objectifs personnels (supprime les logs puis les habitudes)
  async resetAllHabits(): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Non connecté");

    // 1. Supprimer tous les logs d'habitudes de l'utilisateur
    const { error: logsError } = await supabase
      .from("habit_logs")
      .delete()
      .eq("user_id", user.id);
    if (logsError) throw logsError;

    // 2. Supprimer toutes les habitudes de l'utilisateur
    const { error: habitsError } = await supabase
      .from("habits")
      .delete()
      .eq("user_id", user.id);
    if (habitsError) throw habitsError;
  },
};

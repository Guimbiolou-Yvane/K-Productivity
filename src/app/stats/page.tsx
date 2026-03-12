"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { habitService } from "@/lib/services/habitService";
import {
  StreakStats,
  DailyActivityLog,
  HabitMonthlyStats,
  SuccessRatePoint,
  OverallCompletionStats,
} from "@/lib/models/habit";

import StatsSkeleton from "@/components/stats/StatsSkeleton";
import StreakSection from "@/components/stats/StreakSection";
import CompletionSummary, { type CompletionFilter } from "@/components/stats/CompletionSummary";
import SuccessRateSection from "@/components/stats/SuccessRateSection";
import MonthlyOverview from "@/components/stats/MonthlyOverview";

export default function StatsPage() {
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Données
  const [streak, setStreak] = useState<StreakStats>({ current: 0, best: 0 });
  const [recentLogs, setRecentLogs] = useState<DailyActivityLog[]>([]);
  const [habitStats, setHabitStats] = useState<HabitMonthlyStats[]>([]);
  const [successData, setSuccessData] = useState<SuccessRatePoint[]>([]);
  const [completionStats, setCompletionStats] = useState<OverallCompletionStats>({ completed: 0, expected: 0, missed: 0, rate: 0 });

  // Filtres
  const [targetMonth, setTargetMonth] = useState(new Date());
  const [successFilter, setSuccessFilter] = useState<"day" | "week" | "month">("week");
  const [completionFilter, setCompletionFilter] = useState<CompletionFilter>("month");

  // === CHARGEMENT INITIAL ===

  useEffect(() => {
    setMounted(true);
    const loadStats = async () => {
      try {
        const [streakData, logsData, monthlyData, rateData, completionData] = await Promise.all([
          habitService.getStreak(),
          habitService.getRecentLogs(),
          habitService.getMonthlyStats(targetMonth),
          habitService.getSuccessRate(successFilter),
          habitService.getOverallCompletionStats(completionFilter),
        ]);
        setStreak(streakData);
        setRecentLogs(logsData);
        setHabitStats(monthlyData.habits);
        setSuccessData(rateData);
        setCompletionStats(completionData);
      } catch (error) {
        console.error("Erreur chargement stats:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadStats();
  }, []);

  // === RECHARGEMENT QUAND LE MOIS CHANGE ===

  useEffect(() => {
    if (!mounted) return;
    const loadMonthly = async () => {
      try {
        const monthlyData = await habitService.getMonthlyStats(targetMonth);
        setHabitStats(monthlyData.habits);
      } catch (error) {
        console.error("Erreur chargement stats mensuelles:", error);
      }
    };
    loadMonthly();
  }, [targetMonth, mounted]);

  // === RECHARGEMENT QUAND LE FILTRE TAUX DE RÉUSSITE CHANGE ===

  useEffect(() => {
    if (!mounted) return;
    const loadRate = async () => {
      try {
        const rateData = await habitService.getSuccessRate(successFilter);
        setSuccessData(rateData);
      } catch (error) {
        console.error("Erreur chargement taux:", error);
      }
    };
    loadRate();
  }, [successFilter, mounted]);

  // === RECHARGEMENT QUAND LE FILTRE BILAN CHANGE ===

  useEffect(() => {
    if (!mounted) return;
    const loadCompletion = async () => {
      try {
        const data = await habitService.getOverallCompletionStats(completionFilter);
        setCompletionStats(data);
      } catch (error) {
        console.error("Erreur chargement bilan:", error);
      }
    };
    loadCompletion();
  }, [completionFilter, mounted]);

  // === RENDU ===

  if (!mounted || isLoading) {
    return <StatsSkeleton />;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="min-h-screen p-4 md:p-8 flex flex-col items-center max-w-6xl mx-auto font-sans pb-32 overflow-x-hidden"
    >
      {/* HEADER */}
      <div className="w-full flex flex-col justify-start mb-8 border-b-8 border-foreground pb-4">
        <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter shadow-sm mb-2">Statistiques</h1>
        <p className="font-bold text-foreground/60 text-sm sm:text-base leading-snug">
          Garde un œil sur ta régularité et analyse tes performances globales pour repousser tes limites.
        </p>
      </div>

      <div className="w-full flex flex-col gap-8">
        <StreakSection
          currentStreak={streak.current}
          bestStreak={streak.best}
          recentLogs={recentLogs}
        />

        <CompletionSummary
          stats={completionStats}
          filter={completionFilter}
          onFilterChange={setCompletionFilter}
        />

        <SuccessRateSection
          filter={successFilter}
          onFilterChange={setSuccessFilter}
          data={successData}
        />

        <MonthlyOverview
          habitStats={habitStats}
          targetMonth={targetMonth}
          onMonthChange={setTargetMonth}
        />
      </div>
    </motion.div>
  );
}

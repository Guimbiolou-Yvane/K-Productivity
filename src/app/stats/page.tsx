"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { BarChart2 } from "lucide-react";
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
    <>
      {/* HEADER sticky hors du motion.div pour éviter le conflit overflow */}
      <div className="sticky top-0 z-30 bg-surface border-b-4 border-foreground w-full">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 flex items-center justify-center bg-primary border-[3px] border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0">
              <BarChart2 size={18} strokeWidth={3} />
            </div>
            <div>
              <h1 className="text-xl font-black uppercase tracking-tight leading-none">Statistiques</h1>
              <p className="font-bold text-foreground/50 text-xs mt-0.5 leading-snug hidden sm:block">
                Régularité, performances, et progression globale.
              </p>
            </div>
          </div>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="min-h-screen flex flex-col items-center max-w-6xl mx-auto font-sans pb-32 w-full"
      >
      <div className="w-full px-4 md:px-8 py-6 flex flex-col gap-8">
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
    </>
  );
}

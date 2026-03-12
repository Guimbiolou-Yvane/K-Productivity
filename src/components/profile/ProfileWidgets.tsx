"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { LayoutDashboard, Check, X, Eye, EyeOff } from "lucide-react";
import { habitService } from "@/lib/services/habitService";
import { supabase } from "@/lib/supabase/client";
import {
  StreakStats,
  DailyActivityLog,
  SuccessRatePoint,
  OverallCompletionStats,
  HabitMonthlyStats,
} from "@/lib/models/habit";

import HabitTracker from "@/components/HabitTracker";
import TodoList from "@/components/TodoList";
import StreakSection from "@/components/stats/StreakSection";
import CompletionSummary, {
  type CompletionFilter,
} from "@/components/stats/CompletionSummary";
import SuccessRateSection from "@/components/stats/SuccessRateSection";
import MonthlyOverview from "@/components/stats/MonthlyOverview";

// === CONFIGURATION DES WIDGETS ===

export interface WidgetConfig {
  id: string;
  label: string;
  icon: string;
  category: "home" | "stats";
}

export const AVAILABLE_WIDGETS: WidgetConfig[] = [
  {
    id: "habits",
    label: "Objectifs (Habitudes)",
    icon: "🎯",
    category: "home",
  },
  { id: "todos", label: "Tâches du jour", icon: "📝", category: "home" },
  { id: "streak", label: "Série actuelle", icon: "🔥", category: "stats" },
  {
    id: "completion",
    label: "Bilan de complétion",
    icon: "📊",
    category: "stats",
  },
  {
    id: "successRate",
    label: "Taux de réussite",
    icon: "📈",
    category: "stats",
  },
  {
    id: "monthOverview",
    label: "Calendrier mensuel",
    icon: "📅",
    category: "stats",
  },
];

export const DEFAULT_WIDGETS = ["streak", "completion"];

// === Sauvegarder les widgets dans Supabase ===

async function saveWidgetsToDb(widgets: string[]): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("profiles")
    .update({ profile_widgets: widgets })
    .eq("id", user.id);
}

// === Composant d'édition des widgets ===

interface WidgetEditorProps {
  selected: string[];
  onSave: (selected: string[]) => void;
  onClose: () => void;
}

function WidgetEditor({ selected, onSave, onClose }: WidgetEditorProps) {
  const [localSelected, setLocalSelected] = useState<string[]>(selected);

  const toggle = (id: string) => {
    setLocalSelected((prev) =>
      prev.includes(id) ? prev.filter((w) => w !== id) : [...prev, id],
    );
  };

  const homeWidgets = AVAILABLE_WIDGETS.filter((w) => w.category === "home");
  const statsWidgets = AVAILABLE_WIDGETS.filter((w) => w.category === "stats");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 30 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="neo-card w-full max-w-lg bg-background flex flex-col gap-5 max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b-4 border-foreground pb-3">
          <div className="flex items-center gap-2">
            <LayoutDashboard size={22} strokeWidth={3} />
            <h2 className="text-xl font-black uppercase tracking-tighter">
              Personnaliser
            </h2>
          </div>
          <button onClick={onClose} className="neo-btn !p-2 !bg-surface">
            <X size={18} strokeWidth={4} />
          </button>
        </div>

        <p className="text-sm font-bold text-foreground/60">
          Choisis les sections à afficher sur ton profil.
        </p>

        {/* CATÉGORIE HOME */}
        <div>
          <h3 className="text-xs font-black uppercase tracking-widest text-foreground/50 mb-3 pl-1">
            🏠 Accueil
          </h3>
          <div className="flex flex-col gap-2">
            {homeWidgets.map((w) => {
              const isActive = localSelected.includes(w.id);
              return (
                <motion.button
                  key={w.id}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => toggle(w.id)}
                  className={`neo-card !p-3 flex items-center justify-between cursor-pointer transition-colors ${isActive ? "!bg-green-200 !shadow-none translate-x-[2px] translate-y-[2px]" : "!bg-surface hover:!bg-gray-100"}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{w.icon}</span>
                    <span className="font-black text-sm">{w.label}</span>
                  </div>
                  {isActive ? (
                    <Eye size={18} strokeWidth={3} className="text-green-700" />
                  ) : (
                    <EyeOff
                      size={18}
                      strokeWidth={3}
                      className="text-foreground/30"
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* CATÉGORIE STATS */}
        <div>
          <h3 className="text-xs font-black uppercase tracking-widest text-foreground/50 mb-3 pl-1">
            📊 Statistiques
          </h3>
          <div className="flex flex-col gap-2">
            {statsWidgets.map((w) => {
              const isActive = localSelected.includes(w.id);
              return (
                <motion.button
                  key={w.id}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => toggle(w.id)}
                  className={`neo-card !p-3 flex items-center justify-between cursor-pointer transition-colors ${isActive ? "!bg-green-200 !shadow-none translate-x-[2px] translate-y-[2px]" : "!bg-surface hover:!bg-gray-100"}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{w.icon}</span>
                    <span className="font-black text-sm">{w.label}</span>
                  </div>
                  {isActive ? (
                    <Eye size={18} strokeWidth={3} className="text-green-700" />
                  ) : (
                    <EyeOff
                      size={18}
                      strokeWidth={3}
                      className="text-foreground/30"
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => onSave(localSelected)}
          className="neo-btn !bg-[#1fb05a] w-full flex items-center justify-center gap-3 text-base"
        >
          <Check size={20} strokeWidth={3} />
          Sauvegarder ({localSelected.length} sélectionné
          {localSelected.length > 1 ? "s" : ""})
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

// === Composant principal ===

interface ProfileWidgetsProps {
  widgetIds: string[];
  isOwn: boolean;
  profileUserId: string; // ID de l'utilisateur dont on affiche le profil
  onWidgetsChange?: (widgets: string[]) => void;
}

export default function ProfileWidgets({
  widgetIds,
  isOwn,
  profileUserId,
  onWidgetsChange,
}: ProfileWidgetsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedWidgets, setSelectedWidgets] = useState<string[]>(widgetIds);

  useEffect(() => {
    setSelectedWidgets(widgetIds);
  }, [widgetIds]);

  // === Stats data ===
  const [statsLoaded, setStatsLoaded] = useState(false);
  const [streak, setStreak] = useState<StreakStats>({ current: 0, best: 0 });
  const [recentLogs, setRecentLogs] = useState<DailyActivityLog[]>([]);
  const [habitStats, setHabitStats] = useState<HabitMonthlyStats[]>([]);
  const [successData, setSuccessData] = useState<SuccessRatePoint[]>([]);
  const [completionStats, setCompletionStats] =
    useState<OverallCompletionStats>({
      completed: 0,
      expected: 0,
      missed: 0,
      rate: 0,
    });
  const [successFilter, setSuccessFilter] = useState<"day" | "week" | "month">(
    "week",
  );
  const [completionFilter, setCompletionFilter] =
    useState<CompletionFilter>("month");
  const [targetMonth, setTargetMonth] = useState(new Date());

  const hasStatsWidgets = useMemo(
    () =>
      selectedWidgets.some((id) =>
        ["streak", "completion", "successRate", "monthOverview"].includes(id),
      ),
    [selectedWidgets],
  );

  // === Chargement des stats ===
  useEffect(() => {
    if (!hasStatsWidgets || statsLoaded) return;

    const load = async () => {
      try {
        const [s, logs, monthly, rate, comp] = await Promise.all([
          habitService.getStreak(profileUserId),
          habitService.getRecentLogs(profileUserId),
          habitService.getMonthlyStats(targetMonth, profileUserId),
          habitService.getSuccessRate(successFilter, profileUserId),
          habitService.getOverallCompletionStats(completionFilter, profileUserId),
        ]);
        setStreak(s);
        setRecentLogs(logs);
        setHabitStats(monthly.habits);
        setSuccessData(rate);
        setCompletionStats(comp);
        setStatsLoaded(true);
      } catch (err) {
        console.error("Erreur chargement stats profil:", err);
      }
    };
    load();
  }, [hasStatsWidgets, profileUserId]);

  // Filtres (pour mettre à jour sans tout recharger)
  useEffect(() => {
    if (!statsLoaded) return;
    habitService
      .getSuccessRate(successFilter, profileUserId)
      .then(setSuccessData)
      .catch(console.error);
  }, [successFilter, statsLoaded, profileUserId]);

  useEffect(() => {
    if (!statsLoaded) return;
    habitService
      .getOverallCompletionStats(completionFilter, profileUserId)
      .then(setCompletionStats)
      .catch(console.error);
  }, [completionFilter, statsLoaded, profileUserId]);

  useEffect(() => {
    if (!statsLoaded) return;
    habitService
      .getMonthlyStats(targetMonth, profileUserId)
      .then((d) => setHabitStats(d.habits))
      .catch(console.error);
  }, [targetMonth, statsLoaded, profileUserId]);

  // Fin des effets de filtrage

  const handleSave = async (newSelection: string[]) => {
    setSelectedWidgets(newSelection);
    setIsEditing(false);
    try {
      await saveWidgetsToDb(newSelection);
      onWidgetsChange?.(newSelection);
    } catch (err) {
      console.error("Erreur sauvegarde widgets:", err);
    }
  };

  if (selectedWidgets.length === 0 && !isOwn) return null;

  // Widgets interactifs (HabitTracker, TodoList) utilisent readOnly si ce n'est pas notre profil
  const isReadOnly = !isOwn;

  return (
    <div className="w-full flex flex-col gap-6">
      {isOwn && (
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => setIsEditing(true)}
          className="neo-btn !bg-primary flex items-center justify-center gap-2 !py-3 text-sm w-full sm:w-auto sm:self-end"
        >
          <LayoutDashboard size={18} strokeWidth={3} />
          Modifier la page
        </motion.button>
      )}

      <AnimatePresence mode="popLayout">
        {selectedWidgets.map((id) => {
          return (
            <motion.div
              key={id}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              {id === "habits" && (
                <HabitTracker
                  profileUserId={profileUserId}
                  readOnly={isReadOnly}
                />
              )}
              {id === "todos" && (
                <TodoList profileUserId={profileUserId} readOnly={isReadOnly} />
              )}
              {id === "streak" && (
                <StreakSection
                  currentStreak={streak.current}
                  bestStreak={streak.best}
                  recentLogs={recentLogs}
                />
              )}
              {id === "completion" && (
                <CompletionSummary
                  stats={completionStats}
                  filter={completionFilter}
                  onFilterChange={setCompletionFilter}
                />
              )}
              {id === "successRate" && (
                <SuccessRateSection
                  filter={successFilter}
                  onFilterChange={setSuccessFilter}
                  data={successData}
                />
              )}
              {id === "monthOverview" && (
                <MonthlyOverview
                  habitStats={habitStats}
                  targetMonth={targetMonth}
                  onMonthChange={setTargetMonth}
                />
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>

      {selectedWidgets.length === 0 && isOwn && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="neo-card !bg-surface text-center !p-8"
        >
          <p className="font-black text-lg mb-2">📭 Page vide</p>
          <p className="font-bold text-foreground/60 text-sm">
            Clique sur &quot;Modifier la page&quot; pour ajouter des sections.
          </p>
        </motion.div>
      )}

      <AnimatePresence>
        {isEditing && (
          <WidgetEditor
            selected={selectedWidgets}
            onSave={handleSave}
            onClose={() => setIsEditing(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

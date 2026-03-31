"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, Repeat } from "lucide-react";
import { habitService } from "@/lib/services/habitService";
import { UIHabit, HabitCategory } from "@/lib/models/habit";
import { getMonthDays } from "./habit-tracker/constants";
import HabitSkeleton from "./habit-tracker/HabitSkeleton";
import HabitTableDesktop from "./habit-tracker/HabitTableDesktop";
import HabitListMobile from "./habit-tracker/HabitListMobile";
import HabitModal, { type HabitFormData } from "./habit-tracker/HabitModal";
import { supabase } from "@/lib/supabase/client";

interface HabitTrackerProps {
  profileUserId?: string;
  readOnly?: boolean;
}

export default function HabitTracker({
  profileUserId,
  readOnly,
}: HabitTrackerProps = {}) {
  const [habits, setHabits] = useState<UIHabit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [categoryFilter, setCategoryFilter] = useState<HabitCategory | "TOUS">("TOUS");
  const [isCollapsed, setIsCollapsed] = useState(true);

  // Persistence du state isCollapsed
  useEffect(() => {
    const saved = localStorage.getItem("habitTrackerCollapsed");
    if (saved !== null) {
      setIsCollapsed(saved === "true");
    }
  }, []);

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("habitTrackerCollapsed", String(newState));
  };

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [habitToEdit, setHabitToEdit] = useState<UIHabit | null>(null);

  // Navigation de jour (mobile) — index dans le mois entier
  const monthDays = useMemo(() => getMonthDays(), []);
  const todayIdx = useMemo(() => {
    const idx = monthDays.findIndex((d) => d.isToday);
    return idx >= 0 ? idx : 0;
  }, [monthDays]);

  const [currentDayIdx, setCurrentDayIdx] = useState(todayIdx);
  const [direction, setDirection] = useState(0);

  // === CHARGEMENT ===

  useEffect(() => {
    loadHabits();
  }, []);

  const loadHabits = async () => {
    try {
      setIsLoading(true);
      const data = await habitService.fetchHabits(profileUserId);
      setHabits(data);
    } catch (error) {
      console.error("Erreur lors du chargement:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Realtime : synchronise les logs depuis un autre onglet ou appareil
  useEffect(() => {
    if (readOnly) return; // Pas de souscription en mode lecture seule
    const channel = supabase
      .channel("habit-logs-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "habit_logs" },
        () => { loadHabits(); }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "habits" },
        () => { loadHabits(); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [readOnly]);

  // === ACTIONS ===

  const toggleHabit = async (habitId: string, dateStr: string) => {
    // Optimistic UI Update
    setHabits((currentHabits) =>
      currentHabits.map((h) => {
        if (h.id === habitId) {
          return {
            ...h,
            completedLogs: {
              ...h.completedLogs,
              [dateStr]: !h.completedLogs[dateStr],
            },
          };
        }
        return h;
      }),
    );

    try {
      await habitService.toggleLog(habitId, dateStr);
    } catch (error) {
      console.error("Erreur lors du toggle:", error);
      await loadHabits(); // Rollback
    }
  };

  const handleSave = async (data: HabitFormData) => {
    try {
      if (habitToEdit) {
        const updated = await habitService.updateHabit(
          habitToEdit.id,
          data.name,
          data.category,
          data.frequency,
          data.color,
          data.icon,
          data.startDate,
          data.endDate,
          data.time,
        );
        setHabits(habits.map((h) => (h.id === habitToEdit.id ? updated : h)));
      } else {
        const added = await habitService.addHabit(
          data.name,
          data.category,
          data.frequency,
          data.color,
          data.icon,
          data.startDate,
          data.endDate,
          data.time,
        );
        setHabits([...habits, added]);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
    }
  };

  const handleDelete = async (habitId: string) => {
    try {
      await habitService.deleteHabit(habitId);
      setHabits(habits.filter((h) => h.id !== habitId));
      setIsModalOpen(false);
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
    }
  };

  // === MODAL ===

  const openAddModal = () => {
    setHabitToEdit(null);
    setIsModalOpen(true);
  };

  const openEditModal = (habit: UIHabit) => {
    setHabitToEdit(habit);
    setIsModalOpen(true);
  };

  // === NAVIGATION DE JOUR (mobile) — parcourt tout le mois ===

  const handlePrevDay = () => {
    if (currentDayIdx > 0) {
      setDirection(-1);
      setCurrentDayIdx((prev) => prev - 1);
    }
  };

  const handleNextDay = () => {
    if (currentDayIdx < monthDays.length - 1) {
      setDirection(1);
      setCurrentDayIdx((prev) => prev + 1);
    }
  };

  const goToToday = () => {
    if (currentDayIdx === todayIdx) return;
    setDirection(todayIdx > currentDayIdx ? 1 : -1);
    setCurrentDayIdx(todayIdx);
  };

  // === RENDU ===

  const availableCategories = useMemo(() => {
    const cats = new Set(habits.map((h) => h.category));
    return ["TOUS", ...Array.from(cats)];
  }, [habits]);

  const filteredHabits = useMemo(() => {
    if (categoryFilter === "TOUS") return habits;
    return habits.filter((h) => h.category === categoryFilter);
  }, [habits, categoryFilter]);

  if (isLoading && habits.length === 0) {
    return <HabitSkeleton />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="w-full px-4 md:px-8 mt-4 mb-2 flex flex-col items-center max-w-6xl mx-auto font-sans"
    >
      {/* HEADER RÉDUCTIBLE */}
      <button
        onClick={toggleCollapse}
        className="flex items-center gap-3 mb-4 w-full text-left group cursor-pointer"
      >
        <div className="w-9 h-9 flex items-center justify-center bg-primary dark:bg-primary/30 border-[3px] border-foreground dark:border-gray-500 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(100,100,100,0.3)] shrink-0">
          <Repeat size={18} strokeWidth={3} className="dark:text-gray-300" />
        </div>
        <motion.div
          animate={{ rotate: isCollapsed ? -90 : 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="shrink-0"
        >
          <ChevronDown size={20} strokeWidth={3} className="text-foreground/50 group-hover:text-foreground transition-colors" />
        </motion.div>
        <h2 className="text-xl sm:text-2xl font-black uppercase text-foreground">
          Objectifs répétitifs
        </h2>
      </button>

      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="w-full overflow-hidden"
          >
      <div className="w-full">
        <HabitTableDesktop
          habits={filteredHabits}
          onToggle={toggleHabit}
          onEdit={openEditModal}
          onAdd={openAddModal}
          readOnly={readOnly}
          availableCategories={availableCategories}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
        />
        <HabitListMobile
          habits={filteredHabits}
          currentDayIdx={currentDayIdx}
          direction={direction}
          onToggle={toggleHabit}
          onEdit={openEditModal}
          onAdd={openAddModal}
          onPrevDay={handlePrevDay}
          onNextDay={handleNextDay}
          onGoToToday={goToToday}
          readOnly={readOnly}
          availableCategories={availableCategories}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
        />
      </div>
          </motion.div>
        )}
      </AnimatePresence>

      <HabitModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        habitToEdit={habitToEdit}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </motion.div>
  );
}

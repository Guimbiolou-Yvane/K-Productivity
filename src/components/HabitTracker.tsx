"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "motion/react";
import { habitService } from "@/lib/services/habitService";
import { UIHabit, HabitCategory } from "@/lib/models/habit";
import { getMonthDays } from "./habit-tracker/constants";
import HabitSkeleton from "./habit-tracker/HabitSkeleton";
import HabitTableDesktop from "./habit-tracker/HabitTableDesktop";
import HabitListMobile from "./habit-tracker/HabitListMobile";
import HabitModal, { type HabitFormData } from "./habit-tracker/HabitModal";

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

  // Filtre
  const [categoryFilter, setCategoryFilter] = useState<HabitCategory | "TOUS">("TOUS");

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
      className="w-full p-4 md:p-8 flex flex-col items-center max-w-6xl mx-auto font-sans"
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

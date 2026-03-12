"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight, Plus, Check } from "lucide-react";
import { UIHabit, HabitCategory } from "@/lib/models/habit";
import { getMonthDays, isOutsideDates, PRESET_COLORS } from "./constants";
import SectionInfo from "../SectionInfo";

interface HabitListMobileProps {
  habits: UIHabit[];
  currentDayIdx: number;
  direction: number;
  onToggle: (habitId: string, date: string) => void;
  onEdit: (habit: UIHabit) => void;
  onAdd: () => void;
  onPrevDay: () => void;
  onNextDay: () => void;
  onGoToToday: () => void;
  readOnly?: boolean;
  availableCategories: string[];
  categoryFilter: HabitCategory | "TOUS";
  setCategoryFilter: (cat: HabitCategory | "TOUS") => void;
}

export default function HabitListMobile({
  habits,
  currentDayIdx,
  direction,
  onToggle,
  onEdit,
  onAdd,
  onPrevDay,
  onNextDay,
  onGoToToday,
  readOnly,
  availableCategories,
  categoryFilter,
  setCategoryFilter,
}: HabitListMobileProps) {
  const monthDays = useMemo(() => getMonthDays(), []);

  // Clamp l'index pour rester dans les bornes du mois
  const safeIdx = Math.max(0, Math.min(currentDayIdx, monthDays.length - 1));
  const currentDay = monthDays[safeIdx];

  const prevIdx = safeIdx > 0 ? safeIdx - 1 : null;
  const nextIdx = safeIdx < monthDays.length - 1 ? safeIdx + 1 : null;

  const getDayLabel = (idx: number) => {
    const day = monthDays[idx];
    if (!day) return "";
    if (day.isToday) return "AUJOURD'HUI";
    return `${day.dayName.toUpperCase()} ${day.dayNumber}`;
  };

  const getDateLabel = (idx: number) => {
    const day = monthDays[idx];
    if (!day) return "";
    const d = new Date(day.date + "T00:00:00");
    return d
      .toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })
      .replace(".", "")
      .toUpperCase();
  };

  // Filtrer les habitudes pour le jour sélectionné
  const filteredHabits = habits.filter((h) => {
    if (!currentDay) return false;
    const inFrequency = h.frequency
      ? h.frequency.includes(currentDay.dayName)
      : true;
    const notBeforeCreation = !isOutsideDates(h, currentDay.date);
    return inFrequency && notBeforeCreation;
  });

  if (!currentDay) return null;

  return (
    <div className="lg:hidden flex flex-col w-full overflow-hidden">
      {/* TITRE + BOUTON AJOUTER */}
      <div className="flex flex-col items-end mb-8 mt-2">
        <div className="w-full flex items-center gap-3 pl-2 border-l-8 border-primary mb-3">
          <h2 className="text-xl sm:text-2xl font-black uppercase text-foreground leading-none">
            Objectifs répétitifs
          </h2>
          <SectionInfo
            title="Objectifs répétitifs (Habitudes)"
            description="Tes objectifs principaux et habitudes que tu souhaites développer. Tu peux définir leur fréquence et leur période de validité."
            example="Aller à la salle de sport, Lire 10 pages, Méditer"
          />
        </div>
        
        {availableCategories.length > 2 && (
          <div className="flex flex-wrap items-center justify-end gap-1.5 w-full mb-3 pr-1">
            <span className="text-[10px] font-black uppercase text-foreground/60 mr-1">Filtre:</span>
            {availableCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat as any)}
                className={`px-1.5 py-0.5 font-black text-[9px] border-2 border-foreground uppercase transition-all ${
                  categoryFilter === cat
                    ? "bg-primary shadow-none translate-x-[2px] translate-y-[2px] text-foreground"
                    : "bg-surface shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-foreground/70 active:translate-x-[2px] active:translate-y-[2px]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {!readOnly && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onAdd}
            className="bg-primary border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all px-3 py-1.5 flex items-center justify-center mr-1 gap-2 text-sm font-black uppercase"
            aria-label="Ajouter un Objectif"
          >
            <Plus size={18} strokeWidth={4} />
            Ajouter
          </motion.button>
        )}
      </div>

      {/* SÉLECTEUR DE JOUR */}
      <div className="flex items-center justify-between w-full mb-6 relative gap-2">
        <button
          onClick={onPrevDay}
          disabled={prevIdx === null}
          className="neo-btn !p-2 z-20 bg-surface flex-shrink-0 disabled:opacity-30"
          aria-label="Jour Précédent"
        >
          <ChevronLeft strokeWidth={4} className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        <div className="flex-1 flex justify-center items-center relative h-24 sm:h-28 overflow-hidden mx-1">
          <AnimatePresence initial={false} mode="popLayout" custom={direction}>
            <motion.div
              key={safeIdx}
              custom={direction}
              initial={{ x: direction > 0 ? 100 : -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{
                x: direction > 0 ? -100 : 100,
                opacity: 0,
                position: "absolute",
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="flex justify-center items-end gap-2 w-full absolute inset-0 pb-2"
            >
              {/* Carte Jour Précédent (SM) */}
              {prevIdx !== null && (
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  onClick={onPrevDay}
                  className="hidden sm:flex flex-col items-center flex-shrink-0 w-28 cursor-pointer group/card"
                >
                  <span className="text-xs font-black mb-2 opacity-70 tracking-widest group-hover/card:opacity-100 transition-opacity">
                    {getDateLabel(prevIdx)}
                  </span>
                  <div className="neo-card opacity-60 w-full text-center py-2 px-1 text-xs font-bold items-center justify-center truncate bg-surface group-hover/card:opacity-100 group-hover/card:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all">
                    {getDayLabel(prevIdx)}
                  </div>
                </motion.div>
              )}
              {/* Carte Jour Précédent (XS) */}
              {prevIdx !== null && (
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  onClick={onPrevDay}
                  className="sm:hidden flex flex-col items-center flex-shrink-0 w-16 cursor-pointer group/card"
                >
                  <span className="text-[10px] font-black mb-2 opacity-70 tracking-wider group-hover/card:opacity-100 transition-opacity">
                    {getDateLabel(prevIdx)}
                  </span>
                  <div className="neo-card opacity-60 w-full text-center py-2 px-1 text-[10px] font-bold items-center justify-center truncate bg-surface group-hover/card:opacity-100 group-hover/card:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all">
                    {getDayLabel(prevIdx).substring(0, 5)}
                  </div>
                </motion.div>
              )}

              {/* Carte Jour Courant (Central) */}
              <motion.div
                whileTap={{ scale: 0.95 }}
                onClick={onGoToToday}
                className="flex flex-col items-center flex-shrink-0 w-36 sm:w-48 z-10 cursor-pointer"
              >
                <span className="text-sm font-black mb-2 tracking-widest">
                  {getDateLabel(safeIdx)}
                </span>
                <div
                  className={`neo-card text-center py-3 px-1 text-sm sm:text-base font-black border-4 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] w-full flex items-center justify-center active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all ${currentDay.isToday ? "bg-primary" : "bg-surface"}`}
                >
                  {getDayLabel(safeIdx)}
                </div>
              </motion.div>

              {/* Carte Jour Suivant (SM) */}
              {nextIdx !== null && (
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  onClick={onNextDay}
                  className="hidden sm:flex flex-col items-center flex-shrink-0 w-28 cursor-pointer group/card"
                >
                  <span className="text-xs font-black mb-2 opacity-70 tracking-widest group-hover/card:opacity-100 transition-opacity">
                    {getDateLabel(nextIdx)}
                  </span>
                  <div className="neo-card opacity-60 w-full text-center py-2 px-1 text-xs font-bold items-center justify-center truncate bg-surface group-hover/card:opacity-100 group-hover/card:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all">
                    {getDayLabel(nextIdx)}
                  </div>
                </motion.div>
              )}
              {/* Carte Jour Suivant (XS) */}
              {nextIdx !== null && (
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  onClick={onNextDay}
                  className="sm:hidden flex flex-col items-center flex-shrink-0 w-16 cursor-pointer group/card"
                >
                  <span className="text-[10px] font-black mb-2 opacity-70 tracking-wider group-hover/card:opacity-100 transition-opacity">
                    {getDateLabel(nextIdx)}
                  </span>
                  <div className="neo-card opacity-60 w-full text-center py-2 px-1 text-[10px] font-bold items-center justify-center truncate bg-surface group-hover/card:opacity-100 group-hover/card:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all">
                    {getDayLabel(nextIdx).substring(0, 5)}
                  </div>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <button
          onClick={onNextDay}
          disabled={nextIdx === null}
          className="neo-btn !p-2 z-20 bg-surface flex-shrink-0 disabled:opacity-30"
          aria-label="Jour Suivant"
        >
          <ChevronRight strokeWidth={4} className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>

      {/* LISTE DES HABITUDES POUR LA JOURNÉE SÉLECTIONNÉE */}
      <div className="flex flex-col gap-4 relative min-h-[200px] max-h-[420px] overflow-y-auto custom-scrollbar pr-2 pb-2">
        <AnimatePresence mode="popLayout" custom={direction}>
          {filteredHabits.map((habit, index) => {
            const isCompleted = habit.completedLogs[currentDay.date] || false;

            return (
              <motion.div
                key={`${habit.id}-${safeIdx}-mobile`}
                custom={direction}
                layout
                initial={{
                  x: direction > 0 ? 50 : -50,
                  opacity: 0,
                  scale: 0.9,
                }}
                animate={{ x: 0, opacity: 1, scale: 1 }}
                exit={{ x: direction > 0 ? -50 : 50, opacity: 0, scale: 0.8 }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 30,
                  delay: index * 0.05,
                }}
                whileTap={{
                  scale: readOnly ? 1 : 0.96,
                  x: readOnly ? 0 : 2,
                  y: readOnly ? 0 : 2,
                }}
                onClick={() => !readOnly && onEdit(habit)}
                className={`neo-card shrink-0 flex items-center justify-between !p-4 transition-colors relative overflow-hidden z-0 ${isCompleted ? "opacity-80" : "bg-surface"} active:shadow-none ${readOnly ? "!cursor-default" : "cursor-pointer"}`}
                style={
                  isCompleted
                    ? { backgroundColor: habit.color || PRESET_COLORS[0] }
                    : {}
                }
              >
                {!isCompleted && (
                  <div
                    className="absolute top-0 left-0 w-3 h-full z-[-1]"
                    style={{ backgroundColor: habit.color || PRESET_COLORS[0] }}
                  />
                )}
                <div className="flex flex-col pr-4 pl-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-muted uppercase italic tracking-wider">
                      {habit.category}
                    </span>
                    {habit.time && (
                      <span className="text-[10px] font-black bg-background border-2 border-foreground px-1 py-0.5 rounded shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                        {habit.time}
                      </span>
                    )}
                  </div>
                  <span className="font-black text-lg leading-tight break-words flex items-center gap-2">
                    {habit.icon && (
                      <span className="text-2xl">{habit.icon}</span>
                    )}
                    {habit.name}
                  </span>
                </div>

                <motion.button
                  whileTap={{ scale: 0.8 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!readOnly) onToggle(habit.id, currentDay.date);
                  }}
                  disabled={readOnly}
                  className={`neo-checkbox shrink-0 !w-12 !h-12 sm:!w-14 sm:!h-14 ${isCompleted ? "bg-transparent shadow-none translate-x-[2px] translate-y-[2px]" : "bg-surface shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] sm:hover:translate-x-[2px] sm:hover:translate-y-[2px] sm:hover:shadow-none active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"} ${readOnly ? "cursor-default" : ""}`}
                  aria-label={`Activer ${habit.name}`}
                >
                  {isCompleted && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 20,
                      }}
                    >
                      <Check
                        strokeWidth={5}
                        className="text-foreground shrink-0 w-6 h-6 sm:w-8 sm:h-8"
                      />
                    </motion.div>
                  )}
                </motion.button>
              </motion.div>
            );
          })}

          {filteredHabits.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="neo-card p-8 text-center font-bold text-muted uppercase tracking-widest bg-surface mt-4"
            >
              Aucun objectif pour ce jour.
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

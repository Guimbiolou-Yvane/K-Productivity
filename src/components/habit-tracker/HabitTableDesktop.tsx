"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Check, Edit, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { UIHabit, HabitCategory } from "@/lib/models/habit";
import { PRESET_COLORS, getMonthDays, isOutsideDates } from "./constants";
import SectionInfo from "../SectionInfo";

interface HabitTableDesktopProps {
  habits: UIHabit[];
  onToggle: (habitId: string, date: string) => void;
  onEdit: (habit: UIHabit) => void;
  onAdd: () => void;
  readOnly?: boolean;
  availableCategories: string[];
  categoryFilter: HabitCategory | "TOUS";
  setCategoryFilter: (cat: HabitCategory | "TOUS") => void;
}

const VISIBLE_DAYS = 7; // Nombre de jours visibles à la fois

export default function HabitTableDesktop({
  habits,
  onToggle,
  onEdit,
  onAdd,
  readOnly,
  availableCategories,
  categoryFilter,
  setCategoryFilter,
}: HabitTableDesktopProps) {
  const monthDays = useMemo(() => getMonthDays(), []);
  const todayIdx = useMemo(
    () => monthDays.findIndex((d) => d.isToday),
    [monthDays],
  );

  // Offset de départ : centré sur aujourd'hui
  const [startIdx, setStartIdx] = useState(() => {
    return Math.max(0, Math.min(todayIdx - 3, monthDays.length - VISIBLE_DAYS));
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  // Jours visibles
  const visibleDays = monthDays.slice(startIdx, startIdx + VISIBLE_DAYS);

  const canGoLeft = startIdx > 0;
  const canGoRight = startIdx + VISIBLE_DAYS < monthDays.length;

  const goLeft = () => setStartIdx((prev) => Math.max(0, prev - VISIBLE_DAYS));
  const goRight = () =>
    setStartIdx((prev) =>
      Math.min(monthDays.length - VISIBLE_DAYS, prev + VISIBLE_DAYS),
    );
  const goToToday = () =>
    setStartIdx(
      Math.max(0, Math.min(todayIdx - 3, monthDays.length - VISIBLE_DAYS)),
    );

  return (
    <div className="hidden lg:block w-full pb-4 neo-card !p-0">
      {/* Navigation mois */}
      <div className="flex items-center justify-between px-4 py-2 border-b-4 border-foreground bg-background">
        <button
          onClick={goLeft}
          disabled={!canGoLeft}
          className="neo-btn !p-1.5 bg-surface disabled:opacity-30"
        >
          <ChevronLeft size={18} strokeWidth={3} />
        </button>

        <div className="flex items-center gap-3">
          <span className="font-black text-sm uppercase tracking-widest">
            {new Date()
              .toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
              .toUpperCase()}
          </span>
          <button
            onClick={goToToday}
            className="text-xs font-black uppercase bg-primary border-2 border-foreground px-2 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
          >
            Auj.
          </button>
        </div>

        <button
          onClick={goRight}
          disabled={!canGoRight}
          className="neo-btn !p-1.5 bg-surface disabled:opacity-30"
        >
          <ChevronRight size={18} strokeWidth={3} />
        </button>
      </div>

      <div className="w-full overflow-x-auto custom-scrollbar pb-2">
        <div className="min-w-[900px]" ref={scrollRef}>
          {/* HEADER ROW */}
        <div
          className={`grid border-b-4 border-foreground w-full`}
          style={{ gridTemplateColumns: `250px repeat(${VISIBLE_DAYS}, 1fr)` }}
        >
          <div className="p-4 border-r-4 border-foreground font-black flex flex-col items-end justify-between bg-surface text-lg gap-2">
            <div className="self-start flex flex-col gap-3 w-full">
              <div className="flex items-center gap-2">
                <span className="leading-tight">OBJECTIFS<br/>RÉPÉTITIFS</span>
                <SectionInfo
                  title="Objectifs répétitifs (Habitudes)"
                  description="Tes objectifs principaux et habitudes que tu souhaites développer au fil des semaines. Coche les cases correspondantes aux jours pour avancer."
                  example="Aller à la salle de sport, Lire 10 pages, Méditer"
                />
              </div>
              
              {availableCategories.length > 2 && (
                <div className="flex flex-wrap items-center gap-1.5 w-full mt-2">
                  <span className="text-[10px] font-black uppercase text-foreground/60 mr-1">Filtre:</span>
                  {availableCategories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat as any)}
                      className={`px-1.5 py-0.5 font-black text-[9px] border-2 border-foreground uppercase transition-all ${
                        categoryFilter === cat
                          ? "bg-primary shadow-none translate-x-[2px] translate-y-[2px] text-foreground"
                          : "bg-surface shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-foreground/70 hover:bg-primary/20 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {!readOnly && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onAdd}
                className="bg-primary border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all px-2 py-1 flex items-center justify-center gap-1 text-xs mt-3 flex-shrink-0"
                aria-label="Ajouter un Objectif"
              >
                <Plus size={16} strokeWidth={4} />
                AJOUTER
              </motion.button>
            )}
          </div>
          {visibleDays.map((day, idx) => (
            <div
              key={day.date}
              className={`p-3 font-black text-center border-r-4 border-foreground flex flex-col items-center justify-center gap-0.5 transition-colors ${
                idx === visibleDays.length - 1 ? "!border-r-0" : ""
              } ${day.isToday ? "bg-primary" : "bg-surface"}`}
            >
              <span className="text-[11px] tracking-wider opacity-70">
                {day.dayName}
              </span>
              <span
                className={`text-lg ${day.isToday ? "underline underline-offset-2" : ""}`}
              >
                {day.dayNumber}
              </span>
            </div>
          ))}
        </div>

        {/* TABLE ROWS */}
        <AnimatePresence mode="popLayout">
          {habits.map((habit, index) => (
            <motion.div
              layout
              initial={{ opacity: 0, x: -20, filter: "blur(4px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.9, filter: "blur(4px)" }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 30,
                delay: index * 0.05,
              }}
              key={`${habit.id}-desktop`}
              className="grid border-b-4 border-foreground last:border-b-0 group/row"
              style={{
                gridTemplateColumns: `250px repeat(${VISIBLE_DAYS}, 1fr)`,
              }}
            >
              {/* NOM + CATÉGORIE + BOUTON MODIFIER */}
              <div className="p-4 border-r-4 border-foreground flex flex-col justify-center bg-background relative overflow-hidden z-0 group/name">
                <div
                  className="absolute top-0 left-0 w-3 h-full z-[-1]"
                  style={{ backgroundColor: habit.color || PRESET_COLORS[0] }}
                />
                <div className="flex items-center gap-2 mb-1 pl-4">
                  <span className="text-xs font-bold text-muted uppercase italic tracking-wider">
                    {habit.category}
                  </span>
                  {habit.time && (
                    <span className="text-[10px] font-black bg-surface border-2 border-foreground px-1 py-0.5 rounded shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                      {habit.time}
                    </span>
                  )}
                </div>
                <span className="font-black text-base leading-tight break-words flex items-center gap-2 pl-4">
                  {habit.icon && <span className="text-xl">{habit.icon}</span>}
                  {habit.name}
                </span>
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  {!readOnly && (
                    <motion.button
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => onEdit(habit)}
                      className="p-2 bg-surface border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-primary transition-colors cursor-pointer flex items-center justify-center"
                      aria-label={`Modifier ${habit.name}`}
                    >
                      <Edit size={16} strokeWidth={3} />
                    </motion.button>
                  )}
                </div>
              </div>

              {/* CHECKBOXES POUR CHAQUE JOUR VISIBLE */}
              {visibleDays.map((day, idx) => {
                const isIncludedInFrequency = habit.frequency
                  ? habit.frequency.includes(day.dayName)
                  : true;
                const disabledBefore = isOutsideDates(habit, day.date);
                const isCompleted = habit.completedLogs[day.date] || false;

                return (
                  <div
                    key={`${day.date}-${habit.id}`}
                    className={`p-3 flex items-center justify-center group-hover/row:bg-gray-100 transition-colors border-r-4 border-foreground ${idx === visibleDays.length - 1 ? "!border-r-0" : ""} ${day.isToday ? "bg-yellow-50" : "bg-surface"}`}
                  >
                    {isIncludedInFrequency && !disabledBefore ? (
                      <motion.button
                        whileTap={{ scale: 0.8 }}
                        onClick={() =>
                          !readOnly && onToggle(habit.id, day.date)
                        }
                        disabled={readOnly}
                        className={`neo-checkbox ${isCompleted ? "shadow-none translate-x-[2px] translate-y-[2px]" : "bg-surface shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] sm:hover:translate-x-[2px] sm:hover:translate-y-[2px] sm:hover:shadow-none active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"} ${readOnly ? "cursor-default" : ""}`}
                        style={
                          isCompleted
                            ? {
                                backgroundColor:
                                  habit.color || PRESET_COLORS[0],
                              }
                            : {}
                        }
                        aria-label={`Toggle habit ${habit.name} for ${day.date}`}
                      >
                        {isCompleted && (
                          <motion.div
                            initial={{ scale: 0, rotate: -45 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{
                              type: "spring",
                              stiffness: 500,
                              damping: 20,
                            }}
                          >
                            <Check
                              strokeWidth={4}
                              className="text-foreground shrink-0 w-6 h-6"
                            />
                          </motion.div>
                        )}
                      </motion.button>
                    ) : (
                      <div className="w-8 h-8 flex items-center justify-center text-muted/30 font-black">
                        -
                      </div>
                    )}
                  </div>
                );
              })}
            </motion.div>
          ))}
        </AnimatePresence>
        {habits.length === 0 && (
          <div className="p-8 text-center font-bold text-muted bg-surface uppercase tracking-widest">
            Aucun objectif pour le moment.
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight, Plus, Check, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { UIHabit, HabitCategory } from "@/lib/models/habit";
import { getDayInfo, addDaysFormat, isOutsideDates, PRESET_COLORS, getMonthDays } from "./constants";
import SectionInfo from "../SectionInfo";

interface HabitListMobileProps {
  habits: UIHabit[];
  selectedDate: string;
  direction: number;
  onToggle: (habitId: string, date: string) => void;
  onEdit: (habit: UIHabit) => void;
  onExpiredClick?: (habit: UIHabit) => void;
  onAdd: () => void;
  onPrevDay: () => void;
  onNextDay: () => void;
  onGoToToday: () => void;
  onSelectDate: (date: string) => void;
  readOnly?: boolean;
  availableCategories: string[];
  categoryFilter: HabitCategory | "TOUS";
  setCategoryFilter: (cat: HabitCategory | "TOUS") => void;
}

export default function HabitListMobile({
  habits,
  selectedDate,
  direction,
  onToggle,
  onEdit,
  onExpiredClick,
  onAdd,
  onPrevDay,
  onNextDay,
  onGoToToday,
  onSelectDate,
  readOnly,
  availableCategories,
  categoryFilter,
  setCategoryFilter,
}: HabitListMobileProps) {
  const currentDay = getDayInfo(selectedDate);
  const prevDay = getDayInfo(addDaysFormat(selectedDate, -1));
  const nextDay = getDayInfo(addDaysFormat(selectedDate, 1));

  const getDayLabel = (day: any) => {
    if (!day) return "";
    if (day.isToday) return "AUJOURD'HUI";
    return `${day.dayName.toUpperCase()} ${day.dayNumber}`;
  };

  const getDateLabel = (day: any) => {
    if (!day) return "";
    const d = new Date(day.date + "T00:00:00");
    return d
      .toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })
      .replace(".", "")
      .toUpperCase();
  };

  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  const monthGridDays = useMemo(() => {
    const targetMonthStr = selectedDate.substring(0, 7); // YYYY-MM
    return getMonthDays(targetMonthStr);
  }, [selectedDate]);

  // Filtrer les habitudes pour le jour sélectionné
  const filteredHabits = habits.filter((h) => {
    if (!currentDay) return false;

    // Calcul du jour qui suit la fin
    const getNextDay = (dateStr: string) => {
      const d = new Date(dateStr);
      d.setDate(d.getDate() + 1);
      return d.toISOString().split("T")[0];
    };
    
    const isJustExpired = currentDay.date === getNextDay(h.end_date);
    const isConcludedLocally = typeof window !== 'undefined' ? localStorage.getItem('concluded_habit_' + h.id) === 'true' : false;

    // Si on est exactement le jour d'après et que l'utilisateur n'a pas encore conclu, on l'affiche
    if (isJustExpired && !isConcludedLocally) {
      return true;
    }

    const inFrequency = h.frequency
      ? h.frequency.includes(currentDay.dayName)
      : true;
    const notBeforeCreation = !isOutsideDates(h, currentDay.date);
    
    return inFrequency && notBeforeCreation;
  });

  if (!currentDay) return null;

  return (
    <div className="lg:hidden flex flex-col w-full overflow-hidden">
      {/* BOUTON AJOUTER */}
      <div className="flex flex-col w-full mb-8 mt-2 gap-3 px-1">
        
        {availableCategories.length > 2 && (
          <div className="flex items-center gap-2 w-full mb-1">
            <span className="text-[10px] font-black uppercase text-foreground/60 whitespace-nowrap shrink-0 pl-1">Filtrer par :</span>
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {availableCategories.map((cat) => (
                <motion.button
                  key={cat}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCategoryFilter(cat as any)}
                  className={`px-2.5 py-1 font-black text-[10px] border-[3px] border-foreground uppercase whitespace-nowrap transition-all shrink-0 ${
                    categoryFilter === cat
                      ? "bg-foreground text-background shadow-none"
                      : "bg-surface shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-foreground/70 active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
                  }`}
                >
                  {cat}
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {!readOnly && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            onClick={onAdd}
            className="w-full bg-primary border-2 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all py-3 flex items-center justify-center gap-2 text-sm sm:text-base font-black uppercase"
            aria-label="Ajouter un Objectif"
          >
            <Plus size={20} strokeWidth={4} />
            Ajouter
          </motion.button>
        )}
      </div>

      {/* SÉLECTEUR DE JOUR ET CALENDRIER */}
      <div className="flex flex-col items-center justify-center w-full mb-4">
        <div className="relative flex items-center gap-2 cursor-pointer bg-surface border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] px-3 py-1.5 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all hover:bg-primary">
          <Calendar size={16} strokeWidth={3} className="text-foreground" />
          <span className="text-[10px] font-black uppercase tracking-wider">Sélectionner une date</span>
          <input 
            type="date"
            value={selectedDate}
            onChange={(e) => {
              if (e.target.value) onSelectDate(e.target.value);
            }}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            aria-label="Sélectionner une date"
          />
        </div>
      </div>

      <div className="flex items-center justify-between w-full mb-6 relative gap-2">
        <button
          onClick={onPrevDay}
          className="neo-btn !p-2 z-20 bg-surface flex-shrink-0"
          aria-label="Jour Précédent"
        >
          <ChevronLeft strokeWidth={4} className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        <div className="flex-1 flex justify-center items-center relative h-24 sm:h-28 overflow-hidden mx-1">
          <AnimatePresence initial={false} mode="popLayout" custom={direction}>
            <motion.div
              key={selectedDate}
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
              <motion.div
                whileTap={{ scale: 0.9 }}
                onClick={onPrevDay}
                className="hidden sm:flex flex-col items-center flex-shrink-0 w-28 cursor-pointer group/card"
              >
                <span className="text-xs font-black mb-2 opacity-70 tracking-widest group-hover/card:opacity-100 transition-opacity">
                  {getDateLabel(prevDay)}
                </span>
                <div className="neo-card opacity-60 w-full text-center py-2 px-1 text-xs font-bold items-center justify-center truncate bg-surface group-hover/card:opacity-100 group-hover/card:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all">
                  {getDayLabel(prevDay)}
                </div>
              </motion.div>
              
              {/* Carte Jour Précédent (XS) */}
              <motion.div
                whileTap={{ scale: 0.9 }}
                onClick={onPrevDay}
                className="sm:hidden flex flex-col items-center flex-shrink-0 w-16 cursor-pointer group/card"
              >
                <span className="text-[10px] font-black mb-2 opacity-70 tracking-wider group-hover/card:opacity-100 transition-opacity">
                  {getDateLabel(prevDay)}
                </span>
                <div className="neo-card opacity-60 w-full text-center py-2 px-1 text-[10px] font-bold items-center justify-center truncate bg-surface group-hover/card:opacity-100 group-hover/card:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all">
                  {getDayLabel(prevDay).substring(0, 5)}
                </div>
              </motion.div>

              {/* Carte Jour Courant (Central) */}
              <motion.div
                whileTap={{ scale: 0.95 }}
                onClick={onGoToToday}
                className="flex flex-col items-center flex-shrink-0 w-36 sm:w-48 z-10 cursor-pointer"
              >
                <span className="text-sm font-black mb-2 tracking-widest">
                  {getDateLabel(currentDay)}
                </span>
                <div
                  className={`neo-card text-center py-3 px-1 text-sm sm:text-base font-black border-4 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] w-full flex items-center justify-center active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all ${currentDay.isToday ? "bg-primary" : "bg-surface"}`}
                >
                  {getDayLabel(currentDay)}
                </div>
              </motion.div>

              {/* Carte Jour Suivant (SM) */}
              <motion.div
                whileTap={{ scale: 0.9 }}
                onClick={onNextDay}
                className="hidden sm:flex flex-col items-center flex-shrink-0 w-28 cursor-pointer group/card"
              >
                <span className="text-xs font-black mb-2 opacity-70 tracking-widest group-hover/card:opacity-100 transition-opacity">
                  {getDateLabel(nextDay)}
                </span>
                <div className="neo-card opacity-60 w-full text-center py-2 px-1 text-xs font-bold items-center justify-center truncate bg-surface group-hover/card:opacity-100 group-hover/card:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all">
                  {getDayLabel(nextDay)}
                </div>
              </motion.div>
              
              {/* Carte Jour Suivant (XS) */}
              <motion.div
                whileTap={{ scale: 0.9 }}
                onClick={onNextDay}
                className="sm:hidden flex flex-col items-center flex-shrink-0 w-16 cursor-pointer group/card"
              >
                <span className="text-[10px] font-black mb-2 opacity-70 tracking-wider group-hover/card:opacity-100 transition-opacity">
                  {getDateLabel(nextDay)}
                </span>
                <div className="neo-card opacity-60 w-full text-center py-2 px-1 text-[10px] font-bold items-center justify-center truncate bg-surface group-hover/card:opacity-100 group-hover/card:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all">
                  {getDayLabel(nextDay).substring(0, 5)}
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>

        <button
          onClick={onNextDay}
          className="neo-btn !p-2 z-20 bg-surface flex-shrink-0"
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
            
            const getNextDay = (dateStr: string) => {
              const d = new Date(dateStr);
              d.setDate(d.getDate() + 1);
              return d.toISOString().split("T")[0];
            };
            const isJustExpired = currentDay.date === getNextDay(habit.end_date);
            const expiredStyles = isJustExpired 
              ? "bg-gray-200 opacity-70 grayscale border-gray-400" 
              : isCompleted ? "opacity-80" : "bg-surface";

            return (
              <div key={`${habit.id}-${selectedDate}-mobile`} className="w-full relative flex flex-col pt-2">
                <motion.div
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
                onClick={() => {
                  if (readOnly) return;
                  if (isJustExpired && onExpiredClick) {
                    onExpiredClick(habit);
                  } else {
                    onEdit(habit);
                  }
                }}
                className={`neo-card shrink-0 flex items-center justify-between !p-4 transition-colors relative overflow-hidden z-0 ${expiredStyles} active:shadow-none ${readOnly ? "!cursor-default" : "cursor-pointer"}`}
                style={
                  !isJustExpired && isCompleted
                    ? { backgroundColor: habit.color || PRESET_COLORS[0] }
                    : {}
                }
              >
                {!isCompleted && !isJustExpired && (
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

                {isJustExpired ? (
                  <div className="text-xs font-bold uppercase text-foreground/50 border-2 border-foreground/30 px-2 py-1 bg-surface">
                    Terminé
                  </div>
                ) : (
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
                )}
                
                {/* RECTANGLE POUR DÉROULER LE CALENDRIER */}
                <div 
                  className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-12 h-5 bg-foreground/10 flex items-center justify-center cursor-pointer rounded-t-lg hover:bg-foreground/20 transition-all z-10 hover:h-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedCardId(expandedCardId === habit.id ? null : habit.id);
                  }}
                >
                  <motion.div
                    animate={{ rotate: expandedCardId === habit.id ? -180 : 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  >
                    <ChevronDown size={16} strokeWidth={4} className="text-foreground -mb-1" />
                  </motion.div>
                </div>
              </motion.div>
              
              {/* VUE CALENDRIER DÉROULABLE */}
              <AnimatePresence initial={false}>
                {expandedCardId === habit.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0, scaleY: 0.9, originY: 0 }}
                    animate={{ height: "auto", opacity: 1, scaleY: 1 }}
                    exit={{ height: 0, opacity: 0, scaleY: 0.8 }}
                    transition={{ type: "spring", stiffness: 350, damping: 30, mass: 0.8 }}
                    className="w-full bg-surface border-4 border-t-0 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -mt-2 pt-5 px-3 pb-3 mb-2 overflow-hidden flex flex-col items-center"
                  >
                    <div className="flex flex-wrap gap-1 justify-center">
                      {monthGridDays.map((d: any) => {
                        const isDayCompleted = habit.completedLogs[d.date] || false;
                        const outOfBounds = isOutsideDates(habit, d.date);
                        const inFrequency = habit.frequency ? habit.frequency.includes(d.dayName) : true;
                        
                        let squareClasses = "bg-gray-300 text-black/40 border-transparent"; // absent ou non requis
                        let textClass = "text-[9px] font-black";

                        if (!outOfBounds && inFrequency) {
                          if (isDayCompleted) {
                            squareClasses = "bg-blue-500 text-white border-black border-[1.5px] shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"; // Validé
                          } else if (d.date < new Date().toISOString().split("T")[0]) {
                            squareClasses = "bg-red-500 text-white border-black border-[1.5px] shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"; // Raté
                          } else {
                            squareClasses = "bg-surface text-foreground border-foreground border-[1.5px] opacity-60"; // À venir
                          }
                        }

                        return (
                          <div 
                            key={d.date} 
                            className={`w-6 h-6 sm:w-7 sm:h-7 shrink-0 flex items-center justify-center rounded-[2px] transition-all ${squareClasses}`}
                            title={`${d.date} - ${isDayCompleted ? 'Validé' : 'Non validé'}`}
                          >
                            <span className={textClass}>{d.dayNumber}</span>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
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

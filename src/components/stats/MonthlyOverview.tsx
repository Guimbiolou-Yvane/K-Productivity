"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { HabitMonthlyStats } from "@/lib/models/habit";
import SectionInfo from "../SectionInfo";

interface MonthlyOverviewProps {
  habitStats: HabitMonthlyStats[];
  targetMonth: Date;
  onMonthChange: (date: Date) => void;
}

const MONTH_NAMES = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

export default function MonthlyOverview({ habitStats, targetMonth, onMonthChange }: MonthlyOverviewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedHabitId, setSelectedHabitId] = useState("all");

  const filteredHabits = habitStats.filter(h => h.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const activeHabit = habitStats.find(h => h.id === selectedHabitId) || habitStats[0] || { completions: [], failed: [], notApplicable: [] };

  const daysInMonth = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0).getDate();
  const startDayInfo = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1).getDay();
  const firstDayOffset = startDayInfo === 0 ? 6 : startDayInfo - 1;

  const currentCalendar = Array.from({ length: daysInMonth }, (_, i) => {
    const dayNumber = i + 1;
    const dayDate = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), dayNumber);
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    const isToday = todayDate.getTime() === dayDate.getTime();
    const isFuture = dayDate.getTime() > todayDate.getTime();

    return {
      dayNumber,
      isCompleted: activeHabit.completions?.includes(dayNumber) || false,
      isFailed: activeHabit.failed?.includes(dayNumber) || false,
      isNotApplicable: activeHabit.notApplicable?.includes(dayNumber) || false,
      isToday,
      isFuture,
    };
  });

  const currentMonthName = `${MONTH_NAMES[targetMonth.getMonth()]} ${targetMonth.getFullYear()}`;

  const goToPrevMonth = () => onMonthChange(new Date(targetMonth.getFullYear(), targetMonth.getMonth() - 1, 1));
  const goToNextMonth = () => onMonthChange(new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 1));

  return (
    <section className="flex flex-col gap-4 mt-4">
      <div className="flex items-center gap-3 pl-2 border-l-8 border-[#4facff]">
        <h2 className="text-xl sm:text-2xl font-black uppercase text-foreground">
          Aperçu Global
        </h2>
        <SectionInfo
          title="Aperçu Global"
          description="Un calendrier visuel mensuel de la complétion pour chaque habitude en particulier ou bien de façon globale."
          example="En sélectionnant 'Tous les objectifs', les jours sont cochés en bleu seulement si chaque habitude prévue dans cette journée a bien été faite. Sinon on considère le jour comme Incomplet."
        />
      </div>
      <div className="neo-card bg-surface p-4 sm:p-8">
        {/* NAVIGATION MOIS */}
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={goToPrevMonth}
            className="neo-btn !p-2 z-20 bg-surface flex-shrink-0"
          >
            <ChevronLeft strokeWidth={4} className="w-5 h-5" />
          </button>
          
          <h3 className="font-black uppercase tracking-wide text-center text-lg sm:text-xl">
            {currentMonthName}
          </h3>

          <button 
            onClick={goToNextMonth}
            className="neo-btn !p-2 z-20 bg-surface flex-shrink-0"
          >
            <ChevronRight strokeWidth={4} className="w-5 h-5" />
          </button>
        </div>
        
        {/* BARRE DE RECHERCHE + FILTRES */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground opacity-50" strokeWidth={3} />
            <input 
              type="text" 
              placeholder="Rechercher un objectif précis..." 
              className="neo-input font-bold !pl-12 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2 w-full mb-3">
            <span className="text-[10px] font-black uppercase text-foreground/60 whitespace-nowrap shrink-0 pl-1">Filtrer par :</span>
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {filteredHabits.map((habit) => (
                <motion.button
                  key={habit.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedHabitId(habit.id)}
                  className={`px-2.5 py-1 font-black text-[10px] border-[3px] border-foreground uppercase whitespace-nowrap transition-all shrink-0 ${
                    selectedHabitId === habit.id
                      ? "bg-foreground text-background shadow-none"
                      : "bg-surface shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-foreground/70 active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
                  }`}
                >
                  {habit.name}
                </motion.button>
              ))}
              {filteredHabits.length === 0 && (
                <span className="text-[10px] font-bold text-muted italic ml-2">Aucun objectif trouvé.</span>
              )}
            </div>
          </div>
        </div>

        {/* CALENDRIER */}
        <div className="flex flex-col gap-4">
          {/* En-tête jours de la semaine */}
          <div className="grid grid-cols-7 gap-2 md:gap-4 text-center border-b-4 border-foreground pb-2 mb-2">
            {["L", "M", "M", "J", "V", "S", "D"].map((day, i) => (
              <span key={i} className="font-black text-sm sm:text-lg">{day}</span>
            ))}
          </div>
          
          {/* Grille du calendrier */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 md:gap-4">
            {/* Cases vides pour le décalage */}
            {Array.from({ length: firstDayOffset }).map((_, i) => (
              <div key={`empty-${i}`} className="w-full h-full min-h-[28px]" />
            ))}
            
            {currentCalendar.map((day, i) => (
              <div key={i} className="flex flex-col items-center gap-1 sm:gap-2">
                <motion.div 
                  whileHover={{ scale: 1.1, rotate: day.isCompleted ? 5 : 0 }}
                  className={`w-7 h-7 sm:w-10 sm:h-10 md:w-12 md:h-12 border-2 sm:border-4 border-foreground flex items-center justify-center transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
                    ${day.isCompleted ? 'bg-[#4facff]' : day.isFuture ? 'bg-surface' : day.isNotApplicable ? 'bg-gray-300 opacity-50 shadow-none' : day.isFailed ? 'bg-[#ff6b6b]' : 'bg-surface'}
                    ${day.isToday ? 'ring-4 ring-[#4facff] ring-offset-2 ring-offset-background' : ''}
                  `}
                />
                <span className={`text-[10px] sm:text-sm font-bold ${day.isToday ? 'text-[#4facff]' : day.isNotApplicable ? 'text-foreground/40' : 'text-foreground'}`}>
                  {day.dayNumber}
                </span>
              </div>
            ))}
          </div>
          
          <div className="flex flex-col sm:flex-row items-center flex-wrap gap-4 mt-6 pt-4 border-t-2 border-dashed border-foreground/30 justify-center">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-[#4facff] border-2 border-foreground shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]" />
              <span className="text-[10px] sm:text-xs font-bold uppercase">Objectifs atteints</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-[#ff6b6b] border-2 border-foreground shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]" />
              <span className="text-[10px] sm:text-xs font-bold uppercase">Échoué</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-300 opacity-50 border-2 border-foreground" />
              <span className="text-[10px] sm:text-xs font-bold uppercase">Non applicable</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-surface border-2 border-foreground shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]" />
              <span className="text-[10px] sm:text-xs font-bold uppercase">À venir</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

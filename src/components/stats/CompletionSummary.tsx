"use client";

import { motion } from "motion/react";
import { CheckCircle, XCircle, Target } from "lucide-react";
import { OverallCompletionStats } from "@/lib/models/habit";
import SectionInfo from "../SectionInfo";

export type CompletionFilter = "week" | "month" | "all";

interface CompletionSummaryProps {
  stats: OverallCompletionStats;
  filter: CompletionFilter;
  onFilterChange: (filter: CompletionFilter) => void;
}

const FILTER_LABELS: Record<CompletionFilter, string> = {
  week: "Semaine",
  month: "Mois",
  all: "Depuis le début",
};

export default function CompletionSummary({ stats, filter, onFilterChange }: CompletionSummaryProps) {
  const rateColor = stats.rate >= 80 ? "#1fb05a" : stats.rate >= 50 ? "#ffda59" : "#ff6b6b";

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center gap-3 pl-2 border-l-8 border-[#9d4edd]">
        <h2 className="text-xl sm:text-2xl font-black uppercase text-foreground">
          Bilan
        </h2>
        <SectionInfo
          title="Bilan Global"
          description="Affiche le nombre total d'objectifs réalisés et de ceux que tu as manqués, ainsi que ton taux de complétion moyen, calculé depuis le début de la période ciblée (Jour, Semaine, Mois)."
          example="Si tu as 3 habitudes par jour, sur une semaine tu viseras 21 objectifs. Le bilan te dira combien de ces 21 actions ont été couronnées de succès."
        />
      </div>

      {/* FILTRES */}
      <div className="flex gap-2">
        {(["week", "month", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => onFilterChange(f)}
            className={`px-3 sm:px-4 py-1.5 font-black text-[10px] sm:text-xs border-2 border-foreground uppercase transition-all ${
              filter === f
                ? "bg-[#9d4edd] text-foreground shadow-none translate-x-[2px] translate-y-[2px]"
                : "bg-surface shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-foreground/70 hover:bg-[#9d4edd]/20 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            }`}
          >
            {FILTER_LABELS[f]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* CARTE 1 : RÉALISÉES + MANQUÉES */}
        <motion.div
          key={`card-counts-${filter}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          whileHover={{ scale: 1.01 }}
          className="neo-card bg-surface p-5 sm:p-6 relative overflow-hidden"
        >
          <div className="flex items-center justify-around gap-4">
            {/* Réalisées */}
            <div className="flex flex-col items-center gap-2">
              <div className="w-11 h-11 sm:w-14 sm:h-14 bg-[#1fb05a] border-3 sm:border-4 border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center">
                <CheckCircle className="text-foreground w-5 h-5 sm:w-7 sm:h-7" strokeWidth={2.5} />
              </div>
              <span className="font-black text-3xl sm:text-4xl text-[#1fb05a] drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]">
                {stats.completed}
              </span>
              <span className="font-black uppercase text-[10px] sm:text-xs tracking-wider text-foreground/70">
                Réalisées
              </span>
            </div>

            {/* Séparateur */}
            <div className="w-1 h-20 sm:h-24 bg-foreground/15" />

            {/* Manquées */}
            <div className="flex flex-col items-center gap-2">
              <div className="w-11 h-11 sm:w-14 sm:h-14 bg-[#ff6b6b] border-3 sm:border-4 border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center">
                <XCircle className="text-foreground w-5 h-5 sm:w-7 sm:h-7" strokeWidth={2.5} />
              </div>
              <span className="font-black text-3xl sm:text-4xl text-[#ff6b6b] drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]">
                {stats.missed}
              </span>
              <span className="font-black uppercase text-[10px] sm:text-xs tracking-wider text-foreground/70">
                Manquées
              </span>
            </div>
          </div>

          {/* Sous-total */}
          <div className="mt-4 pt-3 border-t-2 border-dashed border-foreground/20 text-center">
            <span className="text-[10px] sm:text-xs font-bold text-muted uppercase tracking-wider">
              {stats.completed + stats.missed} objectifs au total
            </span>
          </div>
        </motion.div>

        {/* CARTE 2 : POURCENTAGE DE RÉALISATION */}
        <motion.div
          key={`card-rate-${filter}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 30, delay: 0.08 }}
          whileHover={{ scale: 1.01 }}
          className="neo-card bg-surface flex flex-col items-center justify-center p-5 sm:p-6 gap-3 relative overflow-hidden"
        >
          <div 
            className="w-12 h-12 sm:w-14 sm:h-14 border-4 border-foreground shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center"
            style={{ backgroundColor: rateColor }}
          >
            <Target className="text-foreground w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.5} />
          </div>
          <span 
            className="font-black text-4xl sm:text-5xl drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]"
            style={{ color: rateColor }}
          >
            {stats.rate}%
          </span>
          <span className="font-black uppercase text-xs sm:text-sm tracking-wider text-foreground/70">
            Réalisation
          </span>

          {/* Barre de progression */}
          <div className="w-full mt-1">
            <div className="w-full h-3 bg-background border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
              <motion.div
                key={`bar-${filter}-${stats.rate}`}
                initial={{ width: 0 }}
                animate={{ width: `${stats.rate}%` }}
                transition={{ type: "spring", stiffness: 200, damping: 25, delay: 0.3 }}
                className="h-full"
                style={{ backgroundColor: rateColor }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] font-bold text-muted">{stats.completed}/{stats.expected}</span>
              <span className="text-[10px] font-bold text-muted">objectifs</span>
            </div>
          </div>

          <div className="absolute -right-4 -bottom-4 opacity-[0.04] pointer-events-none">
            <Target size={120} strokeWidth={3} />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

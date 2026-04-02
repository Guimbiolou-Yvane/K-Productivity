"use client";

import { SuccessRatePoint } from "@/lib/models/habit";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import SectionInfo from "../SectionInfo";

interface SuccessRateSectionProps {
  filter: "day" | "week" | "month";
  onFilterChange: (filter: "day" | "week" | "month") => void;
  data: SuccessRatePoint[];
}

export default function SuccessRateSection({ filter, onFilterChange, data }: SuccessRateSectionProps) {
  return (
    <section className="flex flex-col gap-4 mt-4">
      <div className="flex items-center gap-3 pl-2 border-l-8 border-[#1fb05a]">
        <h2 className="text-xl sm:text-2xl font-black uppercase text-foreground">
          Bilan comparatif
        </h2>
        <SectionInfo
          title="Bilan comparatif"
          description="Affiche le pourcentage d'objectifs complètement validés sur le lot d'objectifs potentiels via un bar plot dynamique."
          example="Si chaque jeudi tu as 4 objectifs prévus et que tu n'en atteins que 1 chaque jeudi, le taux affiché sera de 25% les jeudis. Pratique pour voir les jours de la semaine ou les mois où tu as un coup de mou !"
        />
      </div>

      {/* FILTRES */}
      <div className="flex gap-2">
        {(["day", "week", "month"] as const).map((f) => (
          <button
            key={f}
            onClick={() => onFilterChange(f)}
            className={`px-3 sm:px-4 py-1.5 font-black text-[10px] sm:text-xs border-2 border-foreground uppercase transition-all ${
              filter === f
                ? "bg-[#1fb05a] shadow-none translate-x-[2px] translate-y-[2px] text-foreground"
                : "bg-surface shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-foreground/70 hover:bg-[#1fb05a]/20 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            }`}
          >
            {f === "day" ? "Jour" : f === "week" ? "Semaine" : "Mois"}
          </button>
        ))}
      </div>

      {/* GRAPHIQUE */}
      <div className="neo-card bg-surface p-4 sm:p-6">
        {data.length === 0 ? (
          <div className="w-full text-center text-muted font-bold text-sm py-8">
            Aucune donnée disponible.
          </div>
        ) : (
          <div className="w-full" style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid
                  strokeDasharray="0"
                  stroke="var(--foreground)"
                  strokeOpacity={0.2}
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  stroke="var(--foreground)"
                  strokeWidth={2}
                  tick={{
                    fill: "var(--foreground)",
                    fontWeight: 900,
                    fontSize: 11,
                  }}
                  tickLine={false}
                />
                <YAxis
                  stroke="var(--foreground)"
                  strokeWidth={2}
                  tick={{ fill: "var(--foreground)", fontWeight: 900, fontSize: 11 }}
                  tickLine={false}
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload as SuccessRatePoint;
                      return (
                        <div className="neo-card bg-surface p-3 !shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-50">
                          <p className="font-black uppercase mb-1 border-b-2 border-foreground pb-1">{label}</p>
                          <p className="font-bold text-sm">Taux : <span className="text-[#1fb05a]">{d.rate}%</span></p>
                          <p className="font-bold text-xs text-muted">{d.completed}/{d.total} objectifs</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                  cursor={{ fill: "var(--foreground)", opacity: 0.05 }}
                />
                <Bar
                  dataKey="rate"
                  stroke="var(--foreground)"
                  strokeWidth={3}
                  radius={[0, 0, 0, 0]}
                  isAnimationActive={true}
                  animationDuration={600}
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.rate >= 80
                          ? "#1fb05a"
                          : entry.rate >= 50
                            ? "#ffda59"
                            : entry.rate > 0
                              ? "#ff6b6b"
                              : "#e5e5e5"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* LÉGENDE */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-4 pt-3 border-t-2 border-dashed border-foreground/30">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-[#1fb05a] border-2 border-foreground" />
            <span className="text-[10px] sm:text-xs font-bold uppercase">≥ 80%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-[#ffda59] border-2 border-foreground" />
            <span className="text-[10px] sm:text-xs font-bold uppercase">≥ 50%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-[#ff6b6b] border-2 border-foreground" />
            <span className="text-[10px] sm:text-xs font-bold uppercase">&lt; 50%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-[#e5e5e5] border-2 border-foreground" />
            <span className="text-[10px] sm:text-xs font-bold uppercase">Aucun</span>
          </div>
        </div>
      </div>
    </section>
  );
}

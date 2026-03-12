"use client";

import { useRef, useEffect } from "react";
import { motion } from "motion/react";
import { Trophy, Flame } from "lucide-react";
import { DailyActivityLog } from "@/lib/models/habit";
import SectionInfo from "../SectionInfo";

interface StreakSectionProps {
  currentStreak: number;
  bestStreak: number;
  recentLogs: DailyActivityLog[];
}

export default function StreakSection({ currentStreak, bestStreak, recentLogs }: StreakSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [recentLogs]);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center gap-3 pl-2 border-l-8 border-primary">
        <h2 className="text-xl sm:text-2xl font-black uppercase text-foreground">
          La Chaîne (Streak)
        </h2>
        <SectionInfo
          title="La Chaîne (Streak)"
          description="Une série correspond au nombre de jours consécutifs où tu as complété TOUTES tes habitudes prévues pour ces journées. Ne brise pas la chaîne !"
          example="Si tu lis 10 pages lundi, et fais du sport mardi (comme prévu), ta série augmente continuellement."
        />
      </div>
      <div className="flex flex-col gap-4 w-full">
        {/* RECORD ABSOLU */}
        <motion.div 
          whileHover={{ scale: 1.01 }}
          className="neo-card bg-surface flex flex-row items-center justify-between p-3 sm:p-4 relative overflow-hidden"
        >
          <div className="flex items-center gap-3 sm:gap-4 z-10 w-full justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-16 sm:h-16 bg-[#ffda59] border-2 sm:border-4 border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center shrink-0 -rotate-3">
                <Trophy className="text-foreground w-5 h-5 sm:w-8 sm:h-8" strokeWidth={2.5} />
              </div>
              <span className="font-black uppercase text-base sm:text-2xl tracking-tighter">Record Absolu</span>
            </div>
            
            <div className="z-10 bg-background border-2 sm:border-4 border-foreground px-3 py-1 sm:px-4 sm:py-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-baseline gap-1">
              <span className="font-black text-2xl sm:text-4xl text-[#ffda59] drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]">
                {bestStreak}
              </span>
              <span className="text-xs sm:text-sm text-foreground font-bold tracking-widest uppercase ml-1">JRS</span>
            </div>
          </div>

          {/* Icône décorative */}
          <div className="absolute right-1/4 top-1/2 -translate-y-1/2 text-[#ffda59] opacity-[0.05] pointer-events-none">
            <Trophy size={100} strokeWidth={3} />
          </div>
        </motion.div>

        {/* SÉRIE ACTUELLE — CERCLES PROPORTIONNELS */}
        <motion.div 
          whileHover={{ scale: 1.01 }}
          className="neo-card bg-surface flex flex-col p-4 sm:p-6 gap-4 relative overflow-hidden h-full justify-between"
        >
          <div className="flex flex-col z-10 w-full h-full">
            <div className="flex justify-between items-start mb-6">
              <span className="font-black uppercase text-lg sm:text-2xl tracking-tighter">Série Actuelle</span>
              <span className="font-black text-2xl sm:text-3xl text-primary drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                {currentStreak} <span className="text-base text-foreground drop-shadow-none">JRS</span>
              </span>
            </div>
            
            <div ref={scrollRef} className="flex flex-row items-end gap-3 sm:gap-5 justify-between sm:justify-start overflow-x-auto pb-4 hide-scrollbar w-full mt-auto scroll-smooth">
              {recentLogs.length === 0 ? (
                <div className="w-full text-center text-muted font-bold text-sm sm:text-base py-4">
                  Commencez votre série aujourd&apos;hui ! 🔥
                </div>
              ) : (
                recentLogs.map((log, index) => {
                  const maxCount = Math.max(...recentLogs.map(l => l.count), 1);
                  const baseSize = 32;
                  const maxSizeVariable = 38; 
                  const size = log.count === 0 ? baseSize : baseSize + (log.count / maxCount) * maxSizeVariable;
                  
                  return (
                    <div key={index} className="flex flex-col items-center gap-2 flex-shrink-0">
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: index * 0.1, type: "spring", stiffness: 300, damping: 20 }}
                        className={`rounded-full border-4 border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center font-black relative overflow-hidden ${log.isToday ? 'ring-4 ring-[#ff6b6b] ring-offset-2 ring-offset-background' : ''}`}
                        style={{ 
                          width: `${size}px`, 
                          height: `${size}px`, 
                          backgroundColor: log.color,
                          color: log.count === 0 ? '#aaa' : '#000',
                          fontSize: `${Math.max(12, size / 2.5)}px`
                        }}
                      >
                        <span className="z-10">{log.count > 0 ? log.count : ''}</span>
                        {log.isToday && log.count > 0 && (
                          <motion.div
                            animate={{ 
                              scale: [1, 1.15, 1],
                              rotate: [-4, 4, -4]
                            }}
                            transition={{ 
                              duration: 1.5, 
                              repeat: Infinity,
                              ease: "easeInOut" 
                            }}
                            className="absolute inset-0 flex items-center justify-center z-0 opacity-50 pointer-events-none"
                          >
                            <Flame size={size * 0.7} strokeWidth={2.5} className="text-foreground" fill="#ff6b6b" />
                          </motion.div>
                        )}
                      </motion.div>
                      <span className={`text-[10px] sm:text-xs font-bold uppercase ${log.isToday ? 'text-[#ff6b6b]' : 'text-muted'}`}>
                        {log.date}
                      </span>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

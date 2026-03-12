"use client";

import { useState, useEffect } from "react";
import { Info, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface SectionInfoProps {
  title: string;
  description: string;
  example?: string;
  className?: string;
}

export default function SectionInfo({ title, description, example, className = "" }: SectionInfoProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className={`shrink-0 w-6 h-6 flex items-center justify-center rounded-full border-2 border-foreground bg-surface text-foreground shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[1px] active:translate-y-[1px] transition-all hover:bg-primary ${className}`}
        aria-label={`Informations sur la section ${title}`}
      >
        <Info size={14} strokeWidth={3} />
      </motion.button>
      
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100]"
            />
            <div className="fixed inset-0 flex items-center justify-center p-4 z-[101] pointer-events-none">
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="w-full max-w-md bg-surface border-4 border-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 pointer-events-auto relative max-h-[90vh] overflow-y-auto custom-scrollbar"
              >
                <button
                  onClick={() => setIsOpen(false)}
                  className="absolute right-4 top-4 hover:bg-red-400 p-1 border-2 border-transparent hover:border-foreground transition-all"
                  aria-label="Fermer"
                >
                  <X strokeWidth={3} />
                </button>

                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-primary p-2 border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <Info size={24} strokeWidth={3} />
                  </div>
                  <h3 className="text-xl font-black uppercase tracking-wider pr-8">{title}</h3>
                </div>
                
                <div className="space-y-4 text-sm sm:text-base font-medium">
                  <p className="leading-relaxed">{description}</p>
                  
                  {example && (
                    <div className="bg-background/50 border-2 border-foreground p-3 mt-4">
                      <h4 className="font-black uppercase text-xs mb-2 text-primary">💡 Exemple</h4>
                      <p className="text-sm italic">{example}</p>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={() => setIsOpen(false)}
                  className="neo-btn !bg-primary w-full mt-6 text-sm font-black uppercase tracking-widest"
                >
                  J'ai compris
                </button>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

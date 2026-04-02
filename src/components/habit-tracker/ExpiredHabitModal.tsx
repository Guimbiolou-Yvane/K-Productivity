import { motion, AnimatePresence } from "motion/react";
import { UIHabit } from "@/lib/models/habit";
import { Check, CalendarPlus, X } from "lucide-react";
import { useState } from "react";
import { habitService } from "@/lib/services/habitService";

interface ExpiredHabitModalProps {
  habit: UIHabit | null;
  onClose: () => void;
  onConcluded: (habitId: string) => void;
  onExtended: (habitId: string) => void;
}

export default function ExpiredHabitModal({ habit, onClose, onConcluded, onExtended }: ExpiredHabitModalProps) {
  const [isExtending, setIsExtending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [extensionWeeks, setExtensionWeeks] = useState(4); // Par défaut 4 semaines

  if (!habit) return null;

  const handleConclude = () => {
    // Stocker dans le layout ou local state que c'est conclu pour le masquer de la liste "le jour suivant"
    localStorage.setItem('concluded_habit_' + habit.id, 'true');
    onConcluded(habit.id);
    onClose();
  };

  const handleExtend = async () => {
    try {
      setIsLoading(true);
      const currentEnd = new Date(habit.end_date);
      currentEnd.setDate(currentEnd.getDate() + (extensionWeeks * 7));
      const newEndDate = currentEnd.toISOString().split("T")[0];

      await habitService.updateHabit(
        habit.id,
        habit.name,
        habit.category,
        habit.frequency,
        habit.color || "",
        habit.icon || "",
        habit.start_date || "",
        newEndDate,
        habit.time
      );
      
      onExtended(habit.id);
      onClose();
    } catch (error) {
      console.error("Erreur lors de la prolongation", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-background/80 backdrop-blur-sm shadow-[inset_0px_0px_0px_4px_rgba(0,0,0,1)]"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="neo-card bg-surface w-full max-w-lg p-0 flex flex-col overflow-hidden max-h-full"
        >
          {/* HEADER */}
          <div className="bg-background border-b-4 border-foreground p-4 flex justify-between items-center relative overflow-hidden">
            <h2 className="text-xl md:text-2xl font-black uppercase text-foreground z-10">
              Objectif arrivé à terme
            </h2>
            <button
              onClick={onClose}
              className="neo-btn !p-2 bg-red-400 z-10"
              disabled={isLoading}
            >
              <X strokeWidth={4} size={20} className="text-foreground" />
            </button>
          </div>

          {/* CONTENU */}
          <div className="p-6">
            <p className="text-base text-foreground font-bold mb-6">
              L'objectif <span className="uppercase text-primary">« {habit.name} »</span> a atteint sa date de fin prévue ({new Date(habit.end_date).toLocaleDateString("fr-FR")}). Félicitations pour votre parcours !
            </p>
            <p className="text-sm text-foreground/70 mb-4 font-bold italic">
              Souhaitez-vous le marquer comme définitivement accompli, ou prolonger sa durée ?
            </p>

            <div className="flex flex-col gap-4 w-full">
              {/* SLIDER DE PROLONGATION */}
              <div className="bg-background border-2 border-foreground p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <label className="text-xs sm:text-sm font-black uppercase text-foreground mb-4 flex justify-between items-center">
                  <span>Prolongation</span>
                  <span className="bg-primary text-black px-2 py-1 border-2 border-foreground shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                    {extensionWeeks} {extensionWeeks > 1 ? "semaines" : "semaine"}
                  </span>
                </label>
                <input 
                  type="range" 
                  min="1" 
                  max="52" 
                  value={extensionWeeks}
                  onChange={(e) => setExtensionWeeks(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary border-2 border-foreground"
                />
                <div className="flex justify-between text-[10px] font-bold text-foreground/50 mt-2">
                  <span>1 sem.</span>
                  <span>1 an</span>
                </div>
              </div>

              {/* BOUTONS D'ACTION */}
              <div className="flex flex-col sm:flex-row gap-4 w-full mt-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleConclude}
                  disabled={isLoading}
                  className="flex-1 bg-green-400 border-4 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 flex flex-col items-center justify-center gap-2 uppercase font-black transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                >
                  <Check strokeWidth={4} size={28} className="text-foreground" />
                  <span>Objectif Conclu</span>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setIsExtending(true);
                    handleExtend();
                  }}
                  disabled={isLoading}
                  className="flex-1 bg-primary border-4 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 flex flex-col items-center justify-center gap-2 uppercase font-black transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                >
                  <CalendarPlus strokeWidth={4} size={28} className="text-foreground" />
                  <span>Prolonger (+{extensionWeeks} sem.)</span>
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

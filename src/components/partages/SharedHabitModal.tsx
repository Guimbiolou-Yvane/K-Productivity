import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Check } from "lucide-react";
import { HabitCategory } from "@/lib/models/habit";
import { PRESET_COLORS } from "@/components/habit-tracker/constants";

export interface SharedHabitFormData {
  name: string;
  category: HabitCategory;
  frequency: string[];
  color?: string;
  icon?: string;
  startDate: string;
  endDate: string;
  time?: string;
}

interface SharedHabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: SharedHabitFormData) => void;
}

export default function SharedHabitModal({ isOpen, onClose, onSave }: SharedHabitModalProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<HabitCategory>("GÉNÉRAL");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [icon, setIcon] = useState("🚀");
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      category,
      frequency: ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"], // Quotidien par défaut pour simplicité
      color,
      icon,
      startDate,
      endDate
    });
    
    // Reset form
    setName("");
    setCategory("GÉNÉRAL");
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      >
        <motion.div 
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="neo-card w-full max-w-md bg-surface relative flex flex-col max-h-[90vh]"
        >
          {/* BOUTON FERMER */}
          <motion.button 
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="absolute -top-3 -right-3 z-10 bg-primary border-4 border-foreground p-1 hover:bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
          >
            <X strokeWidth={4} />
          </motion.button>
          
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight mb-4 border-b-4 border-foreground pb-2">
            Nouvel Objectif Commun
          </h2>
          
          <form onSubmit={handleSubmit} className="flex flex-col gap-6 overflow-y-auto pr-2 pb-2">
            <div className="flex flex-col gap-2">
              <label className="font-bold uppercase tracking-wider text-sm">Nom de l'objectif</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="EX: MANGER 5 FRUITS..."
                className="neo-input font-bold"
                autoFocus
                required
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 flex flex-col gap-2">
                <label className="font-bold uppercase tracking-wider text-sm">Catégorie</label>
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value as HabitCategory)}
                  className="neo-input font-bold uppercase cursor-pointer"
                >
                  <option value="SANTÉ">SANTÉ</option>
                  <option value="DÉV. PERSO">DÉV. PERSO</option>
                  <option value="TRAVAIL">TRAVAIL</option>
                  <option value="SOCIAL">SOCIAL</option>
                  <option value="SPORT">SPORT</option>
                  <option value="MÉDITATION">MÉDITATION</option>
                  <option value="ÉCOLE">ÉCOLE</option>
                  <option value="GÉNÉRAL">GÉNÉRAL</option>
                </select>
              </div>
              <div className="flex-1 flex flex-col gap-2">
                <label className="font-bold uppercase tracking-wider text-sm">Départ (YYYY-MM-DD)</label>
                <input 
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="neo-input font-bold"
                  required
                />
              </div>
            </div>

            <button type="submit" className="neo-btn bg-primary mt-2">
              Ajouter au groupe
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

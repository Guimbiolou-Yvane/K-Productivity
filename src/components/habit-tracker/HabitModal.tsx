"use client";

import { useState, useEffect } from "react";
import { Check, X, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { UIHabit, HabitCategory } from "@/lib/models/habit";
import { DAYS, PRESET_COLORS, PRESET_ICONS } from "./constants";

export interface HabitFormData {
  name: string;
  category: HabitCategory;
  frequency: string[];
  color: string;
  icon: string;
  time?: string;
  startDate: string;
  endDate: string;
  linked_goal_id?: string;
}

interface HabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  habitToEdit: UIHabit | null; // null = mode ajout
  onSave: (data: HabitFormData) => Promise<void>;
  onDelete: (habitId: string) => Promise<void>;
}

export default function HabitModal({ isOpen, onClose, habitToEdit, onSave, onDelete }: HabitModalProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<HabitCategory>("GÉNÉRAL");
  const [frequency, setFrequency] = useState<string[]>(DAYS);
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [icon, setIcon] = useState(PRESET_ICONS[0]);
  const [time, setTime] = useState("");
  const [isTimeEnabled, setIsTimeEnabled] = useState(false);
  const [linkedGoalId, setLinkedGoalId] = useState("");
  const [goals, setGoals] = useState<{id: string, title: string, icon: string}[]>([]);
  
  // Fetch goals
  useEffect(() => {
    if (isOpen) {
      import("@/lib/supabase/client").then(async ({ supabase }) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase.from('goals').select('id, title, icon').eq('user_id', user.id);
          if (data) setGoals(data);
        }
      });
    }
  }, [isOpen]);
  
  // Date et durée
  const todayStr = new Date().toISOString().split("T")[0];
  const [startDate, setStartDate] = useState(todayStr);
  const [durationWeeks, setDurationWeeks] = useState(1);
  const [endDate, setEndDate] = useState(() => {
    const d = new Date(todayStr);
    d.setDate(d.getDate() + 6);
    return d.toISOString().split("T")[0];
  });

  // Réinitialiser le formulaire quand le modal s'ouvre ou que l'habit change
  useEffect(() => {
    if (isOpen) {
      if (habitToEdit) {
        setName(habitToEdit.name);
        setCategory(habitToEdit.category);
        setFrequency(habitToEdit.frequency || DAYS);
        setColor(habitToEdit.color || PRESET_COLORS[0]);
        setIcon(habitToEdit.icon || PRESET_ICONS[0]);
        setTime(habitToEdit.time || "");
        setIsTimeEnabled(!!habitToEdit.time);
        setLinkedGoalId(habitToEdit.linked_goal_id || "");
        setStartDate(habitToEdit.start_date || todayStr);
        
        // Calcul de la durée en semaines entre start_date et end_date
        if (habitToEdit.start_date && habitToEdit.end_date) {
          const start = new Date(habitToEdit.start_date);
          const end = new Date(habitToEdit.end_date);
          const diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          const diffWeeks = Math.max(1, Math.min(24, Math.ceil(diffDays / 7)));
          setDurationWeeks(diffWeeks);
          setEndDate(habitToEdit.end_date);
        } else {
          setDurationWeeks(1);
          const endObj = new Date(todayStr);
          endObj.setDate(endObj.getDate() + 6);
          setEndDate(endObj.toISOString().split("T")[0]);
        }
      } else {
        setName("");
        setCategory("GÉNÉRAL");
        setFrequency(DAYS);
        setColor(PRESET_COLORS[0]);
        setIcon(PRESET_ICONS[0]);
        setTime("");
        setIsTimeEnabled(false);
        setLinkedGoalId("");
        setStartDate(todayStr);
        setDurationWeeks(1);
        const endObj = new Date(todayStr);
        endObj.setDate(endObj.getDate() + 6);
        setEndDate(endObj.toISOString().split("T")[0]);
      }
    }
  }, [isOpen, habitToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    await onSave({
      name: name.toUpperCase(),
      category,
      frequency,
      color,
      icon,
      time: isTimeEnabled && time ? time : undefined,
      startDate,
      endDate,
      linked_goal_id: linkedGoalId || undefined,
    });
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
          className="neo-card w-full max-w-md bg-surface relative flex flex-col max-h-[85vh] sm:max-h-[90vh]"
        >
          {/* BOUTON FERMER */}
          <motion.button 
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 z-10 bg-primary border-4 border-foreground p-1 hover:bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
          >
            <X strokeWidth={4} />
          </motion.button>
          
          {/* HEADER */}
          <div className="flex items-center justify-between mb-4 border-b-4 border-foreground pb-2 shrink-0">
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight">
              {habitToEdit ? "Modifier Objectif" : "Nouvel Objectif"}
            </h2>
            {habitToEdit && (
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                type="button"
                onClick={() => onDelete(habitToEdit.id)}
                className="p-2 border-2 border-foreground bg-red-500 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-red-600 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all mr-6"
                aria-label="Supprimer cet objectif"
              >
                <Trash2 size={20} />
              </motion.button>
            )}
          </div>
          
          {/* FORMULAIRE */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-6 overflow-y-auto overflow-x-hidden pr-2 pb-2">
            {/* NOM */}
            <div className="flex flex-col gap-2">
              <label className="font-bold uppercase tracking-wider text-sm">Nom de l&apos;objectif</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="EX: MANGER 5 FRUITS..."
                className="neo-input font-bold"
                autoFocus
              />
            </div>

            {/* CATÉGORIE + HEURE */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 flex flex-col gap-2">
                <label className="font-bold uppercase tracking-wider text-sm flex items-center justify-between">
                  <span>Catégorie</span>
                </label>
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value as HabitCategory)}
                  className="neo-input font-bold uppercase cursor-pointer appearance-none bg-surface"
                  style={{ backgroundImage: 'linear-gradient(45deg, transparent 50%, black 50%), linear-gradient(135deg, black 50%, transparent 50%)', backgroundPosition: 'calc(100% - 20px) calc(1em + 2px), calc(100% - 15px) calc(1em + 2px)', backgroundSize: '5px 5px, 5px 5px', backgroundRepeat: 'no-repeat' }}
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
              
              <div className="flex-[0.6] flex flex-col gap-2">
                <label 
                  className="font-bold uppercase tracking-wider text-sm flex items-center justify-between cursor-pointer"
                  onClick={() => setIsTimeEnabled(!isTimeEnabled)}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 border-2 border-foreground flex items-center justify-center transition-colors ${isTimeEnabled ? 'bg-primary' : 'bg-surface'}`}>
                      {isTimeEnabled && <Check size={12} strokeWidth={4} />}
                    </div>
                    <span>Heure</span>
                  </div>
                </label>
                <input 
                  type="time" 
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  disabled={!isTimeEnabled}
                  className={`neo-input font-bold transition-opacity ${!isTimeEnabled ? 'opacity-40 cursor-not-allowed bg-gray-200' : 'cursor-pointer'}`}
                />
              </div>
            </div>

            {/* COULEUR + ICÔNE */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 flex flex-col gap-2">
                <label className="font-bold uppercase tracking-wider text-sm">Couleur</label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map(c => (
                    <motion.button
                      key={c}
                      type="button"
                      whileTap={{ scale: 0.8 }}
                      onClick={() => setColor(c)}
                      className={`w-8 h-8 rounded-full border-4 border-foreground transition-transform ${color === c ? 'scale-110 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'opacity-50 hover:opacity-100'}`}
                      style={{ backgroundColor: c }}
                      aria-label={`Couleur ${c}`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex-1 flex flex-col gap-2">
                <label className="font-bold uppercase tracking-wider text-sm">Icône</label>
                <div className="flex flex-wrap gap-1">
                  {PRESET_ICONS.map(ic => (
                    <motion.button
                      key={ic}
                      type="button"
                      whileTap={{ scale: 0.8 }}
                      onClick={() => setIcon(ic)}
                      className={`w-8 h-8 flex items-center justify-center text-xl transition-transform ${icon === ic ? 'scale-125 bg-surface border-2 border-foreground rounded' : 'opacity-60 hover:opacity-100'}`}
                    >
                      {ic}
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
            
            {/* OBJECTIF LONG TERME LIÉ (Optionnel) */}
            {goals.length > 0 && (
              <div className="flex flex-col gap-2">
                <label className="font-bold uppercase tracking-wider text-sm flex items-center justify-between">
                  <span>Lier à un grand objectif</span>
                  <span className="text-[10px] text-foreground/50 border border-foreground/30 px-1 rounded">Optionnel</span>
                </label>
                <select 
                  value={linkedGoalId}
                  onChange={(e) => setLinkedGoalId(e.target.value)}
                  className="neo-input font-bold cursor-pointer appearance-none bg-surface"
                  style={{ backgroundImage: 'linear-gradient(45deg, transparent 50%, black 50%), linear-gradient(135deg, black 50%, transparent 50%)', backgroundPosition: 'calc(100% - 20px) calc(1em + 2px), calc(100% - 15px) calc(1em + 2px)', backgroundSize: '5px 5px, 5px 5px', backgroundRepeat: 'no-repeat' }}
                >
                  <option value="">-- Aucun objectif --</option>
                  {goals.map(g => (
                    <option key={g.id} value={g.id}>{g.icon} {g.title}</option>
                  ))}
                </select>
              </div>
            )}
            
            {/* DATE DE DÉBUT ET DURÉE */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-[0.5] flex flex-col gap-2">
                  <label className="font-bold uppercase tracking-wider text-sm flex items-center justify-between">
                    <span>Début</span>
                  </label>
                  <input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      if (e.target.value) {
                        const d = new Date(e.target.value);
                        d.setDate(d.getDate() + durationWeeks * 7 - 1);
                        setEndDate(d.toISOString().split("T")[0]);
                      }
                    }}
                    className="neo-input font-bold text-sm"
                    required
                  />
                </div>

                <div className="flex-[0.5] flex flex-col gap-2">
                  <label className="font-bold uppercase tracking-wider text-sm">Date de fin</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      if (e.target.value && startDate) {
                        const start = new Date(startDate);
                        const end = new Date(e.target.value);
                        const diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                        if (diffDays > 0) {
                          const diffWeeks = Math.max(1, Math.min(24, Math.ceil(diffDays / 7)));
                          setDurationWeeks(diffWeeks);
                        }
                      }
                    }}
                    min={startDate}
                    className="neo-input font-bold text-sm bg-surface"
                    required
                  />
                </div>
              </div>

              <div className="flex-1 flex flex-col gap-2">
                <label className="font-bold uppercase tracking-wider text-sm flex items-center justify-between">
                  <span>DURÉE ({durationWeeks} {durationWeeks > 1 ? 'semaines' : 'semaine'})</span>
                  <span className="text-[10px] text-foreground/50">Max: 24 sem.</span>
                </label>
                <div className="flex items-center gap-3">
                  <input 
                    type="range" 
                    min={1} 
                    max={24} 
                    value={durationWeeks}
                    onChange={(e) => {
                      const weeks = parseInt(e.target.value);
                      setDurationWeeks(weeks);
                      if (startDate) {
                        const d = new Date(startDate);
                        d.setDate(d.getDate() + weeks * 7 - 1);
                        setEndDate(d.toISOString().split("T")[0]);
                      }
                    }}
                    className="w-full h-3 bg-surface border-2 border-foreground rounded appearance-none cursor-pointer"
                    style={{
                      backgroundImage: `linear-gradient(var(--primary), var(--primary))`,
                      backgroundSize: `${((durationWeeks - 1) / 23) * 100}% 100%`,
                      backgroundRepeat: "no-repeat"
                    }}
                  />
                  <span className="font-black text-sm w-6 text-right">{durationWeeks}</span>
                </div>
              </div>
            </div>

            {/* FRÉQUENCE */}
            <div className="flex flex-col gap-2">
              <label className="font-bold uppercase tracking-wider text-sm flex justify-between">
                <span>Fréquence</span>
                {frequency.length === 0 && (
                  <span className="text-red-500 text-xs text-right">Sélectionner au moins un jour</span>
                )}
              </label>
              <div className="flex flex-wrap gap-2 mb-1">
                <button type="button" onClick={() => setFrequency(DAYS)} className={`text-[10px] sm:text-xs px-2 py-1 border-4 border-foreground font-black uppercase transition-colors ${frequency.length === 7 ? 'bg-primary shadow-none translate-x-[2px] translate-y-[2px]' : 'bg-surface shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none'}`}>Tous les jours</button>
                <button type="button" onClick={() => setFrequency(["Lun", "Mar", "Mer", "Jeu", "Ven"])} className={`text-[10px] sm:text-xs px-2 py-1 border-4 border-foreground font-black uppercase transition-colors ${frequency.length === 5 && !frequency.includes("Sam") ? 'bg-primary shadow-none translate-x-[2px] translate-y-[2px]' : 'bg-surface shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none'}`}>Jours Ouvrés</button>
                <button type="button" onClick={() => setFrequency(["Sam", "Dim"])} className={`text-[10px] sm:text-xs px-2 py-1 border-4 border-foreground font-black uppercase transition-colors ${frequency.length === 2 && frequency.includes("Sam") ? 'bg-primary shadow-none translate-x-[2px] translate-y-[2px]' : 'bg-surface shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none'}`}>Week-end</button>
              </div>
              <div className="flex justify-between border-4 border-foreground p-1 bg-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                {DAYS.map(day => {
                  const isSelected = frequency.includes(day);
                  return (
                    <button 
                      key={day}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setFrequency(prev => prev.filter(d => d !== day));
                        } else {
                          setFrequency(prev => [...prev, day]);
                        }
                      }}
                      className={`flex-1 text-center py-2 text-xs sm:text-sm font-black uppercase transition-colors border-2 ${isSelected ? 'bg-primary text-foreground border-foreground' : 'bg-transparent text-muted/60 border-transparent hover:text-foreground active:bg-primary/20'}`}
                    >
                      {day.substring(0, 1)}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* BOUTON VALIDER */}
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit" 
              className="neo-btn mt-2 bg-primary text-center justify-center tracking-widest cursor-pointer"
            >
              VALIDER L&apos;OBJECTIF
            </motion.button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

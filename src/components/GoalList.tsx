"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Goal,
  GoalCategory,
  GoalDuration,
  GOAL_DURATION_LABELS,
  GOAL_CATEGORIES,
  GOAL_ICONS,
  GOAL_COLORS,
} from "@/lib/models/goal";
import { goalService } from "@/lib/services/goalService";
import {
  Plus,
  Trash2,
  Check,
  Trophy,
  X,
  Calendar,
  Clock,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import SectionInfo from "./SectionInfo";
import SectionSkeleton from "@/components/SectionSkeleton";
import { supabase } from "@/lib/supabase/client";

interface GoalListProps {
  profileUserId?: string;
  readOnly?: boolean;
}

export default function GoalList({
  profileUserId,
  readOnly,
}: GoalListProps = {}) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [goalToEdit, setGoalToEdit] = useState<Goal | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<GoalCategory | "TOUS">("TOUS");
  const [isCollapsed, setIsCollapsed] = useState(true);

  // Persistence du state isCollapsed
  useEffect(() => {
    const saved = localStorage.getItem("goalListCollapsed");
    if (saved !== null) {
      setIsCollapsed(saved === "true");
    }
  }, []);

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("goalListCollapsed", String(newState));
  };

  useEffect(() => {
    loadGoals();
  }, []);

  // Realtime
  useEffect(() => {
    if (readOnly) return;
    const channel = supabase
      .channel("goals-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "goals" },
        () => { loadGoals(); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [readOnly]);

  const loadGoals = async () => {
    try {
      setIsLoading(true);
      const data = await goalService.fetchGoals(profileUserId);
      setGoals(data);
    } catch (error) {
      console.error("Erreur de chargement des objectifs :", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleGoal = async (goal: Goal, e: React.MouseEvent) => {
    e.stopPropagation();
    if (readOnly) return;
    try {
      setGoals((current) =>
        current.map((g) =>
          g.id === goal.id
            ? { ...g, is_completed: !g.is_completed, completed_at: !g.is_completed ? new Date().toISOString() : undefined }
            : g
        )
      );
      await goalService.toggleGoal(goal.id, !goal.is_completed);
    } catch (error) {
      console.error("Erreur au toggle :", error);
      await loadGoals();
    }
  };

  const deleteGoal = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (readOnly) return;
    try {
      setGoals((current) => current.filter((g) => g.id !== id));
      await goalService.deleteGoal(id);
    } catch (error) {
      console.error("Erreur à la suppression :", error);
      await loadGoals();
    }
  };

  const handleSave = async (goal: Goal) => {
    if (goalToEdit) {
      setGoals((current) => current.map((g) => (g.id === goalToEdit.id ? goal : g)));
    } else {
      setGoals((current) => [...current, goal]);
    }
    setIsModalOpen(false);
    setGoalToEdit(null);
  };

  const openEdit = (goal: Goal) => {
    if (readOnly) return;
    setGoalToEdit(goal);
    setIsModalOpen(true);
  };

  // Calcul progression
  const getProgress = (goal: Goal) => {
    if (goal.is_completed) return 100;
    const start = new Date(goal.start_date).getTime();
    const end = new Date(goal.target_date).getTime();
    const now = Date.now();
    if (now >= end) return 100;
    if (now <= start) return 0;
    return Math.round(((now - start) / (end - start)) * 100);
  };

  const getTimeRemaining = (goal: Goal) => {
    if (goal.is_completed) return "Terminé ✅";
    const now = new Date();
    const target = new Date(goal.target_date);
    const diffMs = target.getTime() - now.getTime();
    if (diffMs <= 0) return "Échéance dépassée";
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (days === 0) return "Aujourd'hui";
    if (days === 1) return "Demain";
    if (days < 7) return `${days} jours`;
    if (days < 30) return `${Math.ceil(days / 7)} sem.`;
    if (days < 365) return `${Math.ceil(days / 30)} mois`;
    return `${Math.floor(days / 365)} an${Math.floor(days / 365) > 1 ? "s" : ""}`;
  };

  const availableCategories = useMemo(() => {
    const cats = new Set(goals.map((g) => g.category));
    return ["TOUS", ...Array.from(cats)];
  }, [goals]);

  const filteredGoals = useMemo(() => {
    if (categoryFilter === "TOUS") return goals;
    return goals.filter((g) => g.category === categoryFilter);
  }, [goals, categoryFilter]);

  const activeGoals = filteredGoals.filter((g) => !g.is_completed);
  const completedGoals = filteredGoals.filter((g) => g.is_completed);

  if (isLoading && goals.length === 0) return <SectionSkeleton />;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full max-w-6xl mx-auto px-4 md:px-8 mt-4 mb-0"
    >
      <button
        onClick={toggleCollapse}
        className="flex items-center gap-3 mb-4 w-full text-left group cursor-pointer"
      >
        <div className="w-9 h-9 flex items-center justify-center bg-purple-400 dark:bg-purple-400/30 border-[3px] border-foreground dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(100,100,100,0.3)] shrink-0">
          <Trophy size={18} strokeWidth={3} className="dark:text-white" />
        </div>
        <motion.div
          animate={{ rotate: isCollapsed ? -90 : 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="shrink-0"
        >
          <ChevronDown size={20} strokeWidth={3} className="text-foreground/50 group-hover:text-foreground transition-colors" />
        </motion.div>
        <h2 className="text-xl sm:text-2xl font-black uppercase text-foreground">
          Objectifs long terme
        </h2>
        <SectionInfo
          title="Objectifs sur le long terme"
          description="Vos grands projets de vie à réaliser dans une période déterminée. Contrairement aux habitudes répétitives, ces objectifs ont une date cible précise."
          example="Acheter une voiture, Réussir mon bac, Économiser 5000€"
        />
        <div className="bg-purple-100 border-2 border-black px-2 py-0.5 rounded flex items-center gap-1.5 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] ml-auto">
          <Trophy size={12} strokeWidth={3} className="text-black" />
          <span className="text-[10px] font-black uppercase text-black">
            {activeGoals.length} en cours
          </span>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="overflow-hidden"
          >
      <div className="bg-surface border-4 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 md:p-6 pb-2">
        {/* FILTRES + AJOUTER */}
        <div className="flex items-center justify-between mb-4 gap-3">
          {availableCategories.length > 2 && (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-[10px] font-black uppercase text-foreground/60 whitespace-nowrap shrink-0">Filtrer par :</span>
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
              onClick={() => { setGoalToEdit(null); setIsModalOpen(true); }}
              className="bg-black hover:bg-neutral-800 text-white font-black uppercase border-4 border-foreground px-4 py-2 flex items-center justify-center gap-2 transition-colors shrink-0 text-sm"
            >
              <Plus strokeWidth={4} size={18} />
              <span className="hidden sm:inline">AJOUTER</span>
            </motion.button>
          )}
        </div>

        {/* LISTE */}
        {isLoading && goals.length === 0 ? (
          <div className="flex flex-col gap-3 pb-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={`skel-${i}`} className="bg-surface border-4 border-gray-200 p-4 flex items-center gap-4 animate-pulse">
                <div className="w-12 h-12 bg-gray-200 border-4 border-gray-200 shrink-0" />
                <div className="flex-1 flex flex-col gap-2">
                  <div className="h-4 bg-gray-200 w-2/3" />
                  <div className="h-3 bg-gray-200 w-1/3" />
                  <div className="h-2 bg-gray-200 w-full mt-1" />
                </div>
              </div>
            ))}
          </div>
        ) : goals.length === 0 ? (
          <div className="text-center p-8 border-4 border-dashed border-foreground/30 font-black uppercase text-foreground/50 bg-background/50">
            Aucun objectif long terme.
          </div>
        ) : (
          <div className="flex flex-col gap-5 pb-4">
            {/* OBJECTIFS ACTIFS */}
            {activeGoals.length > 0 && (
              <div className="flex flex-col gap-3">
                <AnimatePresence mode="popLayout">
                  {activeGoals.map((goal) => (
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      progress={getProgress(goal)}
                      timeRemaining={getTimeRemaining(goal)}
                      onToggle={toggleGoal}
                      onDelete={deleteGoal}
                      onClick={() => openEdit(goal)}
                      readOnly={readOnly}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* OBJECTIFS TERMINÉS */}
            {completedGoals.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="font-black uppercase text-xs tracking-widest text-foreground/40">
                    Terminés ({completedGoals.length})
                  </span>
                  <div className="flex-1 h-[2px] bg-foreground/10" />
                </div>
                <div className="flex flex-col gap-3">
                  <AnimatePresence mode="popLayout">
                    {completedGoals.map((goal) => (
                      <GoalCard
                        key={goal.id}
                        goal={goal}
                        progress={100}
                        timeRemaining={getTimeRemaining(goal)}
                        onToggle={toggleGoal}
                        onDelete={deleteGoal}
                        onClick={() => openEdit(goal)}
                        readOnly={readOnly}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL */}
      {isModalOpen && (
        <GoalModal
          goal={goalToEdit}
          onClose={() => { setIsModalOpen(false); setGoalToEdit(null); }}
          onSave={handleSave}
          onDelete={goalToEdit ? (id) => { setGoals((c) => c.filter((g) => g.id !== id)); setIsModalOpen(false); setGoalToEdit(null); } : undefined}
        />
      )}
    </motion.div>
  );
}

// ============================================================
// GOAL CARD
// ============================================================

function GoalCard({
  goal,
  progress,
  timeRemaining,
  onToggle,
  onDelete,
  onClick,
  readOnly,
}: {
  goal: Goal;
  progress: number;
  timeRemaining: string;
  onToggle: (goal: Goal, e: React.MouseEvent) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onClick: () => void;
  readOnly?: boolean;
}) {
  const isOverdue = !goal.is_completed && new Date(goal.target_date) < new Date();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, x: -20 }}
      whileHover={readOnly ? {} : { scale: 1.01 }}
      onClick={onClick}
      className={`border-4 border-foreground p-4 transition-all relative overflow-hidden ${
        goal.is_completed
          ? "shadow-none"
          : `bg-surface shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${readOnly ? "" : "hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] cursor-pointer"}`
      }`}
      style={goal.is_completed ? { backgroundColor: goal.color } : {}}
    >
      {/* Barre couleur gauche (masquée si complété car la carte entière est colorée) */}
      {!goal.is_completed && (
        <div
          className="absolute top-0 left-0 w-2 h-full"
          style={{ backgroundColor: goal.color }}
        />
      )}

      <div className="flex items-center gap-3 md:gap-4 pl-3">
        {/* Icône */}
        <div
          className={`w-12 h-12 shrink-0 flex items-center justify-center border-[3px] border-foreground text-2xl ${
            goal.is_completed ? "bg-white/30 shadow-none" : "shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          }`}
          style={{ backgroundColor: goal.color }}
        >
          {goal.icon}
        </div>

        {/* Contenu */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] font-bold text-muted uppercase italic tracking-wider">
              {goal.category}
            </span>
            {isOverdue && (
              <span className="text-[9px] font-black uppercase bg-red-400 text-white px-1.5 py-0.5 border-2 border-foreground">
                En retard
              </span>
            )}
          </div>
          <span className={`font-black text-base leading-tight block truncate ${goal.is_completed ? "text-foreground" : ""}`}>
            {goal.title}
          </span>

          {/* Barre de progression */}
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-3 bg-background border-2 border-foreground overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
                className="h-full"
                style={{ backgroundColor: goal.is_completed ? "#1fb05a" : goal.color }}
              />
            </div>
            <span className="text-[10px] font-black text-foreground/60 whitespace-nowrap shrink-0">
              {progress}%
            </span>
          </div>

          {/* Info temps restant */}
          <div className="flex items-center gap-3 mt-1.5">
            <div className="flex items-center gap-1 text-[10px] font-bold text-muted">
              <Clock size={10} strokeWidth={3} />
              {timeRemaining}
            </div>
            <div className="flex items-center gap-1 text-[10px] font-bold text-muted">
              <Calendar size={10} strokeWidth={3} />
              {new Date(goal.target_date).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {!readOnly && (
            <>
              <motion.button
                whileTap={{ scale: 0.8 }}
                onClick={(e) => onToggle(goal, e)}
                className={`w-10 h-10 rounded-full border-4 border-foreground flex items-center justify-center transition-all ${
                  goal.is_completed
                    ? "bg-green-500 shadow-none"
                    : "bg-surface shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
                }`}
              >
                {goal.is_completed && (
                  <Check strokeWidth={5} className="w-5 h-5 text-white" />
                )}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 10 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => onDelete(goal.id, e)}
                className="p-2 bg-surface border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] hidden sm:flex"
                aria-label="Supprimer"
              >
                <Trash2 size={14} strokeWidth={3} className="text-red-500" />
              </motion.button>
            </>
          )}
          {readOnly && (
            <ChevronRight size={20} strokeWidth={3} className="text-foreground/30" />
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================
// GOAL MODAL
// ============================================================

function GoalModal({
  goal,
  onClose,
  onSave,
  onDelete,
}: {
  goal: Goal | null;
  onClose: () => void;
  onSave: (goal: Goal) => void;
  onDelete?: (id: string) => void;
}) {
  const isEditing = !!goal;

  const [title, setTitle] = useState(goal?.title || "");
  const [description, setDescription] = useState(goal?.description || "");
  const [category, setCategory] = useState<GoalCategory>(goal?.category || "GÉNÉRAL");
  const [icon, setIcon] = useState(goal?.icon || GOAL_ICONS[0]);
  const [color, setColor] = useState(goal?.color || GOAL_COLORS[0]);
  const [duration, setDuration] = useState<GoalDuration>(goal?.duration || "1_year");
  const [targetDate, setTargetDate] = useState(goal?.target_date || "");
  const [isSaving, setIsSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Calculer la date cible quand la durée change
  useEffect(() => {
    if (duration === "custom") return;
    const now = new Date();
    const durations: Record<string, number> = {
      "1_week": 7,
      "2_weeks": 14,
      "1_month": 30,
      "3_months": 90,
      "6_months": 180,
      "1_year": 365,
      "2_years": 730,
      "5_years": 1825,
    };
    const days = durations[duration] || 365;
    const target = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    setTargetDate(target.toISOString().split("T")[0]);
  }, [duration]);

  // Initialiser date si édition avec duration custom
  useEffect(() => {
    if (goal && !targetDate) {
      setTargetDate(goal.target_date);
    }
  }, [goal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !targetDate) return;

    setIsSaving(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      if (isEditing) {
        const updated = await goalService.updateGoal(
          goal.id, title, category, icon, color, duration,
          goal.start_date, targetDate, description
        );
        onSave(updated);
      } else {
        const added = await goalService.addGoal(
          title, category, icon, color, duration,
          today, targetDate, description
        );
        onSave(added);
      }
    } catch (error) {
      console.error("Erreur sauvegarde :", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!goal || !onDelete) return;
    try {
      await goalService.deleteGoal(goal.id);
      onDelete(goal.id);
    } catch (error) {
      console.error("Erreur suppression :", error);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        key="goal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center"
      >
        <motion.div
          key="goal-modal"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 400, damping: 35 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-surface border-4 border-foreground shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-none sm:rounded-none"
        >
          {/* HEADER */}
          <div className="flex items-center justify-between p-4 border-b-4 border-foreground bg-primary sticky top-0 z-10">
            <h3 className="font-black uppercase text-lg">
              {isEditing ? "Modifier l'objectif" : "Nouvel objectif long terme"}
            </h3>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="p-1.5 border-2 border-foreground bg-surface shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
            >
              <X size={18} strokeWidth={3} />
            </motion.button>
          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4">
            {/* Titre */}
            <div>
              <label className="text-xs font-black uppercase text-foreground/60 mb-1 block">
                Titre de l'objectif *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Acheter une voiture"
                className="neo-input w-full"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-black uppercase text-foreground/60 mb-1 block">
                Description (optionnel)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Détails, étapes, motivations..."
                className="neo-input w-full resize-none h-20"
                rows={3}
              />
            </div>

            {/* Catégorie */}
            <div>
              <label className="text-xs font-black uppercase text-foreground/60 mb-2 block">
                Catégorie
              </label>
              <div className="flex flex-wrap gap-1.5">
                {GOAL_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`px-2.5 py-1 font-black text-[10px] border-[3px] border-foreground uppercase transition-all ${
                      category === cat
                        ? "bg-foreground text-background shadow-none"
                        : "bg-surface shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Icône */}
            <div>
              <label className="text-xs font-black uppercase text-foreground/60 mb-2 block">
                Icône
              </label>
              <div className="flex flex-wrap gap-2">
                {GOAL_ICONS.map((ic) => (
                  <button
                    key={ic}
                    type="button"
                    onClick={() => setIcon(ic)}
                    className={`w-10 h-10 text-xl flex items-center justify-center border-[3px] border-foreground transition-all ${
                      icon === ic
                        ? "bg-primary shadow-none scale-110"
                        : "bg-surface shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none"
                    }`}
                  >
                    {ic}
                  </button>
                ))}
              </div>
            </div>

            {/* Couleur */}
            <div>
              <label className="text-xs font-black uppercase text-foreground/60 mb-2 block">
                Couleur
              </label>
              <div className="flex flex-wrap gap-2">
                {GOAL_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-9 h-9 border-[3px] border-foreground transition-all ${
                      color === c
                        ? "shadow-none scale-110 ring-2 ring-foreground ring-offset-2"
                        : "shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {/* Durée */}
            <div>
              <label className="text-xs font-black uppercase text-foreground/60 mb-2 block">
                À réaliser en
              </label>
              <div className="flex flex-wrap gap-1.5">
                {(Object.entries(GOAL_DURATION_LABELS) as [GoalDuration, string][]).map(
                  ([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setDuration(key)}
                      className={`px-2.5 py-1.5 font-black text-[10px] border-[3px] border-foreground uppercase transition-all ${
                        duration === key
                          ? "bg-foreground text-background shadow-none"
                          : "bg-surface shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
                      }`}
                    >
                      {label}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Date cible (visible si custom OU toujours pour voir) */}
            <div>
              <label className="text-xs font-black uppercase text-foreground/60 mb-1 block">
                Date cible {duration !== "custom" && "(calculée)"}
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => { setTargetDate(e.target.value); setDuration("custom"); }}
                className="neo-input w-full"
                min={new Date().toISOString().split("T")[0]}
                required
              />
            </div>

            {/* ACTIONS */}
            <div className="flex items-center gap-3 pt-2 border-t-4 border-foreground mt-2">
              {isEditing && onDelete && (
                <div className="flex-1">
                  {confirmDelete ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-red-500">Confirmer ?</span>
                      <button
                        type="button"
                        onClick={handleDelete}
                        className="px-3 py-1.5 bg-red-500 text-white font-black uppercase text-xs border-[3px] border-foreground"
                      >
                        Oui
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(false)}
                        className="px-3 py-1.5 bg-surface font-black uppercase text-xs border-[3px] border-foreground"
                      >
                        Non
                      </button>
                    </div>
                  ) : (
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setConfirmDelete(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-600 font-black uppercase text-xs border-[3px] border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
                    >
                      <Trash2 size={14} strokeWidth={3} />
                      Supprimer
                    </motion.button>
                  )}
                </div>
              )}

              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                disabled={isSaving || !title.trim() || !targetDate}
                className="ml-auto bg-primary border-4 border-foreground px-6 py-3 font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all disabled:opacity-50"
              >
                {isSaving ? "..." : isEditing ? "Modifier" : "Créer l'objectif"}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

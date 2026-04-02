"use client";

import { useState, useEffect } from "react";
import { Todo } from "@/lib/models/todo";
import { todoService } from "@/lib/services/todoService";
import { Plus, Trash2, Check, Clock, ChevronDown, ListTodo } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import SectionInfo from "./SectionInfo";
import SectionSkeleton from "@/components/SectionSkeleton";
import { supabase } from "@/lib/supabase/client";

interface TodoListProps {
  profileUserId?: string;
  readOnly?: boolean;
}

export default function TodoList({
  profileUserId,
  readOnly,
}: TodoListProps = {}) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState("");
  const [newTime, setNewTime] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [todoToEdit, setTodoToEdit] = useState<Todo | null>(null);

  // Persistence du state isCollapsed
  useEffect(() => {
    const saved = localStorage.getItem("todoListCollapsed");
    if (saved !== null) {
      setIsCollapsed(saved === "true");
    }
  }, []);

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("todoListCollapsed", String(newState));
  };

  useEffect(() => {
    loadTodos();
  }, []);

  const loadTodos = async () => {
    try {
      setIsLoading(true);
      const data = await todoService.fetchTodos(profileUserId);
      setTodos(data);
    } catch (error) {
      console.error("Erreur de chargement des todos :", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Realtime : synchronise les todos entre onglets
  useEffect(() => {
    if (readOnly) return;
    const channel = supabase
      .channel("todos-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "todos" },
        () => { loadTodos(); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [readOnly]);

  const handleSubmitTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly || !newTodo.trim()) return;

    try {
      if (todoToEdit) {
        // Optimistic update for edit
        setTodos((current) =>
          current.map((t) =>
            t.id === todoToEdit.id ? { ...t, title: newTodo, time: newTime || undefined } : t
          )
        );
        const savedTitle = newTodo;
        const savedTime = newTime || undefined;
        const editId = todoToEdit.id;
        
        setNewTodo("");
        setNewTime("");
        setTodoToEdit(null);

        await todoService.updateTodo(editId, savedTitle, savedTime);
        
        // Re-programmer les notifications si nécessaire ?
        // On pourrait annuler les anciennes via OneSignal, mais pour l'instant on garde simple 
        // Laisse l'utilisateur le gérer ou on recrée les notifs.
      } else {
        // Optimistic update for add
        const tempId = "temp-" + Date.now();
        const optimisticTodo: Todo = {
          id: tempId,
          user_id: "temp",
          title: newTodo,
          time: newTime || undefined,
          is_completed: false,
          created_at: new Date().toISOString(),
        };
        setTodos([...todos, optimisticTodo]);
        const savedTitle = newTodo;
        const savedTime = newTime || undefined;
        setNewTodo("");
        setNewTime("");

        const added = await todoService.addTodo(savedTitle, savedTime);
        setTodos((current) => current.map((t) => (t.id === tempId ? added : t)));

        // Programmer les notifications si une heure est définie
        if (savedTime && added.user_id) {
          const now = new Date();
          const [h, m] = savedTime.split(":").map(Number);

          // Rappel 10 min avant
          const beforeTime = new Date();
          beforeTime.setHours(h, m, 0, 0);
          beforeTime.setMinutes(beforeTime.getMinutes() - 10);
          if (beforeTime > now) {
            fetch("/api/push/send", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: added.user_id,
                title: `📌 ${savedTitle} dans 10 min`,
                body: `Prépare-toi ! Ta tâche "${savedTitle}" approche 🔥`,
                sendAfter: beforeTime.toISOString(),
              }),
            }).catch(() => {});
          }

          // Rappel à l'heure exacte
          const exactTime = new Date();
          exactTime.setHours(h, m, 0, 0);
          if (exactTime > now) {
            fetch("/api/push/send", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: added.user_id,
                title: `📌 C'est l'heure : ${savedTitle} !`,
                body: `C'est maintenant ! Lance-toi sur "${savedTitle}" ✅`,
                sendAfter: exactTime.toISOString(),
              }),
            }).catch(() => {});
          }
        }
      }
    } catch (error) {
      console.error("Erreur lors de la soumission :", error);
      await loadTodos(); // rollback
    }
  };

  const toggleTodo = async (todo: Todo) => {
    if (readOnly) return;
    try {
      // Optimistic
      setTodos((current) =>
        current.map((t) =>
          t.id === todo.id ? { ...t, is_completed: !t.is_completed } : t,
        ),
      );

      await todoService.toggleTodo(todo.id, !todo.is_completed);
    } catch (error) {
      console.error("Erreur au toggle :", error);
      await loadTodos(); // rollback
    }
  };

  const deleteTodo = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (readOnly) return;
    try {
      setTodos((current) => current.filter((t) => t.id !== id));
      await todoService.deleteTodo(id);
    } catch (error) {
      console.error("Erreur à la suppression :", error);
      await loadTodos(); // rollback
    }
  };

  /**
   * Formatage de l'heure affichée : "14:30" → "14h30", "09:00" → "9h00"
   */
  const formatTime = (time: string) => {
    const [h, m] = time.split(":");
    return `${parseInt(h)}h${m}`;
  };

  // Tri : non complétés d'abord, puis par heure (les tâches avec heure en premier), puis par date
  const sortedTodos = [...todos].sort((a, b) => {
    if (a.is_completed !== b.is_completed) {
      return a.is_completed ? 1 : -1;
    }
    // Parmi les non complétés : ceux avec heure d'abord, triés par heure
    if (!a.is_completed) {
      if (a.time && b.time) return a.time.localeCompare(b.time);
      if (a.time && !b.time) return -1;
      if (!a.time && b.time) return 1;
    }
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });

  if (isLoading && todos.length === 0) return <SectionSkeleton />;

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
        <div className="w-9 h-9 flex items-center justify-center bg-orange-400 dark:bg-orange-400/30 border-[3px] border-foreground dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(100,100,100,0.3)] shrink-0">
          <ListTodo size={18} strokeWidth={3} className="dark:text-white" />
        </div>
        <motion.div
          animate={{ rotate: isCollapsed ? -90 : 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="shrink-0"
        >
          <ChevronDown size={20} strokeWidth={3} className="text-foreground/50 group-hover:text-foreground transition-colors" />
        </motion.div>
        <h2 className="text-xl sm:text-2xl font-black uppercase text-foreground">
          Objectifs temporaires
        </h2>
        <SectionInfo
          title="Objectifs temporaires"
          description="Ces tâches ponctuelles sont conçues pour être accomplies durant une seule journée. Au bout de 24 heures, elles disparaissent automatiquement."
          example="Appeler le garagiste, Acheter des fruits, Envoyer le rapport"
        />
        <div className="bg-yellow-100 border-2 border-black px-2 py-0.5 rounded flex items-center gap-1.5 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] ml-auto">
          <Clock size={12} strokeWidth={3} className="text-black" />
          <span className="text-[10px] font-black uppercase text-black">
            Durée de 24h
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
        {/* BOUTON AJOUTER PLEINE LARGEUR */}
        {!readOnly && (
          <div className="mb-6">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setTodoToEdit(null);
                setNewTodo("");
                setNewTime("");
                setIsModalOpen(true);
              }}
              className="w-full bg-primary border-[3px] sm:border-4 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all py-3 flex items-center justify-center gap-2 text-sm sm:text-base font-black uppercase"
            >
              <Plus size={20} strokeWidth={4} />
              Ajouter un Objectif
            </motion.button>
          </div>
        )}

        {/* LISTE DES TÂCHES */}
        {isLoading && todos.length === 0 ? (
          <div className="flex flex-col gap-3 pb-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={`skeleton-${i}`}
                className="bg-surface border-4 border-gray-200 p-3 flex items-center gap-3"
              >
                <div className="w-8 h-8 md:w-10 md:h-10 border-4 border-gray-200 bg-gray-100 flex items-center justify-center shrink-0 animate-pulse"></div>
                <div className="flex-1 flex flex-col gap-2">
                  <div className="h-4 sm:h-5 w-2/3 bg-gray-200 animate-pulse"></div>
                </div>
                <div className="w-10 h-10 border-4 border-gray-200 bg-gray-100 flex items-center justify-center shrink-0 animate-pulse"></div>
              </div>
            ))}
          </div>
        ) : todos.length === 0 ? (
          <div className="text-center p-8 border-4 border-dashed border-foreground/30 font-black uppercase text-foreground/50 bg-background/50">
            Aucune tâche temporaire.
          </div>
        ) : (
          <div className="flex flex-col gap-3 pb-4">
            <AnimatePresence mode="popLayout">
              {sortedTodos.map((todo) => (
                <motion.div
                  layout
                  key={todo.id}
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, x: -20 }}
                  whileHover={readOnly ? {} : { scale: 1.01 }}
                  className={`flex items-center gap-3 md:gap-4 p-3 border-4 border-foreground transition-all ${
                    todo.is_completed
                      ? "bg-background opacity-60 shadow-none"
                      : `bg-primary shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${readOnly ? "" : "hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"}`
                  } ${readOnly ? "cursor-default" : "cursor-pointer"}`}
                  onClick={() => {
                    if (readOnly) return;
                    setTodoToEdit(todo);
                    setNewTodo(todo.title);
                    setNewTime(todo.time || "");
                    setIsModalOpen(true);
                  }}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTodo(todo);
                    }}
                    className={`shrink-0 w-8 h-8 rounded-full border-4 border-foreground flex items-center justify-center transition-colors ${
                      todo.is_completed ? "bg-foreground" : "bg-surface"
                    }`}
                  >
                    {todo.is_completed && (
                      <Check strokeWidth={5} className="w-4 h-4 text-white" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0 flex items-center gap-2">
                    <span
                      className={`font-black text-sm sm:text-base leading-tight truncate ${todo.is_completed ? "line-through text-foreground/50" : "text-foreground"}`}
                    >
                      {todo.title}
                    </span>
                    {todo.time && (
                      <span
                        className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 border-2 border-foreground text-[11px] font-black uppercase ${
                          todo.is_completed
                            ? "bg-gray-200 text-foreground/40"
                            : "bg-surface text-foreground shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                        }`}
                      >
                        <Clock size={10} strokeWidth={3} />
                        {formatTime(todo.time)}
                      </span>
                    )}
                  </div>

                  {!readOnly && (
                    <motion.button
                      whileHover={{ scale: 1.1, rotate: 10 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => deleteTodo(todo.id, e)}
                      className="p-2 bg-surface border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
                      aria-label="Supprimer la tâche"
                    >
                      <Trash2
                        size={16}
                        strokeWidth={3}
                        className="text-red-500"
                      />
                    </motion.button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isModalOpen && (
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
              className="neo-card bg-surface w-full max-w-lg p-0 flex flex-col overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
            >
              <div className="bg-background border-b-4 border-foreground p-4 flex justify-between items-center">
                <h2 className="text-xl md:text-2xl font-black uppercase text-foreground">
                  {todoToEdit ? "Modifier la Tâche" : "Nouvel Objectif"}
                </h2>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="neo-btn !p-2 bg-red-400"
                >
                  ✕
                </button>
              </div>

              <div className="p-6">
                <form 
                  onSubmit={(e) => {
                    handleSubmitTodo(e);
                    setIsModalOpen(false);
                  }}
                  className="flex flex-col gap-6"
                >
                  <div className="flex flex-col gap-2 relative">
                    <label className="text-sm font-black uppercase tracking-wider">Nom de l'objectif</label>
                    <input
                      type="text"
                      className="neo-input w-full !p-3 text-base md:text-lg bg-background placeholder:text-foreground/30 focus:bg-white dark:focus:bg-zinc-800"
                      placeholder="Ex: Acheter du pain..."
                      value={newTodo}
                      onChange={(e) => setNewTodo(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                  
                  <div className="flex flex-col gap-2 relative">
                    <label className="text-sm font-black uppercase tracking-wider">Heure cible (Facultatif)</label>
                    <div className="relative">
                      <input
                        type="time"
                        className="neo-input w-full !p-3 text-base font-bold cursor-pointer bg-background"
                        value={newTime}
                        onChange={(e) => setNewTime(e.target.value)}
                      />
                      {newTime && (
                        <button
                          type="button"
                          onClick={() => setNewTime("")}
                          className="absolute -top-[10px] -right-[10px] w-6 h-6 bg-red-400 border-2 border-foreground text-foreground flex items-center justify-center text-xs font-black leading-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
                          title="Effacer l'heure"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>

                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={isLoading || !newTodo.trim()}
                    className="w-full bg-primary border-4 border-foreground px-6 py-4 flex items-center justify-center gap-3 font-black text-lg uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all disabled:opacity-50 mt-2"
                  >
                    <Plus strokeWidth={4} size={24} />
                    {todoToEdit ? "Sauvegarder" : "Ajouter l'objectif"}
                  </motion.button>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

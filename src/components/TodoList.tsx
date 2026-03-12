"use client";

import { useState, useEffect } from "react";
import { Todo } from "@/lib/models/todo";
import { todoService } from "@/lib/services/todoService";
import { Plus, Trash2, Check, Clock } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import SectionInfo from "./SectionInfo";

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
  const [isLoading, setIsLoading] = useState(true);

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

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly || !newTodo.trim()) return;

    try {
      // Optimistic update
      const tempId = "temp-" + Date.now();
      const optimisticTodo: Todo = {
        id: tempId,
        user_id: "temp",
        title: newTodo,
        is_completed: false,
        created_at: new Date().toISOString(),
      };
      setTodos([...todos, optimisticTodo]);
      setNewTodo("");

      const added = await todoService.addTodo(optimisticTodo.title);
      setTodos((current) => current.map((t) => (t.id === tempId ? added : t)));
    } catch (error) {
      console.error("Erreur lors de l'ajout :", error);
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

  // Les todo non complétés d'abord, puis complétés
  const sortedTodos = [...todos].sort((a, b) => {
    if (a.is_completed === b.is_completed) {
      return (
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    }
    return a.is_completed ? 1 : -1;
  });

  return (
    <div className="w-full max-w-6xl mx-auto px-4 md:px-8 mt-4 mb-12">
      <div className="flex items-center gap-3 mb-4 pl-2 border-l-8 border-foreground">
        <h2 className="text-xl sm:text-2xl font-black uppercase text-foreground">
          Objectifs temporaires
        </h2>
        <SectionInfo
          title="Objectifs temporaires"
          description="Ces tâches ponctuelles sont conçues pour être accomplies durant une seule journée. Au bout de 24 heures, elles disparaissent automatiquement."
          example="Appeler le garagiste, Acheter des fruits, Envoyer le rapport"
        />
        <div className="bg-yellow-100 border-2 border-foreground px-2 py-0.5 rounded flex items-center gap-1.5 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] ml-auto">
          <Clock size={12} strokeWidth={3} className="text-foreground" />
          <span className="text-[10px] font-black uppercase text-foreground">
            Durée de 24h
          </span>
        </div>
      </div>

      <div className="bg-surface border-4 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 md:p-6 pb-2">
        {/* FORMULAIRE D'AJOUT */}
        {!readOnly && (
          <form
            onSubmit={handleAddTodo}
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6"
          >
            <input
              type="text"
              className="neo-input flex-1 !p-3 text-base md:text-lg"
              placeholder="TACHE DU JOUR..."
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              disabled={isLoading}
            />
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              disabled={isLoading || !newTodo.trim()}
              className="bg-black hover:bg-neutral-800 text-white font-black uppercase border-4 border-foreground px-6 py-3 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              <Plus strokeWidth={4} size={20} />
              AJOUTER
            </motion.button>
          </form>
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
                  onClick={() => toggleTodo(todo)}
                >
                  <button
                    className={`shrink-0 w-8 h-8 rounded-full border-4 border-foreground flex items-center justify-center transition-colors ${
                      todo.is_completed ? "bg-foreground" : "bg-surface"
                    }`}
                  >
                    {todo.is_completed && (
                      <Check strokeWidth={5} className="w-4 h-4 text-white" />
                    )}
                  </button>

                  <span
                    className={`flex-1 font-black text-sm sm:text-base leading-tight ${todo.is_completed ? "line-through text-foreground/50" : "text-foreground"}`}
                  >
                    {todo.title}
                  </span>

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
    </div>
  );
}

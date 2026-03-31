"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { RotateCcw, X, AlertTriangle, Loader2, CheckCircle } from "lucide-react";
import { habitService } from "@/lib/services/habitService";
import { sharedHabitService } from "@/lib/services/sharedHabitService";

type ResetOption = "personal" | "shared";

interface ResetObjectivesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ResetObjectivesModal({ isOpen, onClose }: ResetObjectivesModalProps) {
  const [selected, setSelected] = useState<ResetOption[]>([]);
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [error, setError] = useState("");

  const options: { value: ResetOption; label: string; description: string; icon: string; color: string }[] = [
    {
      value: "personal",
      label: "Objectifs personnels",
      description: "Supprime tous vos objectifs et leur historique de validation.",
      icon: "🎯",
      color: "#4facff",
    },
    {
      value: "shared",
      label: "Objectifs communs",
      description: "Quitte tous vos groupes partagés et supprime votre historique.",
      icon: "👥",
      color: "#9d4edd",
    },
  ];

  const toggleOption = (value: ResetOption) => {
    setSelected((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
    setError("");
  };

  const handleReset = async () => {
    if (selected.length === 0) {
      setError("Veuillez sélectionner au moins un type d'objectif à réinitialiser.");
      return;
    }

    setIsResetting(true);
    setError("");

    try {
      if (selected.includes("personal")) {
        await habitService.resetAllHabits();
      }
      if (selected.includes("shared")) {
        await sharedHabitService.resetAllSharedHabits();
      }

      setResetSuccess(true);
      setTimeout(() => {
        setResetSuccess(false);
        setSelected([]);
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err?.message || "Une erreur est survenue lors de la réinitialisation.");
    } finally {
      setIsResetting(false);
    }
  };

  const handleClose = () => {
    if (isResetting) return;
    setSelected([]);
    setError("");
    setResetSuccess(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* BACKDROP */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center"
          />

          {/* MODAL */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4 pointer-events-none"
          >
            <div className="w-full max-w-md pointer-events-auto border-4 border-foreground bg-surface shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
              {/* HEADER */}
              <div className="flex items-center justify-between p-4 border-b-4 border-foreground bg-red-400">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 flex items-center justify-center bg-white border-[3px] border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <RotateCcw size={18} strokeWidth={3} className="text-red-500" />
                  </div>
                  <h2 className="text-lg font-black uppercase tracking-tight text-black">
                    Réinitialiser
                  </h2>
                </div>
                <button
                  onClick={handleClose}
                  disabled={isResetting}
                  className="w-9 h-9 flex items-center justify-center border-[3px] border-foreground bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all disabled:opacity-50"
                >
                  <X size={16} strokeWidth={3} />
                </button>
              </div>

              {/* BODY */}
              <div className="p-5 flex flex-col gap-4">
                {/* WARNING */}
                <div className="flex items-start gap-3 p-3 border-[3px] border-orange-400 bg-orange-50 dark:bg-orange-900/20">
                  <AlertTriangle size={20} strokeWidth={3} className="text-orange-500 shrink-0 mt-0.5" />
                  <p className="text-sm font-bold text-foreground/80">
                    Cette action est <span className="text-red-500 uppercase">irréversible</span>. 
                    Toutes les données sélectionnées seront définitivement supprimées.
                  </p>
                </div>

                {/* QUESTION */}
                <p className="font-black text-sm uppercase text-foreground/70">
                  Quels objectifs souhaitez-vous réinitialiser ?
                </p>

                {/* OPTIONS */}
                <div className="flex flex-col gap-3">
                  {options.map((option) => {
                    const isSelected = selected.includes(option.value);
                    return (
                      <motion.button
                        key={option.value}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => toggleOption(option.value)}
                        className={`w-full text-left p-4 border-4 transition-all cursor-pointer ${
                          isSelected
                            ? "border-foreground shadow-none translate-x-[2px] translate-y-[2px]"
                            : "border-foreground shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                        }`}
                        style={{
                          backgroundColor: isSelected ? option.color + "30" : "var(--surface)",
                        }}
                      >
                        <div className="flex items-center gap-3">
                          {/* CHECKBOX */}
                          <div
                            className={`w-7 h-7 border-[3px] border-foreground flex items-center justify-center shrink-0 transition-colors`}
                            style={{
                              backgroundColor: isSelected ? option.color : "transparent",
                            }}
                          >
                            {isSelected && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 500, damping: 20 }}
                              >
                                <CheckCircle size={16} strokeWidth={3} className="text-white" />
                              </motion.div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{option.icon}</span>
                              <span className="font-black uppercase text-sm">{option.label}</span>
                            </div>
                            <p className="text-xs font-bold text-foreground/50 mt-1">
                              {option.description}
                            </p>
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>

                {/* ERROR */}
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm font-bold text-red-600 border-2 border-red-600 p-2 bg-red-50 dark:bg-red-900/20"
                  >
                    {error}
                  </motion.p>
                )}

                {/* SUCCESS */}
                {resetSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-3 border-[3px] border-green-600 bg-green-50 dark:bg-green-900/20"
                  >
                    <CheckCircle size={18} strokeWidth={3} className="text-green-600" />
                    <p className="text-sm font-bold text-green-700 dark:text-green-400">
                      Réinitialisation effectuée avec succès !
                    </p>
                  </motion.div>
                )}
              </div>

              {/* FOOTER */}
              <div className="p-4 border-t-4 border-foreground flex gap-3">
                <button
                  onClick={handleClose}
                  disabled={isResetting}
                  className="flex-1 neo-btn !bg-surface !py-3 text-sm disabled:opacity-50"
                >
                  Annuler
                </button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleReset}
                  disabled={isResetting || selected.length === 0 || resetSuccess}
                  className={`flex-1 neo-btn !py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-50 ${
                    selected.length > 0 && !resetSuccess
                      ? "!bg-red-400 hover:!bg-red-500"
                      : "!bg-gray-300"
                  }`}
                >
                  {isResetting ? (
                    <>
                      <Loader2 size={16} strokeWidth={3} className="animate-spin" />
                      <span>Réinitialisation...</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw size={16} strokeWidth={3} />
                      <span>Réinitialiser</span>
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

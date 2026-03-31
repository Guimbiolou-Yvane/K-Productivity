"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Users, Plus, Trash2, ChevronDown, ChevronUp, Check, Settings, LogOut, Edit, ChevronLeft, ChevronRight, Handshake } from "lucide-react";
import { sharedHabitService } from "@/lib/services/sharedHabitService";
import { authService } from "@/lib/services/authService";
import { UserProfile } from "@/lib/models/user";
import { SharedGroup, UISharedHabit } from "@/lib/models/sharedHabit";
import SharedGroupModal from "./SharedGroupModal";
import SharedHabitModal, { SharedHabitFormData } from "./SharedHabitModal";
import SectionInfo from "../SectionInfo";
import { PRESET_COLORS, getMonthDays, isOutsideDates } from "@/components/habit-tracker/constants";
import Image from "next/image";
import { supabase } from "@/lib/supabase/client";

export default function SharedHabitsTracker() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [groups, setGroups] = useState<{group: SharedGroup, members: UserProfile[]}[]>([]);
  const [habitsByGroup, setHabitsByGroup] = useState<{ [groupId: string]: UISharedHabit[] }>({});
  // Ref pour éviter les stale closures dans les callbacks Realtime
  const habitsByGroupRef = useRef<{ [groupId: string]: UISharedHabit[] }>({});

  // Synchroniser le ref à chaque mise à jour du state
  useEffect(() => {
    habitsByGroupRef.current = habitsByGroup;
  }, [habitsByGroup]);
  const [expandedGroups, setExpandedGroups] = useState<{ [groupId: string]: boolean }>({});
  const [isLoading, setIsLoading] = useState(true);
  
  const [isGroupModalOpen, setGroupModalOpen] = useState(false);
  const [isHabitModalOpen, setHabitModalOpen] = useState(false);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [habitToEdit, setHabitToEdit] = useState<UISharedHabit | null>(null);
  const [groupToEdit, setGroupToEdit] = useState<{group: SharedGroup, members: UserProfile[]} | null>(null);

  const todayStr = new Date().toISOString().split("T")[0];

  const monthDays = useMemo(() => getMonthDays(), []);
  const todayIdx = useMemo(() => {
    const idx = monthDays.findIndex((d) => d.isToday);
    return idx >= 0 ? idx : 0;
  }, [monthDays]);

  const [currentDayIdx, setCurrentDayIdx] = useState(todayIdx);
  const [direction, setDirection] = useState(0);

  const safeIdx = Math.max(0, Math.min(currentDayIdx, monthDays.length - 1));
  const currentDay = monthDays[safeIdx];
  const currentDateStr = currentDay?.date || todayStr;

  const prevIdx = safeIdx > 0 ? safeIdx - 1 : null;
  const nextIdx = safeIdx < monthDays.length - 1 ? safeIdx + 1 : null;

  const getDayLabel = (idx: number) => {
    const day = monthDays[idx];
    if (!day) return "";
    if (day.isToday) return "AUJOURD'HUI";
    return `${day.dayName.toUpperCase()} ${day.dayNumber}`;
  };

  const getDateLabel = (idx: number) => {
    const day = monthDays[idx];
    if (!day) return "";
    const d = new Date(day.date + "T00:00:00");
    return d
      .toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })
      .replace(".", "")
      .toUpperCase();
  };

  const handlePrevDay = () => {
    if (currentDayIdx > 0) {
      setDirection(-1);
      setCurrentDayIdx((prev) => prev - 1);
    }
  };

  const handleNextDay = () => {
    if (currentDayIdx < monthDays.length - 1) {
      setDirection(1);
      setCurrentDayIdx((prev) => prev + 1);
    }
  };

  const goToToday = () => {
    if (currentDayIdx === todayIdx) return;
    setDirection(todayIdx > currentDayIdx ? 1 : -1);
    setCurrentDayIdx(todayIdx);
  };

  useEffect(() => { loadData(); }, []);

  // ─── Realtime ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser) return;

    const channel = supabase
      .channel("shared-realtime-" + currentUser.id)
      // Logs (validation / dévalidation / suppression d'une entrée de log)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "shared_habit_logs" },
        async (payload) => {
          const habitId =
            (payload.new as any)?.shared_habit_id ??
            (payload.old as any)?.shared_habit_id;
          if (!habitId) return;
          // Utiliser le ref pour avoir toujours la dernière valeur
          const current = habitsByGroupRef.current;
          const groupId = Object.keys(current).find((gid) =>
            current[gid].some((h) => h.id === habitId)
          );
          if (!groupId) return;
          const newHabits = await sharedHabitService.fetchHabitsByGroup(groupId);
          setHabitsByGroup((prev) => ({ ...prev, [groupId]: newHabits }));
        }
      )
      // Objectifs partagés (ajout / modif / suppression)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "shared_habits" },
        async (payload) => {
          const groupId =
            (payload.new as any)?.group_id ??
            (payload.old as any)?.group_id;
          if (!groupId) return;
          const newHabits = await sharedHabitService.fetchHabitsByGroup(groupId);
          setHabitsByGroup((prev) => ({ ...prev, [groupId]: newHabits }));
        }
      )
      // Membres (ajout / départ)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "shared_group_members" },
        () => { loadData(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  // On ne met que currentUser en dépendance : le channel se crée une seule fois par session
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);
  // ──────────────────────────────────────────────────────────────────────────

  const loadData = async () => {
    try {
      setIsLoading(true);
      const profile = await authService.getProfile();
      setCurrentUser(profile);
      if (profile) {
        const userGroups = await sharedHabitService.fetchUserGroups();
        setGroups(userGroups);
        const expansions: {[key: string]: boolean} = {};
        userGroups.forEach(g => { expansions[g.group.id] = true; });
        setExpandedGroups(expansions);
        const habitsObj: { [groupId: string]: UISharedHabit[] } = {};
        for (const g of userGroups) {
          habitsObj[g.group.id] = await sharedHabitService.fetchHabitsByGroup(g.group.id);
        }
        setHabitsByGroup(habitsObj);
      }
    } catch (e) { console.error("Erreur loadData", e); }
    finally { setIsLoading(false); }
  };

  const handleSaveGroup = async (name: string, invitedFriends: string[]) => {
    try {
      if (groupToEdit) {
        await sharedHabitService.updateGroup(groupToEdit.group.id, name, invitedFriends);
      } else {
        await sharedHabitService.createGroup(name, invitedFriends);
      }
      setGroupModalOpen(false);
      setGroupToEdit(null);
      loadData();
    } catch (e) { console.error(e); }
  };

  const handleSaveHabit = async (data: SharedHabitFormData) => {
    try {
      if (habitToEdit) {
        await sharedHabitService.updateSharedHabit(habitToEdit.id, data.name, data.category, data.frequency, data.color, data.icon, data.startDate, data.endDate, data.time || undefined);
        const gId = habitToEdit.group_id;
        const newHabits = await sharedHabitService.fetchHabitsByGroup(gId);
        setHabitsByGroup(prev => ({ ...prev, [gId]: newHabits }));
      } else if (activeGroupId) {
        await sharedHabitService.addSharedHabit(activeGroupId, data.name, data.category, data.frequency, data.color, data.icon, data.startDate, data.endDate, data.time || undefined);
        const gId = activeGroupId;
        const newHabits = await sharedHabitService.fetchHabitsByGroup(gId);
        setHabitsByGroup(prev => ({ ...prev, [gId]: newHabits }));
      }
      setHabitModalOpen(false);
      setHabitToEdit(null);
      setActiveGroupId(null);
    } catch (e) { console.error(e); }
  };

  const handleLeaveGroup = async (groupId: string) => {
    if (confirm("Garde en tête qu'un groupe partagé de moins de 2 membres sera supprimé automatiquement... Êtes-vous sûr de vouloir quitter ce groupe ?")) {
       try {
         await sharedHabitService.leaveGroup(groupId);
         setGroups(prev => prev.filter(g => g.group.id !== groupId));
         setGroupModalOpen(false);
         setGroupToEdit(null);
       } catch (error) { console.error(error); }
    }
  };

  const handleEditGroup = (g: {group: SharedGroup, members: UserProfile[]}, e: React.MouseEvent) => {
    e.stopPropagation();
    setGroupToEdit(g);
    setGroupModalOpen(true);
  };

  const handleToggleHabit = async (habitId: string, groupId: string) => {
    if (!currentUser) return;
    setHabitsByGroup(prev => {
      const gHabits = prev[groupId].map(h => {
        if (h.id === habitId) {
          const key = `${currentDateStr}_${currentUser.id}`;
          return { ...h, completedLogs: { ...h.completedLogs, [key]: !h.completedLogs[key] } };
        }
        return h;
      });
      return { ...prev, [groupId]: gHabits };
    });
    try {
      await sharedHabitService.toggleLog(habitId, currentDateStr);
    } catch (e) {
      console.error("Erreur toggle", e);
      const newHabits = await sharedHabitService.fetchHabitsByGroup(groupId);
      setHabitsByGroup(prev => ({ ...prev, [groupId]: newHabits }));
    }
  };

  const handleDeleteHabit = async (habitId: string, groupId: string) => {
    try {
      await sharedHabitService.deleteSharedHabit(habitId);
      setHabitsByGroup(prev => ({ ...prev, [groupId]: prev[groupId].filter(h => h.id !== habitId) }));
    } catch (e) { console.error(e); }
  };

  if (!currentUser) return null;

  return (
    <>
      {/* HEADER sticky hors du motion.div pour éviter tout conflit z-index */}
      <div className="sticky top-0 z-30 bg-surface border-b-4 border-foreground w-full">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 flex items-center justify-center bg-primary border-[3px] border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0">
              <Handshake size={18} strokeWidth={3} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black uppercase tracking-tight leading-none">
                  Objectifs Communs
                </h1>
                <SectionInfo
                  title="Objectifs partagés"
                  description="Crée des groupes, invite tes amis, et fixez-vous des objectifs en commun. Chaque membre doit valider pour que l'objectif soit totalement accompli !"
                  example="Courir 5km chaque jour en groupe"
                />
              </div>
              <p className="font-bold text-foreground/50 text-xs mt-0.5 hidden sm:block">
                Défie tes amis et progressez ensemble au quotidien !
              </p>
            </div>
          </div>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="min-h-screen flex flex-col items-center max-w-6xl mx-auto font-sans pb-32 w-full"
      >
      <div className="w-full px-4 md:px-8 py-6">

      {/* BOUTON CRÉER UN GROUPE */}
      <div className="w-full flex justify-end mb-6">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setGroupModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 border-[3px] border-foreground bg-primary font-black uppercase text-sm shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
        >
          <Plus size={16} strokeWidth={3} />
          Créer un groupe
        </motion.button>
      </div>
      
      {isLoading && groups.length === 0 && (
        <div className="w-full flex justify-center items-center py-10">
          <motion.div
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 1 }}
            transition={{ repeat: Infinity, duration: 1, repeatType: "reverse" }}
            className="flex flex-col gap-6 w-full max-w-4xl"
          >
            {[1, 2].map((i) => (
              <div key={i} className="w-full h-24 bg-surface border-4 border-foreground/20 rounded shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <div className="w-48 h-6 bg-foreground/10 rounded"></div>
                  <div className="flex -space-x-2">
                    <div className="w-8 h-8 rounded-full bg-foreground/10 border-2 border-surface"></div>
                    <div className="w-8 h-8 rounded-full bg-foreground/10 border-2 border-surface"></div>
                    <div className="w-8 h-8 rounded-full bg-foreground/10 border-2 border-surface"></div>
                  </div>
                </div>
                <div className="w-10 h-10 bg-foreground/10 rounded"></div>
              </div>
            ))}
          </motion.div>
        </div>
      )}



      {/* SÉLECTEUR DE JOUR */}
      {currentDay && (
        <div className="flex items-center justify-between w-full mb-8 relative gap-2">
          <button
            onClick={handlePrevDay}
            disabled={prevIdx === null}
            className="neo-btn !p-2 z-20 bg-surface flex-shrink-0 disabled:opacity-30"
            aria-label="Jour Précédent"
          >
            <ChevronLeft strokeWidth={4} className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          <div className="flex-1 flex justify-center items-center relative h-24 sm:h-28 overflow-hidden mx-1">
            <AnimatePresence initial={false} mode="popLayout" custom={direction}>
              <motion.div
                key={safeIdx}
                custom={direction}
                initial={{ x: direction > 0 ? 100 : -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{
                  x: direction > 0 ? -100 : 100,
                  opacity: 0,
                  position: "absolute",
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="flex justify-center items-end gap-2 w-full absolute inset-0 pb-2"
              >
                {/* Carte Jour Précédent (SM) */}
                {prevIdx !== null && (
                  <motion.div
                    whileTap={{ scale: 0.9 }}
                    onClick={handlePrevDay}
                    className="hidden sm:flex flex-col items-center flex-shrink-0 w-28 cursor-pointer group/card"
                  >
                    <span className="text-xs font-black mb-2 opacity-70 tracking-widest group-hover/card:opacity-100 transition-opacity">
                      {getDateLabel(prevIdx)}
                    </span>
                    <div className="neo-card opacity-60 w-full text-center py-2 px-1 text-xs font-bold items-center justify-center truncate bg-surface group-hover/card:opacity-100 group-hover/card:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all">
                      {getDayLabel(prevIdx)}
                    </div>
                  </motion.div>
                )}
                {/* Carte Jour Précédent (XS) */}
                {prevIdx !== null && (
                  <motion.div
                    whileTap={{ scale: 0.9 }}
                    onClick={handlePrevDay}
                    className="sm:hidden flex flex-col items-center flex-shrink-0 w-16 cursor-pointer group/card"
                  >
                    <span className="text-[10px] font-black mb-2 opacity-70 tracking-wider group-hover/card:opacity-100 transition-opacity">
                      {getDateLabel(prevIdx)}
                    </span>
                    <div className="neo-card opacity-60 w-full text-center py-2 px-1 text-[10px] font-bold items-center justify-center truncate bg-surface group-hover/card:opacity-100 group-hover/card:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all">
                      {getDayLabel(prevIdx).substring(0, 5)}
                    </div>
                  </motion.div>
                )}

                {/* Carte Jour Courant (Central) */}
                <motion.div
                  whileTap={{ scale: 0.95 }}
                  onClick={goToToday}
                  className="flex flex-col items-center flex-shrink-0 w-36 sm:w-48 z-10 cursor-pointer"
                >
                  <span className="text-sm font-black mb-2 tracking-widest">
                    {getDateLabel(safeIdx)}
                  </span>
                  <div
                    className={`neo-card text-center py-3 px-1 text-sm sm:text-base font-black border-4 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] w-full flex items-center justify-center active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all ${currentDay.isToday ? "bg-primary" : "bg-surface"}`}
                  >
                    {getDayLabel(safeIdx)}
                  </div>
                </motion.div>

                {/* Carte Jour Suivant (SM) */}
                {nextIdx !== null && (
                  <motion.div
                    whileTap={{ scale: 0.9 }}
                    onClick={handleNextDay}
                    className="hidden sm:flex flex-col items-center flex-shrink-0 w-28 cursor-pointer group/card"
                  >
                    <span className="text-xs font-black mb-2 opacity-70 tracking-widest group-hover/card:opacity-100 transition-opacity">
                      {getDateLabel(nextIdx)}
                    </span>
                    <div className="neo-card opacity-60 w-full text-center py-2 px-1 text-xs font-bold items-center justify-center truncate bg-surface group-hover/card:opacity-100 group-hover/card:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all">
                      {getDayLabel(nextIdx)}
                    </div>
                  </motion.div>
                )}
                {/* Carte Jour Suivant (XS) */}
                {nextIdx !== null && (
                  <motion.div
                    whileTap={{ scale: 0.9 }}
                    onClick={handleNextDay}
                    className="sm:hidden flex flex-col items-center flex-shrink-0 w-16 cursor-pointer group/card"
                  >
                    <span className="text-[10px] font-black mb-2 opacity-70 tracking-wider group-hover/card:opacity-100 transition-opacity">
                      {getDateLabel(nextIdx)}
                    </span>
                    <div className="neo-card opacity-60 w-full text-center py-2 px-1 text-[10px] font-bold items-center justify-center truncate bg-surface group-hover/card:opacity-100 group-hover/card:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all">
                      {getDayLabel(nextIdx).substring(0, 5)}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <button
            onClick={handleNextDay}
            disabled={nextIdx === null}
            className="neo-btn !p-2 z-20 bg-surface flex-shrink-0 disabled:opacity-30"
            aria-label="Jour Suivant"
          >
            <ChevronRight strokeWidth={4} className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>
      )}

      {/* GROUPES */}
      {!isLoading && (
        <div className="w-full flex flex-col gap-10">
          {groups.length === 0 ? (
            <div className="text-center font-bold text-foreground/50 py-16 neo-card bg-surface border-dashed">
              Tu n'es dans aucun groupe. Clique sur "Créer un groupe" pour commencer !
            </div>
          ) : (
          groups.map(g => {
            const isExpanded = expandedGroups[g.group.id];
            const groupHabits = habitsByGroup[g.group.id] || [];
            
            const filteredHabits = groupHabits.filter(h => {
              if (!currentDay) return false;
              const inFrequency = h.frequency ? h.frequency.includes(currentDay.dayName) : true;
              const notBeforeCreation = !isOutsideDates(h as any, currentDay.date);
              return inFrequency && notBeforeCreation;
            });

            return (
              <div key={g.group.id} className="w-full">
                {/* EN-TÊTE DU GROUPE */}
                <div 
                  className="w-full flex items-center justify-between p-4 bg-surface border-4 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedGroups(prev => ({ ...prev, [g.group.id]: !prev[g.group.id] }))}
                >
                  <div className="flex items-center gap-4">
                    <h3 className="font-black text-lg sm:text-xl uppercase tracking-tighter">{g.group.name}</h3>
                    {/* AVATARS DES MEMBRES */}
                    <div className="flex -space-x-2">
                      {g.members.map(member => (
                        <div 
                          key={member.id} 
                          className="w-8 h-8 rounded-full border-2 border-foreground bg-primary overflow-hidden flex items-center justify-center shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                          title={member.username}
                        >
                          {member.avatar_url ? (
                            <Image src={member.avatar_url} alt={member.username} width={32} height={32} className="object-cover w-full h-full" />
                          ) : (
                            <span className="font-black text-[10px]">{member.username.substring(0, 2).toUpperCase()}</span>
                          )}
                        </div>
                      ))}
                    </div>
                    <span className="font-bold text-[10px] bg-foreground text-background px-2 py-0.5 rounded-full hidden sm:inline">
                      {g.members.length} membre{g.members.length > 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                    <motion.button whileTap={{ scale: 0.9 }} onClick={(e) => handleEditGroup(g, e)} className="p-1.5 sm:p-2 bg-surface border-2 border-foreground hover:bg-gray-200 transition-colors rounded shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[1px] active:translate-y-[1px]" aria-label="Paramètres du Groupe">
                      <Settings size={16} />
                    </motion.button>
                    {isExpanded ? <ChevronUp size={22} strokeWidth={3} className="ml-1" /> : <ChevronDown size={22} strokeWidth={3} className="ml-1" />}
                  </div>
                </div>

                {/* CONTENU DU GROUPE DÉPLOYÉ */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="w-full overflow-hidden border-x-4 border-b-4 border-foreground"
                    >
                      {/* LISTE DES OBJECTIFS */}
                      <AnimatePresence mode="popLayout" custom={direction}>
                        {filteredHabits.map((habit, index) => {
                          const validatorIds = habit.members.filter(m => habit.completedLogs[`${currentDateStr}_${m.id}`]).map(m => m.id);
                          const hasCurrentUserValidated = validatorIds.includes(currentUser.id);
                          const completionRatio = validatorIds.length / habit.members.length;
                          const isFullyCompleted = completionRatio === 1;
                          const validatedUsernames = habit.members.filter(m => validatorIds.includes(m.id)).map(m => m.username);

                          return (
                            <motion.div
                              layout
                              custom={direction}
                              initial={{ opacity: 0, x: direction > 0 ? 50 : -50, scale: 0.9 }}
                              animate={{ opacity: 1, x: 0, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8, x: direction > 0 ? -50 : 50 }}
                              transition={{ type: "spring", stiffness: 400, damping: 30, delay: index * 0.05 }}
                              key={`${habit.id}-${safeIdx}`}
                              className={`flex flex-col border-b-4 border-foreground last:border-b-0 group/row relative overflow-hidden`}
                            >
                              {/* Barre de progression en fond */}
                              {!isFullyCompleted && completionRatio > 0 && (
                                <div 
                                  className="absolute top-0 left-0 bottom-0 z-0 transition-all duration-700 ease-out opacity-15"
                                  style={{ width: `${completionRatio * 100}%`, backgroundColor: habit.color || PRESET_COLORS[0] }}
                                />
                              )}

                              {/* LIGNE 1 : Nom + Checkbox + Corbeille (se colore à la complétion) */}
                              <div 
                                className="flex items-center justify-between relative z-10 transition-colors sm:cursor-default cursor-pointer"
                                style={isFullyCompleted ? { backgroundColor: habit.color || PRESET_COLORS[0] } : {}}
                                onClick={() => {
                                  // Sur mobile, cliquer sur la ligne (hors checkbox) ouvre la modale d'édition
                                  if (window.innerWidth < 640) {
                                    setHabitToEdit(habit);
                                    setHabitModalOpen(true);
                                  }
                                }}
                              >
                                <div className="flex-1 p-4 flex flex-col justify-center relative overflow-hidden">
                                  {!isFullyCompleted && (
                                    <div
                                      className="absolute top-0 left-0 w-3 h-full z-[-1]"
                                      style={{ backgroundColor: habit.color || PRESET_COLORS[0] }}
                                    />
                                  )}
                                  <div className="flex items-center gap-2 mb-1 pl-4">
                                    <span className="text-xs font-bold text-muted uppercase italic tracking-wider">
                                      {habit.category}
                                    </span>
                                    {habit.time && (
                                      <span className="text-[10px] font-black bg-surface border-2 border-foreground px-1 py-0.5 rounded shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                                        {habit.time}
                                      </span>
                                    )}
                                  </div>
                                  <span className="font-black text-base sm:text-lg leading-tight break-words flex items-center gap-2 pl-4">
                                    {habit.icon && <span className="text-xl">{habit.icon}</span>}
                                    {habit.name}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2 p-4 shrink-0">
                                  {/* BOUTON VALIDER */}
                                  <motion.button
                                    whileTap={{ scale: 0.8 }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggleHabit(habit.id, g.group.id);
                                    }}
                                    className={`neo-checkbox shrink-0 !w-12 !h-12 ${
                                      hasCurrentUserValidated 
                                        ? "shadow-none translate-x-[2px] translate-y-[2px]" 
                                        : "bg-surface shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                                    }`}
                                    style={hasCurrentUserValidated ? { backgroundColor: habit.color || PRESET_COLORS[0] } : {}}
                                    aria-label={`Valider ${habit.name}`}
                                  >
                                    {hasCurrentUserValidated && (
                                      <motion.div
                                        initial={{ scale: 0, rotate: -45 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{ type: "spring", stiffness: 500, damping: 20 }}
                                      >
                                        <Check strokeWidth={4} className="text-foreground shrink-0 w-6 h-6" />
                                      </motion.div>
                                    )}
                                  </motion.button>

                                  {/* BOUTON EDIT (Desktop) */}
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={(e) => { 
                                      e.stopPropagation();
                                      setHabitToEdit(habit); 
                                      setHabitModalOpen(true); 
                                    }}
                                    className="hidden sm:flex p-1.5 border-2 border-foreground bg-primary text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
                                    aria-label="Modifier"
                                  >
                                    <Edit size={14} />
                                  </motion.button>

                                  {/* BOUTON SUPPRIMER (Desktop) */}
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteHabit(habit.id, g.group.id);
                                    }}
                                    className="hidden sm:flex p-1.5 border-2 border-foreground bg-red-500 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
                                    aria-label="Supprimer"
                                  >
                                    <Trash2 size={14} />
                                  </motion.button>
                                </div>
                              </div>

                              {/* LIGNE 2 : Avatars + "Validé par" (reste neutre) */}
                              <div className="flex items-center justify-between px-4 py-2 bg-surface/50 border-t-2 border-foreground/20 relative z-10">
                                <div className="flex -space-x-2">
                                  {habit.members.map(member => {
                                    const memberValidated = validatorIds.includes(member.id);
                                    return (
                                      <div 
                                        key={member.id}
                                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 overflow-hidden flex items-center justify-center transition-all ${
                                          memberValidated 
                                            ? 'border-green-600 ring-2 ring-green-500 bg-green-100' 
                                            : 'border-foreground/40 bg-gray-200 grayscale opacity-50'
                                        }`}
                                        title={`${member.username}${memberValidated ? ' ✓' : ''}`}
                                      >
                                        {member.avatar_url ? (
                                          <Image src={member.avatar_url} alt={member.username} width={32} height={32} className="object-cover w-full h-full" />
                                        ) : (
                                          <span className="font-bold text-[8px]">{member.username.substring(0, 2).toUpperCase()}</span>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                                <div>
                                  {validatedUsernames.length > 0 ? (
                                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">
                                      ✓ {validatedUsernames.join(", ")}
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-30 italic">
                                      Aucune validation
                                    </span>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>

                      {filteredHabits.length === 0 && (
                        <div className="p-8 text-center font-bold text-muted bg-surface uppercase tracking-widest">
                          {groupHabits.length === 0 ? "Aucun objectif pour le moment." : "Aucun objectif pour ce jour."}
                        </div>
                      )}

                      {/* BOUTON AJOUTER */}
                      <div className="p-3 bg-surface flex justify-end border-t-4 border-foreground">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => { setActiveGroupId(g.group.id); setHabitModalOpen(true); }}
                          className="bg-primary border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all px-3 py-1 flex items-center justify-center gap-1 text-xs font-black uppercase"
                        >
                          <Plus size={16} strokeWidth={4} />
                          AJOUTER
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
          )}
        </div>
      )}

      <SharedGroupModal 
        isOpen={isGroupModalOpen} 
        onClose={() => { setGroupModalOpen(false); setGroupToEdit(null); }} 
        groupToEdit={groupToEdit} 
        onSave={handleSaveGroup} 
        onLeaveGroup={groupToEdit ? () => handleLeaveGroup(groupToEdit.group.id) : undefined}
      />
      <SharedHabitModal 
        isOpen={isHabitModalOpen} 
        onClose={() => { setHabitModalOpen(false); setHabitToEdit(null); }} 
        habitToEdit={habitToEdit} 
        onSave={handleSaveHabit} 
        onDelete={(habitId) => {
          if (!habitToEdit) return;
          handleDeleteHabit(habitId, habitToEdit.group_id);
          setHabitModalOpen(false);
          setHabitToEdit(null);
        }}
      />
      </div>
      </motion.div>
    </>
  );
}

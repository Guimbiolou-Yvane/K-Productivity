"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Users, Plus, Trash2, ChevronDown, ChevronUp, Check } from "lucide-react";
import { sharedHabitService } from "@/lib/services/sharedHabitService";
import { authService } from "@/lib/services/authService";
import { UserProfile } from "@/lib/models/user";
import { SharedGroup, UISharedHabit } from "@/lib/models/sharedHabit";
import SharedGroupModal from "./SharedGroupModal";
import SharedHabitModal, { SharedHabitFormData } from "./SharedHabitModal";
import SectionInfo from "../SectionInfo";
import { PRESET_COLORS } from "@/components/habit-tracker/constants";
import Image from "next/image";

export default function SharedHabitsTracker() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [groups, setGroups] = useState<{group: SharedGroup, members: UserProfile[]}[]>([]);
  const [habitsByGroup, setHabitsByGroup] = useState<{ [groupId: string]: UISharedHabit[] }>({});
  const [expandedGroups, setExpandedGroups] = useState<{ [groupId: string]: boolean }>({});
  const [isLoading, setIsLoading] = useState(true);
  
  const [isGroupModalOpen, setGroupModalOpen] = useState(false);
  const [isHabitModalOpen, setHabitModalOpen] = useState(false);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split("T")[0];

  useEffect(() => { loadData(); }, []);

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

  const handleCreateGroup = async (name: string, invitedFriends: string[]) => {
    try {
      await sharedHabitService.createGroup(name, invitedFriends);
      setGroupModalOpen(false);
      loadData();
    } catch (e) { console.error(e); }
  };

  const handleAddHabit = async (data: SharedHabitFormData) => {
    if (!activeGroupId) return;
    try {
      await sharedHabitService.addSharedHabit(activeGroupId, data.name, data.category, data.frequency, data.color, data.icon, data.startDate, data.endDate, data.time);
      setHabitModalOpen(false);
      const gId = activeGroupId;
      setActiveGroupId(null);
      const newHabits = await sharedHabitService.fetchHabitsByGroup(gId);
      setHabitsByGroup(prev => ({ ...prev, [gId]: newHabits }));
    } catch (e) { console.error(e); }
  };

  const handleToggleHabit = async (habitId: string, groupId: string) => {
    if (!currentUser) return;
    setHabitsByGroup(prev => {
      const gHabits = prev[groupId].map(h => {
        if (h.id === habitId) {
          const key = `${todayStr}_${currentUser.id}`;
          return { ...h, completedLogs: { ...h.completedLogs, [key]: !h.completedLogs[key] } };
        }
        return h;
      });
      return { ...prev, [groupId]: gHabits };
    });
    try {
      await sharedHabitService.toggleLog(habitId, todayStr);
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
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="w-full p-4 md:p-8 flex flex-col items-center max-w-6xl mx-auto font-sans"
    >
      {/* TITRE DE PAGE */}
      <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3 pl-2 border-l-8 border-primary mb-2">
            <h1 className="text-xl sm:text-2xl font-black uppercase text-foreground leading-none">
              Objectifs Communs
            </h1>
            <SectionInfo
              title="Objectifs partagés"
              description="Crée des groupes, invite tes amis, et fixez-vous des objectifs en commun. Chaque membre doit valider pour que l'objectif soit totalement accompli !"
              example="Courir 5km chaque jour en groupe"
            />
          </div>
          <p className="text-sm font-bold text-foreground/50 pl-3">
            Défie tes amis et progressez ensemble au quotidien !
          </p>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setGroupModalOpen(true)}
          className="bg-primary border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all px-4 py-2 flex items-center justify-center gap-2 text-sm font-black uppercase shrink-0"
        >
          <Users size={18} strokeWidth={3} />
          Créer un groupe
        </motion.button>
      </div>

      <div className="w-full border-b-4 border-foreground mb-8" />

      {/* GROUPES */}
      <div className="w-full flex flex-col gap-10">
        {groups.length === 0 ? (
          <div className="text-center font-bold text-foreground/50 py-16 neo-card bg-surface border-dashed">
            {isLoading ? "Chargement..." : "Tu n'es dans aucun groupe. Clique sur \"Créer un groupe\" pour commencer !"}
          </div>
        ) : (
          groups.map(g => {
            const isExpanded = expandedGroups[g.group.id];
            const groupHabits = habitsByGroup[g.group.id] || [];

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
                  {isExpanded ? <ChevronUp size={22} strokeWidth={3} /> : <ChevronDown size={22} strokeWidth={3} />}
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
                      <AnimatePresence mode="popLayout">
                        {groupHabits.map((habit, index) => {
                          const validatorIds = habit.members.filter(m => habit.completedLogs[`${todayStr}_${m.id}`]).map(m => m.id);
                          const hasCurrentUserValidated = validatorIds.includes(currentUser.id);
                          const completionRatio = validatorIds.length / habit.members.length;
                          const isFullyCompleted = completionRatio === 1;
                          const validatedUsernames = habit.members.filter(m => validatorIds.includes(m.id)).map(m => m.username);

                          return (
                            <motion.div
                              layout
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              transition={{ type: "spring", stiffness: 400, damping: 30, delay: index * 0.05 }}
                              key={habit.id}
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
                                className="flex items-center justify-between relative z-10 transition-colors"
                                style={isFullyCompleted ? { backgroundColor: habit.color || PRESET_COLORS[0] } : {}}
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
                                    onClick={() => handleToggleHabit(habit.id, g.group.id)}
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

                                  {/* BOUTON SUPPRIMER */}
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => handleDeleteHabit(habit.id, g.group.id)}
                                    className="p-1.5 border-2 border-foreground bg-red-500 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
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

                      {groupHabits.length === 0 && (
                        <div className="p-8 text-center font-bold text-muted bg-surface uppercase tracking-widest">
                          Aucun objectif pour le moment.
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

      <SharedGroupModal isOpen={isGroupModalOpen} onClose={() => setGroupModalOpen(false)} onSave={handleCreateGroup} />
      <SharedHabitModal isOpen={isHabitModalOpen} onClose={() => setHabitModalOpen(false)} onSave={handleAddHabit} />
    </motion.div>
  );
}

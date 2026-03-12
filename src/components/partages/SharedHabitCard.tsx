import { useState } from "react";
import { motion } from "motion/react";
import { Check, Trash2, Edit } from "lucide-react";
import { UISharedHabit } from "@/lib/models/sharedHabit";
import { PRESET_COLORS } from "@/components/habit-tracker/constants";
import Image from "next/image";

interface SharedHabitCardProps {
  habit: UISharedHabit;
  currentUserId: string;
  dateStr: string; // La date courante (YYYY-MM-DD)
  onToggle: (habitId: string) => void;
  onDelete: (habitId: string) => void;
}

export default function SharedHabitCard({
  habit,
  currentUserId,
  dateStr,
  onToggle,
  onDelete
}: SharedHabitCardProps) {
  // Déterminer qui a validé
  const validatorsIds = habit.members.filter(member => 
    habit.completedLogs[`${dateStr}_${member.id}`]
  ).map(m => m.id);

  const hasValidated = validatorsIds.includes(currentUserId);
  const completionRatio = validatorsIds.length / habit.members.length;
  const isFullyCompleted = completionRatio === 1;

  // Récupérer les noms de ceux qui ont validé
  const validatedNicknames = habit.members
    .filter(m => validatorsIds.includes(m.id))
    .map(m => m.username)
    .join(", ");

  const cardColor = isFullyCompleted 
    ? (habit.color || PRESET_COLORS[0]) 
    : "transparent";

  return (
    <div className="flex flex-col gap-2 w-full mt-4">
      <motion.div
        layout
        className={`neo-card flex flex-col relative overflow-hidden transition-all duration-300 w-full`}
        style={{
          borderWidth: "4px",
          borderStyle: "solid",
          borderColor: "black",
          backgroundColor: cardColor
        }}
      >
        {/* Progress Background si pas totalement complété, mais qu'il y a des validations */}
        {!isFullyCompleted && completionRatio > 0 && (
          <div 
            className="absolute left-0 top-0 bottom-0 z-0 opacity-20 transition-all duration-500 ease-out"
            style={{ 
              width: `${completionRatio * 100}%`,
              backgroundColor: habit.color || PRESET_COLORS[0]
            }}
          />
        )}

        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 w-full">
          {/* Header Info */}
          <div className="flex flex-col flex-grow w-full">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase italic tracking-wider">
                {habit.category}
              </span>
              {habit.time && (
                <span className="text-[10px] font-black bg-surface border-2 border-foreground px-1 py-0.5 rounded">
                  {habit.time}
                </span>
              )}
            </div>
            
            <div className="font-black text-xl sm:text-2xl leading-tight flex items-center gap-2 break-words">
              {habit.icon && <span>{habit.icon}</span>}
              {habit.name}
            </div>
          </div>

          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end shrink-0">
             {/* Section Avatars (Mini) */}
             <div className="flex -space-x-3 mt-2 sm:mt-0">
               {habit.members.map(member => {
                 const memberValidated = validatorsIds.includes(member.id);
                 return (
                   <div 
                     key={member.id} 
                     className={`w-10 h-10 rounded-full border-2 overflow-hidden flex items-center justify-center relative transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                       memberValidated ? 'border-green-500 ring-2 ring-green-500 bg-surface' : 'border-foreground bg-gray-200 grayscale opacity-70'
                     }`}
                     title={member.username}
                   >
                     {member.avatar_url ? (
                        <Image src={member.avatar_url} alt={member.username} width={40} height={40} className="object-cover w-full h-full" />
                     ) : (
                        <span className="font-bold text-xs">{member.username.substring(0, 2).toUpperCase()}</span>
                     )}
                   </div>
                 );
               })}
             </div>

             {/* Bouton Toggle (Moi) */}
             <motion.button
               whileHover={{ scale: 1.1 }}
               whileTap={{ scale: 0.9 }}
               onClick={() => onToggle(habit.id)}
               className={`w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center border-4 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all cursor-pointer ${
                 hasValidated ? "bg-surface text-green-500" : "bg-primary"
               }`}
             >
               {hasValidated ? (
                 <Check strokeWidth={4} className="w-8 h-8 sm:w-10 sm:h-10 text-green-500" />
               ) : (
                 <Check strokeWidth={4} className="w-8 h-8 sm:w-10 sm:h-10 opacity-30 text-black" />
               )}
             </motion.button>
             
             {/* Delete */}
             <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onDelete(habit.id)}
                className="p-2 border-2 border-foreground bg-red-500 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all ml-2"
                aria-label="Supprimer habitude"
             >
                <Trash2 size={18} />
             </motion.button>
          </div>
        </div>
      </motion.div>
      
      {/* Surnoms de ceux qui ont validé */}
      <div className="flex items-center gap-2 px-2">
         {validatedNicknames ? (
           <span className="text-xs font-bold uppercase tracking-wider opacity-70">
             Validé par : <span className="text-primary italic">{validatedNicknames}</span>
           </span>
         ) : (
           <span className="text-xs font-bold uppercase tracking-wider opacity-50 italic">
             Aucune validation pour aujourd'hui
           </span>
         )}
      </div>
    </div>
  );
}

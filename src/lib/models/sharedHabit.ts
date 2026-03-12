import { UserProfile } from "./user";
import { HabitCategory } from "./habit";

// Structure d'un groupe d'objectifs partagés
export interface SharedGroup {
  id: string; // UUID
  name: string;
  creator_id: string; // UserProfile id
  created_at: string;
}

// Structure d'un membre de groupe
export interface SharedGroupMember {
  group_id: string;
  user_id: string;
  joined_at: string;
  profile?: UserProfile; // Données du profil jointes depuis Supabase
}

// L'objectif partagé
export interface SharedHabit {
  id: string; // UUID
  group_id: string; // UUID du groupe
  created_by: string; // UUID créateur
  name: string; // Nom de l'objectif
  category: HabitCategory; // Catégorie (Enum)
  frequency: string[]; // Jours de la semaine
  color?: string; // Code couleur hex
  icon?: string; // Emoji
  time?: string; // Optionnel : HH:mm
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  target_month: string; // YYYY-MM
  created_at: string;
}

// Journal des validations pour les objectifs partagés
export interface SharedHabitLog {
  id: string;
  shared_habit_id: string;
  user_id: string;
  completed_date: string; // YYYY-MM-DD
  created_at: string;
}

// Type UI pour faciliter l'affichage des habitudes partagées
export interface UISharedHabit extends SharedHabit {
  groupInfo?: SharedGroup;
  members: UserProfile[]; // Tous les membres du groupe
  completedLogs: {
    // Map: custom string (ex: 'YYYY-MM-DD_USERID') -> boolean pour accéder facilement à une validation, ou un array
    // Ex: "2026-03-12_USERUUID" -> true si complété
    [dateAndUserId: string]: boolean;
  };
}

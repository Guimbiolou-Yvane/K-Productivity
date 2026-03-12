import { UserProfile } from "./user";

export type HabitCategory =
  | "SANTÉ"
  | "DÉV. PERSO"
  | "TRAVAIL"
  | "SOCIAL"
  | "GÉNÉRAL"
  | "SPORT"
  | "MÉDITATION"
  | "ÉCOLE";

// Modèle de la table 'habits' dans Supabase
export interface Habit {
  id: string; // UUID généré par Supabase
  user_id: UserProfile["id"]; // Clé étrangère vers profiles.id (Le propriétaire)
  name: string; // Nom de l'objectif
  category: HabitCategory; // Catégorie de l'objectif
  frequency: string[]; // Jours de la semaine ("Lun", "Mar", etc.)
  color?: string; // Code couleur (hex ou variable Tailwind)
  icon?: string; // Emoji
  time?: string; // Heure sous format "HH:mm" (optionnelle)
  target_month: string; // Mois cible sous format "YYYY-MM"
  start_date: string; // Date de début ("YYYY-MM-DD")
  end_date: string; // Date de fin ("YYYY-MM-DD")
  created_at: string; // Date de création
}

// Modèle de la table 'habit_logs' dans Supabase (Tracking journalier)
export interface HabitLog {
  id: string; // UUID
  habit_id: Habit["id"]; // Clé étrangère vers l'objectif accompli (habits.id)
  user_id: UserProfile["id"]; // Clé étrangère vers l'utilisateur (profiles.id)
  completed_date: string; // format YYYY-MM-DD
  created_at: string; // Date de création de l'entrée
}

// Type utilisé spécifiquement par l'UI (qui aggrège les Habits et les Logs)
export type UIHabit = Omit<Habit, "user_id"> & {
  // Un Dictionnaire où la clé est la date 'YYYY-MM-DD' (ou le jour de la semaine pour la vue actuelle) et la valeur un boolean
  completedLogs: Record<string, boolean>;
};

// === NOUVEAUX MODÈLES DE STATISTIQUES ===

export interface StreakStats {
  current: number; // Série de jours actuelle ininterrompue
  best: number; // Record absolu de l'utilisateur
}

export interface DailyActivityLog {
  date: string; // Affichage de la date (ex: "01/03" ou "Auj.")
  count: number; // Nombre d'habitudes achevées ce jour
  color: string; // Couleur dominante (ou fallback gris)
  isToday?: boolean; // Indicateur pour le surlignage "Aujourd'hui"
}

export interface HabitMonthlyStats {
  id: Habit["id"] | "all"; // ID de l'habit ("all" pour l'agrégation générale de tous les objectifs)
  name: string; // Nom de l'objectif ("Tous les objectifs" ou "LiRE 10 PAGES")
  completions: number[]; // Tableau des jours du mois où l'objectif a été validé (ex: [1, 2, 5, 20])
  failed?: number[]; // Tableau des jours échoués
  notApplicable?: number[]; // Tableau des jours non applicables
}

export interface MonthlyStatsData {
  allCompletions: number[]; // Tableau des jours du mois où TOUS les objectifs ont été atteints
  habits: HabitMonthlyStats[]; // Statistiques individuelles par habitude
}

export interface SuccessRatePoint {
  label: string; // Label de l'axe X (ex: "Lun", "Sem 1", "Jan")
  rate: number; // Pourcentage de réussite (0-100)
  completed: number; // Nombre d'objectifs accomplis
  total: number; // Nombre total d'objectifs attendus
}

export interface OverallCompletionStats {
  completed: number; // Nombre total d'objectifs réalisés ce mois
  expected: number; // Nombre total d'objectifs attendus ce mois (basé sur la fréquence)
  missed: number; // Nombre d'objectifs manqués (expected - completed)
  rate: number; // Pourcentage de réalisation (0-100)
}

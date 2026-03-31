export type GoalCategory =
  | "SANTÉ"
  | "DÉV. PERSO"
  | "TRAVAIL"
  | "SOCIAL"
  | "FINANCES"
  | "ÉDUCATION"
  | "FAMILLE"
  | "GÉNÉRAL";

export type GoalDuration =
  | "1_week"
  | "2_weeks"
  | "1_month"
  | "3_months"
  | "6_months"
  | "1_year"
  | "2_years"
  | "5_years"
  | "custom";

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  category: GoalCategory;
  icon: string;
  color: string;
  duration: GoalDuration;
  start_date: string;   // YYYY-MM-DD
  target_date: string;  // YYYY-MM-DD (date cible de réalisation)
  is_completed: boolean;
  completed_at?: string;
  created_at: string;
}

export const GOAL_DURATION_LABELS: Record<GoalDuration, string> = {
  "1_week": "1 semaine",
  "2_weeks": "2 semaines",
  "1_month": "1 mois",
  "3_months": "3 mois",
  "6_months": "6 mois",
  "1_year": "1 an",
  "2_years": "2 ans",
  "5_years": "5 ans",
  "custom": "Personnalisé",
};

export const GOAL_CATEGORIES: GoalCategory[] = [
  "FINANCES",
  "ÉDUCATION",
  "TRAVAIL",
  "DÉV. PERSO",
  "SANTÉ",
  "SOCIAL",
  "FAMILLE",
  "GÉNÉRAL",
];

export const GOAL_ICONS = [
  "🏠", "🚗", "🎓", "💰", "✈️", "💍", "📱", "💻",
  "🏋️", "📖", "🎯", "🏦", "👨‍👩‍👧", "🎸", "🌍", "⭐",
];

export const GOAL_COLORS = [
  "#ffda59", "#1fb05a", "#4facff", "#9d4edd",
  "#ff6b6b", "#ff9e00", "#06b6d4", "#ec4899",
];

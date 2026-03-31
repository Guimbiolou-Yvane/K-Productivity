export interface Todo {
  id: string;
  user_id: string;
  title: string;
  time?: string; // Heure optionnelle au format "HH:MM"
  is_completed: boolean;
  created_at: string;
}

import { UIHabit } from "@/lib/models/habit";

export const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
export const DAYS_FULL = [
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
  "Dimanche",
];

export const PRESET_COLORS = [
  "#ffda59",
  "#1fb05a",
  "#ff6b6b",
  "#4facff",
  "#9d4edd",
  "#ff9e00",
];
export const PRESET_ICONS = [
  "🎯",
  "🏃‍♂️",
  "📚",
  "💧",
  "🧘‍♂️",
  "💼",
  "🧠",
  "🔥",
  "💪",
  "🥦",
];

/**
 * Génère un tableau de tous les jours du mois courant (ou target_month donné)
 * Chaque entrée contient la date YYYY-MM-DD, le nom du jour, etc.
 */
export interface MonthDay {
  date: string; // "2026-03-01"
  dayName: string; // "Sam"
  dayNumber: number; // 1
  isToday: boolean;
  isFuture: boolean;
}

export function getMonthDays(targetMonth?: string): MonthDay[] {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const month =
    targetMonth ||
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [year, mon] = month.split("-").map(Number);
  const daysInMonth = new Date(year, mon, 0).getDate();

  const DAY_NAMES = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
  const days: MonthDay[] = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, mon - 1, d);
    const dateStr = `${year}-${String(mon).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

    days.push({
      date: dateStr,
      dayName: DAY_NAMES[dateObj.getDay()],
      dayNumber: d,
      isToday: dateStr === todayStr,
      isFuture: dateStr > todayStr,
    });
  }

  return days;
}

/**
 * Retourne l'index du jour courant dans le tableau des jours du mois.
 */
export function getTodayIndex(monthDays: MonthDay[]): number {
  return monthDays.findIndex((d) => d.isToday);
}

/**
 * Vérifie si une date donnée est en dehors de la plage [start_date, end_date] de l'objectif.
 */
export function isOutsideDates(habit: UIHabit, dateStr: string): boolean {
  if (!habit.start_date || !habit.end_date) return false;

  return dateStr < habit.start_date || dateStr > habit.end_date;
}

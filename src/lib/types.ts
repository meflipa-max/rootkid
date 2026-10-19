export type Category = 'hamburger' | 'insalatone' | 'focacce' | 'dolci' | 'fritti';

export interface Dish {
  id: string;
  name: string;
  category: Category;
  ingredients: string[];
  /** letta da una foto scritta a mano: da controllare nelle impostazioni */
  verify?: boolean;
}

export interface DishStat {
  seen: number;
  correct: number;
  /** scatola di Leitner 0..5 */
  box: number;
  last: number;
  streak: number;
  recentWrong: number;
  missed: Record<string, number>;
  /** ingredienti messi per errore: diventano distrattori mirati */
  confused?: Record<string, number>;
}

export interface Settings {
  sound: boolean;
  haptics: boolean;
  dailyGoal: number;
}

export type MKind = 'serve' | 'memory' | 'combo' | 'shifts' | 'stars3' | 'revenge' | 'guess' | 'cards' | 'vip';

export interface Daily {
  date: string;
  ids: string[];
  prog: Partial<Record<MKind, number>>;
  claimed: string[];
  chest: boolean;
}

export interface Save {
  v: 1;
  dishes: Dish[];
  stats: Record<string, DishStat>;
  xp: number;
  totalAnswered: number;
  totalCorrect: number;
  streakDays: number;
  lastDay: string;
  todayCount: number;
  todayDate: string;
  bestRush: number;
  bestCombo: number;
  coins: number;
  bestShift: number;
  shifts: number;
  skins: string[];
  skin: string;
  build: Record<string, number>;
  menuV?: number;
  daily?: Daily;
  settings: Settings;
}

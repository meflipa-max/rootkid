export type Category = 'hamburger' | 'insalatone' | 'focacce' | 'classiche' | 'speciali' | 'dolci' | 'fritti';

export interface Dish {
  id: string;
  name: string;
  category: Category;
  /** nell'ordine di montaggio: dal basso verso l'alto nei panini, prima il forno e poi l'uscita nelle pizze */
  ingredients: string[];
  /** letta da una foto scritta a mano: da controllare nelle impostazioni */
  verify?: boolean;
  /** pizze: ingredienti che si mettono all'uscita dal forno */
  after?: string[];
  /** panini: l'ordine di montaggio è fisso e il gioco lo allena */
  ordered?: boolean;
  /** ordine di montaggio o "dopo il forno" proposti da me: l'utente li deve confermare */
  draft?: boolean;
  /** si ordina spesso: si impara prima e si ripassa prima del turno */
  popular?: boolean;
  /** perché si fa così, scritto dall'utente (es. "il cheddar sopra la carne calda, così si scioglie") */
  why?: string;
  /** fuori menu (piatto che non si fa più): resta salvato con le statistiche, ma il gioco non lo propone */
  off?: boolean;
}

/** stato FSRS di un piatto: stabilità in giorni, difficoltà 1..10, ultimo ripasso */
export interface FsState {
  s: number;
  d: number;
  t: number;
}

export interface DishStat {
  seen: number;
  correct: number;
  /** fase del piatto 0..5 (Nuovo, Riconosci, Ricorda, A memoria, Distingui, Oro) */
  box: number;
  /** ultima risposta che conta come prova di memoria */
  last: number;
  streak: number;
  recentWrong: number;
  missed: Record<string, number>;
  /** ingredienti messi per errore: diventano distrattori mirati */
  confused?: Record<string, number>;
  /** quanto è fresco nella memoria (FSRS) */
  fs?: FsState;
  /** millisecondi per ingrediente nelle risposte pulite (media mobile): misura la scioltezza */
  pace?: number;
  /** festeggiamenti già fatti: primo a memoria, piatto d'oro */
  mem1?: boolean;
  gold?: boolean;
  /** era a memoria ed è caduto: se torna su è "recuperato" */
  lapsed?: boolean;
  /** giorno dell'ultimo errore (per la missione del riscatto) */
  wrongDay?: string;
}

export interface Settings {
  sound: boolean;
  haptics: boolean;
  dailyGoal: number;
  /** grandezza del testo: 1 normale, 2 grande, 3 molto grande */
  text: 1 | 2 | 3;
  /** ritmo tranquillo: clienti molto più pazienti e arrivi più distanziati */
  calm: boolean;
  /** scelta iniziale (testo e ritmo) già fatta */
  setup?: boolean;
  /** gesti facoltativi: spalmare la salsa con un giro del dito, spolverare il grana */
  gestures?: boolean;
}

export type MKind =
  | 'serve' | 'memory' | 'combo' | 'shifts' | 'stars3' | 'revenge' | 'guess' | 'cards' | 'vip'
  | 'phaseup' | 'fresh' | 'redeem' | 'order' | 'real';

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
  /** versione del modello di memoria: sotto la 2 si mostra una volta il messaggio "memoria più precisa" */
  memV?: number;
  /** ultimo livello per cui è già stato dato il forziere */
  lvlPaid?: number;
  /** diario del turno vero: giorno -> piatti fatti al lavoro */
  real?: Record<string, string[]>;
  /** quando è stato scritto il diario di ogni giorno: il ripasso arriva dopo una dormita */
  realAt?: Record<string, number>;
  /** ultimo giorno di lavoro già ripassato il giorno dopo */
  realDone?: string;
  /** la tua postazione: per ogni banco, gli ingredienti nell'ordine in cui stanno */
  station?: Record<string, string[]>;
  /** ingredienti uniti dall'utente: nome tolto (minuscolo) -> nome da usare */
  aliases?: Record<string, string>;
  /** puntate "Sicuro!": quante e quante giuste */
  sure?: { n: number; ok: number };
}

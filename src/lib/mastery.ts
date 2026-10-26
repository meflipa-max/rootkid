import type { DishStat } from './types';
import { recall } from './fsrs';

const DAY = 864e5;
/**
 * Attesa minima per salire di fase oltre la 2: la fase misura la memoria a lungo termine,
 * non la ripetizione nella stessa sessione. Sotto la 2 si sale anche nello stesso turno.
 */
export const INTERVAL_DAYS = [0, 0, 1, 2, 4, 8];

/** le fasi di un piatto: ognuna è un modo diverso di presentarlo nel turno */
export const PHASES = ['Nuovo', 'Riconosci', 'Ricorda', 'A memoria', 'Distingui', 'Oro'] as const;
export const phaseOf = (s?: DishStat) => (s && s.seen ? Math.max(0, Math.min(5, s.box)) : 0);

export const emptyStat = (): DishStat => ({ seen: 0, correct: 0, box: 0, last: 0, streak: 0, recentWrong: 0, missed: {}, confused: {} });

/** 0..1 */
export const mastery = (s?: DishStat) => (s && s.seen ? s.box / 5 : 0);
export const accuracy = (s?: DishStat) => (s && s.seen ? s.correct / s.seen : 0);
/** probabilità di ricordarlo adesso (0 se non è mai stato messo alla prova) */
export const freshness = (s?: DishStat, now = Date.now()) => recall(s?.fs, now);

/** da ripassare: la probabilità di ricordarlo è scesa sotto il 90% (FSRS) */
export const isDue = (s: DishStat | undefined, now: number) => {
  if (!s || !s.seen) return true;
  if (s.fs) return recall(s.fs, now) < 0.9;
  return now - s.last >= [0, 1 / 6, 1, 2, 4, 8][s.box] * DAY;
};

/** abbastanza tempo dall'ultima prova per salire di fase */
export const ripe = (s: DishStat | undefined, now: number) => !s || s.box < 2 || !s.last || now - s.last >= INTERVAL_DAYS[s.box] * DAY;

/** piatti già studiati che oggi andrebbero ripassati (ripetizione dilazionata) */
export const dueCount = (stats: Record<string, DishStat>, ids: string[], now = Date.now()) =>
  ids.filter((id) => stats[id]?.fs && isDue(stats[id], now)).length;

/** a memoria e da rinfrescare: in vetrina si impolvera */
export const isDusty = (s: DishStat | undefined, now = Date.now()) => !!s?.fs && s.box >= 3 && isDue(s, now);

const PHASE_COLORS = ['#85776a', '#c8463b', '#d98a3c', '#e3a83a', '#5b8db8', '#6f9a6a'];
export function masteryLabel(s?: DishStat): { text: string; color: string } {
  if (!s || !s.seen) return { text: 'Mai visto', color: '#85776a' };
  const p = phaseOf(s);
  return { text: PHASES[p], color: PHASE_COLORS[p] };
}

export const masteryColor = (m: number) => (m < 0.3 ? '#c8463b' : m < 0.6 ? '#d98a3c' : m < 1 ? '#e3a83a' : '#6f9a6a');

/** quanto "serve" ripassare un piatto */
export function weight(s: DishStat | undefined, now: number) {
  const m = mastery(s);
  let w = 0.15 + (1 - m) ** 2;
  if (!s || !s.seen) w += 0.5;
  else if (isDue(s, now)) w += 0.3 + (1 - freshness(s, now));
  if (s) w += Math.min(s.recentWrong, 3) * 0.35;
  return w;
}

export function pickWeighted<T>(items: { item: T; w: number }[], n: number): T[] {
  const pool = [...items];
  const out: T[] = [];
  while (out.length < n && pool.length) {
    const total = pool.reduce((a, b) => a + b.w, 0);
    let r = Math.random() * total;
    let i = 0;
    for (; i < pool.length - 1; i++) {
      r -= pool[i].w;
      if (r <= 0) break;
    }
    out.push(pool[i].item);
    pool.splice(i, 1);
  }
  return out;
}

export const shuffle = <T,>(a: T[]): T[] => {
  const x = [...a];
  for (let i = x.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [x[i], x[j]] = [x[j], x[i]];
  }
  return x;
};

export const levelOf = (xp: number) => Math.floor(Math.sqrt(xp / 60)) + 1;
export const levelBounds = (lvl: number) => [60 * (lvl - 1) ** 2, 60 * lvl ** 2] as const;

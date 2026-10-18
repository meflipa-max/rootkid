import type { DishStat } from './types';

const DAY = 864e5;
const INTERVAL_DAYS = [0, 0, 1, 2, 4, 8];

export const emptyStat = (): DishStat => ({ seen: 0, correct: 0, box: 0, last: 0, streak: 0, recentWrong: 0, missed: {} });

/** 0..1 */
export const mastery = (s?: DishStat) => (s && s.seen ? s.box / 5 : 0);
export const accuracy = (s?: DishStat) => (s && s.seen ? s.correct / s.seen : 0);

export const isDue = (s: DishStat | undefined, now: number) =>
  !s || !s.seen || now - s.last >= INTERVAL_DAYS[s.box] * DAY;

export function masteryLabel(s?: DishStat): { text: string; color: string } {
  if (!s || !s.seen) return { text: 'Nuovo', color: '#8b86a8' };
  const m = mastery(s);
  if (m < 0.3) return { text: 'Da studiare', color: '#ff4d6d' };
  if (m < 0.6) return { text: 'In crescita', color: '#ff9f43' };
  if (m < 1) return { text: 'Quasi!', color: '#ffd24a' };
  return { text: 'Padroneggiato', color: '#2ee59d' };
}

export const masteryColor = (m: number) => (m < 0.3 ? '#ff4d6d' : m < 0.6 ? '#ff9f43' : m < 1 ? '#ffd24a' : '#2ee59d');

/** quanto "serve" ripassare un piatto */
export function weight(s: DishStat | undefined, now: number) {
  const m = mastery(s);
  let w = 0.15 + (1 - m) ** 2;
  if (!s || !s.seen) w += 0.5;
  if (isDue(s, now)) w += 0.3;
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
const TITLES = ['Garzone', 'Apprendista', 'Pizzaiolo', 'Burgerista', 'Capo turno', 'Maestro', 'Chef', 'Leggenda'];
export const titleOf = (lvl: number) => TITLES[Math.min(lvl - 1, TITLES.length - 1)];

import { lvlOf, totalBuilt } from './build';
import { knownCount } from './levels';
import type { Dish, Save } from './types';

/**
 * Le stelle del locale (1–5): servono sia il locale costruito sia i piatti a memoria dei tuoi banchi.
 * Con le sole monete non si sale: un locale bellissimo con un cuoco che non sa le ricette resta a 2 stelle.
 */
export const STARS: { built: number; mem: number; perk: string }[] = [
  { built: 0, mem: 0, perk: 'Si apre!' },
  { built: 4, mem: 0.1, perk: 'Mance più ricche: +1 moneta a ogni mancia' },
  { built: 10, mem: 0.3, perk: 'Arriva il critico gastronomico: ordina un piatto che sai' },
  { built: 18, mem: 0.55, perk: 'Più clienti VIP' },
  { built: 28, mem: 0.8, perk: 'Il critico paga il doppio' },
];

export interface StarState {
  stars: number;
  built: number;
  known: number;
  total: number;
  /** cosa manca per la stella dopo (null se sei a 5) */
  next: { built: number; known: number } | null;
}

export function starsOf(build: Record<string, number>, known: number, total: number): StarState {
  const built = totalBuilt(build);
  const frac = total ? known / total : 0;
  let stars = 1;
  for (let k = 1; k < STARS.length; k++) {
    if (built >= STARS[k].built && frac >= STARS[k].mem) stars = k + 1;
    else break;
  }
  const n = STARS[stars];
  return { stars, built, known, total, next: n ? { built: Math.max(0, n.built - built), known: Math.max(0, Math.ceil(n.mem * total) - known) } : null };
}

export const starsFor = (save: Save, mine: Dish[]) => starsOf(save.build, knownCount(save.stats, mine.map((d) => d.id)), mine.length);

/** effetti delle migliorie e delle stelle durante il turno: comodità e monete, mai risposte */
export const tipChance = (b: Record<string, number>) => Math.min(0.9, 0.5 + 0.05 * (lvlOf(b, 'piante') + lvlOf(b, 'quadri') + lvlOf(b, 'luci')));
export const tipExtra = (b: Record<string, number>, stars: number) => lvlOf(b, 'tavolini') + (stars >= 2 ? 1 : 0);
export const vipChance = (b: Record<string, number>, stars: number) => 0.12 + 0.03 * lvlOf(b, 'insegna') + (stars >= 4 ? 0.05 : 0);
export const criticReward = (stars: number) => (40 + 20 * stars) * (stars >= 5 ? 2 : 1);

import type { Category, Dish, DishStat } from './types';
import { isDusty, phaseOf } from './mastery';
import { norm } from './questions';

/**
 * Il locale cresce con la memoria: ogni banco del lavoro ha il suo angolo nel locale, che si riempie
 * man mano che i suoi piatti diventano "a memoria", e i piatti d'oro finiscono incorniciati in parete.
 * Qui c'è solo il calcolo (puro): il disegno è in three/Growth.tsx.
 */
export type BancoId = 'pizza' | 'piastra' | 'insalate' | 'friggitoria';

export const BANCHI_LOCALE: { id: BancoId; name: string; short: string; cats: Category[] }[] = [
  { id: 'pizza', name: 'Banco pizze', short: 'Pizze', cats: ['classiche', 'speciali', 'dolci'] },
  { id: 'piastra', name: 'Piastra', short: 'Piastra', cats: ['hamburger', 'focacce'] },
  { id: 'insalate', name: 'Banco insalate', short: 'Insalate', cats: ['insalatone'] },
  { id: 'friggitoria', name: 'Friggitoria', short: 'Fritti', cats: ['fritti'] },
];

export interface BancoGrowth {
  id: BancoId;
  name: string;
  short: string;
  known: number;
  total: number;
  /** 0 = ancora niente a memoria, 1–3 = si riempie, 4 = completo (oro) */
  tier: number;
  /** fa parte dei miei banchi: si vede anche vuoto, come posto che aspetta */
  mine: boolean;
  /** gli ingredienti più usati dal banco: sono quelli che compaiono nelle vaschette */
  ings: string[];
}

export interface GoldDish {
  id: string;
  name: string;
  items: string[];
  cat: Category;
  dusty: boolean;
}

export interface Growth {
  banchi: BancoGrowth[];
  gold: GoldDish[];
  /** stelle del locale (lib/stars.ts): le aggiunge chi chiama, si vedono sull'insegna */
  stars?: number;
}

/** quanti piatti d'oro stanno in parete */
export const WALL_MAX = 15;

const tierOf = (known: number, total: number) => (!total || !known ? 0 : known >= total ? 4 : known / total >= 0.67 ? 3 : known / total >= 0.34 ? 2 : 1);

export function growthOf(menu: Dish[], mine: Dish[], stats: Record<string, DishStat>, now = Date.now()): Growth {
  const mineIds = new Set(mine.map((d) => d.id));
  const banchi = BANCHI_LOCALE.map((b) => {
    const dishes = menu.filter((d) => b.cats.includes(d.category));
    const known = dishes.filter((d) => phaseOf(stats[d.id]) >= 3).length;
    const count = new Map<string, number>();
    for (const d of dishes) for (const i of d.ingredients) count.set(norm(i), (count.get(norm(i)) ?? 0) + 1);
    const ings = [...count.entries()].sort((x, y) => y[1] - x[1]).slice(0, 6).map(([n]) => n);
    return { id: b.id, name: b.name, short: b.short, known, total: dishes.length, tier: tierOf(known, dishes.length), mine: dishes.some((d) => mineIds.has(d.id)), ings };
  });
  // in parete i piatti d'oro, sempre allo stesso posto; quelli da ripassare si impolverano (un ripasso e tornano a brillare)
  const gold = menu
    .filter((d) => phaseOf(stats[d.id]) >= 5)
    .map((d) => ({ id: d.id, name: d.name, items: d.ingredients, cat: d.category, dusty: isDusty(stats[d.id], now) }))
    .slice(0, WALL_MAX);
  return { banchi, gold };
}

/** cosa è cambiato dall'ultima volta che l'hai visto: un banco salito di grado o un piatto d'oro nuovo */
export function growthNews(g: Growth, seen: { tiers: Record<string, number>; gold: string[]; stars?: number } | undefined): { kind: 'stelle'; stars: number } | { kind: 'banco'; b: BancoGrowth } | { kind: 'oro'; d: GoldDish } | null {
  if (!seen) return null;
  if (g.stars && seen.stars && g.stars > seen.stars) return { kind: 'stelle', stars: g.stars };
  const b = g.banchi.find((x) => x.tier > (seen.tiers[x.id] ?? 0));
  if (b) return { kind: 'banco', b };
  const d = g.gold.find((x) => !seen.gold.includes(x.id));
  return d ? { kind: 'oro', d } : null;
}

export const seenOf = (g: Growth) => ({ tiers: Object.fromEntries(g.banchi.map((b) => [b.id, b.tier])), gold: g.gold.map((d) => d.id), stars: g.stars });

import type { Category, Dish } from './types';
import { PIZZA_INGREDIENTS } from './data';
import { SHELVES, shelfOf } from './pantry';
import { pieceOf } from './plate';
import { aliasList } from './aliases';

/**
 * La tua postazione: ogni ingrediente sta sempre nello stesso posto del banco, come al lavoro.
 * Così la memoria dei posti e dei movimenti lavora anche nell'app, invece di essere rimescolata a ogni ordine.
 */
export type StationId = 'pizza' | 'panini' | 'insalate' | 'dolci' | 'fritti';
export const STATIONS: { id: StationId; name: string; cats: Category[] }[] = [
  { id: 'pizza', name: 'Banco pizza', cats: ['classiche', 'speciali'] },
  { id: 'panini', name: 'Piastra e panini', cats: ['hamburger', 'focacce'] },
  { id: 'insalate', name: 'Insalatone', cats: ['insalatone'] },
  { id: 'dolci', name: 'Pizze dolci', cats: ['dolci'] },
  { id: 'fritti', name: 'Friggitoria', cats: ['fritti'] },
];
export const stationOf = (c: Category): StationId => STATIONS.find((s) => s.cats.includes(c))!.id;

const low = (s: string) => s.trim().toLowerCase();

/** tutti gli ingredienti (o i pezzi, in friggitoria) che stanno su un banco */
export function universeOf(id: StationId, dishes: Dish[]): string[] {
  const cats = STATIONS.find((s) => s.id === id)!.cats;
  const own = dishes.filter((d) => cats.includes(d.category));
  const list = id === 'fritti' ? own.flatMap((d) => d.ingredients.map((i) => pieceOf(i).type)) : own.flatMap((d) => d.ingredients);
  if (id === 'pizza') list.push(...PIZZA_INGREDIENTS);
  return aliasList(list);
}

/** disposizione di partenza: per ripiani (pane, carni, formaggi, verdure, salse, dolci), poi in ordine alfabetico */
export const defaultLayout = (list: string[]) =>
  [...list].sort((a, b) => SHELVES.indexOf(shelfOf(a)) - SHELVES.indexOf(shelfOf(b)) || a.localeCompare(b, 'it'));

/** la disposizione scelta dall'utente, completata con gli ingredienti nuovi in coda */
export function layoutOf(custom: string[] | undefined, universe: string[]): string[] {
  const u = new Map(universe.map((x) => [low(x), x]));
  const out: string[] = [];
  for (const x of custom ?? []) {
    const k = low(x);
    if (u.has(k)) {
      out.push(u.get(k)!);
      u.delete(k);
    }
  }
  return [...out, ...defaultLayout([...u.values()])];
}

/** mette le tessere del bancone nel loro posto fisso */
export function sortByLayout(tiles: string[], layout: string[]) {
  const idx = new Map(layout.map((x, i) => [low(x), i]));
  const at = (x: string) => idx.get(low(x)) ?? 1e4;
  return [...tiles].sort((a, b) => at(a) - at(b) || a.localeCompare(b, 'it'));
}

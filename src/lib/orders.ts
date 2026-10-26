import type { Dish } from './types';
import { distractors, isPortion, norm } from './questions';
import { shuffle } from './mastery';
import { isPizza } from './data';

/**
 * Ordini "da lavoro vero" che si sbloccano coi livelli e con le fasi dei piatti:
 * varianti chieste dal cliente, il piatto di Giuseppe da controllare, la domanda "cosa manca?".
 */

const BASE = new Set(['pomodoro', 'fior di latte']);
const ADD_ONS = ['burrata', 'bacon', 'cheddar', 'stracciatella', 'rucola', 'salamino piccante', 'funghi', 'olive', 'cipolla', 'patatine', 'würstel', 'mozzarella'];

export interface Variant { type: 'senza' | 'con'; ing: string }

/** «Diavola senza olive», «Margherita con burrata»: per farla giusta devi sapere cosa c'è dentro */
export function variantFor(dish: Dish, universe: string[]): Variant | null {
  if (isPortion(dish) || dish.ingredients.length < 3 || dish.ingredients.some((i) => /a scelta/.test(i))) return null;
  const own = new Set(dish.ingredients.map(norm));
  if (Math.random() < 0.55) {
    const pick = shuffle(dish.ingredients.filter((i) => !BASE.has(norm(i))))[0];
    if (pick) return { type: 'senza', ing: pick };
  }
  const uni = new Set(universe.map(norm));
  const add = shuffle(ADD_ONS.filter((a) => !own.has(a) && uni.has(a)))[0];
  return add ? { type: 'con', ing: add } : null;
}

export const applyVariant = (dish: Dish, v: Variant | null) =>
  !v ? dish.ingredients : v.type === 'senza' ? dish.ingredients.filter((i) => norm(i) !== norm(v.ing)) : [...dish.ingredients, v.ing];

export const variantText = (v: Variant) => `${v.type} ${v.ing}`;

/**
 * Il piatto preparato da Giuseppe: a volte ha un ingrediente scambiato, a volte (sulle pizze) un ingrediente
 * messo in forno invece che all'uscita, a volte è giusto. Cercare l'errore obbliga a ricordare la ricetta intera.
 */
export interface Check {
  kind: 'swap' | 'oven' | 'ok';
  /** cosa c'è sul piatto, nell'ordine di montaggio */
  shown: string[];
  /** pizze: cosa è andato in forno */
  oven: string[] | null;
  /** l'ingrediente sbagliato (swap) o messo nel tempo sbagliato (oven) */
  wrong: string | null;
  /** cosa ci voleva al posto dell'ingrediente sbagliato */
  right: string | null;
  options: string[];
}

export function checkFor(dish: Dish, all: Dish[]): Check {
  const after = dish.after ?? [];
  const ovenOf = (list: string[]) => (isPizza(dish.category) ? list.filter((i) => !after.some((a) => norm(a) === norm(i))) : null);
  const r = Math.random();
  if (r < 0.2) return { kind: 'ok', shown: [...dish.ingredients], oven: ovenOf(dish.ingredients), wrong: null, right: null, options: [] };
  if (r < 0.45 && isPizza(dish.category) && after.length) {
    const wrong = shuffle(after)[0];
    return { kind: 'oven', shown: [...dish.ingredients], oven: [...ovenOf(dish.ingredients)!, wrong], wrong, right: null, options: [] };
  }
  const right = shuffle(dish.ingredients.filter((i) => !BASE.has(norm(i))))[0] ?? dish.ingredients[0];
  const fake = distractors(dish, all, 4);
  const wrong = fake[0] ?? 'cipolla';
  const shown = dish.ingredients.map((i) => (i === right ? wrong : i));
  const isAfter = after.some((a) => norm(a) === norm(right));
  const oven = isPizza(dish.category) ? shown.filter((i) => (i === wrong ? !isAfter : !after.some((a) => norm(a) === norm(i)))) : null;
  return { kind: 'swap', shown, oven, wrong, right, options: shuffle([right, ...fake.slice(1, 4)]) };
}

/** "Cosa manca?" — nei panini con l'ordine fisso diventa "cosa c'è tra X e Y?" */
export interface Gap { idx: number; options: string[] }
export function gapFor(dish: Dish, all: Dish[]): Gap | null {
  if (dish.ingredients.length < 3 || isPortion(dish)) return null;
  const idx = dish.ordered ? 1 + Math.floor(Math.random() * (dish.ingredients.length - 2)) : Math.floor(Math.random() * dish.ingredients.length);
  const hidden = dish.ingredients[idx];
  return { idx, options: shuffle([hidden, ...distractors(dish, all, 3)]) };
}

export const gapQuestion = (dish: Dish, g: Gap) =>
  dish.ordered ? `Cosa c'è tra ${dish.ingredients[g.idx - 1]} e ${dish.ingredients[g.idx + 1]}?` : 'Cosa manca?';

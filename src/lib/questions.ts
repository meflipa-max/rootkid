import type { Dish } from './types';
import { shuffle } from './mastery';
import { pieceOf } from './plate';

export type Kind = 'build' | 'which' | 'missing';

export type Q =
  | { kind: 'build'; dish: Dish; options: string[] }
  | { kind: 'which'; dish: Dish; options: Dish[] }
  | { kind: 'missing'; dish: Dish; hidden: string; shown: string[]; options: string[] };

export const norm = (s: string) => s.trim().toLowerCase();
const setKey = (d: Dish) => d.ingredients.map(norm).sort().join('|');
export const isPortion = (d: Dish) => d.category === 'fritti';

export function availableKinds(dish: Dish, all: Dish[]): Kind[] {
  const kinds: Kind[] = ['build'];
  if (dish.ingredients.length >= 2) kinds.push('missing');
  const key = setKey(dish);
  const others = all.filter((x) => x.id !== dish.id && setKey(x) !== key);
  if (others.length >= 2 && !all.some((x) => x.id !== dish.id && setKey(x) === key)) kinds.push('which');
  return kinds;
}

/** varianti numeriche plausibili: "2 crocchette" -> "3 crocchette", "3/4 pittule" -> "4/5 pittule" */
function numericVariants(ing: string): string[] {
  const m = ing.match(/^(\d+)(?:\/(\d+))?\s+(.+)$/);
  if (!m) return [];
  const a = +m[1];
  const b = m[2] ? +m[2] : null;
  const rest = m[3];
  const out: string[] = [];
  for (const dlt of [-2, -1, 1, 2]) {
    if (a + dlt < 1) continue;
    out.push(b === null ? `${a + dlt} ${rest}` : `${a + dlt}/${b + dlt} ${rest}`);
  }
  return out;
}

export function distractors(dish: Dish, all: Dish[], count: number): string[] {
  const own = new Set(dish.ingredients.map(norm));
  const seen = new Set(own);
  const out: string[] = [];
  const ownList = dish.ingredients.map(norm);
  const similar = (a: string) => ownList.some((o) => o.includes(a) || a.includes(o) || (o.length > 5 && a.length > 5 && o.slice(0, 6) === a.slice(0, 6)));
  const add = (list: string[]) => {
    for (const s of shuffle(list)) {
      if (out.length >= count) return;
      if (!seen.has(norm(s)) && (isPortion(dish) || !similar(norm(s)))) {
        seen.add(norm(s));
        out.push(s);
      }
    }
  };
  if (isPortion(dish)) {
    add(dish.ingredients.flatMap(numericVariants));
    add(all.filter((x) => x.id !== dish.id && isPortion(x)).flatMap((x) => x.ingredients));
  } else {
    const rest = all.filter((x) => x.id !== dish.id && !isPortion(x));
    add(rest.filter((x) => x.category === dish.category).flatMap((x) => x.ingredients));
    add(rest.flatMap((x) => x.ingredients));
  }
  return out;
}

export function makeQuestion(dish: Dish, all: Dish[], kind: Kind): Q {
  if (kind === 'which') {
    const key = setKey(dish);
    const cands = all.filter((x) => x.id !== dish.id && setKey(x) !== key);
    const same = shuffle(cands.filter((x) => x.category === dish.category));
    const rest = shuffle(cands.filter((x) => x.category !== dish.category));
    const picks = [...same, ...rest].slice(0, 3);
    return { kind, dish, options: shuffle([dish, ...picks]) };
  }
  if (kind === 'missing') {
    const hidden = dish.ingredients[Math.floor(Math.random() * dish.ingredients.length)];
    const shown = dish.ingredients.filter((i) => i !== hidden);
    return { kind, dish, hidden, shown, options: shuffle([hidden, ...distractors(dish, all, 3)]) };
  }
  const n = dish.ingredients.length;
  const extra = Math.max(3, 6 - n);
  return { kind: 'build', dish, options: shuffle([...dish.ingredients, ...distractors(dish, all, Math.min(extra, 6))]) };
}

/**
 * Quanto è grande il bancone, in base alla fase del piatto:
 * base = gli ingredienti giusti + pochi sbagliati (si va anche per esclusione),
 * wide = il doppio dei distrattori, presi dai piatti più simili,
 * pantry = la dispensa intera della categoria: per escludere non basta, bisogna ricordare.
 * La friggitoria (pezzi contati) non arriva mai alla dispensa.
 */
export type TrayLevel = 'base' | 'wide' | 'pantry';
export const trayLevelFor = (dish: Dish, phase: number): TrayLevel =>
  phase >= 3 && !isPortion(dish) ? 'pantry' : phase >= 2 ? 'wide' : 'base';

/** classiche e speciali usano la stessa dispensa: sono tutte pizze */
const shelfGroup = (d: Dish) => (d.category === 'speciali' ? 'classiche' : d.category);
const PANTRY_MIN = 14;
const PANTRY_MAX = 36;
const PIZZA_BASE = ['pomodoro', 'fior di latte'];

/** friggitoria: sul bancone ci sono i tipi di pezzo; nei piatti "N pezzi" solo il pezzo da contare */
function fryTray(dish: Dish, all: Dish[]): string[] {
  const own = dish.ingredients.map((i) => pieceOf(i).type);
  if (own.every((t) => t === 'pezzi')) return ['pezzi'];
  const others = all.filter((x) => isPortion(x)).flatMap((x) => x.ingredients.map((i) => pieceOf(i).type)).filter((t) => t !== 'pezzi');
  return [...new Set([...own, ...others])];
}

/**
 * Ingredienti sul bancone per un ordine: quelli giusti + distrattori (l'ordine sul bancone lo decide la postazione).
 * Gli ingredienti che il giocatore ha già confuso con questo piatto tornano apposta come distrattori,
 * così la differenza viene allenata finché non è chiara.
 */
export function trayFor(dish: Dish, all: Dish[], confused: Record<string, number> | undefined, level: TrayLevel = 'base', target = dish.ingredients): string[] {
  if (isPortion(dish)) return fryTray(dish, all);
  const own = new Set(target.map(norm));
  const seen = new Set(own);
  const uniq = (list: string[]) => list.filter((x) => !seen.has(norm(x)) && (seen.add(norm(x)), true));
  let wrong: string[];
  if (level === 'pantry') {
    const group = all.filter((x) => x.id !== dish.id && shelfGroup(x) === shelfGroup(dish)).flatMap((x) => x.ingredients);
    wrong = uniq(shuffle(group));
    if (wrong.length + own.size < PANTRY_MIN) wrong = [...wrong, ...uniq(distractors(dish, all, PANTRY_MIN))].slice(0, PANTRY_MIN - own.size);
  } else {
    const n = target.length;
    wrong = uniq(distractors(dish, all, level === 'wide' ? 7 : Math.min(Math.max(3, 6 - n), 6)));
  }
  const traps = Object.entries(confused ?? {})
    .sort((a, b) => b[1] - a[1])
    .map(([k]) => k)
    .filter((k) => !own.has(norm(k)))
    .slice(0, 2);
  if (traps.length) {
    const t = new Set(traps.map(norm));
    const rest = wrong.filter((w) => !t.has(norm(w)));
    wrong = [...traps, ...rest.slice(0, Math.max(0, (level === 'pantry' ? rest.length : wrong.length) - traps.length))];
  }
  if (level === 'pantry') wrong = wrong.slice(0, PANTRY_MAX - own.size);
  // sulle pizze pomodoro e fior di latte ci sono sempre: la base si sceglie, non si indovina dal bancone
  if (dish.category === 'classiche' || dish.category === 'speciali') for (const b of PIZZA_BASE) if (!own.has(b) && !wrong.some((w) => norm(w) === b)) wrong.push(b);
  return [...target, ...wrong];
}

const jaccard = (a: Dish, b: Dish) => {
  const A = new Set(a.ingredients.map(norm));
  const B = new Set(b.ingredients.map(norm));
  const inter = [...A].filter((x) => B.has(x)).length;
  return inter / (A.size + B.size - inter || 1);
};

/** il piatto più facile da confondere con questo, con le differenze */
export function similarDish(dish: Dish, all: Dish[]): { other: Dish; onlyHere: string[]; onlyThere: string[] } | null {
  let best: Dish | null = null;
  let score = 0.3;
  for (const o of all) {
    if (o.id === dish.id || o.category === 'fritti') continue;
    const s = jaccard(dish, o) + (o.category === dish.category ? 0.05 : 0);
    if (s > score) [best, score] = [o, s];
  }
  if (!best) return null;
  const A = new Set(dish.ingredients.map(norm));
  const B = new Set(best.ingredients.map(norm));
  const onlyHere = dish.ingredients.filter((i) => !B.has(norm(i)));
  const onlyThere = best.ingredients.filter((i) => !A.has(norm(i)));
  if (!onlyHere.length && !onlyThere.length) return null;
  return { other: best, onlyHere, onlyThere };
}

/** in quale altro piatto si trova un ingrediente (stessa categoria per prima) */
export function whereIs(ing: string, dish: Dish, all: Dish[]): Dish | null {
  const n = norm(ing);
  const has = all.filter((d) => d.id !== dish.id && d.ingredients.some((i) => norm(i) === n));
  return has.find((d) => d.category === dish.category) ?? has[0] ?? null;
}

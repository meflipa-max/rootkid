import type { Dish } from './types';
import { shuffle } from './mastery';

export type Kind = 'build' | 'which' | 'missing';

export type Q =
  | { kind: 'build'; dish: Dish; options: string[] }
  | { kind: 'which'; dish: Dish; options: Dish[] }
  | { kind: 'missing'; dish: Dish; hidden: string; shown: string[]; options: string[] };

export const norm = (s: string) => s.trim().toLowerCase();
const setKey = (d: Dish) => d.ingredients.map(norm).sort().join('|');
const isPortion = (d: Dish) => d.category === 'fritti';

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

function distractors(dish: Dish, all: Dish[], count: number): string[] {
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

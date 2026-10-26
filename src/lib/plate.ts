import { norm } from './questions';

/**
 * Come si giudica un piatto preparato: cosa manca, cosa è di troppo, e le cose "da lavoro vero":
 * l'ordine di montaggio dei panini, cosa va in forno e cosa all'uscita, i pezzi contati in friggitoria.
 */

/** friggitoria: "3/4 pittule" = tipo pittule, da 3 a 4 pezzi; "patatine" = una porzione */
export interface Piece { type: string; min: number; max: number; portion: boolean; label: string }
export function pieceOf(ing: string): Piece {
  const m = ing.trim().match(/^(\d+)(?:\/(\d+))?\s+(.+)$/);
  if (!m) return { type: ing, min: 1, max: 1, portion: true, label: ing };
  const a = +m[1];
  const b = m[2] ? +m[2] : a;
  return { type: /^pezz/i.test(m[3]) ? 'pezzi' : m[3], min: Math.min(a, b), max: Math.max(a, b), portion: false, label: ing };
}

/** pezzi che si servono a porzione, non contati */
const PORTIONS = new Set(['patatine']);
/** i pezzi messi nel cestino, raggruppati: ["crocchette","crocchette"] -> ["2 crocchette"] */
export function piecesLabel(plate: string[]): string[] {
  const counts = new Map<string, number>();
  for (const p of plate) counts.set(p, (counts.get(p) ?? 0) + 1);
  return [...counts.entries()].map(([t, n]) => (PORTIONS.has(norm(t)) ? t : `${n} ${t}`));
}
/** da "3 crocchette" (etichetta nel cestino) al tipo di pezzo */
export const typeOfLabel = (label: string) => label.replace(/^\d+\s+/, '');

export interface Verdict {
  ok: boolean;
  missing: string[];
  extra: string[];
  /** ingredienti giusti, su quanti ne servivano: per il "Quasi! 4 su 5" */
  right: number;
  total: number;
  /** panini: montato nell'ordine del banco (null = l'ordine non conta qui) */
  orderOk: boolean | null;
  /** pizze: ingredienti messi nel tempo sbagliato (in forno invece che all'uscita, o il contrario) */
  ovenWrong: { ing: string; after: boolean }[];
}

export interface JudgeOpts {
  counted?: boolean;
  ordered?: boolean;
  /** pizze: cosa va all'uscita (undefined = la ricetta non lo dice) */
  after?: string[];
  /** pizze: cosa è andato in forno */
  oven?: string[] | null;
  /** ingredienti su cui non si controlla il tempo (es. l'aggiunta chiesta dal cliente) */
  free?: string[];
}

export function judge(target: string[], plate: string[], o: JudgeOpts = {}): Verdict {
  if (o.counted) {
    const counts = new Map<string, number>();
    for (const p of plate) counts.set(norm(p), (counts.get(norm(p)) ?? 0) + 1);
    const needs = target.map(pieceOf);
    const missing = needs.filter((n) => {
      const c = counts.get(norm(n.type)) ?? 0;
      return n.portion ? c < 1 : c < n.min || c > n.max;
    }).map((n) => n.label);
    const types = new Set(needs.map((n) => norm(n.type)));
    const extra = [...new Set(plate.filter((p) => !types.has(norm(p))))];
    const ok = !missing.length && !extra.length;
    return { ok, missing, extra, right: needs.length - missing.length, total: needs.length, orderOk: null, ovenWrong: [] };
  }
  const want = target.map(norm);
  const got = plate.map(norm);
  const missing = target.filter((i) => !got.includes(norm(i)));
  const extra = plate.filter((i) => !want.includes(norm(i)));
  const ok = !missing.length && !extra.length;
  const orderOk = o.ordered && ok ? got.join('|') === want.join('|') : null;
  const ovenWrong: Verdict['ovenWrong'] = [];
  if (ok && o.after && o.oven) {
    const aft = new Set(o.after.map(norm));
    const inOven = new Set(o.oven.map(norm));
    const free = new Set((o.free ?? []).map(norm));
    for (const i of target) {
      if (free.has(norm(i))) continue;
      const shouldAfter = aft.has(norm(i));
      if (shouldAfter === inOven.has(norm(i))) ovenWrong.push({ ing: i, after: shouldAfter });
    }
  }
  return { ok, missing, extra, right: target.length - missing.length, total: target.length, orderOk, ovenWrong };
}

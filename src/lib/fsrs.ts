import type { FsState } from './types';

/**
 * FSRS-4.5 (l'algoritmo di ripetizione dilazionata adottato da Anki), con i pesi di default.
 * Per ogni piatto tiene la stabilità S (in giorni: dopo S giorni la probabilità di ricordarlo è scesa al 90%)
 * e la difficoltà D (1..10). Le formule sono quelle pubblicate da open-spaced-repetition.
 */
const W = [0.4872, 1.4003, 3.7145, 13.8206, 5.1618, 1.2298, 0.8975, 0.031, 1.6474, 0.1367, 1.0461, 2.1072, 0.0793, 0.3246, 1.587, 0.2272, 2.8755];
const DECAY = -0.5;
const FACTOR = 19 / 81;
const DAY = 864e5;

/** 1 = non lo sapevi, 2 = difficile, 3 = bene, 4 = facile */
export type FsGrade = 1 | 2 | 3 | 4;

const clampD = (d: number) => Math.min(10, Math.max(1, d));
const d0 = (g: FsGrade) => clampD(W[4] - (g - 3) * W[5]);

/** probabilità (0..1) di ricordare adesso il piatto */
export function recall(fs: FsState | undefined, now = Date.now()) {
  if (!fs) return 0;
  const t = Math.max(0, now - fs.t) / DAY;
  return Math.pow(1 + (FACTOR * t) / fs.s, DECAY);
}

/** giorni dopo l'ultimo ripasso in cui la probabilità scende al 90%: il momento giusto per ripassare */
export const intervalDays = (fs: FsState) => fs.s;

export function review(fs: FsState | undefined, g: FsGrade, now = Date.now()): FsState {
  if (!fs) return { s: W[g - 1], d: d0(g), t: now };
  const r = recall(fs, now);
  const d = clampD(W[7] * d0(4) + (1 - W[7]) * (fs.d - W[6] * (g - 3)));
  let s: number;
  if (g === 1) {
    s = Math.min(fs.s, W[11] * Math.pow(fs.d, -W[12]) * (Math.pow(fs.s + 1, W[13]) - 1) * Math.exp(W[14] * (1 - r)));
  } else {
    const hard = g === 2 ? W[15] : 1;
    const easy = g === 4 ? W[16] : 1;
    s = fs.s * (Math.exp(W[8]) * (11 - fs.d) * Math.pow(fs.s, -W[9]) * (Math.exp(W[10] * (1 - r)) - 1) * hard * easy + 1);
  }
  return { s: Math.max(0.1, s), d, t: now };
}

/** stato di partenza per i salvataggi fatti con le sole scatole di Leitner */
export const fromBox = (box: number, last: number): FsState => ({ s: [0.4, 1, 2, 4, 8, 16][Math.max(0, Math.min(5, box))], d: 5, t: last || Date.now() });

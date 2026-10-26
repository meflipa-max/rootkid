import type { DishStat } from './types';

/**
 * Il titolo dice quanti piatti sai davvero (fase "A memoria" o oltre), non quanto hai giocato:
 * salire di titolo vuol dire sapere il menu.
 */
const TITLES: [number, string][] = [
  [0, 'Garzone'], [3, 'Apprendista'], [8, 'Pizzaiolo'], [15, 'Burgerista'], [25, 'Capo turno'], [35, 'Maestro'], [45, 'Chef'], [55, 'Leggenda'],
];
export const knownCount = (stats: Record<string, DishStat>, ids: string[]) => ids.filter((id) => (stats[id]?.box ?? 0) >= 3 && stats[id]?.seen).length;
export function titleFor(known: number) {
  let i = 0;
  while (i + 1 < TITLES.length && known >= TITLES[i + 1][0]) i++;
  const next = TITLES[i + 1];
  return { title: TITLES[i][1], next: next ? { title: next[1], need: next[0] } : null };
}

/** cosa sblocca ogni livello: tipi di ordine nuovi, che pagano di più e usano solo i piatti pronti */
export type Unlock = 'tavolo' | 'varianti' | 'asporto' | 'controllo' | 'sabato';
export const UNLOCKS: { lvl: number; id: Unlock; name: string; text: string }[] = [
  { lvl: 2, id: 'tavolo', name: 'Tavolo da due', text: 'Un cliente ordina due piatti: preparali uno dopo l\'altro (monete ×1.3)' },
  { lvl: 3, id: 'varianti', name: 'Varianti', text: '«Diavola senza olive», «Margherita con burrata»: devi sapere cosa c\'è dentro (punti ×1.3)' },
  { lvl: 4, id: 'asporto', name: 'Asporto al telefono', text: 'La comanda si legge per pochi secondi e poi sparisce (punti ×1.5)' },
  { lvl: 5, id: 'controllo', name: 'Controllo qualità', text: 'Giuseppe ha preparato un piatto: trova l\'errore prima che esca' },
  { lvl: 6, id: 'sabato', name: 'Sabato sera', text: 'Turno lungo da 12 clienti con tutto il menu mischiato (monete ×1.5)' },
];
export const unlocked = (lvl: number, id: Unlock) => lvl >= (UNLOCKS.find((u) => u.id === id)?.lvl ?? 99);
export const unlocksAt = (lvl: number) => UNLOCKS.filter((u) => u.lvl === lvl);

/** forziere di ogni livello: a volte piccolo, a volte un jackpot */
export const levelChest = (lvl: number) => {
  const r = Math.random();
  return Math.round((r > 0.9 ? 300 : r > 0.6 ? 150 : 70 + Math.random() * 50) * (1 + lvl * 0.1));
};

/**
 * Sorprese del locale: pezzi rari che porta il fornitore a fine turno (ricompensa variabile, mai a pagamento),
 * il set "Angolo trattoria" e gli addobbi di stagione. Il disegno è in three/Rare.tsx.
 */
export interface Rare {
  id: string;
  name: string;
  text: string;
  from: 'fornitore' | 'set';
}

export const RARE: Rare[] = [
  { id: 'gatto', name: 'Il gatto del locale', text: 'Dorme in sala, vicino alla porta', from: 'fornitore' },
  { id: 'jukebox', name: 'Jukebox', text: 'Musica anni \'60 per la sala', from: 'fornitore' },
  { id: 'vespa', name: 'Vespa', text: 'Parcheggiata davanti al locale', from: 'fornitore' },
  { id: 'acquario', name: 'Acquario', text: 'Pesci rossi in sala', from: 'fornitore' },
  { id: 'lampadario', name: 'Lampadario', text: 'Luce calda sopra la sala', from: 'fornitore' },
  { id: 'mandolino', name: 'Mandolino', text: 'Premio del set Angolo trattoria', from: 'set' },
];

export const rareById = (id: string) => RARE.find((r) => r.id === id);

/** il set "Angolo trattoria": tutte e quattro al massimo regalano il mandolino e delle monete */
export const TRATTORIA = ['piante', 'quadri', 'luci', 'tavolini'];
export const SET_COINS = 300;

/**
 * Passa il fornitore? Più turni senza regali, più è probabile (così prima o poi arriva sempre).
 * Torna il pezzo regalato, o delle monete se li hai già tutti.
 */
export function supplierRoll(owned: string[], sinceLast: number, r = Math.random()): { id: string } | { coins: number } | null {
  const chance = Math.min(0.6, 0.12 + 0.04 * sinceLast);
  if (r >= chance) return null;
  const left = RARE.filter((x) => x.from === 'fornitore' && !owned.includes(x.id));
  if (!left.length) return { coins: 120 };
  return { id: left[Math.floor((r / chance) * left.length) % left.length].id };
}

/** addobbi di stagione: Halloween dal 20 ottobre al 3 novembre, Natale dal 1° dicembre all'Epifania */
export type Season = 'halloween' | 'natale' | null;
export function seasonOf(d = new Date()): Season {
  const m = d.getMonth() + 1;
  const day = d.getDate();
  if ((m === 10 && day >= 20) || (m === 11 && day <= 3)) return 'halloween';
  if (m === 12 || (m === 1 && day <= 6)) return 'natale';
  return null;
}

/** rinnovare il locale: ogni rinnovo dà monete in più per sempre */
export const RENEW_BONUS = 0.1;

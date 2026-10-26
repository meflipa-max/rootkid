import type { Daily, MKind, Save } from './types';

export interface Mission {
  id: string;
  kind: MKind;
  goal: number;
  reward: number;
  emoji: string;
  text: string;
  /** serve conoscere già un po' il menu */
  adv?: boolean;
  /** missione sulla memoria: ogni giorno ce n'è almeno una */
  mem?: boolean;
}

export const MISSIONS: Mission[] = [
  { id: 'serve10', kind: 'serve', goal: 10, reward: 40, emoji: '🍽️', text: 'Servi 10 clienti' },
  { id: 'serve20', kind: 'serve', goal: 20, reward: 70, emoji: '🍽️', text: 'Servi 20 clienti' },
  { id: 'mem3', kind: 'memory', goal: 3, reward: 50, emoji: '🧠', text: 'Servi 3 piatti senza vedere la ricetta' },
  { id: 'mem8', kind: 'memory', goal: 8, reward: 90, emoji: '🧠', text: 'Servi 8 piatti senza vedere la ricetta', adv: true },
  { id: 'combo5', kind: 'combo', goal: 5, reward: 60, emoji: '🔥', text: 'Entra in FEVER (combo ×5)' },
  { id: 'shifts2', kind: 'shifts', goal: 2, reward: 40, emoji: '⏱️', text: 'Gioca 2 turni' },
  { id: 'stars3', kind: 'stars3', goal: 1, reward: 80, emoji: '⭐', text: 'Chiudi un turno con 3 stelle', adv: true },
  { id: 'rev2', kind: 'revenge', goal: 2, reward: 60, emoji: '🔁', text: 'Vinci 2 rivincite' },
  { id: 'guess2', kind: 'guess', goal: 2, reward: 50, emoji: '🤔', text: 'Indovina 2 clienti indecisi', adv: true },
  { id: 'cards6', kind: 'cards', goal: 6, reward: 40, emoji: '📖', text: 'Ripassa 6 schede nel Ricettario' },
  { id: 'vip1', kind: 'vip', goal: 1, reward: 50, emoji: '👑', text: 'Servi un cliente VIP' },
  // missioni sulla memoria: premiano l'imparare, non solo il servire
  { id: 'phase2', kind: 'phaseup', goal: 2, reward: 70, emoji: '⬆️', text: 'Porta 2 piatti alla fase dopo', mem: true },
  { id: 'fresh3', kind: 'fresh', goal: 3, reward: 80, emoji: '✨', text: 'Rinfresca 3 piatti da ripassare', adv: true, mem: true },
  { id: 'redeem1', kind: 'redeem', goal: 1, reward: 70, emoji: '🎯', text: 'Servi giusto un piatto che avevi sbagliato un altro giorno', adv: true, mem: true },
  { id: 'order3', kind: 'order', goal: 3, reward: 60, emoji: '🍔', text: 'Monta 3 panini come al banco', adv: true },
  { id: 'real1', kind: 'real', goal: 1, reward: 40, emoji: '🧑‍🍳', text: 'Segna i piatti che hai fatto al lavoro' },
];

export const missionById = (id: string) => MISSIONS.find((m) => m.id === id);

/** 3 missioni al giorno, sempre le stesse per tutta la giornata, di tipo diverso */
function pickFor(date: string, adv: boolean): string[] {
  let h = 2166136261;
  for (const ch of date) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  const rnd = () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909)) >>> 0) / 4294967296;
  const pool = MISSIONS.filter((m) => adv || !m.adv);
  const out: Mission[] = [];
  const mem = pool.filter((m) => m.mem);
  if (mem.length) {
    const m = mem[Math.floor(rnd() * mem.length)];
    out.push(m);
    pool.splice(pool.indexOf(m), 1);
  }
  while (out.length < 3 && pool.length) {
    const m = pool.splice(Math.floor(rnd() * pool.length), 1)[0];
    if (!out.some((o) => o.kind === m.kind)) out.push(m);
  }
  return out.map((m) => m.id);
}

export const today = () => new Date().toLocaleDateString('sv');

/** missioni di oggi: se il salvataggio è di un altro giorno ne genera di nuove */
export function currentDaily(s: Save): Daily {
  const t = today();
  if (s.daily && s.daily.date === t && s.daily.ids.every(missionById)) return s.daily;
  const adv = Object.values(s.stats).some((x) => x.box >= 2);
  return { date: t, ids: pickFor(t, adv), prog: {}, claimed: [], chest: false };
}

export const progressOf = (d: Daily, m: Mission) => Math.min(m.goal, d.prog[m.kind] ?? 0);

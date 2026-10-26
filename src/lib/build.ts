export interface Upgrade {
  id: string;
  name: string;
  emoji: string;
  max: number;
  base: number;
  desc: (lvl: number) => string;
}

export const UPGRADES: Upgrade[] = [
  { id: 'forno', name: 'Forno a legna', emoji: '🔥', max: 5, base: 120, desc: (l) => `Clienti più pazienti: +${l * 10}% di tempo · pizza cotta giusta: +${l} ${l === 1 ? 'moneta' : 'monete'}` },
  { id: 'cassa', name: 'Cassa nuova', emoji: '💰', max: 5, base: 150, desc: (l) => `Incassi più ricchi: +${l * 15}% monete` },
  { id: 'insegna', name: 'Insegna luminosa', emoji: '🪧', max: 5, base: 180, desc: (l) => `Più clienti attirati: +${l * 5}% punti e più VIP (+${l * 3}%)` },
  { id: 'frigo', name: 'Frigo grande', emoji: '🧊', max: 2, base: 400, desc: (l) => `Più scorte: +${l} ${l === 1 ? 'vita' : 'vite'} per turno` },
  // le migliorie comprano comodità, mai risposte: il campanello suona anche se il piatto è sbagliato
  { id: 'campanello', name: 'Campanello', emoji: '🛎️', max: 1, base: 500, desc: () => 'Quando sul piatto c\'è il numero giusto di ingredienti lo serve da solo, giusto o sbagliato che sia (hai un attimo per ripensarci). Solo quando il numero si vede' },
  { id: 'mise', name: 'Mise en place', emoji: '🥫', max: 2, base: 220, desc: (l) => (l <= 1 ? 'Banco in ordine: cerchi gli ingredienti scrivendo su ogni bancone, non solo in dispensa' : 'Banco in ordine: ricerca su ogni bancone ed etichette dei ripiani sempre in vista') },
  { id: 'garzone', name: 'Garzone', emoji: '🧑‍🍳', max: 3, base: 260, desc: (l) => `Distrae i clienti in coda: pazienza -${l * 15}% più lenta a scendere` },
  { id: 'cronometro', name: 'Cronometro', emoji: '⏱️', max: 3, base: 240, desc: (l) => `Ogni servizio perfetto regala +${(l * 1.5).toFixed(1)}s a tutti i clienti in attesa` },
  // l'atmosfera (piante, quadri, luci) fa lasciare la mancia più spesso; i tavolini la fanno più ricca
  { id: 'piante', name: 'Piante', emoji: '🪴', max: 3, base: 80, desc: (l) => `Locale accogliente: mance più frequenti (+${l * 5}%)` },
  { id: 'quadri', name: 'Quadri', emoji: '🖼️', max: 3, base: 100, desc: (l) => `Pareti da vera trattoria: mance più frequenti (+${l * 5}%)` },
  { id: 'luci', name: 'Luci a festone', emoji: '💡', max: 3, base: 130, desc: (l) => `Atmosfera serale: mance più frequenti (+${l * 5}%)` },
  { id: 'tavolini', name: 'Tavolini', emoji: '🪑', max: 3, base: 200, desc: (l) => `Clienti seduti: +${l} ${l === 1 ? 'moneta' : 'monete'} a ogni mancia` },
];

export const upgradeCost = (u: Upgrade, lvl: number) => Math.round(u.base * (1 + lvl * 0.9));

export const lvlOf = (b: Record<string, number> | undefined, id: string) => b?.[id] ?? 0;

export const totalBuilt = (b: Record<string, number>) => UPGRADES.reduce((a, u) => a + lvlOf(b, u.id), 0);
export const totalMax = UPGRADES.reduce((a, u) => a + u.max, 0);

/** sconto dell'offerta del giorno */
export const DEAL_OFF = 0.3;

/**
 * Offerta del giorno: una miglioria a -30%, la stessa per tutto il giorno (dipende solo dalla data).
 * Una sola volta al giorno e senza conto alla rovescia: domani ce n'è un'altra, nessuna fretta.
 */
export function dealOf(date: string, build: Record<string, number>, used?: string): string | null {
  if (used === date) return null;
  let h = 0;
  for (let i = 0; i < date.length; i++) h = (h * 31 + date.charCodeAt(i)) | 0;
  const start = Math.abs(h) % UPGRADES.length;
  for (let k = 0; k < UPGRADES.length; k++) {
    const u = UPGRADES[(start + k) % UPGRADES.length];
    if (lvlOf(build, u.id) < u.max) return u.id;
  }
  return null;
}

/** quanto costa davvero adesso, offerta compresa */
export const priceOf = (u: Upgrade, lvl: number, deal: string | null) => (deal === u.id ? Math.round(upgradeCost(u, lvl) * (1 - DEAL_OFF)) : upgradeCost(u, lvl));

/** il prossimo obiettivo: quello che hai scelto tu, se no la miglioria più vicina */
export function goalOf(build: Record<string, number>, pinned: string | undefined, deal: string | null): { u: Upgrade; cost: number; pinned: boolean } | null {
  const open = UPGRADES.filter((u) => lvlOf(build, u.id) < u.max);
  const p = open.find((u) => u.id === pinned);
  if (p) return { u: p, cost: priceOf(p, lvlOf(build, p.id), deal), pinned: true };
  let best: { u: Upgrade; cost: number; pinned: boolean } | null = null;
  for (const u of open) {
    const cost = priceOf(u, lvlOf(build, u.id), deal);
    if (!best || cost < best.cost) best = { u, cost, pinned: false };
  }
  return best;
}

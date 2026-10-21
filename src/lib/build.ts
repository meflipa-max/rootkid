export interface Upgrade {
  id: string;
  name: string;
  emoji: string;
  max: number;
  base: number;
  desc: (lvl: number) => string;
}

export const UPGRADES: Upgrade[] = [
  { id: 'forno', name: 'Forno a legna', emoji: '🔥', max: 5, base: 120, desc: (l) => `Clienti più pazienti: +${l * 10}% di tempo` },
  { id: 'cassa', name: 'Cassa nuova', emoji: '💰', max: 5, base: 150, desc: (l) => `Incassi più ricchi: +${l * 15}% monete` },
  { id: 'insegna', name: 'Insegna luminosa', emoji: '🪧', max: 5, base: 180, desc: (l) => `Più clienti attirati: +${l * 5}% punti` },
  { id: 'frigo', name: 'Frigo grande', emoji: '🧊', max: 2, base: 400, desc: (l) => `Più scorte: +${l} ${l === 1 ? 'vita' : 'vite'} per turno` },
  { id: 'campanello', name: 'Campanello smart', emoji: '🛎️', max: 1, base: 500, desc: () => 'Serve da solo appena il piatto è giusto: niente più tocchi su SERVI (non con i piatti a memoria, per non suggerire)' },
  { id: 'mise', name: 'Mise en place', emoji: '🥫', max: 3, base: 220, desc: (l) => `Meno confusione: ${l * 2} ingredienti sbagliati in meno sul bancone e in dispensa` },
  { id: 'garzone', name: 'Garzone', emoji: '🧑‍🍳', max: 3, base: 260, desc: (l) => `Distrae i clienti in coda: pazienza -${l * 15}% più lenta a scendere` },
  { id: 'cronometro', name: 'Cronometro', emoji: '⏱️', max: 3, base: 240, desc: (l) => `Ogni servizio perfetto regala +${(l * 1.5).toFixed(1)}s a tutti i clienti in attesa` },
  { id: 'piante', name: 'Piante', emoji: '🪴', max: 3, base: 80, desc: () => 'Decorazione: il locale diventa accogliente' },
  { id: 'quadri', name: 'Quadri', emoji: '🖼️', max: 3, base: 100, desc: () => 'Decorazione: pareti da vera trattoria' },
  { id: 'luci', name: 'Luci a festone', emoji: '💡', max: 3, base: 130, desc: () => 'Decorazione: atmosfera serale' },
  { id: 'tavolini', name: 'Tavolini', emoji: '🪑', max: 3, base: 200, desc: () => 'Decorazione: sala per i clienti' },
];

export const upgradeCost = (u: Upgrade, lvl: number) => Math.round(u.base * (1 + lvl * 0.9));

export const lvlOf = (b: Record<string, number> | undefined, id: string) => b?.[id] ?? 0;

export const totalBuilt = (b: Record<string, number>) => UPGRADES.reduce((a, u) => a + lvlOf(b, u.id), 0);
export const totalMax = UPGRADES.reduce((a, u) => a + u.max, 0);

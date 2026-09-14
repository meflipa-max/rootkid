import type { SaveState, Item, ItemDef, Rarity, Stats, Slot } from '../types';
import { RNG } from '../rng';

export const SLOTS: { id: Slot; name: string; icon: string }[] = [
  { id: 'testa', name: 'Testa', icon: '🎧' },
  { id: 'mano', name: 'Strumento', icon: '🖱️' },
  { id: 'impianto', name: 'Impianto', icon: '🔌' },
];

export const RARITY: Record<Rarity, { name: string; color: string; mult: number; weight: number }> = {
  comune: { name: 'Comune', color: '#8b95a5', mult: 1, weight: 58 },
  raro: { name: 'Raro', color: '#5ea8ff', mult: 1.7, weight: 28 },
  epico: { name: 'Epico', color: '#b58cff', mult: 2.6, weight: 11 },
  leggendario: { name: 'Leggendario', color: '#ffd166', mult: 4, weight: 3 },
};

// base = valori della versione "comune"; la rarità li moltiplica
export const ITEM_DEFS: ItemDef[] = [
  // --- TESTA ---
  { id: 'cuffie', name: 'Cuffie Anti-Rumore', icon: '🎧', slot: 'testa', flavor: 'Il mondo sparisce. Restano tu e il terminale.', base: { dannoPct: 4, xpPct: 3 } },
  { id: 'visore', name: 'Visore a Raggi Blu', icon: '🥽', slot: 'testa', flavor: 'Occhi rossi alle 3 di notte, ma vedi ogni riga.', base: { critPct: 6 } },
  { id: 'cappuccio', name: 'Felpa col Cappuccio', icon: '🧥', slot: 'testa', flavor: "L'uniforme. Non rende invisibili, ma aiuta a concentrarsi.", base: { pvMax: 12 } },
  { id: 'corona', name: 'Corona del Root', icon: '👑', slot: 'testa', flavor: 'Chi la porta ha avuto i permessi. Tutti.', base: { dannoPct: 7, critPct: 5, xpPct: 5 } },

  // --- STRUMENTO ---
  { id: 'tastiera', name: 'Tastiera Meccanica', icon: '⌨️', slot: 'mano', flavor: 'Clack. Clack. I colleghi la odiano. Tu no.', base: { dannoPct: 6 } },
  { id: 'rubber', name: 'Chiavetta Rubber', icon: '🔌', slot: 'mano', flavor: 'Sembra una USB. Il computer la scambia per una tastiera.', base: { dannoPct: 5, critPct: 4 } },
  { id: 'multimetro', name: 'Multimetro Tascabile', icon: '🔧', slot: 'mano', flavor: 'Per quando il problema è fisico, non logico.', base: { pvMax: 8, energia: 1 } },
  { id: 'laptop', name: 'Laptop Corazzato', icon: '💻', slot: 'mano', flavor: 'Ammaccato in tre conferenze. Non si è mai spento.', base: { pvMax: 15, dannoPct: 3 } },
  { id: 'zeroday', name: 'Archivio Zero-Day', icon: '🗝️', slot: 'mano', flavor: 'Sigillato. Da usare solo con autorizzazione scritta.', base: { dannoPct: 10, critPct: 6 } },

  // --- IMPIANTO ---
  { id: 'chip', name: 'Chip di Overclock', icon: '⚡', slot: 'impianto', flavor: 'Più energia, più calore. Vale la pena.', base: { energia: 2 } },
  { id: 'yubi', name: 'Chiave Hardware', icon: '🔑', slot: 'impianto', flavor: 'Il secondo fattore che nessuno ti può rubare.', base: { pvMax: 10, energia: 1 } },
  { id: 'batteria', name: 'Batteria di Riserva', icon: '🔋', slot: 'impianto', flavor: 'Tre ore in più. A volte bastano.', base: { pvMax: 18 } },
  { id: 'caffe', name: 'Termos Infinito', icon: '☕', slot: 'impianto', flavor: 'Il vero carburante della sicurezza informatica.', base: { energia: 2, xpPct: 4 } },
  { id: 'neurale', name: 'Interfaccia Neurale', icon: '🧠', slot: 'impianto', flavor: 'Pensi il comando e lui è già eseguito.', base: { energia: 2, dannoPct: 5, xpPct: 6 } },
];

export function itemDef(defId: string): ItemDef | undefined {
  return ITEM_DEFS.find((d) => d.id === defId);
}

export function emptyStats(): Stats {
  return { dannoPct: 0, pvMax: 0, energia: 0, xpPct: 0, critPct: 0 };
}

// statistiche effettive di un oggetto = base × moltiplicatore di rarità
export function itemStats(it: Item): Stats {
  const def = itemDef(it.defId);
  const s = emptyStats();
  if (!def) return s;
  const m = RARITY[it.rarity].mult;
  for (const k of Object.keys(s) as (keyof Stats)[]) {
    s[k] = Math.round((def.base[k] ?? 0) * m);
  }
  return s;
}

export function itemName(it: Item): string {
  const def = itemDef(it.defId);
  return def ? def.name : 'Oggetto sconosciuto';
}

// somma degli oggetti equipaggiati
export function computeStats(save: SaveState): Stats {
  const total = emptyStats();
  for (const slot of SLOTS) {
    const instId = save.equipped?.[slot.id];
    if (!instId) continue;
    const it = save.inventory?.find((x) => x.id === instId);
    if (!it) continue;
    const s = itemStats(it);
    for (const k of Object.keys(total) as (keyof Stats)[]) total[k] += s[k];
  }
  return total;
}

// ---- generazione del bottino ----
function rollRarity(r: RNG, luckBonus: number): Rarity {
  // luckBonus (0..1) sposta i pesi verso le rarità alte
  const entries = (Object.keys(RARITY) as Rarity[]).map((k, i) => ({
    k,
    w: RARITY[k].weight * (1 + luckBonus * i * 0.9),
  }));
  const tot = entries.reduce((a, e) => a + e.w, 0);
  let x = r.next() * tot;
  for (const e of entries) {
    x -= e.w;
    if (x <= 0) return e.k;
  }
  return 'comune';
}

let lootSeq = 0;
/** Genera un oggetto come ricompensa. `difficulty` 1-5 aumenta la fortuna. */
export function rollLoot(seed: number, difficulty: number): Item {
  const r = new RNG(seed);
  const def = r.pick(ITEM_DEFS);
  const rarity = rollRarity(r, Math.max(0, Math.min(1, (difficulty - 1) / 4)));
  return { id: `it_${Date.now().toString(36)}_${(lootSeq++).toString(36)}`, defId: def.id, rarity };
}

/** Confronta due oggetti dello stesso slot per capire se il nuovo è migliore (somma grezza). */
export function itemPower(it: Item): number {
  const s = itemStats(it);
  return s.dannoPct * 2 + s.pvMax + s.energia * 6 + s.xpPct * 1.5 + s.critPct * 2;
}

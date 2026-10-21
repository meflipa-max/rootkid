import { ING_ALIASES } from './data';

/** Ripiani della dispensa: con 20–40 ingredienti sul bancone servono dei gruppi per orientarsi. */
export const SHELVES = ['Pane e basi', 'Carni e pesce', 'Formaggi', 'Verdure', 'Salse e creme', 'Dolci', 'Altro'] as const;
export type Shelf = (typeof SHELVES)[number];

const RULES: [Shelf, RegExp][] = [
  ['Salse e creme', /salsa|crema|maionese|ketchup|senape|pesto|glassa|olio|condiment|guacamole/],
  ['Dolci', /nutella|pistacchio|nocciol|cioccolat|bueno|tronky|kinder|mandorl|noci\b/],
  ['Formaggi', /mozzarella|cheddar|provola|scamorza|burrata|stracciatella|fior di latte|gorgonzola|grana|parmigiano|pecorino|ricotta|emment|cacioricotta|bufala|formagg/],
  ['Carni e pesce', /hamburger di|burger|pollo|bacon|speck|crudo|cotto|salsiccia|salam|mortadella|tonno|salmone|porchetta|bresaola|capocollo|pancetta|guanciale|würstel|wurstel|kebab|pulled|polpette|acciughe|alici|gamber|spianata|cotoletta|hamburger$/],
  ['Pane e basi', /pane|bun|focaccia|patatine|patate|crocchett|panzerott|chips|anelli|arancin|pittul|calzon/],
  ['Verdure', /insalata|valeriana|rucola|pomodor|cipolla|zucchin|melanzan|peperon|funghi|olive|mais|carot|radicchio|cicoria|friariell|spinaci|carciof|capperi|basilico|frigitell|peperoncin|pelato|san marzano/],
];

export const shelfOf = (ing: string): Shelf => {
  const s = ing.toLowerCase();
  return RULES.find(([, re]) => re.test(s))?.[0] ?? 'Altro';
};

/** minuscolo, senza accenti, senza punteggiatura e senza parole vuote ("di", "e", "al"…) */
const STOP = new Set(['di', 'del', 'della', 'dei', 'delle', 'e', 'al', 'alla', 'allo', 'ai', 'alle', 'con', 'in', 'la', 'il', 'lo', 'le', 'i', 'gli']);
export const fold = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/[^a-z0-9/]+/).filter((w) => w && !STOP.has(w)).join(' ');

const numbers = (s: string) => (s.match(/\d+/g) ?? []).join('/');

function lev(a: string, b: string) {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return row[b.length];
}

/**
 * Riconosce un ingrediente scritto a mano fra i candidati, perdonando maiuscole, accenti,
 * "di"/"e" mancanti e piccoli errori di battitura. Le quantità ("3 crocchette") devono essere esatte.
 * Basta anche la parola che distingue ("fassona") se nessun altro ingrediente di `universe` la contiene.
 */
export function matchIngredient(typed: string, candidates: string[], universe: string[] = candidates): string | null {
  const raw = typed.trim().toLowerCase();
  const t = fold(ING_ALIASES[raw] ?? raw);
  if (!t) return null;
  let best: string | null = null;
  let bestD = Infinity;
  for (const c of candidates) {
    const f = fold(c);
    if (numbers(f) !== numbers(t)) continue;
    if (f === t) return c;
    const tol = f.length <= 4 ? 0 : f.length <= 9 ? 1 : 2;
    const d = lev(t, f);
    if (d <= tol && d < bestD) {
      best = c;
      bestD = d;
    }
  }
  if (best) return best;
  // una parola sola che basta a riconoscerlo
  if (t.length >= 5 && !t.includes(' ')) {
    const hit = (x: string) => fold(x).split(' ').some((w) => w === t || (w.length > 6 && lev(w, t) <= 1));
    const inUniverse = [...new Set(universe.map(fold))].filter((f) => hit(f));
    const inCands = candidates.filter(hit);
    if (inCands.length === 1 && inUniverse.length === 1) return inCands[0];
  }
  return null;
}

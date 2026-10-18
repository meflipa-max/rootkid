const MAP: [RegExp, string][] = [
  [/funghi/, '🍄'],
  [/pulled|porchetta/, '🐖'],
  [/bacon|crudo/, '🥓'],
  [/bresaola/, '🥩'],
  [/pollo|cotoletta|bocconcini/, '🍗'],
  [/veggie/, '🥦'],
  [/frigitelli/, '🫑'],
  [/guacamole/, '🥑'],
  [/hamburger/, '🍔'],
  [/stracciatella|mozz|scamorza|cheddar|grana/, '🧀'],
  [/valeriana|rucola|insalata/, '🥬'],
  [/pomodor/, '🍅'],
  [/peperoncino/, '🌶️'],
  [/maionese/, '🥚'],
  [/cipolla/, '🧅'],
  [/salsa/, '🥫'],
  [/tonno/, '🐟'],
  [/olive/, '🫒'],
  [/patatine|patate/, '🥔'],
  [/nutella|tronky/, '🍫'],
  [/nocciola/, '🌰'],
  [/pistacchio/, '🥜'],
  [/crocchett/, '🥔'],
  [/calzon/, '🥟'],
  [/pittul/, '🍩'],
  [/arancin/, '🍙'],
  [/pezzi/, '🔢'],
];

export function emojiFor(ing: string): string {
  const s = ing.toLowerCase();
  for (const [re, e] of MAP) if (re.test(s)) return e;
  return '🍽️';
}

export const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

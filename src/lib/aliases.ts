/**
 * Ingredienti uniti dall'utente ("mozzarella" e "fior di latte" sono la stessa cosa: tengo "fior di latte").
 * Le unioni restano salvate, così il nome tolto non torna con gli aggiornamenti del menu
 * né dalla lista fissa degli ingredienti delle pizze.
 */
let user: Record<string, string> = {};
export const setUserAliases = (a: Record<string, string> | undefined) => {
  user = a ?? {};
};

const low = (s: string) => s.trim().toLowerCase();

/** il nome da usare per un ingrediente (le quantità della friggitoria restano: "3 crocchette") */
export function aliasName(name: string, a: Record<string, string> = user): string {
  const m = name.trim().match(/^(\d+(?:\/\d+)?\s+)(.+)$/);
  const base = m ? m[2] : name;
  const to = a[low(base)];
  return to ? (m ? m[1] : '') + to : name;
}

/** sostituisce in una lista e toglie i doppioni (resta il primo, nel suo posto) */
export function aliasList(list: string[], a: Record<string, string> = user): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const x of list) {
    const y = aliasName(x, a);
    if (seen.has(low(y))) continue;
    seen.add(low(y));
    out.push(y);
  }
  return out;
}

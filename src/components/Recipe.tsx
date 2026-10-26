import type { Dish } from '../lib/types';
import { isPizza } from '../lib/data';
import { norm } from '../lib/questions';
import { cap } from '../lib/emoji';
import { usePhoto } from '../lib/photos';
import { Icon } from './Icon';
import { Ing } from './Ing';
import { Chip } from './ui';

/**
 * La ricetta come si fa al lavoro:
 * pizze = base rossa (pomodoro + fior di latte, un pezzo solo) + condimenti in forno + quello che va all'uscita;
 * panini con l'ordine fisso = strati numerati dal basso; il resto = ingredienti.
 */
export const BASE_ROSSA = ['pomodoro', 'fior di latte'];
export const hasBaseRossa = (d: Dish) => isPizza(d.category) && BASE_ROSSA.every((b) => d.ingredients.some((i) => norm(i) === b));

export interface Part {
  title: string | null;
  items: string[];
}

/** le parti in cui si divide la ricetta al lavoro */
export function partsOf(d: Dish): Part[] {
  if (isPizza(d.category) && d.after) {
    const aft = new Set(d.after.map(norm));
    const before = d.ingredients.filter((i) => !aft.has(norm(i)));
    const after = d.ingredients.filter((i) => aft.has(norm(i)));
    return [{ title: 'In forno', items: before }, ...(after.length ? [{ title: "All'uscita", items: after }] : [])];
  }
  if (d.ordered) return [{ title: 'Dal basso verso l\'alto', items: d.ingredients }];
  return [{ title: null, items: d.ingredients }];
}

/** ingredienti di una parte, con pomodoro + fior di latte raccolti in "Base rossa" */
function grouped(d: Dish, items: string[]): (string | { base: true })[] {
  if (!hasBaseRossa(d) || !BASE_ROSSA.every((b) => items.some((i) => norm(i) === b))) return items;
  const rest = items.filter((i) => !BASE_ROSSA.includes(norm(i)));
  return [{ base: true }, ...rest];
}

export function RecipeView({ dish, state, mini, numbered = true }: { dish: Dish; state?: (ing: string) => string; mini?: boolean; numbered?: boolean }) {
  const parts = partsOf(dish);
  let n = 0;
  return (
    <div className={`recipe-view ${mini ? 'mini-v' : ''}`}>
      {parts.map((p) => (
        <div key={p.title ?? 'all'} className="rv-part">
          {p.title && parts.length + (dish.ordered ? 1 : 0) > 1 && <div className="rv-h">{p.title === 'In forno' ? <Icon name="flame" size={14} /> : p.title === "All'uscita" ? <Icon name="sparkle" size={14} /> : <Icon name="layers" size={14} />} {p.title}</div>}
          <div className={`${mini ? 't-chips' : 'chips'} ${dish.ordered && numbered && !mini ? 'stack' : ''}`}>
            {grouped(dish, p.items).map((x, k) => {
              if (typeof x !== 'string') {
                const st = state ? BASE_ROSSA.map((b) => state(b)).find((v) => v) ?? '' : '';
                return mini ? (
                  <span key="base" className="mini base"><Ing name="pomodoro" /><Ing name="fior di latte" /> Base rossa</span>
                ) : (
                  <span key="base" className={`chip base ${st}`}><Ing name="pomodoro" /> Base rossa <span className="muted sm">pomodoro + fior di latte</span></span>
                );
              }
              n++;
              const num = dish.ordered && numbered ? <b className="num">{n}</b> : null;
              return mini ? (
                <span key={x + k} className={`mini ${state?.(x) ?? ''}`}>{num}<Ing name={x} /> {cap(x)}</span>
              ) : (
                <span key={x + k} className="chip-wrap">{num}<Chip text={x} state={state?.(x)} delay={k * 50} /></span>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/** la foto del piatto fatto al lavoro, se c'è */
export function Photo({ id, className = '' }: { id: string; className?: string }) {
  const url = usePhoto(id);
  if (!url) return null;
  return <img className={`dish-photo ${className}`} src={url} alt="La tua foto del piatto" />;
}

/** il perché scritto dall'utente */
export function Why({ dish }: { dish: Dish }) {
  if (!dish.why) return null;
  return (
    <div className="note why"><Icon name="bulb" size={16} /><span>{dish.why}</span></div>
  );
}

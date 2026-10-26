import type { Dish, Save } from './types';
import { today } from './missions';

/** Il diario del turno vero: i piatti fatti al lavoro diventano il ripasso del giorno dopo. */
export const realCount = (s: Save, id: string) => Object.values(s.real ?? {}).filter((ids) => ids.includes(id)).length;

/** si ordina spesso: segnato a mano, o fatto al lavoro in almeno 3 giorni */
export const isPopular = (s: Save, d: Dish) => !!d.popular || realCount(s, d.id) >= 3;

/** l'ultimo giorno di lavoro (prima di oggi, negli ultimi 3 giorni) non ancora ripassato */
export function pendingReal(s: Save): { date: string; dishes: Dish[] } | null {
  const t = today();
  const limit = new Date(Date.now() - 3 * 864e5).toLocaleDateString('sv');
  const days = Object.keys(s.real ?? {}).filter((d) => d < t && d >= limit && (!s.realDone || d > s.realDone)).sort();
  const date = days[days.length - 1];
  if (!date) return null;
  const dishes = s.real![date].map((id) => s.dishes.find((d) => d.id === id)).filter((d): d is Dish => !!d);
  return dishes.length ? { date, dishes } : null;
}

export const dayLabel = (date: string) => {
  const y = new Date(Date.now() - 864e5).toLocaleDateString('sv');
  return date === today() ? 'oggi' : date === y ? 'ieri' : new Date(date + 'T12:00').toLocaleDateString('it', { weekday: 'long' });
};

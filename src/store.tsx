import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Dish, DishStat, Save, Settings } from './lib/types';
import { DEFAULT_DISHES, MENU_VERSION, OLD_DEFAULTS } from './lib/data';
import { emptyStat, levelOf } from './lib/mastery';
import { setFx } from './lib/fx';
import { UPGRADES, lvlOf, upgradeCost } from './lib/build';

const KEY = 'pizzamaster-v1';

const today = () => new Date().toLocaleDateString('sv');
const yesterday = () => new Date(Date.now() - 864e5).toLocaleDateString('sv');

const fresh = (): Save => ({
  v: 1,
  dishes: DEFAULT_DISHES.map((d) => ({ ...d, ingredients: [...d.ingredients] })),
  stats: {},
  xp: 0,
  totalAnswered: 0,
  totalCorrect: 0,
  streakDays: 0,
  lastDay: '',
  todayCount: 0,
  todayDate: today(),
  bestRush: 0,
  bestCombo: 0,
  coins: 0,
  bestShift: 0,
  shifts: 0,
  skins: ['classic'],
  skin: 'classic',
  build: {},
  menuV: MENU_VERSION,
  settings: { sound: true, haptics: true, dailyGoal: 20 },
});

/** aggiorna le ricette al menu stampato, rispettando quelle modificate a mano dall'utente */
function migrateMenu(saved: Dish[]): Dish[] {
  const out = [...saved];
  const same = (a: string[], b: string[]) => a.length === b.length && a.every((x, i) => x === b[i]);
  for (const def of DEFAULT_DISHES) {
    const i = out.findIndex((d) => d.id === def.id);
    if (i < 0) out.push({ ...def, ingredients: [...def.ingredients] });
    else if (out[i].verify || (OLD_DEFAULTS[def.id] && same(out[i].ingredients, OLD_DEFAULTS[def.id])))
      out[i] = { ...def, ingredients: [...def.ingredients] };
  }
  return out;
}

function load(): Save {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw) as Save;
      if (s && s.v === 1 && Array.isArray(s.dishes)) {
        // "nutella nera" era un doppione della nutella normale
        s.dishes = s.dishes.map((d) => ({ ...d, ingredients: [...new Set(d.ingredients.map((i) => (i.trim().toLowerCase() === 'nutella nera' ? 'nutella' : i)))] }));
        if ((s.menuV ?? 1) < MENU_VERSION) s.dishes = migrateMenu(s.dishes);
        s.menuV = MENU_VERSION;
        return { ...fresh(), ...s, settings: { ...fresh().settings, ...s.settings } };
      }
    }
  } catch {
    /* ignore */
  }
  return fresh();
}

export interface RecordResult {
  leveledUp: boolean;
  level: number;
  goalReached: boolean;
}

interface Ctx {
  save: Save;
  record(dishId: string, correct: boolean, missed: string[], xp: number): RecordResult;
  addXp(xp: number): void;
  reportShift(score: number, coins: number, combo: number): boolean;
  buySkin(id: string, cost: number): boolean;
  selectSkin(id: string): void;
  upgrade(id: string): boolean;
  saveDish(d: Dish): void;
  deleteDish(id: string): void;
  resetRecipes(): void;
  resetStats(): void;
  setSettings(p: Partial<Settings>): void;
  importSave(json: string): boolean;
  exportSave(): string;
}

const AppCtx = createContext<Ctx>(null as unknown as Ctx);
export const useApp = () => useContext(AppCtx);

export function AppProvider({ children }: { children: ReactNode }) {
  const [save, setSave] = useState<Save>(load);
  const ref = useRef(save);

  const commit = useCallback((next: Save) => {
    ref.current = next;
    setSave(next);
  }, []);

  useEffect(() => {
    ref.current = save;
    setFx(save.settings);
    try {
      localStorage.setItem(KEY, JSON.stringify(save));
    } catch {
      /* storage pieno o bloccato */
    }
  }, [save]);

  const api = useMemo<Ctx>(
    () => ({
      save,
      record(dishId, correct, missed, xp) {
        const s = ref.current;
        const t = today();
        const st: DishStat = { ...emptyStat(), ...s.stats[dishId], missed: { ...s.stats[dishId]?.missed } };
        st.seen++;
        st.last = Date.now();
        if (correct) {
          st.correct++;
          st.streak++;
          st.box = Math.min(5, st.box + 1);
          st.recentWrong = Math.max(0, st.recentWrong - 1);
        } else {
          st.streak = 0;
          st.box = Math.max(0, st.box - 2);
          st.recentWrong++;
        }
        for (const m of missed) st.missed[m] = (st.missed[m] || 0) + 1;

        let streakDays = s.streakDays;
        let todayCount = s.todayDate === t ? s.todayCount : 0;
        if (s.lastDay !== t) streakDays = s.lastDay === yesterday() ? s.streakDays + 1 : 1;
        const before = todayCount;
        todayCount++;
        const xpNew = s.xp + xp;
        commit({
          ...s,
          stats: { ...s.stats, [dishId]: st },
          xp: xpNew,
          totalAnswered: s.totalAnswered + 1,
          totalCorrect: s.totalCorrect + (correct ? 1 : 0),
          streakDays,
          lastDay: t,
          todayDate: t,
          todayCount,
        });
        return {
          leveledUp: levelOf(xpNew) > levelOf(s.xp),
          level: levelOf(xpNew),
          goalReached: before < s.settings.dailyGoal && todayCount >= s.settings.dailyGoal,
        };
      },
      addXp(xp) {
        commit({ ...ref.current, xp: ref.current.xp + xp });
      },
      reportShift(score, coins, combo) {
        const s = ref.current;
        const isNew = score > s.bestShift;
        commit({ ...s, coins: s.coins + coins, shifts: s.shifts + 1, bestShift: Math.max(s.bestShift, score), bestCombo: Math.max(s.bestCombo, combo) });
        return isNew;
      },
      buySkin(id, cost) {
        const s = ref.current;
        if (s.skins.includes(id) || s.coins < cost) return false;
        commit({ ...s, coins: s.coins - cost, skins: [...s.skins, id], skin: id });
        return true;
      },
      upgrade(id) {
        const s = ref.current;
        const u = UPGRADES.find((x) => x.id === id);
        if (!u) return false;
        const lvl = lvlOf(s.build, id);
        const cost = upgradeCost(u, lvl);
        if (lvl >= u.max || s.coins < cost) return false;
        commit({ ...s, coins: s.coins - cost, build: { ...s.build, [id]: lvl + 1 } });
        return true;
      },
      selectSkin(id) {
        if (ref.current.skins.includes(id)) commit({ ...ref.current, skin: id });
      },
      saveDish(d) {
        const s = ref.current;
        const exists = s.dishes.some((x) => x.id === d.id);
        commit({ ...s, dishes: exists ? s.dishes.map((x) => (x.id === d.id ? d : x)) : [...s.dishes, d] });
      },
      deleteDish(id) {
        const s = ref.current;
        const stats = { ...s.stats };
        delete stats[id];
        commit({ ...s, dishes: s.dishes.filter((x) => x.id !== id), stats });
      },
      resetRecipes() {
        commit({ ...ref.current, dishes: fresh().dishes });
      },
      resetStats() {
        const f = fresh();
        commit({ ...ref.current, stats: {}, xp: 0, totalAnswered: 0, totalCorrect: 0, streakDays: 0, lastDay: '', todayCount: 0, bestShift: 0, bestCombo: 0, coins: 0, shifts: 0, build: {}, skins: ['classic'], skin: 'classic', todayDate: f.todayDate });
      },
      setSettings(p) {
        commit({ ...ref.current, settings: { ...ref.current.settings, ...p } });
      },
      importSave(json) {
        try {
          const s = JSON.parse(json) as Save;
          if (!s || s.v !== 1 || !Array.isArray(s.dishes) || s.dishes.some((d) => !d.id || !d.name || !Array.isArray(d.ingredients))) return false;
          commit({ ...fresh(), ...s, settings: { ...fresh().settings, ...s.settings } });
          return true;
        } catch {
          return false;
        }
      },
      exportSave: () => JSON.stringify(ref.current),
    }),
    [save, commit],
  );

  return <AppCtx.Provider value={api}>{children}</AppCtx.Provider>;
}

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Dish, DishStat, MKind, Save, Settings } from './lib/types';
import { DEFAULT_DISHES, ING_ALIASES, MENU_VERSION, OLD_DEFAULTS } from './lib/data';
import { emptyStat, isDue, levelOf } from './lib/mastery';
import { setFx } from './lib/fx';
import { UPGRADES, lvlOf, upgradeCost } from './lib/build';
import { currentDaily, missionById, progressOf } from './lib/missions';

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
  settings: { sound: true, haptics: true, dailyGoal: 20, text: 2, calm: true },
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
        // ingredienti doppi (es. "insalata iceberg" e "insalata") ridotti a un nome solo
        s.dishes = s.dishes.map((d) => ({ ...d, ingredients: [...new Set(d.ingredients.map((i) => ING_ALIASES[i.trim().toLowerCase()] ?? i))] }));
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
  prevBox: number;
  box: number;
  /** giusto, ma non ancora il momento di salire: torna più avanti */
  held: boolean;
}

export interface RecordOpts {
  /** ingredienti messi per errore */
  extra?: string[];
  /** 1 = errore lieve (un solo ingrediente, o tempo scaduto): la scatola scende di 1 invece che di 2 */
  severity?: 1 | 2;
  /** risposte "facili" (autovalutazione, riconoscimento) non portano la scatola oltre questo livello */
  cap?: number;
  /** tacche guadagnate con una risposta giusta (la sfida scritta ne vale 2) */
  step?: number;
}

interface Ctx {
  save: Save;
  record(dishId: string, correct: boolean, missed: string[], xp: number, opts?: RecordOpts): RecordResult;
  /** avanza le missioni del giorno; combo usa il massimo, il resto si somma */
  track(ev: Partial<Record<MKind, number>>): void;
  claim(id: string): number;
  openChest(): number;
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
    document.documentElement.dataset.text = String(save.settings.text);
    try {
      localStorage.setItem(KEY, JSON.stringify(save));
    } catch {
      /* storage pieno o bloccato */
    }
  }, [save]);

  const api = useMemo<Ctx>(
    () => ({
      save,
      record(dishId, correct, missed, xp, opts = {}) {
        const s = ref.current;
        const t = today();
        const prev = s.stats[dishId];
        const st: DishStat = { ...emptyStat(), ...prev, missed: { ...prev?.missed }, confused: { ...prev?.confused } };
        const prevBox = st.box;
        // Leitner vero: oltre la scatola 2 si sale solo quando il ripasso è "maturo",
        // così la padronanza misura la memoria a lungo termine e non la ripetizione nella stessa sessione
        const ready = !prev?.seen || st.box < 2 || isDue(prev, Date.now());
        st.seen++;
        st.last = Date.now();
        if (correct) {
          st.correct++;
          st.streak++;
          if (ready) st.box = Math.max(st.box, Math.min(5, st.box + (opts.step ?? 1), opts.cap ?? 5));
          st.recentWrong = Math.max(0, st.recentWrong - 1);
        } else {
          st.streak = 0;
          st.box = Math.max(0, st.box - (opts.severity ?? 2));
          st.recentWrong++;
        }
        for (const m of missed) st.missed[m] = (st.missed[m] || 0) + 1;
        for (const x of opts.extra ?? []) st.confused![x] = (st.confused![x] || 0) + 1;

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
          prevBox,
          box: st.box,
          held: correct && !ready && st.box < 5,
        };
      },
      track(ev) {
        const s = ref.current;
        const d = currentDaily(s);
        const prog = { ...d.prog };
        for (const [k, v] of Object.entries(ev) as [MKind, number][]) {
          if (!v) continue;
          prog[k] = k === 'combo' ? Math.max(prog[k] ?? 0, v) : (prog[k] ?? 0) + v;
        }
        commit({ ...s, daily: { ...d, prog } });
      },
      claim(id) {
        const s = ref.current;
        const d = currentDaily(s);
        const m = missionById(id);
        if (!m || !d.ids.includes(id) || d.claimed.includes(id) || progressOf(d, m) < m.goal) return 0;
        commit({ ...s, coins: s.coins + m.reward, daily: { ...d, claimed: [...d.claimed, id] } });
        return m.reward;
      },
      openChest() {
        const s = ref.current;
        const d = currentDaily(s);
        if (d.chest || !d.ids.every((id) => d.claimed.includes(id))) return 0;
        // ricompensa variabile: a volte piccola, a volte un jackpot
        const r = Math.random();
        const coins = r > 0.92 ? 400 : r > 0.65 ? 180 : 60 + Math.round(Math.random() * 80);
        commit({ ...s, coins: s.coins + coins, daily: { ...d, chest: true } });
        return coins;
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
        commit({ ...ref.current, daily: undefined, stats: {}, xp: 0, totalAnswered: 0, totalCorrect: 0, streakDays: 0, lastDay: '', todayCount: 0, bestShift: 0, bestCombo: 0, coins: 0, shifts: 0, build: {}, skins: ['classic'], skin: 'classic', todayDate: f.todayDate });
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

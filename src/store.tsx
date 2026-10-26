import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Dish, DishStat, MKind, Save, Settings } from './lib/types';
import { review, fromBox, type FsGrade } from './lib/fsrs';
import { levelChest } from './lib/levels';
import { norm } from './lib/questions';
import { DEFAULT_DISHES, ING_ALIASES, MENU_VERSION, OLD_DEFAULTS } from './lib/data';
import { emptyStat, isDue, levelOf, ripe } from './lib/mastery';
import { setFx } from './lib/fx';
import { UPGRADES, lvlOf, upgradeCost } from './lib/build';
import { currentDaily, missionById, progressOf } from './lib/missions';

const KEY = 'pizzamaster-v1';
/** versione del modello di memoria (2 = voti della risposta + FSRS) */
const MEM_VERSION = 2;

const today = () => new Date().toLocaleDateString('sv');
const yesterday = () => new Date(Date.now() - 864e5).toLocaleDateString('sv');

const fresh = (): Save => ({
  v: 1,
  dishes: DEFAULT_DISHES.map(clone),
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
  memV: MEM_VERSION,
  settings: { sound: true, haptics: true, dailyGoal: 20, text: 2, calm: true },
});

const clone = (d: Dish): Dish => ({ ...d, ingredients: [...d.ingredients], ...(d.after ? { after: [...d.after] } : {}) });
const setKey = (a: string[]) => a.map(norm).sort().join('|');

/** aggiorna le ricette al menu stampato, rispettando quelle modificate a mano dall'utente */
function migrateMenu(saved: Dish[]): Dish[] {
  const out = [...saved];
  for (const def of DEFAULT_DISHES) {
    const i = out.findIndex((d) => d.id === def.id);
    if (i < 0) {
      out.push(clone(def));
      continue;
    }
    const cur = out[i];
    if (cur.verify || OLD_DEFAULTS[def.id]?.some((o) => setKey(o) === setKey(cur.ingredients))) out[i] = clone(def);
    // stessi ingredienti della ricetta di default: prende l'ordine "come al lavoro" (bozza) e i dati nuovi
    else if (setKey(cur.ingredients) === setKey(def.ingredients) && cur.after === undefined && cur.ordered === undefined)
      out[i] = { ...cur, ingredients: [...def.ingredients], after: def.after && [...def.after], ordered: def.ordered, draft: def.draft };
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
        // salvataggi con le sole scatole di Leitner: la memoria FSRS parte dalla scatola
        for (const st of Object.values(s.stats ?? {})) if (st.seen && !st.fs) st.fs = fromBox(st.box, st.last);
        // la Mise en place ora ha 2 livelli (banco in ordine): il terzo si rimborsa
        if ((s.build?.mise ?? 0) > 2) {
          s.coins = (s.coins ?? 0) + Math.round(220 * (1 + 2 * 0.9));
          s.build = { ...s.build, mise: 2 };
        }
        // chi non aveva mai giocato non ha bisogno del messaggio "memoria più precisa"
        if (!s.memV && !Object.keys(s.stats ?? {}).length) s.memV = MEM_VERSION;
        // memV va preso dal salvataggio: se manca, il messaggio va mostrato
        return { ...fresh(), ...s, memV: s.memV, settings: { ...fresh().settings, ...s.settings } };
      }
    }
  } catch {
    /* ignore */
  }
  return fresh();
}

/**
 * Voto della risposta: 0 = studio (la ricetta era sotto gli occhi), 1 = non lo sapevi,
 * 2 = difficile (giusto ma con correzioni o lento), 3 = bene, 4 = facile.
 */
export type Grade = 0 | 1 | 2 | 3 | 4;

export interface RecordResult {
  leveledUp: boolean;
  level: number;
  goalReached: boolean;
  prevBox: number;
  box: number;
  /** giusto, ma non ancora il momento di salire: torna più avanti */
  held: boolean;
  /** momenti-trofeo */
  firstMem: boolean;
  gold: boolean;
  recovered: boolean;
}

export interface RecordOpts {
  grade: Grade;
  missed?: string[];
  /** ingredienti messi per errore */
  extra?: string[];
  /** con voto 1: 1 = errore lieve (un solo ingrediente, Aiuto, tempo scaduto) la fase scende di 1, altrimenti di 2 */
  severity?: 1 | 2;
  /** prove "facili" (riconoscere, autovalutazione) non portano la fase oltre questo livello */
  cap?: number;
  /** fasi guadagnate con una risposta giusta (la sfida scritta perfetta ne vale 2) */
  step?: number;
  xp?: number;
  /** prova debole (riconoscere, autovalutazione): per FSRS vale al massimo "difficile" */
  weak?: boolean;
  /** risposta pulita: millisecondi per ingrediente, per misurare la scioltezza */
  pace?: number;
  /** fatto senza niente sullo schermo: conta per il "primo a memoria" */
  blind?: boolean;
  /** puntata "Sicuro!" */
  sure?: boolean;
}

interface Ctx {
  save: Save;
  record(dishId: string, opts: RecordOpts): RecordResult;
  /** forzieri dei livelli raggiunti e non ancora aperti */
  claimLevels(): { coins: number; levels: number[] };
  logReal(date: string, ids: string[]): void;
  setRealDone(date: string): void;
  setStation(id: string, list: string[] | null): void;
  ackMemory(): void;
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
      record(dishId, opts) {
        const s = ref.current;
        const t = today();
        const now = Date.now();
        const g = opts.grade;
        const prev = s.stats[dishId];
        const st: DishStat = { ...emptyStat(), ...prev, missed: { ...prev?.missed }, confused: { ...prev?.confused } };
        const prevBox = prev?.seen ? st.box : 0;
        const wasDue = !!prev?.fs && isDue(prev, now);
        const ready = ripe(prev?.seen ? prev : undefined, now);
        st.seen++;
        if (g >= 1) {
          st.fs = review(st.fs, (opts.weak ? Math.min(g, 2) : g) as FsGrade, now);
          st.last = now;
        }
        if (g >= 2) {
          st.correct++;
          st.streak++;
          st.recentWrong = Math.max(0, st.recentWrong - 1);
          if (g >= 3 && ready) st.box = Math.max(st.box, Math.min(5, st.box + (opts.step ?? 1), opts.cap ?? 5));
          if (opts.pace && g >= 3) st.pace = st.pace ? Math.round(st.pace * 0.7 + opts.pace * 0.3) : opts.pace;
        } else if (g === 1) {
          st.streak = 0;
          st.box = Math.max(0, st.box - (opts.severity ?? 2));
          st.recentWrong++;
          st.wrongDay = t;
          if (prevBox >= 3 && st.box <= 1) st.lapsed = true;
        }
        for (const m of opts.missed ?? []) st.missed[m] = (st.missed[m] || 0) + 1;
        for (const x of opts.extra ?? []) st.confused![x] = (st.confused![x] || 0) + 1;
        // primo a memoria: senza aiuti e già nella fase "A memoria" (quindi dopo almeno un giorno di attesa)
        const firstMem = g >= 3 && !!opts.blind && st.box >= 3 && !st.mem1;
        if (firstMem) st.mem1 = true;
        const gold = st.box >= 5 && !st.gold;
        if (gold) st.gold = true;
        const recovered = !!st.lapsed && st.box >= 3;
        if (recovered) st.lapsed = false;

        let streakDays = s.streakDays;
        let todayCount = s.todayDate === t ? s.todayCount : 0;
        if (s.lastDay !== t) streakDays = s.lastDay === yesterday() ? s.streakDays + 1 : 1;
        const before = todayCount;
        todayCount++;
        const xpNew = s.xp + (opts.xp ?? 0);
        // missioni sulla memoria: avanzano da sole, qualunque sia la modalità
        const d = currentDaily(s);
        const prog = { ...d.prog };
        if (st.box > prevBox) prog.phaseup = (prog.phaseup ?? 0) + 1;
        if (g >= 3 && wasDue) prog.fresh = (prog.fresh ?? 0) + 1;
        if (g >= 3 && prev?.wrongDay && prev.wrongDay < t) prog.redeem = (prog.redeem ?? 0) + 1;
        const sure = opts.sure ? { n: (s.sure?.n ?? 0) + 1, ok: (s.sure?.ok ?? 0) + (g >= 2 ? 1 : 0) } : s.sure;
        commit({
          ...s,
          stats: { ...s.stats, [dishId]: st },
          xp: xpNew,
          totalAnswered: s.totalAnswered + (g >= 1 ? 1 : 0),
          totalCorrect: s.totalCorrect + (g >= 2 ? 1 : 0),
          streakDays,
          lastDay: t,
          todayDate: t,
          todayCount,
          daily: { ...d, prog },
          sure,
        });
        return {
          leveledUp: levelOf(xpNew) > levelOf(s.xp),
          level: levelOf(xpNew),
          goalReached: before < s.settings.dailyGoal && todayCount >= s.settings.dailyGoal,
          prevBox,
          box: st.box,
          held: g >= 3 && !ready && st.box < 5,
          firstMem,
          gold,
          recovered,
        };
      },
      claimLevels() {
        const s = ref.current;
        const lvl = levelOf(s.xp);
        const from = s.lvlPaid ?? 1;
        if (lvl <= from) return { coins: 0, levels: [] };
        const levels = Array.from({ length: lvl - from }, (_, i) => from + 1 + i);
        const coins = levels.reduce((a, l) => a + levelChest(l), 0);
        commit({ ...s, coins: s.coins + coins, lvlPaid: lvl });
        return { coins, levels };
      },
      logReal(date, ids) {
        const s = ref.current;
        const real = { ...s.real };
        const realAt = { ...s.realAt };
        if (ids.length) {
          real[date] = ids;
          realAt[date] = Date.now();
        } else {
          delete real[date];
          delete realAt[date];
        }
        // tieni solo gli ultimi 60 giorni
        for (const k of Object.keys(real).sort().slice(0, -60)) {
          delete real[k];
          delete realAt[k];
        }
        const d = currentDaily(s);
        const prog = { ...d.prog, real: ids.length ? 1 : d.prog.real ?? 0 };
        commit({ ...s, real, realAt, daily: { ...d, prog } });
      },
      setRealDone(date) {
        commit({ ...ref.current, realDone: date });
      },
      setStation(id, list) {
        const s = ref.current;
        const station = { ...s.station };
        if (list) station[id] = list;
        else delete station[id];
        commit({ ...s, station });
      },
      ackMemory() {
        commit({ ...ref.current, memV: MEM_VERSION });
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
        commit({ ...ref.current, daily: undefined, stats: {}, sure: undefined, lvlPaid: undefined, xp: 0, totalAnswered: 0, totalCorrect: 0, streakDays: 0, lastDay: '', todayCount: 0, bestShift: 0, bestCombo: 0, coins: 0, shifts: 0, build: {}, skins: ['classic'], skin: 'classic', todayDate: f.todayDate });
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

import { useEffect, useRef, useState } from 'react';
import type { Daily, Dish, DishStat } from '../lib/types';
import { useApp, type Grade } from '../store';
import { availableKinds, isPortion, makeQuestion, norm, similarDish, trayFor, trayLevelFor, whereIs, type TrayLevel } from '../lib/questions';
import { fold, SHELVES, shelfOf } from '../lib/pantry';
import { PHASES, levelOf, pickWeighted, weight } from '../lib/mastery';
import { recall } from '../lib/fsrs';
import { unlocked, unlocksAt } from '../lib/levels';
import { applyVariant, checkFor, gapFor, gapQuestion, variantFor, variantText } from '../lib/orders';
import { judge, piecesLabel, typeOfLabel, type Verdict } from '../lib/plate';
import { layoutOf, sortByLayout, stationOf, universeOf } from '../lib/station';
import { catOf, isPizza } from '../lib/data';
import { cap } from '../lib/emoji';
import { DishPic, Ing } from '../components/Ing';
import { burst, centerOf, confetti, flyCoins, sfx } from '../lib/fx';
import { SKINS } from '../lib/skins';
import { lvlOf } from '../lib/build';
import { CHEF_LOOK, Person, randomLook, type Mood } from '../components/Person';
import { Coin, Heart, Icon } from '../components/Icon';
import { RecipeView } from '../components/Recipe';
import { Stage3D } from '../three/Stage3D';
import { stageBus } from '../three/bus';
import { hasWebGL } from '../three/thumbs';
import { isSpread } from '../three/ingredients';
import { Awning, Bunting, Kitchen, Scene } from '../components/Scene';
import { currentDaily } from '../lib/missions';
import { End, FailSheet, GesturePad, NewCard, type CKind, type Cust, type G, type Hint, type Overlay, type Ret, type Tag } from './GameParts';

const MULT: Record<Hint, number> = { full: 1, flash: 1.25, count: 2, none: 3 };
const GUESS_MULT = 1.5;
const TICK = 100;
const FEVER_AT = 5;
/** il campanello onesto suona dopo un attimo: c'è tempo per ripensarci */
const RING_MS = 900;
const BAKE_MS = 1100;
const BASE_TILE = 'base rossa';

/**
 * Quanto aiuto dare per un ordine: dipende dalla fase del piatto, da quanto è fresco nella memoria (FSRS)
 * e da come sta andando il turno (difficoltà automatica verso ~85% di risposte giuste).
 * `forced` = richiamo programmato: niente ricetta, è la prova vera.
 */
function planFor(st: DishStat | undefined, ease: number, now: number, forced: boolean): { hint: Hint; phase: number } {
  const seen = !!st?.seen;
  const box = seen ? st!.box : 0;
  if (!forced && !seen) return { hint: 'full', phase: 0 };
  if (!forced && box === 0) return { hint: 'flash', phase: 0 };
  let p = Math.max(1, box) + (box === 0 ? Math.min(0, ease) : ease);
  if (st?.fs && recall(st.fs, now) < 0.7) p -= 1;
  p = Math.max(1, Math.min(5, p));
  return { hint: p <= 1 ? 'count' : 'none', phase: p };
}

/** ingredienti che con i gesti accesi si spalmano o si spolverano */
const gestureOf = (ing: string, cat: string): 'spread' | 'sprinkle' | null => {
  const n = ing.toLowerCase();
  if (/grana|parmigiano|granella|scaglie|pepe|origano/.test(n)) return 'sprinkle';
  if (isSpread(ing) || ((cat === 'classiche' || cat === 'speciali') && /^pomodoro$|^salsa|^crema|^pelato|san marzano|pesto/.test(n))) return 'spread';
  return null;
};

/** panino giusto ma montato in un altro ordine: dove va il primo strato fuori posto */
function orderNote(target: string[], plate: string[]) {
  const i = target.findIndex((x, k) => norm(plate[k] ?? '') !== norm(x));
  if (i < 0) return '';
  return i === 0 ? `Al banco si parte da ${target[0]}, sul pane di sotto` : `Al banco ${target[i]} va sopra ${target[i - 1]}`;
}

const initial = (maxLives: number, howto: boolean): G => ({
  phase: 'intro', customers: [], spawned: 0, nextSpawn: 900, selected: null, score: 0, coins: 0, combo: 0, bestCombo: 0, fever: false,
  lives: maxLives, maxLives, served: 0, overlay: null, paused: false, pops: [], toast: null, pose: 'idle', poseT: 0, shake: 0,
  missedDishes: [], lastIds: [], returns: [], finals: [], twins: [], newCount: 0, ease: 0, recent: [], ring: null, bake: null, card: null, trophies: [],
  progress: {}, tally: { memory: 0, revenge: 0, guess: 0, vip: 0, tips: 0, order: 0, cats: [] }, uid: 1, introLeft: 2200, howto,
});

const alive = (c: Cust) => c.state === 'in' || c.state === 'wait';
/** il numero di ingredienti è visibile: solo allora il campanello può suonare da solo */
const countShown = (c: Cust) => c.kind === 'build' && c.group !== 'asporto' && (c.hint !== 'none' || c.peeked);
const studyOf = (c: Cust) => c.kind === 'build' && !c.peeked && !c.group && (c.hint === 'full' || c.hint === 'flash');

export interface GameProps {
  pool: Dish[];
  title: string;
  /** clienti nel turno (8 normale, 12 il sabato sera, 6 prima del turno) */
  total?: number;
  coinMult?: number;
  onExit: () => void;
}

export function Game(props: GameProps) {
  const [run, setRun] = useState(0);
  return <Shift key={run} {...props} again={() => setRun((r) => r + 1)} />;
}

function Shift({ pool, title, total = 8, coinMult = 1, onExit, again }: GameProps & { again: () => void }) {
  const app = useApp();
  const appRef = useRef(app);
  appRef.current = app;
  const gr = useRef<G>(initial(3 + lvlOf(app.save.build, 'frigo'), app.save.shifts < 3));
  const [g, setG] = useState<G>(gr.current);
  const startDaily = useRef<Daily>(currentDaily(app.save));
  const serveRef = useRef<() => void>(() => {});
  const coinRef = useRef<HTMLDivElement>(null);
  const skin = SKINS.find((s) => s.id === app.save.skin) ?? SKINS[0];
  const L = (id: string) => lvlOf(app.save.build, id);
  const [gesture, setGesture] = useState<{ ing: string; kind: 'spread' | 'sprinkle' } | null>(null);

  const commit = (n: G) => {
    gr.current = n;
    setG(n);
  };
  const addPop = (g: G, text: string, kind: string, slot: number): G => ({
    ...g, uid: g.uid + 1, pops: [...g.pops, { id: g.uid, text, kind, x: slot * 33.3 + 16.6, t: 1300 }],
  });
  const custEl = (c: Cust) => document.querySelector(`.bubble[data-cust="${c.id}"]`);
  const use3d = hasWebGL();
  const stageRef = useRef<HTMLDivElement>(null);

  const layoutFor = (d: Dish) => {
    const { station } = appRef.current.save;
    const dishes = appRef.current.menu;
    const id = stationOf(d.category);
    return layoutOf(station?.[id], universeOf(id, dishes));
  };

  /** prepara il cliente per un piatto: aiuto, bancone, tempo */
  const setup = (g: G, d: Dish, forced: boolean, kind: CKind, extra: Partial<Cust> = {}): Omit<Cust, 'id' | 'look' | 'slot' | 'state' | 't'> => {
    const { stats, xp, build, settings } = appRef.current.save;
    const dishes = appRef.current.menu;
    const st = stats[d.id];
    const now = Date.now();
    const group = extra.group ?? null;
    const plan = group === 'asporto' ? { hint: 'none' as Hint, phase: 3 } : planFor(st, g.ease, now, forced);
    const variant = extra.variant ?? null;
    const target = applyVariant(d, variant);
    const level: TrayLevel = kind !== 'build' ? 'base' : group === 'asporto' ? trayLevelFor(d, 3) : trayLevelFor(d, plan.phase);
    let tray: string[] = [];
    if (kind === 'build') {
      const dd = group === 'asporto' ? extra.order ?? [d] : [d];
      const all = new Set<string>();
      for (const x of dd) for (const t of trayFor(x, dishes, stats[x.id]?.confused, level, x === d ? target : x.ingredients)) all.add(t);
      tray = sortByLayout([...all], layoutFor(d));
    }
    const study = kind === 'build' && !group && (plan.hint === 'full' || plan.hint === 'flash');
    // ritmo tranquillo: niente fretta che cresce col livello e clienti quasi il doppio più pazienti
    const diff = settings.calm ? 1.8 : Math.max(0.55, 1 - (levelOf(xp) - 1) * 0.04);
    const n = target.length;
    const baseT = kind === 'guess' || kind === 'gap'
      ? 15 + n * 1.2
      : kind === 'check' ? 18 + n * 1.5
      : (24 + n * 2.5 + (study ? 8 : 0) + (level === 'pantry' ? 12 : level === 'wide' ? 4 : 0) + (isPizza(d.category) ? 4 : 0)) * (group === 'asporto' ? 1.6 * (extra.order?.length ?? 1) * 0.7 : 1);
    const max = Math.round(baseT * 1000 * diff * (1 + 0.1 * lvlOf(build, 'forno')) * (extra.vip ? 0.85 : 1));
    return {
      left: max, max, kind, dish: d, queue: [], group, parts: 1, part: 1, order: [], heard: 0, relisten: false, variant, target,
      hint: plan.hint, phase: plan.phase, level, tray, plate: [], oven: null, peeked: false, hidden: false, fixes: 0, work: 0, sure: false,
      tag: null, vip: false, options: [], gap: null, check: null, ...extra,
    };
  };

  const spawn = (g: G): G => {
    const taken = new Set(g.customers.map((c) => c.slot));
    const slot = [0, 1, 2].find((s) => !taken.has(s));
    if (slot === undefined) return g;
    const { stats, xp } = appRef.current.save;
    const dishes = appRef.current.menu;
    const now = Date.now();
    const lvl = levelOf(xp);
    const onScreen = g.customers.filter(alive).flatMap((c) => [c.dish.id, ...c.queue.map((x) => x.id), ...c.order.map((x) => x.id)]);
    const seen = (d: Dish) => !!stats[d.id]?.seen;
    const box = (d: Dish) => (seen(d) ? stats[d.id].box : 0);
    const free = pool.filter((d) => !onScreen.includes(d.id));
    const ready = (min: number) => free.filter((d) => seen(d) && box(d) >= min && !g.lastIds.slice(-1).includes(d.id));

    let cust: ReturnType<typeof setup> | null = null;
    let tag: Tag = null;
    // 1. i ritorni programmati: richiamo di un piatto appena studiato, rivincita, piatto simile da distinguere
    const due = g.returns.find((r) => r.due <= g.spawned && free.some((d) => d.id === r.id));
    if (due) {
      const d = free.find((x) => x.id === due.id)!;
      tag = due.tag;
      cust = setup(g, d, true, 'build', { tag, pair: due.pair });
    }
    // 2. ordini sbloccati coi livelli, solo con piatti già pronti
    if (!cust && g.spawned >= 1) {
      const r = Math.random();
      if (unlocked(lvl, 'asporto') && r < 0.1) {
        const c = ready(3).filter((d) => !isPortion(d));
        const a = c[Math.floor(Math.random() * c.length)];
        const b = a && c.filter((x) => x.id !== a.id && x.category === a.category)[0];
        if (a && b) cust = setup(g, a, true, 'build', { group: 'asporto', order: [a, b], parts: 2, heard: appRef.current.save.settings.calm ? 6000 : 4000 });
      } else if (unlocked(lvl, 'tavolo') && r < 0.24) {
        const c = ready(2);
        const [a, b] = pickWeighted(c.map((d) => ({ item: d, w: weight(stats[d.id], now) })), 2);
        if (a && b) cust = setup(g, a, true, 'build', { group: 'tavolo', queue: [b], parts: 2 });
      } else if (unlocked(lvl, 'controllo') && r < 0.34) {
        const c = ready(2).filter((d) => !isPortion(d) && d.ingredients.length >= 2);
        const d = c[Math.floor(Math.random() * c.length)];
        if (d) cust = setup(g, d, true, 'check', { check: { ...checkFor(d, dishes), fix: false } });
      }
    }
    // 3. un piatto scelto per quanto "serve" ripassarlo; i piatti nuovi al massimo 2 per turno (3 all'inizio)
    if (!cust) {
      const budget = pool.filter(seen).length < 4 ? 3 : 2;
      let cands = free.filter((d) => !g.lastIds.slice(-2).includes(d.id));
      if (!cands.length) cands = free.length ? free : pool;
      const old = cands.filter(seen);
      if (g.newCount >= budget && old.length) cands = old;
      // i piatti nuovi a rotazione fra le categorie: senza, con "tutto il menu" sarebbero quasi tutte pizze (34 su 60)
      const fresh = cands.filter((x) => !seen(x));
      const perCat = new Map<string, number>();
      for (const x of fresh) perCat.set(x.category, (perCat.get(x.category) ?? 0) + 1);
      const share = (x: Dish) => (seen(x) ? 1 : fresh.length / perCat.size / perCat.get(x.category)!);
      const [d] = pickWeighted(cands.map((x) => ({ item: x, w: weight(stats[x.id], now) * share(x) * (x.popular && !seen(x) ? 2 : 1) })), 1);
      const b = box(d);
      const r = Math.random();
      if (seen(d) && b >= 2 && !isPortion(d) && availableKinds(d, dishes).includes('which') && r < 0.18) {
        const q = makeQuestion(d, dishes, 'which');
        cust = setup(g, d, true, 'guess', { options: q.kind === 'which' ? q.options : [] });
      } else if (seen(d) && (b === 2 || b === 3) && r < 0.36 && gapFor(d, dishes)) {
        cust = setup(g, d, true, 'gap', { gap: gapFor(d, dishes) });
      } else {
        const variant = seen(d) && b >= 3 && unlocked(lvl, 'varianti') && r < 0.58 ? variantFor(d, universeOf(stationOf(d.category), dishes)) : null;
        cust = setup(g, d, false, 'build', { variant });
        if (!seen(d)) tag = 'nuovo';
      }
    }
    const vip = !due && !cust.group && cust.kind === 'build' && tag !== 'nuovo' && g.spawned >= 1 && Math.random() < 0.12;
    const c: Cust = { ...cust, tag, vip, id: g.uid, look: randomLook(), slot, state: 'in', t: 0 };
    if (vip) c.max = c.left = Math.round(c.max * 0.85);
    const ids = [c.dish.id, ...c.queue.map((x) => x.id), ...c.order.map((x) => x.id)];
    return {
      ...g, uid: g.uid + 1, customers: [...g.customers, c], spawned: g.spawned + 1, lastIds: [...g.lastIds, ...ids],
      returns: due ? g.returns.filter((r) => r !== due) : g.returns,
      newCount: g.newCount + (tag === 'nuovo' ? 1 : 0),
      card: tag === 'nuovo' ? c.dish : g.card,
      selected: tag === 'nuovo' ? c.id : g.selected,
      nextSpawn: Math.max(3500, 5500 + Math.random() * 3000 - g.spawned * 250) + (appRef.current.save.settings.calm ? 4000 : 0) + (total > 8 ? -800 : 0),
    };
  };

  const track = (g: G, id: string, name: string, prevBox: number, box: number, held = false): G => ({
    ...g, progress: { ...g.progress, [id]: { name, from: g.progress[id]?.from ?? prevBox, to: box, held: held || g.progress[id]?.held } },
  });

  const pending = (g: G, id: string) => g.returns.some((r) => r.id === id);
  const schedule = (g: G, r: Ret): G => (g.spawned >= total || pending(g, r.id) ? g : { ...g, returns: [...g.returns, { ...r, due: Math.min(r.due, total - 1) }] });

  /** difficoltà automatica: tutto liscio → un aiuto in meno; troppi errori → un aiuto in più */
  const adapt = (g: G, v: number): G => {
    const recent = [...g.recent, v];
    const last = recent.slice(-5);
    if (last.length >= 5 && last.every((x) => x === 1) && g.ease < 1)
      return { ...g, recent: [], ease: g.ease + 1, toast: { text: 'Stai andando forte!', sub: 'Tolgo un aiuto: da ora un po\' più difficile', t: 1900 } };
    if (recent.slice(-4).filter((x) => x === 0).length >= 2 && g.ease > -1)
      return { ...g, recent: [], ease: g.ease - 1, toast: { text: 'Ti do una mano', sub: 'Un aiuto in più per i prossimi clienti', t: 1900 } };
    return { ...g, recent };
  };

  const fail = (g: G, c: Cust, kind: Overlay['kind'], v: Verdict | null, notes0: string[] = [], d = c.dish, chosen?: Dish): G => {
    const dishes = appRef.current.menu;
    const severity = kind === 'wrong' && v && v.missing.length + v.extra.length > 1 ? 2 : 1;
    const r = appRef.current.record(d.id, { grade: 1, missed: v?.missing ?? [], extra: v?.extra ?? [], severity, sure: c.sure });
    sfx.bad();
    stageBus.emit({ type: 'fail', slot: c.slot });
    const notes = [...notes0];
    if (c.variant && v) {
      if (c.variant.type === 'senza' && v.extra.some((x) => norm(x) === norm(c.variant!.ing))) notes.push(`Il cliente l'aveva chiesta senza ${c.variant.ing}`);
      if (c.variant.type === 'con' && v.missing.some((x) => norm(x) === norm(c.variant!.ing))) notes.push(`Il cliente aveva chiesto in più ${c.variant.ing}`);
    }
    for (const x of v?.extra ?? []) {
      if (c.variant && norm(x) === norm(c.variant.ing)) continue;
      const o = whereIs(x, d, dishes);
      notes.push(o ? `${cap(x)} va nel ${o.name}, non qui` : `${cap(x)} non c'entra`);
    }
    // la rivincita: il piatto sbagliato torna dopo un paio di clienti (una volta sola)
    let n: G = c.tag === 'rivincita' ? g : schedule(g, { id: d.id, due: g.spawned + 2, tag: 'rivincita' });
    const retry = pending(n, d.id);
    n = {
      ...n,
      lives: n.lives - 1, combo: 0, fever: false, shake: 450, pose: 'sad', poseT: 1200, score: c.sure ? Math.max(0, n.score - 100) : n.score,
      overlay: { kind, dish: d, target: d === c.dish ? c.target : d.ingredients, verdict: v, chosen, notes, retry, sure: c.sure },
      missedDishes: n.missedDishes.some((x) => x.id === d.id) ? n.missedDishes : [...n.missedDishes, d],
      customers: n.customers.map((x) => (x.id === c.id ? { ...x, state: 'angry', t: 0 } : x)),
      ring: null,
    };
    n = track(n, d.id, d.name, r.prevBox, r.box);
    n = adapt(n, 0);
    return addPop(n, kind === 'late' ? 'Troppo tardi!' : c.sure ? 'Sicuro? No!' : 'Sbagliato!', 'bad', c.slot);
  };

  const success = (g0: G, c: Cust, v: Verdict | null, d = c.dish) => {
    const { stats } = appRef.current.save;
    const dishes = appRef.current.menu;
    const st = stats[d.id];
    const study = studyOf(c);
    const target = d === c.dish ? c.target : d.ingredients;
    // il voto della risposta: cosa dice davvero questo piatto servito sulla memoria
    let grade: Grade;
    let cap3: number | undefined;
    let weak = false;
    if (c.kind === 'guess' || c.kind === 'gap') [cap3, weak] = [3, true];
    if (c.kind === 'check') [cap3, weak] = [4, true];
    const expected = (st?.pace ?? 3500) * Math.max(1, target.length);
    const slow = c.work > expected * 1.8;
    if (c.peeked) grade = 1;
    else if (study) grade = 0;
    else {
      grade = c.fixes || slow ? 2 : 3;
      if (grade === 3 && c.work < expected * 0.75 && (c.level === 'pantry' || c.sure)) grade = 4;
      if (v?.orderOk === false) grade = Math.min(grade, 3) as Grade;
      if (v?.ovenWrong.length) grade = Math.min(grade, 2) as Grade;
    }
    const mult = c.peeked ? 1 : c.kind === 'guess' ? GUESS_MULT : c.kind === 'gap' ? 1.5 : c.kind === 'check' ? 2 : MULT[c.hint];
    const r = appRef.current.record(d.id, {
      grade, severity: 1, cap: cap3, weak, xp: Math.round(6 * mult),
      pace: grade >= 3 && !c.fixes && c.kind === 'build' ? Math.round(c.work / Math.max(1, target.length)) : undefined,
      blind: c.kind === 'build' && c.hint === 'none' && !c.peeked, sure: c.sure && grade >= 1,
    });
    const combo = g0.combo + 1;
    const fever = g0.fever || combo >= FEVER_AT;
    const frac = Math.max(0, c.left / c.max);
    const b = appRef.current.save.build;
    const bonus = (c.variant ? 1.3 : 1) * (c.group === 'asporto' && !c.relisten ? 1.5 : 1) * (c.tag === 'gemello' ? 1.3 : 1) * (c.sure ? 2 : 1) * (c.tag === 'rivincita' ? 1.5 : 1);
    const pts = Math.round((100 * mult * (1 + Math.min(combo - 1, 10) * 0.1) + frac * 60) * (1 + 0.05 * lvlOf(b, 'insegna')) * (fever ? 1.5 : 1) * bonus) + (v?.orderOk ? 30 : 0);
    let coins = Math.max(1, Math.round((pts / 20) * (1 + 0.15 * lvlOf(b, 'cassa')))) * (c.vip ? 3 : 1);
    coins = Math.round(coins * coinMult * (c.group === 'tavolo' ? 1.3 : 1));
    // mancia: ricompensa variabile per chi è veloce
    const tip = frac > 0.55 && Math.random() < 0.5 ? 1 + Math.floor(Math.random() * 5) : 0;
    let n: G = { ...g0, ring: null };
    n = track(n, d.id, d.name, r.prevBox, r.box, r.held);
    // la fase che sale si vede subito
    if (r.box > r.prevBox) {
      n = addPop(n, `${d.name} → ${PHASES[r.box]}`, 'phase', c.slot);
      if (!r.gold && !r.recovered && !r.firstMem && !r.leveledUp) setTimeout(() => sfx.phase(), 380);
    }
    // momenti-trofeo: rari, e valgono monete
    let trophyCoins = 0;
    if (r.gold) {
      n = { ...n, trophies: [...n.trophies, { kind: 'gold', dish: d }], toast: { text: 'Piatto d\'oro!', sub: `${d.name}: lo sai davvero. +50 monete`, t: 2200 } };
      trophyCoins += 50;
      setTimeout(() => { sfx.level(); confetti(1.6); }, 300);
    } else if (r.recovered) {
      n = { ...n, trophies: [...n.trophies, { kind: 'recovered', dish: d }], toast: { text: 'Recuperato!', sub: `${d.name} era sfuggito, ora è tornato. +30 monete`, t: 2000 } };
      trophyCoins += 30;
      setTimeout(() => sfx.level(), 300);
    } else if (r.firstMem) {
      n = { ...n, trophies: [...n.trophies, { kind: 'mem', dish: d }], toast: { text: 'Primo a memoria!', sub: `${d.name} senza nessun aiuto. +20 monete`, t: 2000 } };
      trophyCoins += 20;
      setTimeout(() => { sfx.level(); confetti(0.9); }, 300);
    }
    if (r.leveledUp) {
      const u = unlocksAt(r.level);
      n = { ...n, toast: { text: `Livello ${r.level}!`, sub: u.length ? u.map((x) => `Sbloccato: ${x.name}`).join(' · ') : 'A fine turno si apre il forziere del livello', t: 2200 } };
      setTimeout(() => { sfx.level(); confetti(1.2); }, 350);
    }
    // ritorni: dopo lo studio (o l'Aiuto) il piatto torna fra due clienti senza ricetta; il primo richiamo riuscito ne prenota un altro a fine turno
    if (study || c.peeked) n = schedule(n, { id: d.id, due: n.spawned + 2, tag: 'richiamo' });
    else if (c.tag === 'richiamo' && grade >= 2 && r.box <= 2 && !n.finals.includes(d.id)) n = { ...schedule(n, { id: d.id, due: total - 1, tag: 'richiamo' }), finals: [...n.finals, d.id] };
    // a memoria: arriva il piatto con cui si confonde, per allenare la differenza
    if (!study && r.box >= 3 && c.tag !== 'gemello' && !n.twins.includes(d.id)) {
      const sim = similarDish(d, dishes);
      const other = sim && pool.find((x) => x.id === sim.other.id);
      if (other && stats[other.id]?.seen && !n.customers.some((x) => alive(x) && x.dish.id === other.id))
        n = { ...schedule(n, { id: other.id, due: n.spawned, tag: 'gemello', pair: d.name }), twins: [...n.twins, d.id, other.id] };
    }
    if (grade >= 1) n = adapt(n, grade >= 3 ? 1 : grade === 2 ? 0.5 : 0);
    const memory = !c.peeked && c.kind === 'build' && (c.hint === 'count' || c.hint === 'none');
    sfx.ok(combo);
    const el = custEl(c);
    const at = centerOf(el);
    if (at && !use3d) burst(at.x, at.y, c.vip || fever ? 1.6 : 1, c.vip ? ['#ffd24a', '#fff3b0', '#ffb300'] : undefined);
    const items = c.kind === 'build' ? (isPortion(d) ? piecesLabel(c.plate) : c.plate) : d.ingredients;
    stageBus.emit({ type: 'serve', slot: c.slot, items, cat: d.category, coins: coins + tip, vip: c.vip });
    setTimeout(() => flyCoins(at, coinRef.current, coins + tip), 120);
    if (fever && !g0.fever) {
      sfx.fever();
      n = { ...n, toast: n.toast ?? { text: 'FEVER!', sub: 'Punti ×1.5 finché non sbagli', t: 1600 } };
    }
    if (combo % 4 === 0) confetti(0.7);
    // tavolo da due e asporto: il cliente resta finché non ha tutti i piatti
    const nextDish = c.group === 'tavolo' ? c.queue[0] : c.group === 'asporto' ? c.order.find((x) => x.id !== d.id) : undefined;
    const customers = n.customers.map((x) => {
      if (x.id === c.id) {
        if (nextDish) {
          const next = setup(n, nextDish, true, 'build', { group: c.group, parts: c.parts, part: c.part + 1, order: c.order.filter((o) => o.id !== d.id), heard: 0, relisten: c.relisten });
          return { ...x, ...next, queue: c.queue.slice(1), left: Math.min(c.max, c.left + next.max * 0.4), max: c.max, vip: c.vip, tag: c.tag };
        }
        return { ...x, state: 'happy' as const, t: 0 };
      }
      return alive(x) ? { ...x, left: Math.min(x.max, x.left + 1500 * lvlOf(b, 'cronometro')) } : x;
    });
    n = {
      ...n, score: n.score + pts, coins: n.coins + coins + tip + trophyCoins, combo, fever, bestCombo: Math.max(n.bestCombo, combo), served: n.served + (nextDish ? 0 : 1),
      pose: 'cheer', poseT: 900, customers,
      tally: {
        memory: n.tally.memory + (memory ? 1 : 0), revenge: n.tally.revenge + (c.tag === 'rivincita' ? 1 : 0), guess: n.tally.guess + (c.kind === 'guess' ? 1 : 0),
        vip: n.tally.vip + (c.vip ? 1 : 0), tips: n.tally.tips + tip, order: n.tally.order + (v?.orderOk ? 1 : 0),
        cats: n.tally.cats.includes(d.category) ? n.tally.cats : [...n.tally.cats, d.category],
      },
    };
    n = addPop(n, `+${pts}`, 'gain', c.slot);
    const hype = v?.orderOk ? 'Montato come al banco!' : c.sure ? 'Sicuro, e giusto!' : c.vip ? `VIP +${coins}` : c.tag === 'rivincita' ? 'Riscatto!' : c.tag === 'gemello' ? 'Li distingui!' : c.kind === 'check' ? 'Occhio da capo!' : c.kind === 'guess' ? 'Indovinato!' : nextDish ? `${c.part}/${c.parts} servito!` : memory && c.hint === 'none' ? 'A memoria!' : frac > 0.6 ? 'Veloce!' : 'Perfetto!';
    n = addPop(n, hype, c.vip ? 'vip' : 'hype', c.slot);
    if (v?.ovenWrong.length) n = addPop(n, `${cap(v.ovenWrong[0].ing)}: ${v.ovenWrong[0].after ? 'va all\'uscita' : 'va in forno'}`, 'bad', c.slot);
    else if (v?.orderOk === false) n = { ...n, toast: n.toast ?? { text: 'Giusto, ma…', sub: orderNote(target, c.plate), t: 2200 } };
    else if (tip) n = addPop(n, `+${tip} mancia`, 'tip', c.slot);
    else if (combo >= 3) n = addPop(n, `Combo ×${combo}`, 'combo', c.slot);
    commit(n);
  };

  const tick = () => {
    let g = gr.current;
    if (g.phase === 'end') return;
    const dt = TICK;
    g = {
      ...g, pops: g.pops.map((p) => ({ ...p, t: p.t - dt })).filter((p) => p.t > 0), shake: Math.max(0, g.shake - dt), poseT: Math.max(0, g.poseT - dt),
      toast: g.toast && g.toast.t > dt ? { ...g.toast, t: g.toast.t - dt } : null,
    };
    if (g.poseT === 0 && g.pose !== 'idle') g = { ...g, pose: 'idle' };
    if (g.phase === 'intro') {
      if (g.howto) return commit(g);
      g = { ...g, introLeft: g.introLeft - dt };
      if (g.introLeft <= 0) g = { ...g, phase: 'play' };
      return commit(g);
    }
    if (g.paused || g.overlay || g.card) return commit(g);

    if (g.bake) g = { ...g, bake: g.bake.t > dt ? { ...g.bake, t: g.bake.t - dt } : null };
    g = { ...g, nextSpawn: g.nextSpawn - dt };
    let timedOut: Cust | null = null;
    const customers: Cust[] = [];
    const garz = lvlOf(appRef.current.save.build, 'garzone');
    for (const c of g.customers) {
      const n = { ...c, t: c.t + dt };
      const slow = c.id === g.selected ? 1 : 1 - 0.15 * garz;
      if (n.heard > 0) n.heard = Math.max(0, n.heard - dt);
      if (n.state === 'in') {
        n.left -= dt * slow;
        if (n.t >= 750) { n.state = 'wait'; n.t = 0; }
      } else if (n.state === 'wait') {
        n.left -= dt * slow;
        if (c.id === g.selected) n.work += dt;
        if (n.left <= 0 && !timedOut) timedOut = n;
      } else if (n.t >= 950) continue;
      customers.push(n);
    }
    g = { ...g, customers };
    const active = customers.filter(alive);
    if (g.spawned < total && g.nextSpawn <= 0 && customers.length < 3) g = spawn(g);
    else if (g.spawned < total && !active.length && g.nextSpawn > 700) g = { ...g, nextSpawn: 700 };
    if (timedOut) g = fail(g, timedOut, 'late', null);
    const sel = g.customers.find((c) => c.id === g.selected && alive(c));
    if (!sel) {
      const a = g.customers.filter(alive).sort((x, y) => x.left - y.left)[0];
      g = { ...g, selected: a ? a.id : null };
    }
    if (!g.overlay && (g.lives <= 0 || (g.spawned >= total && g.customers.length === 0))) g = { ...g, phase: 'end' };
    // il campanello onesto: suona quando il numero torna, giusto o sbagliato che sia
    if (g.ring && !g.overlay) {
      const left = g.ring.t - dt;
      if (left <= 0) {
        commit({ ...g, ring: null });
        return serveRef.current();
      }
      g = { ...g, ring: { ...g.ring, t: left } };
    }
    commit(g);
  };

  useEffect(() => {
    const t = setInterval(tick, TICK);
    return () => clearInterval(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const selected = g.customers.find((c) => c.id === g.selected && alive(c));

  const updateSel = (f: (c: Cust) => Partial<Cust>, extra: Partial<G> = {}) => {
    const g0 = gr.current;
    commit({ ...g0, ...extra, customers: g0.customers.map((x) => (x.id === g0.selected ? { ...x, ...f(x) } : x)) });
  };

  /** dopo ogni ingrediente: se il campanello c'è e il numero torna, sta per suonare */
  const armBell = () => {
    const g0 = gr.current;
    const c = g0.customers.find((x) => x.id === g0.selected);
    if (!c) return;
    const on = lvlOf(appRef.current.save.build, 'campanello') > 0 && countShown(c) && !isPortion(c.dish) && c.plate.length === c.target.length;
    commit({ ...g0, ring: on ? { id: c.id, t: RING_MS } : null });
  };

  /** mette o toglie un ingrediente (o un pezzo, in friggitoria) */
  const place = (ing: string) => {
    const g0 = gr.current;
    const c = g0.customers.find((x) => x.id === g0.selected);
    if (!c || c.kind !== 'build' || g0.overlay || g0.paused || g0.card || g0.phase !== 'play' || !alive(c) || g0.bake?.id === c.id) return;
    let plate: string[];
    let removed = false;
    if (isPortion(c.dish)) {
      plate = [...c.plate, ing];
    } else if (ing === BASE_TILE) {
      const has = ['pomodoro', 'fior di latte'].every((b) => c.plate.some((p) => norm(p) === b));
      if (has && c.oven?.some((p) => ['pomodoro', 'fior di latte'].includes(norm(p)))) return;
      removed = has;
      plate = has ? c.plate.filter((p) => !['pomodoro', 'fior di latte'].includes(norm(p))) : [...c.plate, ...['pomodoro', 'fior di latte'].filter((b) => !c.plate.some((p) => norm(p) === b))];
    } else {
      const has = c.plate.includes(ing);
      // quello che è già in forno non si toglie più
      if (has && c.oven?.includes(ing)) return;
      removed = has;
      plate = has ? c.plate.filter((x) => x !== ing) : [...c.plate, ing];
    }
    if (removed) sfx.tap();
    else sfx.place(plate.length);
    commit({ ...g0, pose: 'work', poseT: 350, customers: g0.customers.map((x) => (x.id === c.id ? { ...x, plate, hidden: x.hidden || plate.length > 0, fixes: x.fixes + (removed ? 1 : 0) } : x)) });
    armBell();
  };

  /** tocco su una tessera: con i gesti accesi alcune cose si spalmano o si spolverano */
  const tap = (ing: string) => {
    const g0 = gr.current;
    const c = g0.customers.find((x) => x.id === g0.selected);
    const kind = appRef.current.save.settings.gestures && c && !c.plate.includes(ing) && ing !== BASE_TILE ? gestureOf(ing, c.dish.category) : null;
    if (kind) {
      sfx.tap();
      setGesture({ ing, kind });
    } else place(ing);
  };

  /** toglie dal piatto: in friggitoria un pezzo alla volta */
  const remove = (label: string) => {
    const g0 = gr.current;
    const c = g0.customers.find((x) => x.id === g0.selected);
    if (!c) return;
    if (!isPortion(c.dish)) return place(label);
    const t = typeOfLabel(label);
    const i = c.plate.lastIndexOf(t);
    if (i < 0) return;
    sfx.tap();
    updateSel((x) => ({ plate: x.plate.filter((_, k) => k !== i), fixes: x.fixes + 1 }), { ring: null });
  };

  const clearPlate = () => {
    const g0 = gr.current;
    const c = g0.customers.find((x) => x.id === g0.selected);
    if (!c || !c.plate.length) return;
    sfx.tap();
    updateSel((x) => ({ plate: x.oven ? [...x.oven] : [], fixes: x.fixes + 1 }), { ring: null });
  };

  const peek = () => {
    sfx.tap();
    updateSel(() => ({ peeked: true, sure: false }));
  };
  const relisten = () => {
    sfx.tap();
    updateSel(() => ({ heard: 3000, relisten: true }));
  };
  const toggleSure = () => {
    sfx.tap();
    updateSel((x) => ({ sure: !x.sure }));
  };

  const select = (id: number) => {
    const g0 = gr.current;
    if (g0.overlay || g0.paused || g0.card) return;
    sfx.tap();
    commit({ ...g0, selected: id, ring: g0.ring?.id === id ? g0.ring : null });
  };

  const bake = () => {
    const g0 = gr.current;
    const c = g0.customers.find((x) => x.id === g0.selected);
    if (!c || !isPizza(c.dish.category) || c.oven) return;
    sfx.fever();
    let n: G = { ...g0, bake: { id: c.id, t: BAKE_MS }, pose: 'work', poseT: 800, customers: g0.customers.map((x) => (x.id === c.id ? { ...x, oven: [...x.plate] } : x)) };
    n = addPop(n, 'In forno!', 'hype', c.slot);
    // col campanello: appena cotta, se il numero torna, va servita da sola
    if (g0.ring?.id === c.id) n = { ...n, ring: { id: c.id, t: BAKE_MS + 250 } };
    commit(n);
  };

  const serve = () => {
    const g0 = gr.current;
    const c = g0.customers.find((x) => x.id === g0.selected);
    if (!c || c.kind !== 'build' || c.state !== 'wait' || !c.plate.length || g0.overlay || g0.paused || g0.card) return;
    if (g0.bake?.id === c.id) return;
    if (isPizza(c.dish.category) && !c.oven) return bake();
    const opts = (d: Dish) => ({
      counted: isPortion(d), ordered: !!d.ordered && !c.variant, after: d.after, oven: c.oven,
      free: c.variant?.type === 'con' ? [c.variant.ing] : [],
    });
    if (c.group === 'asporto') {
      // asporto: il piatto preparato può essere uno qualsiasi della comanda
      const tries = c.order.map((d) => ({ d, v: judge(d.ingredients, c.plate, opts(d)) }));
      const hit = tries.find((x) => x.v.ok);
      if (hit) return success(g0, c, hit.v, hit.d);
      const best = tries.sort((a, b) => b.v.right - b.v.extra.length - (a.v.right - a.v.extra.length))[0];
      return commit(fail(g0, c, 'wrong', best.v, [`Al telefono avevano chiesto: ${c.order.map((x) => x.name).join(' e ')}`], best.d));
    }
    const o = opts(c.dish);
    const v = judge(c.target, c.plate, o);
    if (!v.ok) return commit(fail(g0, c, 'wrong', v));
    success(g0, c, v);
  };
  serveRef.current = serve;

  const answer = (opt: Dish) => {
    const g0 = gr.current;
    const c = g0.customers.find((x) => x.id === g0.selected);
    if (!c || c.kind !== 'guess' || c.state !== 'wait' || g0.overlay || g0.paused) return;
    if (opt.id !== c.dish.id) return commit(fail(g0, c, 'guess', null, [], c.dish, opt));
    // riconoscere è più facile che ricordare: non porta il piatto oltre "A memoria"
    success(g0, c, null);
  };

  const answerGap = (opt: string) => {
    const g0 = gr.current;
    const c = g0.customers.find((x) => x.id === g0.selected);
    if (!c || c.kind !== 'gap' || !c.gap || c.state !== 'wait' || g0.overlay || g0.paused) return;
    const hidden = c.dish.ingredients[c.gap.idx];
    if (norm(opt) === norm(hidden)) return success(g0, c, null);
    commit(fail(g0, c, 'wrong', { ok: false, missing: [hidden], extra: [opt], right: c.dish.ingredients.length - 1, total: c.dish.ingredients.length, orderOk: null, ovenWrong: [] }));
  };

  /** controllo qualità: tocchi l'ingrediente sbagliato (o "va bene così"), poi scegli cosa ci voleva */
  const answerCheck = (pick: string | 'ok', fix = false) => {
    const g0 = gr.current;
    const c = g0.customers.find((x) => x.id === g0.selected);
    const k = c?.check;
    if (!c || !k || c.kind !== 'check' || c.state !== 'wait' || g0.overlay || g0.paused) return;
    const why = k.kind === 'ok' ? 'Il piatto di Giuseppe era giusto: andava servito' : k.kind === 'oven' ? `${cap(k.wrong!)} va messo all'uscita, Giuseppe l'aveva messo in forno` : `Giuseppe aveva messo ${k.wrong} al posto di ${k.right}`;
    if (fix) {
      if (norm(pick) === norm(k.right!)) return success(g0, c, null);
      return commit(fail(g0, c, 'check', null, [why]));
    }
    if (pick === 'ok') return k.kind === 'ok' ? success(g0, c, null) : commit(fail(g0, c, 'check', null, [why]));
    if (k.kind === 'ok' || norm(pick) !== norm(k.wrong!)) return commit(fail(g0, c, 'check', null, [`${cap(pick)} era giusto`, why]));
    if (k.kind === 'oven') return success(g0, c, null);
    sfx.place(2);
    updateSel((x) => ({ check: x.check ? { ...x.check, fix: true } : null }));
  };

  const closeOverlay = () => {
    sfx.tap();
    commit({ ...gr.current, overlay: null });
  };
  const closeCard = () => {
    sfx.tap();
    commit({ ...gr.current, card: null });
  };
  const setPaused = (p: boolean) => commit({ ...gr.current, paused: p });
  const startShift = () => {
    sfx.tap();
    commit({ ...gr.current, howto: false });
  };

  const tagText = (c: Cust) =>
    c.vip ? 'VIP ×3' : c.group === 'tavolo' ? `Tavolo ${c.part}/${c.parts}` : c.group === 'asporto' ? 'Asporto' : c.kind === 'check' ? 'Controllo' : c.tag === 'nuovo' ? 'Nuovo' : c.tag === 'rivincita' ? 'Rivincita' : c.tag === 'richiamo' ? 'Ricordi?' : c.tag === 'gemello' ? 'Simile!' : c.kind === 'guess' ? 'Indeciso' : c.kind === 'gap' ? 'Cosa manca?' : c.variant ? 'Variante' : '';

  const bubbleOf = (c: Cust) => {
    const f = c.left / c.max;
    const t = tagText(c);
    return (
      <button data-cust={c.id} className={`bubble ${selected?.id === c.id ? 'sel' : ''} ${c.vip ? 'vip' : ''} ${c.tag === 'rivincita' || c.tag === 'richiamo' ? 'retry' : ''} ${f < 0.22 && alive(c) ? 'urgent' : ''}`} onClick={() => select(c.id)}>
        {t && <span className="b-tag">{t}</span>}
        <span className="b-n">{c.kind === 'guess' ? '«Quello con…»' : c.group === 'asporto' ? <><Icon name="phone" size={14} /> {c.heard > 0 ? c.order.map((x) => x.name).join(' + ') : `${c.order.length} piatti`}</> : <>{catOf(c.dish.category).emoji} {c.dish.name}</>}</span>
        <span className="pbar"><i style={{ width: `${Math.max(0, f * 100)}%`, background: f > 0.5 ? '#6f9a6a' : f > 0.22 ? '#e3a83a' : '#c8463b' }} /></span>
      </button>
    );
  };

  // trascina un ingrediente dal bancone al piatto (il tocco semplice funziona sempre)
  const drag = useRef<{ ing: string; x0: number; y0: number; moved: boolean } | null>(null);
  const [ghost, setGhost] = useState<{ ing: string; x: number; y: number } | null>(null);
  const dragStart = (e: React.PointerEvent, ing: string) => {
    drag.current = { ing, x0: e.clientX, y0: e.clientY, moved: false };
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const dragMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    if (!d.moved && Math.hypot(e.clientX - d.x0, e.clientY - d.y0) > 12) d.moved = true;
    if (d.moved) setGhost({ ing: d.ing, x: e.clientX, y: e.clientY });
  };
  const dragEnd = (e: React.PointerEvent) => {
    const d = drag.current;
    drag.current = null;
    setGhost(null);
    if (!d) return;
    if (!d.moved) return tap(d.ing);
    const r = stageRef.current?.getBoundingClientRect();
    const c = gr.current.customers.find((x) => x.id === gr.current.selected);
    if (r && e.clientY < r.bottom && c && (isPortion(c.dish) || !c.plate.includes(d.ing))) tap(d.ing);
  };

  // ricerca scrivendo: in dispensa sempre, sugli altri banconi con la Mise en place; si svuota a ogni ingrediente
  const [q, setQ] = useState('');
  useEffect(() => setQ(''), [selected?.id, selected?.plate.length]);

  const moodOf = (c: Cust): Mood => (c.state === 'happy' ? 'happy' : c.state === 'angry' ? 'angry' : c.left / c.max > 0.5 ? 'idle' : c.left / c.max > 0.22 ? 'worried' : 'angry');

  if (g.phase === 'end') return <End g={g} title={title} total={total} start={startDaily.current} again={again} onExit={onExit} />;

  const ticket = selected;
  const counted = !!ticket && isPortion(ticket.dish);
  const plateItems = ticket?.kind === 'build' ? (counted ? piecesLabel(ticket.plate) : ticket.plate) : [];
  const tile = (t: string) => {
    const used = !counted && (t === BASE_TILE ? ['pomodoro', 'fior di latte'].every((b) => ticket?.plate.some((p) => norm(p) === b)) : ticket?.plate.includes(t));
    const n = counted ? ticket!.plate.filter((p) => p === t).length : 0;
    return (
      <button
        key={t}
        className={`itile ${used ? 'used' : ''} ${t === BASE_TILE ? 'base' : ''} ${ghost?.ing === t ? 'dragging' : ''} ${ticket?.oven?.includes(t) ? 'baked' : ''}`}
        onPointerDown={(e) => dragStart(e, t)}
        onPointerMove={dragMove}
        onPointerUp={dragEnd}
        onPointerCancel={() => { drag.current = null; setGhost(null); }}
        onClick={(e) => { if (e.detail === 0) tap(t); }}
      >
        <span className="t-e">{t === BASE_TILE ? <><Ing name="pomodoro" /><Ing name="fior di latte" /></> : <Ing name={t} />}</span>
        <span className="t-l">{t === BASE_TILE ? 'Base rossa' : cap(t)}</span>
        {n > 0 && <span className="t-n">×{n}</span>}
      </button>
    );
  };

  const showFull = ticket && ticket.kind === 'build' && (ticket.hint === 'full' || ticket.peeked || (ticket.hint === 'flash' && !ticket.hidden));
  const showCount = ticket && countShown(ticket);
  const night = Math.min(0.9, (Math.max(0, g.spawned - 1) / (total - 1)) * 0.9);
  const comboFill = g.fever ? FEVER_AT : Math.min(g.combo, FEVER_AT);
  const pizza = !!ticket && isPizza(ticket.dish.category);
  const panino = !!ticket && (ticket.dish.category === 'hamburger' || ticket.dish.category === 'focacce');
  const stationId = ticket ? stationOf(ticket.dish.category) : null;
  const custom = !!(stationId && app.save.station?.[stationId]);
  const search = ticket?.level === 'pantry' || L('mise') >= 1;
  const shelves = !custom && (ticket?.level === 'pantry' || L('mise') >= 2);
  const shownTray = ticket ? ticket.tray.filter((t) => !q || fold(t).includes(fold(q))) : [];
  const ringing = !!ticket && g.ring?.id === ticket.id;
  const baking = !!ticket && g.bake?.id === ticket.id;
  const canBet = ticket?.kind === 'build' && !studyOf(ticket) && !ticket.peeked;

  const ticketBody = () => {
    if (!ticket) return <span className="muted">Aspetta il prossimo cliente…</span>;
    if (ticket.kind === 'guess') return (
      <>
        <div className="t-top"><b>«Vorrei quello con…»</b><span className="mem">×{GUESS_MULT}</span></div>
        <div className="t-chips">{ticket.dish.ingredients.map((i) => <span key={i} className="mini"><Ing name={i} /> {cap(i)}</span>)}</div>
      </>
    );
    if (ticket.kind === 'gap' && ticket.gap) return (
      <>
        <div className="t-top"><b>{catOf(ticket.dish.category).emoji} {ticket.dish.name}</b><span className="mem">×1.5</span></div>
        <div className="sm"><b>{gapQuestion(ticket.dish, ticket.gap)}</b></div>
        <div className="t-chips">{ticket.dish.ingredients.map((i, k) => (k === ticket.gap!.idx ? <span key={k} className="mini gapq">?</span> : <span key={k} className="mini">{ticket.dish.ordered && <b className="num">{k + 1}</b>}<Ing name={i} /> {cap(i)}</span>))}</div>
      </>
    );
    if (ticket.kind === 'check' && ticket.check) return (
      <>
        <div className="t-top"><b><Icon name="eye" size={16} /> Il piatto di Giuseppe: {ticket.dish.name}</b><span className="mem">×2</span></div>
        <div className="muted sm">{ticket.check.fix ? `Cosa ci voleva al posto di ${ticket.check.wrong}?` : 'Prima che esca: c\'è un errore? Toccalo, oppure dai il via.'}</div>
      </>
    );
    const head = ticket.group === 'asporto'
      ? <b><Icon name="phone" size={16} /> Asporto · {ticket.parts - ticket.order.length + 1}/{ticket.parts}</b>
      : <b>{catOf(ticket.dish.category).emoji} {catOf(ticket.dish.category).short} {ticket.dish.name}{ticket.variant && <span className="variant"> · {variantText(ticket.variant)}</span>}</b>;
    return (
      <>
        <div className="t-top">
          {head}
          {ticket.tag === 'rivincita' && <span className="mem alt">Riscatto ×1.5</span>}
          {!ticket.peeked && ticket.hint !== 'full' && ticket.hint !== 'flash' && <span className="mem">×{MULT[ticket.hint]}</span>}
          {ticket.group === 'asporto' ? (ticket.heard <= 0 && <button className="peek" onClick={relisten}><Icon name="phone" size={14} /> Riascolta</button>) : !showFull && <button className="peek" onClick={peek}><Icon name="book" size={14} /> Aiuto</button>}
        </div>
        {ticket.group === 'tavolo' && ticket.queue.length > 0 && <div className="muted sm">Poi: <b>{ticket.queue.map((x) => x.name).join(', ')}</b></div>}
        {ticket.tag === 'gemello' && ticket.pair && <div className="muted sm"><Icon name="scale" size={14} /> Attento: è simile a <b>{ticket.pair}</b></div>}
        {ticket.group === 'asporto' ? (
          ticket.heard > 0
            ? <div className="flash-tip"><Icon name="phone" size={14} /> Memorizza la comanda: <b>{ticket.order.map((x) => x.name).join(' e ')}</b></div>
            : <div className="muted sm">Al telefono hanno chiesto {ticket.order.length} {ticket.order.length === 1 ? 'piatto' : 'piatti'}: ricordi quali? Preparane uno alla volta.</div>
        ) : showFull ? (
          <>
            {ticket.hint === 'flash' && !ticket.peeked && <div className="flash-tip"><Icon name="eye" size={14} /> Memorizza: sparisce al primo ingrediente</div>}
            <RecipeView dish={{ ...ticket.dish, ingredients: ticket.target }} mini />
          </>
        ) : ticket.hint === 'none' ? (
          <div className="muted sm">{ticket.level === 'pantry' ? 'Dispensa completa e nessun aiuto: sai cosa ci va?' : 'Nessun aiuto: ti fidi della tua memoria?'}</div>
        ) : (
          <div className="muted sm">{ticket.target.length} {counted ? (ticket.target.length === 1 ? 'tipo di pezzo' : 'tipi di pezzo') : ticket.target.length === 1 ? 'ingrediente' : 'ingredienti'} — ricordi quali?</div>
        )}
        {pizza && <div className="stage-tip">{ticket.oven ? <><Icon name="sparkle" size={14} /> All'uscita: aggiungi quello che va dopo il forno, poi servi</> : <><Icon name="flame" size={14} /> Prepara la pizza e infornala: quello che va all'uscita si mette dopo</>}</div>}
        {panino && ticket.dish.ordered && !ticket.variant && !showFull && <div className="stage-tip"><Icon name="layers" size={14} /> Montalo dal basso, come al banco</div>}
        {counted && <div className="stage-tip"><Icon name="plus" size={14} /> Metti i pezzi nel cestino uno alla volta</div>}
      </>
    );
  };

  const trayArea = () => {
    if (!ticket) return <div className="tray" />;
    if (ticket.kind === 'guess') return (
      <div className="gopts">
        {ticket.options.map((o) => <button key={o.id} className="gopt" onClick={() => answer(o)} disabled={ticket.state !== 'wait'}><DishPic dish={o} />{o.name}</button>)}
      </div>
    );
    if (ticket.kind === 'gap' && ticket.gap) return (
      <div className="gopts">
        {ticket.gap.options.map((o) => <button key={o} className="gopt" onClick={() => answerGap(o)} disabled={ticket.state !== 'wait'}><Ing name={o} />{cap(o)}</button>)}
      </div>
    );
    if (ticket.kind === 'check' && ticket.check) {
      const k = ticket.check;
      if (k.fix) return (
        <div className="gopts">
          {k.options.map((o) => <button key={o} className="gopt" onClick={() => answerCheck(o, true)} disabled={ticket.state !== 'wait'}><Ing name={o} />{cap(o)}</button>)}
        </div>
      );
      const group = (title: string | null, list: string[]) => (
        <div key={title ?? 'all'} className="check-g">
          {title && <div className="shelf-h">{title}</div>}
          <div className="check-row">
            {list.map((i, n) => <button key={i + n} className="itile" onClick={() => answerCheck(i)} disabled={ticket.state !== 'wait'}>{ticket.dish.ordered && <b className="num">{n + 1}</b>}<span className="t-e"><Ing name={i} /></span><span className="t-l">{cap(i)}</span></button>)}
          </div>
        </div>
      );
      return (
        <div className="tray check">
          {k.oven
            ? [group('In forno', k.oven), ...(k.shown.some((i) => !k.oven!.includes(i)) ? [group('All\'uscita', k.shown.filter((i) => !k.oven!.includes(i)))] : [])]
            : group(ticket.dish.ordered ? 'Dal basso' : null, k.shown)}
          <button className="btn good wide" onClick={() => answerCheck('ok')} disabled={ticket.state !== 'wait'}><Icon name="check" /> Va bene così, servilo</button>
        </div>
      );
    }
    const list = pizza && !counted ? [BASE_TILE, ...shownTray] : shownTray;
    return (
      <div className={`tray ${ticket.level === 'pantry' ? 'pantry' : ''} ${search ? 'searchable' : ''}`}>
        {search && (
          <label className="pantry-q">
            <Icon name="search" size={20} />
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={ticket.level === 'pantry' ? 'Cerca in dispensa…' : 'Cerca sul banco…'} autoComplete="off" autoCorrect="off" spellCheck={false} enterKeyHint="search" aria-label="Cerca un ingrediente" />
            {q && <button type="button" className="pantry-x" onClick={() => setQ('')} aria-label="Cancella la ricerca"><Icon name="x" size={18} /></button>}
          </label>
        )}
        {shelves ? (
          <>
            {pizza && !q && tile(BASE_TILE)}
            {SHELVES.map((sh) => {
              const l = shownTray.filter((t) => shelfOf(t) === sh);
              if (!l.length) return null;
              return [<div key={sh} className="shelf-h">{sh}</div>, ...l.map(tile)];
            })}
          </>
        ) : list.map(tile)}
        {q && !shownTray.length && <div className="shelf-h muted">Nessun ingrediente con «{q}»</div>}
      </div>
    );
  };

  const serveLabel = pizza && !ticket?.oven ? 'INFORNA' : panino ? 'CHIUDI IL PANINO' : 'SERVI';

  return (
    <div className={`game ${g.shake > 0 ? 'shake' : ''} ${g.fever ? 'is-fever' : ''}`}>
      <div className="hud">
        <button className="icon-btn" onClick={() => setPaused(true)}><Icon name="pause" /> Pausa</button>
        <div className="hearts">{Array.from({ length: g.maxLives }, (_, i) => <Heart key={i} on={i < g.lives} />)}</div>
        <div className="score" key={g.score}>{g.score}</div>
        <div className="coins" ref={coinRef}><Coin /> {g.coins}</div>
      </div>
      <div className="hud2">
        <span>{title} · {Math.min(g.spawned, total)}/{total}</span>
        <div className={`cmeter ${g.fever ? 'fever' : ''}`} aria-label={`Combo ${g.combo}`}>
          {g.fever ? <b><Icon name="flame" size={14} /> FEVER ×1.5</b> : <span className="cm-l">Combo</span>}
          {!g.fever && Array.from({ length: FEVER_AT }, (_, i) => <i key={i} className={i < comboFill ? 'on' : ''} />)}
        </div>
      </div>

      <div className={`stage ${use3d ? 'is3d' : ''}`} ref={stageRef}>
        {use3d ? (
          <Stage3D
            customers={g.customers.map((c) => ({
              id: c.id, look: c.look, slot: c.slot, state: c.state, vip: c.vip, mood: moodOf(c), impatient: c.state === 'wait' && c.left / c.max < 0.22, bubble: bubbleOf(c),
            }))}
            onSelect={select}
            plate={plateItems}
            cat={selected?.kind === 'build' ? selected.dish.category : null}
            onRemove={remove}
            build={app.save.build}
            night={night}
            skin={skin}
            chefPose={g.pose}
            fever={g.fever}
          />
        ) : (
          <>
            <div className="shop-top">
              <Scene build={app.save.build} night={night} />
              <Awning lights={L('luci')} />
              <Bunting rows={L('quadri')} />
              <div className={`neon lv${Math.min(L('insegna'), 5)}`}>CORE A CORE</div>
              <div className="slots">
                {[0, 1, 2].map((slot) => {
                  const c = g.customers.find((x) => x.slot === slot);
                  return (
                    <div className="slot" key={slot}>
                      {c && (
                        <div className={`cust st-${c.state}`} key={c.id}>
                          {bubbleOf(c)}
                          <div className="who"><Person look={c.look} mood={moodOf(c)} pose={c.state === 'happy' ? 'cheer' : 'idle'} crown={c.vip} /></div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="counter-bar" />
            </div>
            <div className="kitchen">
              <Kitchen forno={L('forno')} />
              <div className="chef"><Person look={CHEF_LOOK} chef={skin} pose={g.pose} mood={g.pose === 'cheer' ? 'happy' : g.pose === 'sad' ? 'worried' : 'idle'} /></div>
              <div className="plate-wrap">
                <div className="plate">
                  {plateItems.map((p, i) => (
                    <button key={p + i} className="pitem" onClick={() => remove(p)}><Ing name={p} /></button>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
        {baking && <div className="bake"><Icon name="flame" size={44} /><span>In forno…</span></div>}
        <div className="plate-ui">
          {ticket?.kind === 'guess' ? <span className="plate-q">Quale piatto è?</span> : ticket?.kind === 'gap' ? <span className="plate-q">Scegli qui sotto</span> : ticket?.kind === 'check' ? <span className="plate-q">Controlla qui sotto</span> : (
            <>
              {showCount && ticket && !counted && (
                <span className="plate-pips">
                  {ticket.target.map((_, i) => <i key={i} className={i < ticket.plate.length ? (ticket.plate.length > ticket.target.length ? 'over' : 'on') : ''} />)}
                </span>
              )}
              {!!ticket && !ticket.plate.length && <span className="plate-q">Tocca gli ingredienti</span>}
              {!!selected?.plate.length && selected.plate.length > (selected.oven?.length ?? 0) && <button className="trash" onClick={clearPlate} aria-label="Svuota il piatto"><Icon name="trash" /> Svuota</button>}
            </>
          )}
        </div>
        <div className="pops">
          {g.pops.map((p) => <span key={p.id} className={`pop ${p.kind}`} style={{ left: `${use3d ? [24, 50, 76][Math.round((p.x - 16.6) / 33.3)] : p.x}%` }}>{p.text}</span>)}
        </div>
      </div>

      <div className={`ticket ${ticket?.vip ? 'vip' : ''} ${ticket?.tag === 'nuovo' ? 'new' : ''}`}>{ticketBody()}</div>

      {trayArea()}
      {ticket?.kind === 'build' && (
        <div className="serve-row">
          {canBet && (
            <button className={`sure ${ticket.sure ? 'on' : ''}`} onClick={toggleSure} aria-pressed={ticket.sure} title="Punti ×2 se è giusto, -100 se è sbagliato">
              <Icon name="target" size={18} /> Sicuro! <small>×2</small>
            </button>
          )}
          <button className={`serve ${showCount && ticket.plate.length === ticket.target.length ? 'ready' : ''} ${ringing ? 'ringing' : ''}`} disabled={!selected || selected.state !== 'wait' || !selected.plate.length || baking} onClick={serve}>
            <Icon name={pizza && !ticket.oven ? 'flame' : 'bell'} size={22} /> {ringing ? 'Sta per suonare…' : serveLabel}
          </button>
        </div>
      )}

      {g.toast && <div className="toast" key={g.toast.text}><b>{g.toast.text}</b>{g.toast.sub && <span>{g.toast.sub}</span>}</div>}
      {ghost && <div className="drag-ghost" style={{ transform: `translate(${ghost.x}px, ${ghost.y}px)` }}>{ghost.ing === BASE_TILE ? <Ing name="pomodoro" /> : <Ing name={ghost.ing} />}</div>}
      {g.phase === 'intro' && g.howto && (
        <div className="intro">
          <div className="howto">
            <h3>Come si gioca</h3>
            <ol>
              <li><span>Arriva un cliente e chiede un piatto: lo vedi nel fumetto e nel foglietto</span></li>
              <li><span><b>Tocca gli ingredienti</b> giusti qui sotto per metterli sul piatto. I panini si montano <b>dal basso</b></span></li>
              <li><span>Le pizze prima si <b>infornano</b>, poi aggiungi quello che va all'uscita</span></li>
              <li><span>Quando il piatto è pronto premi <b>SERVI</b> (o <b>Chiudi il panino</b>)</span></li>
            </ol>
            <div className="muted">Un piatto nuovo lo prepari guardando la ricetta: <b>poco dopo torna</b> e dovrai ricordarlo. Non ricordi? Premi <b>Aiuto</b>, e il piatto tornerà ancora.</div>
            <button className="btn primary wide big" onClick={startShift}><Icon name="play" size={22} /> Ho capito, apri il locale!</button>
            <button className="btn ghost wide" onClick={onExit}>Torna indietro</button>
          </div>
        </div>
      )}
      {g.phase === 'intro' && !g.howto && (
        <div className="intro">
          <div className="intro-t" key={g.introLeft > 900 ? 'a' : 'b'}>{g.introLeft > 900 ? 'Si apre il locale!' : 'Via!'}</div>
          {g.introLeft > 900 && <div className="intro-s">Più la ricetta è a memoria, più guadagni</div>}
        </div>
      )}
      {g.paused && (
        <div className="modal">
          <div className="modal-in c">
            <h3>Pausa</h3>
            <button className="btn primary wide" onClick={() => setPaused(false)}>Riprendi</button>
            <button className="btn danger wide" onClick={onExit}>Esci dal turno</button>
          </div>
        </div>
      )}
      {g.card && !g.overlay && <NewCard dish={g.card} onClose={closeCard} />}
      {g.overlay && <FailSheet o={g.overlay} lives={g.lives} onClose={closeOverlay} />}
      {gesture && <GesturePad ing={gesture.ing} kind={gesture.kind} onCancel={() => setGesture(null)} onDone={() => { const i = gesture.ing; setGesture(null); place(i); }} />}
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import type { Dish, DishStat, MKind } from '../lib/types';
import { useApp } from '../store';
import { availableKinds, makeQuestion, norm, trayFor, whereIs } from '../lib/questions';
import { levelOf, pickWeighted, weight } from '../lib/mastery';
import { catOf } from '../lib/data';
import { cap } from '../lib/emoji';
import { Ing } from '../components/Ing';
import { burst, centerOf, confetti, flyCoins, sfx } from '../lib/fx';
import { SKINS } from '../lib/skins';
import { lvlOf } from '../lib/build';
import { CHEF_LOOK, Person, randomLook, type Look, type Mood, type Pose } from '../components/Person';
import { Chip, Pips, useCountUp } from '../components/ui';
import { CAT_ING, Coin, Heart, Icon } from '../components/Icon';
import { Stage3D } from '../three/Stage3D';
import { stageBus } from '../three/bus';
import { hasWebGL } from '../three/thumbs';
import { Awning, Bunting, Kitchen, Scene } from '../components/Scene';
import { currentDaily, missionById, progressOf, type Mission } from '../lib/missions';

/**
 * Aiuti che si ritirano man mano che il piatto entra in memoria:
 * full = ricetta visibile, flash = la vedi finché non metti il primo ingrediente,
 * icons = solo disegni, count = solo il numero, none = niente.
 */
type Hint = 'full' | 'flash' | 'icons' | 'count' | 'none';
const MULT: Record<Hint, number> = { full: 1, flash: 1.25, icons: 1.5, count: 2, none: 3 };
const GUESS_MULT = 1.5;
const TOTAL = 8;
const TICK = 100;
const FEVER_AT = 5;

interface Cust {
  id: number;
  look: Look;
  dish: Dish;
  kind: 'build' | 'guess';
  options: Dish[];
  hint: Hint;
  slot: number;
  left: number;
  max: number;
  plate: string[];
  tray: string[];
  peeked: boolean;
  /** aiuto "flash" già sparito */
  hidden: boolean;
  retry: boolean;
  vip: boolean;
  state: 'in' | 'wait' | 'happy' | 'angry';
  t: number; // ms nello stato corrente
}
interface Pop { id: number; text: string; kind: string; x: number; t: number }
interface Overlay { kind: 'wrong' | 'late' | 'guess'; dish: Dish; missing: string[]; extra: string[]; chosen?: Dish; notes: string[]; retry: boolean }
interface Tally { memory: number; revenge: number; guess: number; vip: number; tips: number }
interface G {
  phase: 'intro' | 'play' | 'end';
  customers: Cust[];
  spawned: number;
  nextSpawn: number;
  selected: number | null;
  score: number;
  coins: number;
  combo: number;
  bestCombo: number;
  fever: boolean;
  lives: number;
  maxLives: number;
  served: number;
  overlay: Overlay | null;
  paused: boolean;
  pops: Pop[];
  toast: { text: string; sub?: string; t: number } | null;
  pose: Pose;
  poseT: number;
  shake: number;
  missedDishes: Dish[];
  lastIds: string[];
  retries: { id: string; due: number }[];
  progress: Record<string, { name: string; from: number; to: number; held?: boolean }>;
  tally: Tally;
  uid: number;
  introLeft: number;
}

const hintFor = (s?: DishStat): Hint => {
  if (!s || !s.seen) return 'full';
  return s.box <= 0 ? 'flash' : s.box === 1 ? 'icons' : s.box <= 3 ? 'count' : 'none';
};

const initial = (maxLives: number): G => ({
  phase: 'intro', customers: [], spawned: 0, nextSpawn: 900, selected: null, score: 0, coins: 0, combo: 0, bestCombo: 0, fever: false,
  lives: maxLives, maxLives, served: 0, overlay: null, paused: false, pops: [], toast: null, pose: 'idle', poseT: 0, shake: 0,
  missedDishes: [], lastIds: [], retries: [], progress: {}, tally: { memory: 0, revenge: 0, guess: 0, vip: 0, tips: 0 }, uid: 1, introLeft: 2200,
});

const alive = (c: Cust) => c.state === 'in' || c.state === 'wait';

export function Game({ pool, title, onExit }: { pool: Dish[]; title: string; onExit: () => void }) {
  const [run, setRun] = useState(0);
  return <Shift key={run} pool={pool} title={title} onExit={onExit} again={() => setRun((r) => r + 1)} />;
}

function Shift({ pool, title, onExit, again }: { pool: Dish[]; title: string; onExit: () => void; again: () => void }) {
  const app = useApp();
  const appRef = useRef(app);
  appRef.current = app;
  const gr = useRef<G>(initial(3 + lvlOf(app.save.build, 'frigo')));
  const [g, setG] = useState<G>(gr.current);
  const serveRef = useRef<() => void>(() => {});
  const coinRef = useRef<HTMLDivElement>(null);
  const skin = SKINS.find((s) => s.id === app.save.skin) ?? SKINS[0];
  const L = (id: string) => lvlOf(app.save.build, id);

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

  const spawn = (g: G): G => {
    const taken = new Set(g.customers.map((c) => c.slot));
    const slot = [0, 1, 2].find((s) => !taken.has(s));
    if (slot === undefined) return g;
    const { stats, dishes, xp, build } = appRef.current.save;
    const now = Date.now();

    // la rivincita: il piatto sbagliato torna dopo un paio di clienti (richiamo a breve distanza)
    const due = g.retries.find((r) => r.due <= g.spawned && pool.some((d) => d.id === r.id));
    let dish = due ? pool.find((d) => d.id === due.id) : undefined;
    const retry = !!dish;
    if (!dish) {
      const onScreen = g.customers.filter(alive).map((c) => c.dish.id);
      let cands = pool.filter((d) => !g.lastIds.slice(-2).includes(d.id) && !onScreen.includes(d.id));
      if (!cands.length) cands = pool.filter((d) => !onScreen.includes(d.id));
      if (!cands.length) cands = pool;
      [dish] = pickWeighted(cands.map((d) => ({ item: d, w: weight(stats[d.id], now) })), 1);
    }
    const st = stats[dish.id];
    const box = st?.seen ? st.box : 0;
    // cliente indeciso: dice gli ingredienti, tu riconosci il piatto (richiamo nel verso opposto)
    const guess = !retry && box >= 2 && availableKinds(dish, dishes).includes('which') && Math.random() < 0.28;
    const vip = !retry && !guess && g.spawned >= 1 && Math.random() < 0.12;
    const hint: Hint = retry ? (box >= 4 ? 'none' : 'count') : hintFor(st);
    const diff = Math.max(0.55, 1 - (levelOf(xp) - 1) * 0.04);
    const baseT = guess ? 15 + dish.ingredients.length * 1.2 : 24 + dish.ingredients.length * 2.5 + (hint === 'full' || hint === 'flash' ? 8 : 0);
    const max = Math.round(baseT * 1000 * diff * (1 + 0.1 * lvlOf(build, 'forno')) * (vip ? 0.85 : 1));
    const q = guess ? makeQuestion(dish, dishes, 'which') : null;
    const c: Cust = {
      id: g.uid, look: randomLook(), dish, kind: guess ? 'guess' : 'build', options: q && q.kind === 'which' ? q.options : [], hint, slot,
      left: max, max, plate: [], tray: guess ? [] : trayFor(dish, dishes, st?.confused, 2 * lvlOf(build, 'mise')),
      peeked: false, hidden: false, retry, vip, state: 'in', t: 0,
    };
    return {
      ...g, uid: g.uid + 1, customers: [...g.customers, c], spawned: g.spawned + 1, lastIds: [...g.lastIds, dish.id],
      retries: due ? g.retries.filter((r) => r !== due) : g.retries,
      nextSpawn: Math.max(3500, 5500 + Math.random() * 3000 - g.spawned * 250),
    };
  };

  const track = (g: G, id: string, name: string, prevBox: number, box: number, held = false): G => ({
    ...g, progress: { ...g.progress, [id]: { name, from: g.progress[id]?.from ?? prevBox, to: box, held: held || g.progress[id]?.held } },
  });

  const fail = (g: G, c: Cust, kind: Overlay['kind'], missing: string[], extra: string[], chosen?: Dish): G => {
    const { dishes } = appRef.current.save;
    const severity = kind === 'wrong' && missing.length + extra.length > 1 ? 2 : 1;
    const r = appRef.current.record(c.dish.id, false, missing, 0, { extra, severity });
    sfx.bad();
    stageBus.emit({ type: 'fail', slot: c.slot });
    const notes: string[] = [];
    for (const x of extra) {
      const o = whereIs(x, c.dish, dishes);
      notes.push(o ? `${cap(x)} va nel ${o.name}, non qui` : `${cap(x)} non c'entra`);
    }
    const queue = !c.retry && g.spawned < TOTAL && !g.retries.some((x) => x.id === c.dish.id);
    const retries = queue ? [...g.retries, { id: c.dish.id, due: Math.min(g.spawned + 2, TOTAL - 1) }] : g.retries;
    let n: G = {
      ...g,
      lives: g.lives - 1, combo: 0, fever: false, shake: 450, pose: 'sad', poseT: 1200, retries,
      overlay: { kind, dish: c.dish, missing, extra, chosen, notes, retry: queue || g.retries.some((x) => x.id === c.dish.id) },
      missedDishes: g.missedDishes.some((d) => d.id === c.dish.id) ? g.missedDishes : [...g.missedDishes, c.dish],
      customers: g.customers.map((x) => (x.id === c.id ? { ...x, state: 'angry', t: 0 } : x)),
    };
    n = track(n, c.dish.id, c.dish.name, r.prevBox, r.box);
    return addPop(n, kind === 'late' ? 'Troppo tardi!' : 'Sbagliato!', 'bad', c.slot);
  };

  const success = (g0: G, c: Cust, mult: number, recCap?: number) => {
    const combo = g0.combo + 1;
    const fever = g0.fever || combo >= FEVER_AT;
    const frac = Math.max(0, c.left / c.max);
    const b = appRef.current.save.build;
    const pts = Math.round(
      (100 * mult * (1 + Math.min(combo - 1, 10) * 0.1) + frac * 60) * (1 + 0.05 * lvlOf(b, 'insegna')) * (fever ? 1.5 : 1) * (c.retry ? 1.5 : 1),
    );
    const coins = Math.max(1, Math.round((pts / 20) * (1 + 0.15 * lvlOf(b, 'cassa')))) * (c.vip ? 3 : 1);
    // mancia: ricompensa variabile per chi è veloce
    const tip = frac > 0.55 && Math.random() < 0.5 ? 1 + Math.floor(Math.random() * 5) : 0;
    let n: G = { ...g0 };
    if (c.peeked) appRef.current.addXp(3);
    else {
      const r = appRef.current.record(c.dish.id, true, [], Math.round(6 * mult), { cap: recCap });
      n = track(n, c.dish.id, c.dish.name, r.prevBox, r.box, r.held);
      if (r.leveledUp) {
        n = { ...n, toast: { text: `Livello ${r.level}!`, sub: 'Clienti più esigenti, mance più ricche', t: 1900 } };
        setTimeout(() => { sfx.level(); confetti(1.2); }, 350);
      }
    }
    const memory = !c.peeked && c.kind === 'build' && (c.hint === 'count' || c.hint === 'none');
    sfx.ok(combo);
    const el = custEl(c);
    const at = centerOf(el);
    if (at && !use3d) burst(at.x, at.y, c.vip || fever ? 1.6 : 1, c.vip ? ['#ffd24a', '#fff3b0', '#ffb300'] : undefined);
    stageBus.emit({ type: 'serve', slot: c.slot, items: c.kind === 'build' ? c.plate : c.dish.ingredients, cat: c.dish.category, coins: coins + tip, vip: c.vip });
    setTimeout(() => flyCoins(at, coinRef.current, coins + tip), 120);
    if (fever && !g0.fever) {
      sfx.fever();
      n = { ...n, toast: { text: 'FEVER!', sub: 'Punti ×1.5 finché non sbagli', t: 1600 } };
    }
    if (combo % 4 === 0) confetti(0.7);
    n = {
      ...n, score: n.score + pts, coins: n.coins + coins + tip, combo, fever, bestCombo: Math.max(n.bestCombo, combo), served: n.served + 1,
      pose: 'cheer', poseT: 900,
      tally: {
        memory: n.tally.memory + (memory ? 1 : 0), revenge: n.tally.revenge + (c.retry ? 1 : 0), guess: n.tally.guess + (c.kind === 'guess' ? 1 : 0),
        vip: n.tally.vip + (c.vip ? 1 : 0), tips: n.tally.tips + tip,
      },
      customers: n.customers.map((x) => (x.id === c.id ? { ...x, state: 'happy', t: 0 } : alive(x) ? { ...x, left: Math.min(x.max, x.left + 1500 * lvlOf(b, 'cronometro')) } : x)),
    };
    n = addPop(n, `+${pts}`, 'gain', c.slot);
    const hype = c.vip ? `VIP +${coins}` : c.retry ? 'Riscatto!' : c.kind === 'guess' ? 'Indovinato!' : memory && c.hint === 'none' ? 'A memoria!' : frac > 0.6 ? 'Veloce!' : 'Perfetto!';
    n = addPop(n, hype, c.vip ? 'vip' : 'hype', c.slot);
    if (tip) n = addPop(n, `+${tip} mancia`, 'tip', c.slot);
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
      g = { ...g, introLeft: g.introLeft - dt };
      if (g.introLeft <= 0) g = { ...g, phase: 'play' };
      return commit(g);
    }
    if (g.paused || g.overlay) return commit(g);

    g = { ...g, nextSpawn: g.nextSpawn - dt };
    let timedOut: Cust | null = null;
    const customers: Cust[] = [];
    const garz = lvlOf(appRef.current.save.build, 'garzone');
    for (const c of g.customers) {
      const n = { ...c, t: c.t + dt };
      const slow = c.id === g.selected ? 1 : 1 - 0.15 * garz;
      if (n.state === 'in') {
        n.left -= dt * slow;
        if (n.t >= 750) { n.state = 'wait'; n.t = 0; }
      } else if (n.state === 'wait') {
        n.left -= dt * slow;
        if (n.left <= 0 && !timedOut) timedOut = n;
      } else if (n.t >= 950) continue;
      customers.push(n);
    }
    g = { ...g, customers };
    const active = customers.filter(alive);
    if (g.spawned < TOTAL && g.nextSpawn <= 0 && customers.length < 3) g = spawn(g);
    else if (g.spawned < TOTAL && !active.length && g.nextSpawn > 700) g = { ...g, nextSpawn: 700 };
    if (timedOut) g = fail(g, timedOut, 'late', [], []);
    const sel = g.customers.find((c) => c.id === g.selected && alive(c));
    if (!sel) {
      const a = g.customers.filter(alive).sort((x, y) => x.left - y.left)[0];
      g = { ...g, selected: a ? a.id : null };
    }
    if (!g.overlay && (g.lives <= 0 || (g.spawned >= TOTAL && g.customers.length === 0))) g = { ...g, phase: 'end' };
    commit(g);
  };

  useEffect(() => {
    const t = setInterval(tick, TICK);
    return () => clearInterval(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const selected = g.customers.find((c) => c.id === g.selected && alive(c));

  const toggle = (ing: string) => {
    const g0 = gr.current;
    const c = g0.customers.find((x) => x.id === g0.selected);
    if (!c || c.kind !== 'build' || g0.overlay || g0.paused || g0.phase !== 'play' || !alive(c)) return;
    const has = c.plate.includes(ing);
    const plate = has ? c.plate.filter((x) => x !== ing) : [...c.plate, ing];
    if (has) sfx.tap();
    else sfx.place(plate.length);
    commit({ ...g0, pose: 'work', poseT: 350, customers: g0.customers.map((x) => (x.id === c.id ? { ...x, plate, hidden: x.hidden || plate.length > 0 } : x)) });
    if (lvlOf(appRef.current.save.build, 'campanello') > 0 && plate.length === c.dish.ingredients.length && c.dish.ingredients.every((i) => plate.map(norm).includes(norm(i)))) {
      setTimeout(() => serveRef.current(), 220);
    }
  };

  const clearPlate = () => {
    const g0 = gr.current;
    if (!g0.selected) return;
    sfx.tap();
    commit({ ...g0, customers: g0.customers.map((x) => (x.id === g0.selected ? { ...x, plate: [] } : x)) });
  };

  const peek = () => {
    const g0 = gr.current;
    sfx.tap();
    commit({ ...g0, customers: g0.customers.map((x) => (x.id === g0.selected ? { ...x, peeked: true } : x)) });
  };

  const select = (id: number) => {
    const g0 = gr.current;
    if (g0.overlay || g0.paused) return;
    sfx.tap();
    commit({ ...g0, selected: id });
  };

  const serve = () => {
    const g0 = gr.current;
    const c = g0.customers.find((x) => x.id === g0.selected);
    if (!c || c.kind !== 'build' || c.state !== 'wait' || !c.plate.length || g0.overlay || g0.paused) return;
    const want = c.dish.ingredients.map(norm);
    const got = c.plate.map(norm);
    const missing = c.dish.ingredients.filter((i) => !got.includes(norm(i)));
    const extra = c.plate.filter((i) => !want.includes(norm(i)));
    if (missing.length || extra.length) return commit(fail(g0, c, 'wrong', missing, extra));
    success(g0, c, c.peeked ? 1 : MULT[c.hint]);
  };
  serveRef.current = serve;

  const answer = (opt: Dish) => {
    const g0 = gr.current;
    const c = g0.customers.find((x) => x.id === g0.selected);
    if (!c || c.kind !== 'guess' || c.state !== 'wait' || g0.overlay || g0.paused) return;
    if (opt.id !== c.dish.id) return commit(fail(g0, c, 'guess', [], [], opt));
    // riconoscere è più facile che ricordare: non porta il piatto oltre la scatola 3
    success(g0, c, GUESS_MULT, 3);
  };

  const closeOverlay = () => {
    sfx.tap();
    commit({ ...gr.current, overlay: null });
  };
  const setPaused = (p: boolean) => commit({ ...gr.current, paused: p });

  const bubbleOf = (c: Cust) => {
    const f = c.left / c.max;
    return (
      <button data-cust={c.id} className={`bubble ${selected?.id === c.id ? 'sel' : ''} ${c.vip ? 'vip' : ''} ${c.retry ? 'retry' : ''} ${f < 0.22 && alive(c) ? 'urgent' : ''}`} onClick={() => select(c.id)}>
        {(c.vip || c.retry || c.kind === 'guess') && <span className="b-tag">{c.vip ? 'VIP ×3' : c.retry ? 'Rivincita' : 'Indeciso'}</span>}
        <span className="b-n">{c.kind === 'guess' ? '«Quello con…»' : c.dish.name}</span>
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
    if (!d.moved) return toggle(d.ing);
    const r = stageRef.current?.getBoundingClientRect();
    const c = gr.current.customers.find((x) => x.id === gr.current.selected);
    if (r && e.clientY < r.bottom && c && !c.plate.includes(d.ing)) toggle(d.ing);
  };

  const moodOf = (c: Cust): Mood => (c.state === 'happy' ? 'happy' : c.state === 'angry' ? 'angry' : c.left / c.max > 0.5 ? 'idle' : c.left / c.max > 0.22 ? 'worried' : 'angry');

  if (g.phase === 'end') return <End g={g} title={title} again={again} onExit={onExit} />;

  const ticket = selected;
  const showFull = ticket && ticket.kind === 'build' && (ticket.hint === 'full' || ticket.peeked || (ticket.hint === 'flash' && !ticket.hidden));
  const showCount = ticket && ticket.kind === 'build' && (ticket.hint !== 'none' || ticket.peeked);
  const night = Math.min(0.9, (Math.max(0, g.spawned - 1) / (TOTAL - 1)) * 0.9);
  const comboFill = g.fever ? FEVER_AT : Math.min(g.combo, FEVER_AT);

  return (
    <div className={`game ${g.shake > 0 ? 'shake' : ''} ${g.fever ? 'is-fever' : ''}`}>
      <div className="hud">
        <button className="icon-btn" onClick={() => setPaused(true)} aria-label="Pausa"><Icon name="pause" /></button>
        <div className="hearts">{Array.from({ length: g.maxLives }, (_, i) => <Heart key={i} on={i < g.lives} />)}</div>
        <div className="score" key={g.score}>{g.score}</div>
        <div className="coins" ref={coinRef}><Coin /> {g.coins}</div>
      </div>
      <div className="hud2">
        <span>{title} · {Math.min(g.spawned, TOTAL)}/{TOTAL}</span>
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
            plate={selected?.kind === 'build' ? selected.plate : []}
            cat={selected?.kind === 'build' ? selected.dish.category : null}
            onRemove={toggle}
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
                  {selected?.kind === 'build' && selected.plate.map((p) => (
                    <button key={p} className="pitem" onClick={() => toggle(p)}><Ing name={p} /></button>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
        <div className="plate-ui">
          {ticket?.kind === 'guess' ? <span className="plate-q">Quale piatto è?</span> : (
            <>
              {showCount && ticket && (
                <span className="plate-pips">
                  {ticket.dish.ingredients.map((_, i) => <i key={i} className={i < ticket.plate.length ? (ticket.plate.length > ticket.dish.ingredients.length ? 'over' : 'on') : ''} />)}
                </span>
              )}
              {!!ticket && !ticket.plate.length && <span className="plate-q">Trascina o tocca gli ingredienti</span>}
              <button className="trash" onClick={clearPlate} disabled={!selected?.plate.length} aria-label="Svuota il piatto"><Icon name="trash" /></button>
            </>
          )}
        </div>
        <div className="pops">
          {g.pops.map((p) => <span key={p.id} className={`pop ${p.kind}`} style={{ left: `${use3d ? [24, 50, 76][Math.round((p.x - 16.6) / 33.3)] : p.x}%` }}>{p.text}</span>)}
        </div>
      </div>

      <div className={`ticket ${ticket?.vip ? 'vip' : ''}`}>
        {!ticket ? (
          <span className="muted">Aspetta il prossimo cliente…</span>
        ) : ticket.kind === 'guess' ? (
          <>
            <div className="t-top"><b>«Vorrei quello con…»</b><span className="mem">×{GUESS_MULT}</span></div>
            <div className="t-chips">{ticket.dish.ingredients.map((i) => <span key={i} className="mini"><Ing name={i} /> {cap(i)}</span>)}</div>
          </>
        ) : (
          <>
            <div className="t-top">
              <b>{ticket.dish.name}</b>
              {ticket.retry && <span className="mem alt">Riscatto ×1.5</span>}
              {!ticket.peeked && ticket.hint !== 'full' && <span className="mem">×{MULT[ticket.hint]}</span>}
              {!showFull && <button className="peek" onClick={peek}><Icon name="book" size={14} /> Aiuto</button>}
            </div>
            {showFull ? (
              <>
                {ticket.hint === 'flash' && !ticket.peeked && <div className="flash-tip"><Icon name="eye" size={14} /> Memorizza: sparisce al primo ingrediente</div>}
                <div className="t-chips">{ticket.dish.ingredients.map((i) => <span key={i} className="mini"><Ing name={i} /> {cap(i)}</span>)}</div>
              </>
            ) : ticket.hint === 'icons' ? (
              <div className="t-chips">{ticket.dish.ingredients.map((i, k) => <span key={k} className="mini"><Ing name={i} /></span>)}<span className="muted sm">({ticket.dish.ingredients.length})</span></div>
            ) : ticket.hint === 'none' ? (
              <div className="muted sm">Nessun aiuto: ti fidi della tua memoria?</div>
            ) : (
              <div className="muted sm">{ticket.dish.ingredients.length} {ticket.dish.ingredients.length === 1 ? 'ingrediente' : 'ingredienti'} — ricordi quali?</div>
            )}
          </>
        )}
      </div>

      {ticket?.kind === 'guess' ? (
        <div className="gopts">
          {ticket.options.map((o) => (
            <button key={o.id} className="gopt" onClick={() => answer(o)} disabled={ticket.state !== 'wait'}>
              <Ing name={CAT_ING[o.category]} />{o.name}
            </button>
          ))}
        </div>
      ) : (
        <div className="tray">
          {(selected?.tray ?? []).map((t) => (
            <button
              key={t}
              className={`itile ${selected?.plate.includes(t) ? 'used' : ''} ${ghost?.ing === t ? 'dragging' : ''}`}
              onPointerDown={(e) => dragStart(e, t)}
              onPointerMove={dragMove}
              onPointerUp={dragEnd}
              onPointerCancel={() => { drag.current = null; setGhost(null); }}
              onClick={(e) => { if (e.detail === 0) toggle(t); }}
            >
              <span className="t-e"><Ing name={t} /></span>
              <span className="t-l">{cap(t)}</span>
            </button>
          ))}
        </div>
      )}
      {ticket?.kind !== 'guess' && (
        <button className={`serve ${showCount && ticket && ticket.plate.length === ticket.dish.ingredients.length ? 'ready' : ''}`} disabled={!selected || selected.state !== 'wait' || !selected.plate.length} onClick={serve}><Icon name="bell" size={22} /> SERVI</button>
      )}

      {g.toast && <div className="toast" key={g.toast.text}><b>{g.toast.text}</b>{g.toast.sub && <span>{g.toast.sub}</span>}</div>}
      {ghost && <div className="drag-ghost" style={{ transform: `translate(${ghost.x}px, ${ghost.y}px)` }}><Ing name={ghost.ing} /></div>}
      {g.phase === 'intro' && (
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
      {g.overlay && <FailSheet o={g.overlay} lives={g.lives} onClose={closeOverlay} />}
    </div>
  );
}

function FailSheet({ o, lives, onClose }: { o: Overlay; lives: number; onClose: () => void }) {
  const title = o.kind === 'late' ? 'Il cliente se n\'è andato' : o.kind === 'guess' ? 'Non era quello!' : 'Piatto sbagliato';
  return (
    <div className="modal">
      <div className="modal-in fail">
        <h3>{title}</h3>
        {o.chosen && (
          <div className="cmp">
            <div className="muted sm">Hai scelto <b>{o.chosen.name}</b>:</div>
            <div className="chips">{o.chosen.ingredients.map((i) => <Chip key={i} text={i} state={o.dish.ingredients.map(norm).includes(norm(i)) ? '' : 'bad'} />)}</div>
          </div>
        )}
        <div className="muted">{o.chosen ? 'Era' : 'La ricetta di'} <b>{o.dish.name}</b>:</div>
        <div className="chips">
          {o.dish.ingredients.map((i) => <Chip key={i} text={i} state={o.missing.includes(i) ? 'miss' : 'ok'} />)}
        </div>
        {o.missing.length > 0 && <div className="sm">Ti mancava: <b>{o.missing.map(cap).join(', ')}</b></div>}
        {o.extra.length > 0 && <div className="sm">Di troppo: <b>{o.extra.map(cap).join(', ')}</b></div>}
        {o.notes.map((n) => <div key={n} className="note"><Icon name="bulb" size={16} /><span>{n}</span></div>)}
        {o.retry && <div className="note retry"><Icon name="refresh" size={16} /><span>Tra poco questo piatto torna: è la tua <b>rivincita</b> (punti ×1.5)</span></div>}
        <div className="sm muted">Ti rimangono {Math.max(0, lives)} vite</div>
        <button className="btn primary wide" onClick={onClose}>Ho capito</button>
      </div>
    </div>
  );
}

function End({ g, title, again, onExit }: { g: G; title: string; again: () => void; onExit: () => void }) {
  const app = useApp();
  const failed = g.lives <= 0;
  const stars = g.served >= TOTAL && g.lives === g.maxLives ? 3 : g.served >= TOTAL * 0.75 ? 2 : g.served >= TOTAL * 0.4 ? 1 : 0;
  const bonusCoins = stars * 25;
  const [best, setBest] = useState(false);
  const [done, setDone] = useState<Mission[]>([]);
  const startLvl = useRef(levelOf(app.save.xp));
  const reported = useRef(false);
  const score = useCountUp(g.score, 1100, 250 + stars * 280);
  const coins = useCountUp(g.coins + bonusCoins, 900, 600 + stars * 280);

  useEffect(() => {
    if (reported.current) return;
    reported.current = true;
    const a = app;
    const before = currentDaily(a.save);
    setBest(a.reportShift(g.score, g.coins + bonusCoins, g.bestCombo) && g.score > 0);
    a.addXp(Math.round(g.score / 10));
    const ev: Partial<Record<MKind, number>> = {
      serve: g.served, memory: g.tally.memory, combo: g.bestCombo, shifts: 1, stars3: stars === 3 ? 1 : 0, revenge: g.tally.revenge, guess: g.tally.guess, vip: g.tally.vip,
    };
    a.track(ev);
    const newly = before.ids
      .map(missionById)
      .filter((m): m is Mission => !!m && progressOf(before, m) < m.goal && Math.min(m.goal, (m.kind === 'combo' ? Math.max(before.prog.combo ?? 0, ev.combo ?? 0) : (before.prog[m.kind] ?? 0) + (ev[m.kind] ?? 0))) >= m.goal);
    setDone(newly);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const timers = Array.from({ length: stars }, (_, i) => setTimeout(() => sfx.star(i), 250 + i * 280));
    if (!failed && stars >= 2) timers.push(setTimeout(() => { confetti(stars === 3 ? 1.6 : 1); sfx.win(); }, 300 + stars * 280));
    else if (failed) timers.push(setTimeout(() => sfx.bad(), 200));
    return () => timers.forEach(clearTimeout);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const prog = Object.entries(g.progress).sort((a, b) => b[1].to - b[1].from - (a[1].to - a[1].from));
  const lvl = levelOf(app.save.xp);
  return (
    <div className="screen over">
      <div className={`over-icon ${failed ? 'bad' : ''}`}><Icon name={failed ? 'sad' : stars === 3 ? 'trophy' : 'smile'} size={56} /></div>
      <h1>{failed ? 'Il locale è nel caos!' : 'Turno finito!'}</h1>
      {(failed || title !== 'Turno') && <div className="muted sm">{failed ? 'Niente panico: ogni errore di oggi è un ricordo più forte domani.' : title}</div>}
      <div className="stars">{[0, 1, 2].map((i) => <span key={i} className={i < stars ? 'on' : ''} style={{ animationDelay: `${250 + i * 280}ms` }}>★</span>)}</div>
      <div className="bigscore">{score}</div>
      {best && <div className="levelup">Nuovo record!</div>}
      {lvl > startLvl.current && <div className="levelup">Livello {lvl}!</div>}
      <div className="stat-row">
        <div className="stat"><b>{g.served}/{TOTAL}</b><span>Serviti</span></div>
        <div className="stat"><b>x{g.bestCombo}</b><span>Combo</span></div>
        <div className="stat"><b><Coin size={20} /> {coins}</b><span>{stars ? `+${bonusCoins} stelle` : 'Monete'}{g.tally.tips ? ` · ${g.tally.tips} mance` : ''}</span></div>
      </div>
      {done.map((m) => (
        <div key={m.id} className="mission-done"><Icon name="gift" /> <span>Missione completata: <b>{m.text}</b>. Ritira {m.reward} monete in home!</span></div>
      ))}
      {prog.length > 0 && (
        <div className="card">
          <div className="card-h">La tua memoria</div>
          {prog.some(([, p]) => p.held && p.to === p.from) && <div className="muted sm">⏳ = già fissato per oggi: torna domani e salirà ancora (il cervello consolida dormendo)</div>}
          {prog.map(([id, p]) => (
            <div key={id} className="mem-row">
              <span>{p.name}</span>
              <Pips box={p.to} from={p.from} />
              <b className={p.to > p.from ? 'up' : p.to < p.from ? 'down' : ''}>{p.to > p.from ? `+${p.to - p.from}` : p.to < p.from ? `${p.to - p.from}` : p.held ? '⏳' : '='}</b>
            </div>
          ))}
        </div>
      )}
      {g.missedDishes.length > 0 && (
        <div className="card">
          <div className="card-h">Da ripassare</div>
          {g.missedDishes.map((d) => (
            <div key={d.id} className="miss-row">
              <b>{d.name}</b>
              <div className="chips">{d.ingredients.map((i) => <Chip key={i} text={i} />)}</div>
            </div>
          ))}
        </div>
      )}
      <div className="spacer" />
      <button className="btn primary wide big" onClick={again}>▶ Altro turno</button>
      <button className="btn ghost wide" onClick={onExit}>Torna alla home</button>
    </div>
  );
}

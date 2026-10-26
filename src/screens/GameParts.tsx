import { useEffect, useRef, useState } from 'react';
import type { Daily, Dish, MKind } from '../lib/types';
import type { Verdict } from '../lib/plate';
import type { Check, Gap, Variant } from '../lib/orders';
import type { TrayLevel } from '../lib/questions';
import { norm } from '../lib/questions';
import { useApp } from '../store';
import { PHASES, levelOf } from '../lib/mastery';
import { unlocksAt } from '../lib/levels';
import { catOf } from '../lib/data';
import { cap } from '../lib/emoji';
import { DishPic, Ing } from '../components/Ing';
import { Bar, Chip, Pips, useCountUp } from '../components/ui';
import { Coin, Icon } from '../components/Icon';
import { Photo, RecipeView, Why } from '../components/Recipe';
import { DishViewer } from '../three/DishViewer';
import { hasWebGL } from '../three/thumbs';
import { centerOf, confetti, flyCoins, sfx } from '../lib/fx';
import { dealOf, goalOf, lvlOf } from '../lib/build';
import { today } from '../lib/missions';
import { UPGRADE_ICON } from '../components/Icon';
import { currentDaily, missionById, progressOf, type Mission } from '../lib/missions';
import type { Look } from '../components/Person';

/**
 * Aiuti per la fase del piatto: full = ricetta visibile (piatto nuovo, è studio), flash = la vedi finché non metti
 * il primo ingrediente (studio), count = solo il numero, none = niente.
 */
export type Hint = 'full' | 'flash' | 'count' | 'none';
export type CKind = 'build' | 'guess' | 'gap' | 'check';
/** perché è arrivato questo cliente: piatto nuovo, richiamo programmato, rivincita, piatto simile da distinguere */
export type Tag = 'nuovo' | 'richiamo' | 'rivincita' | 'gemello' | null;

export interface Cust {
  id: number;
  look: Look;
  slot: number;
  left: number;
  max: number;
  state: 'in' | 'wait' | 'happy' | 'angry';
  t: number;
  kind: CKind;
  dish: Dish;
  /** tavolo da due: i piatti ancora da preparare dopo questo */
  queue: Dish[];
  group: 'tavolo' | 'asporto' | null;
  parts: number;
  part: number;
  /** asporto: i piatti della comanda ancora da preparare, e per quanti ms si vedono ancora i nomi */
  order: Dish[];
  heard: number;
  relisten: boolean;
  variant: Variant | null;
  /** gli ingredienti attesi (il piatto, con la variante) */
  target: string[];
  hint: Hint;
  phase: number;
  level: TrayLevel;
  tray: string[];
  plate: string[];
  /** pizze: cosa è andato in forno (null = non ancora infornata) */
  oven: string[] | null;
  peeked: boolean;
  /** aiuto "flash" già sparito */
  hidden: boolean;
  /** ingredienti tolti e rimessi: una risposta con correzioni vale "difficile" */
  fixes: number;
  /** ms passati a lavorarci */
  work: number;
  sure: boolean;
  tag: Tag;
  pair?: string;
  vip: boolean;
  /** il critico gastronomico (locale da 3 stelle): ordina un piatto che sai già */
  critic?: boolean;
  /** piatto nuovo arrivato mentre ne preparavi un altro: la scheda si apre quando lo scegli */
  cardDue?: boolean;
  options: Dish[];
  gap: Gap | null;
  check: (Check & { fix: boolean }) | null;
}

export interface Overlay {
  kind: 'wrong' | 'late' | 'guess' | 'check';
  dish: Dish;
  target: string[];
  verdict: Verdict | null;
  chosen?: Dish;
  notes: string[];
  retry: boolean;
  sure: boolean;
}
export interface Trophy { kind: 'mem' | 'gold' | 'recovered' | 'critic'; dish: Dish }
export interface Tally { memory: number; revenge: number; guess: number; vip: number; tips: number; order: number; cats: string[] }
export interface Ret { id: string; due: number; tag: 'richiamo' | 'rivincita' | 'gemello'; pair?: string }
export interface Pop { id: number; text: string; kind: string; x: number; t: number }

export interface G {
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
  pose: 'idle' | 'work' | 'cheer' | 'sad';
  poseT: number;
  shake: number;
  missedDishes: Dish[];
  lastIds: string[];
  returns: Ret[];
  finals: string[];
  twins: string[];
  newCount: number;
  /** difficoltà automatica: -1 un aiuto in più, +1 un aiuto in meno */
  ease: number;
  recent: number[];
  /** campanello che sta per suonare, pizza che sta cuocendo */
  ring: { id: number; t: number } | null;
  bake: { id: number; t: number } | null;
  /** cartolina del piatto nuovo */
  card: Dish | null;
  trophies: Trophy[];
  progress: Record<string, { name: string; from: number; to: number; held?: boolean }>;
  tally: Tally;
  uid: number;
  introLeft: number;
  howto: boolean;
  /** il critico è già passato in questo turno */
  critic: boolean;
}

/** il "Quasi!" quando sbagli di poco */
const almost = (v: Verdict | null) => !!v && v.total >= 3 && v.right >= v.total - 1 && v.extra.length <= 1;

export function FailSheet({ o, lives, onClose }: { o: Overlay; lives: number; onClose: () => void }) {
  const v = o.verdict;
  const title =
    o.kind === 'late' ? 'Il cliente se n\'è andato' : o.kind === 'guess' ? 'Non era quello!' : o.kind === 'check' ? 'Giuseppe l\'ha scampata…' : almost(v) ? `Quasi! ${v!.right} su ${v!.total}` : 'Piatto sbagliato';
  const shown = { ...o.dish, ingredients: o.target, after: o.dish.after };
  return (
    <div className="modal">
      <div className="modal-in fail">
        <div className="fail-h"><DishPic dish={o.dish} /><h3>{title}</h3></div>
        <Photo id={o.dish.id} className="sm" />
        {o.chosen && (
          <div className="cmp">
            <div className="muted sm">Hai scelto <b>{o.chosen.name}</b>:</div>
            <div className="chips">{o.chosen.ingredients.map((i) => <Chip key={i} text={i} state={o.dish.ingredients.map(norm).includes(norm(i)) ? '' : 'bad'} />)}</div>
          </div>
        )}
        <div className="muted">{o.chosen ? 'Era' : 'La ricetta di'} <b>{o.dish.name}</b>:</div>
        <RecipeView dish={shown} state={(i) => (v?.missing.includes(i) ? 'miss' : 'ok')} />
        {v && v.missing.length > 0 && <div className="sm">Ti mancava: <b>{v.missing.map(cap).join(', ')}</b></div>}
        {v && v.extra.length > 0 && <div className="sm">Di troppo: <b>{v.extra.map(cap).join(', ')}</b></div>}
        {o.notes.map((n) => <div key={n} className="note"><Icon name="bulb" size={16} /><span>{n}</span></div>)}
        <Why dish={o.dish} />
        {o.sure && <div className="note sure"><Icon name="target" size={16} /><span>Eri sicuro: proprio per questo è l'errore che ricorderai meglio. Guarda bene la ricetta.</span></div>}
        {o.retry && <div className="note retry"><Icon name="refresh" size={16} /><span>Tra poco questo piatto torna: è la tua <b>rivincita</b> (punti ×1.5)</span></div>}
        <div className="sm muted">Ti rimangono {Math.max(0, lives)} vite</div>
        <button className="btn primary wide" onClick={onClose}>Ho capito</button>
      </div>
    </div>
  );
}

/** cartolina del piatto nuovo: lo guardi bene una volta, e tra due clienti torna da ricordare */
export function NewCard({ dish, onClose }: { dish: Dish; onClose: () => void }) {
  const c = catOf(dish.category);
  return (
    <div className="modal">
      <div className="modal-in new-card" style={{ ['--cat' as string]: c.color }}>
        <div className="nc-tag"><Icon name="sparkle" size={16} /> Nuovo piatto!</div>
        <div className="nc-pic">{hasWebGL() ? <DishViewer items={dish.ingredients} cat={dish.category} /> : <DishPic dish={dish} />}</div>
        <h3>{c.short} {dish.name}</h3>
        <Photo id={dish.id} className="sm" />
        <RecipeView dish={dish} />
        <Why dish={dish} />
        <div className="muted sm">Preparalo guardando la ricetta. <b>Tra due clienti torna</b>, e lì dovrai ricordarlo: è il primo passo per saperlo a memoria.</div>
        <button className="btn primary wide big" onClick={onClose}><Icon name="play" size={20} /> Preparalo!</button>
      </div>
    </div>
  );
}

/** gesti facoltativi: spalmare con un giro del dito, spolverare con tre tocchi */
export function GesturePad({ ing, kind, onDone, onCancel }: { ing: string; kind: 'spread' | 'sprinkle'; onDone: () => void; onCancel: () => void }) {
  const [prog, setProg] = useState(0);
  const pad = useRef<HTMLDivElement>(null);
  const st = useRef<{ a: number | null; sum: number }>({ a: null, sum: 0 });
  const total = useRef(0);
  const add = (k: number) => {
    if (total.current >= 1) return;
    total.current = Math.min(1, total.current + k);
    setProg(total.current);
    if (total.current >= 1) setTimeout(onDone, 120);
  };
  const move = (e: React.PointerEvent) => {
    if (kind !== 'spread' || !pad.current || e.buttons === 0) return;
    const r = pad.current.getBoundingClientRect();
    const a = Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2));
    const s = st.current;
    if (s.a !== null) {
      let d = a - s.a;
      if (d > Math.PI) d -= Math.PI * 2;
      if (d < -Math.PI) d += Math.PI * 2;
      add(Math.abs(d) / (Math.PI * 1.6));
    }
    s.a = a;
  };
  return (
    <div className="modal" onClick={onCancel}>
      <div className="modal-in gesture" onClick={(e) => e.stopPropagation()}>
        <h3>{kind === 'spread' ? 'Spalma' : 'Spolvera'}: {cap(ing)}</h3>
        <div
          ref={pad}
          className={`g-pad ${kind}`}
          onPointerDown={(e) => { st.current.a = null; (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId); if (kind === 'sprinkle') { sfx.place(Math.round(prog * 3) + 1); add(0.34); } }}
          onPointerMove={move}
          onPointerUp={() => { st.current.a = null; }}
        >
          <div className="g-fill" style={{ ['--p' as string]: prog }} />
          <span className="g-ing"><Ing name={ing} /></span>
        </div>
        <div className="muted sm c">{kind === 'spread' ? 'Fai un giro col dito sulla pizza, come col mestolo' : 'Tocca tre volte, come quando spolveri'}</div>
        <div className="modal-btns">
          <button className="btn ghost" onClick={onCancel}>Annulla</button>
          <button className="btn primary" onClick={onDone}>Mettilo e basta</button>
        </div>
      </div>
    </div>
  );
}

/** a fine turno le monete guadagnate volano nella barra del prossimo acquisto: vedi a cosa servono */
function EndGoal({ before, delay }: { before: number; delay: number }) {
  const { save } = useApp();
  const goal = goalOf(save.build, save.goal, dealOf(today(), save.build, save.dealUsed));
  const [filled, setFilled] = useState(false);
  const bar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const t = setTimeout(() => {
      flyCoins(centerOf(document.querySelector('.end-coins')), bar.current, 8);
      setTimeout(() => setFilled(true), 500);
    }, delay);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  if (!goal || save.coins <= before) return null;
  const { u, cost } = goal;
  const now = filled ? save.coins : before;
  const ready = filled && save.coins >= cost;
  return (
    <div className={`card goal-card end-goal ${ready ? 'ready' : ''}`}>
      <span className="up-e"><Icon name={UPGRADE_ICON[u.id]} size={22} /></span>
      <span className="goal-b">
        <span className="goal-t"><b>{u.name}</b> {lvlOf(save.build, u.id) > 0 && <small className="muted">Lv {lvlOf(save.build, u.id) + 1}</small>}</span>
        <div ref={bar}><Bar value={Math.min(1, now / cost)} color={ready ? '#6f9a6a' : '#e3a83a'} h={8} /></div>
        <small className="muted">{ready ? 'Puoi costruirlo: lo trovi in home!' : `Mancano ${Math.max(0, cost - now)} monete`}</small>
      </span>
    </div>
  );
}

export function End({ g, title, total, start, again, onExit }: { g: G; title: string; total: number; start: Daily; again: () => void; onExit: () => void }) {
  const app = useApp();
  const failed = g.lives <= 0;
  const stars = g.served >= total && g.lives === g.maxLives ? 3 : g.served >= total * 0.75 ? 2 : g.served >= total * 0.4 ? 1 : 0;
  const bonusCoins = stars * 25;
  const [best, setBest] = useState(false);
  const [done, setDone] = useState<Mission[]>([]);
  const [chest, setChest] = useState<{ coins: number; levels: number[] } | null>(null);
  const [gift, setGift] = useState<ReturnType<typeof app.supplier>>(null);
  const startLvl = useRef(levelOf(app.save.xp));
  const coinsBefore = useRef(app.save.coins);
  const reported = useRef(false);
  const score = useCountUp(g.score, 1100, 250 + stars * 280);
  const coins = useCountUp(g.coins + bonusCoins, 900, 600 + stars * 280);

  useEffect(() => {
    if (reported.current) return;
    reported.current = true;
    const a = app;
    // le missioni sulla memoria sono già avanzate durante il turno: si confronta con l'inizio del turno
    const cur = currentDaily(a.save);
    setBest(a.reportShift(g.score, g.coins + bonusCoins, g.bestCombo) && g.score > 0);
    a.addXp(Math.round(g.score / 10));
    const ev: Partial<Record<MKind, number>> = {
      serve: g.served, memory: g.tally.memory, combo: g.bestCombo, shifts: 1, stars3: stars === 3 ? 1 : 0, revenge: g.tally.revenge, guess: g.tally.guess, vip: g.tally.vip, order: g.tally.order,
      mix: g.tally.cats.length >= 3 ? 1 : 0,
    };
    a.track(ev);
    const newly = cur.ids
      .map(missionById)
      .filter((m): m is Mission => !!m && (start.date !== cur.date || progressOf(start, m) < m.goal) && Math.min(m.goal, (m.kind === 'combo' ? Math.max(cur.prog.combo ?? 0, ev.combo ?? 0) : (cur.prog[m.kind] ?? 0) + (ev[m.kind] ?? 0))) >= m.goal);
    setDone(newly);
    // a volte passa il fornitore con un pezzo raro per il locale (più turni senza, più è probabile)
    const got = g.served > 0 ? a.supplier() : null;
    if (got) setTimeout(() => { setGift(got); sfx.chest(); confetti(1.2); }, 1500 + stars * 280);
    // forziere di ogni livello raggiunto
    setTimeout(() => {
      const c = a.claimLevels();
      if (c.coins) {
        setChest(c);
        sfx.chest();
        confetti(1.4);
      }
    }, 900 + stars * 280);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const timers = Array.from({ length: stars }, (_, i) => setTimeout(() => sfx.star(i), 250 + i * 280));
    if (!failed && stars >= 2) timers.push(setTimeout(() => { confetti(stars === 3 ? 1.6 : 1); sfx.win(); }, 300 + stars * 280));
    else if (failed) timers.push(setTimeout(() => sfx.bad(), 200));
    return () => timers.forEach(clearTimeout);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const dishOf = (id: string) => app.save.dishes.find((d) => d.id === id);
  const prog = Object.entries(g.progress).sort((a, b) => b[1].to - b[1].from - (a[1].to - a[1].from));
  const lvl = levelOf(app.save.xp);
  const gold = g.trophies.find((t) => t.kind === 'gold');
  const unl = chest?.levels.flatMap(unlocksAt) ?? [];
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
        <div className="stat"><b>{g.served}/{total}</b><span>Serviti</span></div>
        <div className="stat"><b>x{g.bestCombo}</b><span>Combo</span></div>
        <div className="stat end-coins"><b><Coin size={20} /> {coins}</b><span>{stars ? `+${bonusCoins} stelle` : 'Monete'}{g.tally.tips ? ` · ${g.tally.tips} mance` : ''}</span></div>
      </div>
      <EndGoal before={coinsBefore.current} delay={1700 + stars * 280} />
      {gift && (
        <div className="card chest-card">
          <div className="card-h"><Icon name="gift" /> È passato il fornitore!</div>
          <div className="note"><Icon name="sparkle" size={16} />{'rare' in gift ? <span><b>{gift.rare.name}</b>: {gift.rare.text.toLowerCase()}. Lo trovi nel locale.</span> : <span>Hai già tutti i suoi pezzi rari: ti lascia <b>{gift.coins} monete</b>.</span>}</div>
        </div>
      )}
      {chest && (
        <div className="card chest-card">
          <div className="card-h"><Icon name="gift" /> Forziere {chest.levels.length > 1 ? 'dei livelli' : `del livello ${chest.levels[0]}`}: +{chest.coins} <Coin size={16} /></div>
          {unl.map((u) => <div key={u.id} className="note"><Icon name="sparkle" size={16} /><span><b>Sbloccato: {u.name}.</b> {u.text}</span></div>)}
        </div>
      )}
      {g.trophies.length > 0 && (
        <div className="card trophies">
          <div className="card-h">Momenti da ricordare</div>
          {gold && hasWebGL() && <div className="gold-stage"><DishViewer items={gold.dish.ingredients} cat={gold.dish.category} /></div>}
          {g.trophies.map((t, i) => (
            <div key={i} className={`trophy ${t.kind}`}>
              <DishPic dish={t.dish} />
              <span><b>{t.kind === 'gold' ? 'Piatto d\'oro' : t.kind === 'mem' ? 'Primo a memoria' : t.kind === 'critic' ? 'Il critico approva' : 'Recuperato'}</b> · {t.dish.name}</span>
            </div>
          ))}
        </div>
      )}
      {done.map((m) => (
        <div key={m.id} className="mission-done"><Icon name="gift" /> <span>Missione completata: <b>{m.text}</b>. Ritira {m.reward} monete in home!</span></div>
      ))}
      {prog.length > 0 && (
        <div className="card">
          <div className="card-h">La tua memoria</div>
          {prog.some(([, p]) => p.held && p.to === p.from) && <div className="muted sm">⏳ = già fissato per oggi: torna domani e salirà ancora (il cervello consolida dormendo)</div>}
          {prog.map(([id, p]) => (
            <div key={id} className="mem-row">
              <span className="mem-n">{dishOf(id) && <DishPic dish={dishOf(id)!} />}<span>{p.name}<small className="muted">{PHASES[p.to]}</small></span></span>
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
              <RecipeView dish={d} />
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

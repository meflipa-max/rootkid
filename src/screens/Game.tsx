import { useEffect, useRef, useState } from 'react';
import type { Dish, DishStat } from '../lib/types';
import { useApp } from '../store';
import { makeQuestion, norm } from '../lib/questions';
import { levelOf, pickWeighted, weight } from '../lib/mastery';
import { catOf } from '../lib/data';
import { cap, emojiFor } from '../lib/emoji';
import { confetti, sfx } from '../lib/fx';
import { SKINS } from '../lib/skins';
import { lvlOf } from '../lib/build';
import { CHEF_LOOK, Person, randomLook, type Look, type Mood, type Pose } from '../components/Person';
import { Chip } from '../components/ui';

type Hint = 'full' | 'icons' | 'count' | 'none';
const MULT: Record<Hint, number> = { full: 1, icons: 1.5, count: 2, none: 3 };
const TOTAL = 8;
const TICK = 100;

interface Cust {
  id: number;
  look: Look;
  dish: Dish;
  hint: Hint;
  slot: number;
  left: number;
  max: number;
  plate: string[];
  tray: string[];
  peeked: boolean;
  state: 'in' | 'wait' | 'happy' | 'angry';
  t: number; // ms nello stato corrente
}
interface Pop { id: number; text: string; kind: string; x: number; t: number }
interface Overlay { kind: 'wrong' | 'late'; dish: Dish; missing: string[]; extra: string[] }
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
  lives: number;
  maxLives: number;
  served: number;
  overlay: Overlay | null;
  paused: boolean;
  pops: Pop[];
  pose: Pose;
  poseT: number;
  shake: number;
  missedDishes: Dish[];
  lastIds: string[];
  uid: number;
  introLeft: number;
  levelUp: number | null;
}

const hintFor = (s?: DishStat): Hint => {
  const b = s && s.seen ? s.box : 0;
  return b <= 0 ? 'full' : b === 1 ? 'icons' : b <= 3 ? 'count' : 'none';
};

const initial = (maxLives: number): G => ({
  phase: 'intro', customers: [], spawned: 0, nextSpawn: 900, selected: null, score: 0, coins: 0, combo: 0, bestCombo: 0,
  lives: maxLives, maxLives, served: 0, overlay: null, paused: false, pops: [], pose: 'idle', poseT: 0, shake: 0, missedDishes: [], lastIds: [], uid: 1,
  introLeft: 2200, levelUp: null,
});

export function Game({ pool, title, onExit }: { pool: Dish[]; title: string; onExit: () => void }) {
  const [run, setRun] = useState(0);
  return <Shift key={run} pool={pool} title={title} onExit={onExit} again={() => setRun((r) => r + 1)} />;
}

function Decor({ build }: { build: Record<string, number> }) {
  const l = (id: string) => lvlOf(build, id);
  return (
    <div className="decor">
      {l('luci') > 0 && <div className="lights">{Array.from({ length: 6 + l('luci') * 2 }, (_, i) => <i key={i} style={{ animationDelay: `${(i % 4) * 0.4}s`, background: ['#ffd24a', '#ff3d81', '#4cc9f0', '#2ee59d'][i % 4] }} />)}</div>}
      {l('quadri') > 0 && <div className="frames">{['🖼️', '🍷', '🇮🇹'].slice(0, l('quadri')).map((e, i) => <span key={i}>{e}</span>)}</div>}
      {l('piante') > 0 && <div className="plants"><span>🪴</span>{l('piante') > 1 && <span className="r">🌿</span>}{l('piante') > 2 && <span className="r2">🪴</span>}</div>}
      {l('tavolini') > 0 && <div className="tables">{Array.from({ length: l('tavolini') }, (_, i) => <span key={i}>🪑</span>)}</div>}
      {l('insegna') >= 3 && <div className="glow" />}
    </div>
  );
}

function Shift({ pool, title, onExit, again }: { pool: Dish[]; title: string; onExit: () => void; again: () => void }) {
  const app = useApp();
  const appRef = useRef(app);
  appRef.current = app;
  const gr = useRef<G>(initial(3 + lvlOf(app.save.build, 'frigo')));
  const [g, setG] = useState<G>(gr.current);
  const reported = useRef(false);
  const [best, setBest] = useState(false);
  const startLvl = useRef(levelOf(app.save.xp));
  const skin = SKINS.find((s) => s.id === app.save.skin) ?? SKINS[0];

  const commit = (n: G) => {
    gr.current = n;
    setG(n);
  };
  const addPop = (g: G, text: string, kind: string, slot: number): G => ({
    ...g, uid: g.uid + 1, pops: [...g.pops, { id: g.uid, text, kind, x: slot * 33.3 + 16.6, t: 1200 }],
  });

  const spawn = (g: G): G => {
    const taken = new Set(g.customers.map((c) => c.slot));
    const slot = [0, 1, 2].find((s) => !taken.has(s));
    if (slot === undefined) return g;
    const { stats, dishes, xp } = appRef.current.save;
    const now = Date.now();
    let cands = pool.filter((d) => !g.lastIds.slice(-2).includes(d.id));
    if (!cands.length) cands = pool;
    const [dish] = pickWeighted(cands.map((d) => ({ item: d, w: weight(stats[d.id], now) })), 1);
    const hint = hintFor(stats[dish.id]);
    const diff = Math.max(0.55, 1 - (levelOf(xp) - 1) * 0.04);
    const max = Math.round((24 + dish.ingredients.length * 2.5 + (hint === 'full' ? 8 : 0)) * 1000 * diff * (1 + 0.1 * lvlOf(appRef.current.save.build, 'forno')));
    const q = makeQuestion(dish, dishes, 'build');
    const c: Cust = { id: g.uid, look: randomLook(), dish, hint, slot, left: max, max, plate: [], tray: q.kind === 'build' ? q.options : dish.ingredients, peeked: false, state: 'in', t: 0 };
    const ng: G = { ...g, uid: g.uid + 1, customers: [...g.customers, c], spawned: g.spawned + 1, lastIds: [...g.lastIds, dish.id], nextSpawn: Math.max(3500, 5500 + Math.random() * 3000 - g.spawned * 250) };
    return ng;
  };

  const fail = (g: G, c: Cust, kind: 'wrong' | 'late', missing: string[], extra: string[]): G => {
    appRef.current.record(c.dish.id, false, missing, 0);
    sfx.bad();
    let n: G = {
      ...g,
      lives: g.lives - 1, combo: 0, shake: 450, pose: 'sad', poseT: 1200,
      overlay: { kind, dish: c.dish, missing, extra },
      missedDishes: g.missedDishes.some((d) => d.id === c.dish.id) ? g.missedDishes : [...g.missedDishes, c.dish],
      customers: g.customers.map((x) => (x.id === c.id ? { ...x, state: 'angry', t: 0 } : x)),
    };
    n = addPop(n, kind === 'late' ? '⏰ Troppo tardi!' : '😡 Sbagliato!', 'bad', c.slot);
    return n;
  };

  const tick = () => {
    let g = gr.current;
    if (g.phase === 'end') return;
    const dt = TICK;
    g = { ...g, pops: g.pops.map((p) => ({ ...p, t: p.t - dt })).filter((p) => p.t > 0), shake: Math.max(0, g.shake - dt), poseT: Math.max(0, g.poseT - dt) };
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
    for (const c of g.customers) {
      const n = { ...c, t: c.t + dt };
      if (n.state === 'in') {
        n.left -= dt;
        if (n.t >= 750) { n.state = 'wait'; n.t = 0; }
      } else if (n.state === 'wait') {
        n.left -= dt;
        if (n.left <= 0 && !timedOut) timedOut = n;
      } else if (n.t >= 950) continue;
      customers.push(n);
    }
    g = { ...g, customers };
    const active = customers.filter((c) => c.state === 'in' || c.state === 'wait');
    if (g.spawned < TOTAL && g.nextSpawn <= 0 && customers.length < 3) g = spawn(g);
    else if (g.spawned < TOTAL && !active.length && g.nextSpawn > 700) g = { ...g, nextSpawn: 700 };
    if (timedOut) g = fail(g, timedOut, 'late', [], []);
    const sel = g.customers.find((c) => c.id === g.selected && (c.state === 'in' || c.state === 'wait'));
    if (!sel) {
      const a = g.customers.filter((c) => c.state === 'in' || c.state === 'wait').sort((x, y) => x.left - y.left)[0];
      g = { ...g, selected: a ? a.id : null };
    }
    if (!g.overlay && (g.lives <= 0 || (g.spawned >= TOTAL && g.customers.length === 0))) {
      g = { ...g, phase: 'end' };
      if (g.served >= TOTAL * 0.75 && g.lives > 0) { confetti(1.4); sfx.win(); }
    }
    commit(g);
  };

  useEffect(() => {
    const t = setInterval(tick, TICK);
    return () => clearInterval(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const stars = g.served >= TOTAL && g.lives === g.maxLives ? 3 : g.served >= TOTAL * 0.75 ? 2 : g.served >= TOTAL * 0.4 ? 1 : 0;
  const bonusCoins = stars * 25;
  useEffect(() => {
    if (g.phase === 'end' && !reported.current) {
      reported.current = true;
      setBest(appRef.current.reportShift(g.score, g.coins + bonusCoins, g.bestCombo) && g.score > 0);
      appRef.current.addXp(Math.round(g.score / 10));
    }
  }, [g.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const selected = g.customers.find((c) => c.id === g.selected && (c.state === 'in' || c.state === 'wait'));

  const toggle = (ing: string) => {
    const g0 = gr.current;
    const c = g0.customers.find((x) => x.id === g0.selected);
    if (!c || g0.overlay || g0.paused || g0.phase !== 'play' || (c.state !== 'wait' && c.state !== 'in')) return;
    sfx.tap();
    const has = c.plate.includes(ing);
    const plate = has ? c.plate.filter((x) => x !== ing) : [...c.plate, ing];
    commit({ ...g0, pose: 'work', poseT: 350, customers: g0.customers.map((x) => (x.id === c.id ? { ...x, plate } : x)) });
  };

  const clearPlate = () => {
    const g0 = gr.current;
    if (!g0.selected) return;
    commit({ ...g0, customers: g0.customers.map((x) => (x.id === g0.selected ? { ...x, plate: [] } : x)) });
  };

  const peek = () => {
    const g0 = gr.current;
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
    if (!c || c.state !== 'wait' || !c.plate.length || g0.overlay || g0.paused) return;
    const want = c.dish.ingredients.map(norm);
    const got = c.plate.map(norm);
    const missing = c.dish.ingredients.filter((i) => !got.includes(norm(i)));
    const extra = c.plate.filter((i) => !want.includes(norm(i)));
    if (missing.length || extra.length) return commit(fail(g0, c, 'wrong', missing, extra));

    const mult = c.peeked ? 1 : MULT[c.hint];
    const combo = g0.combo + 1;
    const frac = Math.max(0, c.left / c.max);
    const b = appRef.current.save.build;
    const pts = Math.round((100 * mult * (1 + Math.min(combo - 1, 10) * 0.1) + frac * 60) * (1 + 0.05 * lvlOf(b, 'insegna')));
    const coins = Math.max(1, Math.round((pts / 20) * (1 + 0.15 * lvlOf(b, 'cassa'))));
    let leveled: number | null = g0.levelUp;
    if (c.peeked) appRef.current.addXp(3);
    else {
      const r = appRef.current.record(c.dish.id, true, [], Math.round(6 * mult));
      if (r.leveledUp) leveled = r.level;
    }
    sfx.ok(combo);
    setTimeout(() => sfx.coin(), 180);
    if (combo % 4 === 0) confetti(0.7);
    let n: G = {
      ...g0, score: g0.score + pts, coins: g0.coins + coins, combo, bestCombo: Math.max(g0.bestCombo, combo), served: g0.served + 1,
      pose: 'cheer', poseT: 900, levelUp: leveled,
      customers: g0.customers.map((x) => (x.id === c.id ? { ...x, state: 'happy', t: 0 } : x)),
    };
    n = addPop(n, `+${pts}`, 'gain', c.slot);
    n = addPop(n, !c.peeked && c.hint === 'none' ? '🧠 A MEMORIA!' : frac > 0.6 ? '⚡ VELOCE!' : '✨ PERFETTO!', 'hype', c.slot);
    if (combo >= 3) n = addPop(n, `🔥 COMBO x${combo}`, 'combo', c.slot);
    commit(n);
  };

  const closeOverlay = () => {
    sfx.tap();
    commit({ ...gr.current, overlay: null });
  };
  const setPaused = (p: boolean) => commit({ ...gr.current, paused: p });

  const moodOf = (c: Cust): Mood => (c.state === 'happy' ? 'happy' : c.state === 'angry' ? 'angry' : c.left / c.max > 0.5 ? 'idle' : c.left / c.max > 0.22 ? 'worried' : 'angry');

  if (g.phase === 'end') {
    const failed = g.lives <= 0;
    return (
      <div className="screen over">
        <div className="over-emoji">{failed ? '😵' : stars === 3 ? '🏆' : '🍕'}</div>
        <h1>{failed ? 'Il locale è nel caos!' : 'Turno finito!'}</h1>
        <div className="stars">{[0, 1, 2].map((i) => <span key={i} className={i < stars ? 'on' : ''} style={{ animationDelay: `${i * 220}ms` }}>★</span>)}</div>
        <div className="bigscore">{g.score}</div>
        {best && <div className="levelup">🎉 Nuovo record!</div>}
        <div className="stat-row">
          <div className="stat"><b>{g.served}/{TOTAL}</b><span>Serviti</span></div>
          <div className="stat"><b>x{g.bestCombo}</b><span>Combo</span></div>
          <div className="stat"><b>🪙 {g.coins + bonusCoins}</b><span>{stars ? `inclusi +${bonusCoins} stelle` : 'Monete'}</span></div>
        </div>
        {levelOf(app.save.xp) > startLvl.current && <div className="levelup">⭐ Livello {levelOf(app.save.xp)}!</div>}
        {g.missedDishes.length > 0 && (
          <div className="card">
            <div className="card-h">Da ripassare</div>
            {g.missedDishes.map((d) => (
              <div key={d.id} className="miss-row">
                <b>{catOf(d.category).emoji} {d.name}</b>
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

  const ticket = selected;
  const showFull = ticket && (ticket.hint === 'full' || ticket.peeked);

  return (
    <div className={`game ${g.shake > 0 ? 'shake' : ''}`}>
      <div className="hud">
        <button className="icon-btn" onClick={() => setPaused(true)} aria-label="Pausa">⏸</button>
        <div className="hearts">{Array.from({ length: g.maxLives }, (_, i) => i).map((i) => <span key={i} className={i < g.lives ? '' : 'lost'}>{i < g.lives ? '❤️' : '🖤'}</span>)}</div>
        <div className="score" key={g.score}>{g.score}</div>
        <div className="coins">🪙 {g.coins}</div>
      </div>
      <div className="hud2">
        <span>{title} · cliente {Math.min(g.spawned, TOTAL)}/{TOTAL}</span>
        {g.combo >= 2 && <span className="combo" key={g.combo}>🔥 x{g.combo}</span>}
      </div>

      <div className="shop-top">
        <Decor build={app.save.build} />
        <div className="neon">🍕 CORE A CORE</div>
        <div className="slots">
          {[0, 1, 2].map((slot) => {
            const c = g.customers.find((x) => x.slot === slot);
            return (
              <div className="slot" key={slot}>
                {c && (
                  <div className={`cust st-${c.state}`} key={c.id}>
                    <button className={`bubble ${selected?.id === c.id ? 'sel' : ''}`} onClick={() => select(c.id)}>
                      <span className="b-n">{catOf(c.dish.category).emoji} {c.dish.name}</span>
                      <span className="pbar"><i style={{ width: `${Math.max(0, (c.left / c.max) * 100)}%`, background: c.left / c.max > 0.5 ? '#2ee59d' : c.left / c.max > 0.22 ? '#ffd24a' : '#ff4d6d' }} /></span>
                    </button>
                    <div className="who"><Person look={c.look} mood={moodOf(c)} pose={c.state === 'happy' ? 'cheer' : 'idle'} /></div>
                    {c.state === 'happy' && <div className="hearts-fx">💖</div>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="counter-bar" />
        <div className="pops">
          {g.pops.map((p) => <span key={p.id} className={`pop ${p.kind}`} style={{ left: `${p.x}%` }}>{p.text}</span>)}
        </div>
      </div>

      <div className="kitchen">
        <div className="chef"><Person look={CHEF_LOOK} chef={skin} pose={g.pose} mood={g.pose === 'cheer' ? 'happy' : g.pose === 'sad' ? 'worried' : 'idle'} /></div>
        <div className="plate-wrap">
          <div className="plate">
            {selected?.plate.map((p) => (
              <button key={p} className="pitem" onClick={() => toggle(p)}>{emojiFor(p)}</button>
            ))}
            {!selected?.plate.length && <span className="plate-hint">Piatto vuoto</span>}
          </div>
          <button className="trash" onClick={clearPlate} disabled={!selected?.plate.length}>🗑️</button>
        </div>
      </div>

      <div className="ticket">
        {!ticket ? (
          <span className="muted">Aspetta il prossimo cliente…</span>
        ) : (
          <>
            <div className="t-top">
              <b>🧾 {ticket.dish.name}</b>
              {ticket.hint === 'none' && !ticket.peeked && <span className="mem">🧠 A memoria ×3</span>}
              {!showFull && <button className="peek" onClick={peek}>📖 Aiuto</button>}
            </div>
            {showFull ? (
              <div className="t-chips">{ticket.dish.ingredients.map((i) => <span key={i} className="mini">{emojiFor(i)} {cap(i)}</span>)}</div>
            ) : ticket.hint === 'icons' ? (
              <div className="t-chips">{ticket.dish.ingredients.map((i, k) => <span key={k} className="mini">{emojiFor(i)}</span>)}<span className="muted sm">({ticket.dish.ingredients.length})</span></div>
            ) : ticket.hint === 'count' ? (
              <div className="muted sm">{ticket.dish.ingredients.length} {ticket.dish.ingredients.length === 1 ? 'ingrediente' : 'ingredienti'} — ricordi quali?</div>
            ) : (
              <div className="muted sm">Nessun aiuto: ti fidi della tua memoria?</div>
            )}
          </>
        )}
      </div>

      <div className="tray">
        {(selected?.tray ?? []).map((t) => (
          <button key={t} className={`tile ${selected?.plate.includes(t) ? 'used' : ''}`} onClick={() => toggle(t)}>
            <span className="t-e">{emojiFor(t)}</span>
            <span className="t-l">{cap(t)}</span>
          </button>
        ))}
      </div>
      <button className="serve" disabled={!selected || selected.state !== 'wait' || !selected.plate.length} onClick={serve}>🔔 SERVI!</button>

      {g.phase === 'intro' && (
        <div className="intro">
          <div className="intro-t" key={g.introLeft > 900 ? 'a' : 'b'}>{g.introLeft > 900 ? 'Si apre il locale!' : 'VIA! 🍕'}</div>
        </div>
      )}
      {g.paused && (
        <div className="modal">
          <div className="modal-in c">
            <h3>⏸ Pausa</h3>
            <button className="btn primary wide" onClick={() => setPaused(false)}>Riprendi</button>
            <button className="btn danger wide" onClick={onExit}>Esci dal turno</button>
          </div>
        </div>
      )}
      {g.overlay && (
        <div className="modal">
          <div className="modal-in">
            <h3>{g.overlay.kind === 'late' ? '⏰ Il cliente se n\'è andato!' : '😡 Piatto sbagliato!'}</h3>
            <div className="muted">La ricetta di <b>{g.overlay.dish.name}</b>:</div>
            <div className="chips">
              {g.overlay.dish.ingredients.map((i) => <Chip key={i} text={i} state={g.overlay!.missing.includes(i) ? 'miss' : 'ok'} />)}
            </div>
            {g.overlay.missing.length > 0 && <div className="sm">Ti mancava: <b>{g.overlay.missing.map(cap).join(', ')}</b></div>}
            {g.overlay.extra.length > 0 && <div className="sm">Di troppo: <b>{g.overlay.extra.map(cap).join(', ')}</b></div>}
            <div className="sm muted">Ti rimangono {Math.max(0, g.lives)} ❤️</div>
            <button className="btn primary wide" onClick={closeOverlay}>Ho capito 💪</button>
          </div>
        </div>
      )}
    </div>
  );
}

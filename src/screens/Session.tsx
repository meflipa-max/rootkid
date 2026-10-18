import { useMemo, useState } from 'react';
import type { Dish } from '../lib/types';
import { useApp } from '../store';
import { availableKinds, makeQuestion, type Kind } from '../lib/questions';
import { pickWeighted, mastery, weight, levelOf } from '../lib/mastery';
import { confetti, sfx } from '../lib/fx';
import { QuestionView, type Result } from '../components/QuestionView';
import { Bar, RecipeChips, TopBar } from '../components/ui';
import { catOf } from '../lib/data';

interface Item {
  dish: Dish;
  kind: Kind;
  retry: boolean;
}

function pickKind(dish: Dish, all: Dish[], m: number): Kind {
  const kinds = availableKinds(dish, all);
  const w: Record<Kind, number> = { build: 0.4 + m * 0.8, which: 0.7, missing: 0.9 - m * 0.4 };
  const total = kinds.reduce((a, k) => a + w[k], 0);
  let r = Math.random() * total;
  for (const k of kinds) {
    r -= w[k];
    if (r <= 0) return k;
  }
  return kinds[0];
}

export function buildQueue(pool: Dish[], all: Dish[], stats: ReturnType<typeof useApp>['save']['stats'], count: number): Item[] {
  const now = Date.now();
  const weighted = pool.map((d) => ({ item: d, w: weight(stats[d.id], now) }));
  let picks = pickWeighted(weighted, Math.min(count, pool.length));
  while (picks.length < count && pool.length) picks = [...picks, ...pickWeighted(weighted, Math.min(count - picks.length, pool.length))];
  return picks.map((dish) => ({ dish, kind: pickKind(dish, all, mastery(stats[dish.id])), retry: false }));
}

export function Session({ pool, title, count = 10, onExit }: { pool: Dish[]; title: string; count?: number; onExit: () => void }) {
  const [run, setRun] = useState(0);
  return <Run key={run} pool={pool} title={title} count={count} onExit={onExit} again={() => setRun((r) => r + 1)} />;
}

function Run({ pool, title, count, onExit, again }: { pool: Dish[]; title: string; count: number; onExit: () => void; again: () => void }) {
  const app = useApp();
  const all = app.save.dishes;
  const [queue, setQueue] = useState<Item[]>(() => buildQueue(pool, all, app.save.stats, count));
  const [idx, setIdx] = useState(0);
  const [res, setRes] = useState<{ r: Result; xp: number } | null>(null);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [xp, setXp] = useState(0);
  const [right, setRight] = useState(0);
  const [wrongNames, setWrongNames] = useState<string[]>([]);
  const [lvl, setLvl] = useState<number | null>(null);
  const [startLevel] = useState(() => levelOf(app.save.xp));
  const [done, setDone] = useState(false);

  const item = queue[idx];
  const q = useMemo(() => (item ? makeQuestion(item.dish, all, item.kind) : null), [idx, queue]); // eslint-disable-line react-hooks/exhaustive-deps

  const onReveal = (r: Result) => {
    const nextCombo = r.correct ? combo + 1 : 0;
    const gain = r.correct ? (item.retry ? 5 : 10 + Math.min(combo, 5) * 2) : 0;
    const rr = app.record(item.dish.id, r.correct, r.missed, gain);
    setRes({ r, xp: gain });
    setCombo(nextCombo);
    setBestCombo((b) => Math.max(b, nextCombo));
    setXp((x) => x + gain);
    if (rr.leveledUp) setLvl(rr.level);
    if (r.correct) {
      setRight((n) => n + 1);
      sfx.ok(nextCombo);
      if (nextCombo > 0 && nextCombo % 5 === 0) confetti(0.6);
    } else {
      sfx.bad();
      setWrongNames((w) => (w.includes(item.dish.name) ? w : [...w, item.dish.name]));
      if (!item.retry) setQueue((qq) => [...qq, { dish: item.dish, kind: pickKind(item.dish, all, 0), retry: true }]);
    }
  };

  const next = () => {
    sfx.tap();
    if (idx + 1 >= queue.length) {
      setDone(true);
      if (right / Math.max(1, queue.length) >= 0.8) {
        confetti(1.4);
        sfx.win();
      }
    } else {
      setIdx(idx + 1);
      setRes(null);
    }
  };

  if (done) {
    const total = queue.length;
    const pct = Math.round((right / total) * 100);
    return (
      <div className="screen over">
        <div className="over-emoji">{pct >= 90 ? '🏆' : pct >= 60 ? '🔥' : '💪'}</div>
        <h1>{pct >= 90 ? 'Perfetto!' : pct >= 60 ? 'Bel lavoro!' : 'Si migliora!'}</h1>
        <div className="stat-row">
          <div className="stat"><b>{right}/{total}</b><span>Giuste</span></div>
          <div className="stat"><b>+{xp}</b><span>XP</span></div>
          <div className="stat"><b>x{bestCombo}</b><span>Combo max</span></div>
        </div>
        {levelOf(app.save.xp) > startLevel && <div className="levelup">⭐ Nuovo livello: {levelOf(app.save.xp)}!</div>}
        {wrongNames.length > 0 && (
          <div className="card">
            <div className="card-h">Da ripassare</div>
            <div className="chips">{wrongNames.map((n) => <span key={n} className="chip bad">{n}</span>)}</div>
          </div>
        )}
        <div className="spacer" />
        <button className="btn primary wide" onClick={again}>Ancora!</button>
        <button className="btn ghost wide" onClick={onExit}>Torna alla home</button>
      </div>
    );
  }

  const cat = catOf(item.dish.category);
  return (
    <div className="screen play">
      <TopBar
        title={title}
        onExit={onExit}
        right={combo >= 2 ? <span className="combo" key={combo}>🔥 x{combo}</span> : <span className="xp-pill">+{xp} XP</span>}
      />
      <div className="progress">
        <Bar value={idx / queue.length} color={cat.color} h={10} />
        <span>{idx + 1}/{queue.length}</span>
      </div>
      {item.retry && <div className="retry-tag">🔁 Ci riproviamo!</div>}
      <div className={`q-wrap ${res ? "with-sheet" : ""} ${res && !res.r.correct ? "shake" : ""}`}>{q && <QuestionView key={`${idx}-${queue.length}`} q={q} onReveal={onReveal} />}</div>
      {res && (
        <div className={`sheet ${res.r.correct ? 'good' : 'badd'}`}>
          <div className="sheet-h">
            {res.r.correct ? (
              <>✅ Giusto! {res.xp > 0 && <span className="gain">+{res.xp} XP</span>}</>
            ) : (
              <>❌ Quasi! Ecco la ricetta:</>
            )}
          </div>
          <div className="sheet-n">{item.dish.name}</div>
          <RecipeChips dish={item.dish} />
          {lvl && <div className="levelup sm">⭐ Livello {lvl}!</div>}
          <button className="btn primary wide" onClick={next} autoFocus>
            {idx + 1 >= queue.length ? 'Fine' : 'Avanti'}
          </button>
        </div>
      )}
    </div>
  );
}

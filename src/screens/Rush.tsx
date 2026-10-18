import { useEffect, useRef, useState } from 'react';
import type { Dish } from '../lib/types';
import { useApp } from '../store';
import { availableKinds, makeQuestion, type Q } from '../lib/questions';
import { weight } from '../lib/mastery';
import { confetti, sfx } from '../lib/fx';
import { QuestionView, type Result } from '../components/QuestionView';
import { Bar, TopBar } from '../components/ui';

const TOTAL = 60;

export function Rush({ pool, onExit }: { pool: Dish[]; onExit: () => void }) {
  const app = useApp();
  const all = app.save.dishes;
  const [phase, setPhase] = useState<'ready' | 'play' | 'over'>('ready');
  const [left, setLeft] = useState(TOTAL);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [best, setBest] = useState(0);
  const [ok, setOk] = useState(0);
  const [tot, setTot] = useState(0);
  const [q, setQ] = useState<Q | null>(null);
  const [n, setN] = useState(0);
  const [flash, setFlash] = useState<'' | 'good' | 'bad'>('');
  const [isNew, setIsNew] = useState(false);
  const last = useRef('');
  const locked = useRef(false);
  const comboRef = useRef(0);

  const nextQ = () => {
    const now = Date.now();
    const cands = pool.filter((d) => availableKinds(d, all).some((k) => k !== 'build') && d.id !== last.current);
    const list = cands.length ? cands : pool;
    let r = Math.random() * list.reduce((a, d) => a + weight(app.save.stats[d.id], now), 0);
    let dish = list[0];
    for (const d of list) {
      r -= weight(app.save.stats[d.id], now);
      if (r <= 0) {
        dish = d;
        break;
      }
    }
    last.current = dish.id;
    const kinds = availableKinds(dish, all).filter((k) => k !== 'build');
    const kind = kinds.length ? kinds[Math.floor(Math.random() * kinds.length)] : 'build';
    setQ(makeQuestion(dish, all, kind));
    setN((x) => x + 1);
    locked.current = false;
  };

  const start = () => {
    setPhase('play');
    setLeft(TOTAL);
    setScore(0);
    setCombo(0);
    comboRef.current = 0;
    setBest(0);
    setOk(0);
    setTot(0);
    nextQ();
  };

  useEffect(() => {
    if (phase !== 'play') return;
    const t = setInterval(() => setLeft((l) => Math.max(0, l - 0.1)), 100);
    return () => clearInterval(t);
  }, [phase]);

  useEffect(() => {
    if (phase === 'play' && left <= 0) {
      setPhase('over');
      const nw = app.reportRush(score, best);
      setIsNew(nw && score > 0);
      if (nw && score > 0) {
        confetti(1.4);
        sfx.win();
      }
    }
  }, [left, phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const onReveal = (r: Result) => {
    if (!q || locked.current) return;
    locked.current = true;
    const c = r.correct ? comboRef.current + 1 : 0;
    comboRef.current = c;
    app.record(q.dish.id, r.correct, r.missed, r.correct ? 6 : 0);
    setTot((x) => x + 1);
    setCombo(c);
    if (r.correct) {
      setOk((x) => x + 1);
      setBest((b) => Math.max(b, c));
      setScore((s) => s + Math.round(10 * (1 + Math.floor(c / 3) * 0.5)));
      if (c % 5 === 0) setLeft((l) => Math.min(TOTAL + 10, l + 3));
      sfx.ok(c);
      setFlash('good');
      setTimeout(() => {
        setFlash('');
        nextQ();
      }, 380);
    } else {
      setLeft((l) => Math.max(0, l - 3));
      sfx.bad();
      setFlash('bad');
      setTimeout(() => {
        setFlash('');
        nextQ();
      }, 1100);
    }
  };

  if (phase === 'ready')
    return (
      <div className="screen over">
        <TopBar title="Rush 60s" onExit={onExit} />
        <div className="over-emoji">⚡</div>
        <h1>Rush!</h1>
        <p className="muted c">Rispondi più veloce che puoi. Ogni combo moltiplica i punti, ogni 5 di fila ottieni +3 secondi. Un errore costa -3 secondi.</p>
        <div className="card c">Record: <b>{app.save.bestRush}</b> punti</div>
        <div className="spacer" />
        <button className="btn primary wide big" onClick={start}>Via!</button>
      </div>
    );

  if (phase === 'over')
    return (
      <div className="screen over">
        <div className="over-emoji">{isNew ? '🏆' : '⏱️'}</div>
        <h1>{isNew ? 'Nuovo record!' : 'Tempo scaduto!'}</h1>
        <div className="bigscore">{score}</div>
        <div className="stat-row">
          <div className="stat"><b>{ok}/{tot}</b><span>Giuste</span></div>
          <div className="stat"><b>x{best}</b><span>Combo max</span></div>
          <div className="stat"><b>{app.save.bestRush}</b><span>Record</span></div>
        </div>
        <div className="spacer" />
        <button className="btn primary wide" onClick={start}>Rigioca</button>
        <button className="btn ghost wide" onClick={onExit}>Torna alla home</button>
      </div>
    );

  return (
    <div className={`screen play flash-${flash}`}>
      <TopBar title={`⚡ ${score}`} onExit={onExit} right={combo >= 2 ? <span className="combo" key={combo}>🔥 x{combo}</span> : <span className="xp-pill">{Math.ceil(left)}s</span>} />
      <div className="progress">
        <Bar value={left / TOTAL} color={left < 10 ? '#ff4d6d' : '#ffd24a'} h={12} />
      </div>
      <div className="q-wrap">{q && <QuestionView key={n} q={q} onReveal={onReveal} />}</div>
    </div>
  );
}

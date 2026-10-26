import { useEffect, useRef, useState } from 'react';
import { Icon } from '../components/Icon';
import { DishPic, Ing } from '../components/Ing';
import type { Dish } from '../lib/types';
import { useApp } from '../store';
import { mastery } from '../lib/mastery';
import { confetti, sfx } from '../lib/fx';
import { catOf, isPizza } from '../lib/data';
import { cap } from '../lib/emoji';
import { norm } from '../lib/questions';
import { BASE_ROSSA, hasBaseRossa, Photo, Why } from '../components/Recipe';
import { Bar, DishBadge, TopBar } from '../components/ui';

/** un passo del film mentale: cosa dice il gioco e cosa devi pensare tu */
interface Step { cue: string; items: string[] }

/**
 * "Immagina di montarlo": il film mentale che si fa da soli al lavoro, guidato.
 * Il gioco dice dove sei ("pane di sotto", "la pizza esce dal forno"), tu pensi cosa viene dopo, poi lo scopri.
 */
function stepsOf(d: Dish): Step[] {
  if (isPizza(d.category)) {
    const aft = new Set((d.after ?? []).map(norm));
    const before = d.ingredients.filter((i) => !aft.has(norm(i)));
    const after = d.ingredients.filter((i) => aft.has(norm(i)));
    const out: Step[] = [];
    const base = hasBaseRossa(d) ? BASE_ROSSA : [];
    const rest = before.filter((i) => !base.includes(norm(i)));
    out.push(base.length ? { cue: 'Stendi l\'impasto. Che base è?', items: before.filter((i) => base.includes(norm(i))) } : { cue: 'Stendi l\'impasto. Cosa ci metti per primo?', items: rest.splice(0, 1) });
    rest.forEach((i, k) => out.push({ cue: k === 0 ? 'Poi, prima di infornare?' : 'E poi?', items: [i] }));
    out.push({ cue: 'Inforni. Esce dal forno: cosa aggiungi?', items: after });
    return out.filter((s) => s.items.length || s.cue.startsWith('Inforni'));
  }
  if (d.category === 'hamburger' || d.category === 'focacce') {
    return d.ingredients.map((i, k) => ({ cue: k === 0 ? (d.category === 'hamburger' ? 'Pane di sotto sul banco. Cosa metti?' : 'Apri la focaccia. Cosa metti per primo?') : k === d.ingredients.length - 1 ? 'Ultimo strato, prima di chiudere?' : 'E sopra?', items: [i] }));
  }
  if (d.category === 'fritti') return [{ cue: 'Prendi il cestino. Cosa ci metti, e quanti pezzi?', items: d.ingredients }];
  return d.ingredients.map((i, k) => ({ cue: k === 0 ? 'Prendi la ciotola. Cosa metti?' : 'E poi?', items: [i] }));
}

export function Imagine({ pool, onExit }: { pool: Dish[]; onExit: () => void }) {
  const app = useApp();
  const [queue] = useState<Dish[]>(() => [...pool].sort((a, b) => mastery(app.save.stats[a.id]) - mastery(app.save.stats[b.id]) || Math.random() - 0.5));
  const [i, setI] = useState(0);
  const [k, setK] = useState(0);
  const [shown, setShown] = useState(false);
  const [score, setScore] = useState({ all: 0, dishes: 0 });
  const tracked = useRef(false);
  const finished = i >= queue.length;

  const track = () => {
    if (!tracked.current && score.dishes > 0) {
      tracked.current = true;
      app.track({ cards: score.dishes });
    }
  };
  useEffect(() => {
    if (finished) track();
  }, [finished]); // eslint-disable-line react-hooks/exhaustive-deps

  if (finished) {
    return (
      <div className="screen over">
        <div className="over-icon"><Icon name="layers" size={56} /></div>
        <h1>Montati tutti!</h1>
        <p className="muted c">Rifare a mente quello che fai al banco è lo stesso lavoro che fa la tua memoria al lavoro: più lo ripassi così, più viene da solo.</p>
        <div className="stat-row">
          <div className="stat"><b>{score.all}/{score.dishes}</b><span>Tutti in mente</span></div>
        </div>
        <div className="spacer" />
        <button className="btn primary wide big" onClick={onExit}>Torna alla home</button>
      </div>
    );
  }

  const dish = queue[i];
  const cat = catOf(dish.category);
  const steps = stepsOf(dish);
  const step = steps[Math.min(k, steps.length - 1)];
  const atEnd = k >= steps.length;

  const reveal = () => {
    sfx.place(k + 1);
    setShown(true);
  };
  const next = () => {
    sfx.tap();
    setShown(false);
    setK(k + 1);
  };
  const rate = (how: 'all' | 'almost' | 'no') => {
    // autovalutazione: vale poco per la memoria a lungo termine, ma conta
    app.record(dish.id, { grade: how === 'all' ? 3 : how === 'almost' ? 2 : 1, cap: 2, severity: 1, weak: true, xp: how === 'all' ? 4 : 1 });
    if (how === 'all') {
      sfx.ok(2);
      confetti(0.5);
    } else sfx.tap();
    setScore((s) => ({ all: s.all + (how === 'all' ? 1 : 0), dishes: s.dishes + 1 }));
    setI(i + 1);
    setK(0);
    setShown(false);
  };
  const done = steps.slice(0, k);

  return (
    <div className="screen play imagine">
      <TopBar title="Immagina di montarlo" onExit={() => { track(); onExit(); }} right={<span className="xp-pill">{i + 1}/{queue.length}</span>} />
      <div className="progress"><Bar value={i / queue.length} color={cat.color} h={10} /></div>
      <section className="card write-card" style={{ ['--cat' as string]: cat.color }}>
        <div className="write-h">
          <DishPic dish={{ ingredients: [], category: dish.category }} />
          <div>
            <DishBadge dish={dish} />
            <div className="face-name sm">{dish.name}</div>
          </div>
        </div>
        <div className="im-stack">
          {done.map((s, n) => (
            <div key={n} className="im-step done">
              <span className="muted sm">{s.cue}</span>
              <div className="chips">{s.items.length ? s.items.map((x) => <span key={x} className="chip ok"><Ing name={x} /> {cap(x)}</span>) : <span className="muted sm">niente</span>}</div>
            </div>
          ))}
          {!atEnd && (
            <div className="im-step now">
              <b>{step.cue}</b>
              {shown ? (
                <div className="chips">{step.items.length ? step.items.map((x) => <span key={x} className="chip ok pop-in"><Ing name={x} /> {cap(x)}</span>) : <span className="muted sm">Niente: si serve così</span>}</div>
              ) : (
                <div className="muted sm">Pensaci, vedilo davanti a te… poi scopri</div>
              )}
            </div>
          )}
        </div>
        {atEnd && (
          <>
            <Photo id={dish.id} className="sm" />
            <Why dish={dish} />
          </>
        )}
      </section>
      <div className="spacer" />
      {atEnd ? (
        <>
          <div className="muted c">Li avevi tutti in mente, nell'ordine giusto?</div>
          <div className="rate three">
            <button className="btn danger" onClick={() => rate('no')}>No</button>
            <button className="btn" onClick={() => rate('almost')}>Quasi</button>
            <button className="btn good" onClick={() => rate('all')}>Sì, tutti!</button>
          </div>
        </>
      ) : shown ? (
        <button className="btn primary wide big" onClick={next}>Avanti</button>
      ) : (
        <button className="btn primary wide big" onClick={reveal}><Icon name="eye" size={20} /> Scopri</button>
      )}
    </div>
  );
}

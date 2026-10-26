import { useEffect, useRef, useState } from 'react';
import { Icon } from '../components/Icon';
import { DishPic } from '../components/Ing';
import { DishViewer } from '../three/DishViewer';
import { hasWebGL } from '../three/thumbs';
import type { Dish } from '../lib/types';
import { useApp } from '../store';
import { mastery } from '../lib/mastery';
import { sfx, confetti } from '../lib/fx';
import { catOf } from '../lib/data';
import { cap } from '../lib/emoji';
import { norm, similarDish } from '../lib/questions';
import { Bar, DishBadge, Pips, TopBar } from '../components/ui';
import { Photo, RecipeView, Why } from '../components/Recipe';

export function Learn({ pool, onExit }: { pool: Dish[]; onExit: () => void }) {
  const app = useApp();
  const [queue, setQueue] = useState<Dish[]>(() =>
    [...pool].sort((a, b) => mastery(app.save.stats[a.id]) - mastery(app.save.stats[b.id]) || Math.random() - 0.5),
  );
  const [i, setI] = useState(0);
  const [flip, setFlip] = useState(false);
  const [known, setKnown] = useState(0);
  const [cards, setCards] = useState(0);
  const [retried, setRetried] = useState<string[]>([]);
  const tracked = useRef(false);
  const finished = i >= queue.length;

  useEffect(() => {
    if (finished && !tracked.current && cards > 0) {
      tracked.current = true;
      app.track({ cards });
    }
  }, [finished]); // eslint-disable-line react-hooks/exhaustive-deps

  const exit = () => {
    if (!tracked.current && cards > 0) {
      tracked.current = true;
      app.track({ cards });
    }
    onExit();
  };

  if (finished) {
    return (
      <div className="screen over">
        <div className="over-icon"><Icon name="book" size={56} /></div>
        <h1>Ripasso finito!</h1>
        <p className="muted c">Ora mettiti alla prova con un turno: ricordare sotto pressione fissa le ricette molto più che rileggerle.</p>
        <div className="stat-row">
          <div className="stat"><b>{known}</b><span>Lo sapevi</span></div>
          <div className="stat"><b>{retried.length}</b><span>Da rivedere</span></div>
          <div className="stat"><b>+{known * 3}</b><span>XP</span></div>
        </div>
        <div className="spacer" />
        <button className="btn primary wide" onClick={exit}>Torna alla home</button>
      </div>
    );
  }

  const dish = queue[i];
  const cat = catOf(dish.category);
  const st = app.save.stats[dish.id];
  const weak = new Set(Object.entries(st?.missed ?? {}).filter(([, n]) => n >= 1).map(([k]) => norm(k)));
  const sim = similarDish(dish, app.menu);
  const rate = (knew: boolean) => {
    sfx[knew ? 'ok' : 'bad']();
    // l'autovalutazione è meno affidabile di un ordine vero: non porta oltre la fase 2 e per FSRS vale poco
    app.record(dish.id, { grade: knew ? 3 : 1, cap: 2, severity: 1, weak: true, xp: knew ? 3 : 0 });
    setCards((c) => c + 1);
    if (knew) setKnown((k) => k + 1);
    else if (!retried.includes(dish.id)) {
      setRetried((r) => [...r, dish.id]);
      // ritorna dopo qualche scheda, non subito: il richiamo a distanza funziona meglio
      setQueue((q) => [...q.slice(0, i + 4), dish, ...q.slice(i + 4)]);
    }
    setFlip(false);
    setI(i + 1);
    if (i + 1 >= queue.length && knew) confetti(1);
  };

  return (
    <div className="screen play">
      <TopBar title="Ricettario" onExit={exit} right={<span className="xp-pill">{i + 1}/{queue.length}</span>} />
      <div className="progress"><Bar value={i / queue.length} color={cat.color} h={10} /></div>
      <div className="q-wrap center-v">
        <div className={`flip ${flip ? 'on' : ''}`} onClick={() => { sfx.tap(); setFlip((f) => !f); }}>
          <div className="face front" style={{ borderColor: cat.color, ['--cat' as string]: cat.color }}>
            <DishBadge dish={dish} />
            <div className="face-emoji"><DishPic dish={{ ingredients: [], category: dish.category }} /></div>
            <div className="face-name">{dish.name}</div>
            <div className="face-count">
              {dish.ingredients.map((_, k) => <i key={k} />)}
            </div>
            <div className="muted">{dish.ingredients.length} {dish.ingredients.length === 1 ? 'voce' : 'voci'}: elencale a mente, poi gira</div>
            <Pips box={st?.seen ? st.box : 0} />
          </div>
          <div className="face back" style={{ borderColor: cat.color }}>
            <div className="face-name sm">{dish.name}</div>
            {flip && hasWebGL() && <DishViewer key={dish.id + i} items={dish.ingredients} cat={dish.category} />}
            <Photo id={dish.id} className="sm" />
            <RecipeView dish={dish} state={(x) => (weak.has(norm(x)) ? 'miss' : '')} />
            {dish.ingredients.some((x) => weak.has(norm(x))) && <div className="muted sm">Tratteggiati: quelli che dimentichi più spesso</div>}
            <Why dish={dish} />
            {sim && (
              <div className="sim">
                <div className="sm"><Icon name="scale" size={15} /> Non confonderlo con <b>{sim.other.name}</b></div>
                {sim.onlyHere.length > 0 && <div className="sm">Solo qui: <b className="g">{sim.onlyHere.map(cap).join(', ')}</b></div>}
                {sim.onlyThere.length > 0 && <div className="sm">Solo lì: <b className="r">{sim.onlyThere.map(cap).join(', ')}</b></div>}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="rate">
        {flip ? (
          <>
            <button className="btn danger" onClick={() => rate(false)}>Da rivedere</button>
            <button className="btn good" onClick={() => rate(true)}>Lo sapevo!</button>
          </>
        ) : (
          <button className="btn primary wide" onClick={() => { sfx.tap(); setFlip(true); }}>Gira la scheda</button>
        )}
      </div>
    </div>
  );
}

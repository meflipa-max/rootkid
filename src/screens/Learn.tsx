import { useState } from 'react';
import type { Dish } from '../lib/types';
import { useApp } from '../store';
import { mastery } from '../lib/mastery';
import { sfx, confetti } from '../lib/fx';
import { catOf } from '../lib/data';
import { Bar, DishBadge, RecipeChips, TopBar } from '../components/ui';

export function Learn({ pool, onExit }: { pool: Dish[]; onExit: () => void }) {
  const app = useApp();
  const [queue, setQueue] = useState<Dish[]>(() =>
    [...pool].sort((a, b) => mastery(app.save.stats[a.id]) - mastery(app.save.stats[b.id]) || Math.random() - 0.5),
  );
  const [i, setI] = useState(0);
  const [flip, setFlip] = useState(false);
  const [known, setKnown] = useState(0);
  const [retried, setRetried] = useState<string[]>([]);

  if (i >= queue.length) {
    return (
      <div className="screen over">
        <div className="over-emoji">📚</div>
        <h1>Ripasso finito!</h1>
        <p className="muted c">Ora mettiti alla prova con l'allenamento: ricordare vale più che rileggere.</p>
        <div className="stat-row">
          <div className="stat"><b>{known}</b><span>Lo sapevi</span></div>
          <div className="stat"><b>{queue.length - known}</b><span>Da rivedere</span></div>
        </div>
        <div className="spacer" />
        <button className="btn primary wide" onClick={onExit}>Torna alla home</button>
      </div>
    );
  }

  const dish = queue[i];
  const cat = catOf(dish.category);
  const rate = (knew: boolean) => {
    sfx[knew ? 'ok' : 'bad']();
    app.record(dish.id, knew, [], knew ? 3 : 0);
    if (knew) setKnown((k) => k + 1);
    else if (!retried.includes(dish.id)) {
      setRetried((r) => [...r, dish.id]);
      setQueue((q) => [...q, dish]);
    }
    setFlip(false);
    setI(i + 1);
    if (i + 1 >= queue.length && knew && known + 1 === queue.length) confetti(1);
  };

  return (
    <div className="screen play">
      <TopBar title="Studia" onExit={onExit} right={<span className="xp-pill">{i + 1}/{queue.length}</span>} />
      <div className="progress"><Bar value={i / queue.length} color={cat.color} h={10} /></div>
      <div className="q-wrap center-v">
        <div className={`flip ${flip ? 'on' : ''}`} onClick={() => { sfx.tap(); setFlip((f) => !f); }}>
          <div className="face front" style={{ borderColor: cat.color }}>
            <DishBadge dish={dish} />
            <div className="face-emoji">{cat.emoji}</div>
            <div className="face-name">{dish.name}</div>
            <div className="muted">Cosa c'è dentro? Pensaci, poi tocca</div>
          </div>
          <div className="face back" style={{ borderColor: cat.color }}>
            <div className="face-name sm">{dish.name}</div>
            <RecipeChips dish={dish} />
          </div>
        </div>
      </div>
      <div className="rate">
        {flip ? (
          <>
            <button className="btn danger" onClick={() => rate(false)}>😵 Da rivedere</button>
            <button className="btn good" onClick={() => rate(true)}>😎 Lo sapevo!</button>
          </>
        ) : (
          <button className="btn primary wide" onClick={() => { sfx.tap(); setFlip(true); }}>Mostra ricetta</button>
        )}
      </div>
    </div>
  );
}

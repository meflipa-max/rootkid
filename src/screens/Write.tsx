import { useEffect, useRef, useState } from 'react';
import { Icon } from '../components/Icon';
import { DishPic } from '../components/Ing';
import type { Dish } from '../lib/types';
import { useApp } from '../store';
import { mastery } from '../lib/mastery';
import { confetti, sfx } from '../lib/fx';
import { catOf } from '../lib/data';
import { cap } from '../lib/emoji';
import { matchIngredient } from '../lib/pantry';
import { Bar, Chip, DishBadge, Pips, TopBar } from '../components/ui';
import { partsOf } from '../components/Recipe';

type Note = { text: string; kind: 'ok' | 'bad' | 'unknown' | 'dup' };

/**
 * Sfida scritta: vedi solo il nome del piatto e scrivi gli ingredienti a memoria.
 * È il ricordo puro (niente da riconoscere fra le tessere), quindi una risposta perfetta vale 2 tacche.
 * Gli errori di battitura si perdonano; un ingrediente vero ma sbagliato conta come errore,
 * una parola che il gioco non conosce no (potrebbe essere scritta male).
 */
export function Write({ pool, onExit }: { pool: Dish[]; onExit: () => void }) {
  const app = useApp();
  const [queue] = useState<Dish[]>(() => [...pool].sort((a, b) => mastery(app.save.stats[a.id]) - mastery(app.save.stats[b.id]) || Math.random() - 0.5));
  const universe = useRef([...new Set(app.menu.flatMap((d) => d.ingredients))]).current;
  const [i, setI] = useState(0);
  const [found, setFound] = useState<string[]>([]);
  const [wrong, setWrong] = useState<string[]>([]);
  const [note, setNote] = useState<Note | null>(null);
  const [text, setText] = useState('');
  const [done, setDone] = useState<null | { correct: boolean; from: number; to: number; held: boolean; inOrder: boolean }>(null);
  const [score, setScore] = useState({ perfect: 0, dishes: 0 });
  const tracked = useRef(false);
  const input = useRef<HTMLInputElement>(null);
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
        <div className="over-icon"><Icon name="brain" size={56} /></div>
        <h1>Sfida finita!</h1>
        <p className="muted c">Scrivere a memoria è l'allenamento più forte: quello che ricordi qui lo ricordi davvero.</p>
        <div className="stat-row">
          <div className="stat"><b>{score.perfect}/{score.dishes}</b><span>Perfetti</span></div>
          <div className="stat"><b>+{score.perfect * 10}</b><span>XP</span></div>
        </div>
        <div className="spacer" />
        <button className="btn primary wide big" onClick={onExit}>Torna alla home</button>
      </div>
    );
  }

  const dish = queue[i];
  const cat = catOf(dish.category);
  const left = dish.ingredients.filter((x) => !found.includes(x));
  const parts = partsOf(dish);

  const add = () => {
    const t = text.trim();
    if (!t || done) return;
    setText('');
    input.current?.focus();
    const hit = matchIngredient(t, dish.ingredients, universe);
    if (hit && found.includes(hit)) {
      sfx.tap();
      return setNote({ text: `${cap(hit)}: c'è già`, kind: 'dup' });
    }
    if (hit) {
      sfx.place(found.length + 1);
      const next = [...found, hit];
      setFound(next);
      setNote({ text: cap(hit), kind: 'ok' });
      if (next.length === dish.ingredients.length) finish(next, wrong);
      return;
    }
    const other = matchIngredient(t, universe);
    if (other) {
      sfx.bad();
      if (!wrong.includes(other)) setWrong([...wrong, other]);
      return setNote({ text: `${cap(other)} non va in questo piatto`, kind: 'bad' });
    }
    sfx.tap();
    setNote({ text: `Non conosco «${t}»: controlla come l'hai scritto`, kind: 'unknown' });
  };

  const finish = (f: string[], w: string[]) => {
    const missed = dish.ingredients.filter((x) => !f.includes(x));
    const correct = missed.length === 0 && w.length === 0;
    const r = app.record(dish.id, { grade: correct ? 4 : 1, missed, xp: correct ? 10 : 0, extra: w, severity: missed.length + w.length > 1 ? 2 : 1, step: 2 });
    // panini: scritti nell'ordine di montaggio, dal basso?
    const inOrder = correct && !!dish.ordered && f.every((x, k) => dish.ingredients.indexOf(x) === k);
    if (correct) {
      sfx.ok(2);
      confetti(0.6);
    } else sfx.bad();
    setScore((s) => ({ perfect: s.perfect + (correct ? 1 : 0), dishes: s.dishes + 1 }));
    setDone({ correct, from: r.prevBox, to: r.box, held: r.held, inOrder });
  };

  const next = () => {
    sfx.tap();
    setI(i + 1);
    setFound([]);
    setWrong([]);
    setNote(null);
    setText('');
    setDone(null);
  };

  return (
    <div className="screen play write">
      <TopBar title="Scrivi a memoria" onExit={() => { track(); onExit(); }} right={<span className="xp-pill">{i + 1}/{queue.length}</span>} />
      <div className="progress"><Bar value={i / queue.length} color={cat.color} h={10} /></div>
      <section className="card write-card" style={{ ['--cat' as string]: cat.color }}>
        <div className="write-h">
          <DishPic dish={dish} />
          <div>
            <DishBadge dish={dish} />
            <div className="face-name sm">{dish.name}</div>
          </div>
        </div>
        <div className="write-count">
          {done ? (done.correct ? 'Tutto giusto!' : 'Ecco la ricetta completa') : `${found.length} di ${dish.ingredients.length} ingredienti`}
        </div>
        {dish.ordered && <div className="muted sm"><Icon name="layers" size={14} /> Scrivili dal basso verso l'alto, come lo monti</div>}
        {parts.map((p) => (
          <div key={p.title ?? 'all'} className="rv-part">
            {p.title && parts.length > 1 && <div className="rv-h">{p.title}</div>}
            <div className={`chips ${dish.ordered ? 'stack' : ''}`}>
              {p.items.map((x) => {
                const k = dish.ingredients.indexOf(x);
                const num = dish.ordered ? <b className="num">{k + 1}</b> : null;
                return found.includes(x) ? <span key={x} className="chip-wrap">{num}<Chip text={x} state="ok" /></span> : done ? <span key={x} className="chip-wrap">{num}<Chip text={x} state="miss" /></span> : <span key={x} className="chip-wrap">{num}<span className="slot-empty" aria-label="ingrediente da trovare">?</span></span>;
              })}
            </div>
          </div>
        ))}
        {wrong.length > 0 && (
          <div className="chips">{wrong.map((x) => <Chip key={x} text={x} state="bad" />)}</div>
        )}
      </section>

      {done ? (
        <>
          <div className={`note ${done.correct ? '' : 'retry'}`}>
            <Pips box={done.to} from={done.from} />
            <span>
              {done.correct
                ? `${done.held ? 'Già fissato per oggi: torna domani per salire ancora.' : `Perfetto: +${done.to - done.from} ${done.to - done.from === 1 ? 'fase' : 'fasi'} di memoria.`}${done.inOrder ? ' E nell\'ordine di montaggio!' : ''}`
                : left.length ? `Ti mancava: ${left.map(cap).join(', ')}.` : 'Avevi messo anche ingredienti che non c\'entrano.'}
            </span>
          </div>
          <div className="spacer" />
          <button className="btn primary wide big" onClick={next}>{i + 1 < queue.length ? 'Avanti' : 'Vedi il risultato'}</button>
        </>
      ) : (
        <>
          <form className="write-form" onSubmit={(e) => { e.preventDefault(); add(); }}>
            <input
              ref={input}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Scrivi un ingrediente…"
              autoFocus
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              enterKeyHint="send"
              aria-label="Ingrediente"
            />
            <button className="btn primary" type="submit" disabled={!text.trim()}>Aggiungi</button>
          </form>
          {note && <div className={`write-note ${note.kind}`}>{note.kind === 'ok' ? <Icon name="check" size={18} /> : note.kind === 'bad' ? <Icon name="x" size={18} /> : <Icon name="help" size={18} />} {note.text}</div>}
          <div className="muted sm">Non servono maiuscole né accenti, e un piccolo errore di battitura va bene.</div>
          <div className="spacer" />
          <button className="btn ghost wide" onClick={() => finish(found, wrong)}>Non ricordo altro</button>
        </>
      )}
    </div>
  );
}

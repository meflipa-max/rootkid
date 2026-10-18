import { useState } from 'react';
import type { Q } from '../lib/questions';
import { norm } from '../lib/questions';
import { cap } from '../lib/emoji';
import { sfx } from '../lib/fx';
import { catOf } from '../lib/data';
import { Chip } from './ui';

export interface Result {
  correct: boolean;
  missed: string[];
}

export function QuestionView({ q, onReveal }: { q: Q; onReveal: (r: Result) => void }) {
  if (q.kind === 'build') return <Build q={q} onReveal={onReveal} />;
  return <Choice q={q} onReveal={onReveal} />;
}

function Build({ q, onReveal }: { q: Extract<Q, { kind: 'build' }>; onReveal: (r: Result) => void }) {
  const [sel, setSel] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const right = new Set(q.dish.ingredients.map(norm));
  const cat = catOf(q.dish.category);

  const toggle = (o: string) => {
    if (done) return;
    sfx.tap();
    setSel((s) => (s.includes(o) ? s.filter((x) => x !== o) : [...s, o]));
  };
  const submit = () => {
    setDone(true);
    const picked = new Set(sel.map(norm));
    const missed = q.dish.ingredients.filter((i) => !picked.has(norm(i)));
    const wrong = sel.filter((s) => !right.has(norm(s)));
    onReveal({ correct: missed.length === 0 && wrong.length === 0, missed });
  };

  return (
    <div className="q">
      <div className="q-tag">{q.dish.category === 'fritti' ? 'Quante porzioni?' : 'Componi il piatto'}</div>
      <div className="q-title" style={{ color: cat.color }}>
        {cat.emoji} {q.dish.name}
      </div>
      <div className="q-sub">
        Scegli <b>{q.dish.ingredients.length}</b> {q.dish.ingredients.length === 1 ? 'voce' : 'voci'} · selezionate {sel.length}
      </div>
      <div className="chips big">
        {q.options.map((o, k) => {
          const picked = sel.includes(o);
          const isRight = right.has(norm(o));
          let st = picked ? 'sel' : '';
          if (done) st = picked && isRight ? 'ok' : picked ? 'bad' : isRight ? 'miss' : 'dim';
          return <Chip key={o} text={o} state={st} onClick={() => toggle(o)} delay={k * 30} />;
        })}
      </div>
      {!done && (
        <button className="btn primary wide" disabled={!sel.length} onClick={submit}>
          Conferma
        </button>
      )}
    </div>
  );
}

function Choice({ q, onReveal }: { q: Exclude<Q, { kind: 'build' }>; onReveal: (r: Result) => void }) {
  const [picked, setPicked] = useState<string | null>(null);
  const cat = catOf(q.dish.category);

  const pick = (id: string, correct: boolean) => {
    if (picked) return;
    setPicked(id);
    onReveal({ correct, missed: !correct && q.kind === 'missing' ? [q.hidden] : [] });
  };
  const state = (id: string, correct: boolean) => (!picked ? '' : correct ? 'ok' : picked === id ? 'bad' : 'dim');

  if (q.kind === 'which') {
    return (
      <div className="q">
        <div className="q-tag">Che piatto è?</div>
        <div className="chips big center">
          {q.dish.ingredients.map((i, k) => (
            <Chip key={i + k} text={i} delay={k * 40} />
          ))}
        </div>
        <div className="opts">
          {q.options.map((o) => (
            <button key={o.id} className={`opt ${state(o.id, o.id === q.dish.id)}`} onClick={() => pick(o.id, o.id === q.dish.id)}>
              {catOf(o.category).emoji} {o.name}
            </button>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="q">
      <div className="q-tag">Cosa manca?</div>
      <div className="q-title" style={{ color: cat.color }}>
        {cat.emoji} {q.dish.name}
      </div>
      <div className="chips big center">
        {q.shown.map((i, k) => (
          <Chip key={i + k} text={i} />
        ))}
        <span className={`chip hole ${picked ? 'revealed' : ''}`}>{picked ? cap(q.hidden) : '❓'}</span>
      </div>
      <div className="opts">
        {q.options.map((o) => (
          <button key={o} className={`opt ${state(o, norm(o) === norm(q.hidden))}`} onClick={() => pick(o, norm(o) === norm(q.hidden))}>
            {cap(o)}
          </button>
        ))}
      </div>
    </div>
  );
}

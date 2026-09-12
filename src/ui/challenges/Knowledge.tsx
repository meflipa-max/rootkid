import React, { useState } from 'react';
import type { QuizChallenge, NetworkChallenge, EthicsChallenge } from '../../game/types';
import { ChProps, useCh, Brief, Finish, Hints } from './frame';

// ============ QUIZ ============
export function Quiz({ challenge, onDone }: ChProps<QuizChallenge>) {
  const { hintsUsed, useHint, done, finish, start } = useCh(challenge);
  const [idx, setIdx] = useState(0);
  const [sel, setSel] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [correct, setCorrect] = useState(0);
  const q = challenge.questions[idx];
  const last = idx === challenge.questions.length - 1;

  function answer(i: number) {
    if (answered) return;
    setSel(i);
    setAnswered(true);
    if (i === q.answer) setCorrect((c) => c + 1);
  }
  function next() {
    if (last) {
      const finalCorrect = correct;
      const pass = finalCorrect >= Math.ceil(challenge.questions.length * 0.6);
      finish(pass, { perfect: finalCorrect === challenge.questions.length && hintsUsed === 0 });
    } else {
      setIdx((i) => i + 1);
      setSel(null);
      setAnswered(false);
    }
  }

  return (
    <div className="chwrap">
      <Brief challenge={challenge} who="Quiz" />
      {!done && (
        <div className="card">
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
            <span className="dim">Domanda {idx + 1} / {challenge.questions.length}</span>
            <span className="tag green">✓ {correct}</span>
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 14 }}>{q.q}</div>
          {q.options.map((o, i) => {
            const cls = answered && i === q.answer ? 'correct' : answered && i === sel ? 'wrong' : sel === i ? 'sel' : '';
            return (
              <button key={i} className={'opt ' + cls} onClick={() => answer(i)} disabled={answered}>
                {o}
                {answered && i === q.answer && <span className="mk" style={{ color: 'var(--green)' }}>✓</span>}
              </button>
            );
          })}
          {answered && (
            <div className="learn fadein" style={{ marginTop: 10 }}>
              <b>{sel === q.answer ? '✓ Esatto.' : '✗ Non proprio.'}</b> {q.why}
            </div>
          )}
          {!answered && <Hints challenge={challenge} hintsUsed={hintsUsed} useHint={useHint} />}
          {answered && (
            <div className="row" style={{ marginTop: 12, justifyContent: 'flex-end' }}>
              <button className="btn primary" onClick={next}>{last ? 'Risultato' : 'Prossima →'}</button>
            </div>
          )}
        </div>
      )}
      {done && (
        <Finish
          challenge={challenge}
          done={done}
          hintsUsed={hintsUsed}
          extra={<div className="card" style={{ marginTop: 12 }}>Punteggio: <b className="mono">{correct}/{challenge.questions.length}</b> risposte corrette.</div>}
          onContinue={() => onDone({ success: done.success, hintsUsed, timeMs: Date.now() - start.current, perfect: done.perfect })}
        />
      )}
    </div>
  );
}

// ============ NETWORK ============
export function Network({ challenge, onDone }: ChProps<NetworkChallenge>) {
  if (challenge.pairs) return <Matching challenge={challenge} onDone={onDone} />;
  if (challenge.scan) return <ScanQ challenge={challenge} onDone={onDone} />;
  return <TrueFalse challenge={challenge} onDone={onDone} />;
}

function Matching({ challenge, onDone }: { challenge: NetworkChallenge; onDone: ChProps<NetworkChallenge>['onDone'] }) {
  const { hintsUsed, useHint, done, finish, start } = useCh(challenge);
  const pairs = challenge.pairs!;
  const [rights] = useState(() => [...pairs].sort(() => Math.random() - 0.5).map((p) => p.right));
  const [selLeft, setSelLeft] = useState<string | null>(null);
  const [matched, setMatched] = useState<Record<string, string>>({});
  const [bad, setBad] = useState<string | null>(null);

  function clickRight(r: string) {
    if (!selLeft || Object.values(matched).includes(r)) return;
    const correct = pairs.find((p) => p.left === selLeft)?.right === r;
    if (correct) {
      const nm = { ...matched, [selLeft]: r };
      setMatched(nm);
      setSelLeft(null);
      if (Object.keys(nm).length === pairs.length) finish(true, { perfect: hintsUsed === 0 });
    } else {
      setBad(r);
      setTimeout(() => setBad(null), 400);
    }
  }

  return (
    <div className="chwrap">
      <Brief challenge={challenge} who="Abbinamento" />
      <div className="card">
        <div className="dim" style={{ fontSize: 12, marginBottom: 10 }}>Seleziona a sinistra, poi il corrispondente a destra.</div>
        <div className="match">
          <div className="col">
            {pairs.map((p) => (
              <div key={p.left} className={'item ' + (matched[p.left] ? 'matched' : selLeft === p.left ? 'sel' : '')} onClick={() => !matched[p.left] && !done && setSelLeft(p.left)}>
                {p.left} {matched[p.left] && '→ ' + matched[p.left]}
              </div>
            ))}
          </div>
          <div className="col">
            {rights.map((r) => (
              <div key={r} className={'item ' + (Object.values(matched).includes(r) ? 'matched' : bad === r ? 'bad' : '')} onClick={() => !done && clickRight(r)}>
                {r}
              </div>
            ))}
          </div>
        </div>
        {!done && <Hints challenge={challenge} hintsUsed={hintsUsed} useHint={useHint} />}
      </div>
      {done && <Finish challenge={challenge} done={done} hintsUsed={hintsUsed} onContinue={() => onDone({ success: done.success, hintsUsed, timeMs: Date.now() - start.current, perfect: done.perfect })} />}
    </div>
  );
}

function ScanQ({ challenge, onDone }: { challenge: NetworkChallenge; onDone: ChProps<NetworkChallenge>['onDone'] }) {
  const { hintsUsed, useHint, done, finish, start } = useCh(challenge);
  const [sel, setSel] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const scan = challenge.scan!;
  function submit() {
    setChecked(true);
    finish(sel === scan.answer, { perfect: sel === scan.answer && hintsUsed === 0 });
  }
  return (
    <div className="chwrap">
      <Brief challenge={challenge} who="Scansione nmap" />
      <div className="mono" style={{ background: '#05090d', border: '1px solid var(--border2)', borderRadius: 8, padding: 12, fontSize: 13, marginBottom: 14 }}>
        {scan.lines.map((l, i) => <div key={i} style={{ color: i === 0 ? 'var(--text-dim)' : undefined }}>{l}</div>)}
      </div>
      <div style={{ fontWeight: 600, marginBottom: 10 }}>{scan.question}</div>
      {scan.options.map((o, i) => {
        const cls = checked && i === scan.answer ? 'correct' : checked && i === sel ? 'wrong' : sel === i ? 'sel' : '';
        return <button key={i} className={'opt ' + cls} disabled={done !== null} onClick={() => setSel(i)}>{o}</button>;
      })}
      {!done && (
        <>
          <div className="row" style={{ marginTop: 12 }}><button className="btn primary" onClick={submit} disabled={sel === null}>Conferma</button></div>
          <Hints challenge={challenge} hintsUsed={hintsUsed} useHint={useHint} />
        </>
      )}
      {done && <Finish challenge={challenge} done={done} hintsUsed={hintsUsed} extra={<div className="learn" style={{ marginTop: 10 }}>{scan.why}</div>} onContinue={() => onDone({ success: done.success, hintsUsed, timeMs: Date.now() - start.current, perfect: done.perfect })} />}
    </div>
  );
}

function TrueFalse({ challenge, onDone }: { challenge: NetworkChallenge; onDone: ChProps<NetworkChallenge>['onDone'] }) {
  const { hintsUsed, useHint, done, finish, start } = useCh(challenge);
  const qs = challenge.subnetQ!;
  const [ans, setAns] = useState<(boolean | null)[]>(() => qs.map(() => null));
  const [checked, setChecked] = useState(false);
  function submit() {
    setChecked(true);
    const allOk = qs.every((q, i) => ans[i] === q.answer);
    finish(allOk, { perfect: allOk && hintsUsed === 0 });
  }
  return (
    <div className="chwrap">
      <Brief challenge={challenge} who="Vero o Falso" />
      <div className="card">
        {qs.map((q, i) => (
          <div key={i} style={{ marginBottom: 14, paddingBottom: 12, borderBottom: i < qs.length - 1 ? '1px solid var(--border)' : 'none' }}>
            <div style={{ marginBottom: 8 }}>{i + 1}. {q.q}</div>
            <div className="row">
              <button className={'opt ' + (checked ? (q.answer ? 'correct' : ans[i] === true ? 'wrong' : '') : ans[i] === true ? 'sel' : '')} style={{ flex: 1, margin: 0 }} disabled={done !== null} onClick={() => setAns((a) => a.map((x, j) => (j === i ? true : x)))}>Vero</button>
              <button className={'opt ' + (checked ? (!q.answer ? 'correct' : ans[i] === false ? 'wrong' : '') : ans[i] === false ? 'sel' : '')} style={{ flex: 1, margin: 0 }} disabled={done !== null} onClick={() => setAns((a) => a.map((x, j) => (j === i ? false : x)))}>Falso</button>
            </div>
            {checked && <div className="dim" style={{ fontSize: 13, marginTop: 6 }}>{q.why}</div>}
          </div>
        ))}
        {!done && (
          <>
            <div className="row"><button className="btn primary" onClick={submit} disabled={ans.some((a) => a === null)}>Verifica</button></div>
            <Hints challenge={challenge} hintsUsed={hintsUsed} useHint={useHint} />
          </>
        )}
      </div>
      {done && <Finish challenge={challenge} done={done} hintsUsed={hintsUsed} onContinue={() => onDone({ success: done.success, hintsUsed, timeMs: Date.now() - start.current, perfect: done.perfect })} />}
    </div>
  );
}

// ============ ETHICS ============
export function Ethics({ challenge, onDone }: ChProps<EthicsChallenge>) {
  const { hintsUsed, useHint, done, finish, start } = useCh(challenge);
  const [pick, setPick] = useState<number | null>(null);
  const chosen = pick !== null ? challenge.choices[pick] : null;

  function choose(i: number) {
    if (pick !== null) return;
    setPick(i);
    const c = challenge.choices[i];
    const delta = c.kind === 'white' ? 3 : c.kind === 'grey' ? -1 : -4;
    // "successo" se non black hat (concetto: una scelta grey è accettabile ma non perfetta)
    finish(c.kind !== 'black', { perfect: c.kind === 'white' && hintsUsed === 0, ethicsDelta: delta });
  }

  const kindLabel = (k: string) => (k === 'white' ? '🕊️ Scelta etica' : k === 'grey' ? '⚠️ Zona grigia' : '☠️ Scelta sbagliata');
  const kindColor = (k: string) => (k === 'white' ? 'var(--green)' : k === 'grey' ? 'var(--yellow)' : 'var(--red)');

  return (
    <div className="chwrap">
      <Brief challenge={challenge} who="Dilemma etico" />
      <div className="card" style={{ borderLeft: '3px solid var(--pink)', background: 'rgba(255,107,157,0.05)' }}>
        <div style={{ fontSize: 15.5 }}>{challenge.scenario}</div>
      </div>
      <div style={{ marginTop: 14 }}>
        {challenge.choices.map((c, i) => {
          const cls = pick === null ? '' : pick === i ? (c.kind === 'white' ? 'correct' : 'wrong') : '';
          return (
            <button key={i} className={'opt ' + cls} onClick={() => choose(i)} disabled={pick !== null}>
              {c.text}
              {pick === i && <span className="mk" style={{ color: kindColor(c.kind) }}>{c.kind === 'white' ? '✓' : '✗'}</span>}
            </button>
          );
        })}
      </div>
      {chosen && (
        <div className="fadein" style={{ marginTop: 4 }}>
          <div className="card" style={{ borderLeft: `3px solid ${kindColor(chosen.kind)}` }}>
            <b style={{ color: kindColor(chosen.kind) }}>{kindLabel(chosen.kind)}</b>
            <div style={{ marginTop: 6 }}>{chosen.outcome}</div>
            <div className="dim" style={{ fontSize: 12, marginTop: 8 }}>
              Etica {chosen.kind === 'white' ? '+3' : chosen.kind === 'grey' ? '−1' : '−4'}
            </div>
          </div>
        </div>
      )}
      {!done && pick === null && <Hints challenge={challenge} hintsUsed={hintsUsed} useHint={useHint} />}
      {done && <Finish challenge={challenge} done={done} hintsUsed={hintsUsed} onContinue={() => onDone({ success: done.success, hintsUsed, timeMs: Date.now() - start.current, perfect: done.perfect, ethicsDelta: done.ethicsDelta })} />}
    </div>
  );
}

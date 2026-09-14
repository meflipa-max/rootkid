import React, { useState } from 'react';
import type { PhishingChallenge, LogsChallenge } from '../../game/types';
import { ChProps, useCh, Brief, Finish, Hints } from './frame';

// ============ PHISHING ============
export function Phishing({ challenge, onDone }: ChProps<PhishingChallenge>) {
  const { hintsUsed, useHint, done, finish, start } = useCh(challenge);
  const [verdict, setVerdict] = useState<boolean | null>(null);
  const [clue, setClue] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const e = challenge.email;

  function submit() {
    setChecked(true);
    const verdictOk = verdict === challenge.isPhishing;
    const clueOk = clue === challenge.clue;
    finish(verdictOk && clueOk, { perfect: verdictOk && clueOk && hintsUsed === 0 });
  }

  return (
    <div className="chwrap">
      <Brief challenge={challenge} who="Analisi email" />
      <div className="email">
        <div className="eh">
          <div className="from">{e.fromName} <span className="dim" style={{ fontWeight: 400, fontSize: 12 }}>· {e.date}</span></div>
          <div className="addr">&lt;{e.fromAddr}&gt;</div>
        </div>
        <div className="subj">{e.subject}</div>
        <div className="ebody">
          {e.body}
          {e.linkText && (
            <div>
              <span className="elink">{e.linkText}<span className="href">{e.linkHref}</span></span>
            </div>
          )}
          {e.attachment && <div className="attach">📎 {e.attachment}</div>}
        </div>
      </div>

      {!done && (
        <>
          <div className="dim" style={{ fontSize: 12, margin: '16px 0 8px' }}>1️⃣ Questa email è...</div>
          <div className="row">
            <button className={'opt ' + (checked ? (challenge.isPhishing ? 'correct' : verdict === true ? 'wrong' : '') : verdict === true ? 'sel' : '')} style={{ flex: 1 }} onClick={() => !checked && setVerdict(true)}>🎣 Phishing / truffa</button>
            <button className={'opt ' + (checked ? (!challenge.isPhishing ? 'correct' : verdict === false ? 'wrong' : '') : verdict === false ? 'sel' : '')} style={{ flex: 1 }} onClick={() => !checked && setVerdict(false)}>✅ Legittima</button>
          </div>

          <div className="dim" style={{ fontSize: 12, margin: '12px 0 8px' }}>2️⃣ Qual è l'indizio decisivo?</div>
          {challenge.clueOptions.map((c) => {
            const cls = checked && c === challenge.clue ? 'correct' : checked && c === clue ? 'wrong' : c === clue ? 'sel' : '';
            return <button key={c} className={'opt ' + cls} onClick={() => !checked && setClue(c)}>{c}</button>;
          })}

          <div className="row" style={{ marginTop: 12 }}>
            <button className="btn primary" onClick={submit} disabled={verdict === null || !clue}>Conferma verdetto</button>
          </div>
          <Hints challenge={challenge} hintsUsed={hintsUsed} useHint={useHint} />
        </>
      )}
      {done && <Finish challenge={challenge} done={done} hintsUsed={hintsUsed} onContinue={() => onDone({ success: done.success, hintsUsed, timeMs: Date.now() - start.current, perfect: done.perfect })} />}
    </div>
  );
}

// ============ LOGS ============
export function Logs({ challenge, onDone, tools }: ChProps<LogsChallenge>) {
  const { hintsUsed, useHint, done, finish, start } = useCh(challenge);
  const [answers, setAnswers] = useState<string[]>(() => challenge.questions.map(() => ''));
  const [filter, setFilter] = useState('');
  const [checked, setChecked] = useState(false);
  const hasSiem = tools.includes('siem');

  const norm = (s: string) => s.trim().toLowerCase();
  function isOk(i: number) {
    const q = challenge.questions[i];
    const a = norm(answers[i]);
    return a === norm(q.answer) || (q.accept ?? []).some((x) => norm(x) === a);
  }

  function submit() {
    setChecked(true);
    const allOk = challenge.questions.every((_, i) => isOk(i));
    finish(allOk, { perfect: allOk && hintsUsed === 0 });
  }

  const suspicious = (l: string) => /fail|error|401|500|denied|drop|deny|union|select|<script|\.\.\/|sudo|cron|4444|1337/i.test(l);
  const shown = filter ? challenge.lines.filter((l) => l.toLowerCase().includes(filter.toLowerCase())) : challenge.lines;

  return (
    <div className="chwrap">
      <Brief challenge={challenge} who="Analisi log" />
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="row" style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', justifyContent: 'space-between' }}>
          <span className="mono dim" style={{ fontSize: 12 }}>📄 {challenge.filename} · {challenge.lines.length} righe</span>
          <input className="inp mono" style={{ maxWidth: 200, padding: '4px 8px', fontSize: 12 }} placeholder="filtra (grep)..." value={filter} onChange={(e) => setFilter(e.target.value)} />
        </div>
        <div className="mono scrolltip" style={{ maxHeight: 260, overflowY: 'auto', fontSize: 12.5, padding: '8px 12px', background: '#05090d', lineHeight: 1.7 }}>
          {shown.map((l, i) => (
            <div key={i} style={{ color: hasSiem && suspicious(l) ? 'var(--orange)' : suspicious(l) ? '#c9d6e0' : '#8399a8', background: hasSiem && suspicious(l) ? 'rgba(255,158,100,0.07)' : undefined, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
              {l}
            </div>
          ))}
          {shown.length === 0 && <div className="dim">(nessuna riga corrisponde al filtro)</div>}
        </div>
      </div>

      {!done && (
        <>
          {challenge.questions.map((q, i) => (
            <div key={i} style={{ marginTop: 14 }}>
              <div style={{ marginBottom: 6, fontSize: 14 }}>{i + 1}. {q.q}</div>
              <div className="row">
                <input className="inp mono" style={{ maxWidth: 340, borderColor: checked ? (isOk(i) ? 'var(--green)' : 'var(--red)') : undefined }} value={answers[i]} onChange={(e) => setAnswers((a) => a.map((x, j) => (j === i ? e.target.value : x)))} placeholder="risposta..." />
                {checked && <span style={{ color: isOk(i) ? 'var(--green)' : 'var(--red)' }}>{isOk(i) ? '✓' : `✗ → ${q.answer}`}</span>}
              </div>
            </div>
          ))}
          <div className="row" style={{ marginTop: 14 }}>
            <button className="btn primary" onClick={submit} disabled={answers.some((a) => !a.trim())}>Invia analisi</button>
          </div>
          <Hints challenge={challenge} hintsUsed={hintsUsed} useHint={useHint} />
        </>
      )}
      {done && <Finish challenge={challenge} done={done} hintsUsed={hintsUsed} onContinue={() => onDone({ success: done.success, hintsUsed, timeMs: Date.now() - start.current, perfect: done.perfect })} />}
    </div>
  );
}

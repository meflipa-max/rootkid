import React, { useMemo, useState } from 'react';
import type { CipherChallenge, BinaryChallenge, PasswordChallenge } from '../../game/types';
import { ChProps, useCh, Brief, Finish, Hints } from './frame';
import { toyHash } from '../../game/rng';
import { Workbench } from './Workbench';

// ricava una chiave utilizzabile dal banco di lavoro a partire dal testo "chiave" della sfida
function workbenchKey(challenge: CipherChallenge): string {
  if (!challenge.key) return '';
  if (challenge.method === 'vigenere') return challenge.key.replace(/[^A-Za-z]/g, '');
  if (challenge.method === 'xor') {
    const hex = challenge.key.match(/0x([0-9a-fA-F]{1,2})/);
    if (hex) return '0x' + hex[1];
    const word = challenge.key.match(/^[A-Za-z]+$/) ? challenge.key : '';
    return word;
  }
  return '';
}

// ============ CIPHER ============
export function Cipher({ challenge, onDone, tools }: ChProps<CipherChallenge>) {
  const { hintsUsed, useHint, done, finish, start } = useCh(challenge);
  const [val, setVal] = useState('');
  const [tries, setTries] = useState(0);

  function check() {
    const norm = (s: string) => s.trim().toUpperCase().replace(/\s+/g, ' ');
    const ok = norm(val) === norm(challenge.plaintext);
    if (ok) finish(true, { perfect: hintsUsed === 0 && tries === 0 });
    else setTries((t) => t + 1);
  }

  return (
    <div className="chwrap">
      <Brief challenge={challenge} who="Messaggio intercettato" />
      <div className="card">
        <div className="dim" style={{ fontSize: 12, marginBottom: 6 }}>CIFRATO ({challenge.methodLabel}){challenge.key ? ` · chiave: ${challenge.key}` : ''}</div>
        <div className="mono" style={{ fontSize: 15, wordBreak: 'break-all', background: '#05090d', padding: 12, borderRadius: 8, border: '1px solid var(--border)' }}>
          {challenge.ciphertext}
        </div>
        {!done && (
          <>
            <div className="dim" style={{ fontSize: 12, margin: '14px 0 6px' }}>IL TUO TESTO IN CHIARO:</div>
            <input
              className="inp"
              value={val}
              autoFocus
              onChange={(e) => setVal(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && check()}
              placeholder="scrivi qui la decodifica..."
            />
            {tries > 0 && <div className="dim" style={{ color: 'var(--red)', fontSize: 13, marginTop: 8 }}>Non ancora giusto (tentativo {tries}). Apri il banco di lavoro qui sotto o usa un hint.</div>}
            <div className="row" style={{ marginTop: 12 }}>
              <button className="btn primary" onClick={check} disabled={!val.trim()}>Verifica</button>
              <button className="btn ghost sm" onClick={() => finish(false)}>Mi arrendo</button>
            </div>
            <Workbench
              ciphertext={challenge.ciphertext}
              method={challenge.method}
              suggestedKey={workbenchKey(challenge)}
              onUseResult={(t) => setVal(t)}
            />
            <Hints challenge={challenge} hintsUsed={hintsUsed} useHint={useHint} />
          </>
        )}
      </div>
      {done && (
        <Finish
          challenge={challenge}
          done={done}
          hintsUsed={hintsUsed}
          extra={<div className="card" style={{ marginTop: 12 }}><span className="dim">Testo in chiaro:</span> <b className="mono">{challenge.plaintext}</b></div>}
          onContinue={() => onDone({ success: done.success, hintsUsed, timeMs: Date.now() - start.current, perfect: done.perfect })}
        />
      )}
    </div>
  );
}

// ============ BINARY ============
export function Binary({ challenge, onDone }: ChProps<BinaryChallenge>) {
  const { hintsUsed, useHint, done, finish, start } = useCh(challenge);
  const [answers, setAnswers] = useState<string[]>(() => challenge.rounds.map(() => ''));
  const [checked, setChecked] = useState(false);

  const results = useMemo(
    () => challenge.rounds.map((r, i) => answers[i].trim().replace(/\s+/g, '') === r.answer.replace(/\s+/g, '')),
    [answers, challenge.rounds],
  );

  function submit() {
    setChecked(true);
    const allOk = results.every(Boolean);
    finish(allOk, { perfect: allOk && hintsUsed === 0 });
  }

  return (
    <div className="chwrap">
      <Brief challenge={challenge} who="Conversioni" />
      <div className="card">
        {challenge.rounds.map((r, i) => (
          <div key={i} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: i < challenge.rounds.length - 1 ? '1px solid var(--border)' : 'none' }}>
            <div style={{ marginBottom: 6 }}>
              {r.prompt} <b className="mono" style={{ color: 'var(--cyan)', fontSize: 16 }}>{r.value}</b>
            </div>
            <div className="row">
              <input
                className="inp mono"
                style={{ maxWidth: 240, borderColor: checked ? (results[i] ? 'var(--green)' : 'var(--red)') : undefined }}
                value={answers[i]}
                disabled={done !== null}
                placeholder={r.to === 'binario' ? '101010...' : r.to === 'char' ? 'un carattere' : 'numero'}
                onChange={(e) => setAnswers((a) => a.map((x, j) => (j === i ? e.target.value : x)))}
              />
              {checked && <span style={{ color: results[i] ? 'var(--green)' : 'var(--red)' }}>{results[i] ? '✓' : `✗ → ${r.answer}`}</span>}
            </div>
          </div>
        ))}
        {!done && (
          <>
            <div className="row" style={{ marginTop: 4 }}>
              <button className="btn primary" onClick={submit} disabled={answers.some((a) => !a.trim())}>Verifica tutte</button>
            </div>
            <Hints challenge={challenge} hintsUsed={hintsUsed} useHint={useHint} />
          </>
        )}
      </div>
      {done && <Finish challenge={challenge} done={done} hintsUsed={hintsUsed} onContinue={() => onDone({ success: done.success, hintsUsed, timeMs: Date.now() - start.current, perfect: done.perfect })} />}
    </div>
  );
}

// ============ PASSWORD ============
export function Password({ challenge, onDone, tools }: ChProps<PasswordChallenge>) {
  const { hintsUsed, useHint, done, finish, start } = useCh(challenge);

  if (challenge.mode === 'rank') return <PwRank challenge={challenge} onDone={onDone} tools={tools} ctx={{ hintsUsed, useHint, done, finish, start }} />;
  return <PwCrack challenge={challenge} onDone={onDone} tools={tools} ctx={{ hintsUsed, useHint, done, finish, start }} />;
}

type Ctx = ReturnType<typeof useCh>;

function PwRank({ challenge, onDone, ctx }: ChProps<PasswordChallenge> & { ctx: Ctx }) {
  const { hintsUsed, useHint, done, finish, start } = ctx;
  const [order, setOrder] = useState(() => challenge.passwords!.map((_, i) => i));
  const [checked, setChecked] = useState(false);

  function move(idx: number, dir: -1 | 1) {
    setOrder((o) => {
      const n = [...o];
      const t = idx + dir;
      if (t < 0 || t >= n.length) return n;
      [n[idx], n[t]] = [n[t], n[idx]];
      return n;
    });
  }
  function submit() {
    setChecked(true);
    // corretto se gli score sono non-decrescenti dall'alto (debole) al basso (forte)
    const scores = order.map((i) => challenge.passwords![i].score);
    let ok = true;
    for (let i = 1; i < scores.length; i++) if (scores[i] < scores[i - 1]) ok = false;
    finish(ok, { perfect: ok && hintsUsed === 0 });
  }

  const scoreColor = (s: number) => ['#ff5c5c', '#ff8a5c', '#ffd166', '#9fe060', '#3dff8f', '#3dff8f'][s];
  const scoreLabel = (s: number) => ['pessima', 'debole', 'media', 'buona', 'forte', 'fortissima'][s];

  return (
    <div className="chwrap">
      <Brief challenge={challenge} who="Audit password" />
      <div className="card">
        <div className="dim" style={{ fontSize: 12, marginBottom: 8 }}>DALLA PIÙ DEBOLE (alto) ALLA PIÙ FORTE (basso)</div>
        {order.map((pi, idx) => {
          const p = challenge.passwords![pi];
          return (
            <div className="pwrow" key={pi}>
              <span className="grip">≡</span>
              <span style={{ flex: 1, wordBreak: 'break-all' }}>{p.pw}</span>
              {checked && <span className="tag" style={{ color: scoreColor(p.score), borderColor: scoreColor(p.score) }}>{scoreLabel(p.score)}</span>}
              {!done && (
                <span className="arrows">
                  <button onClick={() => move(idx, -1)} disabled={idx === 0}>▲</button>
                  <button onClick={() => move(idx, 1)} disabled={idx === order.length - 1}>▼</button>
                </span>
              )}
            </div>
          );
        })}
        {!done && (
          <>
            <div className="row" style={{ marginTop: 8 }}>
              <button className="btn primary" onClick={submit}>Verifica ordine</button>
            </div>
            <Hints challenge={challenge} hintsUsed={hintsUsed} useHint={useHint} />
          </>
        )}
      </div>
      {done && <Finish challenge={challenge} done={done} hintsUsed={hintsUsed} onContinue={() => onDone({ success: done.success, hintsUsed, timeMs: Date.now() - start.current, perfect: done.perfect })} />}
    </div>
  );
}

function PwCrack({ challenge, onDone, tools, ctx }: ChProps<PasswordChallenge> & { ctx: Ctx }) {
  const { hintsUsed, useHint, done, finish, start } = ctx;
  const [revealed, setRevealed] = useState<Record<string, string>>({});
  const [picked, setPicked] = useState<string | null>(null);
  const hasHashcat = tools.includes('hashcat');

  function computeHash(pw: string) {
    setRevealed((r) => ({ ...r, [pw]: toyHash(pw) }));
  }
  function pick(pw: string) {
    setPicked(pw);
    const ok = pw === challenge.answer;
    finish(ok, { perfect: ok && hintsUsed === 0 });
  }

  return (
    <div className="chwrap">
      <Brief challenge={challenge} who="Password cracking" />
      <div className="card">
        <div className="dim" style={{ fontSize: 12 }}>HASH RUBATO</div>
        <div className="mono" style={{ background: '#05090d', padding: 10, borderRadius: 8, border: '1px solid var(--border)', wordBreak: 'break-all', color: 'var(--orange)' }}>{challenge.hash}</div>
        <div className="dim" style={{ fontSize: 13, margin: '14px 0 8px' }}>
          Dizionario di candidati. {hasHashcat ? '🔓 hashcat calcola l\'hash di ogni candidato automaticamente.' : 'Clicca "calcola hash" su ognuno e confronta con quello rubato, poi scegli.'}
        </div>
        {challenge.candidates!.map((pw) => {
          const h = hasHashcat ? toyHash(pw) : revealed[pw];
          const match = h === challenge.hash;
          return (
            <div className="pwrow" key={pw} style={{ borderColor: done && pw === challenge.answer ? 'var(--green)' : picked === pw && !match ? 'var(--red)' : undefined }}>
              <span style={{ minWidth: 120, wordBreak: 'break-all' }}>{pw}</span>
              {h ? (
                <span className="mono" style={{ fontSize: 11, color: match ? 'var(--green)' : 'var(--text-dim)', wordBreak: 'break-all', flex: 1 }}>
                  {h.slice(0, 24)}… {match && '✓ MATCH'}
                </span>
              ) : (
                <button className="btn sm ghost" onClick={() => computeHash(pw)}>calcola hash</button>
              )}
              {!done && (h || hasHashcat) && (
                <button className="btn sm" onClick={() => pick(pw)}>questa</button>
              )}
            </div>
          );
        })}
        {!done && <Hints challenge={challenge} hintsUsed={hintsUsed} useHint={useHint} />}
      </div>
      {done && (
        <Finish
          challenge={challenge}
          done={done}
          hintsUsed={hintsUsed}
          extra={<div className="card" style={{ marginTop: 12 }}>La password era: <b className="mono" style={{ color: 'var(--green)' }}>{challenge.answer}</b></div>}
          onContinue={() => onDone({ success: done.success, hintsUsed, timeMs: Date.now() - start.current, perfect: done.perfect })}
        />
      )}
    </div>
  );
}

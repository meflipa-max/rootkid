import React, { useState } from 'react';
import type { CodeReviewChallenge, WebLabChallenge } from '../../game/types';
import { ChProps, useCh, Brief, Finish, Hints } from './frame';

// ============ CODE REVIEW ============
export function CodeReview({ challenge, onDone, tools }: ChProps<CodeReviewChallenge>) {
  const { hintsUsed, useHint, done, finish, start } = useCh(challenge);
  const [selLine, setSelLine] = useState<number | null>(null);
  const [selType, setSelType] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const hasBurp = tools.includes('burp');

  function submit() {
    setChecked(true);
    const ok = selLine === challenge.vulnLine && selType === challenge.vulnType;
    finish(ok, { perfect: ok && hintsUsed === 0 });
  }

  return (
    <div className="chwrap">
      <Brief challenge={challenge} who="Code review" />
      <div className="dim" style={{ fontSize: 12, marginBottom: 6 }}>
        {challenge.language.toUpperCase()} · 1️⃣ Clicca la riga vulnerabile {hasBurp && <span className="tag green">🕷️ Burp evidenzia gli input non validati</span>}
      </div>
      <div className="codebox">
        {challenge.lines.map((ln, i) => {
          const cls =
            checked && i === challenge.vulnLine ? 'correct' : checked && i === selLine ? 'wrong' : i === selLine ? 'sel' : '';
          const highlight = hasBurp && /req\.|_POST|_GET|_FILES|request\.|input|params|query|body|argv/.test(ln) && !checked;
          return (
            <div className={'cl ' + cls} key={i} onClick={() => !done && setSelLine(i)}>
              <span className="ln">{i + 1}</span>
              <span className="code" style={highlight ? { background: 'rgba(255,158,100,0.08)' } : undefined}>{ln || ' '}</span>
            </div>
          );
        })}
      </div>

      <div className="dim" style={{ fontSize: 12, margin: '16px 0 8px' }}>2️⃣ Che tipo di vulnerabilità è?</div>
      {challenge.options.map((o) => {
        const cls = checked && o === challenge.vulnType ? 'correct' : checked && o === selType ? 'wrong' : o === selType ? 'sel' : '';
        return (
          <button key={o} className={'opt ' + cls} disabled={done !== null} onClick={() => setSelType(o)}>
            {o}
            {checked && o === challenge.vulnType && <span className="mk" style={{ color: 'var(--green)' }}>✓</span>}
          </button>
        );
      })}

      {!done && (
        <>
          <div className="row" style={{ marginTop: 12 }}>
            <button className="btn primary" onClick={submit} disabled={selLine === null || !selType}>Conferma analisi</button>
          </div>
          <Hints challenge={challenge} hintsUsed={hintsUsed} useHint={useHint} />
        </>
      )}
      {done && (
        <Finish
          challenge={challenge}
          done={done}
          hintsUsed={hintsUsed}
          extra={<div className="card" style={{ marginTop: 12 }}><b style={{ color: 'var(--green)' }}>🔧 Correzione:</b><br />{challenge.fix}</div>}
          onContinue={() => onDone({ success: done.success, hintsUsed, timeMs: Date.now() - start.current, perfect: done.perfect })}
        />
      )}
    </div>
  );
}

// ============ WEB LAB ============
const KIND_LABEL: Record<string, string> = { sqli: 'SQL Injection', xss: 'Cross-Site Scripting', idor: 'IDOR', traversal: 'Path Traversal' };

export function WebLab({ challenge, onDone, tools }: ChProps<WebLabChallenge>) {
  const { hintsUsed, useHint, done, finish, start } = useCh(challenge);
  const [phase, setPhase] = useState<'exploit' | 'fix'>('exploit');
  const [payload, setPayload] = useState('');
  const [exploited, setExploited] = useState(false);
  const [msg, setMsg] = useState('');
  const [selFix, setSelFix] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);

  // semplice verifica del payload per tipo
  function tryExploit() {
    const p = payload.toLowerCase();
    let ok = false;
    if (challenge.kind === 'sqli') ok = /('|--|\bor\b|=)/.test(p) && /(or|'|=)/.test(p);
    else if (challenge.kind === 'xss') ok = /<\s*(script|img|svg|iframe|body)|onerror|onload|alert\(/.test(p);
    else if (challenge.kind === 'idor') ok = /\d/.test(p) || p.includes('id=');
    else if (challenge.kind === 'traversal') ok = p.includes('../') || p.includes('..%2f') || p.includes('etc/passwd');
    if (ok) {
      setExploited(true);
      setMsg('🔓 Exploit riuscito! La vulnerabilità è confermata. Ora proponi la correzione.');
    } else {
      setMsg('❌ Il payload non ha funzionato. Guarda l\'hint o riprova.');
    }
  }

  function skipExploit() {
    setExploited(true);
    setMsg('Hai saltato l\'exploit. Procedi alla correzione.');
    useHint();
  }

  function submitFix() {
    setChecked(true);
    const correct = challenge.fixOptions[selFix!].correct;
    finish(correct && exploited, { perfect: correct && exploited && hintsUsed === 0 });
  }

  return (
    <div className="chwrap">
      <Brief challenge={challenge} who={`Web lab · ${KIND_LABEL[challenge.kind]}`} />

      <div className="card">
        <div className="dim" style={{ fontSize: 12, marginBottom: 6 }}>CODICE / ENDPOINT VULNERABILE (ambiente di test autorizzato)</div>
        <div className="mono" style={{ background: '#05090d', padding: 12, borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, wordBreak: 'break-all' }}>{challenge.site}</div>
      </div>

      {!exploited && !done && (
        <div className="card" style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>1️⃣ Sfrutta la vulnerabilità</div>
          <div className="dim" style={{ fontSize: 13, marginBottom: 8 }}>
            {challenge.kind === 'sqli' && 'Inserisci un payload nel campo "utente" che renda vera la condizione del login.'}
            {challenge.kind === 'xss' && 'Inserisci un payload nel commento che esegua del codice JavaScript.'}
            {challenge.kind === 'idor' && 'Inserisci nell\'URL un id diverso dal tuo per accedere a un\'altra risorsa.'}
            {challenge.kind === 'traversal' && 'Inserisci un percorso che esca dalla cartella e legga un file di sistema.'}
          </div>
          <input className="inp mono" autoFocus value={payload} onChange={(e) => setPayload(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && tryExploit()} placeholder={
            challenge.kind === 'sqli' ? "es: ' OR '1'='1" : challenge.kind === 'xss' ? 'es: <img src=x onerror=alert(1)>' : challenge.kind === 'traversal' ? 'es: ../../etc/passwd' : 'es: id=102'
          } />
          {msg && <div style={{ marginTop: 10, color: exploited ? 'var(--green)' : 'var(--red)' }}>{msg}</div>}
          <div className="row" style={{ marginTop: 12 }}>
            <button className="btn primary" onClick={tryExploit} disabled={!payload.trim()}>Invia payload</button>
            <button className="btn ghost sm" onClick={skipExploit}>Non ci riesco, salta (usa hint)</button>
          </div>
          <Hints challenge={challenge} hintsUsed={hintsUsed} useHint={useHint} />
        </div>
      )}

      {exploited && !done && (
        <div className="card fadein" style={{ marginTop: 12 }}>
          {msg && <div style={{ color: 'var(--green)', marginBottom: 10 }}>{msg}</div>}
          <div style={{ fontWeight: 700, marginBottom: 8 }}>2️⃣ Scegli la correzione giusta</div>
          {challenge.fixOptions.map((f, i) => {
            const cls = checked && f.correct ? 'correct' : checked && i === selFix ? 'wrong' : i === selFix ? 'sel' : '';
            return (
              <button key={i} className={'opt mono ' + cls} style={{ fontSize: 12.5 }} onClick={() => setSelFix(i)} disabled={checked}>
                {f.code}
              </button>
            );
          })}
          <div className="row" style={{ marginTop: 12 }}>
            <button className="btn primary" onClick={submitFix} disabled={selFix === null}>Applica correzione</button>
          </div>
          <Hints challenge={challenge} hintsUsed={hintsUsed} useHint={useHint} />
        </div>
      )}

      {done && (
        <Finish
          challenge={challenge}
          done={done}
          hintsUsed={hintsUsed}
          extra={
            selFix !== null ? (
              <div className="card" style={{ marginTop: 12 }}>
                <b>La correzione corretta:</b>
                <div className="mono" style={{ marginTop: 6, color: 'var(--green)', fontSize: 13 }}>{challenge.fixOptions.find((f) => f.correct)?.code}</div>
                <div className="dim" style={{ marginTop: 6, fontSize: 13 }}>{challenge.fixOptions.find((f) => f.correct)?.why}</div>
              </div>
            ) : undefined
          }
          onContinue={() => onDone({ success: done.success, hintsUsed, timeMs: Date.now() - start.current, perfect: done.perfect })}
        />
      )}
    </div>
  );
}

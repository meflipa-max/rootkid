import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { TerminalChallenge } from '../../game/types';
import { ChProps, useCh, Brief, Finish } from './frame';
import { initShell, execCommand, tryPassword, prompt, ShellState, ShellLine } from '../../game/terminal/shell';

interface Printed extends ShellLine {
  ps?: string; // prompt shown before command
}

export default function Terminal({ challenge, onDone, tools }: ChProps<TerminalChallenge>) {
  const { hintsUsed, useHint, done, finish, start } = useCh(challenge);
  const [state, setState] = useState<ShellState>(() =>
    initShell(challenge.hosts, challenge.startHost, challenge.flag, {}),
  );
  const [lines, setLines] = useState<Printed[]>([
    { text: `Connesso a ${challenge.startHost}. Digita "help" per i comandi, "hint" per un aiuto.`, kind: 'info' },
  ]);
  const [input, setInput] = useState('');
  const [pwPrompt, setPwPrompt] = useState<{ user: string; ip: string } | null>(null);
  const [histIdx, setHistIdx] = useState(-1);
  const outRef = useRef<HTMLDivElement>(null);
  const inRef = useRef<HTMLInputElement>(null);

  const hintCount = useRef(0);

  useEffect(() => {
    outRef.current?.scrollTo({ top: outRef.current.scrollHeight });
  }, [lines]);
  useEffect(() => {
    inRef.current?.focus();
  }, [done]);

  const ps = useMemo(() => prompt(state), [state]);

  function push(newLines: ShellLine[], withPrompt?: string, cmd?: string) {
    setLines((prev) => {
      const arr = [...prev];
      if (cmd !== undefined) arr.push({ text: cmd, kind: 'cmd', ps: withPrompt });
      for (const l of newLines) arr.push(l);
      return arr;
    });
  }

  function run(raw: string) {
    if (pwPrompt) {
      // trattiamo l'input come password
      const res = tryPassword(state, pwPrompt.user, pwPrompt.ip, raw);
      setState(res.state);
      setLines((prev) => [...prev, { text: '•'.repeat(Math.max(3, raw.length)), kind: 'cmd', ps: `${pwPrompt.user}@${pwPrompt.ip}'s password:` }, ...res.lines]);
      setPwPrompt(null);
      return;
    }
    const promptStr = ps;
    const res = execCommand(state, raw, () => {
      const h = challenge.hints[Math.min(hintCount.current, challenge.hints.length - 1)];
      hintCount.current++;
      if (hintCount.current <= challenge.hints.length) useHint();
      return h;
    });
    if (res.clear) {
      setLines([]);
      setState(res.state);
      return;
    }
    push(res.lines, promptStr, raw);
    setState(res.state);
    if (res.awaitPassword) setPwPrompt(res.awaitPassword);
    if (res.solved) {
      setTimeout(() => finish(true, { perfect: hintsUsed === 0 && hintCount.current === 0 }), 350);
    }
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      const val = input;
      setInput('');
      setHistIdx(-1);
      run(val);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const cmds = state.history.filter(Boolean);
      if (!cmds.length) return;
      const ni = histIdx < 0 ? cmds.length - 1 : Math.max(0, histIdx - 1);
      setHistIdx(ni);
      setInput(cmds[ni]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const cmds = state.history.filter(Boolean);
      if (histIdx < 0) return;
      const ni = histIdx + 1;
      if (ni >= cmds.length) { setHistIdx(-1); setInput(''); }
      else { setHistIdx(ni); setInput(cmds[ni]); }
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      setLines([]);
    }
  }

  return (
    <div className="chwrap" style={{ maxWidth: 920, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Brief challenge={challenge} who="Laboratorio" />
      <div className="terminal" style={{ minHeight: 340, flex: 1 }} onClick={() => inRef.current?.focus()}>
        <div className="titlebar">
          <span className="dot" style={{ background: '#ff5f56' }} />
          <span className="dot" style={{ background: '#ffbd2e' }} />
          <span className="dot" style={{ background: '#27c93f' }} />
          <span className="dim" style={{ marginLeft: 8, fontSize: 12 }}>
            {state.hosts[state.current].user}@{state.current} — bash
          </span>
        </div>
        <div className="out scrolltip" ref={outRef}>
          {lines.map((l, i) => (
            <div className={'line ' + l.kind} key={i}>
              {l.ps && <span className="ps">{l.ps} </span>}
              {l.text}
            </div>
          ))}
        </div>
        {!done && (
          <div className="inputrow">
            <span className="ps">{pwPrompt ? `${pwPrompt.user}@${pwPrompt.ip}'s password:` : ps}</span>
            <input
              ref={inRef}
              value={input}
              type={pwPrompt ? 'password' : 'text'}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKey}
              placeholder={lines.length <= 1 ? 'prova: ls' : ''}
            />
          </div>
        )}
      </div>
      {!done && (
        <div className="row" style={{ marginTop: 10, justifyContent: 'space-between' }}>
          <span className="dim" style={{ fontSize: 12 }}>Scrivi <span className="mono">hint</span> nel terminale per un aiuto · ↑ per i comandi precedenti</span>
          <button className="btn sm ghost" onClick={() => { finish(false); }}>
            Mi arrendo
          </button>
        </div>
      )}
      {done && <Finish challenge={challenge} done={done} hintsUsed={Math.max(hintsUsed, hintCount.current)} onContinue={() => onDone({ success: done.success, hintsUsed: Math.max(hintsUsed, hintCount.current), timeMs: Date.now() - start.current, perfect: done.perfect })} />}
    </div>
  );
}

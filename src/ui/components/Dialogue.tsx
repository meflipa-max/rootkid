import React, { useEffect, useRef, useState } from 'react';
import { Pixels } from '../art/pixel';
import { FACE, Npc } from '../../game/content/npcs';

export function NpcPortrait({ npc, px = 5 }: { npc: Npc; px?: number }) {
  return (
    <div className="npc-face" style={{ borderColor: npc.color }}>
      <Pixels map={FACE} palette={npc.palette} px={px} />
    </div>
  );
}

export interface Choice {
  label: string;
  icon?: string;
  onPick: () => void;
  hint?: string;
  disabled?: boolean;
}

/** Finestra di dialogo in stile RPG: ritratto, testo a macchina da scrivere, scelte. */
export function Dialogue({
  npc,
  lines,
  choices,
  onClose,
}: {
  npc: Npc;
  lines: string[];
  choices: Choice[];
  onClose: () => void;
}) {
  const [li, setLi] = useState(0);
  const [shown, setShown] = useState('');
  const [typing, setTyping] = useState(true);
  const idxRef = useRef(0);

  const current = lines[li] ?? '';
  const last = li >= lines.length - 1;

  useEffect(() => {
    setShown('');
    setTyping(true);
    idxRef.current = 0;
    const id = setInterval(() => {
      idxRef.current += 2;
      setShown(current.slice(0, idxRef.current));
      if (idxRef.current >= current.length) {
        clearInterval(id);
        setTyping(false);
      }
    }, 18);
    return () => clearInterval(id);
  }, [current]);

  function advance() {
    if (typing) {
      setShown(current);
      setTyping(false);
      return;
    }
    if (!last) setLi((i) => i + 1);
  }

  return (
    <div className="overlay dlg-overlay" onClick={onClose}>
      <div className="dlg" onClick={(e) => e.stopPropagation()}>
        <div className="dlg-head">
          <NpcPortrait npc={npc} />
          <div style={{ minWidth: 0 }}>
            <div className="dlg-name" style={{ color: npc.color }}>{npc.name}</div>
            <div className="dlg-role">{npc.role}</div>
          </div>
          <button className="btn sm ghost" style={{ marginLeft: 'auto' }} onClick={onClose}>✕</button>
        </div>

        <div className="dlg-body" onClick={advance}>
          {shown}
          {typing && <span className="cursor-blink">▌</span>}
          {!typing && !last && <span className="dlg-next">▼</span>}
        </div>

        {!typing && last ? (
          <div className="dlg-choices">
            {choices.map((c, i) => (
              <button
                key={i}
                className={'dlg-choice' + (c.disabled ? ' off' : '')}
                disabled={c.disabled}
                onClick={c.onPick}
              >
                <span style={{ fontSize: 17 }}>{c.icon ?? '▸'}</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <b>{c.label}</b>
                  {c.hint && <span className="dim" style={{ display: 'block', fontSize: 11.5 }}>{c.hint}</span>}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="dlg-hint">clicca per continuare</div>
        )}
      </div>
    </div>
  );
}

import React from 'react';

export function Diff({ n }: { n: number }) {
  return (
    <span className="diff" title={`Difficoltà ${n}/5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <i key={i} className={i <= n ? 'on' : ''} />
      ))}
    </span>
  );
}

export function Bar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="skillbar">
      <i style={{ width: `${Math.round(pct * 100)}%`, background: color }} />
    </div>
  );
}

export function Modal({ children, onClose, wide }: { children: React.ReactNode; onClose?: () => void; wide?: boolean }) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className={'modal' + (wide ? ' wide' : '')} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

export function HintPanel({ hints, used, onUse }: { hints: string[]; used: number; onUse: () => void }) {
  return (
    <div className="hintbox">
      {used < hints.length && (
        <button className="btn sm ghost" onClick={onUse}>
          💡 Suggerimento ({used}/{hints.length})
        </button>
      )}
      {hints.slice(0, used).map((h, i) => (
        <div className="hint" key={i}>
          {h}
        </div>
      ))}
    </div>
  );
}

export function Learn({ text }: { text: string }) {
  return (
    <div className="learn">
      <b>📚 Cosa hai imparato:</b> {text}
    </div>
  );
}

export function GlossaryToast({ ids }: { ids: string[] }) {
  if (!ids.length) return null;
  return (
    <div className="row" style={{ marginTop: 10 }}>
      {ids.map((id) => (
        <span className="tag green" key={id}>
          + glossario
        </span>
      ))}
    </div>
  );
}

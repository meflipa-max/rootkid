import React from 'react';
import type { ChallengeType } from '../../game/types';
import { getPrimer } from '../../game/content/primers';

export function PrimerView({
  type,
  onStart,
  firstTime,
  startLabel,
}: {
  type: ChallengeType;
  onStart: () => void;
  firstTime?: boolean;
  startLabel?: string;
}) {
  const p = getPrimer(type);
  return (
    <div className="chwrap fadein" style={{ maxWidth: 780 }}>
      <div style={{ textAlign: 'center', marginBottom: 10 }}>
        <div style={{ fontSize: 44 }}>{p.icon}</div>
        {firstTime && <div className="tag green" style={{ marginBottom: 6 }}>Nuovo tipo di sfida</div>}
        <h1 className="h1" style={{ margin: '4px 0' }}>{p.title}</h1>
        <p className="dim" style={{ fontSize: 12 }}>Mini-lezione · leggi e poi prova. Potrai riaprirla dal pulsante “?”.</p>
      </div>

      <div className="card" style={{ borderLeft: '3px solid var(--cyan)' }}>
        <b style={{ color: 'var(--cyan)' }}>Cos'è</b>
        <p style={{ margin: '6px 0 0', fontSize: 14.5, lineHeight: 1.6 }}>{p.what}</p>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <b style={{ color: 'var(--green)' }}>Come si affronta questa sfida</b>
        <ol style={{ margin: '8px 0 0', paddingLeft: 20, fontSize: 14, lineHeight: 1.7 }}>
          {p.how.map((h, i) => (
            <li key={i}>{h}</li>
          ))}
        </ol>
      </div>

      {p.commands && (
        <div className="card" style={{ marginTop: 12 }}>
          <b style={{ color: 'var(--yellow)' }}>Prontuario comandi</b>
          <div style={{ marginTop: 8, display: 'grid', gap: 4 }}>
            {p.commands.map((c, i) => (
              <div key={i} className="row" style={{ gap: 10, alignItems: 'baseline', flexWrap: 'nowrap' }}>
                <code className="tag" style={{ color: 'var(--green)', whiteSpace: 'nowrap', minWidth: 130 }}>{c.cmd}</code>
                <span className="dim" style={{ fontSize: 13 }}>{c.desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {p.example && (
        <div className="card" style={{ marginTop: 12 }}>
          <b style={{ color: 'var(--purple)' }}>{p.example.label}</b>
          <div className="mono" style={{ marginTop: 8, background: '#05090d', border: '1px solid var(--border)', borderRadius: 8, padding: 12, fontSize: 12.5, lineHeight: 1.7, overflowX: 'auto' }}>
            {p.example.lines.map((l, i) => (
              <div key={i} style={{ color: l.cls === 'cmd' ? 'var(--text)' : l.cls === 'ok' ? 'var(--green)' : l.cls === 'dim' ? 'var(--text-dim)' : '#9fc7b3', whiteSpace: 'pre-wrap' }}>
                {l.t}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="learn" style={{ marginTop: 12 }}>
        <b>🌍 Nel mondo reale:</b> {p.realworld}
      </div>

      <div className="row" style={{ marginTop: 18, justifyContent: 'flex-end' }}>
        <button className="btn primary" onClick={onStart} autoFocus>
          {startLabel ?? 'Ho capito, iniziamo →'}
        </button>
      </div>
    </div>
  );
}

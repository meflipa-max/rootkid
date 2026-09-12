import React, { useEffect } from 'react';
import type { SaveState } from '../../game/types';

const KIND_ICON: Record<string, string> = { mentor: '🧑‍🏫', story: '📨', system: '⚙️', offer: '💼' };

export function Inbox({ save, mutate }: { save: SaveState; mutate: (fn: (s: SaveState) => void) => void }) {
  useEffect(() => {
    // segna tutti come letti all'apertura
    if (save.inbox.some((m) => !m.read)) {
      mutate((s) => { s.inbox.forEach((m) => (m.read = true)); });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="content">
      <div className="wrap">
        <h1 className="h1">📬 Posta</h1>
        <p className="sub">Messaggi dal tuo mentore, dai datori di lavoro e dal sistema. Qui arrivano le offerte di lavoro e gli obiettivi sbloccati.</p>
        {save.inbox.length === 0 && <div className="empty">Nessun messaggio.</div>}
        {save.inbox.map((m) => (
          <div className="card" key={m.id} style={{ marginBottom: 10, borderLeft: `3px solid ${m.kind === 'offer' ? 'var(--green)' : m.kind === 'mentor' ? 'var(--cyan)' : 'var(--border2)'}` }}>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <b>{KIND_ICON[m.kind] ?? '✉️'} {m.subject}</b>
              <span className="dim" style={{ fontSize: 11 }}>{new Date(m.ts).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="dim" style={{ fontSize: 12, marginBottom: 6 }}>da {m.from}</div>
            <div style={{ fontSize: 14, whiteSpace: 'pre-wrap' }}>{m.body}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

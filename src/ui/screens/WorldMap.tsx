import React, { useState } from 'react';
import type { SaveState } from '../../game/types';
import { COMPANIES, canJoinCompany, joinCompany, companyCompleted, levelFromXp, missionsFor, rank } from '../../game/engine';
import { Avatar } from '../art/Avatar';
import { Modal } from '../components/common';
import type { Toast } from '../useGame';

export function WorldMap({ save, mutate, pushToast, onJoined }: { save: SaveState; mutate: (fn: (s: SaveState) => void) => void; pushToast: (t: Omit<Toast, 'id'>) => void; onJoined?: () => void }) {
  const level = levelFromXp(save.xp);
  const curIdx = COMPANIES.findIndex((c) => c.id === save.companyId);
  const [openId, setOpenId] = useState<string | null>(null);
  const open = COMPANIES.find((c) => c.id === openId);

  function join(id: string) {
    mutate((s) => { joinCompany(s, id); });
    const c = COMPANIES.find((x) => x.id === id)!;
    pushToast({ kind: 'lvl', icon: '💼', title: `Assunto da ${c.name}!`, body: `Sei ${c.jobTitle}. Ti porto al quartier generale: il primo contratto ti aspetta.` });
    setOpenId(null);
    // porta subito il giocatore dove si trovano le missioni, altrimenti resta sulla mappa senza sapere che fare
    onJoined?.();
  }

  return (
    <div className="content">
      <div className="wrap">
        <div className="panel" style={{ marginBottom: 18 }}>
          <div className="row" style={{ gap: 14 }}>
            <div className="portrait big"><Avatar level={level} px={4} /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="rpg-title">La tua scalata</div>
              <h1 className="h1" style={{ margin: '4px 0 2px', fontSize: 21 }}>{save.handle}</h1>
              <div className="dim" style={{ fontSize: 13 }}>{rank(level)} · Lv {level} · ⭐ {save.reputation} reputazione</div>
            </div>
            <div className="chip">{curIdx + 1}/{COMPANIES.length} tappe</div>
          </div>
        </div>

        <div className="map">
          <div className="map-line" />
          {COMPANIES.map((c, i) => {
            const isCurrent = c.id === save.companyId;
            const isPast = i < curIdx;
            const done = companyCompleted(save, c.id);
            const can = canJoinCompany(save, c.id);
            const locked = !isCurrent && !isPast && !can.ok;
            const total = missionsFor(c.id).length;
            const doneCount = missionsFor(c.id).filter((m) => save.completedMissions.includes(m.id)).length;
            const side = i % 2 === 0 ? 'left' : 'right';
            return (
              <div className={`map-node-wrap ${side}`} key={c.id}>
                <span className={'map-dot' + (isPast || done ? ' done' : isCurrent ? ' current' : '')} />
                {isCurrent && (
                  <span className="map-you" title="sei qui">
                    <Avatar level={level} px={2} />
                  </span>
                )}
                <button
                  className={'map-node' + (locked ? ' locked' : '') + (isCurrent ? ' current' : '') + (isPast || done ? ' done' : '')}
                  onClick={() => setOpenId(c.id)}
                >
                  <span className="badge-ic" style={{ borderColor: locked ? undefined : c.color }}>{locked ? '🔒' : c.icon}</span>
                  <span style={{ minWidth: 0 }}>
                    <b style={{ display: 'block', color: locked ? 'var(--text-dim)' : c.color, fontSize: 14 }}>{c.name}</b>
                    <span className="dim" style={{ fontSize: 11.5, display: 'block' }}>{c.jobTitle}</span>
                    <span style={{ display: 'flex', gap: 5, marginTop: 5, flexWrap: 'wrap' }}>
                      {isCurrent && <span className="tag green">sei qui</span>}
                      {isPast && <span className="tag">completata</span>}
                      {!isCurrent && !isPast && can.ok && <span className="tag green">offerta! ✦</span>}
                      {locked && <span className="tag locked">Lv {c.req.level} · ⭐{c.req.rep}</span>}
                      {(isCurrent || isPast) && <span className="tag">{doneCount}/{total}</span>}
                    </span>
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {open && (
        <Modal wide onClose={() => setOpenId(null)}>
          <div className="row" style={{ gap: 12, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 34 }}>{open.icon}</span>
            <div>
              <h2 style={{ margin: 0, color: open.color }}>{open.name}</h2>
              <div className="dim" style={{ fontSize: 13 }}>{open.jobTitle} · {open.tagline}</div>
            </div>
          </div>
          <p style={{ fontSize: 14, marginTop: 12 }}>"{open.intro}"</p>
          <div className="dim" style={{ fontSize: 12 }}>— {open.contact}, {open.contactRole}</div>

          {(() => {
            const can = canJoinCompany(save, open.id);
            const isCurrent = open.id === save.companyId;
            const isPast = COMPANIES.findIndex((x) => x.id === open.id) < curIdx;
            const total = missionsFor(open.id).length;
            const doneCount = missionsFor(open.id).filter((m) => save.completedMissions.includes(m.id)).length;
            return (
              <>
                <div className="row" style={{ marginTop: 14 }}>
                  <span className={'tag ' + (level >= open.req.level ? 'green' : 'locked')}>Lv {open.req.level}</span>
                  <span className={'tag ' + (save.reputation >= open.req.rep ? 'green' : 'locked')}>⭐ {open.req.rep}</span>
                  {open.req.cert && <span className={'tag ' + (save.certs.includes(open.req.cert) ? 'green' : 'locked')}>📜 {open.req.cert}</span>}
                  {(isCurrent || isPast) && <span className="tag green">contratti {doneCount}/{total}</span>}
                </div>
                <div className="row" style={{ marginTop: 16, justifyContent: 'flex-end' }}>
                  <button className="btn ghost" onClick={() => setOpenId(null)}>Chiudi</button>
                  {!isCurrent && !isPast && (can.ok
                    ? <button className="btn primary" onClick={() => join(open.id)}>Accetta offerta</button>
                    : <span className="tag locked">🔒 {can.reason}</span>)}
                </div>
              </>
            );
          })()}
        </Modal>
      )}
    </div>
  );
}

import React from 'react';
import type { SaveState } from '../../game/types';
import { COMPANIES, canJoinCompany, joinCompany, companyCompleted, levelFromXp, missionsFor } from '../../game/engine';
import type { Toast } from '../useGame';

export function Career({ save, mutate, pushToast }: { save: SaveState; mutate: (fn: (s: SaveState) => void) => void; pushToast: (t: Omit<Toast, 'id'>) => void }) {
  const level = levelFromXp(save.xp);
  const curIdx = COMPANIES.findIndex((c) => c.id === save.companyId);

  function join(id: string) {
    mutate((s) => {
      if (joinCompany(s, id)) {
        // toast fuori
      }
    });
    const c = COMPANIES.find((x) => x.id === id)!;
    pushToast({ kind: 'lvl', icon: '💼', title: `Assunto da ${c.name}!`, body: c.jobTitle });
  }

  return (
    <div className="content">
      <div className="wrap">
        <h1 className="h1">💼 Carriera</h1>
        <p className="sub">La tua scalata professionale. Ogni azienda è un gradino: completa le sue missioni, cresci di livello e reputazione, e fatti assumere da quella dopo. Dalla cameretta all'agenzia spaziale.</p>

        <div style={{ position: 'relative' }}>
          {COMPANIES.map((c, i) => {
            const isCurrent = c.id === save.companyId;
            const isPast = i < curIdx;
            const completed = companyCompleted(save, c.id);
            const can = canJoinCompany(save, c.id);
            const missionCount = missionsFor(c.id).length;
            const doneCount = missionsFor(c.id).filter((m) => save.completedMissions.includes(m.id)).length;
            return (
              <div key={c.id} className="card" style={{ marginBottom: 14, borderLeft: `4px solid ${c.color}`, opacity: !isCurrent && !isPast && !can.ok ? 0.7 : 1 }}>
                <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div className="row" style={{ gap: 12, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 32 }}>{c.icon}</span>
                    <div>
                      <h3 style={{ margin: 0 }}>{c.name} {isCurrent && <span className="tag green">← sei qui</span>} {isPast && <span className="tag">passato</span>}</h3>
                      <div className="dim" style={{ fontSize: 13 }}>{c.jobTitle} · {c.tagline}</div>
                    </div>
                  </div>
                </div>

                <p style={{ fontSize: 13.5, margin: '10px 0', color: 'var(--text-dim)' }}>{c.intro}</p>

                {(isCurrent || isPast) && (
                  <div className="row" style={{ marginBottom: 8 }}>
                    <span className="tag green">Missioni: {doneCount}/{missionCount}</span>
                    {completed && <span className="tag green">✓ completata</span>}
                  </div>
                )}

                {!isCurrent && !isPast && (
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <div className="row">
                      <span className={'tag ' + (level >= c.req.level ? 'green' : 'locked')}>Lv {c.req.level}</span>
                      <span className={'tag ' + (save.reputation >= c.req.rep ? 'green' : 'locked')}>Rep {c.req.rep}</span>
                      {c.req.cert && <span className={'tag ' + (save.certs.includes(c.req.cert) ? 'green' : 'locked')}>📜 {c.req.cert}</span>}
                    </div>
                    {can.ok ? (
                      <button className="btn sm primary" onClick={() => join(c.id)}>Accetta offerta</button>
                    ) : (
                      <span className="tag locked" title={can.reason}>🔒 {can.reason}</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

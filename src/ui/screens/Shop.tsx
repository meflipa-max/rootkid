import React from 'react';
import type { SaveState } from '../../game/types';
import { TOOLS, levelFromXp } from '../../game/engine';
import type { Toast } from '../useGame';

export function Shop({ save, mutate, pushToast }: { save: SaveState; mutate: (fn: (s: SaveState) => void) => void; pushToast: (t: Omit<Toast, 'id'>) => void }) {
  const level = levelFromXp(save.xp);

  function buy(id: string) {
    const t = TOOLS.find((x) => x.id === id)!;
    if (save.tools.includes(id) || save.credits < t.cost || level < t.reqLevel) return;
    mutate((s) => {
      s.credits -= t.cost;
      s.tools.push(id);
    });
    pushToast({ kind: 'info', icon: t.icon, title: `${t.name} acquistato!`, body: t.perk });
  }

  return (
    <div className="content">
      <div className="wrap">
        <h1 className="h1">🧰 Arsenale</h1>
        <p className="sub">Gli strumenti veri del mestiere. Ognuno sblocca missioni o ti dà un vantaggio nelle sfide. (Ispirati a tool reali che userai da professionista.)</p>
        <div className="grid cols2">
          {TOOLS.map((t) => {
            const owned = save.tools.includes(t.id);
            const canBuy = !owned && save.credits >= t.cost && level >= t.reqLevel;
            return (
              <div className="card" key={t.id}>
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <h3 style={{ fontSize: 16 }}>{t.icon} {t.name}</h3>
                  {owned && <span className="tag green">✓ posseduto</span>}
                </div>
                <div className="meta">{t.desc}</div>
                <p style={{ fontSize: 13, margin: '8px 0 4px' }}><b style={{ color: 'var(--green)' }}>Vantaggio:</b> {t.perk}</p>
                <p className="dim" style={{ fontSize: 12 }}>🌍 {t.real}</p>
                {!owned && (
                  <div className="row" style={{ marginTop: 10, justifyContent: 'space-between' }}>
                    <span className="tag">💰 {t.cost} · Lv {t.reqLevel}+</span>
                    <button className="btn sm primary" disabled={!canBuy} onClick={() => buy(t.id)}>
                      {level < t.reqLevel ? `Serve Lv ${t.reqLevel}` : save.credits < t.cost ? 'Crediti insuff.' : 'Compra'}
                    </button>
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

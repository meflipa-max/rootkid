import React, { useMemo, useState } from 'react';
import type { Mission, ChallengeResult, SaveState } from '../../game/types';
import { ChallengeView, TYPE_META } from '../challenges';
import { recordChallenge, completeMission, levelFromXp } from '../../game/engine';
import type { Toast } from '../useGame';

export function MissionRunner({
  mission,
  save,
  mutate,
  pushToast,
  onExit,
}: {
  mission: Mission;
  save: SaveState;
  mutate: (fn: (s: SaveState) => void) => void;
  pushToast: (t: Omit<Toast, 'id'>) => void;
  onExit: (completed: boolean) => void;
}) {
  const [idx, setIdx] = useState(0);
  const [results, setResults] = useState<ChallengeResult[]>([]);
  const [finished, setFinished] = useState(false);
  const ch = mission.challenges[idx];

  const totalHints = useMemo(() => results.reduce((a, r) => a + r.hintsUsed, 0), [results]);
  const allSuccess = useMemo(() => results.length === mission.challenges.length && results.every((r) => r.success), [results, mission.challenges.length]);

  function handleDone(res: ChallengeResult) {
    const newResults = [...results, res];
    setResults(newResults);
    // registra subito la singola sfida
    mutate((s) => {
      recordChallenge(s, ch, res);
    });
    if (idx + 1 < mission.challenges.length) {
      setIdx(idx + 1);
    } else {
      // fine missione
      const success = newResults.every((r) => r.success);
      const hints = newResults.reduce((a, r) => a + r.hintsUsed, 0);
      const beforeLevel = levelFromXp(save.xp);
      mutate((s) => {
        completeMission(s, mission, success, hints);
      });
      // toasts
      if (success) {
        const r = mission.def.reward;
        const xpGain = hints === 0 ? Math.round(r.xp * 1.15) : r.xp;
        const credGain = hints === 0 ? Math.round(r.credits * 1.1) : r.credits;
        const bonus = hints === 0 ? ' · bonus no-hint!' : '';
        pushToast({ kind: 'credit', icon: '💰', title: `+${credGain} crediti · +${xpGain} XP`, body: mission.def.title + bonus });
        const after = levelFromXp(save.xp + xpGain);
        if (after > beforeLevel) {
          setTimeout(() => pushToast({ kind: 'lvl', icon: '⬆️', title: `Livello ${after}!`, body: 'Nuove missioni e strumenti disponibili.' }), 500);
        }
      }
      setFinished(true);
    }
  }

  if (finished) {
    const won = results.filter((r) => r.success).length;
    const perfect = results.filter((r) => r.perfect).length;
    return (
      <div className="runner">
        <div className="body">
          <div className="chwrap fadein">
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 56 }}>{allSuccess ? '🎉' : won > 0 ? '📋' : '😵'}</div>
              <h1 className="h1" style={{ marginTop: 8 }}>{allSuccess ? 'Missione completata!' : 'Missione conclusa'}</h1>
              <p className="sub">{mission.def.title}</p>
            </div>
            <div className="kpi">
              <div className="b"><div className="n" style={{ color: 'var(--green)' }}>{won}/{results.length}</div><div className="l">Sfide superate</div></div>
              <div className="b"><div className="n" style={{ color: 'var(--cyan)' }}>{perfect}</div><div className="l">Perfette 💎</div></div>
              <div className="b"><div className="n" style={{ color: 'var(--yellow)' }}>{totalHints}</div><div className="l">Suggerimenti</div></div>
            </div>
            {allSuccess ? (
              <div className="result-banner ok" style={{ marginTop: 16 }}>
                Ricompensa: <b>+{mission.def.reward.xp} XP · +{mission.def.reward.credits} crediti · +{mission.def.reward.rep} reputazione</b>
                {mission.def.final && <div style={{ marginTop: 6 }}>🏁 Hai completato l'ultima missione di questo datore di lavoro! Controlla le offerte nella posta.</div>}
              </div>
            ) : (
              <div className="result-banner bad" style={{ marginTop: 16 }}>
                Non tutte le sfide sono state superate, quindi niente ricompensa piena. Riprova quando vuoi: ogni tentativo ti fa imparare.
              </div>
            )}
            <div className="row" style={{ marginTop: 18, justifyContent: 'center' }}>
              <button className="btn primary" onClick={() => onExit(allSuccess)}>Torna alla base</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="runner">
      <div className="topbar">
        <button className="btn sm ghost" onClick={() => onExit(false)}>← Esci</button>
        <div className="steps">
          {mission.challenges.map((c, i) => (
            <i key={i} className={i < idx ? 'done' : i === idx ? 'cur' : ''} title={TYPE_META[c.type]?.label} />
          ))}
        </div>
        <span className="tag">{TYPE_META[ch.type]?.icon} {TYPE_META[ch.type]?.label}</span>
        <span className="dim hide-sm" style={{ fontSize: 12 }}>{idx + 1}/{mission.challenges.length}</span>
      </div>
      <div className={'body' + (ch.type === 'terminal' || ch.type === 'sniffer' ? ' noscroll' : '')}>
        <ChallengeView key={ch.id} challenge={ch} onDone={handleDone} tools={save.tools} />
      </div>
    </div>
  );
}

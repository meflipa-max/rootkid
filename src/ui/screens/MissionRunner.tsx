import React, { useMemo, useState } from 'react';
import type { Mission, ChallengeResult, SaveState } from '../../game/types';
import { ChallengeView, TYPE_META } from '../challenges';
import { PrimerView } from '../challenges/Primer';
import { recordChallenge, completeMission, levelFromXp, effectiveReward } from '../../game/engine';
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
  const [earned, setEarned] = useState<{ xp: number; credits: number; rep: number; firstClear: boolean } | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
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
      setHelpOpen(false);
      setIdx(idx + 1);
    } else {
      // fine missione
      const success = newResults.every((r) => r.success);
      const hints = newResults.reduce((a, r) => a + r.hintsUsed, 0);
      const beforeLevel = levelFromXp(save.xp);
      // calcolo la ricompensa effettiva PRIMA di applicarla (dipende dallo stato pre-mutazione: replay vs primo completamento)
      const eff = success ? effectiveReward(save, mission, hints) : { xp: 0, credits: 0, rep: 0, firstClear: true };
      setEarned(eff);
      mutate((s) => {
        completeMission(s, mission, success, hints);
      });
      // toasts
      if (success) {
        const bonus = (hints === 0 ? ' · bonus no-hint!' : '') + (!eff.firstClear ? ' · replay' : '');
        pushToast({ kind: 'credit', icon: '💰', title: `+${eff.credits} crediti · +${eff.xp} XP`, body: mission.def.title + bonus });
        const after = levelFromXp(save.xp + eff.xp);
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
                Ricompensa: <b>+{earned?.xp ?? mission.def.reward.xp} XP · +{earned?.credits ?? mission.def.reward.credits} crediti · +{earned?.rep ?? mission.def.reward.rep} reputazione</b>
                {earned && !earned.firstClear && <div className="dim" style={{ marginTop: 6, fontSize: 13 }}>♻️ Missione già completata: ricompensa ridotta (allenamento).</div>}
                {earned?.firstClear && mission.def.final && <div style={{ marginTop: 6 }}>🏁 Hai completato l'ultima missione di questo datore di lavoro! Controlla le offerte nella posta.</div>}
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

  const needsPrimer = !save.seenPrimers.includes(ch.type);
  const noscroll = !needsPrimer && (ch.type === 'terminal' || ch.type === 'sniffer');

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
        {!needsPrimer && !helpOpen && (
          <button className="btn sm ghost" title="Come si gioca questa sfida" onClick={() => setHelpOpen(true)}>❓ Aiuto</button>
        )}
        <span className="dim hide-sm" style={{ fontSize: 12 }}>{idx + 1}/{mission.challenges.length}</span>
      </div>
      <div className={'body' + (noscroll ? ' noscroll' : '')}>
        {needsPrimer ? (
          <PrimerView
            type={ch.type}
            firstTime
            onStart={() => mutate((s) => { if (!s.seenPrimers.includes(ch.type)) s.seenPrimers.push(ch.type); })}
          />
        ) : (
          <ChallengeView key={ch.id} challenge={ch} onDone={handleDone} tools={save.tools} />
        )}
      </div>
      {/* Aiuto riaperto durante la sfida: overlay, così la sfida in corso non si azzera */}
      {helpOpen && !needsPrimer && (
        <div className="overlay" onClick={() => setHelpOpen(false)}>
          <div className="modal wide" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '88vh', overflowY: 'auto', padding: 18 }}>
            <PrimerView type={ch.type} startLabel="Torna alla sfida →" onStart={() => setHelpOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

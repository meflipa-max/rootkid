import React, { useMemo, useState } from 'react';
import type { Mission, ChallengeResult, SaveState } from '../../game/types';
import { ChallengeView, TYPE_META } from '../challenges';
import { PrimerView } from '../challenges/Primer';
import { recordChallenge, completeMission, levelFromXp, effectiveReward } from '../../game/engine';
import { bossFor, ATTACK_NAME, Boss } from '../../game/content/enemies';
import { Daemon } from '../art/Daemon';
import { Avatar } from '../art/Avatar';
import { Bar, Floaters, useFloaters } from '../components/rpg';
import type { Toast } from '../useGame';

const PLAYER_MAX = 100;
const HIT_TO_PLAYER = 34;

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

  // --- stato "combattimento" ---
  const boss = useMemo(() => bossFor(mission), [mission]);
  const dmgPer = Math.ceil(100 / mission.challenges.length);
  const [bossHp, setBossHp] = useState(100);
  const [playerHp, setPlayerHp] = useState(PLAYER_MAX);
  const [fx, setFx] = useState<'idle' | 'hit' | 'dead'>('idle');
  const [shake, setShake] = useState(false);
  const [flash, setFlash] = useState(false);
  const [resolving, setResolving] = useState<null | { success: boolean; text: string }>(null);
  const { items: floats, spawn } = useFloaters();

  const ch = mission.challenges[idx];
  const level = levelFromXp(save.xp);
  const totalHints = useMemo(() => results.reduce((a, r) => a + r.hintsUsed, 0), [results]);
  const allSuccess = useMemo(
    () => results.length === mission.challenges.length && results.every((r) => r.success),
    [results, mission.challenges.length],
  );

  function finishMission(newResults: ChallengeResult[], playerDead: boolean) {
    const success = !playerDead && newResults.length === mission.challenges.length && newResults.every((r) => r.success);
    const hints = newResults.reduce((a, r) => a + r.hintsUsed, 0);
    const beforeLevel = levelFromXp(save.xp);
    const eff = success ? effectiveReward(save, mission, hints) : { xp: 0, credits: 0, rep: 0, firstClear: true };
    setEarned(eff);
    mutate((s) => {
      completeMission(s, mission, success, hints);
    });
    if (success) {
      const bonus = (hints === 0 ? ' · bonus no-hint!' : '') + (!eff.firstClear ? ' · replay' : '');
      pushToast({ kind: 'credit', icon: '💰', title: `+${eff.credits} crediti · +${eff.xp} XP`, body: mission.def.title + bonus });
    }
    setFinished(true);
  }

  function handleDone(res: ChallengeResult) {
    const newResults = [...results, res];
    setResults(newResults);
    mutate((s) => {
      recordChallenge(s, ch, res);
    });

    let playerDead = false;
    if (res.success) {
      const crit = !!res.perfect;
      const dmg = crit ? Math.ceil(dmgPer * 1.4) : dmgPer;
      setBossHp((hp) => Math.max(0, hp - dmg));
      setFx('hit');
      setFlash(true);
      spawn(`-${dmg}${crit ? ' CRITICO!' : ''}`, crit ? 'crit' : 'dmg', 46, 34);
      setTimeout(() => setFlash(false), 340);
      setTimeout(() => setFx((f) => (f === 'hit' ? 'idle' : f)), 460);
      setResolving({ success: true, text: `${ATTACK_NAME[ch.type]}${crit ? ' — colpo critico!' : ' a segno!'}` });
    } else {
      const np = Math.max(0, playerHp - HIT_TO_PLAYER);
      setPlayerHp(np);
      playerDead = np <= 0;
      setShake(true);
      spawn(`-${HIT_TO_PLAYER}`, 'dmg', 12, 62);
      setTimeout(() => setShake(false), 400);
      setResolving({ success: false, text: playerDead ? 'Sei stato sopraffatto…' : 'Il colpo è mancato: subisci danni.' });
    }

    const lastOne = idx + 1 >= mission.challenges.length;
    setTimeout(() => {
      setResolving(null);
      if (playerDead || lastOne) {
        if (!playerDead && res.success) setFx('dead');
        setTimeout(() => finishMission(newResults, playerDead), playerDead || !res.success ? 0 : 750);
      } else {
        setHelpOpen(false);
        setIdx((i) => i + 1);
      }
    }, 1350);
  }

  // ---------------- schermata finale ----------------
  if (finished) {
    const won = results.filter((r) => r.success).length;
    const perfect = results.filter((r) => r.perfect).length;
    return (
      <div className="runner">
        <div className="body">
          <div className="chwrap fadein">
            <div style={{ textAlign: 'center', padding: '14px 0' }}>
              {allSuccess ? (
                <>
                  <div style={{ display: 'grid', placeItems: 'center', opacity: 0.35 }}>
                    <Daemon boss={boss} state="dead" size={110} />
                  </div>
                  <div className="rpg-title" style={{ justifyContent: 'center', marginTop: -10 }}>Nemico sconfitto</div>
                  <h1 className="h1" style={{ marginTop: 6 }}>{boss.name} neutralizzato</h1>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 52 }}>{won > 0 ? '🛡️' : '💀'}</div>
                  <h1 className="h1" style={{ marginTop: 6 }}>{playerHp <= 0 ? 'Sei stato respinto' : 'Contratto incompleto'}</h1>
                </>
              )}
              <p className="sub">{mission.def.title}</p>
            </div>

            <div className="kpi">
              <div className="b"><div className="n" style={{ color: 'var(--green)' }}>{won}/{mission.challenges.length}</div><div className="l">Colpi a segno</div></div>
              <div className="b"><div className="n" style={{ color: 'var(--cyan)' }}>{perfect}</div><div className="l">Critici 💎</div></div>
              <div className="b"><div className="n" style={{ color: 'var(--yellow)' }}>{totalHints}</div><div className="l">Aiuti usati</div></div>
            </div>

            {allSuccess ? (
              <div className="result-banner ok" style={{ marginTop: 16 }}>
                <b>🎁 Bottino:</b> +{earned?.xp ?? mission.def.reward.xp} XP · +{earned?.credits ?? mission.def.reward.credits} crediti · +{earned?.rep ?? mission.def.reward.rep} reputazione
                {earned && !earned.firstClear && <div className="dim" style={{ marginTop: 6, fontSize: 13 }}>♻️ Nemico già sconfitto in passato: bottino ridotto (allenamento).</div>}
                {earned?.firstClear && mission.def.final && <div style={{ marginTop: 6 }}>🏁 Hai chiuso l'ultimo contratto di questo datore di lavoro! Controlla le offerte nella posta.</div>}
              </div>
            ) : (
              <div className="result-banner bad" style={{ marginTop: 16 }}>
                {playerHp <= 0
                  ? 'Hai esaurito i punti vita: il contratto si chiude qui. Nessuna penalità permanente — riprova quando vuoi, ogni tentativo ti insegna qualcosa.'
                  : 'Non tutte le sfide sono state superate, quindi niente bottino pieno. Riprova quando vuoi.'}
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
  const bigArena = !needsPrimer && (!!resolving || !(ch.type === 'terminal' || ch.type === 'sniffer'));
  const noscroll = !needsPrimer && !resolving && (ch.type === 'terminal' || ch.type === 'sniffer');

  return (
    <div className="runner">
      <div className="topbar">
        <button className="btn sm ghost" onClick={() => onExit(false)}>← Fuggi</button>
        <div className="steps">
          {mission.challenges.map((c, i) => (
            <i key={i} className={i < idx ? 'done' : i === idx ? 'cur' : ''} title={TYPE_META[c.type]?.label} />
          ))}
        </div>
        <span className="tag">{TYPE_META[ch.type]?.icon} {TYPE_META[ch.type]?.label}</span>
        {!needsPrimer && !helpOpen && !resolving && (
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
          <>
            <div className="chwrap" style={{ marginBottom: 0, width: '100%' }}>
              <Arena
                boss={boss}
                bossHp={bossHp}
                playerHp={playerHp}
                level={level}
                fx={fx}
                shake={shake}
                flash={flash}
                floats={floats}
                compact={!bigArena}
                resolving={resolving}
              />
            </div>
            {!resolving && (
              <ChallengeView key={ch.id} challenge={ch} onDone={handleDone} tools={save.tools} />
            )}
          </>
        )}
      </div>

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

// ---------------- Arena ----------------
function Arena({
  boss, bossHp, playerHp, level, fx, shake, flash, floats, compact, resolving,
}: {
  boss: Boss;
  bossHp: number;
  playerHp: number;
  level: number;
  fx: 'idle' | 'hit' | 'dead';
  shake: boolean;
  flash: boolean;
  floats: ReturnType<typeof useFloaters>['items'];
  compact: boolean;
  resolving: null | { success: boolean; text: string };
}) {
  return (
    <div className={'arena' + (shake ? ' shake' : '')}>
      <span className={'arena-flash' + (flash ? ' on' : '')} />
      <Floaters items={floats} />
      <div className="arena-row">
        <Daemon boss={boss} state={fx} size={compact ? 72 : 132} />
        <div className="arena-info">
          <div className="boss-name" style={{ color: boss.color }}>{boss.name}</div>
          <div className="boss-title">{boss.title}</div>
          <div style={{ margin: '8px 0 4px' }}>
            <Bar value={bossHp} max={100} kind="boss" />
          </div>
          <div className="bar-label">INTEGRITÀ {bossHp}%</div>
          {!compact && !resolving && <div className="boss-taunt">{boss.taunt}</div>}
        </div>
      </div>

      {resolving && (
        <div className="fadein" style={{ textAlign: 'center', padding: '10px 0 4px', position: 'relative', zIndex: 2 }}>
          <b style={{ color: resolving.success ? 'var(--green)' : 'var(--red)', fontSize: 15 }}>{resolving.text}</b>
        </div>
      )}

      {/* riga giocatore */}
      <div className="row" style={{ marginTop: 10, gap: 10, position: 'relative', zIndex: 1 }}>
        <Avatar level={level} px={compact ? 2 : 2.6} />
        <div style={{ flex: 1, minWidth: 120 }}>
          <Bar value={playerHp} max={PLAYER_MAX} kind="hp" shine />
          <div className="bar-label">PV {playerHp}/{PLAYER_MAX}</div>
        </div>
      </div>
    </div>
  );
}

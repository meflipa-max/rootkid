import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Mission, ChallengeResult, SaveState, ChallengeType, Item, Slot } from '../../game/types';
import { computeStats, rollLoot, itemDef, itemStats, RARITY, itemPower } from '../../game/content/items';
import { ChallengeView, TYPE_META } from '../challenges';
import { PrimerView } from '../challenges/Primer';
import { recordChallenge, completeMission, levelFromXp, effectiveReward } from '../../game/engine';
import { bossFor, ATTACK_NAME, Boss } from '../../game/content/enemies';
import { Daemon } from '../art/Daemon';
import { Avatar } from '../art/Avatar';
import { Bar, Floaters, useFloaters } from '../components/rpg';
import type { Toast } from '../useGame';

const PLAYER_BASE_HP = 100;
const FAIL_DMG = 22; // danno quando sbagli una sfida
const BOSS_DMG = 14; // danno di un attacco del boss
const ENERGY_MAX = 12;
const ENERGY_PER_HIT = 3;

// Quanto tempo ha il boss per caricare un attacco, per tipo di sfida (ms).
// Le sfide che richiedono più lettura/ragionamento danno più respiro.
const CHARGE_MS: Record<ChallengeType, number> = {
  terminal: 150000,
  logs: 120000,
  codereview: 105000,
  weblab: 105000,
  quiz: 95000,
  cipher: 90000,
  password: 90000,
  binary: 85000,
  network: 85000,
  phishing: 75000,
  ethics: Infinity, // sulle scelte morali non si mette fretta
  sniffer: Infinity, // ha già un timer suo
};

interface Ability {
  id: 'firewall' | 'overclock' | 'patch' | 'debug';
  icon: string;
  name: string;
  cost: number;
  desc: string;
}
const ABILITIES: Ability[] = [
  { id: 'firewall', icon: '🛡️', name: 'Firewall', cost: 2, desc: 'Annulla il prossimo attacco del boss.' },
  { id: 'debug', icon: '⏱️', name: 'Debug', cost: 3, desc: 'Azzera la carica del boss: ti compri tempo.' },
  { id: 'patch', icon: '💊', name: 'Patch', cost: 3, desc: 'Recuperi 30 PV.' },
  { id: 'overclock', icon: '⚡', name: 'Overclock', cost: 4, desc: 'Il prossimo colpo fa danno doppio.' },
];

export function MissionRunner({
  mission, save, mutate, pushToast, onExit,
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

  // --- stato di combattimento ---
  const boss = useMemo(() => bossFor(mission), [mission]);
  const dmgPer = Math.ceil(100 / mission.challenges.length);
  // statistiche derivate dall'equipaggiamento: l'attrezzatura conta davvero
  const stats = useMemo(() => computeStats(save), [save.equipped, save.inventory]);
  const PLAYER_MAX = PLAYER_BASE_HP + stats.pvMax;

  const [bossHp, setBossHp] = useState(100);
  const [playerHp, setPlayerHp] = useState(PLAYER_MAX);
  const [energy, setEnergy] = useState(4 + stats.energia);
  const [loot, setLoot] = useState<Item | null>(null);
  const [combo, setCombo] = useState(0);
  const [shield, setShield] = useState(false);
  const [overclock, setOverclock] = useState(false);
  const [charge, setCharge] = useState(0); // 0..1
  const [fx, setFx] = useState<'idle' | 'hit' | 'dead'>('idle');
  const [shake, setShake] = useState(false);
  const [flash, setFlash] = useState(false);
  const [resolving, setResolving] = useState<null | { success: boolean; text: string }>(null);
  const { items: floats, spawn } = useFloaters();

  const ch = mission.challenges[idx];
  const level = levelFromXp(save.xp);
  const enraged = bossHp <= 50 && bossHp > 0;
  const calm = !!save.settings.calm;
  const needsPrimer = !save.seenPrimers.includes(ch.type);

  // --- refs per il ciclo in tempo reale (evitano closure stantie) ---
  const chargeRef = useRef(0);
  const shieldRef = useRef(false);
  const pausedRef = useRef(false);
  const resultsRef = useRef<ChallengeResult[]>([]);
  const deadHandled = useRef(false);
  const finishedRef = useRef(false);
  resultsRef.current = results;
  shieldRef.current = shield;
  finishedRef.current = finished;

  const chargeMs = (CHARGE_MS[ch.type] ?? 90000) * (enraged ? 0.62 : 1);
  const chargeMsRef = useRef(chargeMs);
  chargeMsRef.current = chargeMs;

  // il timer si ferma durante lezioni, aiuto, animazioni e a fine missione
  pausedRef.current = !!resolving || needsPrimer || helpOpen || finished;

  const bossAttack = useCallback(() => {
    if (shieldRef.current) {
      setShield(false);
      spawn('BLOCCATO 🛡️', 'heal', 24, 52);
      return;
    }
    setPlayerHp((hp) => Math.max(0, hp - BOSS_DMG));
    setCombo(0);
    setShake(true);
    setTimeout(() => setShake(false), 400);
    spawn(`-${BOSS_DMG}`, 'dmg', 14, 58);
  }, [spawn]);

  // ciclo di carica dell'attacco nemico.
  // Dipende SOLO da `calm`: l'azione passa da una ref, così l'intervallo
  // non viene ricreato a ogni render (cosa che falsava la velocità).
  const bossAttackRef = useRef(bossAttack);
  bossAttackRef.current = bossAttack;
  useEffect(() => {
    if (calm) return;
    const TICK = 100;
    const id = setInterval(() => {
      if (pausedRef.current || finishedRef.current) return;
      const ms = chargeMsRef.current;
      if (!isFinite(ms) || ms <= 0) return;
      chargeRef.current += TICK / ms;
      if (chargeRef.current >= 1) {
        chargeRef.current = 0;
        bossAttackRef.current();
      }
      setCharge(chargeRef.current);
    }, TICK);
    return () => clearInterval(id);
  }, [calm]);

  // sconfitta del giocatore
  useEffect(() => {
    if (playerHp <= 0 && !finished && !deadHandled.current) {
      deadHandled.current = true;
      finishMission(resultsRef.current, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerHp, finished]);

  function resetCharge() {
    chargeRef.current = 0;
    setCharge(0);
  }

  function useAbility(a: Ability) {
    if (energy < a.cost || resolving || finished) return;
    setEnergy((e) => e - a.cost);
    switch (a.id) {
      case 'firewall':
        setShield(true);
        spawn('FIREWALL ATTIVO', 'heal', 30, 50);
        break;
      case 'debug':
        resetCharge();
        spawn('CARICA AZZERATA', 'heal', 30, 50);
        break;
      case 'patch':
        setPlayerHp((hp) => Math.min(PLAYER_MAX, hp + 30));
        spawn('+30 PV', 'heal', 18, 58);
        break;
      case 'overclock':
        setOverclock(true);
        spawn('OVERCLOCK ⚡', 'crit', 40, 46);
        break;
    }
  }

  function finishMission(newResults: ChallengeResult[], playerDead: boolean) {
    const success = !playerDead && newResults.length === mission.challenges.length && newResults.every((r) => r.success);
    const hints = newResults.reduce((a, r) => a + r.hintsUsed, 0);
    const eff = success ? effectiveReward(save, mission, hints) : { xp: 0, credits: 0, rep: 0, firstClear: true };
    setEarned(eff);

    // bottino: solo alla prima vittoria e mai in allenamento (niente farming al dojo)
    let drop: Item | null = null;
    if (success && eff.firstClear && mission.kind !== 'training') {
      const maxD = Math.max(...mission.challenges.map((c) => c.difficulty));
      drop = rollLoot((mission.seed ^ Date.now()) >>> 0, maxD);
      setLoot(drop);
    }

    mutate((s) => {
      completeMission(s, mission, success, hints);
      if (drop) s.inventory.push(drop);
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
    mutate((s) => { recordChallenge(s, ch, res); });
    resetCharge();

    let playerDead = false;
    if (res.success) {
      const newCombo = combo + 1;
      setCombo(newCombo);
      const comboMult = 1 + Math.min(newCombo - 1, 3) * 0.25;
      // critico garantito se la sfida è perfetta, altrimenti dipende dall'equipaggiamento
      const crit = !!res.perfect || Math.random() * 100 < stats.critPct;
      const gear = 1 + stats.dannoPct / 100;
      const dmg = Math.round(dmgPer * comboMult * gear * (crit ? 1.4 : 1) * (overclock ? 2 : 1));
      if (overclock) setOverclock(false);
      setBossHp((hp) => Math.max(0, hp - dmg));
      setEnergy((e) => Math.min(ENERGY_MAX, e + ENERGY_PER_HIT));
      setFx('hit');
      setFlash(true);
      spawn(`-${dmg}${crit ? ' CRITICO!' : ''}`, crit || overclock ? 'crit' : 'dmg', 46, 32);
      setTimeout(() => setFlash(false), 340);
      setTimeout(() => setFx((f) => (f === 'hit' ? 'idle' : f)), 460);
      setResolving({
        success: true,
        text: `${ATTACK_NAME[ch.type]}${crit ? ' — colpo critico!' : ' a segno!'}${newCombo >= 2 ? `  ·  COMBO x${newCombo}` : ''}`,
      });
    } else {
      setCombo(0);
      const np = Math.max(0, playerHp - FAIL_DMG);
      setPlayerHp(np);
      playerDead = np <= 0;
      setShake(true);
      spawn(`-${FAIL_DMG}`, 'dmg', 12, 60);
      setTimeout(() => setShake(false), 400);
      setResolving({ success: false, text: playerDead ? 'Sei stato sopraffatto…' : 'Il colpo è mancato: subisci danni.' });
    }

    const lastOne = idx + 1 >= mission.challenges.length;
    setTimeout(() => {
      setResolving(null);
      if (playerDead) return; // ci pensa l'effetto sulla sconfitta
      if (lastOne) {
        if (res.success) setFx('dead');
        setTimeout(() => finishMission(newResults, false), res.success ? 750 : 0);
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
    const allSuccess = results.length === mission.challenges.length && results.every((r) => r.success);
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
              <div className="b"><div className="n" style={{ color: 'var(--yellow)' }}>{results.reduce((a, r) => a + r.hintsUsed, 0)}</div><div className="l">Aiuti usati</div></div>
            </div>

            {allSuccess ? (
              <div className="result-banner ok" style={{ marginTop: 16 }}>
                <b>🎁 Ricompensa:</b> +{earned?.xp ?? 0} XP · +{earned?.credits ?? 0} crediti · +{earned?.rep ?? 0} reputazione
                {earned && !earned.firstClear && <div className="dim" style={{ marginTop: 6, fontSize: 13 }}>♻️ Nemico già sconfitto in passato: ricompensa ridotta (allenamento).</div>}
                {earned?.firstClear && mission.def.final && <div style={{ marginTop: 6 }}>🏁 Hai chiuso l'ultimo contratto di questo datore di lavoro! Controlla le offerte nella posta.</div>}
              </div>
            ) : (
              <div className="result-banner bad" style={{ marginTop: 16 }}>
                {playerHp <= 0
                  ? 'Hai esaurito i punti vita. Nessuna penalità permanente: riprova quando vuoi — e ricorda che puoi usare le abilità (🛡️ ⏱️ 💊) per reggere più a lungo.'
                  : 'Non tutte le sfide sono state superate, quindi niente bottino pieno. Riprova quando vuoi.'}
              </div>
            )}

            {loot && <LootCard item={loot} save={save} mutate={mutate} />}

            <div className="row" style={{ marginTop: 18, justifyContent: 'center' }}>
              <button className="btn primary" onClick={() => onExit(allSuccess)}>Torna alla base</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
                boss={boss} bossHp={bossHp} playerHp={playerHp} playerMax={PLAYER_MAX} level={level}
                fx={fx} shake={shake} flash={flash} floats={floats}
                compact={!bigArena} resolving={resolving}
                charge={charge} showCharge={!calm && isFinite(chargeMs)}
                enraged={enraged} combo={combo} energy={energy}
                shield={shield} overclock={overclock}
                onAbility={useAbility} disabled={!!resolving}
              />
            </div>
            {!resolving && <ChallengeView key={ch.id} challenge={ch} onDone={handleDone} tools={save.tools} />}
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

// ---------------- Carta del bottino ----------------
function LootCard({ item, save, mutate }: { item: Item; save: SaveState; mutate: (fn: (s: SaveState) => void) => void }) {
  const def = itemDef(item.defId);
  const [equipped, setEquipped] = useState(false);
  if (!def) return null;
  const rar = RARITY[item.rarity];
  const st = itemStats(item);
  const slot = def.slot as Slot;
  const currentId = save.equipped?.[slot];
  const current = currentId ? save.inventory.find((i) => i.id === currentId) : undefined;
  const isUpgrade = !current || itemPower(item) > itemPower(current);

  const lines: string[] = [];
  if (st.dannoPct) lines.push(`+${st.dannoPct}% danno`);
  if (st.pvMax) lines.push(`+${st.pvMax} PV max`);
  if (st.energia) lines.push(`+${st.energia} energia iniziale`);
  if (st.xpPct) lines.push(`+${st.xpPct}% XP`);
  if (st.critPct) lines.push(`+${st.critPct}% critico`);

  function equip() {
    mutate((s) => { s.equipped[slot] = item.id; });
    setEquipped(true);
  }

  return (
    <div className="loot-card fadein" style={{ borderColor: rar.color }}>
      <div className="loot-glow" style={{ background: `radial-gradient(circle at 50% 0%, ${rar.color}33, transparent 70%)` }} />
      <div className="rpg-title" style={{ color: rar.color }}>Oggetto trovato</div>
      <div className="row" style={{ gap: 14, marginTop: 10, alignItems: 'flex-start' }}>
        <div className="loot-icon" style={{ borderColor: rar.color, boxShadow: `0 0 22px ${rar.color}55` }}>{def.icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: rar.color }}>{def.name}</div>
          <div className="dim" style={{ fontSize: 11.5, textTransform: 'uppercase', letterSpacing: 0.6 }}>
            {rar.name} · {SLOT_LABEL[slot]}
          </div>
          <div style={{ marginTop: 7, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {lines.map((l) => <span className="tag green" key={l}>{l}</span>)}
          </div>
          <div className="dim" style={{ fontSize: 12.5, fontStyle: 'italic', marginTop: 8 }}>"{def.flavor}"</div>
        </div>
      </div>
      <div className="row" style={{ marginTop: 12, justifyContent: 'space-between' }}>
        <span className="dim" style={{ fontSize: 12 }}>
          {equipped ? '✓ Equipaggiato' : current ? `Al posto di: ${itemDef(current.defId)?.name}` : 'Slot libero'}
          {!equipped && isUpgrade && <b style={{ color: 'var(--green)' }}> · migliore!</b>}
        </span>
        {!equipped && <button className="btn sm primary" onClick={equip}>Equipaggia</button>}
      </div>
    </div>
  );
}

const SLOT_LABEL: Record<Slot, string> = { testa: 'Testa', mano: 'Strumento', impianto: 'Impianto' };

// ---------------- Arena ----------------
function Arena(props: {
  boss: Boss; bossHp: number; playerHp: number; playerMax: number; level: number;
  fx: 'idle' | 'hit' | 'dead'; shake: boolean; flash: boolean;
  floats: ReturnType<typeof useFloaters>['items'];
  compact: boolean; resolving: null | { success: boolean; text: string };
  charge: number; showCharge: boolean; enraged: boolean; combo: number; energy: number;
  shield: boolean; overclock: boolean;
  onAbility: (a: Ability) => void; disabled: boolean;
}) {
  const {
    boss, bossHp, playerHp, playerMax, level, fx, shake, flash, floats, compact, resolving,
    charge, showCharge, enraged, combo, energy, shield, overclock, onAbility, disabled,
  } = props;

  return (
    <div className={'arena' + (shake ? ' shake' : '') + (enraged ? ' enraged' : '')}>
      <span className={'arena-flash' + (flash ? ' on' : '')} />
      <Floaters items={floats} />

      <div className="arena-row">
        <Daemon boss={boss} state={fx} size={compact ? 72 : 132} />
        <div className="arena-info">
          <div className="row" style={{ gap: 8, alignItems: 'baseline' }}>
            <span className="boss-name" style={{ color: boss.color }}>{boss.name}</span>
            {enraged && <span className="tag enrage-tag">IN FURIA</span>}
          </div>
          <div className="boss-title">{boss.title}</div>
          <div style={{ margin: '8px 0 4px' }}>
            <Bar value={bossHp} max={100} kind="boss" />
          </div>
          <div className="bar-label">INTEGRITÀ {bossHp}%</div>

          {showCharge && (
            <div style={{ marginTop: 8 }}>
              <div className="charge">
                <i style={{ width: `${Math.round(charge * 100)}%` }} />
              </div>
              <div className="bar-label" style={{ color: charge > 0.75 ? 'var(--red)' : undefined }}>
                {shield ? '🛡️ prossimo attacco bloccato' : `⚔️ carica attacco ${Math.round(charge * 100)}%`}
              </div>
            </div>
          )}
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
        <div style={{ flex: 1, minWidth: 110 }}>
          <Bar value={playerHp} max={playerMax} kind="hp" shine />
          <div className="bar-label">
            PV {playerHp}/{playerMax}
            {combo >= 2 && <span className="combo-badge">COMBO x{combo}</span>}
            {overclock && <span className="combo-badge oc">⚡ OVERCLOCK</span>}
          </div>
        </div>
      </div>

      {/* abilità */}
      <div className="abilities">
        <span className="energy" title="Energia: la guadagni colpendo il nemico">⚡ {energy}</span>
        {ABILITIES.map((a) => {
          const off = disabled || energy < a.cost || (a.id === 'firewall' && shield) || (a.id === 'overclock' && overclock);
          return (
            <button
              key={a.id}
              className={'ability' + (off ? ' off' : '')}
              disabled={off}
              onClick={() => onAbility(a)}
              title={`${a.name} (${a.cost}⚡) — ${a.desc}`}
            >
              <span style={{ fontSize: 15 }}>{a.icon}</span>
              <span className="ability-name">{a.name}</span>
              <span className="ability-cost">{a.cost}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

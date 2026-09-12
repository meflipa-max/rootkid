import React from 'react';
import type { SaveState, Mission, MissionDef } from '../../game/types';
import {
  companyById, storyMissionsForCurrentCompany, nextStoryMission, buildMission,
  buildBounty, buildDaily, buildTraining, levelFromXp, rank, ALL_TYPES, updateStreakOnDaily,
} from '../../game/engine';
import { todayKey, randomSeed, hashString } from '../../game/rng';
import { Diff } from '../components/common';
import { TYPE_META } from '../challenges';

export function Dashboard({ save, onPlay, mutate }: { save: SaveState; onPlay: (m: Mission) => void; mutate: (fn: (s: SaveState) => void) => void }) {
  const company = companyById(save.companyId);
  const missions = storyMissionsForCurrentCompany(save);
  const next = nextStoryMission(save);
  const level = levelFromXp(save.xp);

  function playStory(def: MissionDef) {
    onPlay(buildMission(def, hashString(def.id) ^ (save.createdAt & 0xffff)));
  }
  function playDaily() {
    updateStreakOnDaily0();
    onPlay(buildDaily(todayKey()));
  }
  function updateStreakOnDaily0() {
    mutate((s) => updateStreakOnDaily(s));
  }
  function playBounty() {
    onPlay(buildBounty(save, randomSeed()));
  }

  return (
    <div className="content">
      <div className="wrap">
        {/* company header */}
        <div className="card" style={{ borderLeft: `4px solid ${company.color}`, marginBottom: 20 }}>
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="row" style={{ gap: 10 }}>
                <span style={{ fontSize: 30 }}>{company.icon}</span>
                <div>
                  <h1 className="h1" style={{ fontSize: 20 }}>{company.name}</h1>
                  <div className="dim" style={{ fontSize: 13 }}>{company.jobTitle} · tu sei <b style={{ color: company.color }}>{rank(level)}</b></div>
                </div>
              </div>
            </div>
            <span className="pill">Lv {level}</span>
          </div>
          <p style={{ margin: '12px 0 0', fontSize: 14 }}>"{company.intro}"</p>
          <div className="dim" style={{ fontSize: 12, marginTop: 6 }}>— {company.contact}, {company.contactRole}</div>
        </div>

        {/* quick actions */}
        <div className="grid cols3" style={{ marginBottom: 20 }}>
          <QuickCard
            icon="📅"
            title="Sfida Giornaliera"
            color="var(--yellow)"
            done={save.daily.done}
            sub={save.daily.done ? 'Completata oggi ✓' : `Streak: ${save.streak.count} 🔥 · +120 XP`}
            btn={save.daily.done ? 'Rigioca' : 'Gioca ora'}
            onClick={playDaily}
          />
          <QuickCard
            icon="💰"
            title="Bug Bounty"
            color="var(--green)"
            sub={`Contratto extra · difficoltà ~Lv${level} · ${save.bountiesDone} completati`}
            btn="Accetta contratto"
            onClick={playBounty}
          />
          <QuickCard
            icon="🥋"
            title="Dojo (allenamento)"
            color="var(--cyan)"
            sub="Allenati su una singola abilità, senza pressione"
            btn="Scegli sfida"
            onClick={() => {
              const el = document.getElementById('dojo');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
          />
        </div>

        {/* next mission highlight */}
        {next ? (
          <>
            <h2 className="h2">🎯 Prossima missione</h2>
            <div className="card hover" style={{ borderColor: 'var(--green-dim)' }}>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <h3>{next.title}</h3>
                <Diff n={Math.max(...next.specs.map((s) => s.difficulty))} />
              </div>
              <div className="meta">da {next.contact}</div>
              <p style={{ fontSize: 14, margin: '10px 0' }}>{next.brief}</p>
              <div className="row" style={{ marginBottom: 10 }}>
                {next.specs.map((s, i) => (
                  <span className="tag" key={i}>{TYPE_META[s.type]?.icon} {TYPE_META[s.type]?.label}</span>
                ))}
              </div>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <span className="dim" style={{ fontSize: 13 }}>Ricompensa: +{next.reward.xp} XP · +{next.reward.credits} 💰 · +{next.reward.rep} rep</span>
                <button className="btn primary" onClick={() => playStory(next)} disabled={!!next.requiresTool && !save.tools.includes(next.requiresTool)}>
                  {next.requiresTool && !save.tools.includes(next.requiresTool) ? `Serve: ${next.requiresTool}` : '▶ Avvia missione'}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="card" style={{ textAlign: 'center', borderColor: 'var(--green-dim)' }}>
            <div style={{ fontSize: 40 }}>🏆</div>
            <h3>Hai completato tutte le missioni per {company.name}!</h3>
            <p className="dim">Vai nella sezione <b>Carriera</b> per candidarti a un'azienda migliore, oppure fai bug bounty e daily per crescere.</p>
          </div>
        )}

        {/* all missions */}
        <h2 className="h2">📋 Incarichi di {company.name}</h2>
        <div className="grid cols2">
          {missions.map((m) => {
            const done = save.completedMissions.includes(m.id);
            const isNext = next?.id === m.id;
            const locked = !done && !isNext;
            const toolMissing = m.requiresTool && !save.tools.includes(m.requiresTool);
            return (
              <div className={'card' + (!locked ? ' hover' : '')} key={m.id} style={{ opacity: locked ? 0.55 : 1 }}>
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <h3 style={{ fontSize: 15 }}>{done ? '✅ ' : isNext ? '▶ ' : '🔒 '}{m.title}</h3>
                  <Diff n={Math.max(...m.specs.map((s) => s.difficulty))} />
                </div>
                <div className="meta">{m.specs.length} sfide · +{m.reward.xp} XP</div>
                {(done || isNext) && <p style={{ fontSize: 13, margin: '8px 0 0', color: 'var(--text-dim)' }}>{m.brief.slice(0, 110)}{m.brief.length > 110 ? '…' : ''}</p>}
                <div className="row" style={{ marginTop: 10 }}>
                  {done && <button className="btn sm ghost" onClick={() => playStory(m)}>Rigioca</button>}
                  {isNext && <button className="btn sm primary" onClick={() => playStory(m)} disabled={!!toolMissing}>{toolMissing ? `Serve ${m.requiresTool}` : 'Gioca'}</button>}
                  {locked && <span className="tag locked">Bloccata</span>}
                </div>
              </div>
            );
          })}
        </div>

        {/* dojo */}
        <h2 className="h2" id="dojo">🥋 Dojo — Allenamento libero</h2>
        <p className="sub">Esercitati su una singola tipologia. Ricompense ridotte, zero pressione.</p>
        <div className="grid cols4">
          {ALL_TYPES.map((t) => (
            <button className="card hover" key={t} style={{ textAlign: 'left', cursor: 'pointer' }} onClick={() => onPlay(buildTraining(t, Math.max(1, Math.min(5, Math.round(1 + level / 8)))))}>
              <div style={{ fontSize: 24 }}>{TYPE_META[t]?.icon}</div>
              <div style={{ fontWeight: 700, marginTop: 4 }}>{TYPE_META[t]?.label}</div>
              <div className="dim" style={{ fontSize: 12 }}>{save.stats.byType[t]?.won ?? 0} vinte</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function QuickCard({ icon, title, sub, btn, onClick, color, done }: { icon: string; title: string; sub: string; btn: string; onClick: () => void; color: string; done?: boolean }) {
  return (
    <div className="card hover" style={{ borderColor: done ? 'var(--border)' : undefined }}>
      <div className="row" style={{ gap: 8 }}>
        <span style={{ fontSize: 22 }}>{icon}</span>
        <h3 style={{ fontSize: 15, color }}>{title}</h3>
      </div>
      <p className="dim" style={{ fontSize: 12.5, margin: '8px 0 12px', minHeight: 34 }}>{sub}</p>
      <button className="btn sm block" onClick={onClick}>{btn}</button>
    </div>
  );
}

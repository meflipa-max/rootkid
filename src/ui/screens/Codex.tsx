import React, { useState } from 'react';
import type { SaveState } from '../../game/types';
import { SKILLS, ACHIEVEMENTS, levelProgress, rank, companyById, TOOLS } from '../../game/engine';
import { GLOSSARY } from '../../game/content/glossary';
import { Bar, Modal } from '../components/common';
import { Bar as RpgBar } from '../components/rpg';
import { Avatar } from '../art/Avatar';

type Tab = 'profile' | 'skills' | 'glossary' | 'achievements' | 'settings';

export function Codex({ save, mutate, onReset }: { save: SaveState; mutate: (fn: (s: SaveState) => void) => void; onReset: () => void }) {
  const [tab, setTab] = useState<Tab>('profile');
  const [confirmReset, setConfirmReset] = useState(false);
  const lp = levelProgress(save.xp);
  const company = companyById(save.companyId);

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'profile', label: 'Profilo', icon: '🪪' },
    { id: 'skills', label: 'Abilità', icon: '📊' },
    { id: 'glossary', label: 'Glossario', icon: '📖' },
    { id: 'achievements', label: 'Obiettivi', icon: '🏆' },
    { id: 'settings', label: 'Opzioni', icon: '⚙️' },
  ];

  return (
    <div className="content">
      <div className="wrap">
        <div className="row" style={{ gap: 4, marginBottom: 16, flexWrap: 'wrap' }}>
          {tabs.map((t) => (
            <button key={t.id} className={'btn sm ' + (tab === t.id ? 'primary' : 'ghost')} onClick={() => setTab(t.id)}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {tab === 'profile' && (
          <div className="fadein">
            <div className="panel" style={{ marginBottom: 16 }}>
              <div className="row" style={{ gap: 16, alignItems: 'flex-start' }}>
                <div className="portrait big"><Avatar level={lp.level} px={5} /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="rpg-title">Scheda personaggio</div>
                  <h1 className="h1 mono" style={{ color: 'var(--green)', margin: '4px 0 2px' }}>{save.handle}</h1>
                  <div className="dim">{rank(lp.level)} · {company.icon} {company.name}</div>
                  <div style={{ marginTop: 10 }}>
                    <RpgBar value={lp.into} max={lp.need} kind="xp" shine />
                    <div className="bar-label">LIVELLO {lp.level} · {lp.into}/{lp.need} XP</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rpg-title" style={{ margin: '18px 0 10px' }}>Equipaggiamento</div>
            <div className="grid cols4" style={{ gap: 10 }}>
              {TOOLS.map((t) => {
                const owned = save.tools.includes(t.id);
                return (
                  <div className={'slot' + (owned ? ' filled' : '')} key={t.id} title={owned ? `${t.name} — ${t.perk}` : `${t.name} (non posseduto)`}>
                    <span style={{ opacity: owned ? 1 : 0.22, filter: owned ? 'none' : 'grayscale(1)' }}>{t.icon}</span>
                    <span className="slot-name">{owned ? t.name : '—'}</span>
                  </div>
                );
              })}
            </div>

            <div className="kpi" style={{ marginBottom: 16 }}>
              <Stat n={save.credits} l="Crediti 💰" c="var(--yellow)" />
              <Stat n={save.reputation} l="Reputazione ⭐" c="var(--cyan)" />
              <Stat n={save.ethics} l="Etica 🕊️" c={save.ethics >= 0 ? 'var(--green)' : 'var(--red)'} />
              <Stat n={save.streak.count} l="Streak 🔥" c="var(--orange)" />
            </div>

            <div className="grid cols3">
              <Stat n={save.stats.challengesWon} l="Sfide vinte" c="var(--green)" small />
              <Stat n={save.missionsDone} l="Missioni storia" c="var(--text)" small />
              <Stat n={save.bountiesDone} l="Bug bounty" c="var(--text)" small />
              <Stat n={save.certs.length} l="Certificazioni" c="var(--yellow)" small />
              <Stat n={save.tools.length} l="Strumenti" c="var(--purple)" small />
              <Stat n={save.glossary.length + '/' + GLOSSARY.length} l="Glossario" c="var(--cyan)" small />
              <Stat n={save.achievements.length + '/' + ACHIEVEMENTS.length} l="Obiettivi" c="var(--orange)" small />
              <Stat n={save.stats.snifferBest} l="Record sniffer" c="var(--green)" small />
              <Stat n={save.streak.best} l="Miglior streak" c="var(--orange)" small />
            </div>
          </div>
        )}

        {tab === 'skills' && (
          <div className="fadein">
            <h1 className="h1">📊 Albero delle abilità</h1>
            <p className="sub">Ogni sfida superata fa crescere l'abilità corrispondente. Un profilo completo ti rende pronto per qualsiasi missione.</p>
            {SKILLS.map((s) => (
              <div key={s.id} style={{ marginBottom: 14 }}>
                <div className="row" style={{ justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>{s.icon} {s.name}</span>
                  <span className="mono dim">{save.skills[s.id] ?? 0}/100</span>
                </div>
                <Bar pct={(save.skills[s.id] ?? 0) / 100} color={s.color} />
              </div>
            ))}
          </div>
        )}

        {tab === 'glossary' && (
          <div className="fadein">
            <h1 className="h1">📖 Glossario</h1>
            <p className="sub">I termini che sblocchi completando le sfide. {save.glossary.length}/{GLOSSARY.length} scoperti. Una vera enciclopedia della sicurezza.</p>
            {SKILLS.map((sk) => {
              const entries = GLOSSARY.filter((g) => g.skill === sk.id);
              const known = entries.filter((g) => save.glossary.includes(g.id));
              if (entries.length === 0) return null;
              return (
                <div key={sk.id} style={{ marginBottom: 18 }}>
                  <h2 className="h2" style={{ color: sk.color }}>{sk.icon} {sk.name} <span className="dim" style={{ fontSize: 13, fontWeight: 400 }}>({known.length}/{entries.length})</span></h2>
                  <div className="grid cols2">
                    {entries.map((g) => {
                      const unlocked = save.glossary.includes(g.id);
                      return (
                        <div className="card" key={g.id} style={{ opacity: unlocked ? 1 : 0.5 }}>
                          <b>{unlocked ? g.term : '🔒 ???'}</b>
                          <div style={{ fontSize: 13, marginTop: 4, color: 'var(--text-dim)' }}>{unlocked ? g.def : 'Completa una sfida su questo argomento per sbloccare.'}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'achievements' && (
          <div className="fadein">
            <h1 className="h1">🏆 Obiettivi</h1>
            <p className="sub">{save.achievements.length}/{ACHIEVEMENTS.length} sbloccati.</p>
            <div className="grid cols3">
              {ACHIEVEMENTS.map((a) => {
                const got = save.achievements.includes(a.id);
                return (
                  <div className="card" key={a.id} style={{ opacity: got ? 1 : 0.45, borderColor: got ? 'var(--purple)' : undefined }}>
                    <div style={{ fontSize: 26 }}>{got ? a.icon : '🔒'}</div>
                    <b style={{ fontSize: 14 }}>{a.name}</b>
                    <div className="dim" style={{ fontSize: 12 }}>{a.desc}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === 'settings' && (
          <div className="fadein">
            <h1 className="h1">⚙️ Opzioni</h1>
            <div className="card" style={{ marginBottom: 12 }}>
              <label className="row" style={{ justifyContent: 'space-between', cursor: 'pointer' }}>
                <span>🖥️ Effetto CRT (scanline retro)</span>
                <input type="checkbox" checked={save.settings.crt} onChange={(e) => mutate((s) => { s.settings.crt = e.target.checked; })} style={{ width: 20, height: 20 }} />
              </label>
            </div>
            <div className="card" style={{ marginBottom: 12 }}>
              <label className="row" style={{ justifyContent: 'space-between', cursor: 'pointer' }}>
                <span>🔠 Testo più grande</span>
                <input type="checkbox" checked={save.settings.bigFont} onChange={(e) => mutate((s) => { s.settings.bigFont = e.target.checked; })} style={{ width: 20, height: 20 }} />
              </label>
            </div>
            <div className="card" style={{ borderColor: 'var(--red)' }}>
              <b style={{ color: 'var(--red)' }}>Zona pericolosa</b>
              <p className="dim" style={{ fontSize: 13 }}>Cancella tutti i progressi e ricomincia da zero. Non si può annullare.</p>
              <button className="btn danger sm" onClick={() => setConfirmReset(true)}>Azzera salvataggio</button>
            </div>
            <p className="dim" style={{ fontSize: 12, marginTop: 16 }}>
              ROOTKID · gioco educativo di ethical hacking · i progressi sono salvati solo su questo browser.
            </p>
          </div>
        )}
      </div>

      {confirmReset && (
        <Modal onClose={() => setConfirmReset(false)}>
          <h2>Azzerare tutto?</h2>
          <p>Perderai livello, crediti, certificazioni e progressi. Sicuro?</p>
          <div className="row" style={{ justifyContent: 'flex-end', marginTop: 12 }}>
            <button className="btn ghost" onClick={() => setConfirmReset(false)}>Annulla</button>
            <button className="btn danger" onClick={onReset}>Sì, cancella tutto</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Stat({ n, l, c, small }: { n: number | string; l: string; c: string; small?: boolean }) {
  return (
    <div className="b">
      <div className="n" style={{ color: c, fontSize: small ? 18 : 22 }}>{n}</div>
      <div className="l">{l}</div>
    </div>
  );
}

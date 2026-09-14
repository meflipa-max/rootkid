import React, { useEffect, useRef, useState } from 'react';
import { useGame } from './ui/useGame';
import type { Mission } from './game/types';
import { levelProgress, rank } from './game/engine';
import { Intro } from './ui/screens/Intro';
import { Dashboard } from './ui/screens/Dashboard';
import { MissionRunner } from './ui/screens/MissionRunner';
import { Academy, Certifications } from './ui/screens/Learn';
import { WorldMap } from './ui/screens/WorldMap';
import { Shop } from './ui/screens/Shop';
import { Inbox } from './ui/screens/Inbox';
import { Codex } from './ui/screens/Codex';
import { AvatarPortrait } from './ui/art/Avatar';
import { Bar, Background, LevelUpOverlay } from './ui/components/rpg';

type Screen = 'dashboard' | 'career' | 'academy' | 'certs' | 'shop' | 'inbox' | 'codex';

export default function App() {
  const { save, mutate, start, reset, toasts, pushToast } = useGame();
  const [screen, setScreen] = useState<Screen>('dashboard');
  const [mission, setMission] = useState<Mission | null>(null);
  const [levelUp, setLevelUp] = useState<number | null>(null);
  const prevLevel = useRef<number | null>(null);

  const lp = save ? levelProgress(save.xp) : null;

  // rileva la salita di livello per l'animazione celebrativa
  useEffect(() => {
    if (!lp) return;
    if (prevLevel.current === null) {
      prevLevel.current = lp.level;
      return;
    }
    if (lp.level > prevLevel.current) setLevelUp(lp.level);
    prevLevel.current = lp.level;
  }, [lp?.level]);

  if (!save || !lp) {
    return (
      <AppFrame crt bigFont={false}>
        <Background />
        <Intro onStart={start} />
      </AppFrame>
    );
  }

  const unread = save.inbox.filter((m) => !m.read).length;

  const nav: { id: Screen; label: string; icon: string; badge?: number }[] = [
    { id: 'dashboard', label: 'Quartier generale', icon: '🏠' },
    { id: 'career', label: 'Mappa', icon: '🗺️' },
    { id: 'academy', label: 'Accademia', icon: '🎓' },
    { id: 'certs', label: 'Certificazioni', icon: '📜' },
    { id: 'shop', label: 'Equipaggiamento', icon: '🧰' },
    { id: 'inbox', label: 'Posta', icon: '📬', badge: unread },
    { id: 'codex', label: 'Eroe', icon: '🪪' },
  ];

  return (
    <AppFrame crt={save.settings.crt} bigFont={save.settings.bigFont}>
      <Background />

      {/* ===== HUD ===== */}
      <div className="hud">
        <span className="brand">&gt;_ ROOT<b>KID</b></span>

        <div className="row" style={{ gap: 9, flex: 1, minWidth: 0, justifyContent: 'flex-end' }}>
          <div className="stat" style={{ minWidth: 92 }}>
            <span className="k">{rank(lp.level)}</span>
            <div style={{ width: 92 }}>
              <Bar value={lp.into} max={lp.need} kind="xp" shine />
            </div>
            <span className="bar-label">XP {lp.into}/{lp.need}</span>
          </div>

          <div className="stat hide-sm">
            <span className="k">Crediti</span>
            <span className="v" style={{ color: 'var(--yellow)' }}>💰 {save.credits}</span>
          </div>
          <div className="stat hide-sm">
            <span className="k">Reputazione</span>
            <span className="v" style={{ color: 'var(--cyan)' }}>⭐ {save.reputation}</span>
          </div>
          <div className="stat">
            <span className="k">Etica</span>
            <span className="v" style={{ color: save.ethics >= 0 ? 'var(--green)' : 'var(--red)' }}>🕊️ {save.ethics}</span>
          </div>

          <div style={{ position: 'relative' }}>
            <AvatarPortrait level={lp.level} px={3} />
            <span className="lvl-badge">{lp.level}</span>
          </div>
        </div>
      </div>

      {/* ===== NAV ===== */}
      {!mission && (
        <div className="nav scrolltip">
          {nav.map((n) => (
            <button key={n.id} className={screen === n.id ? 'active' : ''} onClick={() => setScreen(n.id)}>
              <span>{n.icon}</span> <span className="lbl">{n.label}</span>
              {n.badge ? <span className="badge">{n.badge}</span> : null}
            </button>
          ))}
        </div>
      )}

      {/* ===== CONTENUTO ===== */}
      <div className="app-main">
        {mission ? (
          <MissionRunner
            mission={mission}
            save={save}
            mutate={mutate}
            pushToast={pushToast}
            onExit={() => { setMission(null); setScreen('dashboard'); }}
          />
        ) : screen === 'dashboard' ? (
          <Dashboard save={save} onPlay={setMission} mutate={mutate} />
        ) : screen === 'career' ? (
          <WorldMap save={save} mutate={mutate} pushToast={pushToast} />
        ) : screen === 'academy' ? (
          <Academy save={save} mutate={mutate} pushToast={pushToast} />
        ) : screen === 'certs' ? (
          <Certifications save={save} mutate={mutate} pushToast={pushToast} />
        ) : screen === 'shop' ? (
          <Shop save={save} mutate={mutate} pushToast={pushToast} />
        ) : screen === 'inbox' ? (
          <Inbox save={save} mutate={mutate} />
        ) : (
          <Codex save={save} mutate={mutate} onReset={() => { reset(); setScreen('dashboard'); }} />
        )}
      </div>

      {/* ===== TOAST ===== */}
      <div className="toasts">
        {toasts.map((t) => (
          <div key={t.id} className={'toast ' + (t.kind === 'lvl' ? 'lvl' : t.kind === 'ach' ? 'ach' : '')}>
            <div className="row" style={{ gap: 8 }}>
              <span style={{ fontSize: 20 }}>{t.icon}</span>
              <div>
                <b style={{ fontSize: 14 }}>{t.title}</b>
                {t.body && <div className="dim" style={{ fontSize: 12 }}>{t.body}</div>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {levelUp !== null && <LevelUpOverlay level={levelUp} onClose={() => setLevelUp(null)} />}
    </AppFrame>
  );
}

function AppFrame({ children, crt, bigFont }: { children: React.ReactNode; crt: boolean; bigFont: boolean }) {
  return <div className={'app' + (crt ? ' crt' : '') + (bigFont ? ' bigfont' : '')}>{children}</div>;
}

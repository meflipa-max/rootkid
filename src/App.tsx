import React, { useState } from 'react';
import { useGame } from './ui/useGame';
import type { Mission } from './game/types';
import { levelProgress, rank, nextStoryMission } from './game/engine';
import { Intro } from './ui/screens/Intro';
import { Dashboard } from './ui/screens/Dashboard';
import { MissionRunner } from './ui/screens/MissionRunner';
import { Academy, Certifications } from './ui/screens/Learn';
import { Career } from './ui/screens/Career';
import { Shop } from './ui/screens/Shop';
import { Inbox } from './ui/screens/Inbox';
import { Codex } from './ui/screens/Codex';

type Screen = 'dashboard' | 'career' | 'academy' | 'certs' | 'shop' | 'inbox' | 'codex';

export default function App() {
  const { save, mutate, start, reset, toasts, pushToast } = useGame();
  const [screen, setScreen] = useState<Screen>('dashboard');
  const [mission, setMission] = useState<Mission | null>(null);

  if (!save) return <AppFrame crt bigFont={false}><Intro onStart={start} /></AppFrame>;

  const lp = levelProgress(save.xp);
  const unread = save.inbox.filter((m) => !m.read).length;

  const nav: { id: Screen; label: string; icon: string; badge?: number }[] = [
    { id: 'dashboard', label: 'Base', icon: '🏠' },
    { id: 'career', label: 'Carriera', icon: '💼' },
    { id: 'academy', label: 'Accademia', icon: '🎓' },
    { id: 'certs', label: 'Certificazioni', icon: '📜' },
    { id: 'shop', label: 'Arsenale', icon: '🧰' },
    { id: 'inbox', label: 'Posta', icon: '📬', badge: unread },
    { id: 'codex', label: 'Profilo', icon: '🪪' },
  ];

  function exitMission(completed: boolean) {
    setMission(null);
    // se una missione storia è stata completata e ne esiste una successiva, resta in dashboard
    setScreen('dashboard');
  }

  return (
    <AppFrame crt={save.settings.crt} bigFont={save.settings.bigFont}>
      {/* HUD */}
      <div className="hud">
        <span className="brand">&gt;_ ROOT<b>KID</b></span>
        <div className="spacer" />
        <div className="stat">
          <span className="k">Livello · {rank(lp.level)}</span>
          <span className="v">Lv {lp.level} <span className="lvlbar" style={{ display: 'inline-block', verticalAlign: 'middle' }}><i style={{ width: `${lp.pct * 100}%` }} /></span></span>
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
      </div>

      {/* NAV (nascosta durante la missione) */}
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

      {/* CONTENT */}
      <div className="app-main">
        {mission ? (
          <MissionRunner mission={mission} save={save} mutate={mutate} pushToast={pushToast} onExit={exitMission} />
        ) : screen === 'dashboard' ? (
          <Dashboard save={save} onPlay={setMission} mutate={mutate} />
        ) : screen === 'career' ? (
          <Career save={save} mutate={mutate} pushToast={pushToast} />
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

      {/* TOASTS */}
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
    </AppFrame>
  );
}

function AppFrame({ children, crt, bigFont }: { children: React.ReactNode; crt: boolean; bigFont: boolean }) {
  return <div className={'app' + (crt ? ' crt' : '') + (bigFont ? ' bigfont' : '')}>{children}</div>;
}

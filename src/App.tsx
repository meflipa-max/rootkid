import { useState } from 'react';
import { AppProvider, useApp } from './store';
import type { Category, Dish } from './lib/types';
import { Home, type Mode } from './screens/Home';
import { Stats } from './screens/Stats';
import { Settings } from './screens/Settings';
import { Game } from './screens/Game';
import { Learn } from './screens/Learn';
import { mastery, weight } from './lib/mastery';
import { sfx } from './lib/fx';
import { IngDefs } from './components/Ing';

type Tab = 'home' | 'stats' | 'settings';

function Shell() {
  const { save } = useApp();
  const [tab, setTab] = useState<Tab>('home');
  const [cat, setCat] = useState<Category | 'all'>('all');
  const [run, setRun] = useState<{ mode: Mode; pool: Dish[]; n: number } | null>(null);

  const launch = (mode: Mode, pool?: Dish[]) => {
    let p = pool ?? save.dishes.filter((d) => cat === 'all' || d.category === cat);
    if (mode === 'focus' && !pool) {
      const now = Date.now();
      p = [...p].sort((a, b) => weight(save.stats[b.id], now) - weight(save.stats[a.id], now)).slice(0, 5);
    }
    if (p.length) setRun({ mode, pool: p, n: Date.now() });
  };
  const exit = () => setRun(null);

  if (run) {
    const key = run.n;
    if (run.mode === 'learn') return <Learn key={key} pool={run.pool} onExit={exit} />;
    return <Game key={key} pool={run.pool} title={run.mode === 'focus' ? 'Punti deboli' : 'Turno'} onExit={exit} />;
  }

  const weakPool = () => {
    const seen = save.dishes.filter((d) => save.stats[d.id]?.seen);
    const base = seen.length >= 3 ? seen : save.dishes;
    return [...base].sort((a, b) => mastery(save.stats[a.id]) - mastery(save.stats[b.id])).slice(0, 5);
  };

  return (
    <div className="app">
      <main>
        {tab === 'home' && <Home cat={cat} setCat={setCat} start={(m) => launch(m)} />}
        {tab === 'stats' && <Stats focus={() => launch('focus', weakPool())} />}
        {tab === 'settings' && <Settings />}
      </main>
      <nav className="tabs">
        {(
          [
            ['home', '🍕', 'Gioca'],
            ['stats', '📊', 'Statistiche'],
            ['settings', '⚙️', 'Impostazioni'],
          ] as const
        ).map(([id, e, l]) => (
          <button key={id} className={tab === id ? 'on' : ''} onClick={() => { sfx.tap(); setTab(id); window.scrollTo(0, 0); }}>
            <span>{e}</span>
            {l}
          </button>
        ))}
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <IngDefs />
      <Shell />
    </AppProvider>
  );
}

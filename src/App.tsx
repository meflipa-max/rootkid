import { useEffect, useState } from 'react';
import { CAT_ING, Icon } from './components/Icon';
import { dishThumbOf, hasWebGL, prewarm } from './three/thumbs';
import { askTilt } from './three/bus';
import { AppProvider, useApp } from './store';
import type { Category, Dish } from './lib/types';
import { Home, type Mode } from './screens/Home';
import { Stats } from './screens/Stats';
import { Settings } from './screens/Settings';
import { Game } from './screens/Game';
import { Learn } from './screens/Learn';
import { Write } from './screens/Write';
import { Imagine } from './screens/Imagine';
import { isPopular, pendingReal } from './lib/real';
import { isDue, mastery, weight } from './lib/mastery';
import { sfx } from './lib/fx';
import { IngDefs } from './components/Ing';
import { useHoldUpdate } from './lib/pwa';
import { Welcome } from './components/Welcome';

type Tab = 'home' | 'stats' | 'settings';

/** una volta sola, per chi giocava già: la memoria ora è misurata in modo più onesto */
function MemoryNews() {
  const app = useApp();
  return (
    <div className="modal">
      <div className="modal-in">
        <h3>Memoria più precisa</h3>
        <p>Il gioco ora capisce meglio quanto sai un piatto:</p>
        <ul className="news">
          <li>Copiare la ricetta è <b>studio</b>: il piatto torna poco dopo e lì conta ricordarlo.</li>
          <li>Il <b>campanello</b> suona quando il numero torna, giusto o sbagliato: non suggerisce più.</li>
          <li><b>Aiuto</b> vuol dire "non lo sapevo", e il piatto torna nel turno.</li>
          <li>Conta anche <b>come</b> rispondi: sicuro e veloce, o con ripensamenti.</li>
          <li>I panini si montano <b>dal basso</b>, le pizze si <b>infornano</b> e poi si completano all'uscita.</li>
        </ul>
        <p className="muted sm">Alcuni piatti potrebbero scendere di fase ai primi errori: è la misura che diventa onesta, non un peggioramento. Gli ordini di montaggio e cosa va dopo il forno sono una <b>bozza</b>: controllali in Impostazioni → Ricette.</p>
        <button className="btn primary wide" onClick={() => { sfx.tap(); app.ackMemory(); }}>Ho capito</button>
      </div>
    </div>
  );
}

function Shell() {
  const { save } = useApp();
  const [tab, setTab] = useState<Tab>('home');
  const [cat, setCat] = useState<Category | 'all'>('all');
  const app = useApp();
  const [run, setRun] = useState<{ mode: Mode; pool: Dish[]; n: number } | null>(null);
  useEffect(() => {
    prewarm([...Object.values(CAT_ING), ...save.dishes.flatMap((d) => d.ingredients)]);
    if (hasWebGL()) save.dishes.forEach((d) => dishThumbOf(d.ingredients, d.category));
  }, [save.dishes]);

  const launch = (mode: Mode, pool?: Dish[]) => {
    askTilt();
    let p = pool ?? save.dishes.filter((d) => cat === 'all' || d.category === cat);
    const now = Date.now();
    const due = (id: string) => (save.stats[id]?.seen && isDue(save.stats[id], now) ? 1 : 0);
    if (mode === 'focus' && !pool) {
      // ripasso: prima i piatti "maturi" per la ripetizione dilazionata, poi i più deboli
      p = [...p].sort((a, b) => due(b.id) - due(a.id) || weight(save.stats[b.id], now) - weight(save.stats[a.id], now)).slice(0, 6);
    }
    if (mode === 'sabato') p = save.dishes;
    if (mode === 'warmup') {
      // prima del turno: i più ordinati, poi quelli da ripassare, poi i più deboli fra quelli già visti
      const seen = save.dishes.filter((d) => save.stats[d.id]?.seen);
      const base = seen.length >= 3 ? seen : save.dishes;
      const pop = (d: Dish) => (isPopular(save, d) ? 1 : 0);
      p = [...base].sort((a, b) => pop(b) - pop(a) || due(b.id) - due(a.id) || weight(save.stats[b.id], now) - weight(save.stats[a.id], now)).slice(0, 6);
    }
    if (mode === 'yesterday') {
      const r = pendingReal(save);
      if (r) app.setRealDone(r.date);
    }
    if (p.length) setRun({ mode, pool: p, n: Date.now() });
  };
  const exit = () => setRun(null);
  // niente aggiornamenti automatici a metà turno
  useHoldUpdate(!!run);

  if (run) {
    const key = run.n;
    if (run.mode === 'learn') return <Learn key={key} pool={run.pool} onExit={exit} />;
    if (run.mode === 'write') return <Write key={key} pool={run.pool} onExit={exit} />;
    if (run.mode === 'imagine') return <Imagine key={key} pool={run.pool} onExit={exit} />;
    const titles: Partial<Record<Mode, string>> = { focus: 'Ripasso', sabato: 'Sabato sera', warmup: 'Prima del turno', yesterday: 'Il turno di ieri' };
    return (
      <Game
        key={key}
        pool={run.pool}
        title={titles[run.mode] ?? 'Turno'}
        total={run.mode === 'sabato' ? 12 : run.mode === 'warmup' ? 6 : run.mode === 'yesterday' ? Math.max(6, Math.min(10, run.pool.length + 3)) : 8}
        coinMult={run.mode === 'sabato' ? 1.5 : 1}
        onExit={exit}
      />
    );
  }

  const weakPool = () => {
    const seen = save.dishes.filter((d) => save.stats[d.id]?.seen);
    const base = seen.length >= 3 ? seen : save.dishes;
    return [...base].sort((a, b) => mastery(save.stats[a.id]) - mastery(save.stats[b.id])).slice(0, 5);
  };

  return (
    <div className="app">
      <main>
        {tab === 'home' && <Home cat={cat} setCat={setCat} start={(m, p) => launch(m, p)} />}
        {tab === 'stats' && <Stats focus={() => launch('focus', weakPool())} />}
        {tab === 'settings' && <Settings />}
      </main>
      {!save.settings.setup && <Welcome />}
      {save.settings.setup && (save.memV ?? 1) < 2 && <MemoryNews />}
      <nav className="tabs">
        {(
          [
            ['home', 'store', 'Gioca'],
            ['stats', 'chart', 'Statistiche'],
            ['settings', 'gear', 'Impostazioni'],
          ] as const
        ).map(([id, e, l]) => (
          <button key={id} className={tab === id ? 'on' : ''} onClick={() => { sfx.tap(); setTab(id); window.scrollTo(0, 0); }}>
            <span><Icon name={e} size={22} /></span>
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

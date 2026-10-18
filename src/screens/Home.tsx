import { useApp } from '../store';
import { CATEGORIES } from '../lib/data';
import { levelBounds, levelOf, mastery, titleOf } from '../lib/mastery';
import type { Category } from '../lib/types';
import { Bar, Ring } from '../components/ui';
import { sfx } from '../lib/fx';

export type Mode = 'session' | 'focus' | 'rush' | 'learn';

export function Home({ cat, setCat, start }: { cat: Category | 'all'; setCat: (c: Category | 'all') => void; start: (m: Mode) => void }) {
  const { save } = useApp();
  const lvl = levelOf(save.xp);
  const [lo, hi] = levelBounds(lvl);
  const active = save.todayDate === new Date().toLocaleDateString('sv') ? save.todayCount : 0;
  const goal = save.settings.dailyGoal;
  const pool = save.dishes.filter((d) => cat === 'all' || d.category === cat);
  const avg = pool.length ? pool.reduce((a, d) => a + mastery(save.stats[d.id]), 0) / pool.length : 0;
  const go = (m: Mode) => {
    sfx.tap();
    start(m);
  };

  return (
    <div className="page">
      <header className="hero">
        <div>
          <div className="hello">Ciao pizzaiolo 👋</div>
          <h1 className="brand">Pizza<span>Master</span></h1>
        </div>
        <div className="streak" title="Giorni di fila">🔥 {save.streakDays}</div>
      </header>

      <section className="card lvl">
        <div className="lvl-top">
          <div>
            <div className="lvl-n">Livello {lvl}</div>
            <div className="muted">{titleOf(lvl)} · {save.xp} XP</div>
          </div>
          <Ring value={active / goal} size={72} stroke={8} color={active >= goal ? '#2ee59d' : '#ffd24a'}>
            <b>{Math.min(active, goal)}</b><small>/{goal}</small>
          </Ring>
        </div>
        <Bar value={(save.xp - lo) / (hi - lo)} color="linear-gradient(90deg,#ff8a3d,#ff3d81)" h={10} />
        <div className="muted sm">{active >= goal ? '🎯 Obiettivo di oggi raggiunto!' : `Obiettivo di oggi: ${goal - active} risposte per mantenere la serie`}</div>
      </section>

      <div className="cats">
        <button className={`cat ${cat === 'all' ? 'on' : ''}`} onClick={() => setCat('all')}>✨ Tutti</button>
        {CATEGORIES.map((c) => (
          <button key={c.id} className={`cat ${cat === c.id ? 'on' : ''}`} style={cat === c.id ? { background: c.color, color: '#1a1030' } : undefined} onClick={() => setCat(c.id)}>
            {c.emoji} {c.name}
          </button>
        ))}
      </div>
      <div className="muted sm c">Padronanza in questa selezione: <b>{Math.round(avg * 100)}%</b> · {pool.length} piatti</div>

      <button className="btn primary wide big hero-btn" disabled={!pool.length} onClick={() => go('session')}>
        <span>🎯 Allenamento smart</span>
        <small>10 domande, più spazio ai piatti deboli</small>
      </button>
      <div className="grid2">
        <button className="btn tile rush" disabled={pool.length < 3} onClick={() => go('rush')}>⚡<b>Rush 60s</b><small>Record {save.bestRush}</small></button>
        <button className="btn tile learn" disabled={!pool.length} onClick={() => go('learn')}>📚<b>Studia</b><small>Schede ricette</small></button>
      </div>
      <button className="btn tile focus wide" disabled={!pool.length} onClick={() => go('focus')}>
        🩹 <b>Ripasso punti deboli</b><small>Solo i 5 piatti dove sbagli di più</small>
      </button>
    </div>
  );
}

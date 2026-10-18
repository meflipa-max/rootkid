import { useState } from 'react';
import { useApp } from '../store';
import { CATEGORIES } from '../lib/data';
import { levelBounds, levelOf, mastery, titleOf } from '../lib/mastery';
import type { Category } from '../lib/types';
import { Bar, Ring } from '../components/ui';
import { sfx } from '../lib/fx';
import { CHEF_LOOK, Person } from '../components/Person';
import { SKINS } from '../lib/skins';

export type Mode = 'game' | 'focus' | 'learn';

function Shop({ onClose }: { onClose: () => void }) {
  const app = useApp();
  const { coins, skins, skin } = app.save;
  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-in" onClick={(e) => e.stopPropagation()}>
        <div className="row-between"><h3>👨‍🍳 Guardaroba</h3><span className="coins-big">🪙 {coins}</span></div>
        {SKINS.map((s) => {
          const own = skins.includes(s.id);
          return (
            <div key={s.id} className="skin-row">
              <div className="pv"><Person look={CHEF_LOOK} chef={s} /></div>
              <div className="nm">{s.name}</div>
              {own ? (
                <button className={`btn sm ${skin === s.id ? 'good' : ''}`} onClick={() => { sfx.tap(); app.selectSkin(s.id); }}>{skin === s.id ? 'In uso' : 'Usa'}</button>
              ) : (
                <button className="btn primary sm" disabled={coins < s.cost} onClick={() => { if (app.buySkin(s.id, s.cost)) sfx.win(); }}>🪙 {s.cost}</button>
              )}
            </div>
          );
        })}
        <button className="btn ghost wide" onClick={onClose}>Chiudi</button>
      </div>
    </div>
  );
}

export function Home({ cat, setCat, start }: { cat: Category | 'all'; setCat: (c: Category | 'all') => void; start: (m: Mode) => void }) {
  const { save } = useApp();
  const [shop, setShop] = useState(false);
  const lvl = levelOf(save.xp);
  const [lo, hi] = levelBounds(lvl);
  const active = save.todayDate === new Date().toLocaleDateString('sv') ? save.todayCount : 0;
  const goal = save.settings.dailyGoal;
  const pool = save.dishes.filter((d) => cat === 'all' || d.category === cat);
  const avg = pool.length ? pool.reduce((a, d) => a + mastery(save.stats[d.id]), 0) / pool.length : 0;
  const skin = SKINS.find((s) => s.id === save.skin) ?? SKINS[0];
  const go = (m: Mode) => {
    sfx.tap();
    start(m);
  };

  return (
    <div className="page">
      <header className="hero">
        <div>
          <div className="hello">Pizzeria da Mario</div>
          <h1 className="brand">Pizza<span>Master</span></h1>
        </div>
        <div className="streak" title="Giorni di fila">🔥 {save.streakDays}</div>
      </header>

      <section className="card chef-card">
        <div className="home-chef"><Person look={CHEF_LOOK} chef={skin} mood="happy" /></div>
        <div style={{ flex: 1 }}>
          <div className="lvl-n">Livello {lvl} · {titleOf(lvl)}</div>
          <div className="muted sm">{save.xp} XP · 🪙 {save.coins}</div>
          <div style={{ marginTop: 8 }}><Bar value={(save.xp - lo) / (hi - lo)} color="linear-gradient(90deg,#ff8a3d,#ff3d81)" h={10} /></div>
        </div>
        <Ring value={active / goal} size={64} stroke={7} color={active >= goal ? '#2ee59d' : '#ffd24a'}>
          <b style={{ fontSize: 18 }}>{Math.min(active, goal)}</b>
        </Ring>
      </section>

      <div className="cats">
        <button className={`cat ${cat === 'all' ? 'on' : ''}`} onClick={() => setCat('all')}>✨ Tutto il menu</button>
        {CATEGORIES.map((c) => (
          <button key={c.id} className={`cat ${cat === c.id ? 'on' : ''}`} style={cat === c.id ? { background: c.color, color: '#1a1030' } : undefined} onClick={() => setCat(c.id)}>
            {c.emoji} {c.name}
          </button>
        ))}
      </div>
      <div className="muted sm c">Padronanza del menu selezionato: <b>{Math.round(avg * 100)}%</b> · record turno <b>{save.bestShift}</b></div>

      <button className="btn primary wide big hero-btn" disabled={!pool.length} onClick={() => go('game')}>
        <span>▶ INIZIA IL TURNO</span>
        <small>8 clienti, 3 vite: prepara gli ordini prima che se ne vadano!</small>
      </button>
      <div className="grid2">
        <button className="btn tile rush" onClick={() => { sfx.tap(); setShop(true); }}>👨‍🍳<b>Guardaroba</b><small>🪙 {save.coins} da spendere</small></button>
        <button className="btn tile learn" disabled={!pool.length} onClick={() => go('learn')}>📖<b>Ricettario</b><small>Schede da ripassare</small></button>
      </div>
      <button className="btn tile focus wide" disabled={!pool.length} onClick={() => go('focus')}>
        🩹 <b>Turno punti deboli</b><small>Solo i 5 piatti dove sbagli di più</small>
      </button>
      {shop && <Shop onClose={() => setShop(false)} />}
    </div>
  );
}

import { useState } from 'react';
import { CAT_ING } from '../components/Icon';
import { DishPic, Ing } from '../components/Ing';
import { useApp } from '../store';
import { CATEGORIES, catOf } from '../lib/data';
import { accuracy, freshness, isDusty, mastery, masteryColor, masteryLabel } from '../lib/mastery';
import { realCount } from '../lib/real';
import { RecipeView } from '../components/Recipe';
import { Bar, Chip, Pips, Ring } from '../components/ui';

export function Stats({ focus }: { focus: () => void }) {
  const { save } = useApp();
  const [open, setOpen] = useState<string | null>(null);
  const rows = save.dishes
    .map((d) => ({ d, s: save.stats[d.id], m: mastery(save.stats[d.id]) }))
    .sort((a, b) => a.m - b.m || (a.s?.seen ? 1 : 0) - (b.s?.seen ? 1 : 0));
  const avg = rows.length ? rows.reduce((a, r) => a + r.m, 0) / rows.length : 0;
  const acc = save.totalAnswered ? save.totalCorrect / save.totalAnswered : 0;
  const mastered = rows.filter((r) => r.m >= 1).length;
  const studied = rows.filter((r) => r.s?.seen);
  const weakest = studied.slice(0, 3);

  return (
    <div className="page">
      <h2 className="h">Statistiche</h2>
      <section className="card row-c">
        <Ring value={avg} size={96} stroke={10} color={masteryColor(avg)}>
          <b>{Math.round(avg * 100)}%</b>
        </Ring>
        <div className="kv">
          <div><b>{mastered}</b>/{rows.length} piatti padroneggiati</div>
          <div><b>{save.totalAnswered}</b> risposte · <b>{Math.round(acc * 100)}%</b> giuste</div>
          <div>Serie {save.streakDays} gg · record turno {save.bestShift}</div>
        </div>
      </section>

      {(save.sure?.n ?? 0) >= 3 && (
        <section className="card">
          <div className="card-h">Quanto ti conosci</div>
          <div className="sm">Quando dici <b>Sicuro!</b> hai ragione <b>{Math.round((save.sure!.ok / save.sure!.n) * 10)} volte su 10</b> ({save.sure!.ok}/{save.sure!.n}).</div>
          <div className="muted sm">{save.sure!.ok / save.sure!.n >= 0.85 ? 'Ti conosci bene: quando sei sicuro, puoi fidarti.' : 'A volte sei sicuro e sbagli: sono gli errori che si ricordano meglio, ma vale la pena fermarsi un attimo in più.'}</div>
        </section>
      )}

      {weakest.length > 0 && (
        <section className="card warn">
          <div className="card-h">Dove sei più carente</div>
          {weakest.map(({ d, s }) => (
            <div key={d.id} className="weak">
              <b>{d.name}</b>
              <span className="muted sm">{s ? `${Math.round(accuracy(s) * 100)}% giuste` : ''}</span>
            </div>
          ))}
          <button className="btn primary wide" onClick={focus}>Allena i punti deboli</button>
        </section>
      )}

      <h3 className="h3">La tua vetrina <span className="muted sm">{mastered}/{rows.length} a memoria</span></h3>
      <section className="card vetrina">
        {CATEGORIES.map((c) => {
          const list = save.dishes.filter((d) => d.category === c.id);
          if (!list.length) return null;
          return (
            <div key={c.id} className="shelf">
              <div className="shelf-row">
                {list.map((d) => {
                  const st = save.stats[d.id];
                  const box = st?.seen ? st.box : -1;
                  return (
                    <button key={d.id} className={`vt ${box < 0 ? 'locked' : box >= 5 ? 'gold' : box >= 3 ? 'warm' : 'cold'} ${isDusty(st) ? 'dusty' : ''}`} onClick={() => { setOpen(d.id); setTimeout(() => document.querySelector(`[data-dish="${d.id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50); }}>
                      <DishPic dish={d} />
                      <span className="vt-n">{box < 0 ? '???' : d.name}</span>
                      {box >= 0 && <Pips box={box} size={6} />}
                    </button>
                  );
                })}
              </div>
              <div className="shelf-board"><Ing name={CAT_ING[c.id]} /> {c.name}</div>
            </div>
          );
        })}
        <div className="muted sm">I piatti mai serviti sono sagome: servili per sbloccarli, portali alla fase Oro per la cornice d'oro. Quelli impolverati sono da rinfrescare: basta un ripasso.</div>
      </section>

      <h3 className="h3">Per categoria</h3>
      <section className="card">
        {CATEGORIES.map((c) => {
          const list = rows.filter((r) => r.d.category === c.id);
          if (!list.length) return null;
          const v = list.reduce((a, r) => a + r.m, 0) / list.length;
          return (
            <div key={c.id} className="cat-row">
              <span className="cat-l"><Ing name={CAT_ING[c.id]} /> {c.name}</span>
              <Bar value={v} color={c.color} />
              <b>{Math.round(v * 100)}%</b>
            </div>
          );
        })}
      </section>

      <h3 className="h3">Tutti i piatti <span className="muted sm">dal più debole</span></h3>
      <section className="list">
        {rows.map(({ d, s, m }) => {
          const lab = masteryLabel(s);
          const missed = Object.entries(s?.missed ?? {}).sort((a, b) => b[1] - a[1]).slice(0, 4);
          return (
            <div key={d.id} data-dish={d.id} className="dish-row" onClick={() => setOpen(open === d.id ? null : d.id)}>
              <div className="dr-top">
                <span className="dr-n">{d.name}</span>
                <span className="dr-l" style={{ color: lab.color }}>{lab.text}</span>
              </div>
              <div className="dr-pips"><Pips box={s?.seen ? s.box : 0} size={12} /><Bar value={m} color={masteryColor(m)} /></div>
              {open === d.id && (
                <div className="dr-more">
                  <div className="muted sm">{s?.seen ? `${s.correct}/${s.seen} risposte giuste · serie attuale ${s.streak}` : 'Non ancora provato'}</div>
                  {s?.fs && <div className="muted sm">Freschezza: <b>{Math.round(freshness(s) * 100)}%</b> di probabilità di ricordarlo adesso{isDusty(s) ? ' · da rinfrescare' : ''}</div>}
                  {realCount(save, d.id) > 0 && <div className="muted sm">Fatto al lavoro in <b>{realCount(save, d.id)}</b> {realCount(save, d.id) === 1 ? 'giorno' : 'giorni'}</div>}
                  <RecipeView dish={d} />
                  {Object.keys(s?.confused ?? {}).length > 0 && (
                    <div className="muted sm">Lo confondi con: <b>{Object.entries(s!.confused!).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => k).join(', ')}</b></div>
                  )}
                  {missed.length > 0 && (
                    <>
                      <div className="muted sm">Ingredienti che dimentichi più spesso:</div>
                      <div className="chips">{missed.map(([k, n]) => <Chip key={k} text={`${k} ×${n}`} state="bad" />)}</div>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </section>
    </div>
  );
}

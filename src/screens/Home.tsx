import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../store';
import { CATEGORIES, catOf } from '../lib/data';
import { dueCount, freshness, isDue, isDusty, levelBounds, levelOf, mastery } from '../lib/mastery';
import { UNLOCKS, knownCount, titleFor, unlocked } from '../lib/levels';
import { dayLabel, pendingReal } from '../lib/real';
import { today } from '../lib/missions';
import type { Category, Dish } from '../lib/types';
import { Bar, Ring } from '../components/ui';
import { burst, centerOf, confetti, flyCoins, sfx } from '../lib/fx';
import { CHEF_LOOK, Person } from '../components/Person';
import { SKINS } from '../lib/skins';
import { DEAL_OFF, UPGRADES, dealOf, goalOf, lvlOf, priceOf, totalBuilt, totalMax, upgradeCost, type Upgrade } from '../lib/build';
import { Awning, Scene } from '../components/Scene';
import { currentDaily, missionById, progressOf, type Mission } from '../lib/missions';
import { CAT_ING, Coin, Icon, MISSION_ICON, UPGRADE_ICON } from '../components/Icon';
import { Ing } from '../components/Ing';
import { cap } from '../lib/emoji';
import { hasWebGL } from '../three/thumbs';
import { ChefPreview, Diorama } from '../three/Diorama';
import { InstallCard } from '../components/Install';
import { ShareCard } from '../components/Share';
import { growthNews, growthOf, seenOf, type Growth } from '../lib/growth';
import { BANCO_COLOR } from '../three/Growth';

export type Mode = 'game' | 'focus' | 'learn' | 'write' | 'imagine' | 'sabato' | 'warmup' | 'yesterday';

function Shop({ onClose }: { onClose: () => void }) {
  const app = useApp();
  const { coins, skins, skin } = app.save;
  const [pv, setPv] = useState(skin);
  const show = SKINS.find((s) => s.id === pv) ?? SKINS[0];
  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-in" onClick={(e) => e.stopPropagation()}>
        <div className="row-between"><h3>Guardaroba</h3><span className="coins-big"><Coin /> {coins}</span></div>
        {hasWebGL() ? <div className="chef-stage"><ChefPreview skin={show} /></div> : <div className="chef-stage flat"><Person look={CHEF_LOOK} chef={show} /></div>}
        {SKINS.map((s) => {
          const own = skins.includes(s.id);
          return (
            <div key={s.id} className={`skin-row ${pv === s.id ? 'on' : ''}`} onClick={() => { sfx.tap(); setPv(s.id); }}>
              <span className="swatch"><i style={{ background: s.hat }} /><i style={{ background: s.shirt }} /><i style={{ background: s.apron }} /></span>
              <div className="nm">{s.name}</div>
              {own ? (
                <button className={`btn sm ${skin === s.id ? 'good' : ''}`} onClick={(e) => { e.stopPropagation(); sfx.tap(); app.selectSkin(s.id); setPv(s.id); }}>{skin === s.id ? 'In uso' : 'Usa'}</button>
              ) : (
                <button className="btn primary sm" disabled={coins < s.cost} onClick={(e) => { e.stopPropagation(); if (app.buySkin(s.id, s.cost)) { sfx.win(); setPv(s.id); } }}><Coin size={15} /> {s.cost}</button>
              )}
            </div>
          );
        })}
        <button className="btn ghost wide" onClick={onClose}>Chiudi</button>
      </div>
    </div>
  );
}

/** Ricettario: prima si sceglie quali schede ripassare (solo i piatti già incontrati, oppure tutti) e la categoria */
function Deck({ onPick, onClose }: { onPick: (mode: 'learn' | 'write' | 'imagine', pool: Dish[]) => void; onClose: () => void }) {
  const { save, menu, mine } = useApp();
  const banchi = save.settings.banchi;
  const known = mine.filter((d) => save.stats[d.id]?.seen);
  const [onlyKnown, setOnlyKnown] = useState(known.length > 0);
  const [mode, setMode] = useState<'learn' | 'write' | 'imagine'>('learn');
  const base = onlyKnown ? known : mine;
  const pick = (list: Dish[]) => {
    if (!list.length) return;
    sfx.tap();
    onPick(mode, list);
  };
  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-in" onClick={(e) => e.stopPropagation()}>
        <h3>Ricettario</h3>
        <div className="setting-h">Come vuoi ripassare?</div>
        <div className="seg three">
          <button className={mode === 'learn' ? 'on' : ''} onClick={() => { sfx.tap(); setMode('learn'); }}>Schede da girare<small>leggi e ripeti</small></button>
          <button className={mode === 'imagine' ? 'on' : ''} onClick={() => { sfx.tap(); setMode('imagine'); }}>Immagina di montarlo<small>uno strato alla volta</small></button>
          <button className={mode === 'write' ? 'on' : ''} onClick={() => { sfx.tap(); setMode('write'); }}>Scrivi a memoria<small>vale doppio</small></button>
        </div>
        {mode === 'write' && <div className="muted sm">Vedi solo il nome del piatto e scrivi tu gli ingredienti. Se li scrivi tutti senza errori il piatto sale di 2 fasi invece di 1.</div>}
        {mode === 'imagine' && <div className="muted sm">Rifai a mente quello che fai al banco: il gioco ti accompagna strato dopo strato, tu pensi cosa viene dopo e poi lo scopri.</div>}
        <div className="setting-h">Quali piatti vuoi ripassare?</div>
        <div className="seg two">
          <button className={onlyKnown ? 'on' : ''} disabled={!known.length} onClick={() => { sfx.tap(); setOnlyKnown(true); }}>Già incontrati<small>{known.length} piatti</small></button>
          <button className={onlyKnown ? '' : 'on'} onClick={() => { sfx.tap(); setOnlyKnown(false); }}>Tutto il menu<small>{mine.length} piatti{banchi ? ' dei tuoi banchi' : ''}</small></button>
        </div>
        {!known.length && <div className="muted sm">Non hai ancora servito nessun piatto: gioca un turno e qui troverai quelli che hai incontrato.</div>}
        <div className="setting-h">Scegli la categoria</div>
        <button className="choice" onClick={() => pick(base)}>
          <span className="ch-e"><Icon name="book" size={26} /></span>
          <span><b>{banchi ? 'I miei banchi' : 'Tutte le categorie'}</b>{base.length} schede</span>
        </button>
        {CATEGORIES.map((c) => {
          // le categorie fuori dai banchi si possono allenare lo stesso
          const list = (onlyKnown ? menu.filter((d) => save.stats[d.id]?.seen) : menu).filter((d) => d.category === c.id);
          if (!list.length) return null;
          return (
            <button key={c.id} className="choice" onClick={() => pick(list)}>
              <span className="ch-e"><Ing name={CAT_ING[c.id]} /></span>
              <span><b>{c.name}</b>{list.length} {list.length === 1 ? 'scheda' : 'schede'}</span>
            </button>
          );
        })}
        <button className="btn ghost wide" onClick={onClose}>Chiudi</button>
      </div>
    </div>
  );
}

/** foglio basso: il diorama resta visibile sopra, così vedi comparire l'oggetto che compri */
function Build({ focus, onClose, onBought }: { focus: string | null; onClose: () => void; onBought: (u: Upgrade, lvl: number) => void }) {
  const app = useApp();
  const { coins, build } = app.save;
  const deal = dealOf(today(), build, app.save.dealUsed);
  const goal = goalOf(build, app.save.goal, deal);
  const list = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (focus) list.current?.querySelector(`[data-up="${focus}"]`)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [focus]);
  const buy = (u: Upgrade) => {
    const lvl = lvlOf(build, u.id);
    if (app.upgrade(u.id)) onBought(u, lvl + 1);
  };
  const pin = (u: Upgrade) => {
    sfx.tap();
    app.setGoal(app.save.goal === u.id ? undefined : u.id);
  };
  // l'offerta in cima, poi l'ordine di sempre
  const rows = [...UPGRADES].sort((a, b) => +(b.id === deal) - +(a.id === deal));
  return (
    <div className="modal half" onClick={onClose}>
      <div className="modal-in" onClick={(e) => e.stopPropagation()} ref={list}>
        <div className="row-between"><h3>Il tuo locale</h3><span className="coins-big"><Coin /> {coins}</span></div>
        <Bar value={totalBuilt(build) / totalMax} color="#c65a3c" h={10} />
        <div className="muted sm">Gli angoli dei banchi e la parete dei piatti d'oro non si comprano: crescono quando impari.</div>
        {rows.map((u) => {
          const lvl = lvlOf(build, u.id);
          const maxed = lvl >= u.max;
          const cost = priceOf(u, lvl, deal);
          const isDeal = deal === u.id && !maxed;
          const isGoal = goal?.u.id === u.id && goal.pinned;
          return (
            <div key={u.id} data-up={u.id} className={`skin-row ${focus === u.id ? 'on' : ''} ${isDeal ? 'deal' : ''}`}>
              <div className="up-e"><Icon name={UPGRADE_ICON[u.id]} size={22} /></div>
              <div style={{ flex: 1 }}>
                {isDeal && <div className="deal-tag">Offerta di oggi −{Math.round(DEAL_OFF * 100)}%</div>}
                <div className="nm">{u.name} <span className="muted sm">Lv {lvl}/{u.max}</span></div>
                {/* le decorazioni dicono la stessa cosa a ogni livello: niente confronto */}
                {maxed || u.desc(1) === u.desc(2) ? (
                  <div className="muted sm">{u.desc(Math.max(1, lvl))}</div>
                ) : lvl === 0 ? (
                  <div className="muted sm"><b>Comprando:</b> {u.desc(1)}</div>
                ) : (
                  <>
                    <div className="muted sm"><b>Ora:</b> {u.desc(lvl)}</div>
                    <div className="muted sm"><b>Livello {lvl + 1}:</b> {u.desc(lvl + 1)}</div>
                  </>
                )}
              </div>
              {maxed ? <span className="badge max">MAX</span> : (
                <div className="up-act">
                  <button className="btn primary sm" disabled={coins < cost} onClick={() => buy(u)}>
                    <Coin size={15} /> {isDeal && <s>{upgradeCost(u, lvl)}</s>} {cost}
                  </button>
                  {coins < cost && (
                    <button className={`pin ${isGoal ? 'on' : ''}`} onClick={() => pin(u)} aria-pressed={isGoal}>
                      <Icon name="target" size={14} /> {isGoal ? 'Obiettivo' : 'Punta'}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
        <button className="btn ghost wide" onClick={onClose}>Chiudi</button>
      </div>
    </div>
  );
}

/** sotto il diorama: i banchi del locale e quanti piatti sai di ognuno; toccandone uno la camera ci va */
function GrowthLegend({ growth, onPick }: { growth: Growth; onPick: (id: string) => void }) {
  const list = growth.banchi.filter((b) => b.total > 0 && (b.mine || b.tier > 0));
  return (
    <div className="growth-legend" aria-label="Il locale cresce con la memoria">
      {list.map((b) => (
        <button key={b.id} className={`station-tag ${b.tier >= 4 ? 'gold' : ''} ${b.tier === 0 ? 'ghost' : ''}`} onClick={() => onPick(`banco:${b.id}`)}>
          <i style={{ background: BANCO_COLOR[b.id] }} /> {b.short} <b>{b.known}/{b.total}</b>
        </button>
      ))}
      {growth.gold.length > 0 && (
        <button className="station-tag gold" onClick={() => onPick('oro')}>
          <Icon name="frame" size={13} /> Piatti d'oro <b>{growth.gold.length}</b>
        </button>
      )}
    </div>
  );
}

/** il prossimo acquisto sempre in vista: quante monete mancano, e quando ci sei il pulsante che chiama */
export function GoalCard({ onOpen }: { onOpen: (id: string) => void }) {
  const { save } = useApp();
  const deal = dealOf(today(), save.build, save.dealUsed);
  const goal = goalOf(save.build, save.goal, deal);
  if (!goal) return null;
  const { u, cost } = goal;
  const lvl = lvlOf(save.build, u.id);
  const ready = save.coins >= cost;
  return (
    <button className={`card goal-card ${ready ? 'ready' : ''}`} onClick={() => onOpen(u.id)}>
      <span className="up-e"><Icon name={UPGRADE_ICON[u.id]} size={22} /></span>
      <span className="goal-b">
        <span className="goal-t">
          {goal.pinned ? <Icon name="target" size={14} /> : null} <b>{u.name}</b> {lvl > 0 && <small className="muted">Lv {lvl + 1}</small>}
          {deal === u.id && <span className="deal-tag sm">−{Math.round(DEAL_OFF * 100)}% oggi</span>}
        </span>
        <Bar value={Math.min(1, save.coins / cost)} color={ready ? '#6f9a6a' : '#e3a83a'} h={8} />
        <small className="muted">{ready ? 'Ce l\'hai fatta: costruiscilo!' : `Mancano ${cost - save.coins} monete`}</small>
      </span>
      {ready ? <span className="btn primary sm goal-go">Costruisci!</span> : <span className="goal-n"><Coin size={15} /> {cost}</span>}
    </button>
  );
}

/** "Stasera ho fatto…": i piatti preparati al lavoro. Il giorno dopo il gioco te li chiede. */
function RealLog({ onClose }: { onClose: () => void }) {
  const app = useApp();
  const { save } = app;
  const y = new Date(Date.now() - 864e5).toLocaleDateString('sv');
  const [date, setDate] = useState(today());
  const [sel, setSel] = useState<string[]>(save.real?.[today()] ?? []);
  const [q, setQ] = useState('');
  const pickDate = (d: string) => {
    sfx.tap();
    setDate(d);
    setSel(save.real?.[d] ?? []);
  };
  const toggle = (id: string) => {
    sfx.tap();
    setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };
  const f = q.trim().toLowerCase();
  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-in" onClick={(e) => e.stopPropagation()}>
        <h3>Il turno vero</h3>
        <div className="muted sm">Segna i piatti che hai preparato al lavoro. Quello che hai fatto con le mani è il ricordo più forte: <b>il giorno dopo il gioco te li chiede</b>, e ripescarli lo fissa ancora di più.</div>
        <div className="seg two">
          <button className={date === today() ? 'on' : ''} onClick={() => pickDate(today())}>Stasera<small>oggi</small></button>
          <button className={date === y ? 'on' : ''} onClick={() => pickDate(y)}>Ieri sera<small>se è già passata mezzanotte</small></button>
        </div>
        <label className="pantry-q"><Icon name="search" size={20} /><input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cerca un piatto…" aria-label="Cerca un piatto" /></label>
        {CATEGORIES.map((c) => {
          const list = app.menu.filter((d) => d.category === c.id && (!f || d.name.toLowerCase().includes(f)));
          if (!list.length) return null;
          return (
            <div key={c.id}>
              <div className="setting-h"><Ing name={CAT_ING[c.id]} /> {c.name}</div>
              <div className="chips">
                {list.map((d) => <button key={d.id} className={`chip ${sel.includes(d.id) ? 'sel' : ''}`} onClick={() => toggle(d.id)}>{sel.includes(d.id) && <Icon name="check" size={14} />} {d.name}</button>)}
              </div>
            </div>
          );
        })}
        <div className="modal-btns">
          <button className="btn ghost" onClick={onClose}>Annulla</button>
          <button className="btn primary" onClick={() => { app.logReal(date, sel); sfx.win(); onClose(); }}>Salva {sel.length ? `(${sel.length})` : ''}</button>
        </div>
      </div>
    </div>
  );
}

export function Home({ cat, setCat, start }: { cat: Category | 'all'; setCat: (c: Category | 'all') => void; start: (m: Mode, pool?: Dish[]) => void }) {
  const app = useApp();
  const { save } = app;
  const [shop, setShop] = useState(false);
  const [deck, setDeck] = useState(false);
  const [build, setBuild] = useState<string | null | false>(false);
  const [show, setShow] = useState<{ id: string; n: number }>();
  const [news, setNews] = useState<{ title: string; text: string; n: number } | null>(null);
  const [chest, setChest] = useState<number | null>(null);
  const [real, setReal] = useState(false);
  const lvl = levelOf(save.xp);
  const { menu, mine } = app;
  const banchi = save.settings.banchi;
  const known = knownCount(save.stats, mine.map((d) => d.id));
  const rank = titleFor(known);
  const nextUnlock = UNLOCKS.find((u) => u.lvl > lvl);
  const yesterday = pendingReal(save);
  const dusty = mine.filter((d) => isDusty(save.stats[d.id])).length;
  const sabato = unlocked(lvl, 'sabato');
  const [lo, hi] = levelBounds(lvl);
  const active = save.todayDate === new Date().toLocaleDateString('sv') ? save.todayCount : 0;
  const goal = save.settings.dailyGoal;
  const pool = cat === 'all' ? mine : menu.filter((d) => d.category === cat);
  // piatti dei miei banchi da ripassare che il filtro scelto non fa vedere
  const now = Date.now();
  const elsewhere = mine.filter((d) => !pool.includes(d) && save.stats[d.id]?.fs && isDue(save.stats[d.id], now));
  const avg = pool.length ? pool.reduce((a, d) => a + mastery(save.stats[d.id]), 0) / pool.length : 0;
  const mastered = mine.filter((d) => (save.stats[d.id]?.box ?? 0) >= 5).length;
  const due = dueCount(save.stats, pool.map((d) => d.id));
  const skin = SKINS.find((s) => s.id === save.skin) ?? SKINS[0];
  const daily = currentDaily(save);
  const missions = daily.ids.map(missionById).filter((m): m is Mission => !!m);
  const allClaimed = missions.every((m) => daily.claimed.includes(m.id));
  const go = (m: Mode) => {
    sfx.tap();
    start(m);
  };
  const openBuild = (id: string | null) => {
    sfx.tap();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setBuild(id);
  };
  // la cerimonia: festa nel locale, la camera va sull'oggetto, e due parole su cosa cambia
  const bought = (u: Upgrade, lvl: number) => {
    sfx.win();
    confetti(lvl >= u.max ? 1.3 : 0.8);
    const n = Date.now();
    setShow({ id: u.id, n });
    setNews({ title: lvl >= u.max ? `${u.name} al massimo!` : lvl === 1 ? `${u.name}!` : `${u.name} · livello ${lvl}`, text: u.desc(lvl), n });
  };
  // il locale cresce con la memoria: quando un banco sale o arriva un piatto d'oro, si fa festa (una volta)
  const growth = useMemo(() => growthOf(menu, mine, save.stats), [menu, mine, save.stats]);
  const gkey = JSON.stringify(seenOf(growth));
  useEffect(() => {
    const seen = save.seenGrowth;
    if (seen && JSON.stringify(seen) === gkey) return;
    app.setSeenGrowth(seenOf(growth));
    // la prima volta si prende nota in silenzio: niente festa per quello che sapevi già
    const g = growthNews(growth, seen);
    if (!g) return;
    setTimeout(() => {
      const n = Date.now();
      sfx.phase();
      confetti(g.kind === 'oro' || g.b.tier >= 4 ? 1.3 : 0.8);
      if (g.kind === 'oro') {
        setShow({ id: 'oro', n });
        setNews({ title: `In parete: ${g.d.name}`, text: 'Piatto d\'oro: ora è incorniciato nel locale', n });
      } else {
        const { b } = g;
        setShow({ id: `banco:${b.id}`, n });
        setNews(
          b.tier >= 4 ? { title: `${b.name} completo!`, text: `Tutti i ${b.total} piatti a memoria: l'angolo è d'oro`, n }
          : b.tier === 1 ? { title: `Nuovo angolo: ${b.name}`, text: `Il primo piatto a memoria (${b.known}/${b.total})`, n }
          : { title: `${b.name}: si riempie!`, text: `${b.known}/${b.total} piatti a memoria, nuove vaschette sul banco`, n },
        );
      }
    }, 900);
  }, [gkey]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!news) return;
    const t = setTimeout(() => setNews(null), 3400);
    return () => clearTimeout(t);
  }, [news]);
  const claim = (m: Mission, el: HTMLElement) => {
    const got = app.claim(m.id);
    if (!got) return;
    sfx.win();
    flyCoins(centerOf(el), document.querySelector('.coin-pill'), 8);
  };
  const openChest = (el: HTMLElement) => {
    const got = app.openChest();
    if (!got) return;
    sfx.chest();
    const at = centerOf(el);
    if (at) burst(at.x, at.y, 1.6, ['#e3a83a', '#c65a3c', '#6f9a6a', '#fbf7ef']);
    confetti(got >= 180 ? 1.8 : 1);
    setTimeout(() => flyCoins(at, document.querySelector('.coin-pill'), 10), 250);
    setChest(got);
  };

  return (
    <div className="page">
      <header className="hero">
        <div className="hero-top">
          <div>
            <div className="hello">Il tuo locale</div>
            <h1 className="brand">Core a Core</h1>
          </div>
          <div className="pills">
            <div className={`streak ${save.streakDays > 0 ? 'lit' : ''}`} title="Giorni di fila"><Icon name="flame" size={16} /> {save.streakDays}</div>
            <div className="coin-pill"><Coin /> {save.coins}</div>
          </div>
        </div>
        <div className="diorama">
          {hasWebGL() ? (
            <>
              <Diorama
                build={save.build}
                skin={skin}
                onPick={(id) => openBuild(id)}
                ghosts={UPGRADES.filter((u) => lvlOf(save.build, u.id) === 0).map((u) => ({ id: u.id, can: save.coins >= priceOf(u, 0, dealOf(today(), save.build, save.dealUsed)) }))}
                show={show}
                growth={growth}
              />
              <span className="diorama-hint">Trascina per girare · tocca un oggetto per migliorarlo</span>
            </>
          ) : (
            <div className="hero-scene">
              <Scene build={save.build} night={0.12} />
              <Awning lights={lvlOf(save.build, 'luci')} />
              <div className="hero-chef"><Person look={CHEF_LOOK} chef={skin} mood="happy" pose="idle" /></div>
            </div>
          )}
          {news && <div className="build-news" key={news.n}><b>{news.title}</b><span>{news.text}</span></div>}
        </div>
      </header>
      {hasWebGL() && <GrowthLegend growth={growth} onPick={(id) => { sfx.tap(); setShow({ id, n: Date.now() }); }} />}

      <GoalCard onOpen={openBuild} />

      <section className="card lvl-card">
        <div className="lvl-badge"><span>{lvl}</span></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="lvl-n">{rank.title}</div>
          <div className="muted sm">{rank.next ? `${known}/${rank.next.need} piatti a memoria per diventare ${rank.next.title}` : `${known} piatti a memoria`}</div>
          <div style={{ marginTop: 8 }}><Bar value={(save.xp - lo) / (hi - lo)} color="#c65a3c" h={10} /></div>
          <div className="muted sm">{save.xp - lo} / {hi - lo} XP al livello {lvl + 1}{nextUnlock ? ` · al ${nextUnlock.lvl}: ${nextUnlock.name}` : ''}</div>
        </div>
        <Ring value={active / goal} size={60} stroke={7} color={active >= goal ? '#6f9a6a' : '#e3a83a'}>
          <b style={{ fontSize: '1.0625rem' }}>{active >= goal ? <Icon name="check" /> : Math.min(active, goal)}</b>
        </Ring>
      </section>

      <div className="cats">
        <button className={`cat ${cat === 'all' ? 'on' : ''}`} onClick={() => { sfx.tap(); setCat('all'); }}>{banchi ? 'I miei banchi' : 'Tutto il menu'}</button>
        {/* prima i miei banchi, poi le altre categorie (facoltative) */}
        {[...CATEGORIES].sort((a, b) => (banchi ? +!banchi.includes(a.id) - +!banchi.includes(b.id) : 0)).map((c) => (
          <button key={c.id} className={`cat ${cat === c.id ? 'on' : ''} ${banchi && !banchi.includes(c.id) ? 'extra' : ''}`} onClick={() => { sfx.tap(); setCat(c.id); }}>
            <Ing name={CAT_ING[c.id]} /> {c.name}
          </button>
        ))}
      </div>
      {elsewhere.length > 0 && (
        <button className="note dust elsewhere" onClick={() => { sfx.tap(); start('focus', [...elsewhere].sort((a, b) => freshness(save.stats[a.id]) - freshness(save.stats[b.id])).slice(0, 6)); }}>
          <Icon name="sparkle" size={16} />
          <span>Hai <b>{elsewhere.length} {elsewhere.length === 1 ? 'piatto' : 'piatti'}</b> da ripassare in altre categorie dei tuoi banchi ({[...new Set(elsewhere.map((d) => catOf(d.category).name))].join(', ')}). <u>Ripassali ora</u></span>
        </button>
      )}

      <button className="btn primary wide big hero-btn" disabled={!pool.length} onClick={() => go('game')}>
        <span><Icon name="play" size={22} /> Inizia il turno</span>
        <small>Padronanza {Math.round(avg * 100)}% · record {save.bestShift}</small>
      </button>

      {yesterday && (
        <button className="card real-banner" onClick={() => { sfx.tap(); start('yesterday', yesterday.dishes); }}>
          <span className="hub-e"><Icon name="calendar" size={26} /></span>
          <span><b>{cap(dayLabel(yesterday.date))} al lavoro hai fatto {yesterday.dishes.length} {yesterday.dishes.length === 1 ? 'piatto' : 'piatti'}</b><small>Ricordali adesso: ripescare quello che hai fatto con le mani lo fissa per sempre</small></span>
        </button>
      )}

      <InstallCard where="home" />

      <section className="card missions">
        <div className="row-between">
          <div className="card-h">Missioni di oggi</div>
          <span className="muted sm">{daily.claimed.length}/3</span>
        </div>
        {missions.map((m) => {
          const p = progressOf(daily, m);
          const ok = p >= m.goal;
          const claimed = daily.claimed.includes(m.id);
          return (
            <div key={m.id} className={`mission ${claimed ? 'claimed' : ok ? 'ready' : ''}`}>
              <span className="m-e"><Icon name={MISSION_ICON[m.kind]} size={20} /></span>
              <div className="m-b">
                <div className="m-t">{m.text}</div>
                <Bar value={p / m.goal} color={ok ? '#6f9a6a' : '#e3a83a'} h={7} />
              </div>
              {claimed ? <span className="m-done"><Icon name="check" /></span> : ok ? (
                <button className="btn primary sm claim" onClick={(e) => claim(m, e.currentTarget)}>+{m.reward} <Coin size={15} /></button>
              ) : <span className="m-r">{p}/{m.goal}</span>}
            </div>
          );
        })}
        <button className={`chest ${allClaimed && !daily.chest ? 'ready' : ''} ${daily.chest ? 'open' : ''}`} disabled={!allClaimed || daily.chest} onClick={(e) => openChest(e.currentTarget)}>
          <span className="chest-e"><Icon name="gift" size={26} /></span>
          <span>{daily.chest ? (chest ? `Hai trovato ${chest} monete!` : 'Forziere aperto: torna domani!') : allClaimed ? 'Apri il forziere a sorpresa!' : 'Completa le 3 missioni per il forziere'}</span>
        </button>
      </section>

      <div className="hub-grid">
        <button className="hub review" disabled={!pool.length} onClick={() => go('focus')}>
          {due > 0 && <span className="hub-badge">{due}</span>}
          <span className="hub-e"><Icon name="brain" size={26} /></span><b>Ripasso</b><small>{due ? `${due} piatti da rinfrescare` : 'I tuoi punti deboli'}</small>
        </button>
        <button className="hub learn" disabled={!menu.length} onClick={() => { sfx.tap(); setDeck(true); }}>
          <span className="hub-e"><Icon name="book" size={26} /></span><b>Ricettario</b><small>Schede e scrittura</small>
        </button>
        <button className="hub build" onClick={() => openBuild(null)}>
          <span className="hub-e"><Icon name="hammer" size={26} /></span><b>Costruisci</b><small>{totalBuilt(save.build)}/{totalMax} migliorie</small>
        </button>
        <button className="hub wardrobe" onClick={() => { sfx.tap(); setShop(true); }}>
          <span className="hub-e"><Icon name="shirt" size={26} /></span><b>Guardaroba</b><small>{save.skins.length}/{SKINS.length} divise</small>
        </button>
        <button className="hub warmup" disabled={!menu.length} onClick={() => go('warmup')}>
          <span className="hub-e"><Icon name="clock" size={26} /></span><b>Prima del turno</b><small>3 minuti sui più ordinati</small>
        </button>
        <button className="hub real" onClick={() => { sfx.tap(); setReal(true); }}>
          {save.real?.[today()]?.length ? <span className="hub-badge ok">{save.real[today()].length}</span> : null}
          <span className="hub-e"><Icon name="user" size={26} /></span><b>Il turno vero</b><small>Segna cosa hai fatto al lavoro</small>
        </button>
        <button className={`hub sabato ${sabato ? '' : 'locked'}`} disabled={!sabato} onClick={() => go('sabato')}>
          <span className="hub-e"><Icon name="flame" size={26} /></span><b>Sabato sera</b><small>{sabato ? '12 clienti, tutto il menu, monete ×1.5' : 'Si sblocca al livello 6'}</small>
        </button>
      </div>

      <section className="card collection">
        <div className="row-between"><div className="card-h">Menu a memoria</div><b className="coll-n">{mastered}/{mine.length}</b></div>
        <Bar value={mine.length ? mastered / mine.length : 0} color="#6f9a6a" h={10} />
        {dusty > 0 && <div className="note dust"><Icon name="sparkle" size={16} /><span>{dusty} {dusty === 1 ? 'piatto a memoria si sta' : 'piatti a memoria si stanno'} impolverando: un ripasso e tornano a brillare</span></div>}
        <div className="muted sm">Un piatto è tuo quando lo servi a memoria in giorni diversi: la ripetizione distanziata lo fissa per sempre. Scriverlo a memoria nel Ricettario vale doppio.</div>
      </section>
      <ShareCard compact />
      {shop && <Shop onClose={() => setShop(false)} />}
      {deck && <Deck onPick={(m, p) => { setDeck(false); start(m, p); }} onClose={() => setDeck(false)} />}
      {build !== false && <Build focus={build} onClose={() => setBuild(false)} onBought={bought} />}
      {real && <RealLog onClose={() => setReal(false)} />}
    </div>
  );
}

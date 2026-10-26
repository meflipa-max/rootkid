import { useRef, useState } from 'react';
import { CAT_ING, Icon } from '../components/Icon';
import { useApp } from '../store';
import { CATEGORIES, catOf, isPizza, PIZZA_INGREDIENTS } from '../lib/data';
import { STATIONS, layoutOf, universeOf, type StationId } from '../lib/station';
import { delPhoto, savePhoto, usePhoto } from '../lib/photos';
import { sfx } from '../lib/fx';
import { aliasList } from '../lib/aliases';
import type { Category, Dish } from '../lib/types';
import { cap } from '../lib/emoji';
import { Ing } from '../components/Ing';
import { BanchiPicker, TextSize, banchiOf } from '../components/Welcome';
import { InstallCard } from '../components/Install';
import { ShareCard } from '../components/Share';
import { useHoldUpdate } from '../lib/pwa';

const slug = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'piatto';

function Editor({ dish, onClose }: { dish: Dish | null; onClose: () => void }) {
  const app = useApp();
  // mentre scrivi una ricetta l'app non si ricarica per aggiornarsi
  useHoldUpdate(true);
  const [name, setName] = useState(dish?.name ?? '');
  const [category, setCategory] = useState<Category>(dish?.category ?? 'hamburger');
  const [rows, setRows] = useState<{ t: string; after: boolean }[]>(() =>
    (dish?.ingredients ?? ['']).map((t) => ({ t, after: !!dish?.after?.some((a) => a.toLowerCase() === t.toLowerCase()) })),
  );
  const [ordered, setOrdered] = useState(dish?.ordered ?? false);
  const [popular, setPopular] = useState(dish?.popular ?? false);
  const [why, setWhy] = useState(dish?.why ?? '');
  const [inMenu, setInMenu] = useState(!dish?.off);
  const [busy, setBusy] = useState(false);
  const id0 = useRef(dish?.id ?? `new-${Date.now()}`);
  const photo = usePhoto(dish?.id);
  const pizza = isPizza(category);
  const panino = category === 'hamburger' || category === 'focacce';
  const ings = rows.map((r) => r.t.trim()).filter(Boolean);
  const ok = name.trim() && ings.length > 0;

  const set = (i: number, p: Partial<{ t: string; after: boolean }>) => setRows((r) => r.map((x, k) => (k === i ? { ...x, ...p } : x)));
  const move = (i: number, d: number) =>
    setRows((r) => {
      const j = i + d;
      if (j < 0 || j >= r.length) return r;
      const x = [...r];
      [x[i], x[j]] = [x[j], x[i]];
      return x;
    });

  const save = () => {
    let id = dish?.id;
    if (!id) {
      const base = slug(name);
      id = base;
      for (let n = 2; app.save.dishes.some((d) => d.id === id); n++) id = `${base}-${n}`;
    }
    const clean = rows.map((r) => ({ ...r, t: r.t.trim() })).filter((r) => r.t);
    // nelle pizze prima quello che va in forno, poi l'uscita
    const list = pizza ? [...clean.filter((r) => !r.after), ...clean.filter((r) => r.after)] : clean;
    app.saveDish({
      id, name: name.trim(), category, ingredients: list.map((r) => r.t),
      ...(pizza ? { after: list.filter((r) => r.after).map((r) => r.t) } : {}),
      ...(panino && ordered ? { ordered: true } : {}),
      ...(popular ? { popular: true } : {}),
      ...(why.trim() ? { why: why.trim() } : {}),
      ...(inMenu ? {} : { off: true }),
    });
    onClose();
  };

  const pickPhoto = async (f: File | undefined) => {
    if (!f || !dish) return;
    setBusy(true);
    await savePhoto(dish.id, f).catch(() => undefined);
    setBusy(false);
  };

  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-in" onClick={(e) => e.stopPropagation()}>
        <h3>{dish ? 'Modifica ricetta' : 'Nuovo piatto'}</h3>
        {dish?.draft && <div className="card warn sm">L'{pizza ? 'uscita dal forno' : 'ordine di montaggio'} di questo piatto è una <b>bozza</b> fatta da me: controllalo e salva, così il gioco insegna come si fa davvero al lavoro.</div>}
        <label>Nome<input value={name} onChange={(e) => setName(e.target.value)} placeholder="Es. Esagerato" /></label>
        <label>Categoria
          <select value={category} onChange={(e) => setCategory(e.target.value as Category)}>
            {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <div className="setting-h">Ingredienti <span className="muted sm">{panino ? 'dal basso verso l\'alto, come lo monti' : pizza ? 'segna quelli che vanno all\'uscita dal forno' : 'uno per riga'}</span></div>
        <div className="ing-rows">
          {rows.map((r, i) => (
            <div key={i} className="ing-row">
              {panino && <b className="num">{i + 1}</b>}
              <input value={r.t} onChange={(e) => set(i, { t: e.target.value })} placeholder={i === 0 ? 'Es. bacon' : 'Ingrediente'} aria-label={`Ingrediente ${i + 1}`} />
              {pizza && <button type="button" className={`chip sm ${r.after ? 'sel' : ''}`} onClick={() => set(i, { after: !r.after })} aria-pressed={r.after}>{r.after ? 'All\'uscita' : 'In forno'}</button>}
              <button type="button" className="icon-btn sq" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Sposta su"><Icon name="up" size={18} /></button>
              <button type="button" className="icon-btn sq" onClick={() => move(i, 1)} disabled={i === rows.length - 1} aria-label="Sposta giù"><Icon name="down" size={18} /></button>
              <button type="button" className="icon-btn sq" onClick={() => setRows((x) => x.filter((_, k) => k !== i))} aria-label="Togli"><Icon name="x" size={18} /></button>
            </div>
          ))}
          <button type="button" className="btn ghost sm" onClick={() => setRows((x) => [...x, { t: '', after: false }])}><Icon name="plus" size={16} /> Aggiungi ingrediente</button>
        </div>
        {category === 'fritti' && <div className="muted sm">Friggitoria: scrivi le quantità, es. “3 crocchette”, “3/4 pittule” o “8 pezzi”.</div>}
        {panino && <label className="toggle"><span><Icon name="layers" size={20} /> L'ordine di montaggio conta</span><input type="checkbox" checked={ordered} onChange={(e) => setOrdered(e.target.checked)} /></label>}
        {panino && <div className="setting-d">Accendilo solo se al lavoro questo panino si monta sempre nello stesso ordine.</div>}
        <label className="toggle"><span><Icon name="store" size={20} /> In menu</span><input type="checkbox" checked={inMenu} onChange={(e) => setInMenu(e.target.checked)} /></label>
        <div className="setting-d">{inMenu ? 'Spegnilo se il piatto non si fa più: resta salvato, ma il gioco non lo propone e non lo conta.' : 'Fuori menu: non compare nei turni, nei ripassi, nel Ricettario e nei conteggi. Le statistiche restano, se un giorno torna.'}</div>
        <label className="toggle"><span><Icon name="star" size={20} /> Si ordina spesso</span><input type="checkbox" checked={popular} onChange={(e) => setPopular(e.target.checked)} /></label>
        <label>Il perché <span className="muted sm">(facoltativo: si ricorda meglio quello che si capisce)</span>
          <textarea rows={2} value={why} onChange={(e) => setWhy(e.target.value)} placeholder={panino ? 'Es. il cheddar sopra la carne calda, così si scioglie' : 'Es. la rucola dopo il forno, se no appassisce'} />
        </label>
        {dish && (
          <div className="photo-edit">
            {photo ? <img className="dish-photo sm" src={photo} alt="" /> : <span className="muted sm">Nessuna foto: fotografa il piatto quando lo prepari al lavoro.</span>}
            <label className="btn ghost sm" key={id0.current}>
              <Icon name="camera" size={16} /> {busy ? 'Salvo…' : photo ? 'Cambia foto' : 'Aggiungi la tua foto'}
              <input type="file" accept="image/*" capture="environment" hidden onChange={(e) => void pickPhoto(e.target.files?.[0])} />
            </label>
            {photo && <button type="button" className="btn ghost sm" onClick={() => void delPhoto(dish.id)}>Togli foto</button>}
          </div>
        )}
        <div className="modal-btns">
          {dish && (
            <button className="btn danger" onClick={() => { if (confirm(`Eliminare “${dish.name}”?`)) { app.deleteDish(dish.id); void delPhoto(dish.id); onClose(); } }}>
              Elimina
            </button>
          )}
          <button className="btn ghost" onClick={onClose}>Annulla</button>
          <button className="btn primary" disabled={!ok} onClick={save}>Salva</button>
        </div>
      </div>
    </div>
  );
}

/**
 * Unisci due ingredienti: "from" sparisce e al suo posto si usa quello scelto.
 * Di partenza vale per tutti i piatti (e resta come unione permanente); si possono anche togliere dei piatti.
 */
function MergeSheet({ from, onClose }: { from: string; onClose: () => void }) {
  const app = useApp();
  useHoldUpdate(true);
  const [q, setQ] = useState('');
  const [to, setTo] = useState<string | null>(null);
  const low = (x: string) => x.trim().toLowerCase().replace(/^\d+(\/\d+)?\s+/, '');
  const has = (d: Dish) => d.ingredients.some((i) => low(i) === from);
  const dishes = app.save.dishes.filter(has);
  const [ids, setIds] = useState<string[]>(dishes.map((d) => d.id));
  // tutti i nomi, con le maiuscole come stanno nelle ricette
  const names = new Map<string, string>();
  for (const d of app.save.dishes) for (const i of d.ingredients) if (!names.has(low(i))) names.set(low(i), i.replace(/^\d+(\/\d+)?\s+/, ''));
  for (const i of aliasList(PIZZA_INGREDIENTS)) if (!names.has(low(i))) names.set(low(i), i);
  names.delete(from);
  const f = q.trim().toLowerCase();
  const list = [...names.entries()].filter(([k]) => !f || k.includes(f)).sort((a, b) => a[0].localeCompare(b[0], 'it'));
  const all = ids.length === dishes.length;
  const apply = () => {
    if (!to) return;
    app.mergeIngredient(from, to, all ? undefined : ids);
    sfx.win();
    onClose();
  };
  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-in" onClick={(e) => e.stopPropagation()}>
        <h3><Ing name={from} /> {cap(from)}</h3>
        <div className="muted sm">{dishes.length ? `È in ${dishes.length} ${dishes.length === 1 ? 'piatto' : 'piatti'}.` : 'Non è in nessun piatto: è solo nella lista degli ingredienti delle pizze.'} Se è la stessa cosa di un altro ingrediente, scegli <b>quale usare al suo posto</b>.</div>
        {!to ? (
          <>
            <label className="pantry-q"><Icon name="search" size={20} /><input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cerca l'ingrediente da usare…" aria-label="Cerca l'ingrediente da usare" autoFocus /></label>
            <div className="chips merge-list">
              {list.map(([k, n]) => <button key={k} className="chip" onClick={() => { sfx.tap(); setTo(n); }}><Ing name={n} /> {cap(n)}</button>)}
            </div>
          </>
        ) : (
          <>
            <div className="merge-pair"><span className="chip bad"><Ing name={from} /> {cap(from)}</span><Icon name="down" size={20} /><span className="chip ok"><Ing name={to} /> {cap(to)}</span></div>
            {dishes.length > 0 && (
              <>
                <div className="setting-h">In quali piatti</div>
                <div className="chips">
                  {dishes.map((d) => <button key={d.id} className={`chip ${ids.includes(d.id) ? 'sel' : ''}`} onClick={() => setIds((x) => (x.includes(d.id) ? x.filter((y) => y !== d.id) : [...x, d.id]))}>{ids.includes(d.id) && <Icon name="check" size={14} />} {d.name}</button>)}
                </div>
                <div className="muted sm">{all ? `Vale per tutti i piatti e resta ricordato: «${from}» non tornerà più, nemmeno con gli aggiornamenti del menu.` : 'Vale solo per i piatti segnati.'} Se un piatto li aveva tutti e due, ne resta uno. Anche le statistiche (ingredienti dimenticati o confusi) passano al nome nuovo.</div>
              </>
            )}
            <div className="modal-btns">
              <button className="btn ghost" onClick={() => setTo(null)}>Cambia</button>
              <button className="btn primary" disabled={dishes.length > 0 && !ids.length} onClick={apply}>Usa «{cap(to)}»</button>
            </div>
          </>
        )}
        {!to && <button className="btn ghost wide" onClick={onClose}>Chiudi</button>}
      </div>
    </div>
  );
}

/**
 * La tua postazione: tocchi un ingrediente e poi il posto dove metterlo, come sistemare le vaschette al banco.
 * Nel turno gli ingredienti staranno sempre lì.
 */
function StationEditor({ id, onClose }: { id: StationId; onClose: () => void }) {
  const app = useApp();
  useHoldUpdate(true);
  const universe = universeOf(id, app.menu);
  const [list, setList] = useState(() => layoutOf(app.save.station?.[id], universe));
  const [pick, setPick] = useState<number | null>(null);
  const st = STATIONS.find((s) => s.id === id)!;
  const tapAt = (i: number) => {
    sfx.tap();
    if (pick === null) return setPick(i);
    if (pick !== i) {
      const x = [...list];
      const [m] = x.splice(pick, 1);
      x.splice(i, 0, m);
      setList(x);
    }
    setPick(null);
  };
  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-in" onClick={(e) => e.stopPropagation()}>
        <h3>{st.name}</h3>
        <div className="muted sm">Sistemala come al lavoro: <b>tocca un ingrediente, poi tocca il posto</b> dove sta sul tuo banco. Nel turno lo troverai sempre lì: anche la memoria dei posti ti aiuta a ricordare.</div>
        <div className="station-grid">
          {list.map((t, i) => (
            <button key={t} className={`itile ${pick === i ? 'picked' : ''}`} onClick={() => tapAt(i)}>
              <span className="t-e"><Ing name={t} /></span>
              <span className="t-l">{cap(t)}</span>
            </button>
          ))}
        </div>
        <div className="modal-btns">
          <button className="btn ghost" onClick={() => { app.setStation(id, null); onClose(); }}>Ripristina</button>
          <button className="btn primary" onClick={() => { app.setStation(id, list); sfx.win(); onClose(); }}>Salva</button>
        </div>
      </div>
    </div>
  );
}

export function Settings() {
  const app = useApp();
  const { settings } = app.save;
  const [edit, setEdit] = useState<Dish | 'new' | null>(null);
  const [io, setIo] = useState('');
  const [msg, setMsg] = useState('');
  const [filter, setFilter] = useState<Category | 'all' | 'pizze'>('all');
  const [showIngs, setShowIngs] = useState(true);
  const [merge, setMerge] = useState<string | null>(null);
  const allIngs = (() => {
    const m = new Map<string, number>();
    const add = (raw: string, n: number) => {
      const k = raw.trim().toLowerCase().replace(/^\d+(\/\d+)?\s+/, '');
      if (!k || /^pezz/.test(k)) return;
      m.set(k, (m.get(k) ?? 0) + n);
    };
    if (filter === 'all' || filter === 'pizze') aliasList(PIZZA_INGREDIENTS).forEach((i) => add(i, 0));
    if (filter !== 'pizze') app.save.dishes.filter((d) => filter === 'all' || d.category === filter).forEach((d) => d.ingredients.forEach((i) => add(i, 1)));
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0], 'it'));
  })();
  const filterBar = (
    <div className="chips filters">
      <button className={`chip ${filter === 'all' ? 'sel' : ''}`} onClick={() => setFilter('all')}>Tutti</button>
      {CATEGORIES.map((c) => (
        <button key={c.id} className={`chip ${filter === c.id ? 'sel' : ''}`} onClick={() => setFilter(c.id)}>
          <Ing name={CAT_ING[c.id]} /> {c.name} ({app.menu.filter((d) => d.category === c.id).length})
        </button>
      ))}
      <button className={`chip ${filter === 'pizze' ? 'sel' : ''}`} onClick={() => setFilter('pizze')}>Pizze</button>
    </div>
  );
  const toVerify = app.save.dishes.filter((d) => d.verify).length;
  const drafts = app.save.dishes.filter((d) => d.draft);
  const [station, setStation] = useState<StationId | null>(null);

  return (
    <div className="page">
      <h2 className="h">Impostazioni</h2>

      <section className="card">
        <div className="setting-h"><Icon name="text" size={22} /> Grandezza del testo</div>
        <TextSize />
        <hr />
        <label className="toggle"><span><Icon name="turtle" size={22} /> Ritmo tranquillo</span><input type="checkbox" checked={settings.calm} onChange={(e) => app.setSettings({ calm: e.target.checked })} /></label>
        <div className="setting-d">I clienti aspettano quasi il doppio e arrivano più distanziati.</div>
        <hr />
        <label className="toggle"><span><Icon name="sparkle" size={22} /> Gesti</span><input type="checkbox" checked={!!settings.gestures} onChange={(e) => app.setSettings({ gestures: e.target.checked })} /></label>
        <div className="setting-d">Salse e creme si spalmano con un giro del dito, grana e granelle si spolverano con tre tocchi. Spento: basta un tocco.</div>
      </section>

      <h3 className="h3">I miei banchi</h3>
      <section className="card">
        <div className="muted sm">Le categorie che prepari al lavoro. Titolo, "Menu a memoria", missioni, Prima del turno e Sabato sera contano solo queste; le altre restano allenabili.</div>
        <BanchiPicker value={settings.banchi ?? CATEGORIES.map((c) => c.id)} onChange={(v) => { const b = banchiOf(v); app.setSettings({ banchi: b, cat: b?.length === 1 ? b[0] : 'all' }); }} />
      </section>

      <h3 className="h3">La tua postazione</h3>
      <section className="card">
        <div className="muted sm">Ogni ingrediente sta sempre nello stesso posto del bancone. Sistemalo come il tuo banco al lavoro.</div>
        {STATIONS.map((st) => (
          <button key={st.id} className="recipe" onClick={() => setStation(st.id)}>
            <div className="recipe-n">{st.name} {app.save.station?.[st.id] && <span className="badge">tua</span>}</div>
            <div className="muted sm">{universeOf(st.id, app.menu).length} {st.id === 'fritti' ? 'pezzi' : 'ingredienti'}</div>
          </button>
        ))}
      </section>

      <InstallCard where="settings" />
      <ShareCard />

      <section className="card">
        <label className="toggle"><span><Icon name="sound" /> Suoni</span><input type="checkbox" checked={settings.sound} onChange={(e) => app.setSettings({ sound: e.target.checked })} /></label>
        <label className="toggle"><span><Icon name="phone" /> Vibrazione</span><input type="checkbox" checked={settings.haptics} onChange={(e) => app.setSettings({ haptics: e.target.checked })} /></label>
        <label className="toggle"><span><Icon name="target" /> Obiettivo giornaliero</span>
          <select value={settings.dailyGoal} onChange={(e) => app.setSettings({ dailyGoal: +e.target.value })}>
            {[10, 20, 30, 50].map((n) => <option key={n} value={n}>{n} risposte</option>)}
          </select>
        </label>
      </section>

      <div className="row-between">
        <h3 className="h3">Ricette</h3>
        <button className="btn primary sm" onClick={() => setEdit('new')}>+ Nuovo piatto</button>
      </div>
      {toVerify > 0 && (
        <div className="card warn sm">Ho letto le ricette da una foto scritta a mano: i piatti segnalati ({toVerify}) hanno parti tagliate o poco leggibili. Controllali e correggili!</div>
      )}
      {drafts.length > 0 && (
        <div className="card warn sm">
          <b>Bozze da controllare ({drafts.length}).</b> L'ordine di montaggio di {drafts.filter((d) => d.ordered).length} panini e cosa va dopo il forno su {drafts.filter((d) => d.after).length} pizze li ho proposti io, con una regola generale. Aprili e correggili come li fate al lavoro: segnati con <Icon name="layers" size={14} />.
        </div>
      )}
      {filterBar}
      {filter === 'pizze' && <div className="card muted sm">Le pizze non sono ancora piatti dell'app: qui trovi solo i loro ingredienti, nella sezione Ingredienti.</div>}
      {CATEGORIES.map((c) => {
        if (filter === 'pizze' || (filter !== 'all' && filter !== c.id)) return null;
        const all = app.save.dishes.filter((d) => d.category === c.id);
        if (!all.length) return null;
        const row = (d: Dish) => (
          <div key={d.id} className={`recipe-wrap ${d.off ? 'off' : ''}`}>
            <button className="recipe" onClick={() => setEdit(d)}>
              <div className="recipe-n">{d.verify && <Icon name="warn" size={15} />} {d.draft && <Icon name="layers" size={15} />} {d.name} {d.popular && <Icon name="star" size={14} />}</div>
              <div className="muted sm">{d.ordered ? d.ingredients.map(cap).join(' ↑ ') : d.ingredients.filter((i) => !d.after?.includes(i)).map(cap).join(' · ')}{d.after?.length ? ` · all'uscita: ${d.after.map(cap).join(', ')}` : ''}</div>
            </button>
            {d.off && <button className="btn ghost sm" onClick={() => { sfx.tap(); app.setDishOff(d.id, false); }}>Rimetti</button>}
          </div>
        );
        const on = all.filter((d) => !d.off);
        const off = all.filter((d) => d.off);
        return (
          <section key={c.id} className="card">
            <div className="card-h cat-h"><Ing name={CAT_ING[c.id]} /> {c.name}</div>
            {on.map(row)}
            {off.length > 0 && (
              <>
                <div className="setting-h off-h">Fuori menu ({off.length})</div>
                {off.map(row)}
              </>
            )}
          </section>
        );
      })}

      <h3 className="h3">Ingredienti</h3>
      <section className="card">
        {filterBar}
        <button className="btn ghost wide" onClick={() => setShowIngs((v) => !v)}>
          {showIngs ? 'Nascondi' : 'Mostra'} lista ingredienti ({allIngs.length})
        </button>
        <div className="muted sm">Due nomi per la stessa cosa (es. mozzarella e fior di latte)? <b>Tocca quello da togliere</b> e scegli quale usare al suo posto.</div>
        {showIngs && (
          <div className="chips">
            {allIngs.map(([name, n]) => (
              <button key={name} className="chip" onClick={() => setMerge(name)}><Ing name={name} /> {cap(name)} {n > 0 && <span className="muted sm">×{n}</span>}</button>
            ))}
          </div>
        )}
        {Object.keys(app.save.aliases ?? {}).length > 0 && (
          <>
            <div className="setting-h">Ingredienti uniti</div>
            {Object.entries(app.save.aliases!).map(([from, to]) => (
              <div key={from} className="alias-row">
                <span><s>{cap(from)}</s> → <b>{cap(to)}</b></span>
                <button className="btn ghost sm" onClick={() => app.forgetAlias(from)}>Dimentica</button>
              </div>
            ))}
            <div className="muted sm">"Dimentica" non cambia le ricette: serve solo se vuoi che il nome tolto possa tornare con gli aggiornamenti del menu.</div>
          </>
        )}
      </section>
      {merge && <MergeSheet from={merge} onClose={() => setMerge(null)} />}

      <h3 className="h3">Dati</h3>
      <section className="card">
        <div className="muted sm">Copia il backup per salvare ricette e statistiche, oppure incollalo qui per ripristinarle.</div>
        <textarea rows={3} value={io} onChange={(e) => setIo(e.target.value)} placeholder="Backup JSON…" />
        <div className="modal-btns">
          <button className="btn ghost" onClick={async () => { const t = app.exportSave(); setIo(t); try { await navigator.clipboard.writeText(t); setMsg('Copiato!'); } catch { setMsg('Seleziona e copia il testo'); } }}>Esporta</button>
          <button className="btn ghost" disabled={!io} onClick={() => setMsg(app.importSave(io) ? 'Importato ✔' : 'Backup non valido')}>Importa</button>
        </div>
        {msg && <div className="muted sm">{msg}</div>}
        <hr />
        <button className="btn danger wide" onClick={() => confirm('Ripristinare le ricette originali? Le tue modifiche andranno perse.') && app.resetRecipes()}>Ripristina ricette originali</button>
        <button className="btn danger wide" onClick={() => confirm('Azzerare statistiche, XP e serie?') && app.resetStats()}>Azzera statistiche</button>
      </section>

      {station && <StationEditor id={station} onClose={() => setStation(null)} />}
      {edit && <Editor key={edit === 'new' ? 'new' : edit.id} dish={edit === 'new' ? null : edit} onClose={() => setEdit(null)} />}
    </div>
  );
}

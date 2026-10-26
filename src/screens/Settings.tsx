import { useRef, useState } from 'react';
import { CAT_ING, Icon } from '../components/Icon';
import { useApp } from '../store';
import { CATEGORIES, catOf, isPizza, PIZZA_INGREDIENTS } from '../lib/data';
import { STATIONS, layoutOf, universeOf, type StationId } from '../lib/station';
import { delPhoto, savePhoto, usePhoto } from '../lib/photos';
import { sfx } from '../lib/fx';
import type { Category, Dish } from '../lib/types';
import { cap } from '../lib/emoji';
import { Ing } from '../components/Ing';
import { TextSize } from '../components/Welcome';
import { InstallCard } from '../components/Install';
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
 * La tua postazione: tocchi un ingrediente e poi il posto dove metterlo, come sistemare le vaschette al banco.
 * Nel turno gli ingredienti staranno sempre lì.
 */
function StationEditor({ id, onClose }: { id: StationId; onClose: () => void }) {
  const app = useApp();
  useHoldUpdate(true);
  const universe = universeOf(id, app.save.dishes);
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
  const allIngs = (() => {
    const m = new Map<string, number>();
    const add = (raw: string, n: number) => {
      const k = raw.trim().toLowerCase().replace(/^\d+(\/\d+)?\s+/, '');
      if (!k || /^pezz/.test(k)) return;
      m.set(k, (m.get(k) ?? 0) + n);
    };
    if (filter === 'all' || filter === 'pizze') PIZZA_INGREDIENTS.forEach((i) => add(i, 0));
    if (filter !== 'pizze') app.save.dishes.filter((d) => filter === 'all' || d.category === filter).forEach((d) => d.ingredients.forEach((i) => add(i, 1)));
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0], 'it'));
  })();
  const filterBar = (
    <div className="chips filters">
      <button className={`chip ${filter === 'all' ? 'sel' : ''}`} onClick={() => setFilter('all')}>Tutti</button>
      {CATEGORIES.map((c) => (
        <button key={c.id} className={`chip ${filter === c.id ? 'sel' : ''}`} onClick={() => setFilter(c.id)}>
          <Ing name={CAT_ING[c.id]} /> {c.name} ({app.save.dishes.filter((d) => d.category === c.id).length})
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

      <h3 className="h3">La tua postazione</h3>
      <section className="card">
        <div className="muted sm">Ogni ingrediente sta sempre nello stesso posto del bancone. Sistemalo come il tuo banco al lavoro.</div>
        {STATIONS.map((st) => (
          <button key={st.id} className="recipe" onClick={() => setStation(st.id)}>
            <div className="recipe-n">{st.name} {app.save.station?.[st.id] && <span className="badge">tua</span>}</div>
            <div className="muted sm">{universeOf(st.id, app.save.dishes).length} {st.id === 'fritti' ? 'pezzi' : 'ingredienti'}</div>
          </button>
        ))}
      </section>

      <InstallCard where="settings" />

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
        const list = app.save.dishes.filter((d) => d.category === c.id);
        if (!list.length) return null;
        return (
          <section key={c.id} className="card">
            <div className="card-h cat-h"><Ing name={CAT_ING[c.id]} /> {c.name}</div>
            {list.map((d) => (
              <button key={d.id} className="recipe" onClick={() => setEdit(d)}>
                <div className="recipe-n">{d.verify && <Icon name="warn" size={15} />} {d.draft && <Icon name="layers" size={15} />} {d.name} {d.popular && <Icon name="star" size={14} />}</div>
                <div className="muted sm">{d.ordered ? d.ingredients.map(cap).join(' ↑ ') : d.ingredients.filter((i) => !d.after?.includes(i)).map(cap).join(' · ')}{d.after?.length ? ` · all'uscita: ${d.after.map(cap).join(', ')}` : ''}</div>
              </button>
            ))}
          </section>
        );
      })}

      <h3 className="h3">Ingredienti</h3>
      <section className="card">
        {filterBar}
        <button className="btn ghost wide" onClick={() => setShowIngs((v) => !v)}>
          {showIngs ? 'Nascondi' : 'Mostra'} lista ingredienti ({allIngs.length})
        </button>
        {showIngs && (
          <div className="chips">
            {allIngs.map(([name, n]) => (
              <span key={name} className="chip"><Ing name={name} /> {cap(name)} {n > 0 && <span className="muted sm">×{n}</span>}</span>
            ))}
          </div>
        )}
      </section>

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

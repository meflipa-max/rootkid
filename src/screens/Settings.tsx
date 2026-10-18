import { useState } from 'react';
import { useApp } from '../store';
import { CATEGORIES, catOf } from '../lib/data';
import type { Category, Dish } from '../lib/types';
import { cap } from '../lib/emoji';
import { Ing } from '../components/Ing';

const slug = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'piatto';

function Editor({ dish, onClose }: { dish: Dish | null; onClose: () => void }) {
  const app = useApp();
  const [name, setName] = useState(dish?.name ?? '');
  const [category, setCategory] = useState<Category>(dish?.category ?? 'hamburger');
  const [text, setText] = useState(dish?.ingredients.join('\n') ?? '');
  const ings = text.split('\n').map((s) => s.trim()).filter(Boolean);
  const ok = name.trim() && ings.length > 0;

  const save = () => {
    let id = dish?.id;
    if (!id) {
      const base = slug(name);
      id = base;
      for (let n = 2; app.save.dishes.some((d) => d.id === id); n++) id = `${base}-${n}`;
    }
    app.saveDish({ id, name: name.trim(), category, ingredients: ings });
    onClose();
  };

  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-in" onClick={(e) => e.stopPropagation()}>
        <h3>{dish ? 'Modifica ricetta' : 'Nuovo piatto'}</h3>
        <label>Nome<input value={name} onChange={(e) => setName(e.target.value)} placeholder="Es. Esagerato" /></label>
        <label>Categoria
          <select value={category} onChange={(e) => setCategory(e.target.value as Category)}>
            {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
          </select>
        </label>
        <label>Ingredienti <span className="muted sm">(uno per riga)</span>
          <textarea rows={8} value={text} onChange={(e) => setText(e.target.value)} placeholder={'hamburger\ncheddar\nbacon'} />
        </label>
        {category === 'fritti' && <div className="muted sm">Friggitoria: scrivi le quantità, es. “3 crocchette” o “8 pezzi”.</div>}
        <div className="modal-btns">
          {dish && (
            <button className="btn danger" onClick={() => { if (confirm(`Eliminare “${dish.name}”?`)) { app.deleteDish(dish.id); onClose(); } }}>
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

export function Settings() {
  const app = useApp();
  const { settings } = app.save;
  const [edit, setEdit] = useState<Dish | 'new' | null>(null);
  const [io, setIo] = useState('');
  const [msg, setMsg] = useState('');
  const [filter, setFilter] = useState<Category | 'all'>('all');
  const [showIngs, setShowIngs] = useState(false);
  const allIngs = (() => {
    const m = new Map<string, number>();
    app.save.dishes.forEach((d) => d.ingredients.forEach((i) => { const k = i.trim().toLowerCase(); m.set(k, (m.get(k) ?? 0) + 1); }));
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0], 'it'));
  })();
  const toVerify = app.save.dishes.filter((d) => d.verify).length;

  return (
    <div className="page">
      <h2 className="h">Impostazioni</h2>

      <section className="card">
        <label className="toggle"><span>🔊 Suoni</span><input type="checkbox" checked={settings.sound} onChange={(e) => app.setSettings({ sound: e.target.checked })} /></label>
        <label className="toggle"><span>📳 Vibrazione</span><input type="checkbox" checked={settings.haptics} onChange={(e) => app.setSettings({ haptics: e.target.checked })} /></label>
        <label className="toggle"><span>🎯 Obiettivo giornaliero</span>
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
        <div className="card warn sm">⚠️ Ho letto le ricette da una foto scritta a mano: i piatti con ⚠️ ({toVerify}) hanno parti tagliate o poco leggibili. Controllali e correggili!</div>
      )}
      <div className="chips">
        <button className={`chip ${filter === 'all' ? 'sel' : ''}`} onClick={() => setFilter('all')}>Tutti ({app.save.dishes.length})</button>
        {CATEGORIES.map((c) => (
          <button key={c.id} className={`chip ${filter === c.id ? 'sel' : ''}`} onClick={() => setFilter(c.id)}>
            {c.emoji} {c.name} ({app.save.dishes.filter((d) => d.category === c.id).length})
          </button>
        ))}
      </div>
      {CATEGORIES.map((c) => {
        if (filter !== 'all' && filter !== c.id) return null;
        const list = app.save.dishes.filter((d) => d.category === c.id);
        if (!list.length) return null;
        return (
          <section key={c.id} className="card">
            <div className="card-h" style={{ color: c.color }}>{c.emoji} {c.name}</div>
            {list.map((d) => (
              <button key={d.id} className="recipe" onClick={() => setEdit(d)}>
                <div className="recipe-n">{d.verify && '⚠️ '}{d.name}</div>
                <div className="muted sm">{d.ingredients.map(cap).join(' · ')}</div>
              </button>
            ))}
          </section>
        );
      })}

      <h3 className="h3">Ingredienti</h3>
      <section className="card">
        <button className="btn ghost wide" onClick={() => setShowIngs((v) => !v)}>
          {showIngs ? 'Nascondi' : 'Mostra'} lista ingredienti ({allIngs.length})
        </button>
        {showIngs && (
          <div className="chips">
            {allIngs.map(([name, n]) => (
              <span key={name} className="chip"><Ing name={name} /> {cap(name)} <span className="muted sm">×{n}</span></span>
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

      {edit && <Editor key={edit === 'new' ? 'new' : edit.id} dish={edit === 'new' ? null : edit} onClose={() => setEdit(null)} />}
    </div>
  );
}

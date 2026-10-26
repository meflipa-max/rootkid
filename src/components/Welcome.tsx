import { Icon } from './Icon';
import { useApp } from '../store';
import { sfx } from '../lib/fx';
import type { Category, Settings } from '../lib/types';
import { CATEGORIES } from '../lib/data';
import { CAT_ING } from './Icon';
import { Ing } from './Ing';
import { useState } from 'react';

export const TEXT_SIZES: { v: Settings['text']; label: string; hint: string }[] = [
  { v: 1, label: 'Normale', hint: 'Aa' },
  { v: 2, label: 'Grande', hint: 'Aa' },
  { v: 3, label: 'Molto grande', hint: 'Aa' },
];

/** scelta della grandezza del testo: si vede subito l'effetto su tutta l'app */
export function TextSize() {
  const app = useApp();
  const cur = app.save.settings.text;
  return (
    <div className="seg" role="radiogroup" aria-label="Grandezza del testo">
      {TEXT_SIZES.map((t) => (
        <button key={t.v} role="radio" aria-checked={cur === t.v} className={cur === t.v ? 'on' : ''} onClick={() => { sfx.tap(); app.setSettings({ text: t.v }); }}>
          <span style={{ fontSize: `${1 + (t.v - 1) * 0.3}rem` }}>{t.hint}</span>
          <small>{t.label}</small>
        </button>
      ))}
    </div>
  );
}

/**
 * I miei banchi: le categorie che si fanno al lavoro. Il pizzaiolo non monta gli hamburger:
 * titolo, conteggi e missioni contano solo i suoi banchi, il resto si può allenare lo stesso.
 */
export function BanchiPicker({ value, onChange }: { value: Category[]; onChange: (v: Category[]) => void }) {
  const toggle = (c: Category) => {
    sfx.tap();
    const next = value.includes(c) ? value.filter((x) => x !== c) : [...value, c];
    if (next.length) onChange(CATEGORIES.map((x) => x.id).filter((x) => next.includes(x)));
  };
  return (
    <div className="chips banchi">
      {CATEGORIES.map((c) => (
        <button key={c.id} className={`chip ${value.includes(c.id) ? 'sel' : ''}`} onClick={() => toggle(c.id)} aria-pressed={value.includes(c.id)}>
          {value.includes(c.id) ? <Icon name="check" size={14} /> : <Ing name={CAT_ING[c.id]} />} {c.name}
        </button>
      ))}
    </div>
  );
}

const ALL = CATEGORIES.map((c) => c.id);
/** tutte le categorie = nessuna scelta (anche le categorie che arriveranno in futuro) */
export const banchiOf = (v: Category[]) => (v.length >= ALL.length ? undefined : v);

/** primo avvio: testo e ritmo, due tocchi e si gioca. Si cambia quando si vuole dalle impostazioni. */
export function Welcome() {
  const app = useApp();
  const [banchi, setBanchi] = useState<Category[]>(ALL);
  const pick = (calm: boolean) => {
    sfx.tap();
    const b = banchiOf(banchi);
    app.setSettings({ calm, setup: true, banchi: b, cat: b?.length === 1 ? b[0] : 'all' });
  };
  return (
    <div className="modal">
      <div className="modal-in welcome">
        <h3>Benvenuto in Core a Core!</h3>
        <p>Prima di iniziare, sistemiamo il gioco come ti è più comodo. Potrai cambiare tutto quando vuoi da <b>Impostazioni</b>.</p>
        <div className="setting-h"><Icon name="text" size={22} /> Quanto grande vuoi il testo?</div>
        <TextSize />
        <div className="setting-h"><Icon name="store" size={22} /> Cosa fai al lavoro?</div>
        <div className="muted sm">Lascia segnate le categorie che prepari tu: conteranno per il tuo titolo e le missioni. Le altre le puoi allenare lo stesso.</div>
        <BanchiPicker value={banchi} onChange={setBanchi} />
        <div className="setting-h"><Icon name="clock" size={22} /> Che ritmo preferisci?</div>
        <button className="choice rec" onClick={() => pick(true)}>
          <span className="ch-e"><Icon name="turtle" size={30} /></span>
          <span><b>Con calma</b>I clienti aspettano a lungo: hai tutto il tempo per pensare</span>
        </button>
        <button className="choice" onClick={() => pick(false)}>
          <span className="ch-e"><Icon name="bolt" size={28} /></span>
          <span><b>Più veloce</b>I clienti hanno fretta, e sempre di più man mano che sali di livello</span>
        </button>
      </div>
    </div>
  );
}

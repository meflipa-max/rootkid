import { Icon } from './Icon';
import { useApp } from '../store';
import { sfx } from '../lib/fx';
import type { Settings } from '../lib/types';

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

/** primo avvio: testo e ritmo, due tocchi e si gioca. Si cambia quando si vuole dalle impostazioni. */
export function Welcome() {
  const app = useApp();
  const pick = (calm: boolean) => {
    sfx.tap();
    app.setSettings({ calm, setup: true });
  };
  return (
    <div className="modal">
      <div className="modal-in welcome">
        <h3>Benvenuto in Core a Core!</h3>
        <p>Prima di iniziare, sistemiamo il gioco come ti è più comodo. Potrai cambiare tutto quando vuoi da <b>Impostazioni</b>.</p>
        <div className="setting-h"><Icon name="text" size={22} /> Quanto grande vuoi il testo?</div>
        <TextSize />
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

import { useState } from 'react';
import { Icon } from './Icon';
import { installSnoozed, snoozeInstall, useInstall } from '../lib/pwa';
import { sfx } from '../lib/fx';

/** passi per chi non ha il pulsante "Installa" (iPhone/iPad, Firefox, Samsung Internet…) */
function Steps({ ios }: { ios: boolean }) {
  return ios ? (
    <ol className="steps">
      <li>Apri il gioco con <b>Safari</b></li>
      <li>Tocca il tasto <b>Condividi</b> <span className="key"><Icon name="share" size={18} /></span> in basso</li>
      <li>Scorri e tocca <b>«Aggiungi alla schermata Home»</b></li>
      <li>Tocca <b>«Aggiungi»</b> in alto a destra</li>
    </ol>
  ) : (
    <ol className="steps">
      <li>Tocca il <b>menu del browser</b> <span className="key"><Icon name="menu" size={18} /></span> in alto a destra</li>
      <li>Scegli <b>«Installa app»</b> oppure <b>«Aggiungi a schermata Home»</b></li>
    </ol>
  );
}

/**
 * Invito a installare il gioco come app. In home (`where="home"`) si può rimandare con "Non ora";
 * nelle impostazioni resta sempre, con lo stato attuale.
 */
export function InstallCard({ where }: { where: 'home' | 'settings' }) {
  const { installed, way, install } = useInstall();
  const [hidden, setHidden] = useState(installSnoozed);
  const [open, setOpen] = useState(where === 'settings');

  if (where === 'home' && (way === 'none' || hidden)) return null;
  if (where === 'settings' && installed) {
    return (
      <section className="card install done">
        <div className="card-h"><Icon name="check" size={22} /> Il gioco è installato</div>
        <div className="muted">Lo trovi sulla schermata Home e si aggiorna da solo.</div>
      </section>
    );
  }

  return (
    <section className="card install">
      <div className="install-top">
        <img className="install-icon" src="/pwa-192.png" alt="" width={56} height={56} />
        <div>
          <div className="card-h">Metti il gioco sul telefono</div>
          <div className="install-sub">Lo apri con un tocco dalla schermata Home, anche senza internet, e si aggiorna da solo.</div>
        </div>
      </div>
      {way === 'prompt' ? (
        <button className="btn primary wide big" onClick={() => { sfx.tap(); void install(); }}>
          <Icon name="download" size={24} /> Installa il gioco
        </button>
      ) : way === 'none' ? (
        <div className="muted">Dal menu del browser scegli «Installa» o «Aggiungi alla schermata Home». Su computer cerca l'icona di installazione nella barra degli indirizzi.</div>
      ) : open ? (
        <Steps ios={way === 'ios'} />
      ) : (
        <button className="btn primary wide big" onClick={() => { sfx.tap(); setOpen(true); }}>
          <Icon name="download" size={24} /> Come si installa
        </button>
      )}
      {where === 'home' && (
        <button className="btn ghost wide" onClick={() => { snoozeInstall(); setHidden(true); }}>Non ora</button>
      )}
    </section>
  );
}

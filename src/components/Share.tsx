import { useState } from 'react';
import { Icon } from './Icon';
import { sfx } from '../lib/fx';

/** l'indirizzo dell'app, senza parametri di prova (?q=low ecc.) */
const appUrl = () => `${window.location.origin}/`;
const MESSAGE = 'Ti consiglio Core a Core, il gioco per imparare a memoria le ricette della pizzeria:';

/** logo di WhatsApp, disegnato pieno */
function WhatsApp({ size = 22 }: { size?: number }) {
  return (
    <svg className="icon" width={size} height={size} viewBox="0 0 24 24" aria-hidden fill="currentColor">
      <path d="M12 2.2A9.7 9.7 0 0 0 3.6 16.8L2.3 21.7l5-1.3A9.7 9.7 0 1 0 12 2.2zm0 17.7a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 19.9zm4.4-6c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.5.1l-.8.9c-.1.2-.3.2-.5.1a6.6 6.6 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.5-.4h-.5a.9.9 0 0 0-.6.3 2.7 2.7 0 0 0-.9 2c0 1.2.9 2.4 1 2.5.1.2 1.7 2.7 4.2 3.8 1.6.7 2.2.7 3 .6.5-.1 1.4-.6 1.6-1.1.2-.6.2-1 .1-1.1l-.5-.4z" />
    </svg>
  );
}

/**
 * Condividi il gioco: su WhatsApp, con il menu di condivisione del telefono, o copiando il link.
 * `compact` = solo la riga di pulsanti (per la home).
 */
export function ShareCard({ compact }: { compact?: boolean }) {
  const [msg, setMsg] = useState('');
  const url = appUrl();
  const canShare = typeof navigator !== 'undefined' && !!navigator.share;

  const whatsapp = () => {
    sfx.tap();
    window.open(`https://wa.me/?text=${encodeURIComponent(`${MESSAGE} ${url}`)}`, '_blank', 'noopener');
  };
  const share = async () => {
    sfx.tap();
    try {
      await navigator.share({ title: 'Core a Core', text: MESSAGE, url });
    } catch {
      /* annullato */
    }
  };
  const copy = async () => {
    sfx.tap();
    try {
      await navigator.clipboard.writeText(url);
      setMsg('Link copiato!');
    } catch {
      setMsg(url);
    }
    setTimeout(() => setMsg(''), 3000);
  };

  return (
    <section className={`card share ${compact ? 'compact' : ''}`}>
      <div className="card-h"><Icon name="share" size={22} /> Fai giocare i colleghi</div>
      {!compact && <div className="muted sm">Manda il link a chi lavora con te: lo apre dal telefono e può installarlo come app.</div>}
      <div className="share-btns">
        <button className="btn wa" onClick={whatsapp}><WhatsApp /> WhatsApp</button>
        {canShare ? (
          <button className="btn ghost" onClick={() => void share()}><Icon name="share" size={20} /> Condividi</button>
        ) : (
          <button className="btn ghost" onClick={() => void copy()}><Icon name="plus" size={20} /> Copia link</button>
        )}
      </div>
      {canShare && <button className="link-btn" onClick={() => void copy()}>{msg || 'Copia il link'}</button>}
      {!canShare && msg && <div className="muted sm c">{msg}</div>}
    </section>
  );
}

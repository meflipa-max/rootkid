import React, { useEffect, useRef, useState } from 'react';

const LINES = [
  '> Inizializzazione ROOTKID OS...',
  '> Connessione al mentore "Zero"... stabilita.',
  '',
  'Ehi, ciao. So che sei qui perché ti piace smontare le cose per capire come',
  'funzionano. È la mentalità giusta.',
  '',
  'Ma c\'è una differenza enorme tra chi usa questa curiosità per ROMPERE e chi',
  'la usa per PROTEGGERE. I primi finiscono nei guai. I secondi diventano',
  'white hat: professionisti pagati bene da aziende che hanno bisogno di loro.',
  '',
  'Io ti insegno la seconda strada. In cambio, una sola promessa:',
  'usa tutto questo solo con autorizzazione, solo per difendere.',
  '',
  '> Qual è il tuo handle (nome da hacker)?',
];

export function Intro({ onStart }: { onStart: (handle: string) => void }) {
  const [shown, setShown] = useState('');
  const [doneTyping, setDoneTyping] = useState(false);
  const [handle, setHandle] = useState('');
  const [pledged, setPledged] = useState(false);
  const full = useRef(LINES.join('\n'));
  const i = useRef(0);

  useEffect(() => {
    const id = setInterval(() => {
      i.current += 2;
      setShown(full.current.slice(0, i.current));
      if (i.current >= full.current.length) {
        clearInterval(id);
        setDoneTyping(true);
      }
    }, 12);
    return () => clearInterval(id);
  }, []);

  const canStart = handle.trim().length >= 2 && pledged;

  return (
    <div className="content">
      <div className="intro fadein">
        <div className="logo-big">ROOTKID</div>
        <div className="dim mono" style={{ letterSpacing: 3, marginTop: -4 }}>DA SCRIPT KIDDIE A WHITE HAT</div>
        <div className="typ">
          {shown}
          {!doneTyping && <span className="cursor-blink">█</span>}
        </div>
        {doneTyping && (
          <div className="fadein">
            <input
              className="inp mono"
              autoFocus
              maxLength={16}
              value={handle}
              onChange={(e) => setHandle(e.target.value.replace(/[^\w\-]/g, ''))}
              onKeyDown={(e) => e.key === 'Enter' && canStart && onStart(handle.trim())}
              placeholder="es: n30_ghost"
              style={{ textAlign: 'center', fontSize: 18 }}
            />
            <label className="row" style={{ marginTop: 16, justifyContent: 'center', cursor: 'pointer', gap: 8 }}>
              <input type="checkbox" checked={pledged} onChange={(e) => setPledged(e.target.checked)} style={{ width: 18, height: 18 }} />
              <span style={{ textAlign: 'left', maxWidth: 380 }}>
                Prometto di usare ciò che imparo <b>solo in modo etico e autorizzato</b>, per proteggere.
              </span>
            </label>
            <div className="row" style={{ marginTop: 18, justifyContent: 'center' }}>
              <button className="btn primary" disabled={!canStart} onClick={() => onStart(handle.trim())}>
                Inizia il percorso →
              </button>
            </div>
            <p className="dim" style={{ fontSize: 12, marginTop: 18 }}>
              Gioco educativo. Tutti gli "attacchi" avvengono in laboratori simulati. Nessun sistema reale è coinvolto.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

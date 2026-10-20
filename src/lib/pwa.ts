import { useEffect, useState } from 'react';
import { registerSW } from 'virtual:pwa-register';

/**
 * App installabile e sempre aggiornata.
 * - Installazione: Chrome/Android/Edge mandano `beforeinstallprompt` e il gioco lo tiene da parte
 *   per il pulsante "Installa"; su iPhone/iPad non esiste, quindi si mostrano i passi a mano.
 * - Aggiornamenti: il service worker controlla se c'è una versione nuova all'avvio, ogni volta che
 *   si torna sull'app e ogni 30 minuti. Appena la trova la applica (ricaricando la pagina), ma mai
 *   durante un turno o mentre si scrive una ricetta: aspetta che non ci sia niente da perdere.
 */

interface InstallEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferred: InstallEvent | null = null;
let installedNow = false;
let applyUpdate: (() => void) | null = null;
let holds = 0;
const subs = new Set<() => void>();
const notify = () => subs.forEach((f) => f());

const tryUpdate = () => {
  if (applyUpdate && holds === 0) {
    const go = applyUpdate;
    applyUpdate = null;
    go();
  }
};

export const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;

export const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

const isMobile = () => isIOS() || /android|mobile/i.test(navigator.userAgent);

export function initPwa() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e as InstallEvent;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    installedNow = true;
    notify();
  });
  if (!('serviceWorker' in navigator)) return;
  const update = registerSW({
    onNeedRefresh() {
      applyUpdate = () => void update(true);
      tryUpdate();
    },
    onRegisteredSW(_url, reg) {
      if (!reg) return;
      const check = () => {
        if (navigator.onLine) reg.update().catch(() => {});
      };
      setInterval(check, 30 * 60e3);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') check();
      });
    },
  });
}

/** finché `on` è vero l'aggiornamento automatico aspetta (turno in corso, modulo aperto…) */
export function useHoldUpdate(on: boolean) {
  useEffect(() => {
    if (!on) return;
    holds++;
    return () => {
      holds--;
      // lascia finire il cambio di schermata prima di ricaricare
      setTimeout(tryUpdate, 400);
    };
  }, [on]);
}

export type InstallWay = 'prompt' | 'ios' | 'menu' | 'none';

export function useInstall() {
  const [, force] = useState(0);
  useEffect(() => {
    const f = () => force((n) => n + 1);
    subs.add(f);
    return () => {
      subs.delete(f);
    };
  }, []);
  const installed = installedNow || isStandalone();
  // prompt = c'è il pulsante vero; ios = passi da Safari; menu = dal menu del browser (Firefox, Samsung…)
  const way: InstallWay = installed ? 'none' : deferred ? 'prompt' : isIOS() ? 'ios' : isMobile() ? 'menu' : 'none';
  const install = async () => {
    const e = deferred;
    if (!e) return false;
    await e.prompt();
    const { outcome } = await e.userChoice;
    deferred = null;
    if (outcome === 'accepted') installedNow = true;
    notify();
    return outcome === 'accepted';
  };
  return { installed, way, install };
}

const SNOOZE = 'cac-install-snooze';

/** "Non ora" nasconde l'invito per qualche giorno, poi torna */
export function installSnoozed() {
  try {
    return Date.now() < Number(localStorage.getItem(SNOOZE) || 0);
  } catch {
    return false;
  }
}
export function snoozeInstall(days = 3) {
  try {
    localStorage.setItem(SNOOZE, String(Date.now() + days * 864e5));
  } catch {
    /* storage bloccato */
  }
}

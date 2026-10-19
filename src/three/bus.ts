/** eventi del gioco verso la scena 3D (servito, sbagliato) senza passare dallo stato di React */
export type StageEvent =
  | { type: 'serve'; slot: number; items: string[]; cat: string | null; coins: number; vip: boolean }
  | { type: 'fail'; slot: number };

const subs = new Set<(e: StageEvent) => void>();
export const stageBus = {
  emit(e: StageEvent) {
    subs.forEach((f) => f(e));
  },
  on(f: (e: StageEvent) => void) {
    subs.add(f);
    return () => {
      subs.delete(f);
    };
  },
};

/** inclinazione del telefono / posizione del puntatore, -1..1 */
export const tilt = { x: 0, y: 0 };
let started = false;
export function startTilt() {
  if (started) return;
  started = true;
  let base: number | null = null;
  window.addEventListener('deviceorientation', (e) => {
    if (e.gamma == null || e.beta == null) return;
    base ??= e.beta;
    tilt.x = Math.max(-1, Math.min(1, e.gamma / 25));
    tilt.y = Math.max(-1, Math.min(1, (e.beta - base) / 25));
  });
  window.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    tilt.x = (e.clientX / window.innerWidth) * 2 - 1;
    tilt.y = (e.clientY / window.innerHeight) * 2 - 1;
  });
}

/** iOS chiede il permesso per il giroscopio: va chiamato dentro un tocco dell'utente */
export function askTilt() {
  const D = window.DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> } | undefined;
  if (D?.requestPermission) void D.requestPermission().catch(() => undefined);
  startTilt();
}

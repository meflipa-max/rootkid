/** Icone disegnate a tratto (al posto delle emoji): stesso spessore, angoli tondi, colore dal testo. */

const P: Record<string, string> = {
  play: 'M8 5.5v13l10.5-6.5z',
  pause: 'M8 5v14M16 5v14',
  x: 'M6 6l12 12M18 6L6 18',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  flame: 'M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2.2 1.2-3.6 2.4-4.6.2 1.6 1 2.6 2.1 2.9C11 8.6 11.3 5.6 12 3z',
  book: 'M4 5.5C6.5 4 9.5 4 12 6c2.5-2 5.5-2 8-.5V19c-2.5-1.5-5.5-1.5-8 .5-2.5-2-5.5-2-8-.5zM12 6v13.5',
  brain: 'M9 4.5a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 6 1.5V6a2.5 2.5 0 0 0-3-1.5zM15 4.5a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-6 1.5',
  hammer: 'M14 6l4 4M12.5 7.5l-8 8 4 4 8-8M12 4l6 6 2-2-6-6z',
  shirt: 'M8 4l-4 3 2 4 2-1v10h8V10l2 1 2-4-4-3c-.5 1.5-2 2.5-4 2.5S8.5 5.5 8 4z',
  chart: 'M5 20V10M12 20V4M19 20v-7',
  gear: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM12 2.5v3M12 18.5v3M21.5 12h-3M5.5 12h-3M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1M18.7 18.7l-2.1-2.1M7.4 7.4L5.3 5.3',
  store: 'M4 10v10h16V10M3 10l2-6h14l2 6zM3 10c0 1.7 1.3 2.5 3 2.5S9 11.7 9 10c0 1.7 1.3 2.5 3 2.5s3-.8 3-2.5c0 1.7 1.3 2.5 3 2.5s3-.8 3-2.5M10 20v-5h4v5',
  star: 'M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8L3.5 9.7l5.9-.8z',
  trash: 'M5 7h14M10 7V4.5h4V7M7 7l1 13h8l1-13',
  bell: 'M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20.5h4M12 3v2',
  gift: 'M4 10h16v4H4zM5.5 14v6.5h13V14M12 10v10.5M12 10C10 6 6.5 6 7.5 8.5 8.5 10.5 12 10 12 10zM12 10c2-4 5.5-4 4.5-1.5C15.5 10.5 12 10 12 10z',
  target: 'M12 12m-8 0a8 8 0 1 0 16 0 8 8 0 1 0-16 0M12 12m-4 0a4 4 0 1 0 8 0 4 4 0 1 0-8 0M12 12h.01',
  refresh: 'M19 8a7.5 7.5 0 0 0-13.5 1M5 16a7.5 7.5 0 0 0 13.5-1M19 3.5V8h-4.5M5 20.5V16h4.5',
  crown: 'M4 18h16M4.5 15L3 7l5 4 4-6 4 6 5-4-1.5 8z',
  clock: 'M12 12m-8.5 0a8.5 8.5 0 1 0 17 0 8.5 8.5 0 1 0-17 0M12 7v5l3.5 2',
  bolt: 'M13 3L5 13.5h6L10 21l8-10.5h-6z',
  eye: 'M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12zM12 12m-3 0a3 3 0 1 0 6 0 3 3 0 1 0-6 0',
  help: 'M9.2 9a3 3 0 1 1 4.3 2.7c-.9.5-1.5 1.2-1.5 2.3M12 17.5h.01M12 12m-9 0a9 9 0 1 0 18 0 9 9 0 1 0-18 0',
  bulb: 'M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z',
  snow: 'M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 20.5c1-4 4-6 7.5-6s6.5 2 7.5 6',
  plant: 'M8 21h8l1-6H7zM12 15V9M12 9c0-3 2-5.5 6-5.5 0 3.5-2.5 5.5-6 5.5zM12 11c0-2.5-1.8-4.5-5-4.5 0 3 2 4.5 5 4.5z',
  frame: 'M4 5h16v14H4zM7 15l3.5-4 2.5 3 2-2 2 3M15 9h.01',
  table: 'M3 9h18M5 9l-1 11M19 9l1 11M8 9v7h8V9M12 4v5M7 4h10',
  sign: 'M3 6h18v8H3zM8 14v6M16 14v6M7 10h10',
  jar: 'M8 3h8v3H8zM7 6h10l1 3v10.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 19.5V9zM6.5 12h11',
  cash: 'M4 9h16v11H4zM7 9V5h10v4M8 13h2M14 13h2M8 16.5h8',
  sad: 'M12 12m-9 0a9 9 0 1 0 18 0 9 9 0 1 0-18 0M8.5 16.5c1-1.3 2.2-2 3.5-2s2.5.7 3.5 2M9 9.5h.01M15 9.5h.01',
  smile: 'M12 12m-9 0a9 9 0 1 0 18 0 9 9 0 1 0-18 0M8.5 14c1 1.5 2.2 2.2 3.5 2.2s2.5-.7 3.5-2.2M9 9.5h.01M15 9.5h.01',
  trophy: 'M8 4h8v5a4 4 0 0 1-8 0zM8 6H4.5c0 3 1.5 4.5 3.7 4.8M16 6h3.5c0 3-1.5 4.5-3.7 4.8M12 13v4M8.5 20.5h7M9.5 17h5v3.5h-5z',
  sound: 'M4 9.5h4L13 5v14l-5-4.5H4zM16.5 9a4 4 0 0 1 0 6M19 6.5a7.5 7.5 0 0 1 0 11',
  phone: 'M7 3h10v18H7zM11 18h2',
  warn: 'M12 3.5L2.5 20h19zM12 10v4.5M12 17.5h.01',
  scale: 'M12 4v16M7 20h10M4 8h16M4 8l-2 6a3 3 0 0 0 4 0zM20 8l-2 6a3 3 0 0 0 4 0z',
  plus: 'M12 5v14M5 12h14',
  bandage: 'M4.5 14.5l10-10a3.5 3.5 0 0 1 5 5l-10 10a3.5 3.5 0 0 1-5-5zM10 10l4 4',
  search: 'M11 11m-6.5 0a6.5 6.5 0 1 0 13 0 6.5 6.5 0 1 0-13 0M16 16l4.5 4.5',
  share: 'M12 15V3.5M8 7l4-4 4 4M8.5 10H6v10.5h12V10h-2.5',
  download: 'M12 4v11M7.5 10.5L12 15l4.5-4.5M5 20h14',
  menu: 'M12 5h.01M12 12h.01M12 19h.01',
  text: 'M3 18l5-12 5 12M4.7 14h6.6M15 18l3-7.5 3 7.5M16 15.5h4',
  turtle: 'M4 15c0-4 3.5-7 8-7s8 3 8 7zM7 15l-1 3M17 15l1 3M20 13h1.5a1.5 1.5 0 0 0 0-3H20M9 8.5l1.5 6.5M15 8.5l-1.5 6.5',
  camera: 'M4 8h3l2-2.5h6L17 8h3v11H4zM12 13.5m-3.5 0a3.5 3.5 0 1 0 7 0 3.5 3.5 0 1 0-7 0',
  up: 'M12 19V5M6 11l6-6 6 6',
  down: 'M12 5v14M6 13l6 6 6-6',
  layers: 'M12 4l9 4.5-9 4.5-9-4.5zM3 13l9 4.5 9-4.5M3 17l9 4.5 9-4.5',
  calendar: 'M4 6h16v14H4zM4 10h16M8 3.5v4M16 3.5v4',
  sparkle: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z',
};

const FILLED = new Set(['play', 'flame', 'star', 'crown', 'bolt']);

export function Icon({ name, size = 20, fill, className = '' }: { name: keyof typeof P | string; size?: number; fill?: boolean; className?: string }) {
  const d = P[name] ?? P.help;
  const f = fill ?? FILLED.has(name);
  return (
    <svg className={`icon ${className}`} width={size} height={size} viewBox="0 0 24 24" aria-hidden fill={f ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

/** moneta disegnata */
export function Coin({ size = 18 }: { size?: number }) {
  return (
    <svg className="icon coin-i" width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="10" fill="#e3a83a" stroke="#2b211c" strokeWidth="2" />
      <circle cx="12" cy="12" r="6" fill="none" stroke="#9c6a14" strokeWidth="1.6" />
      <path d="M10.5 9.5h3M12 9.5v5" stroke="#9c6a14" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

/** cuore pieno o vuoto */
export function Heart({ on, size = 20 }: { on: boolean; size?: number }) {
  return (
    <svg className={`icon heart-i ${on ? '' : 'off'}`} width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path d="M12 20.5S3.5 15 3.5 9A4.5 4.5 0 0 1 12 6.5 4.5 4.5 0 0 1 20.5 9c0 6-8.5 11.5-8.5 11.5z" fill={on ? '#c8463b' : '#e6dccd'} stroke="#2b211c" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

export const UPGRADE_ICON: Record<string, string> = {
  forno: 'flame', cassa: 'cash', insegna: 'sign', frigo: 'snow', campanello: 'bell', mise: 'jar', garzone: 'user', cronometro: 'clock', piante: 'plant', quadri: 'frame', luci: 'bulb', tavolini: 'table',
};
export const MISSION_ICON: Record<string, string> = {
  serve: 'store', memory: 'brain', combo: 'flame', shifts: 'clock', stars3: 'star', revenge: 'refresh', guess: 'help', cards: 'book', vip: 'crown',
  phaseup: 'bolt', fresh: 'sparkle', redeem: 'target', order: 'layers', real: 'user', mix: 'store',
};
/** icona 3D di ogni categoria: il render di un ingrediente simbolo */
export const CAT_ING: Record<string, string> = { hamburger: 'bun', insalatone: 'insalata', focacce: 'focaccia', classiche: 'pomodoro', speciali: 'funghi porcini', dolci: 'nutella', fritti: 'patatine' };

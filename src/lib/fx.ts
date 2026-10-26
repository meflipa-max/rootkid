let ctx: AudioContext | null = null;
const flags = { sound: true, haptics: true };

export const setFx = (f: { sound: boolean; haptics: boolean }) => Object.assign(flags, f);

function ac() {
  if (!ctx) {
    const C = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (C) ctx = new C();
  }
  if (ctx && ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(freq: number, at: number, dur: number, type: OscillatorType = 'sine', vol = 0.14) {
  const c = ac();
  if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  const t = c.currentTime + at;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

const vib = (p: number | number[]) => {
  if (flags.haptics && 'vibrate' in navigator) navigator.vibrate(p);
};

export const sfx = {
  tap() {
    if (flags.sound) tone(520, 0, 0.05, 'triangle', 0.07);
    vib(8);
  },
  ok(combo = 0) {
    if (flags.sound) {
      const base = 523 * Math.pow(2, Math.min(combo, 7) / 12);
      tone(base, 0, 0.14, 'triangle');
      tone(base * 1.25, 0.08, 0.14, 'triangle');
      tone(base * 1.5, 0.16, 0.22, 'triangle');
    }
    vib(18);
  },
  bad() {
    if (flags.sound) {
      tone(220, 0, 0.18, 'sawtooth', 0.09);
      tone(165, 0.12, 0.28, 'sawtooth', 0.09);
    }
    vib([40, 30, 60]);
  },
  coin() {
    if (flags.sound) {
      tone(988, 0, 0.07, 'square', 0.05);
      tone(1319, 0.07, 0.16, 'square', 0.05);
    }
  },
  win() {
    if (flags.sound) [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.1, 0.25, 'triangle', 0.15));
    vib([30, 40, 30, 40, 80]);
  },
  /** ingrediente sul piatto: la nota sale a ogni pezzo */
  place(n: number) {
    if (flags.sound) tone(392 * Math.pow(2, Math.min(n, 9) / 12 * 2), 0, 0.09, 'triangle', 0.08);
    vib(10);
  },
  star(i: number) {
    if (flags.sound) {
      const f = [784, 988, 1175][i] ?? 1175;
      tone(f, 0, 0.3, 'triangle', 0.13);
      tone(f * 2, 0.04, 0.25, 'sine', 0.05);
    }
    vib(25);
  },
  fever() {
    if (flags.sound) [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => tone(f, i * 0.05, 0.18, 'square', 0.05));
    vib([20, 20, 20, 20, 60]);
  },
  /** il piatto sale di fase: tre note che salgono, più leggere del livello */
  phase() {
    if (flags.sound) [659, 880, 1175].forEach((f, i) => tone(f, i * 0.07, 0.2, 'sine', 0.12));
    vib([15, 30, 25]);
  },
  level() {
    if (flags.sound) [392, 523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.09, 0.35, 'triangle', 0.14));
    vib([40, 30, 40, 30, 120]);
  },
  chest() {
    if (flags.sound) {
      [262, 330, 392].forEach((f, i) => tone(f, i * 0.07, 0.14, 'square', 0.05));
      [1047, 1319, 1568, 2093].forEach((f, i) => tone(f, 0.3 + i * 0.07, 0.3, 'triangle', 0.1));
    }
    vib([30, 50, 30, 50, 150]);
  },
  tick() {
    if (flags.sound) tone(1400, 0, 0.03, 'square', 0.025);
  },
};

const COLORS = ['#c65a3c', '#e3a83a', '#6f9a6a', '#5b8db8', '#8a6aa0', '#fffaf1'];

export function confetti(power = 1) {
  const cv = document.createElement('canvas');
  cv.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:999';
  const w = (cv.width = window.innerWidth);
  const h = (cv.height = window.innerHeight);
  document.body.appendChild(cv);
  const g = cv.getContext('2d')!;
  const n = Math.round(70 * power);
  const ps = Array.from({ length: n }, () => ({
    x: w / 2 + (Math.random() - 0.5) * 80,
    y: h * 0.55,
    vx: (Math.random() - 0.5) * 14,
    vy: -Math.random() * 15 - 5,
    s: 5 + Math.random() * 6,
    r: Math.random() * 6,
    vr: (Math.random() - 0.5) * 0.4,
    c: COLORS[Math.floor(Math.random() * COLORS.length)],
  }));
  let t = 0;
  const tick = () => {
    t++;
    g.clearRect(0, 0, w, h);
    for (const p of ps) {
      p.vy += 0.45;
      p.x += p.vx;
      p.y += p.vy;
      p.r += p.vr;
      g.save();
      g.translate(p.x, p.y);
      g.rotate(p.r);
      g.fillStyle = p.c;
      g.globalAlpha = Math.max(0, 1 - t / 90);
      g.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
      g.restore();
    }
    if (t < 90) requestAnimationFrame(tick);
    else cv.remove();
  };
  requestAnimationFrame(tick);
}

export const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** scintille che esplodono da un punto dello schermo */
export function burst(x: number, y: number, power = 1, colors = COLORS) {
  if (reduced()) return;
  const cv = document.createElement('canvas');
  const w = window.innerWidth;
  const h = window.innerHeight;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  cv.width = w * dpr;
  cv.height = h * dpr;
  cv.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:998';
  document.body.appendChild(cv);
  const g = cv.getContext('2d')!;
  g.scale(dpr, dpr);
  const n = Math.round(26 * power);
  const ps = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 + Math.random() * 0.4;
    const v = 3 + Math.random() * 5 * power;
    return { x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 2, s: 2 + Math.random() * 3, c: colors[i % colors.length], star: i % 3 === 0 };
  });
  let t = 0;
  const tick = () => {
    t++;
    g.clearRect(0, 0, w, h);
    for (const p of ps) {
      p.vx *= 0.94;
      p.vy = p.vy * 0.94 + 0.18;
      p.x += p.vx;
      p.y += p.vy;
      g.globalAlpha = Math.max(0, 1 - t / 46);
      g.fillStyle = p.c;
      g.shadowColor = p.c;
      g.shadowBlur = 8;
      g.beginPath();
      if (p.star) {
        const r = p.s * 1.8;
        for (let k = 0; k < 8; k++) {
          const rr = k % 2 ? r * 0.35 : r;
          const aa = (k / 8) * Math.PI * 2 + t * 0.1;
          g.lineTo(p.x + Math.cos(aa) * rr, p.y + Math.sin(aa) * rr);
        }
      } else g.arc(p.x, p.y, p.s, 0, Math.PI * 2);
      g.fill();
    }
    if (t < 46) requestAnimationFrame(tick);
    else cv.remove();
  };
  requestAnimationFrame(tick);
}

export const centerOf = (el: Element | null | undefined) => {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
};

/** monete che volano dal cliente al contatore, che poi "batte" */
export function flyCoins(from: { x: number; y: number } | null, to: Element | null, n = 5) {
  if (!from || !to) return;
  const dst = centerOf(to)!;
  const count = Math.min(10, Math.max(2, n));
  if (reduced()) return;
  for (let i = 0; i < count; i++) {
    const c = document.createElement('div');
    c.className = 'fly-coin';
    document.body.appendChild(c);
    const sx = from.x + (Math.random() - 0.5) * 50;
    const sy = from.y + (Math.random() - 0.5) * 30;
    const mx = (sx + dst.x) / 2 + (Math.random() - 0.5) * 120;
    const my = Math.min(sy, dst.y) - 40 - Math.random() * 60;
    const a = c.animate(
      [
        { transform: `translate(${sx}px, ${sy}px) scale(.4)`, opacity: 0 },
        { transform: `translate(${sx}px, ${sy - 20}px) scale(1.1)`, opacity: 1, offset: 0.18 },
        { transform: `translate(${mx}px, ${my}px) scale(1)`, opacity: 1, offset: 0.55 },
        { transform: `translate(${dst.x}px, ${dst.y}px) scale(.6)`, opacity: 0.9 },
      ],
      { duration: 650 + i * 45, delay: i * 40, easing: 'cubic-bezier(.4,0,.6,1)', fill: 'forwards' },
    );
    a.onfinish = () => {
      c.remove();
      if (i === count - 1) {
        to.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.25)' }, { transform: 'scale(1)' }], { duration: 260 });
      }
      if (i % 2 === 0) sfx.tick();
    };
  }
}

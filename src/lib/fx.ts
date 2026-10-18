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
  win() {
    if (flags.sound) [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.1, 0.25, 'triangle', 0.15));
    vib([30, 40, 30, 40, 80]);
  },
};

const COLORS = ['#ff8a3d', '#ff3d81', '#ffd24a', '#2ee59d', '#4cc9f0', '#b388ff'];

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

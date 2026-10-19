import { useEffect, useState, type ReactNode } from 'react';
import type { Dish } from '../lib/types';
import { cap } from '../lib/emoji';
import { Ing } from './Ing';
import { catOf } from '../lib/data';

export function Chip({ text, state, onClick, delay = 0 }: { text: string; state?: string; onClick?: () => void; delay?: number }) {
  const Tag = onClick ? 'button' : 'span';
  return (
    <Tag className={`chip ${state ?? ''}`} onClick={onClick} style={{ animationDelay: `${delay}ms` }}>
      <Ing name={text.replace(/ ×\d+$/, '')} />
      {cap(text)}
    </Tag>
  );
}

export function RecipeChips({ dish }: { dish: Dish }) {
  return (
    <div className="chips">
      {dish.ingredients.map((i, k) => (
        <Chip key={i + k} text={i} delay={k * 50} />
      ))}
    </div>
  );
}

export function DishBadge({ dish }: { dish: Dish }) {
  const c = catOf(dish.category);
  return (
    <span className="badge" style={{ background: c.color + '26', color: c.color }}>
      {c.emoji} {c.name}
    </span>
  );
}

export function Bar({ value, color, h = 8 }: { value: number; color: string; h?: number }) {
  return (
    <div className="bar" style={{ height: h }}>
      <div style={{ width: `${Math.round(value * 100)}%`, background: color }} />
    </div>
  );
}

export function Ring({ value, size = 84, stroke = 9, color = '#ffd24a', children }: { value: number; size?: number; stroke?: number; color?: string; children?: ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,.1)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.min(1, value))}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset .8s cubic-bezier(.2,.8,.2,1)' }}
        />
      </svg>
      <div className="ring-in">{children}</div>
    </div>
  );
}

export function TopBar({ title, onExit, right }: { title: string; onExit: () => void; right?: ReactNode }) {
  return (
    <div className="topbar">
      <button className="icon-btn" onClick={onExit} aria-label="Esci">
        ✕
      </button>
      <div className="topbar-title">{title}</div>
      <div className="topbar-right">{right}</div>
    </div>
  );
}

/** numero che "rotola" fino al valore: piccolo premio visivo ogni volta che cresce */
export function useCountUp(target: number, dur = 900, delay = 0) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0;
    let start = 0;
    const from = 0;
    const t0 = setTimeout(() => {
      const step = (t: number) => {
        if (!start) start = t;
        const k = Math.min(1, (t - start) / dur);
        setV(Math.round(from + (target - from) * (1 - Math.pow(1 - k, 3))));
        if (k < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }, delay);
    return () => {
      clearTimeout(t0);
      cancelAnimationFrame(raf);
    };
  }, [target, dur, delay]);
  return v;
}

/** padronanza come 5 tacche (le scatole di Leitner); le nuove si accendono con un lampo */
export function Pips({ box, from, size = 10 }: { box: number; from?: number; size?: number }) {
  return (
    <span className="pips" style={{ ['--pip' as string]: `${size}px` }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <i key={i} className={i < box ? (from !== undefined && i >= from ? 'on new' : 'on') : from !== undefined && i < from ? 'lost' : ''} style={{ animationDelay: `${(i - (from ?? 0)) * 120 + 300}ms` }} />
      ))}
    </span>
  );
}

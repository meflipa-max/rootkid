import type { ReactNode } from 'react';
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

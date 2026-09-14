import React, { useEffect, useMemo, useState } from 'react';
import { Avatar } from '../art/Avatar';
import { rank } from '../../game/engine';

// ---------- Barra generica (HP / XP / boss) ----------
export function Bar({ value, max, kind, shine }: { value: number; max: number; kind: 'hp' | 'xp' | 'boss'; shine?: boolean }) {
  const pct = Math.max(0, Math.min(1, max > 0 ? value / max : 0));
  const low = kind === 'hp' && pct <= 0.34;
  return (
    <div className={`bar ${kind}${low ? ' low' : ''}`}>
      <i style={{ width: `${pct * 100}%` }} />
      {shine && pct > 0 && <span className="shine" />}
    </div>
  );
}

// ---------- Numeri fluttuanti ----------
export interface Floater {
  id: number;
  text: string;
  kind: 'dmg' | 'crit' | 'heal';
  x: number;
  y: number;
}
export function Floaters({ items }: { items: Floater[] }) {
  return (
    <div className="floaters">
      {items.map((f) => (
        <span key={f.id} className={`floater ${f.kind}`} style={{ left: `${f.x}%`, top: `${f.y}%` }}>
          {f.text}
        </span>
      ))}
    </div>
  );
}

let floatSeq = 0;
export function useFloaters() {
  const [items, setItems] = useState<Floater[]>([]);
  function spawn(text: string, kind: Floater['kind'] = 'dmg', x = 50, y = 45) {
    const id = ++floatSeq;
    setItems((p) => [...p, { id, text, kind, x, y }]);
    setTimeout(() => setItems((p) => p.filter((i) => i.id !== id)), 1300);
  }
  return { items, spawn };
}

// ---------- Sfondo animato ----------
export function Background() {
  const stars = useMemo(
    () =>
      Array.from({ length: 46 }, () => ({
        left: Math.random() * 100,
        top: Math.random() * 70,
        delay: Math.random() * 3.5,
      })),
    [],
  );
  return (
    <div className="bg-layer">
      <div className="bg-stars">
        {stars.map((s, i) => (
          <i key={i} style={{ left: `${s.left}%`, top: `${s.top}%`, animationDelay: `${s.delay}s` }} />
        ))}
      </div>
      <div className="bg-grid" />
    </div>
  );
}

// ---------- Salita di livello ----------
export function LevelUpOverlay({ level, onClose }: { level: number; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4200);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className="levelup" onClick={onClose}>
      {[0, 60, 120, 180, 240, 300].map((deg) => (
        <span key={deg} className="ray" style={{ transform: `rotate(${deg}deg)`, animationDelay: `${deg / 90}s` }} />
      ))}
      <div className="levelup-card">
        <div style={{ fontFamily: 'var(--mono)', letterSpacing: 4, color: 'var(--text-dim)', fontSize: 13 }}>LIVELLO SUPERIORE</div>
        <h1>LV {level}</h1>
        <div style={{ display: 'grid', placeItems: 'center', margin: '10px 0' }}>
          <Avatar level={level} px={7} />
        </div>
        <div className="chip" style={{ color: 'var(--green)' }}>{rank(level)}</div>
        <p className="dim" style={{ fontSize: 12, marginTop: 14 }}>clicca per continuare</p>
      </div>
    </div>
  );
}

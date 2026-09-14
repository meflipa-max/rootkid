import React from 'react';
import type { Boss } from '../../game/content/enemies';

// Creatura digitale generata proceduralmente: corpo + occhi + tentacoli + sigillo.
// Lo stato ('idle' | 'hit' | 'dead') guida le animazioni.
export function Daemon({ boss, state = 'idle', size = 150 }: { boss: Boss; state?: 'idle' | 'hit' | 'dead'; size?: number }) {
  const c = boss.color;
  const eyes = Array.from({ length: Math.min(6, boss.eyes) });

  const body = () => {
    switch (boss.shape) {
      case 'shard':
        return <polygon points="50,6 88,34 76,88 24,88 12,34" fill="url(#bodyGrad)" stroke={c} strokeWidth="2.5" />;
      case 'serpent':
        return (
          <path
            d="M50 8 C82 18 84 44 66 54 C50 63 44 72 50 92 C24 84 20 56 38 46 C52 38 56 26 50 8 Z"
            fill="url(#bodyGrad)"
            stroke={c}
            strokeWidth="2.5"
          />
        );
      case 'core':
        return (
          <>
            <rect x="20" y="20" width="60" height="60" rx="10" fill="url(#bodyGrad)" stroke={c} strokeWidth="2.5" />
            <rect x="32" y="32" width="36" height="36" rx="6" fill="none" stroke={c} strokeWidth="1.2" opacity="0.6" />
          </>
        );
      default:
        return (
          <path
            d="M50 10 C74 10 90 28 90 50 C90 74 72 92 50 92 C28 92 10 74 10 50 C10 28 26 10 50 10 Z"
            fill="url(#bodyGrad)"
            stroke={c}
            strokeWidth="2.5"
          />
        );
    }
  };

  return (
    <div className={`daemon daemon-${state}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 110" width={size} height={size}>
        <defs>
          <radialGradient id="bodyGrad" cx="50%" cy="38%">
            <stop offset="0%" stopColor={c} stopOpacity="0.38" />
            <stop offset="70%" stopColor="#05090d" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#05090d" />
          </radialGradient>
          <filter id="dglow">
            <feGaussianBlur stdDeviation="2.2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* aura pulsante */}
        <circle className="daemon-aura" cx="50" cy="50" r="46" fill="none" stroke={c} strokeWidth="1" opacity="0.35" />

        {/* tentacoli */}
        <g className="daemon-tendrils" stroke={c} strokeWidth="2" strokeLinecap="round" opacity="0.75">
          {[26, 38, 50, 62, 74].map((x, i) => (
            <path key={i} d={`M${x} 86 q ${i % 2 ? 5 : -5} 10 0 20`} fill="none" />
          ))}
        </g>

        <g filter="url(#dglow)">{body()}</g>

        {/* occhi */}
        <g className="daemon-eyes">
          {eyes.map((_, i) => {
            const n = eyes.length;
            const spread = Math.min(46, n * 11);
            const x = 50 - spread / 2 + (n === 1 ? spread / 2 : (spread / (n - 1)) * i);
            return <circle key={i} cx={x} cy={42} r={3.4} fill={c} />;
          })}
        </g>

        {/* sigillo centrale */}
        <text x="50" y="70" textAnchor="middle" fontSize="20" opacity="0.95">
          {boss.sigil}
        </text>
      </svg>
    </div>
  );
}

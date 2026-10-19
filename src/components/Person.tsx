import { memo } from 'react';
import type { ChefSkin } from '../lib/skins';

export interface Look {
  skin: string;
  hair: string;
  style: number;
  shirt: string;
  extra: number; // 0 niente, 1 occhiali, 2 barba, 3 baffi
}
export type Mood = 'idle' | 'worried' | 'angry' | 'happy';
export type Pose = 'idle' | 'work' | 'cheer' | 'sad';

const SKINS = ['#ffe0c8', '#f1c27d', '#d8a070', '#a8703c', '#7a4a28'];
const HAIRS = ['#2b1b12', '#6b3e1f', '#c9a227', '#b23a2e', '#1d1d24', '#aab0b8'];
const SHIRTS = ['#ff8a3d', '#4cc9f0', '#b388ff', '#2ee59d', '#ff6fb5', '#ffd24a', '#7c93ff', '#ff5a5f'];
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

export const randomLook = (): Look => {
  const style = Math.floor(Math.random() * 4);
  return {
    skin: pick(SKINS),
    hair: pick(HAIRS),
    style,
    shirt: pick(SHIRTS),
    extra: style === 1 ? pick([0, 0, 1]) : pick([0, 0, 1, 2, 3]),
  };
};

export const CHEF_LOOK: Look = { skin: '#f1c27d', hair: '#2b1b12', style: 0, shirt: '#fff', extra: 3 };

export const Person = memo(function Person({ look, mood = 'idle', pose = 'idle', chef, crown }: { look: Look; mood?: Mood; pose?: Pose; chef?: ChefSkin; crown?: boolean }) {
  const shirt = chef ? chef.shirt : look.shirt;
  const { skin, hair } = look;
  return (
    <svg viewBox="0 0 100 130" className={`person pose-${pose}`} aria-hidden>
      <g className="arm-l" style={{ transformOrigin: '14px 90px' }}>
        <rect x="6" y="84" width="16" height="34" rx="8" fill={shirt} />
        <circle cx="14" cy="120" r="7.5" fill={skin} />
      </g>
      <g className="arm-r" style={{ transformOrigin: '86px 90px' }}>
        <rect x="78" y="84" width="16" height="34" rx="8" fill={shirt} />
        <circle cx="86" cy="120" r="7.5" fill={skin} />
      </g>
      <path d="M16 132 Q16 84 50 84 Q84 84 84 132Z" fill={shirt} />
      <path d="M62 86 Q84 90 84 132 H66 Q70 104 62 86Z" fill="#000" opacity=".12" />
      {chef && <path d="M30 132 L34 98 Q50 106 66 98 L70 132Z" fill={chef.apron} />}
      <rect x="43" y="74" width="14" height="14" rx="5" fill={skin} />
      {look.style === 1 && <><rect x="21" y="38" width="13" height="50" rx="6.5" fill={hair} /><rect x="66" y="38" width="13" height="50" rx="6.5" fill={hair} /></>}
      <ellipse cx="25" cy="54" rx="4.5" ry="7" fill={skin} />
      <ellipse cx="75" cy="54" rx="4.5" ry="7" fill={skin} />
      <ellipse cx="50" cy="51" rx="25" ry="27" fill={skin} />
      <path d="M62 28 Q76 40 74 58 Q70 74 54 78 Q68 66 66 50 Q65 36 62 28Z" fill="#000" opacity=".07" />
      {!chef && look.style !== 2 && <path d="M24 48 Q22 20 50 20 Q78 20 76 48 Q70 34 50 34 Q30 34 24 48Z" fill={hair} />}
      {!chef && look.style === 2 && <><ellipse cx="27" cy="38" rx="5" ry="8" fill={hair} /><ellipse cx="73" cy="38" rx="5" ry="8" fill={hair} /></>}
      {!chef && look.style === 3 && [30, 42, 54, 66, 72].map((x, i) => <circle key={i} cx={x} cy={i % 2 ? 22 : 26} r="11" fill={hair} />)}
      {look.extra === 2 && <path d="M27 58 Q50 94 73 58 Q73 78 50 82 Q27 78 27 58Z" fill={hair} />}
      {/* occhi */}
      {mood === 'happy' ? (
        <>
          <path d="M34 54 Q40 46 46 54" stroke="#2b1b12" strokeWidth="3.4" fill="none" strokeLinecap="round" />
          <path d="M54 54 Q60 46 66 54" stroke="#2b1b12" strokeWidth="3.4" fill="none" strokeLinecap="round" />
          <circle cx="33" cy="63" r="5" fill="#ff7a90" opacity=".5" />
          <circle cx="67" cy="63" r="5" fill="#ff7a90" opacity=".5" />
        </>
      ) : (
        <>
          <circle cx="40" cy="52" r="4" fill="#2b1b12" />
          <circle cx="60" cy="52" r="4" fill="#2b1b12" />
          <circle cx="41.4" cy="50.6" r="1.4" fill="#fff" />
          <circle cx="61.4" cy="50.6" r="1.4" fill="#fff" />
        </>
      )}
      {mood === 'angry' && <path d="M32 42 L46 48 M68 42 L54 48" stroke="#2b1b12" strokeWidth="3.4" strokeLinecap="round" />}
      {mood === 'worried' && <path d="M33 47 L46 42 M67 47 L54 42" stroke="#2b1b12" strokeWidth="3" strokeLinecap="round" />}
      {look.extra === 1 && <g stroke="#2b2b35" strokeWidth="2.4" fill="rgba(255,255,255,.18)"><circle cx="40" cy="52" r="9" /><circle cx="60" cy="52" r="9" /><path d="M49 52 H51" /></g>}
      {look.extra === 3 && <path d="M36 65 Q43 59 50 64 Q57 59 64 65 Q57 68 50 66 Q43 68 36 65Z" fill={hair} />}
      {/* bocca */}
      {mood === 'happy' ? (
        <path d="M40 65 Q50 80 60 65 Z" fill="#7a1f2b" stroke="#7a1f2b" strokeWidth="2" strokeLinejoin="round" />
      ) : mood === 'angry' ? (
        <path d="M42 72 Q50 64 58 72" stroke="#7a1f2b" strokeWidth="3.2" fill="none" strokeLinecap="round" />
      ) : mood === 'worried' ? (
        <path d="M43 70 Q46.5 67 50 70 Q53.5 73 57 70" stroke="#7a1f2b" strokeWidth="3" fill="none" strokeLinecap="round" />
      ) : (
        <path d="M43 67 Q50 72 57 67" stroke="#7a1f2b" strokeWidth="3" fill="none" strokeLinecap="round" />
      )}
      {chef && (
        <g>
          <circle cx="34" cy="14" r="13" fill={chef.hat} />
          <circle cx="50" cy="9" r="14" fill={chef.hat} />
          <circle cx="66" cy="14" r="13" fill={chef.hat} />
          <rect x="27" y="14" width="46" height="17" rx="4" fill={chef.hat} />
          <rect x="27" y="26" width="46" height="5" fill="rgba(0,0,0,.12)" />
        </g>
      )}
      {crown && (
        <g className="crown">
          <path d="M33 22 L36 6 L44 15 L50 2 L56 15 L64 6 L67 22Z" fill="#ffd24a" stroke="#c98a00" strokeWidth="1.5" strokeLinejoin="round" />
          <circle cx="50" cy="15" r="2.6" fill="#ff3d81" />
          <circle cx="40" cy="18" r="1.8" fill="#4cc9f0" />
          <circle cx="60" cy="18" r="1.8" fill="#4cc9f0" />
        </g>
      )}
    </svg>
  );
});

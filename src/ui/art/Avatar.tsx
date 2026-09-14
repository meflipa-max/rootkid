import React from 'react';
import { Pixels } from './pixel';

// Sprite base: figura incappucciata davanti a una tastiera.
// H=cappuccio  F=viso  E=occhi  B=corpo  A=accessorio(distintivo)  K=tastiera  S=ombra
const HACKER: string[] = [
  '................',
  '.....HHHHHH.....',
  '....HHHHHHHH....',
  '...HHHHHHHHHH...',
  '...HHFFFFFFHH...',
  '...HHFEEFEEFH...',
  '...HHFFFFFFHH...',
  '....HFFFFFFH....',
  '.....FFFFFF.....',
  '....BBBBBBBB....',
  '...BBBAAAABBB...',
  '...BBBAAAABBB...',
  '...BBBBBBBBBB...',
  '..KKKKKKKKKKKK..',
  '..KKKKKKKKKKKK..',
  '...SSSSSSSSSS...',
];

export interface Tier {
  name: string;
  palette: Record<string, string>;
  glow: string;
}

// 5 stadi di evoluzione: più sali di grado, più l'avatar cambia aspetto
export const TIERS: Tier[] = [
  {
    name: 'Script Kiddie',
    glow: 'rgba(120,140,160,0.45)',
    palette: { H: '#4a5563', F: '#c9a88a', E: '#7dffb0', B: '#38414d', A: 'none', K: '#20262e', S: '#11161c' },
  },
  {
    name: 'Apprendista',
    glow: 'rgba(51,209,255,0.5)',
    palette: { H: '#2b5f7a', F: '#c9a88a', E: '#33d1ff', B: '#26485c', A: '#33d1ff', K: '#1b2430', S: '#11161c' },
  },
  {
    name: 'Pentester',
    glow: 'rgba(181,140,255,0.55)',
    palette: { H: '#5b3a91', F: '#c9a88a', E: '#3dff8f', B: '#402a68', A: '#b58cff', K: '#1b2430', S: '#11161c' },
  },
  {
    name: 'Senior',
    glow: 'rgba(255,209,102,0.55)',
    palette: { H: '#1d2733', F: '#c9a88a', E: '#ffd166', B: '#16202b', A: '#ffd166', K: '#222c38', S: '#11161c' },
  },
  {
    name: 'Leggenda',
    glow: 'rgba(255,255,255,0.7)',
    palette: { H: '#e8eef5', F: '#d8b795', E: '#ffffff', B: '#c3ccd8', A: '#ffd166', K: '#2a3542', S: '#11161c' },
  },
];

export function avatarTier(level: number): number {
  if (level >= 32) return 4;
  if (level >= 20) return 3;
  if (level >= 10) return 2;
  if (level >= 3) return 1;
  return 0;
}

export function Avatar({ level, px = 6, className, style }: { level: number; px?: number; className?: string; style?: React.CSSProperties }) {
  const t = TIERS[avatarTier(level)];
  return <Pixels map={HACKER} palette={t.palette} px={px} glow={t.glow} className={className} style={style} />;
}

// Ritratto con cornice, usato nell'HUD e nel profilo
export function AvatarPortrait({ level, px = 5, ring }: { level: number; px?: number; ring?: string }) {
  const t = TIERS[avatarTier(level)];
  return (
    <div className="portrait" style={{ borderColor: ring ?? t.glow }}>
      <Avatar level={level} px={px} />
    </div>
  );
}

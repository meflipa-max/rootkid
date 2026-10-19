import { memo } from 'react';
import { lvlOf } from '../lib/build';

/**
 * Lo sfondo dipinto della pizzeria: cielo al tramonto, torri pastello lontane nella nebbia,
 * il paese col campanile e le lucciole. Durante il turno scende la sera (night 0..1).
 */

const STARS: [number, number, number][] = [
  [22, 14, 1.2], [58, 34, 0.8], [96, 10, 1], [140, 26, 1.3], [176, 8, 0.8], [212, 30, 1], [248, 12, 1.4], [286, 36, 0.8],
  [322, 16, 1.1], [362, 30, 0.9], [388, 8, 1.2], [120, 48, 0.7], [200, 52, 0.8], [340, 54, 0.7], [40, 58, 0.9],
];
const FLIES: [number, number][] = [[40, 150], [92, 132], [150, 170], [205, 140], [262, 160], [318, 128], [372, 158], [120, 104], [300, 96]];

function Dome({ x, y, w, h, c1, c2, op }: { x: number; y: number; w: number; h: number; c1: string; c2: string; op: number }) {
  const cx = x + w / 2;
  return (
    <g opacity={op}>
      <rect x={x} y={y} width={w} height={220 - y} fill={c1} />
      <rect x={x + w * 0.62} y={y} width={w * 0.38} height={220 - y} fill={c2} />
      <path d={`M${x - 3} ${y} Q${x - 2} ${y - h * 0.55} ${cx} ${y - h} Q${x + w + 2} ${y - h * 0.55} ${x + w + 3} ${y}Z`} fill={c1} />
      <path d={`M${cx} ${y - h} Q${x + w + 2} ${y - h * 0.55} ${x + w + 3} ${y} L${cx + 2} ${y}Z`} fill={c2} />
      <rect x={x - 4} y={y - 1} width={w + 8} height={5} fill={c2} />
      <path d={`M${cx} ${y - h} L${cx} ${y - h - 9}`} stroke={c2} strokeWidth="1.6" />
      <rect x={cx - 2.5} y={y + 18} width={5} height={10} rx={2.5} fill="#5a2f5f" opacity=".5" />
      <rect x={cx - 2.5} y={y + 40} width={5} height={10} rx={2.5} fill="#5a2f5f" opacity=".5" />
    </g>
  );
}

export const Scene = memo(function Scene({ build, night = 0 }: { build: Record<string, number>; night?: number }) {
  const l = (id: string) => lvlOf(build, id);
  const sunY = 150 + night * 70;
  const win = Math.min(1, night * 1.6 + 0.15);
  return (
    <svg className="scene" viewBox="0 0 400 220" preserveAspectRatio="xMidYMax slice" aria-hidden>
      <defs>
        <linearGradient id="sSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2b1858" />
          <stop offset=".4" stopColor="#7d3a86" />
          <stop offset=".7" stopColor="#ef7476" />
          <stop offset="1" stopColor="#ffc98f" />
        </linearGradient>
        <linearGradient id="sNight" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#090722" />
          <stop offset="1" stopColor="#2a1650" />
        </linearGradient>
        <radialGradient id="sSun">
          <stop offset="0" stopColor="#fff8dc" />
          <stop offset=".22" stopColor="#ffe08f" />
          <stop offset=".5" stopColor="#ff9a6b" stopOpacity=".45" />
          <stop offset="1" stopColor="#ff9a6b" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="sFog" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffd9e6" stopOpacity="0" />
          <stop offset="1" stopColor="#ffd9e6" stopOpacity=".6" />
        </linearGradient>
        <radialGradient id="sFly">
          <stop offset="0" stopColor="#fffbd0" />
          <stop offset=".35" stopColor="#ffe066" stopOpacity=".8" />
          <stop offset="1" stopColor="#ffe066" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="sStreet" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4a2556" />
          <stop offset="1" stopColor="#24122f" />
        </linearGradient>
      </defs>

      <rect width="400" height="220" fill="url(#sSky)" />
      <rect width="400" height="220" fill="url(#sNight)" opacity={night * 0.9} />
      <g opacity={Math.max(0, night * 1.3 - 0.1)}>
        {STARS.map(([x, y, r], i) => <circle key={i} className="star" cx={x} cy={y} r={r} fill="#fff" style={{ animationDelay: `${i * 0.37}s` }} />)}
      </g>
      <circle cx="300" cy={sunY} r="95" fill="url(#sSun)" opacity={1 - night * 0.7} />
      <circle cx="300" cy={sunY} r="19" fill="#fff4cf" opacity={1 - night} />
      <circle cx="96" cy="40" r="11" fill="#fff6e0" opacity={night} />
      <circle cx="101" cy="37" r="10" fill="url(#sNight)" opacity={night} />

      <g className="clouds" opacity={0.5 - night * 0.3}>
        <ellipse cx="70" cy="70" rx="46" ry="7" fill="#ffc1d2" />
        <ellipse cx="96" cy="64" rx="26" ry="7" fill="#ffd3df" />
        <ellipse cx="250" cy="52" rx="54" ry="6" fill="#ffb4c8" />
        <ellipse cx="350" cy="84" rx="40" ry="6" fill="#ffc8a8" />
      </g>

      {/* torri pastello lontane, alla Monument Valley */}
      <Dome x={22} y={88} w={30} h={30} c1="#f6b6c8" c2="#e18aa7" op={0.75} />
      <Dome x={346} y={104} w={26} h={26} c1="#b9ead7" c2="#86c9b2" op={0.7} />
      <Dome x={150} y={120} w={18} h={18} c1="#c7b6f3" c2="#a08fdc" op={0.6} />
      <g opacity=".62">
        <path d="M52 112 H150 V124 H52Z" fill="#f2a9be" />
        <path d="M60 220 V124 H72 Q86 140 100 124 H112 Q126 140 140 124 H150 V220Z" fill="#f6b6c8" />
        <path d="M52 112 H150 V117 H52Z" fill="#e18aa7" />
      </g>
      <g opacity=".55">
        <path d="M372 220 V140 H392 V220Z" fill="#b9ead7" />
        <path d="M300 150 H372 V158 H300Z" fill="#9edbc5" />
        <path d="M306 220 V158 H316 Q330 172 344 158 H354 V220Z" fill="#b9ead7" />
      </g>
      <rect y="100" width="400" height="120" fill="url(#sFog)" />

      {/* il paese: tetti, cipressi e il campanile con la campana */}
      <g fill="#5b2a66">
        <path d="M0 220 V176 L14 168 L28 176 V170 H52 V178 L70 166 L88 178 V220Z" />
        <path d="M150 220 V180 L168 170 L186 180 V174 H206 V220Z" />
        <path d="M276 220 V178 L292 168 L308 178 V172 H332 L346 162 L360 172 V180 H400 V220Z" />
        <rect x="214" y="104" width="30" height="116" />
        <path d="M210 104 H248 L229 84Z" />
        <rect x="210" y="102" width="38" height="5" fill="#4a2156" />
      </g>
      <path d="M220 136 V122 Q229 110 238 122 V136Z" fill={night > 0.3 ? '#ffcf6b' : '#ffb8a0'} opacity=".9" />
      <path d="M224 132 Q229 122 234 132Z" fill="#c98a2c" />
      <circle cx="229" cy="133" r="1.6" fill="#c98a2c" />
      <g fill="#3c1c4a">
        <ellipse cx="112" cy="186" rx="7" ry="26" />
        <ellipse cx="126" cy="192" rx="6" ry="20" />
        <ellipse cx="262" cy="188" rx="7" ry="24" />
      </g>
      {/* finestre che si accendono al calar della sera */}
      <g fill="#ffd36b" opacity={win}>
        {[[20, 184], [38, 186], [72, 186], [164, 190], [190, 184], [294, 186], [318, 182], [352, 188], [376, 188], [226, 160]].map(([x, y], i) => (
          <rect key={i} x={x} y={y} width="6" height="8" rx="1.5" />
        ))}
      </g>

      {l('tavolini') > 0 && (
        <g>
          {Array.from({ length: l('tavolini') }, (_, i) => {
            const x = [70, 330, 200][i];
            return (
              <g key={i} transform={`translate(${x} 178)`}>
                <path d="M-16 0 Q0 -14 16 0Z" fill={['#e94b4b', '#2fae7a', '#f7f0e2'][i]} />
                <rect x="-1" y="0" width="2" height="22" fill="#2a1430" />
                <ellipse cx="0" cy="22" rx="11" ry="2.5" fill="#2a1430" />
              </g>
            );
          })}
        </g>
      )}

      <rect y="196" width="400" height="24" fill="url(#sStreet)" />
      {l('piante') > 0 && (
        <g>
          <Plant x={14} y={200} s={1} />
          {l('piante') > 1 && <Plant x={386} y={200} s={1} flip />}
          {l('piante') > 2 && <Plant x={204} y={202} s={0.75} />}
        </g>
      )}

      <g opacity={0.35 + night * 0.65}>
        {FLIES.map(([x, y], i) => <circle key={i} className="fly" cx={x} cy={y} r="5" fill="url(#sFly)" style={{ animationDelay: `${(i * 0.7) % 4}s`, animationDuration: `${4 + (i % 3)}s` }} />)}
      </g>
    </svg>
  );
});

function Plant({ x, y, s, flip }: { x: number; y: number; s: number; flip?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
      <path d="M-9 0 H9 L7 14 H-7Z" fill="#c8643b" />
      <rect x="-10" y="-2" width="20" height="4" rx="1.5" fill="#e07a4c" />
      <path d="M0 -2 Q-14 -10 -12 -26 Q-4 -18 0 -2Z" fill="#3fae6a" />
      <path d="M0 -2 Q12 -12 14 -24 Q4 -20 0 -2Z" fill="#2f8f55" />
      <path d="M0 -2 Q-3 -20 2 -34 Q6 -18 0 -2Z" fill="#56c47e" />
    </g>
  );
}

/** tenda a strisce del locale, con smerlatura */
export function Awning({ lights = 0 }: { lights?: number }) {
  return (
    <div className="awning" aria-hidden>
      <svg width="100%" height="34">
        <defs>
          <pattern id="awp" width="44" height="34" patternUnits="userSpaceOnUse">
            <rect width="22" height="22" fill="#e8484f" />
            <rect x="22" width="22" height="22" fill="#fff1dc" />
            <circle cx="11" cy="22" r="11" fill="#e8484f" />
            <circle cx="33" cy="22" r="11" fill="#fff1dc" />
            <rect width="44" height="5" fill="#000" opacity=".18" />
            <path d="M0 22 A11 11 0 0 0 22 22 A11 11 0 0 0 44 22" fill="none" stroke="#000" strokeOpacity=".15" strokeWidth="2" />
          </pattern>
        </defs>
        <rect width="100%" height="34" fill="url(#awp)" />
      </svg>
      {lights > 0 && (
        <div className="bulbs">
          {Array.from({ length: 7 + lights * 3 }, (_, i) => (
            <i key={i} style={{ animationDelay: `${(i % 5) * 0.31}s`, color: ['#ffd24a', '#ff6fb5', '#7fe3ff', '#8dffb8', '#ffb35c'][i % 5] }} />
          ))}
        </div>
      )}
    </div>
  );
}

/** bandierine (decorazione "quadri"): più livelli, più file */
export function Bunting({ rows }: { rows: number }) {
  if (!rows) return null;
  const cols = ['#2fae7a', '#fff1dc', '#e8484f'];
  return (
    <svg className="bunting" width="100%" height={18 * rows} aria-hidden>
      <defs>
        {Array.from({ length: rows }, (_, r) => (
          <pattern key={r} id={`bun${r}`} width="54" height="18" patternUnits="userSpaceOnUse" x={r * 18}>
            {cols.map((c, i) => <path key={i} d={`M${i * 18} 1 H${i * 18 + 16} L${i * 18 + 8} 15Z`} fill={c} />)}
          </pattern>
        ))}
      </defs>
      {Array.from({ length: rows }, (_, r) => (
        <g key={r} transform={`translate(0 ${r * 18})`}>
          <path d="M0 1 H2000" stroke="#2a1430" strokeWidth="1" />
          <rect width="100%" height="18" fill={`url(#bun${r})`} />
        </g>
      ))}
    </svg>
  );
}

/** cucina: muro di piastrelle, forno a legna con le fiamme (più forte con gli upgrade), mensola */
export const Kitchen = memo(function Kitchen({ forno }: { forno: number }) {
  return (
    <svg className="kitchen-bg" viewBox="0 0 400 130" preserveAspectRatio="xMidYMax slice" aria-hidden>
      <defs>
        <pattern id="kTile" width="26" height="26" patternUnits="userSpaceOnUse">
          <rect width="26" height="26" fill="#f4e6d4" />
          <rect x="1" y="1" width="24" height="24" rx="3" fill="#fbf1e4" />
          <rect x="3" y="3" width="10" height="4" rx="2" fill="#fff" opacity=".7" />
        </pattern>
        <radialGradient id="kFire" cx=".5" cy=".9" r=".9">
          <stop offset="0" stopColor="#fff2a8" />
          <stop offset=".35" stopColor="#ffb238" />
          <stop offset=".7" stopColor="#ff5a1f" />
          <stop offset="1" stopColor="#5a1405" />
        </radialGradient>
        <radialGradient id="kGlow">
          <stop offset="0" stopColor="#ff9a3c" stopOpacity=".7" />
          <stop offset="1" stopColor="#ff9a3c" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="kWood" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c98b52" />
          <stop offset="1" stopColor="#8a5528" />
        </linearGradient>
      </defs>
      <rect width="400" height="130" fill="url(#kTile)" />
      <rect width="400" height="130" fill="#2a1430" opacity=".12" />
      {/* mensola con barattoli */}
      <rect x="8" y="34" width="120" height="6" rx="2" fill="#9a6232" />
      {[['#e8484f', 14], ['#ffd24a', 34], ['#2fae7a', 52], ['#fff1dc', 72], ['#b56de0', 92]].map(([c, x], i) => (
        <g key={i}>
          <rect x={+x} y={18} width="14" height="16" rx="3" fill={c as string} />
          <rect x={+x - 1} y={15} width="16" height="5" rx="2" fill="#7a4a24" />
        </g>
      ))}
      {/* forno a legna */}
      <circle cx="340" cy="80" r={60 + forno * 8} fill="url(#kGlow)" className="oven-glow" style={{ opacity: 0.45 + forno * 0.11 }} />
      <path d="M282 130 V78 Q282 28 340 28 Q398 28 398 78 V130Z" fill="#b5523a" />
      {[44, 58, 72, 86, 100, 114].map((y, i) => <path key={i} d={`M286 ${y} H396`} stroke="#8e3a27" strokeWidth="1.5" opacity=".7" />)}
      <path d="M306 104 V88 Q306 62 340 62 Q374 62 374 88 V104Z" fill="#2a0c06" />
      <g className="flames" style={{ transform: `scale(${0.8 + forno * 0.08})`, transformOrigin: '340px 104px' }}>
        <path d="M318 104 Q316 90 326 82 Q324 92 332 94 Q330 78 342 70 Q340 86 350 90 Q352 80 360 82 Q366 94 362 104Z" fill="url(#kFire)" />
      </g>
      <rect x="298" y="102" width="84" height="6" rx="2" fill="#7a2d1d" />
      <rect y="112" width="400" height="18" fill="url(#kWood)" />
      <rect y="112" width="400" height="3" fill="#e2a96e" />
    </svg>
  );
});

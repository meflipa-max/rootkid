import React from 'react';

// Mini-motore di pixel art: una sprite è un array di stringhe,
// ogni carattere è un pixel e la palette dice di che colore è.
export function Pixels({
  map,
  palette,
  px = 6,
  className,
  style,
  glow,
}: {
  map: string[];
  palette: Record<string, string>;
  px?: number;
  className?: string;
  style?: React.CSSProperties;
  glow?: string;
}) {
  const h = map.length;
  const w = map[0]?.length ?? 0;
  const rects: React.ReactNode[] = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const ch = map[y][x];
      const color = palette[ch];
      if (!color || color === 'none') continue;
      rects.push(<rect key={`${y}-${x}`} x={x} y={y} width={1.02} height={1.02} fill={color} />);
    }
  }
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width={w * px}
      height={h * px}
      shapeRendering="crispEdges"
      className={className}
      style={{ filter: glow ? `drop-shadow(0 0 6px ${glow})` : undefined, ...style }}
      aria-hidden
    >
      {rects}
    </svg>
  );
}

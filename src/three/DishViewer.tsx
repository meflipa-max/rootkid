import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { buildIng } from './ingredients';
import { layoutDish } from './dish3d';
import { cap } from '../lib/emoji';

/**
 * Il piatto del Ricettario in 3D: gira da solo (o col dito) e si "apre" strato per strato,
 * con il nome accanto a ogni ingrediente. Vedere dove sta ogni cosa aiuta a ricordarla.
 */

function Exploded({ items, cat, spin }: { items: string[]; cat: string; spin: React.MutableRefObject<{ a: number; v: number; drag: boolean }> }) {
  const { out, baseKey, top, stacked } = useMemo(() => layoutDish(items, cat), [items, cat]);
  const objs = useMemo(() => out.map((o) => buildIng(o.name, true).obj), [out]);
  const base = useMemo(() => (baseKey ? buildIng(baseKey, true).obj : null), [baseKey]);
  const lid = useMemo(() => (cat === 'hamburger' ? buildIng('buntop', true).obj : null), [cat]);
  const rot = useRef<THREE.Group>(null);
  const parts = useRef<(THREE.Group | null)[]>([]);
  const labels = useRef<(HTMLDivElement | null)[]>([]);
  const lidRef = useRef<THREE.Group>(null);
  const t = useRef(0);
  const gap = 0.17;
  // ogni piatto si apre in verticale: panini strato per strato, gli altri con gli ingredienti che salgono in colonna
  const finalY = (i: number) => (stacked ? out[i].at[1] : top) + (i + 1) * gap;
  const pos = (i: number, e: number): [number, number, number] => {
    const o = out[i];
    return [o.at[0] * (1 - e), THREE.MathUtils.lerp(o.at[1], finalY(i), e), o.at[2] * (1 - e)];
  };
  useFrame((_, dt) => {
    t.current += dt;
    const e = THREE.MathUtils.smootherstep(t.current, 0.35, 1.3);
    const S = spin.current;
    if (!S.drag) {
      S.v += (0.5 - S.v) * Math.min(1, dt * 2);
      S.a += S.v * dt;
    }
    if (rot.current) rot.current.rotation.y = S.a;
    out.forEach((_, i) => {
      const p = parts.current[i];
      if (p) p.position.set(...pos(i, e));
      const l = labels.current[i];
      if (l) l.style.opacity = String(e);
    });
    if (lidRef.current) lidRef.current.position.y = top + e * (out.length + 1) * gap;
  });
  const h = (out.length ? finalY(out.length - 1) : top) + (lid ? gap + 0.3 : 0.2);
  const k = Math.min(1, 1.25 / h);
  return (
    <group position={[-0.28 * k, (-h / 2) * k + 0.02, 0]} scale={k}>
      <group ref={rot}>
        {base && <primitive object={base} />}
        {out.map((o, i) => (
          <group key={i} ref={(g) => (parts.current[i] = g)} position={o.at} scale={o.scale}>
            <primitive object={objs[i]} />
          </group>
        ))}
        {lid && (
          <group ref={lidRef}>
            <primitive object={lid} />
          </group>
        )}
      </group>
      {/* etichette in colonna, ferme, accanto a ogni strato */}
      {out.map((o, i) => (
          <Html key={i} position={[0.45, finalY(i) + 0.03, 0]} zIndexRange={[5, 0]}>
            <div className="dv-label side" ref={(d) => (labels.current[i] = d)}>{cap(o.name)}</div>
          </Html>
        ))}
    </group>
  );
}

export function DishViewer({ items, cat }: { items: string[]; cat: string }) {
  const spin = useRef({ a: -0.4, v: 0.5, drag: false });
  const last = useRef(0);
  return (
    <div
      className="dish-view"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => {
        e.stopPropagation();
        spin.current.drag = true;
        last.current = e.clientX;
        (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (!spin.current.drag) return;
        const d = (e.clientX - last.current) * 0.012;
        last.current = e.clientX;
        spin.current.a += d;
        spin.current.v = d * 40;
      }}
      onPointerUp={() => (spin.current.drag = false)}
      onPointerCancel={() => (spin.current.drag = false)}
    >
      <Canvas flat dpr={[1, 1.75]} camera={{ position: [0, 0.75, 2.5], fov: 32 }} gl={{ antialias: true, alpha: true }} onCreated={({ camera }) => camera.lookAt(0, 0, 0)}>
        <hemisphereLight args={['#fff1dc', '#9a6a52', 1.5]} />
        <directionalLight position={[2, 4, 3]} intensity={1.9} />
        <Exploded items={items} cat={cat} spin={spin} />
      </Canvas>
    </div>
  );
}

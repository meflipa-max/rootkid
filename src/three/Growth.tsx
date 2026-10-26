import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { G, buildIng, mat } from './ingredients';
import { onModels } from './models';
import { useDishThumb } from './thumbs';
import { Grow } from './Pizzeria';
import type { BancoGrowth, BancoId, GoldDish, Growth } from '../lib/growth';

/**
 * Il locale che cresce con la memoria (vedi lib/growth.ts): un angolo per ogni banco del lavoro, con le
 * vaschette dei suoi ingredienti che si riempiono man mano che i piatti diventano "a memoria", e la
 * parete dei piatti d'oro. Comprare migliorie non li fa crescere: solo ricordare.
 */
type V3 = [number, number, number];

function Box({ s, p, c, r, o }: { s: V3; p: V3; c: string; r?: V3; o?: Parameters<typeof mat>[1] }) {
  return <mesh geometry={G.rbox(s[0], s[1], s[2], 0.03)} material={mat(c, o)} position={p} rotation={r} castShadow receiveShadow />;
}

/** dove sta ogni angolo: la pizza lungo la parete di sinistra, gli altri sul lato destro, rivolti verso la sala */
const PLACE: Record<BancoId, { p: V3; ry: number; color: string }> = {
  pizza: { p: [-3.32, 0, 1.8], ry: Math.PI / 2, color: '#b8432f' },
  // girati verso la sala e la camera del diorama, in diagonale per non coprirsi a vicenda
  piastra: { p: [3.15, 0, 0.45], ry: 0.45, color: '#c65a3c' },
  friggitoria: { p: [2.45, 0, 1.75], ry: 0.45, color: '#5b8db8' },
  insalate: { p: [1.5, 0, 2.8], ry: 0.45, color: '#6f9a6a' },
};

/** il centro di ogni angolo e della parete d'oro, per la camera della festa (coordinate del locale) */
/** colore della fascia di ogni banco (anche per la legenda sotto il diorama) */
export const BANCO_COLOR = Object.fromEntries(Object.entries(PLACE).map(([id, v]) => [id, v.color])) as Record<BancoId, string>;

export const GROWTH_SPOTS: Record<string, V3> = {
  ...Object.fromEntries(Object.entries(PLACE).map(([id, v]) => [`banco:${id}`, [v.p[0], 1.1, v.p[2]] as V3])),
  oro: [-3.6, 1.95, 1.9],
};

/** quando arrivano i modelli di Blender gli ingredienti nelle vaschette si rifanno */
function useModelsTick() {
  const [n, setN] = useState(0);
  useEffect(() => onModels(() => setN((x) => x + 1)), []);
  return n;
}

/** la vaschetta d'acciaio con dentro un ingrediente del banco */
function Pan({ name, p }: { name: string; p: V3 }) {
  const tick = useModelsTick();
  const ing = useMemo(() => buildIng(name, true), [name, tick]);
  return (
    <group position={p}>
      <Box s={[0.24, 0.07, 0.24]} p={[0, 0.035, 0]} c="#e9ecef" o={{ r: 0.45, m: 0.15 }} />
      <primitive object={ing.obj} position={[0, 0.06, 0]} scale={0.38} />
    </group>
  );
}

/** il pezzo che dice di che banco si tratta, sul lato destro del piano */
function Feature({ id, tier }: { id: BancoId; tier: number }) {
  if (id === 'pizza')
    return (
      <group>
        <mesh geometry={G.cyl(0.2, 0.025, 18)} material={mat('#c9935a')} position={[0, 0.012, 0]} castShadow />
        {Array.from({ length: tier >= 3 ? 5 : 3 }, (_, i) => (
          <mesh key={i} geometry={G.sphere(0.055, 12)} material={mat('#f3e3c4')} position={[Math.cos(i * 1.3) * 0.11, 0.06, Math.sin(i * 1.3) * 0.11]} scale={[1, 0.7, 1]} castShadow />
        ))}
      </group>
    );
  if (id === 'piastra')
    return (
      <group>
        <Box s={[0.38, 0.05, 0.42]} p={[0, 0.025, 0]} c="#2e2e33" o={{ r: 0.4, m: 0.6 }} />
        {Array.from({ length: tier >= 3 ? 3 : 2 }, (_, i) => (
          <mesh key={i} geometry={G.cyl(0.07, 0.035, 14)} material={mat('#6b3a22')} position={[-0.09 + (i % 2) * 0.18, 0.068, -0.1 + Math.floor(i / 2) * 0.2]} castShadow />
        ))}
      </group>
    );
  if (id === 'friggitoria')
    return (
      <group>
        <Box s={[0.38, 0.14, 0.42]} p={[0, 0.07, 0]} c="#9aa3ad" o={{ r: 0.35, m: 0.5 }} />
        <Box s={[0.3, 0.02, 0.34]} p={[0, 0.142, 0]} c="#d9a43a" o={{ e: 0.15, r: 0.2 }} />
        <group position={[0, 0.2, 0.02]}>
          <Box s={[0.2, 0.1, 0.18]} p={[0, 0, 0]} c="#c9ccd2" o={{ r: 0.3, m: 0.6, op: 0.85 }} />
          {tier >= 3 && Array.from({ length: 6 }, (_, i) => <Box key={i} s={[0.02, 0.1, 0.02]} p={[-0.07 + i * 0.028, 0.07, (i % 2) * 0.03]} c="#f2c14e" r={[0.2 * (i % 2 ? 1 : -1), 0, 0.15]} />)}
        </group>
      </group>
    );
  return (
    <group>
      <mesh geometry={G.cyl(0.19, 0.12, 18, 0.12)} material={mat('#fbf7ef', { r: 0.4 })} position={[0, 0.06, 0]} castShadow />
      {Array.from({ length: tier >= 3 ? 7 : 4 }, (_, i) => (
        <mesh key={i} geometry={G.ball(0.06, 0)} material={mat(i % 3 ? '#7fb35a' : '#5f9a42')} position={[Math.cos(i * 0.9) * 0.1, 0.13, Math.sin(i * 0.9) * 0.1]} scale={[1, 0.6, 1]} castShadow />
      ))}
    </group>
  );
}

/** un angolo del locale: vuoto (sagoma) finché non sai nessun piatto, poi si riempie, completo = oro */
function Station({ b }: { b: BancoGrowth }) {
  const pl = PLACE[b.id];
  const gold = b.tier >= 4;
  const pans = [0, 2, 4, 6, 6][b.tier];
  const ghost = b.tier === 0;
  return (
    <group position={pl.p} rotation={[0, pl.ry, 0]}>
      {/* se il banco è tuo e non sai ancora niente, a terra c'è il posto segnato che lo aspetta */}
      {ghost ? (
        <group position={[0, 0.07, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[1.2, 0.6]} />
            <meshBasicMaterial color={pl.color} transparent opacity={0.18} />
          </mesh>
          {[[0, 0.3, 1.2, 0.04], [0, -0.3, 1.2, 0.04], [0.6, 0, 0.04, 0.6], [-0.6, 0, 0.04, 0.6]].map(([x, z, w, d], i) => (
            <mesh key={i} position={[x, 0.005, z]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[w, d]} />
              <meshBasicMaterial color={pl.color} transparent opacity={0.7} />
            </mesh>
          ))}
        </group>
      ) : (
        <mesh geometry={G.rbox(1.2, 0.86, 0.6, 0.03)} material={mat('#e4e7eb', { r: 0.5, m: 0.15 })} position={[0, 0.43, 0]} castShadow receiveShadow />
      )}
      {!ghost && (
        <Grow k={b.tier} first>
          <group>
            <Box s={[1.26, 0.05, 0.66]} p={[0, 0.885, 0]} c={gold ? '#e3b23c' : '#eef0f3'} o={gold ? { r: 0.3, m: 0.6, e: 0.08 } : { r: 0.35, m: 0.3 }} />
            {/* fascia col colore del banco, d'oro quando è completo */}
            <Box s={[1.21, 0.1, 0.02]} p={[0, 0.74, 0.305]} c={gold ? '#e3b23c' : pl.color} o={gold ? { r: 0.3, m: 0.6 } : {}} />
            {b.ings.slice(0, pans).map((n, i) => (
              <Pan key={n} name={n} p={[-0.42 + (i % 3) * 0.25, 0.91, -0.12 + Math.floor(i / 3) * 0.26]} />
            ))}
            {b.tier >= 2 && (
              <group position={[0.38, 0.91, 0]}>
                <Feature id={b.id} tier={b.tier} />
              </group>
            )}
            {gold && <Sparkle p={[0, 1.45, 0]} />}
          </group>
        </Grow>
      )}
    </group>
  );
}

/** stellina che gira sopra un banco completo */
function Sparkle({ p }: { p: V3 }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.y = clock.elapsedTime * 1.5;
    ref.current.position.y = p[1] + Math.sin(clock.elapsedTime * 2) * 0.04;
  });
  return <mesh ref={ref} geometry={G.ball(0.09, 0)} material={mat('#ffd24a', { e: 1.2, r: 0.3 })} position={p} />;
}

/** una cornice in parete con la foto del piatto d'oro; impolverata quando è da ripassare */
function Frame({ d, p }: { d: GoldDish; p: V3 }) {
  const url = useDishThumb(d.items, d.cat);
  // la foto è trasparente: la appoggiamo su un cartoncino color carta, se no in cornice viene nera
  const tex = useMemo(() => {
    if (!url) return null;
    const c = document.createElement('canvas');
    c.width = c.height = 144;
    const g = c.getContext('2d')!;
    g.fillStyle = '#fbf3e4';
    g.fillRect(0, 0, 144, 144);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    const img = new Image();
    img.onload = () => {
      g.drawImage(img, 0, 0, 144, 144);
      t.needsUpdate = true;
    };
    img.src = url;
    return t;
  }, [url]);
  useEffect(() => () => tex?.dispose(), [tex]);
  return (
    <group position={p}>
      <Box s={[0.46, 0.46, 0.04]} p={[0, 0, 0]} c={d.dusty ? '#9a8f7a' : '#e3b23c'} o={d.dusty ? {} : { r: 0.3, m: 0.6 }} />
      <mesh position={[0, 0, 0.022]}>
        <planeGeometry args={[0.38, 0.38]} />
        <meshStandardMaterial key={tex ? tex.uuid : 'vuoto'} map={tex} color={d.dusty ? '#8d8a84' : '#ffffff'} roughness={0.8} />
      </mesh>
      {/* la polvere: un velo grigio che se ne va con un ripasso */}
      {d.dusty && (
        <mesh position={[0, 0, 0.026]}>
          <planeGeometry args={[0.38, 0.38]} />
          <meshBasicMaterial color="#d8d2c4" transparent opacity={0.35} />
        </mesh>
      )}
    </group>
  );
}

/** la parete dei piatti d'oro, sul muro di sinistra dietro al banco pizze */
function GoldWall({ gold }: { gold: GoldDish[] }) {
  if (!gold.length) return null;
  return (
    <group position={[-3.67, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
      {gold.map((d, i) => {
        const col = i % 5;
        const row = Math.floor(i / 5);
        // ruotando la parete, la z del locale diventa -x qui dentro
        return (
          <Grow key={d.id} k={1} first>
            <Frame d={d} p={[-(0.85 + col * 0.52), 2.5 - row * 0.52, 0]} />
          </Grow>
        );
      })}
    </group>
  );
}

export function GrowthDecor({ growth }: { growth: Growth }): ReactNode {
  return (
    <group>
      {growth.banchi.filter((b) => b.total > 0 && (b.mine || b.tier > 0)).map((b) => <Station key={b.id} b={b} />)}
      <GoldWall gold={growth.gold} />
    </group>
  );
}

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { G, mat } from './ingredients';
import type { Season } from '../lib/rare';

/** I pezzi rari del fornitore e del set, e gli addobbi di stagione (lib/rare.ts). Tutto in codice, niente file. */
type V3 = [number, number, number];

function Box({ s, p, c, r, o }: { s: V3; p: V3; c: string; r?: V3; o?: Parameters<typeof mat>[1] }) {
  return <mesh geometry={G.rbox(s[0], s[1], s[2], 0.03)} material={mat(c, o)} position={p} rotation={r} castShadow receiveShadow />;
}

/** dove sta ogni pezzo (coordinate del locale): servono anche alla camera della festa */
export const RARE_SPOTS: Record<string, V3> = {
  gatto: [1.9, 0.3, -2.3],
  jukebox: [-0.5, 0.8, 2.95],
  vespa: [2.7, 0.6, 4.1],
  acquario: [-2.3, 1.0, 2.95],
  lampadario: [0.3, 2.4, 1.4],
  mandolino: [3.25, 1.75, -2.82],
};

/** il gatto che dorme: respira piano */
function Cat() {
  const body = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (body.current) body.current.scale.y = 1 + Math.sin(clock.elapsedTime * 1.6) * 0.04;
  });
  return (
    <group position={[1.9, 0.06, -2.3]} rotation={[0, 0.6, 0]}>
      <mesh geometry={G.cyl(0.3, 0.02, 20)} material={mat('#b8432f')} position={[0, 0.01, 0]} receiveShadow />
      <group ref={body}>
        <mesh geometry={G.sphere(0.16, 16)} material={mat('#e3a04a')} position={[0, 0.1, 0]} scale={[1.3, 0.7, 0.9]} castShadow />
        <mesh geometry={G.sphere(0.09, 14)} material={mat('#e3a04a')} position={[0.19, 0.12, 0.04]} castShadow />
        {[-1, 1].map((s) => (
          <mesh key={s} geometry={G.cone(0.035, 0.07, 4)} material={mat('#c9802f')} position={[0.21, 0.21, 0.04 + s * 0.045]} />
        ))}
        <mesh geometry={G.torus(0.13, 0.025, Math.PI, 10)} material={mat('#c9802f')} position={[-0.12, 0.05, 0.08]} rotation={[Math.PI / 2, 0, 0.4]} />
      </group>
    </group>
  );
}

function Jukebox() {
  const lights = useRef<THREE.Mesh>(null);
  // materiale suo: la luce pulsa, non va condiviso con gli altri oggetti dello stesso colore
  const glow = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffb35c', emissive: '#ff8a3c', emissiveIntensity: 1 }), []);
  useFrame(({ clock }) => {
    const m = lights.current?.material as THREE.MeshStandardMaterial | undefined;
    if (m) m.emissiveIntensity = 0.8 + Math.sin(clock.elapsedTime * 3) * 0.4;
  });
  return (
    <group position={[-0.5, 0, 2.95]} rotation={[0, 0.25, 0]}>
      <Box s={[0.6, 1.0, 0.4]} p={[0, 0.5, 0]} c="#7a3b2a" />
      <mesh geometry={G.cyl(0.3, 0.4, 20, 0.3, Math.PI)} material={mat('#9a4a32')} position={[0, 1.0, 0]} rotation={[Math.PI / 2, 0, Math.PI / 2]} castShadow />
      <mesh ref={lights} geometry={G.torus(0.25, 0.03, Math.PI, 16)} material={glow} position={[0, 1.0, 0.21]} />
      <Box s={[0.4, 0.3, 0.02]} p={[0, 0.72, 0.2]} c="#fff1c8" o={{ e: 0.4 }} />
      {[-0.12, 0, 0.12].map((x, i) => <Box key={x} s={[0.06, 0.32, 0.02]} p={[x, 0.3, 0.2]} c={['#c65a3c', '#e3a83a', '#6f9a6a'][i]} o={{ e: 0.3 }} />)}
    </group>
  );
}

function Vespa() {
  return (
    <group position={[2.7, 0, 4.1]} rotation={[0, -0.9, 0]}>
      <Box s={[0.9, 0.28, 0.32]} p={[0, 0.34, 0]} c="#8fd0c0" />
      <mesh geometry={G.sphere(0.2, 16)} material={mat('#8fd0c0')} position={[-0.32, 0.42, 0]} scale={[1.2, 0.8, 1]} castShadow />
      <Box s={[0.12, 0.5, 0.26]} p={[0.36, 0.55, 0]} c="#8fd0c0" />
      <Box s={[0.36, 0.08, 0.24]} p={[-0.2, 0.58, 0]} c="#5a341c" />
      <mesh geometry={G.cyl(0.02, 0.5, 6)} material={mat('#c9ccd2', { m: 0.6, r: 0.3 })} position={[0.4, 0.95, 0]} rotation={[Math.PI / 2, 0, 0]} />
      <mesh geometry={G.sphere(0.06, 10)} material={mat('#fff1c8', { e: 1 })} position={[0.45, 0.85, 0]} />
      {[-0.35, 0.38].map((x) => (
        <mesh key={x} geometry={G.torus(0.13, 0.05, Math.PI * 2, 14)} material={mat('#2b211c')} position={[x, 0.15, 0]} castShadow />
      ))}
    </group>
  );
}

function Aquarium() {
  const fish = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const g = fish.current;
    if (!g) return;
    const t = clock.elapsedTime * 0.8;
    g.position.x = Math.sin(t) * 0.22;
    g.rotation.y = Math.cos(t) > 0 ? 0 : Math.PI;
  });
  return (
    <group position={[-2.3, 0, 2.95]}>
      <Box s={[0.75, 0.75, 0.4]} p={[0, 0.375, 0]} c="#8a5a34" />
      <mesh position={[0, 1.0, 0]}>
        <boxGeometry args={[0.7, 0.5, 0.35]} />
        <meshStandardMaterial color="#8fd6ff" transparent opacity={0.35} roughness={0.1} />
      </mesh>
      <Box s={[0.66, 0.06, 0.31]} p={[0, 0.78, 0]} c="#e8d6b8" />
      <group ref={fish} position={[0, 1.0, 0]}>
        <mesh geometry={G.sphere(0.05, 10)} material={mat('#ff7a2f', { e: 0.2 })} scale={[1.4, 1, 0.6]} />
        <mesh geometry={G.cone(0.035, 0.06, 4)} material={mat('#ff7a2f')} position={[-0.08, 0, 0]} rotation={[0, 0, Math.PI / 2]} />
      </group>
      {[[-0.2, 0.84], [0.18, 0.9]].map(([x, y]) => <mesh key={x} geometry={G.cone(0.04, 0.2, 5)} material={mat('#4f9a3c')} position={[x, y, 0]} />)}
    </group>
  );
}

function Chandelier({ night }: { night: number }) {
  return (
    <group position={[0.3, 0, 1.4]}>
      <mesh geometry={G.cyl(0.008, 0.6, 4)} material={mat('#2b211c')} position={[0, 2.95, 0]} />
      <mesh geometry={G.torus(0.45, 0.03, Math.PI * 2, 24)} material={mat('#e3b23c', { m: 0.6, r: 0.3 })} position={[0, 2.62, 0]} rotation={[Math.PI / 2, 0, 0]} />
      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={i} geometry={G.sphere(0.05, 10)} material={mat('#fff1c8', { e: 1.4 + night * 2 })} position={[Math.cos(i) * 0.45, 2.68, Math.sin(i) * 0.45]} />
      ))}
      <pointLight color="#ffd9a0" intensity={0.5 + night * 1.5} distance={4} decay={1.6} position={[0, 2.5, 0]} />
    </group>
  );
}

function Mandolin() {
  return (
    <group position={[3.25, 1.75, -2.86]} rotation={[0, 0, 0.35]}>
      <mesh geometry={G.sphere(0.17, 16)} material={mat('#a8703f')} position={[0, -0.12, 0.06]} scale={[1, 1.2, 0.45]} castShadow />
      <mesh geometry={G.cyl(0.04, 0.012, 12)} material={mat('#2b211c')} position={[0, -0.08, 0.14]} rotation={[Math.PI / 2, 0, 0]} />
      <Box s={[0.06, 0.4, 0.03]} p={[0, 0.2, 0.08]} c="#5a341c" />
      <Box s={[0.09, 0.1, 0.04]} p={[0, 0.43, 0.08]} c="#5a341c" />
    </group>
  );
}

const PIECES: Record<string, (p: { night: number }) => JSX.Element> = {
  gatto: () => <Cat />,
  jukebox: () => <Jukebox />,
  vespa: () => <Vespa />,
  acquario: () => <Aquarium />,
  lampadario: ({ night }) => <Chandelier night={night} />,
  mandolino: () => <Mandolin />,
};

export function RareDecor({ rare, night }: { rare: string[]; night: number }) {
  return (
    <group>
      {rare.map((id) => {
        const P = PIECES[id];
        return P ? <P key={id} night={night} /> : null;
      })}
    </group>
  );
}

function Pumpkin({ p, s = 1 }: { p: V3; s?: number }) {
  return (
    <group position={p} scale={s}>
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={i} geometry={G.sphere(0.12, 12)} material={mat(i % 2 ? '#e8742a' : '#f08a3a')} position={[Math.cos(i * 1.256) * 0.06, 0.11, Math.sin(i * 1.256) * 0.06]} scale={[0.9, 0.85, 0.9]} castShadow />
      ))}
      <mesh geometry={G.cyl(0.02, 0.07, 6)} material={mat('#4a6a2a')} position={[0, 0.24, 0]} />
      {/* faccia illuminata da dentro */}
      <mesh geometry={G.cone(0.03, 0.04, 3)} material={mat('#ffd24a', { e: 2 })} position={[-0.05, 0.14, 0.15]} rotation={[Math.PI / 2, 0, 0]} />
      <mesh geometry={G.cone(0.03, 0.04, 3)} material={mat('#ffd24a', { e: 2 })} position={[0.05, 0.14, 0.15]} rotation={[Math.PI / 2, 0, 0]} />
      <Box s={[0.1, 0.025, 0.02]} p={[0, 0.08, 0.16]} c="#ffd24a" o={{ e: 2 }} />
    </group>
  );
}

function Tree() {
  const balls = ['#c8463b', '#e3b23c', '#5b8db8', '#fbf7ef'];
  return (
    <group position={[0.95, 0, -2.45]}>
      <Box s={[0.26, 0.2, 0.26]} p={[0, 0.1, 0]} c="#8a5a34" />
      {[0, 1, 2].map((i) => (
        <mesh key={i} geometry={G.cone(0.5 - i * 0.13, 0.55, 10)} material={mat(i % 2 ? '#3f7a45' : '#346b3b')} position={[0, 0.45 + i * 0.36, 0]} castShadow />
      ))}
      {Array.from({ length: 10 }, (_, i) => {
        const y = 0.35 + (i / 10) * 0.95;
        const r = 0.42 - (i / 10) * 0.3;
        return <mesh key={i} geometry={G.sphere(0.04, 8)} material={mat(balls[i % 4], { e: 0.4 })} position={[Math.cos(i * 2.4) * r, y, Math.sin(i * 2.4) * r]} />;
      })}
      <mesh geometry={G.ball(0.08, 0)} material={mat('#ffd24a', { e: 2 })} position={[0, 1.55, 0]} />
    </group>
  );
}

export function SeasonDecor({ season }: { season: Season }) {
  if (season === 'halloween')
    return (
      <group>
        <Pumpkin p={[0.95, 0.05, -2.55]} s={1.4} />
        <Pumpkin p={[-1.05, 0.92, 0.95]} s={0.8} />
        <Pumpkin p={[-3.35, 0.05, 0.15]} />
      </group>
    );
  if (season === 'natale') return <Tree />;
  return null;
}

/** colori delle luci a festone secondo la stagione */
export const seasonBulbs = (season: Season) =>
  season === 'halloween' ? ['#ff8a3c', '#a46bff', '#ffb35c', '#7cff8a', '#ff8a3c'] : season === 'natale' ? ['#ff4d4d', '#5fd36b', '#ffd24a', '#fbf7ef', '#ff4d4d'] : null;

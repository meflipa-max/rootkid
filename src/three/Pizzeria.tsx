import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { G, buildIng, mat } from './ingredients';
import { lvlOf } from '../lib/build';
import { Person3D } from './Person3D';
import { World } from './World';
import { Kit } from './Kit';
import type { Look } from '../components/Person';

/** Il locale in miniatura: stanza, esterno al tramonto e tutte le migliorie come oggetti veri. */

type V3 = [number, number, number];

function Box({ s, p, c, r, o }: { s: V3; p: V3; c: string; r?: V3; o?: Parameters<typeof mat>[1] }) {
  return <mesh geometry={G.rbox(s[0], s[1], s[2], 0.035)} material={mat(c, o)} position={p} rotation={r} castShadow receiveShadow />;
}

const lerpC = (a: string, b: string, t: number) => new THREE.Color(a).lerp(new THREE.Color(b), t);

/** tavolini con l'ombrellone sul prato dietro il locale (miglioria "tavolini") */
function Dehors({ tables }: { tables: number }) {
  return (
    <group>
      {Array.from({ length: tables }, (_, i) => {
        const x = [-1.9, -0.4, 0.9][i];
        const col = ['#c65a3c', '#6f9a6a', '#e3a83a'][i];
        return (
          <Grow key={i} k={1} first>
            <group position={[x, 0, -4.6]}>
              <mesh geometry={G.cyl(0.32, 0.05, 20)} material={mat('#fbf7ef')} position={[0, 0.62, 0]} castShadow />
              <mesh geometry={G.cyl(0.04, 0.62, 8)} material={mat('#2b211c')} position={[0, 0.31, 0]} />
              <mesh geometry={G.cyl(0.03, 1.5, 8)} material={mat('#8a6a4a')} position={[0, 1.2, 0]} />
              <mesh geometry={G.cone(0.78, 0.35, 12)} material={mat(col)} position={[0, 1.95, 0]} castShadow />
              {[-1, 1].map((s) => (
                <Kit
                  key={s}
                  file="chairCushion"
                  tall={0.78}
                  position={[s * 0.62, 0, 0]}
                  rotation={[0, -s * Math.PI * 0.5, 0]}
                  spare={<Box s={[0.26, 0.34, 0.26]} p={[s * 0.5, 0.17, 0]} c="#8a6a4a" />}
                />
              ))}
            </group>
          </Grow>
        );
      })}
    </group>
  );
}

/** arredo sempre presente: rende il locale vissuto (lampade, ciotole, tagliere, basilico, cartoni) */
function Props({ night }: { night: number }) {
  const bowls = useMemo(() => ['pomodorini', 'mozzarella', 'rucola'].map((n) => buildIng(n, true).obj), []);
  return (
    <group>
      {/* lampade a sospensione sopra il bancone */}
      {[-1.7, 0, 1.7].map((x) => (
        <group key={x} position={[x, 0, -0.6]}>
          <mesh geometry={G.cyl(0.008, 0.6, 4)} material={mat('#2b211c')} position={[0, 2.75, 0]} />
          <mesh geometry={G.cone(0.2, 0.18, 20)} material={mat('#3f6b52', { r: 0.5 })} position={[0, 2.38, 0]} castShadow />
          <mesh geometry={G.sphere(0.07, 12)} material={mat('#fff1c8', { e: 1.5 + night * 2.5 })} position={[0, 2.27, 0]} />
        </group>
      ))}
      {/* piastrelle dietro il bancone */}
      <mesh position={[-1.0, 0.46, -2.84]}>
        <planeGeometry args={[3.2, 0.9]} />
        <meshStandardMaterial map={tileTexture()} roughness={0.5} />
      </mesh>
      {/* bancone: portatovaglioli, basilico, cartoni della pizza */}
      <group position={[-1.2, 0.77, -0.55]}>
        <Box s={[0.18, 0.14, 0.08]} p={[0, 0.07, 0]} c="#c9ccd2" o={{ r: 0.3, m: 0.6 }} />
        <Box s={[0.15, 0.1, 0.04]} p={[0, 0.12, 0]} c="#ffffff" />
      </group>
      <group position={[0.45, 0.77, -0.5]}>
        <mesh geometry={G.cyl(0.11, 0.16, 14, 0.08)} material={mat('#c65a3c')} position={[0, 0.08, 0]} castShadow />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <mesh key={i} geometry={G.sphere(0.07, 10)} material={mat(i % 2 ? '#4f9a3c' : '#5fb04a')} position={[Math.cos(i) * 0.06, 0.2 + (i % 3) * 0.04, Math.sin(i) * 0.06]} scale={[1, 0.7, 1]} castShadow />
        ))}
      </group>
      <group position={[2.1, 0.77, -0.55]} rotation={[0, 0.2, 0]}>
        {[0, 1, 2, 3].map((i) => <Box key={i} s={[0.5, 0.06, 0.5]} p={[0, 0.03 + i * 0.065, 0]} r={[0, i * 0.06, 0]} c={i % 2 ? '#e8d6b8' : '#dcc7a4'} />)}
        <mesh geometry={G.cyl(0.07, 0.002, 12)} material={mat('#c65a3c')} position={[0, 0.262, 0]} />
      </group>
      {/* banco di preparazione: tagliere, ciotole di ingredienti, pala */}
      <Box s={[0.9, 0.04, 0.6]} p={[0.55, 0.9, 0.75]} c="#c9935a" />
      {bowls.map((b, i) => (
        <group key={i} position={[-0.75 + i * 0.4, 0.92, 0.6 + (i % 2) * 0.12]}>
          <mesh geometry={G.cyl(0.16, 0.09, 16, 0.11)} material={mat('#fbf7ef', { r: 0.4 })} position={[0, 0.045, 0]} castShadow />
          <primitive object={b} position={[0, 0.06, 0]} scale={0.5} />
        </group>
      ))}
      <group position={[1.95, 0.92, 0.55]} rotation={[0, -0.4, 0]}>
        <mesh geometry={G.cyl(0.24, 0.02, 20)} material={mat('#c9935a')} position={[0, 0.01, 0]} />
        <Box s={[0.08, 0.025, 0.7]} p={[0, 0.012, 0.5]} c="#a8703f" />
      </group>
    </group>
  );
}

let tileTex: THREE.CanvasTexture | null = null;
function tileTexture() {
  if (tileTex) return tileTex;
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 64;
  const g = c.getContext('2d')!;
  g.fillStyle = '#d9cdb6';
  g.fillRect(0, 0, 128, 64);
  for (let y = 0; y < 4; y++)
    for (let x = -1; x < 5; x++) {
      g.fillStyle = (x + y) % 3 ? '#8fae84' : '#9cba90';
      g.fillRect(x * 32 + (y % 2) * 16 + 1.5, y * 16 + 1.5, 29, 13);
    }
  tileTex = new THREE.CanvasTexture(c);
  tileTex.wrapS = tileTex.wrapT = THREE.RepeatWrapping;
  tileTex.repeat.set(5, 3);
  tileTex.colorSpace = THREE.SRGBColorSpace;
  return tileTex;
}

let floorTex: THREE.CanvasTexture | null = null;
function floorTexture() {
  if (floorTex) return floorTex;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  g.fillStyle = '#e8c9a2';
  g.fillRect(0, 0, 64, 64);
  g.fillStyle = '#d4875c';
  g.fillRect(0, 0, 32, 32);
  g.fillRect(32, 32, 32, 32);
  g.strokeStyle = '#00000018';
  g.lineWidth = 2;
  g.strokeRect(0, 0, 32, 32);
  g.strokeRect(32, 32, 32, 32);
  floorTex = new THREE.CanvasTexture(c);
  floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
  floorTex.repeat.set(7, 6);
  floorTex.colorSpace = THREE.SRGBColorSpace;
  return floorTex;
}

function signTexture(lit: boolean) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 96;
  const g = c.getContext('2d')!;
  g.fillStyle = lit ? '#2b1a24' : '#7a4a2a';
  g.fillRect(0, 0, 512, 96);
  g.font = '700 58px Fredoka, Nunito, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  if (lit) {
    g.shadowColor = '#ff6f8f';
    g.shadowBlur = 18;
    g.fillStyle = '#ffd6e0';
  } else g.fillStyle = '#f6e6c8';
  g.fillText('CORE A CORE', 256, 52);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function Sign({ lvl }: { lvl: number }) {
  const [fonts, setFonts] = useState(0);
  useEffect(() => {
    void document.fonts?.ready.then(() => setFonts(1));
  }, []);
  const tex = useMemo(() => signTexture(lvl > 0), [lvl, fonts]);
  return (
    <group position={[-1.0, 2.72, -2.86]}>
      <Box s={[2.5, 0.52, 0.06]} p={[0, 0, -0.02]} c={lvl > 0 ? '#2b1a24' : '#5a341c'} />
      <mesh position={[0, 0, 0.015]}>
        <planeGeometry args={[2.36, 0.44]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
      {lvl >= 3 && [-1.25, 1.25].map((x) => <mesh key={x} geometry={G.ball(0.05, 0)} material={mat('#ff8fb0', { e: 1.4 })} position={[x, 0.26, 0.04]} />)}
      {lvl > 0 && <pointLight color="#ff6f9a" intensity={0.6 + lvl * 0.35} distance={3} position={[0, -0.3, 0.6]} />}
    </group>
  );
}

function Oven({ lvl }: { lvl: number }) {
  const fire = useRef<THREE.Group>(null);
  const light = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const f = 0.85 + Math.sin(t * 13) * 0.08 + Math.sin(t * 7.3) * 0.07;
    if (fire.current) fire.current.scale.set(1, f * (0.8 + lvl * 0.1), 1);
    if (light.current) light.current.intensity = (1.2 + lvl * 0.5) * f;
  });
  return (
    <group position={[-2.75, 0, -2.2]} rotation={[0, Math.PI / 4, 0]}>
      <Box s={[1.4, 0.7, 1.3]} p={[0, 0.35, 0]} c="#8e3a27" />
      <Box s={[1.5, 0.08, 1.4]} p={[0, 0.72, 0]} c="#d9c4a8" />
      <mesh geometry={G.dome(0.66)} material={mat('#c4603f')} position={[0, 0.76, -0.05]} castShadow />
      {lvl >= 3 && <mesh geometry={G.torus(0.66, 0.05, Math.PI * 2, 16)} material={mat('#e3a83a')} position={[0, 0.78, -0.05]} rotation={[Math.PI / 2, 0, 0]} />}
      <mesh geometry={G.cyl(0.1, 0.5, 8)} material={mat('#8e3a27')} position={[0.25, 1.55, -0.3]} />
      <mesh geometry={G.cyl(0.3, 0.42, 10, 0.3, Math.PI)} material={mat('#1c0b06')} position={[0, 0.98, 0.5]} rotation={[Math.PI / 2, 0, 0]} />
      <mesh geometry={G.torus(0.32, 0.05, Math.PI, 10)} material={mat('#8e3a27')} position={[0, 0.78, 0.62]} />
      <group ref={fire} position={[0, 0.78, 0.45]}>
        <mesh geometry={G.cone(0.13, 0.32, 5)} material={mat('#ffb238', { e: 1.6 })} position={[-0.08, 0.16, 0]} />
        <mesh geometry={G.cone(0.1, 0.24, 5)} material={mat('#ff6a1f', { e: 1.6 })} position={[0.1, 0.12, 0.02]} />
        <mesh geometry={G.cone(0.07, 0.18, 5)} material={mat('#fff0a0', { e: 2 })} position={[0, 0.09, 0.06]} />
      </group>
      <pointLight ref={light} color="#ff8a3c" distance={4.5} decay={1.6} position={[0, 1.0, 0.9]} />
    </group>
  );
}

function Clock() {
  const hand = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (hand.current) hand.current.rotation.z = -clock.elapsedTime * 1.2;
  });
  return (
    <group position={[2.15, 2.64, -2.86]}>
      <mesh geometry={G.cyl(0.24, 0.06, 16)} material={mat('#2b211c')} rotation={[Math.PI / 2, 0, 0]} />
      <mesh geometry={G.cyl(0.2, 0.07, 16)} material={mat('#fbf7ef')} rotation={[Math.PI / 2, 0, 0]} />
      <mesh ref={hand} position={[0, 0, 0.045]}>
        <boxGeometry args={[0.02, 0.32, 0.01]} />
        <meshStandardMaterial color="#c65a3c" />
      </mesh>
      <Box s={[0.11, 0.025, 0.01]} p={[0.04, 0, 0.045]} c="#2b211c" />
    </group>
  );
}

function Plant({ p, s = 1 }: { p: V3; s?: number }) {
  return (
    <group position={p} scale={s}>
      <Kit
        file="pottedPlant"
        tall={1.12}
        spare={
          <>
            <mesh geometry={G.cyl(0.22, 0.36, 8, 0.17)} material={mat('#c65a3c')} position={[0, 0.18, 0]} castShadow />
            {[0, 1, 2, 3, 4].map((i) => (
              <mesh key={i} geometry={G.ball(0.2 - i * 0.02, 0)} material={mat(i % 2 ? '#5f9a52' : '#4a8541')} position={[Math.cos(i * 1.3) * 0.12, 0.5 + i * 0.12, Math.sin(i * 1.3) * 0.12]} castShadow />
            ))}
          </>
        }
      />
    </group>
  );
}

function Bulbs({ n, night }: { n: number; night: number }) {
  const cols = ['#ffd24a', '#ff8fb0', '#8fd6ff', '#a6f0b4', '#ffb35c'];
  return (
    <group>
      {Array.from({ length: n }, (_, i) => {
        const t = i / (n - 1);
        const x = -3.5 + t * 7;
        const y = 2.9 - Math.sin(t * Math.PI * 3) ** 2 * 0.28;
        return <mesh key={i} geometry={G.ball(0.05, 0)} material={mat(cols[i % 5], { e: 0.6 + night * 1.6 })} position={[x, y, -2.2 + Math.sin(t * 9) * 0.05]} />;
      })}
    </group>
  );
}

/** cresce con un rimbalzo quando `k` cambia (nuovo livello di una miglioria) */
export function Grow({ k, first, children }: { k: number; first?: boolean; children: ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  const st = useRef({ k: first ? -1 : k, s: first ? 0 : 1, v: 0 });
  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    const S = st.current;
    if (S.k !== k) {
      S.k = k;
      S.s = Math.min(S.s, 0.2);
    }
    const d = Math.min(dt, 0.05);
    S.v += (1 - S.s) * 220 * d;
    S.v *= Math.pow(0.0008, d);
    S.s += S.v * d;
    g.scale.setScalar(Math.max(0.001, S.s));
  });
  return <group ref={ref}>{children}</group>;
}

function Pick({ id, onPick, children }: { id: string; onPick?: (id: string) => void; children: ReactNode }) {
  if (!onPick) return <>{children}</>;
  return (
    <group
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        onPick(id);
      }}
      onPointerOver={() => (document.body.style.cursor = 'pointer')}
      onPointerOut={() => (document.body.style.cursor = '')}
    >
      {children}
    </group>
  );
}

const GARZONE: Look = { skin: '#d8a070', hair: '#2b1b12', style: 3, shirt: '#6f9a6a', extra: 0 };

export function Pizzeria({ build, night, cutaway, onPick }: { build: Record<string, number>; night: number; cutaway?: boolean; onPick?: (id: string) => void }) {
  const l = (id: string) => lvlOf(build, id);
  const W = '#f1e4cf';
  const SAGE = '#8fae84';
  return (
    <group>
      <World night={night} tables={l('tavolini')} />
      <Dehors tables={l('tavolini')} />
      <Props night={night} />
      <Pick id="tavolini" onPick={onPick}>
        <mesh position={[-1.0, 0.5, -4.4]} visible={false}>
          <boxGeometry args={[4, 1, 1]} />
        </mesh>
      </Pick>

      {/* pavimento */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0.1]} receiveShadow>
        <planeGeometry args={[7.4, 6.4]} />
        <meshStandardMaterial map={floorTexture()} roughness={0.95} />
      </mesh>
      <Box s={[7.7, 0.12, 6.7]} p={[0, -0.03, 0.1]} c="#8a5a34" />

      {/* parete di fondo con finestra e porta */}
      <Box s={[1.1, 3, 0.2]} p={[-3.15, 1.5, -3]} c={W} />
      <Box s={[3.2, 1.0, 0.2]} p={[-1.0, 0.5, -3]} c={W} />
      <Box s={[3.2, 0.6, 0.2]} p={[-1.0, 2.7, -3]} c={W} />
      <Box s={[0.9, 3, 0.2]} p={[1.05, 1.5, -3]} c={W} />
      <Box s={[1.3, 0.7, 0.2]} p={[2.15, 2.65, -3]} c={W} />
      <Box s={[0.9, 3, 0.2]} p={[3.25, 1.5, -3]} c={W} />
      {[[-3.15, 1.1], [-1.0, 3.2], [1.05, 0.9], [3.25, 0.9]].map(([x, w]) => <Box key={x} s={[w, 0.9, 0.06]} p={[x, 0.45, -2.88]} c={SAGE} />)}
      <Box s={[7.4, 0.06, 0.1]} p={[0, 0.92, -2.86]} c="#6f8f66" />
      {/* infissi */}
      <Box s={[3.4, 0.1, 0.36]} p={[-1.0, 1.0, -2.92]} c="#8a5a34" />
      <Box s={[3.3, 0.08, 0.24]} p={[-1.0, 2.4, -3]} c="#8a5a34" />
      {[-2.6, 0.6, -1.0].map((x) => <Box key={x} s={[x === -1.0 ? 0.05 : 0.08, 1.4, x === -1.0 ? 0.06 : 0.24]} p={[x, 1.7, -3]} c="#8a5a34" />)}
      <Box s={[3.2, 0.05, 0.06]} p={[-1.0, 1.72, -3]} c="#8a5a34" />
      {[1.5, 2.8].map((x) => <Box key={x} s={[0.1, 2.3, 0.26]} p={[x, 1.15, -3]} c="#8a5a34" />)}
      <Box s={[1.4, 0.1, 0.26]} p={[2.15, 2.3, -3]} c="#8a5a34" />

      {/* parete sinistra (e destra solo dentro il turno) */}
      <Box s={[0.2, 3, 6.4]} p={[-3.8, 1.5, 0.1]} c="#ead9bf" />
      <Box s={[0.06, 0.9, 6.4]} p={[-3.68, 0.45, 0.1]} c={SAGE} />
      {!cutaway && <Box s={[0.2, 3, 6.4]} p={[3.8, 1.5, 0.1]} c="#ead9bf" />}
      {!cutaway && <Box s={[0.06, 0.9, 6.4]} p={[3.68, 0.45, 0.1]} c={SAGE} />}

      {/* bancone del servizio */}
      <Box s={[5.4, 0.7, 0.5]} p={[-0.4, 0.35, -0.6]} c="#a8703f" />
      {[-2.6, -1.3, 0, 1.3].map((x) => <Box key={x} s={[0.06, 0.55, 0.02]} p={[x + 0.25, 0.35, -0.34]} c="#8a5a34" />)}
      <Box s={[5.6, 0.07, 0.66]} p={[-0.4, 0.735, -0.6]} c="#efe8dc" />
      {/* banco di preparazione */}
      <Box s={[3.4, 0.84, 0.8]} p={[0.5, 0.42, 0.75]} c="#7c9a6e" />
      <Box s={[3.5, 0.08, 0.9]} p={[0.5, 0.88, 0.75]} c="#f4efe6" />

      <Pick id="forno" onPick={onPick}>
        <Grow k={l('forno')}>
          <Oven lvl={l('forno')} />
        </Grow>
      </Pick>
      <Pick id="insegna" onPick={onPick}>
        <Sign lvl={l('insegna')} />
      </Pick>
      <Pick id="cassa" onPick={onPick}>
        <Grow k={l('cassa')}>
          <group position={[-2.55, 0.77, -0.6]}>
            <Box s={[0.5, 0.22, 0.4]} p={[0, 0.11, 0]} c={l('cassa') >= 3 ? '#e3a83a' : '#5b8db8'} />
            <Box s={[0.36, 0.2, 0.05]} p={[0, 0.3, -0.1]} c="#2b211c" r={[-0.3, 0, 0]} />
            <Box s={[0.3, 0.13, 0.02]} p={[0, 0.31, -0.07]} c="#a6f0b4" r={[-0.3, 0, 0]} o={{ e: 0.5 }} />
            {l('cassa') > 0 && <Box s={[0.4, 0.06, 0.3]} p={[0, 0.25, 0.08]} c="#fbf7ef" />}
          </group>
        </Grow>
      </Pick>
      {l('campanello') > 0 && (
        <Pick id="campanello" onPick={onPick}>
          <Grow k={l('campanello')} first>
            <group position={[1.15, 0.77, -0.55]}>
              <mesh geometry={G.cyl(0.13, 0.03, 12)} material={mat('#2b211c')} position={[0, 0.015, 0]} />
              <mesh geometry={G.dome(0.1)} material={mat('#e3a83a', { r: 0.3 })} position={[0, 0.03, 0]} />
              <mesh geometry={G.ball(0.025, 0)} material={mat('#e3a83a', { r: 0.3 })} position={[0, 0.14, 0]} />
            </group>
          </Grow>
        </Pick>
      )}
      {l('frigo') > 0 && (
        <Pick id="frigo" onPick={onPick}>
          <Grow k={l('frigo')} first>
            <group position={[cutaway ? 3.2 : 3.3, 0, -1.6]} rotation={[0, -Math.PI / 2, 0]}>
              <Kit
                file={l('frigo') > 1 ? 'kitchenFridgeLarge' : 'kitchenFridge'}
                tall={1.8}
                tint="#bfdccf"
                spare={
                  <>
                    <Box s={[l('frigo') > 1 ? 1.2 : 0.75, 1.8, 0.7]} p={[0, 0.9, 0]} c="#bfdccf" />
                    <Box s={[0.04, 0.5, 0.06]} p={[0.25, 1.2, 0.37]} c="#8a939c" />
                    {l('frigo') > 1 && <Box s={[0.02, 1.7, 0.02]} p={[0, 0.9, 0.36]} c="#8aa79a" />}
                  </>
                }
              />
            </group>
          </Grow>
        </Pick>
      )}
      {l('mise') > 0 && (
        <Pick id="mise" onPick={onPick}>
          <Grow k={l('mise')} first>
            <group position={[-3.62, 1.55, -0.3]}>
              <Box s={[0.3, 0.06, 2.2]} p={[0, 0, 0]} c="#8a5a34" />
              {Array.from({ length: 2 + l('mise') * 2 }, (_, i) => (
                <group key={i} position={[0, 0.03, -0.95 + i * 0.27]}>
                  <mesh geometry={G.cyl(0.08, 0.2, 8)} material={mat(['#c65a3c', '#e3a83a', '#6f9a6a', '#fbf7ef', '#9a6fb0'][i % 5])} position={[0, 0.1, 0]} castShadow />
                  <mesh geometry={G.cyl(0.085, 0.04, 8)} material={mat('#7a4a24')} position={[0, 0.22, 0]} />
                </group>
              ))}
            </group>
          </Grow>
        </Pick>
      )}
      {l('cronometro') > 0 && (
        <Pick id="cronometro" onPick={onPick}>
          <Grow k={l('cronometro')} first>
            <Clock />
          </Grow>
        </Pick>
      )}
      {l('garzone') > 0 && (
        <Pick id="garzone" onPick={onPick}>
          <group position={[-1.75, 0, -2.25]} rotation={[0, 0.5, 0]} scale={0.85}>
            <Person3D look={GARZONE} pose={l('garzone') > 1 ? 'work' : 'idle'} mood="happy" seed={3} />
          </group>
        </Pick>
      )}
      {l('piante') > 0 && (
        <Pick id="piante" onPick={onPick}>
          <Plant p={[-3.3, 0, 0.9]} />
          {l('piante') > 1 && <Plant p={[3.25, 0, -2.6]} />}
          {l('piante') > 2 && <Plant p={[-3.3, 0, 2.7]} s={0.8} />}
        </Pick>
      )}
      {l('quadri') > 0 && (
        <Pick id="quadri" onPick={onPick}>
          <group position={[1.05, 1.85, -2.87]}>
            <Box s={[0.62, 0.78, 0.05]} p={[0, 0, 0]} c="#8a5a34" />
            <Box s={[0.5, 0.66, 0.02]} p={[0, 0, 0.03]} c="#5b8db8" />
            <mesh geometry={G.ball(0.12, 0)} material={mat('#f0d59c')} position={[0.08, 0.12, 0.05]} scale={[1, 1, 0.2]} />
            <Box s={[0.5, 0.2, 0.02]} p={[0, -0.23, 0.04]} c="#6f9a6a" />
          </group>
          {l('quadri') > 1 && [-1.8, 0.0].slice(0, l('quadri') - 1).map((z, i) => (
            <group key={z} position={[-3.67, 1.9, z]} rotation={[0, Math.PI / 2, 0]}>
              <Box s={[0.7, 0.55, 0.05]} p={[0, 0, 0]} c="#2b211c" />
              <Box s={[0.6, 0.45, 0.02]} p={[0, 0, 0.03]} c={['#c65a3c', '#e3a83a'][i]} />
              <Box s={[0.6, 0.12, 0.02]} p={[0, -0.12, 0.04]} c="#fbf7ef" />
            </group>
          ))}
        </Pick>
      )}
      {l('luci') > 0 && (
        <Pick id="luci" onPick={onPick}>
          <Bulbs n={8 + l('luci') * 4} night={night} />
        </Pick>
      )}
    </group>
  );
}

export function Lights({ night, shadow = 2048 }: { night: number; shadow?: number }) {
  return (
    <>
      <hemisphereLight args={[lerpC('#bcd8ff', '#4a4a8a', night), lerpC('#9a6a44', '#2a1e30', night), 0.42 - night * 0.2]} />
      <directionalLight
        color={lerpC('#ffe3b8', '#9c8cff', night)}
        intensity={3.1 - night * 2.1}
        position={[-6, 9, 5]}
        castShadow
        shadow-mapSize={[shadow, shadow]}
        shadow-camera-left={-9}
        shadow-camera-right={9}
        shadow-camera-top={9}
        shadow-camera-bottom={-9}
        shadow-camera-far={40}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-radius={4}
      />
      <pointLight color="#ffd9a0" intensity={0.6 + night * 2.2} distance={8} decay={1.6} position={[0, 2.7, 0.3]} />
    </>
  );
}

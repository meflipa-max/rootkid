import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { G, mat } from './ingredients';
import { lvlOf } from '../lib/build';
import { Person3D } from './Person3D';
import type { Look } from '../components/Person';

/** Il locale in miniatura: stanza, esterno al tramonto e tutte le migliorie come oggetti veri. */

type V3 = [number, number, number];

function Box({ s, p, c, r, o }: { s: V3; p: V3; c: string; r?: V3; o?: Parameters<typeof mat>[1] }) {
  return <mesh geometry={G.box(...s)} material={mat(c, o)} position={p} rotation={r} castShadow receiveShadow />;
}

const lerpC = (a: string, b: string, t: number) => new THREE.Color(a).lerp(new THREE.Color(b), t);

function Sky({ night }: { night: number }) {
  const ref = useRef<THREE.PlaneGeometry>(null);
  useEffect(() => {
    const g = ref.current;
    if (!g) return;
    const top = lerpC('#8a6bb0', '#141238', night);
    const mid = lerpC('#f2a07a', '#3a2a5e', night);
    const bot = lerpC('#ffd9a0', '#5a3f6e', night);
    const pos = g.attributes.position;
    const cols = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      const y = (pos.getY(i) + 7) / 14;
      const c = y > 0.5 ? mid.clone().lerp(top, (y - 0.5) * 2) : bot.clone().lerp(mid, y * 2);
      c.toArray(cols, i * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  }, [night]);
  return (
    <mesh position={[0, 4, -12]}>
      <planeGeometry ref={ref} args={[40, 14, 1, 8]} />
      <meshBasicMaterial vertexColors toneMapped={false} />
    </mesh>
  );
}

function Outside({ night, tables, bare }: { night: number; tables: number; bare?: boolean }) {
  const houses: [number, number, number, string, number][] = [
    [-4.6, -6.5, 2.6, '#e9b8a8', 2.2], [-2.2, -7.2, 3.4, '#bcd9c9', 2.0], [0.4, -6.6, 2.4, '#f0d59c', 2.4], [2.8, -7.4, 3.8, '#c9b8e0', 2.2], [5.2, -6.6, 2.8, '#e9c4a0', 2.0],
  ];
  return (
    <group>
      {!bare && <Sky night={night} />}
      {!bare && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, -8]} receiveShadow>
          <planeGeometry args={[30, 10]} />
          <meshStandardMaterial color="#9a8576" roughness={1} />
        </mesh>
      )}
      <Box s={bare ? [7.6, 0.3, 2.2] : [30, 0.08, 1.2]} p={bare ? [0, -0.16, -4.3] : [0, 0.04, -3.8]} c="#cbb8a2" />
      {!bare && houses.map(([x, z, h, c, w], i) => (
        <group key={i} position={[x, 0, z]}>
          <Box s={[w, h, 1.6]} p={[0, h / 2, 0]} c={c} />
          <mesh geometry={G.cone(w * 0.78, 0.9, 4)} material={mat('#b5523a')} position={[0, h + 0.45, 0]} rotation={[0, Math.PI / 4, 0]} scale={[1, 1, 0.75]} />
          {[-0.45, 0.45].map((wx) =>
            [0.9, 1.9].filter((wy) => wy < h - 0.3).map((wy) => (
              <Box key={`${wx}${wy}`} s={[0.34, 0.46, 0.04]} p={[wx * (w / 2), wy, 0.81]} c={night > 0.35 ? '#ffd36b' : '#6a5a7a'} o={night > 0.35 ? { e: 0.9 } : undefined} />
            )),
          )}
        </group>
      ))}
      {!bare && (
        <group position={[3.1, 0, -4.6]}>
          <mesh geometry={G.cyl(0.05, 2.2, 6)} material={mat('#2b211c')} position={[0, 1.1, 0]} />
          <mesh geometry={G.ball(0.14, 1)} material={mat('#ffe2a0', { e: 0.3 + night * 1.6 })} position={[0, 2.25, 0]} />
        </group>
      )}
      {Array.from({ length: tables }, (_, i) => {
        const x = [-1.9, -0.4, 0.9][i];
        const col = ['#c65a3c', '#6f9a6a', '#e3a83a'][i];
        return (
          <Grow key={i} k={1} first>
            <group position={[x, 0, -4.4]}>
              <mesh geometry={G.cyl(0.32, 0.05, 12)} material={mat('#fbf7ef')} position={[0, 0.62, 0]} castShadow />
              <mesh geometry={G.cyl(0.04, 0.62, 6)} material={mat('#2b211c')} position={[0, 0.31, 0]} />
              <mesh geometry={G.cyl(0.03, 1.5, 6)} material={mat('#8a6a4a')} position={[0, 1.2, 0]} />
              <mesh geometry={G.cone(0.75, 0.35, 8)} material={mat(col)} position={[0, 1.95, 0]} castShadow />
              {[-1, 1].map((s) => <Box key={s} s={[0.24, 0.32, 0.24]} p={[s * 0.48, 0.32, 0]} c="#8a6a4a" />)}
            </group>
          </Grow>
        );
      })}
    </group>
  );
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
      <mesh geometry={G.cyl(0.22, 0.36, 8, 0.17)} material={mat('#c65a3c')} position={[0, 0.18, 0]} castShadow />
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={i} geometry={G.ball(0.2 - i * 0.02, 0)} material={mat(i % 2 ? '#5f9a52' : '#4a8541')} position={[Math.cos(i * 1.3) * 0.12, 0.5 + i * 0.12, Math.sin(i * 1.3) * 0.12]} castShadow />
      ))}
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
      <Outside night={night} tables={l('tavolini')} bare={cutaway} />
      <Pick id="tavolini" onPick={onPick}>
        <mesh position={[-1.0, 0.5, -4.4]} visible={false}>
          <boxGeometry args={[4, 1, 1]} />
        </mesh>
      </Pick>

      {/* pavimento */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0.1]} receiveShadow>
        <planeGeometry args={[7.4, 6.4]} />
        <meshStandardMaterial map={floorTexture()} roughness={0.95} />
      </mesh>
      <Box s={[7.6, 0.3, 6.6]} p={[0, -0.16, 0.1]} c="#7a4a2a" />

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
              <Box s={[l('frigo') > 1 ? 1.2 : 0.75, 1.8, 0.7]} p={[0, 0.9, 0]} c="#bfdccf" />
              <Box s={[0.04, 0.5, 0.06]} p={[0.25, 1.2, 0.37]} c="#8a939c" />
              {l('frigo') > 1 && <Box s={[0.02, 1.7, 0.02]} p={[0, 0.9, 0.36]} c="#8aa79a" />}
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

export function Lights({ night, shadow = 1024 }: { night: number; shadow?: number }) {
  return (
    <>
      <hemisphereLight args={['#fff1dc', '#9a6a52', 1.25 - night * 0.45]} />
      <directionalLight
        color={lerpC('#ffe2bc', '#b9a6ff', night)}
        intensity={1.9 - night * 0.9}
        position={[3.5, 7, 5]}
        castShadow
        shadow-mapSize={[shadow, shadow]}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
        shadow-bias={-0.0006}
      />
      <pointLight color="#ffd9a0" intensity={0.5 + night * 1.2} distance={9} position={[0, 2.8, 0.5]} />
    </>
  );
}

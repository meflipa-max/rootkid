import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { G, mat } from './ingredients';
import type { Look, Mood } from '../components/Person';
import type { ChefSkin } from '../lib/skins';

/** Personaggi "chibi": testa grande, occhi con bianco, pupilla e riflesso, ammiccano e respirano. */
export type Pose3 = 'idle' | 'walk' | 'cheer' | 'sad' | 'work' | 'tap' | 'wave';

const PANTS = '#3d3a55';
const SHOES = '#3b2a22';
const INK = '#2b1d18';

const darker = (c: string, k = 0.86) => '#' + new THREE.Color(c).multiplyScalar(k).getHexString();

export function Person3D({ look, mood = 'idle', pose = 'idle', chef, crown, seed = 0 }: { look: Look; mood?: Mood; pose?: Pose3; chef?: ChefSkin; crown?: boolean; seed?: number }) {
  const body = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);
  const legL = useRef<THREE.Group>(null);
  const legR = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const eyes = useRef<THREE.Group>(null);
  const blink = useRef({ next: 2 + (seed % 5) * 0.7, t: 0 });
  const shirt = chef ? chef.shirt : look.shirt;

  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime + seed * 1.7;
    const k = (rate: number) => 1 - Math.exp(-rate * Math.min(dt, 0.1));
    let aL = 0.18;
    let aR = -0.18;
    let fwdL = 0;
    let fwdR = 0;
    let y = 0;
    let lean = 0;
    let lg = 0;
    let headZ = Math.sin(t * 0.9) * 0.05;
    let headX = 0;
    const breathe = 1 + Math.sin(t * 2.2) * 0.015;
    if (pose === 'walk') {
      lg = Math.sin(t * 12) * 0.6;
      fwdL = -lg * 0.9;
      fwdR = lg * 0.9;
      y = Math.abs(Math.sin(t * 12)) * 0.05;
    } else if (pose === 'cheer') {
      aL = 2.6 + Math.sin(t * 14) * 0.25;
      aR = -2.6 - Math.sin(t * 14) * 0.25;
      y = Math.abs(Math.sin(t * 9)) * 0.16;
      headX = -0.15;
    } else if (pose === 'wave') {
      aR = -2.5 + Math.sin(t * 10) * 0.35;
      headZ = -0.12;
    } else if (pose === 'work') {
      fwdL = -1.1 + Math.sin(t * 16) * 0.25;
      fwdR = -1.1 - Math.sin(t * 16) * 0.25;
      lean = 0.1;
      headX = 0.25;
    } else if (pose === 'sad') {
      aL = 0.05;
      aR = -0.05;
      lean = 0.15;
      headX = 0.3;
    } else if (pose === 'tap') {
      // impaziente: mani sui fianchi, piede che batte, testa che scuote
      aL = 0.75;
      aR = -0.75;
      fwdL = 0.5;
      fwdR = 0.5;
      lg = Math.max(0, Math.sin(t * 15)) * 0.35;
      headZ = Math.sin(t * 7) * 0.13;
    }
    const L = THREE.MathUtils.lerp;
    if (armL.current) {
      armL.current.rotation.z = L(armL.current.rotation.z, aL, k(14));
      armL.current.rotation.x = L(armL.current.rotation.x, fwdL, k(14));
    }
    if (armR.current) {
      armR.current.rotation.z = L(armR.current.rotation.z, aR, k(14));
      armR.current.rotation.x = L(armR.current.rotation.x, fwdR, k(14));
    }
    if (legL.current) legL.current.rotation.x = L(legL.current.rotation.x, pose === 'tap' ? -lg : lg, k(16));
    if (legR.current) legR.current.rotation.x = L(legR.current.rotation.x, pose === 'tap' ? 0 : -lg, k(16));
    if (body.current) {
      body.current.position.y = L(body.current.position.y, y, k(16));
      body.current.rotation.x = L(body.current.rotation.x, lean, k(8));
      body.current.scale.set(1, breathe, 1);
    }
    if (head.current) {
      head.current.rotation.z = L(head.current.rotation.z, headZ, k(8));
      head.current.rotation.x = L(head.current.rotation.x, headX, k(8));
    }
    // ammiccare ogni tanto
    const B = blink.current;
    B.t += dt;
    if (B.t > B.next) {
      B.t = 0;
      B.next = 2.5 + ((seed * 7 + t) % 3);
    }
    if (eyes.current) eyes.current.scale.y = B.t < 0.12 ? 0.12 : 1;
  });

  const skin = mat(look.skin, { r: 0.55 });
  const skinD = mat(darker(look.skin), { r: 0.55 });
  const hair = mat(look.hair, { r: 0.5 });
  const ink = mat(INK, { r: 0.3 });
  const white = mat('#ffffff', { r: 0.25 });
  const shirtM = mat(shirt, { r: 0.7 });
  const happy = mood === 'happy';
  const style = chef ? -1 : look.style;

  return (
    <group>
      <mesh geometry={G.cyl(0.3, 0.005, 24)} material={mat('#000', { op: 0.16 })} position={[0, 0.004, 0]} />
      {[-1, 1].map((s) => (
        <group key={s} ref={s < 0 ? legL : legR} position={[s * 0.085, 0.24, 0]}>
          <mesh geometry={G.cap(0.062, 0.1)} material={mat(PANTS)} position={[0, -0.09, 0]} castShadow />
          <mesh geometry={G.sphere(0.075, 16)} material={mat(SHOES, { r: 0.45 })} position={[0, -0.2, 0.03]} scale={[1, 0.62, 1.35]} castShadow />
        </group>
      ))}
      <group ref={body}>
        <mesh geometry={G.cap(0.17, 0.14)} material={shirtM} position={[0, 0.43, 0]} scale={[1.08, 1, 0.86]} castShadow />
        {chef && (
          <>
            {[-1, 1].map((s) => [0.5, 0.42, 0.34].map((yy) => <mesh key={`${s}${yy}`} geometry={G.sphere(0.014, 8)} material={mat('#d9c9a8')} position={[s * 0.055, yy, 0.152]} />))}
            <mesh geometry={G.rbox(0.28, 0.24, 0.03, 0.012)} material={mat(chef.apron, { r: 0.75 })} position={[0, 0.31, 0.15]} rotation={[-0.12, 0, 0]} castShadow />
            <mesh geometry={G.torus(0.085, 0.028, Math.PI * 2, 16)} material={mat(chef.apron)} position={[0, 0.6, 0.01]} rotation={[Math.PI / 2 - 0.2, 0, 0]} />
          </>
        )}
        {[-1, 1].map((s) => (
          <group key={s} ref={s < 0 ? armL : armR} position={[s * 0.2, 0.55, 0]}>
            <mesh geometry={G.cap(0.052, 0.15)} material={shirtM} position={[0, -0.11, 0]} castShadow />
            <mesh geometry={G.sphere(0.058, 14)} material={skin} position={[0, -0.24, 0]} />
          </group>
        ))}
        <group ref={head} position={[0, 0.86, 0]}>
          <mesh geometry={G.sphere(0.27, 32)} material={skin} castShadow />
          {[-1, 1].map((s) => <mesh key={s} geometry={G.sphere(0.06, 14)} material={skin} position={[s * 0.262, -0.01, 0]} scale={[0.55, 1, 0.8]} />)}
          <mesh geometry={G.sphere(0.032, 14)} material={skinD} position={[0, -0.035, 0.268]} />
          {/* occhi */}
          <group ref={eyes}>
            {happy
              ? [-1, 1].map((s) => <mesh key={s} geometry={G.torus(0.038, 0.012, Math.PI, 12)} material={ink} position={[s * 0.095, 0.02, 0.245]} rotation={[-0.2, 0, 0]} />)
              : [-1, 1].map((s) => (
                  <group key={s} position={[s * 0.095, 0.03, 0.235]} rotation={[-0.15, s * 0.25, 0]}>
                    <mesh geometry={G.sphere(0.052, 16)} material={white} scale={[1, mood === 'angry' ? 0.85 : 1.18, 0.45]} />
                    <mesh geometry={G.sphere(0.034, 14)} material={ink} position={[0, -0.006, 0.02]} scale={[1, 1.12, 0.5]} />
                    <mesh geometry={G.sphere(0.011, 8)} material={mat('#ffffff', { e: 0.6 })} position={[0.012, 0.016, 0.038]} />
                  </group>
                ))}
          </group>
          {/* sopracciglia */}
          {[-1, 1].map((s) => (
            <mesh
              key={s}
              geometry={G.cap(0.013, 0.05)}
              material={mat(darker(look.hair, 0.7))}
              position={[s * 0.095, mood === 'worried' ? 0.12 : 0.108, 0.25]}
              rotation={[0, 0, Math.PI / 2 + s * (mood === 'angry' ? 0.45 : mood === 'worried' ? -0.35 : 0.08)]}
            />
          ))}
          <mesh geometry={G.sphere(0.045, 12)} material={mat('#f08a8a', { op: 0.55 })} position={[-0.165, -0.065, 0.205]} scale={[1, 0.6, 0.35]} />
          <mesh geometry={G.sphere(0.045, 12)} material={mat('#f08a8a', { op: 0.55 })} position={[0.165, -0.065, 0.205]} scale={[1, 0.6, 0.35]} />
          {/* bocca */}
          {happy ? (
            <group position={[0, -0.105, 0.24]}>
              <mesh geometry={G.sphere(0.05, 16)} material={mat('#6b2222', { r: 0.4 })} scale={[1.15, 0.7, 0.4]} />
              <mesh geometry={G.sphere(0.028, 12)} material={mat('#e86a6a')} position={[0, -0.018, 0.012]} scale={[1.2, 0.6, 0.4]} />
            </group>
          ) : mood === 'worried' ? (
            <mesh geometry={G.torus(0.022, 0.009, Math.PI * 2, 12)} material={mat('#6b2222')} position={[0, -0.11, 0.255]} />
          ) : (
            <mesh
              geometry={G.torus(0.045, 0.011, Math.PI, 14)}
              material={mat('#6b2222')}
              position={[0, mood === 'angry' ? -0.13 : -0.095, 0.25]}
              rotation={[-0.2, 0, mood === 'angry' ? 0 : Math.PI]}
              scale={[1, mood === 'angry' ? 0.6 : 0.5, 1]}
            />
          )}
          {/* capelli */}
          {style !== 2 && style !== -1 && <mesh geometry={G.dome(0.285)} material={hair} rotation={[-0.42, 0, 0]} position={[0, 0.005, -0.015]} castShadow />}
          {(style === 0 || style === 1) && <mesh geometry={G.cap(0.055, 0.2)} material={hair} position={[0.03, 0.19, 0.19]} rotation={[0.3, 0, Math.PI / 2 + 0.25]} />}
          {style === 1 && <mesh geometry={G.rbox(0.48, 0.44, 0.14, 0.06)} material={hair} position={[0, -0.1, -0.17]} castShadow />}
          {style === 2 && [-1, 1].map((s) => <mesh key={s} geometry={G.sphere(0.085, 14)} material={hair} position={[s * 0.235, 0.08, -0.07]} />)}
          {style === 3 &&
            Array.from({ length: 9 }, (_, i) => (
              <mesh key={i} geometry={G.sphere(0.105, 14)} material={hair} position={[Math.cos(i * 0.7 + 2.4) * 0.19, 0.17 + Math.sin(i * 1.3) * 0.03, Math.sin(i * 0.7 + 2.4) * 0.19 - 0.04]} />
            ))}
          {look.extra === 1 && (
            <group position={[0, 0.03, 0.262]}>
              {[-1, 1].map((s) => <mesh key={s} geometry={G.torus(0.062, 0.011, Math.PI * 2, 18)} material={mat('#2b2b35', { r: 0.3 })} position={[s * 0.095, 0, 0]} />)}
              <mesh geometry={G.cap(0.008, 0.04)} material={mat('#2b2b35')} rotation={[0, 0, Math.PI / 2]} />
            </group>
          )}
          {look.extra === 2 && <mesh geometry={G.dome(0.24)} material={hair} position={[0, -0.07, 0.05]} rotation={[Math.PI + 0.25, 0, 0]} scale={[1, 0.75, 0.95]} />}
          {(look.extra === 3 || chef) && (
            <group position={[0, -0.072, 0.262]}>
              {[-1, 1].map((s) => <mesh key={s} geometry={G.cap(0.022, 0.05)} material={mat(chef ? '#3b2416' : look.hair)} position={[s * 0.035, 0, 0]} rotation={[0, 0, Math.PI / 2 + s * 0.35]} />)}
            </group>
          )}
          {chef && (
            <group position={[0, 0.2, -0.01]} rotation={[-0.1, 0, 0]}>
              <mesh geometry={G.cyl(0.21, 0.16, 24, 0.24)} material={mat(chef.hat, { r: 0.7 })} position={[0, 0.06, 0]} castShadow />
              {[[-0.1, 0], [0.1, 0], [0, 0.08], [0, -0.08], [0, 0]].map(([x, z], i) => (
                <mesh key={i} geometry={G.sphere(i === 4 ? 0.17 : 0.13, 18)} material={mat(chef.hat, { r: 0.7 })} position={[x, i === 4 ? 0.26 : 0.2, z]} castShadow />
              ))}
            </group>
          )}
          {crown && (
            <group position={[0, 0.27, -0.02]} rotation={[-0.2, 0, 0.12]}>
              <mesh geometry={G.cyl(0.13, 0.08, 16, 0.12)} material={mat('#e8b23a', { r: 0.25, m: 0.7 })} />
              {[0, 1, 2, 3, 4].map((i) => (
                <mesh key={i} geometry={G.cone(0.03, 0.08, 8)} material={mat('#e8b23a', { r: 0.25, m: 0.7 })} position={[Math.cos(i * 1.256) * 0.12, 0.07, Math.sin(i * 1.256) * 0.12]} />
              ))}
              <mesh geometry={G.sphere(0.024, 10)} material={mat('#c8463b', { r: 0.2 })} position={[0, 0.005, 0.125]} />
            </group>
          )}
        </group>
      </group>
    </group>
  );
}

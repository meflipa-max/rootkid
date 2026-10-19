import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { G, mat } from './ingredients';
import type { Look, Mood } from '../components/Person';
import type { ChefSkin } from '../lib/skins';

/** pose del corpo: le braccia e il "rimbalzo" cambiano, la faccia segue l'umore */
export type Pose3 = 'idle' | 'walk' | 'cheer' | 'sad' | 'work' | 'tap' | 'wave';

const PANTS = '#3b3550';

export function Person3D({ look, mood = 'idle', pose = 'idle', chef, crown, seed = 0 }: { look: Look; mood?: Mood; pose?: Pose3; chef?: ChefSkin; crown?: boolean; seed?: number }) {
  const body = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);
  const legL = useRef<THREE.Mesh>(null);
  const legR = useRef<THREE.Mesh>(null);
  const head = useRef<THREE.Group>(null);
  const shirt = chef ? chef.shirt : look.shirt;

  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime + seed;
    // smorzamento esponenziale stabile a qualsiasi frame rate
    const k = (rate: number) => 1 - Math.exp(-rate * Math.min(dt, 0.1));
    let aL = 0.12;
    let aR = -0.12;
    let y = Math.sin(t * 2.4) * 0.012;
    let lean = 0;
    let lg = 0;
    let headY = 0;
    let headZ = Math.sin(t * 0.9) * 0.05;
    if (pose === 'walk') {
      lg = Math.sin(t * 12) * 0.5;
      aL = -lg * 0.8;
      aR = lg * 0.8;
      y = Math.abs(Math.sin(t * 12)) * 0.05;
    } else if (pose === 'cheer') {
      aL = 2.7 + Math.sin(t * 14) * 0.25;
      aR = -2.7 - Math.sin(t * 14) * 0.25;
      y = Math.abs(Math.sin(t * 9)) * 0.18;
    } else if (pose === 'wave') {
      aR = -2.5 + Math.sin(t * 10) * 0.35;
    } else if (pose === 'work') {
      aL = -0.9 + Math.sin(t * 18) * 0.3;
      aR = 0.9 - Math.sin(t * 18) * 0.3;
      lean = 0.12;
    } else if (pose === 'sad') {
      aL = 0.05;
      aR = -0.05;
      lean = 0.18;
      headY = -0.03;
      y = 0;
    } else if (pose === 'tap') {
      // impaziente: braccia sui fianchi, piede che batte
      aL = 0.9;
      aR = -0.9;
      lg = Math.max(0, Math.sin(t * 16)) * 0.35;
      headZ = Math.sin(t * 8) * 0.12;
    }
    const lerp = THREE.MathUtils.lerp;
    if (armL.current) armL.current.rotation.z = lerp(armL.current.rotation.z, aL, k(14));
    if (armR.current) armR.current.rotation.z = lerp(armR.current.rotation.z, aR, k(14));
    if (legL.current) legL.current.rotation.x = lerp(legL.current.rotation.x, lg, k(16));
    if (legR.current) legR.current.rotation.x = lerp(legR.current.rotation.x, pose === 'tap' ? 0 : -lg, k(16));
    if (body.current) {
      body.current.position.y = lerp(body.current.position.y, y, k(16));
      body.current.rotation.x = lerp(body.current.rotation.x, lean, k(8));
    }
    if (head.current) {
      head.current.rotation.z = lerp(head.current.rotation.z, headZ, k(8));
      head.current.position.y = lerp(head.current.position.y, 1.0 + headY, k(8));
    }
  });

  const skin = mat(look.skin);
  const hair = mat(look.hair);
  const ink = mat('#2b211c');
  const smile = mood === 'happy';
  return (
    <group>
      <mesh geometry={G.cyl(0.33, 0.01, 16)} material={mat('#000', { op: 0.18 })} position={[0, 0.005, 0]} />
      <mesh ref={legL} geometry={G.cyl(0.075, 0.32, 8)} material={mat(PANTS)} position={[-0.1, 0.16, 0]} castShadow />
      <mesh ref={legR} geometry={G.cyl(0.075, 0.32, 8)} material={mat(PANTS)} position={[0.1, 0.16, 0]} castShadow />
      <group ref={body}>
        <mesh geometry={G.cyl(0.2, 0.44, 10, 0.25)} material={mat(shirt)} position={[0, 0.53, 0]} castShadow />
        {chef && <mesh geometry={G.box(0.34, 0.4, 0.04)} material={mat(chef.apron)} position={[0, 0.5, 0.215]} rotation={[-0.1, 0, 0]} castShadow />}
        {chef && <mesh geometry={G.box(0.36, 0.05, 0.42)} material={mat(chef.apron)} position={[0, 0.6, 0]} />}
        <group ref={armL} position={[-0.25, 0.7, 0]}>
          <mesh geometry={G.cap(0.06, 0.24)} material={mat(shirt)} position={[0, -0.16, 0]} castShadow />
          <mesh geometry={G.ball(0.065, 1)} material={skin} position={[0, -0.33, 0]} />
        </group>
        <group ref={armR} position={[0.25, 0.7, 0]}>
          <mesh geometry={G.cap(0.06, 0.24)} material={mat(shirt)} position={[0, -0.16, 0]} castShadow />
          <mesh geometry={G.ball(0.065, 1)} material={skin} position={[0, -0.33, 0]} />
        </group>
        <mesh geometry={G.cyl(0.07, 0.1, 8)} material={skin} position={[0, 0.79, 0]} />
        <group ref={head} position={[0, 1.0, 0]}>
          <mesh geometry={G.ball(0.22, 1)} material={skin} castShadow />
          <mesh geometry={G.ball(0.045, 0)} material={skin} position={[-0.215, 0, 0]} />
          <mesh geometry={G.ball(0.045, 0)} material={skin} position={[0.215, 0, 0]} />
          {/* capelli */}
          {!chef && look.style !== 2 && <mesh geometry={G.dome(0.235)} material={hair} position={[0, 0.02, -0.01]} rotation={[-0.25, 0, 0]} />}
          {!chef && look.style === 1 && <mesh geometry={G.box(0.42, 0.36, 0.12)} material={hair} position={[0, -0.08, -0.13]} />}
          {!chef && look.style === 2 && [-1, 1].map((s) => <mesh key={s} geometry={G.ball(0.07, 0)} material={hair} position={[s * 0.2, 0.06, -0.04]} />)}
          {!chef && look.style === 3 && [0, 1, 2, 3, 4, 5].map((i) => <mesh key={i} geometry={G.ball(0.09, 0)} material={hair} position={[Math.cos(i * 1.05) * 0.15, 0.15, Math.sin(i * 1.05) * 0.15 - 0.03]} />)}
          {/* faccia */}
          {smile ? (
            [-1, 1].map((s) => <mesh key={s} geometry={G.torus(0.03, 0.01, Math.PI, 8)} material={ink} position={[s * 0.08, 0.03, 0.205]} />)
          ) : (
            [-1, 1].map((s) => <mesh key={s} geometry={G.ball(0.03, 0)} material={ink} position={[s * 0.08, 0.02, 0.2]} scale={[1, mood === 'angry' ? 0.7 : 1.15, 0.6]} />)
          )}
          {(mood === 'angry' || mood === 'worried') &&
            [-1, 1].map((s) => (
              <mesh key={s} geometry={G.box(0.08, 0.018, 0.02)} material={ink} position={[s * 0.08, 0.1, 0.2]} rotation={[0, 0, s * (mood === 'angry' ? -0.45 : 0.35)]} />
            ))}
          {smile && [-1, 1].map((s) => <mesh key={s} geometry={G.ball(0.035, 0)} material={mat('#f08a8a', { op: 0.7 })} position={[s * 0.14, -0.04, 0.17]} scale={[1, 0.6, 0.4]} />)}
          <mesh
            geometry={G.torus(0.05, 0.013, Math.PI, 8)}
            material={mat('#7a2a2a')}
            position={[0, smile ? -0.06 : -0.09, 0.205]}
            rotation={[0, 0, smile || mood === 'idle' ? Math.PI : 0]}
            scale={[1, mood === 'idle' ? 0.35 : mood === 'worried' ? 0.4 : 1, 1]}
          />
          {look.extra === 1 && [-1, 1].map((s) => <mesh key={s} geometry={G.torus(0.045, 0.01, Math.PI * 2, 10)} material={ink} position={[s * 0.08, 0.02, 0.215]} />)}
          {look.extra === 2 && <mesh geometry={G.dome(0.2)} material={hair} position={[0, -0.05, 0.03]} rotation={[Math.PI, 0, 0]} scale={[1, 0.8, 0.9]} />}
          {look.extra === 3 && <mesh geometry={G.box(0.13, 0.03, 0.03)} material={hair} position={[0, -0.04, 0.215]} />}
          {chef && (
            <group position={[0, 0.17, 0]}>
              <mesh geometry={G.cyl(0.18, 0.2, 10)} material={mat(chef.hat)} position={[0, 0.08, 0]} />
              {[-0.09, 0, 0.09].map((x) => <mesh key={x} geometry={G.ball(0.12, 1)} material={mat(chef.hat)} position={[x, 0.24, x === 0 ? 0.02 : 0]} />)}
            </group>
          )}
          {crown && (
            <group position={[0, 0.24, 0]} rotation={[-0.15, 0, 0.12]}>
              <mesh geometry={G.cyl(0.12, 0.08, 7, 0.11)} material={mat('#e3a83a', { r: 0.35 })} />
              {[0, 1, 2, 3, 4].map((i) => (
                <mesh key={i} geometry={G.cone(0.03, 0.08, 4)} material={mat('#e3a83a', { r: 0.35 })} position={[Math.cos(i * 1.256) * 0.11, 0.07, Math.sin(i * 1.256) * 0.11]} />
              ))}
              <mesh geometry={G.ball(0.025, 0)} material={mat('#c65a3c', { r: 0.3 })} position={[0, 0.01, 0.115]} />
            </group>
          )}
        </group>
      </group>
    </group>
  );
}

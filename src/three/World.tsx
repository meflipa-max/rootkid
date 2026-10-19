import { memo, useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { G, mat } from './ingredients';

/**
 * Il mondo attorno alla pizzeria: un'isola galleggiante (erba, terra, roccia) in un'acqua stilizzata
 * con la schiuma sulla riva, cielo dipinto con sole e nuvole, alberi low-poly, sentiero, lampioni,
 * pontile con la barca, fiori e ciuffi d'erba. `night` 0..1 porta dal pomeriggio alla sera.
 */

type V3 = [number, number, number];
export const ISLAND = { x: 0, z: -1.6, r: 6.9 };

const rng = (seed: number) => () => {
  let t = (seed += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

export const skyColors = (night: number) => ({
  top: new THREE.Color('#5fa8e8').lerp(new THREE.Color('#151838'), night),
  mid: new THREE.Color('#a9cdf0').lerp(new THREE.Color('#3b2f66'), night),
  horizon: new THREE.Color('#ffe0b5').lerp(new THREE.Color('#d9826a'), Math.min(1, night * 1.4)).lerp(new THREE.Color('#4a3466'), Math.max(0, night - 0.5) * 2),
});

function Sky({ night }: { night: number }) {
  const m = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: { top: { value: new THREE.Color() }, mid: { value: new THREE.Color() }, horizon: { value: new THREE.Color() }, sun: { value: new THREE.Vector3(0.5, 0.25, -0.8).normalize() }, glow: { value: 1 } },
        vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: `uniform vec3 top; uniform vec3 mid; uniform vec3 horizon; uniform vec3 sun; uniform float glow; varying vec3 vDir;
          void main(){ float h = clamp(vDir.y, -0.2, 1.0);
            vec3 c = h < 0.18 ? mix(horizon, mid, smoothstep(-0.05, 0.18, h)) : mix(mid, top, smoothstep(0.18, 0.75, h));
            float s = max(dot(normalize(vDir), sun), 0.0);
            c += vec3(1.0, 0.85, 0.6) * (pow(s, 64.0) * 1.4 + pow(s, 6.0) * 0.25) * glow;
            gl_FragColor = vec4(c, 1.0);
            #include <colorspace_fragment>
          }`,
      }),
    [],
  );
  useEffect(() => {
    const c = skyColors(night);
    m.uniforms.top.value.copy(c.top);
    m.uniforms.mid.value.copy(c.mid);
    m.uniforms.horizon.value.copy(c.horizon);
    m.uniforms.glow.value = 1 - night * 0.8;
    m.uniforms.sun.value.set(0.5, 0.25 - night * 0.3, -0.8).normalize();
  }, [night, m]);
  return (
    <mesh material={m} renderOrder={-1}>
      <sphereGeometry args={[70, 32, 16]} />
    </mesh>
  );
}

function Water({ night }: { night: number }) {
  const m = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { t: { value: 0 }, deep: { value: new THREE.Color() }, shallow: { value: new THREE.Color() }, foam: { value: new THREE.Color('#ffffff') }, R: { value: ISLAND.r }, C: { value: new THREE.Vector2(ISLAND.x, ISLAND.z) } },
        vertexShader: `varying vec2 vP; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vP = w.xz; gl_Position = projectionMatrix * viewMatrix * w; }`,
        fragmentShader: `uniform float t; uniform vec3 deep; uniform vec3 shallow; uniform vec3 foam; uniform float R; uniform vec2 C; varying vec2 vP;
          void main(){
            vec2 d = vP - C; float r = length(d); float a = atan(d.y, d.x);
            float shore = r - R - 0.15 * sin(a * 7.0 + t * 0.7);
            vec3 c = mix(shallow, deep, smoothstep(0.0, 9.0, shore));
            float ring = smoothstep(0.55, 0.0, abs(shore - 0.35 - 0.12 * sin(t * 1.3)));
            float ring2 = smoothstep(0.25, 0.0, abs(shore - 1.25 - 0.2 * sin(t * 0.9 + 1.0))) * 0.5;
            float sparkle = step(0.992, sin(vP.x * 1.7 + t * 0.8) * sin(vP.y * 2.1 - t * 0.6)) * 0.25;
            c = mix(c, foam, clamp(ring * 0.85 + ring2 + sparkle, 0.0, 1.0));
            gl_FragColor = vec4(c, 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }`,
      }),
    [],
  );
  useEffect(() => {
    m.uniforms.deep.value.set('#3aa9cc').lerp(new THREE.Color('#1b2d5a'), night);
    m.uniforms.shallow.value.set('#8de8dc').lerp(new THREE.Color('#3a5f8a'), night);
    m.uniforms.foam.value.set('#ffffff').lerp(new THREE.Color('#b9c2e8'), night);
  }, [night, m]);
  useFrame((_, dt) => {
    m.uniforms.t.value += dt;
  });
  return (
    <mesh material={m} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.75, 0]}>
      <circleGeometry args={[60, 48]} />
    </mesh>
  );
}

/** cilindro con il bordo irregolare, per un'isola dall'aria naturale */
function wobbly(rTop: number, rBot: number, h: number, seg: number, seed: number, amp: number) {
  const g = new THREE.CylinderGeometry(rTop, rBot, h, seg, 2);
  const p = g.attributes.position;
  const r = rng(seed);
  const n = Array.from({ length: seg + 1 }, () => 1 + (r() - 0.5) * amp);
  n[seg] = n[0];
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const z = p.getZ(i);
    const a = Math.atan2(z, x);
    const k = n[Math.round(((a + Math.PI) / (Math.PI * 2)) * seg) % seg];
    p.setX(i, x * k);
    p.setZ(i, z * k);
  }
  g.computeVertexNormals();
  return g;
}

function Island() {
  const grass = useMemo(() => wobbly(ISLAND.r, ISLAND.r - 0.1, 0.4, 22, 3, 0.08), []);
  const dirt = useMemo(() => wobbly(ISLAND.r - 0.1, ISLAND.r - 1.6, 1.4, 22, 3, 0.1), []);
  const rock = useMemo(() => wobbly(ISLAND.r - 1.6, 1.2, 2.6, 14, 9, 0.2), []);
  return (
    <group position={[ISLAND.x, 0, ISLAND.z]}>
      <mesh geometry={grass} material={mat('#79bf5e', { flat: true, r: 0.9 })} position={[0, -0.2, 0]} receiveShadow />
      <mesh geometry={dirt} material={mat('#9a6a46', { flat: true, r: 0.95 })} position={[0, -1.1, 0]} />
      <mesh geometry={rock} material={mat('#7d7470', { flat: true, r: 0.95 })} position={[0, -3.1, 0]} />
    </group>
  );
}

function Tree({ p, s = 1, kind = 0, seed = 1 }: { p: V3; s?: number; kind?: number; seed?: number }) {
  const g = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (g.current) g.current.rotation.z = Math.sin(clock.elapsedTime * 0.8 + seed) * 0.025;
  });
  const greens = [['#5fae4c', '#4c9a40', '#79c25c'], ['#8cc04f', '#6fae43', '#a6d064'], ['#e3a83a', '#d98a3c', '#efc25a']][kind % 3];
  if (kind === 3) {
    return (
      <group position={p} scale={s}>
        <mesh geometry={G.cyl(0.09, 0.5, 6, 0.12)} material={mat('#7a4a2e', { flat: true })} position={[0, 0.25, 0]} castShadow />
        {[0, 1, 2].map((i) => (
          <mesh key={i} geometry={G.cone(0.75 - i * 0.18, 0.8, 7)} material={mat(['#3f8a4f', '#4c9a58', '#5aac64'][i], { flat: true, r: 0.85 })} position={[0, 0.85 + i * 0.45, 0]} castShadow />
        ))}
      </group>
    );
  }
  return (
    <group ref={g} position={p} scale={s}>
      <mesh geometry={G.cyl(0.1, 1.0, 6, 0.15)} material={mat('#7a4a2e', { flat: true })} position={[0, 0.5, 0]} castShadow />
      <mesh geometry={G.cyl(0.05, 0.4, 5, 0.06)} material={mat('#7a4a2e', { flat: true })} position={[0.15, 0.95, 0]} rotation={[0, 0, -0.7]} />
      <mesh geometry={G.ball(0.72, 0)} material={mat(greens[0], { flat: true, r: 0.85 })} position={[0, 1.55, 0]} rotation={[seed, seed * 2, 0]} castShadow />
      <mesh geometry={G.ball(0.5, 0)} material={mat(greens[1], { flat: true, r: 0.85 })} position={[0.45, 1.25, 0.2]} rotation={[seed * 3, 0, seed]} castShadow />
      <mesh geometry={G.ball(0.42, 0)} material={mat(greens[2], { flat: true, r: 0.85 })} position={[-0.38, 1.9, -0.1]} rotation={[0, seed, seed * 2]} castShadow />
    </group>
  );
}

function Lamp({ p, night }: { p: V3; night: number }) {
  return (
    <group position={p}>
      <mesh geometry={G.cyl(0.05, 1.9, 8)} material={mat('#2e2a33', { r: 0.4, m: 0.5 })} position={[0, 0.95, 0]} castShadow />
      <mesh geometry={G.rbox(0.24, 0.3, 0.24, 0.04)} material={mat('#2e2a33', { r: 0.4, m: 0.5 })} position={[0, 2.0, 0]} />
      <mesh geometry={G.rbox(0.17, 0.22, 0.17, 0.03)} material={mat('#ffd98a', { e: 0.8 + night * 3 })} position={[0, 2.0, 0]} />
      <mesh geometry={G.cone(0.2, 0.16, 4)} material={mat('#2e2a33', { r: 0.4, m: 0.5 })} position={[0, 2.23, 0]} rotation={[0, Math.PI / 4, 0]} />
      {night > 0.35 && <pointLight color="#ffc77a" intensity={night * 6} distance={4} decay={2} position={[0, 1.9, 0]} />}
    </group>
  );
}

function Grass() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const N = 260;
  useEffect(() => {
    const im = ref.current;
    if (!im) return;
    const r = rng(11);
    const o = new THREE.Object3D();
    const col = new THREE.Color();
    let i = 0;
    while (i < N) {
      const a = r() * Math.PI * 2;
      const d = Math.sqrt(r()) * (ISLAND.r - 0.4);
      const x = ISLAND.x + Math.cos(a) * d;
      const z = ISLAND.z + Math.sin(a) * d;
      if (Math.abs(x) < 4 && z > -3.3 && z < 3.5) continue; // dentro il locale
      o.position.set(x, 0, z);
      o.rotation.set((r() - 0.5) * 0.3, r() * 6, (r() - 0.5) * 0.3);
      o.scale.setScalar(0.6 + r() * 0.8);
      o.updateMatrix();
      im.setMatrixAt(i, o.matrix);
      im.setColorAt(i, col.set(['#5fae4c', '#79c25c', '#4c9a40', '#a6d064'][i % 4]));
      i++;
    }
    im.instanceMatrix.needsUpdate = true;
    if (im.instanceColor) im.instanceColor.needsUpdate = true;
  }, []);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, N]} receiveShadow>
      <coneGeometry args={[0.05, 0.28, 4]} />
      <meshStandardMaterial roughness={0.9} flatShading />
    </instancedMesh>
  );
}

function Flowers({ p, seed }: { p: V3; seed: number }) {
  const r = useMemo(() => rng(seed), [seed]);
  const items = useMemo(() => Array.from({ length: 9 }, () => [r() * 0.9 - 0.45, r() * 0.6 - 0.3, ['#f28aa8', '#ffd24a', '#ffffff', '#b98ae0', '#ff8a5c'][Math.floor(r() * 5)]] as const), [r]);
  return (
    <group position={p}>
      <mesh geometry={G.sphere(0.5, 12)} material={mat('#4f9a45', { r: 0.9 })} scale={[1.2, 0.35, 0.8]} position={[0, 0.05, 0]} receiveShadow />
      {items.map(([x, z, c], i) => <mesh key={i} geometry={G.sphere(0.06, 8)} material={mat(c, { r: 0.6 })} position={[x, 0.2, z]} />)}
    </group>
  );
}

function Clouds({ night }: { night: number }) {
  const g = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (g.current) g.current.rotation.y += dt * 0.008;
  });
  const cl: V3[] = [[-14, 11, -22], [8, 13, -26], [22, 10, -10], [-24, 12, 4], [16, 14, 18], [-6, 15, 24], [0, 12, -30]];
  return (
    <group ref={g}>
      {cl.map((c, i) => (
        <group key={i} position={c} scale={1.4 + (i % 3) * 0.4}>
          {[[0, 0, 0, 1.6], [1.6, -0.3, 0.2, 1.2], [-1.5, -0.4, -0.1, 1.1], [0.6, 0.6, -0.3, 1.1], [-0.5, 0.5, 0.4, 0.9]].map(([x, y, z, r], k) => (
            <mesh key={k} geometry={G.sphere(r, 16)} material={mat('#ffffff', { e: 0.35 - night * 0.3, r: 1 })} position={[x, y, z]} scale={[1, 0.75, 1]} />
          ))}
        </group>
      ))}
    </group>
  );
}

function Dock() {
  return (
    <group position={[2.6, 0, ISLAND.z - ISLAND.r + 0.3]} rotation={[0, 0.25, 0]}>
      {Array.from({ length: 7 }, (_, i) => (
        <mesh key={i} geometry={G.rbox(1.3, 0.08, 0.28, 0.02)} material={mat(i % 2 ? '#a8784a' : '#9a6a40', { r: 0.85 })} position={[0, -0.1, -0.3 - i * 0.32]} castShadow receiveShadow />
      ))}
      {[-0.6, 0.6].map((x) => [-0.5, -1.4, -2.3].map((z) => <mesh key={`${x}${z}`} geometry={G.cyl(0.07, 1.0, 8)} material={mat('#7a4a2e')} position={[x, -0.45, z]} />))}
      <group position={[1.4, -0.72, -1.8]} rotation={[0, 0.5, 0]}>
        <mesh geometry={G.cyl(0.42, 1.6, 16, 0.42, Math.PI)} material={mat('#c65a3c', { r: 0.7 })} rotation={[Math.PI / 2, 0, Math.PI / 2]} position={[0, 0.12, 0]} castShadow />
        <mesh geometry={G.rbox(0.7, 0.05, 0.2, 0.02)} material={mat('#a8784a')} position={[0, 0.12, 0]} />
      </group>
    </group>
  );
}

export const World = memo(function World({ night, tables }: { night: number; tables: number }) {
  void tables;
  const trees: [V3, number, number][] = [
    [[-5.2, 0, -4.6], 1.2, 0], [[-3.3, 0, -6.3], 1.0, 3], [[-0.9, 0, -7.4], 1.1, 1], [[4.6, 0, -5.4], 1.25, 0], [[5.6, 0, -2.4], 0.9, 3],
    [[-5.8, 0, -1.2], 1.0, 3], [[-5.4, 0, 2.4], 1.1, 1], [[5.4, 0, 1.6], 1.0, 0], [[3.4, 0, -7.6], 0.8, 2], [[-2.2, 0, -5.0], 0.75, 2], [[1.0, 0, -5.6], 0.7, 0],
  ];
  return (
    <group>
      <Sky night={night} />
      <Clouds night={night} />
      <Water night={night} />
      <Island />
      <Grass />
      {trees.map(([p, s, k], i) => <Tree key={i} p={p} s={s} kind={k} seed={i * 1.37} />)}
      {/* sentiero dalla porta al pontile */}
      {Array.from({ length: 9 }, (_, i) => (
        <mesh key={i} geometry={G.cyl(0.32, 0.05, 9)} material={mat(i % 2 ? '#e3d3b6' : '#d8c6a5', { r: 0.95, flat: true })} position={[2.15 + Math.sin(i * 0.9) * 0.25 + i * 0.05, 0.02, -3.6 - i * 0.55]} receiveShadow />
      ))}
      <Lamp p={[1.15, 0, -4.4]} night={night} />
      <Lamp p={[3.3, 0, -6.6]} night={night} />
      <Lamp p={[-4.6, 0, 3.6]} night={night} />
      <Flowers p={[-2.8, 0, -3.7]} seed={5} />
      <Flowers p={[0.3, 0, -3.7]} seed={8} />
      <Flowers p={[4.5, 0, 3.4]} seed={13} />
      {[[-4.6, -0.6], [5.0, -4.2], [-1.6, -7.8], [4.2, 4.0]].map(([x, z], i) => (
        <mesh key={i} geometry={G.ball(0.35 + (i % 2) * 0.15, 0)} material={mat('#8f8a86', { flat: true, r: 0.9 })} position={[x, 0.1, z]} rotation={[i, i * 2, 0]} castShadow />
      ))}
      <Dock />
    </group>
  );
});

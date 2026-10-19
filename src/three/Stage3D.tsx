import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { BASE_OF, STACKED, G, buildIng, isSpread, mat } from './ingredients';
import { Person3D, type Pose3 } from './Person3D';
import { Lights, Pizzeria } from './Pizzeria';
import { stageBus, startTilt, tilt, type StageEvent } from './bus';
import { CHEF_LOOK, type Look, type Mood } from '../components/Person';
import type { ChefSkin } from '../lib/skins';

export interface StageCust {
  id: number;
  look: Look;
  slot: number;
  state: 'in' | 'wait' | 'happy' | 'angry';
  vip: boolean;
  mood: Mood;
  impatient: boolean;
  bubble: ReactNode;
}

const SLOT_X = [-1.35, 0, 1.35];
const WAIT_Z = -1.15;
const DOOR: [number, number] = [2.15, -3.5];
const PLATE: [number, number, number] = [0.55, 0.92, 0.75];
const CAM = new THREE.Vector3(0, 2.6, 5.3);
const LOOK = new THREE.Vector3(0, 1.05, -0.7);

const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

function Customer({ c, onSelect }: { c: StageCust; onSelect: (id: number) => void }) {
  const g = useRef<THREE.Group>(null);
  const st = useRef({ state: '', t0: 0 });
  const [pose, setPose] = useState<Pose3>('walk');
  useFrame(({ clock }) => {
    const grp = g.current;
    if (!grp) return;
    const now = clock.elapsedTime;
    if (st.current.state !== c.state) st.current = { state: c.state, t0: now };
    const e = now - st.current.t0;
    const sx = SLOT_X[c.slot];
    let x = sx;
    let z = WAIT_Z;
    let p: Pose3 = c.impatient ? 'tap' : 'idle';
    let face = 0;
    let s = 1;
    if (c.state === 'in') {
      const k = ease(Math.min(1, e / 0.75));
      x = DOOR[0] + (sx - DOOR[0]) * k;
      z = DOOR[1] + (WAIT_Z - DOOR[1]) * k;
      p = k < 1 ? 'walk' : 'idle';
      face = k < 1 ? Math.atan2(sx - DOOR[0], WAIT_Z - DOOR[1]) : 0;
    } else if (c.state === 'happy' || c.state === 'angry') {
      const stay = c.state === 'happy' ? 0.35 : 0.25;
      if (e < stay) p = c.state === 'happy' ? 'cheer' : 'tap';
      else {
        const k = Math.min(1, (e - stay) / 0.6);
        x = sx + (DOOR[0] - sx) * k;
        z = WAIT_Z + (DOOR[1] - WAIT_Z) * k;
        p = 'walk';
        face = Math.atan2(DOOR[0] - sx, DOOR[1] - WAIT_Z);
        s = 1 - Math.max(0, k - 0.7) * 3;
      }
    }
    grp.position.set(x, 0, z);
    grp.rotation.y = THREE.MathUtils.lerp(grp.rotation.y, face, 0.25);
    grp.scale.setScalar(Math.max(0.01, s) * 1.3);
    if (p !== pose) setPose(p);
  });
  const alive = c.state === 'in' || c.state === 'wait';
  return (
    <group
      ref={g}
      position={[DOOR[0], 0, DOOR[1]]}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        if (alive) onSelect(c.id);
      }}
    >
      <Person3D look={c.look} mood={c.mood} pose={pose} crown={c.vip} seed={c.id} />
      {alive && (
        <Html position={[0, 1.62, 0]} center zIndexRange={[30, 10]} wrapperClass="bubble-wrap">
          {c.bubble}
        </Html>
      )}
    </group>
  );
}

/** ingrediente che cade sul piatto e rimbalza schiacciandosi un po' */
function Drop({ name, at, scale, onPick }: { name: string; at: [number, number, number]; scale: number; onPick?: () => void }) {
  const obj = useMemo(() => buildIng(name, true).obj, [name]);
  const g = useRef<THREE.Group>(null);
  const s = useRef({ y: at[1] + 1.4, v: 0, sq: 0 });
  useFrame((_, dt) => {
    const grp = g.current;
    if (!grp) return;
    const d = Math.min(dt, 0.04);
    const S = s.current;
    if (S.y > at[1] + 0.001 || Math.abs(S.v) > 0.05) {
      S.v -= 22 * d;
      S.y += S.v * d;
      if (S.y < at[1]) {
        S.y = at[1];
        if (Math.abs(S.v) > 0.8) S.sq = Math.min(0.35, Math.abs(S.v) * 0.05);
        S.v = -S.v * 0.32;
        if (Math.abs(S.v) < 0.6) S.v = 0;
      }
    } else S.y += (at[1] - S.y) * Math.min(1, d * 14);
    S.sq *= Math.pow(0.0005, d);
    grp.position.set(at[0], S.y, at[2]);
    grp.scale.set(scale * (1 + S.sq), scale * (1 - S.sq * 1.4), scale * (1 + S.sq));
  });
  return (
    <group
      ref={g}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        if (!onPick) return;
        e.stopPropagation();
        onPick();
      }}
    >
      <primitive object={obj} />
    </group>
  );
}

function layout(items: string[], cat: string | null) {
  const baseKey = cat ? BASE_OF[cat] : null;
  const baseH = baseKey ? buildIng(baseKey, true).h * (baseKey === 'ciotola' ? 0.75 : 1) : 0;
  const out: { name: string; at: [number, number, number]; scale: number }[] = [];
  if (cat && STACKED.has(cat)) {
    let y = baseH;
    items.forEach((n, i) => {
      out.push({ name: n, at: [Math.sin(i * 2.7) * 0.03, y, Math.cos(i * 1.9) * 0.03], scale: 1 });
      y += buildIng(n, true).h * 0.92;
    });
    return { out, baseKey, top: y };
  }
  let ys = baseH;
  let k = 0;
  items.forEach((n) => {
    if (isSpread(n)) {
      out.push({ name: n, at: [0, ys, 0], scale: cat === 'dolci' ? 1.1 : 0.9 });
      ys += 0.03;
    }
  });
  items.forEach((n) => {
    if (isSpread(n)) return;
    const a = k * 2.4;
    const r = k === 0 && items.length === 1 ? 0 : 0.14 + 0.07 * (k % 3);
    out.push({ name: n, at: [Math.cos(a) * r, ys + (k >= 6 ? 0.08 : 0), Math.sin(a) * r], scale: items.length > 3 ? 0.7 : 0.85 });
    k++;
  });
  return { out, baseKey, top: ys };
}

function Plate({ items, cat, onRemove }: { items: string[]; cat: string | null; onRemove: (n: string) => void }) {
  const g = useRef<THREE.Group>(null);
  const shake = useRef(0);
  const base = useMemo(() => {
    const k = cat ? BASE_OF[cat] : null;
    return k ? buildIng(k, true).obj : null;
  }, [cat]);
  useEffect(() => stageBus.on((e) => {
    if (e.type === 'fail') shake.current = 0.5;
  }), []);
  useFrame((_, dt) => {
    if (!g.current) return;
    shake.current = Math.max(0, shake.current - dt);
    g.current.rotation.z = Math.sin(shake.current * 50) * shake.current * 0.3;
  });
  const { out } = layout(items, cat);
  return (
    <group ref={g} position={PLATE} scale={0.85}>
      <mesh geometry={G.cyl(0.62, 0.05, 20)} material={mat('#fbf7ef', { smooth: true, r: 0.5 })} position={[0, 0.025, 0]} receiveShadow castShadow />
      <mesh geometry={G.torus(0.6, 0.03, Math.PI * 2, 24)} material={mat('#e9dcc6', { smooth: true })} position={[0, 0.05, 0]} rotation={[Math.PI / 2, 0, 0]} />
      <group position={[0, 0.05, 0]}>
        {base && <primitive object={base} scale={cat === 'ciotola' ? 1 : 1.05} />}
        {out.map((o, i) => (
          <Drop key={`${o.name}|${i}`} name={o.name} at={o.at} scale={o.scale} onPick={() => onRemove(o.name)} />
        ))}
      </group>
    </group>
  );
}

/** il piatto pronto vola dal cliente; poi esplodono le monete */
function Flights() {
  const [list, setList] = useState<{ id: number; e: Extract<StageEvent, { type: 'serve' }>; t0: number }[]>([]);
  const clock = useThree((s) => s.clock);
  useEffect(
    () =>
      stageBus.on((e) => {
        if (e.type === 'serve') setList((l) => [...l, { id: Math.random(), e, t0: clock.elapsedTime }]);
      }),
    [clock],
  );
  return (
    <>
      {list.map((f) => (
        <Flight key={f.id} f={f} done={() => setList((l) => l.filter((x) => x.id !== f.id))} />
      ))}
    </>
  );
}

function Flight({ f, done }: { f: { e: Extract<StageEvent, { type: 'serve' }>; t0: number }; done: () => void }) {
  const g = useRef<THREE.Group>(null);
  const top = useRef<THREE.Group>(null);
  const { out, baseKey, top: topY } = useMemo(() => layout(f.e.items, f.e.cat), [f]);
  const objs = useMemo(() => out.map((o) => buildIng(o.name, true).obj), [out]);
  const base = useMemo(() => (baseKey ? buildIng(baseKey, true).obj : null), [baseKey]);
  const lid = useMemo(() => (f.e.cat === 'hamburger' ? buildIng('buntop', true).obj : null), [f]);
  const [coins, setCoins] = useState(false);
  useFrame(({ clock }) => {
    const e = clock.elapsedTime - f.t0;
    const grp = g.current;
    if (!grp) return;
    if (top.current) top.current.position.y = topY + Math.max(0, 0.6 - e * 4);
    const k = Math.max(0, Math.min(1, (e - 0.18) / 0.45));
    const to = [SLOT_X[f.e.slot], 1.05, WAIT_Z + 0.35];
    grp.position.set(PLATE[0] + (to[0] - PLATE[0]) * k, PLATE[1] + 0.05 + (to[1] - PLATE[1]) * k + Math.sin(k * Math.PI) * 0.9, PLATE[2] + (to[2] - PLATE[2]) * k);
    grp.scale.setScalar(1 - k * 0.45);
    grp.rotation.y = k * 2;
    if (k >= 1 && !coins) setCoins(true);
    grp.visible = k < 1;
    if (e > 2) done();
  });
  return (
    <>
      <group ref={g} position={PLATE}>
        {base && <primitive object={base} />}
        {out.map((o, i) => (
          <primitive key={i} object={objs[i]} position={o.at} scale={o.scale} />
        ))}
        {lid && (
          <group ref={top}>
            <primitive object={lid} />
          </group>
        )}
      </group>
      {coins && <Coins at={[SLOT_X[f.e.slot], 1.3, WAIT_Z + 0.3]} n={Math.min(14, 4 + Math.round(f.e.coins / 3))} gold={f.e.vip} />}
    </>
  );
}

function Coins({ at, n, gold }: { at: [number, number, number]; n: number; gold: boolean }) {
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const ps = useMemo(
    () => Array.from({ length: n }, () => ({ p: new THREE.Vector3(...at), v: new THREE.Vector3((Math.random() - 0.5) * 3, 3 + Math.random() * 2.5, 0.8 + Math.random() * 1.5), r: Math.random() * 6, life: 0 })),
    [at, n],
  );
  useFrame((_, dt) => {
    const d = Math.min(dt, 0.04);
    ps.forEach((q, i) => {
      q.life += d;
      q.v.y -= 9.8 * d;
      q.p.addScaledVector(q.v, d);
      q.r += d * 12;
      const m = refs.current[i];
      if (m) {
        m.position.copy(q.p);
        m.rotation.set(q.r, q.r * 0.6, 0);
        m.scale.setScalar(Math.max(0.001, 1 - Math.max(0, q.life - 0.7) * 2.5));
      }
    });
  });
  return (
    <>
      {ps.map((_, i) => (
        <mesh key={i} ref={(m) => (refs.current[i] = m)} geometry={G.cyl(0.08, 0.025, 12)} material={mat(gold ? '#ffcf4a' : '#e3a83a', { r: 0.35, e: 0.15 })} rotation={[Math.PI / 2, 0, 0]} />
      ))}
    </>
  );
}

function Chef({ skin, pose }: { skin: ChefSkin; pose: 'idle' | 'work' | 'cheer' | 'sad' }) {
  const g = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (!g.current) return;
    // lavora girato verso il piatto, si volta verso di te per festeggiare (o per farti la faccia preoccupata)
    const target = pose === 'cheer' || pose === 'sad' ? 0.35 : Math.PI - 0.95;
    g.current.rotation.y = THREE.MathUtils.lerp(g.current.rotation.y, target, 1 - Math.pow(0.002, dt));
  });
  return (
    <group ref={g} position={[-0.95, 0, 1.35]} rotation={[0, Math.PI - 0.95, 0]} scale={0.95}>
      <Person3D look={CHEF_LOOK} chef={skin} pose={pose} mood={pose === 'cheer' ? 'happy' : pose === 'sad' ? 'worried' : 'idle'} />
    </group>
  );
}

function Rig({ fever }: { fever: boolean }) {
  const shake = useRef(0);
  const cur = useRef(CAM.clone());
  useEffect(() => stageBus.on((e) => {
    if (e.type === 'fail') shake.current = 0.35;
  }), []);
  useFrame(({ camera, clock }, dt) => {
    shake.current = Math.max(0, shake.current - dt);
    const want = CAM.clone().add(new THREE.Vector3(tilt.x * 0.45, -tilt.y * 0.25, 0));
    cur.current.lerp(want, 1 - Math.pow(0.02, dt));
    camera.position.copy(cur.current);
    if (shake.current) camera.position.add(new THREE.Vector3((Math.random() - 0.5) * shake.current * 0.3, (Math.random() - 0.5) * shake.current * 0.3, 0));
    const pc = camera as THREE.PerspectiveCamera;
    const fov = 37 + (fever ? Math.sin(clock.elapsedTime * 8) * 0.6 : 0);
    if (Math.abs(pc.fov - fov) > 0.01) {
      pc.fov = fov;
      pc.updateProjectionMatrix();
    }
    camera.lookAt(LOOK);
  });
  return null;
}

export function Stage3D({
  customers, onSelect, plate, cat, onRemove, build, night, skin, chefPose, fever,
}: {
  customers: StageCust[];
  onSelect: (id: number) => void;
  plate: string[];
  cat: string | null;
  onRemove: (n: string) => void;
  build: Record<string, number>;
  night: number;
  skin: ChefSkin;
  chefPose: 'idle' | 'work' | 'cheer' | 'sad';
  fever: boolean;
}) {
  useEffect(startTilt, []);
  return (
    <Canvas className="stage3d" shadows flat dpr={[1, 1.75]} camera={{ position: CAM.toArray(), fov: 37, near: 0.1, far: 60 }} gl={{ antialias: true, powerPreference: 'high-performance' }}>
      <color attach="background" args={['#2b1a3a']} />
      <Lights night={night} />
      <Rig fever={fever} />
      <Pizzeria build={build} night={night} />
      {customers.map((c) => <Customer key={c.id} c={c} onSelect={onSelect} />)}
      <Plate items={plate} cat={cat} onRemove={onRemove} />
      <Chef skin={skin} pose={chefPose} />
      <Flights />
    </Canvas>
  );
}

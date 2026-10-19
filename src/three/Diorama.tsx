import { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { Lights, Pizzeria } from './Pizzeria';
import { EnvLight, GL_PROPS, Post } from './look';
import { skyColors } from './World';
import { Person3D, type Pose3 } from './Person3D';
import { CHEF_LOOK, type Look } from '../components/Person';
import type { ChefSkin } from '../lib/skins';

const REGULAR: Look = { skin: '#f1c27d', hair: '#b23a2e', style: 1, shirt: '#5b8db8', extra: 1 };

/** il cuoco saluta ogni tanto, poi torna a lavorare */
function Chef({ skin }: { skin: ChefSkin }) {
  const [pose, setPose] = useState<Pose3>('wave');
  const t = useRef(0);
  useFrame((_, dt) => {
    t.current += dt;
    const c = t.current % 7;
    const p: Pose3 = c < 1.6 ? 'wave' : c < 4.5 ? 'work' : 'idle';
    if (p !== pose) setPose(p);
  });
  return (
    <group position={[0.6, 0, 1.6]} rotation={[0, 0.45, 0]} scale={1.1}>
      <Person3D look={CHEF_LOOK} chef={skin} pose={pose} mood="happy" />
    </group>
  );
}

/** dove compare ogni miglioria ancora da costruire */
const SPOTS: Record<string, [number, number, number]> = {
  frigo: [3.1, 1.1, -1.6], campanello: [1.15, 1.0, -0.55], mise: [-3.5, 1.8, -0.3], garzone: [-1.75, 1.2, -2.25], cronometro: [2.15, 2.6, -2.8],
  piante: [-3.2, 0.7, 0.9], quadri: [1.05, 1.85, -2.8], luci: [-0.4, 2.9, -2.2], tavolini: [-1.0, 1.0, -4.4],
};

export function Diorama({ build, skin, onPick, ghosts = [] }: { build: Record<string, number>; skin: ChefSkin; onPick: (id: string) => void; ghosts?: { id: string; can: boolean }[] }) {
  // fuori dallo schermo non disegna: niente batteria sprecata mentre scorri la home
  const ref = useRef<HTMLCanvasElement>(null);
  const [vis, setVis] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(([e]) => setVis(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Canvas ref={ref} frameloop={vis ? 'always' : 'never'} className="diorama3d" shadows="soft" dpr={[1, 1.75]} camera={{ position: [10, 8.4, 12.2], fov: 30, near: 0.5, far: 200 }} gl={GL_PROPS}>
      <fog attach="fog" args={[skyColors(0.12).horizon, 30, 90]} />
      <EnvLight intensity={0.22} />
      <Lights night={0.12} />
      <Post bloom={0.5} />
      <group position={[0, -0.6, 0]}>
        <Pizzeria build={build} night={0.12} cutaway onPick={onPick} />
        {ghosts.filter((g) => SPOTS[g.id]).map((g) => (
          <Html key={g.id} position={SPOTS[g.id]} center zIndexRange={[5, 0]}>
            <button className={`ghost-up ${g.can ? 'can' : ''}`} onClick={() => onPick(g.id)} aria-label={`Costruisci ${g.id}`}>+</button>
          </Html>
        ))}
        <Chef skin={skin} />
        <group position={[-1.55, 0, -1.3]} scale={1.05}>
          <Person3D look={REGULAR} mood="happy" pose="idle" seed={9} />
        </group>
      </group>
      <OrbitControls
        target={new THREE.Vector3(0, 0.2, -0.9)}
        enablePan={false}
        enableZoom
        minDistance={9}
        maxDistance={24}
        enableDamping
        rotateSpeed={0.6}
        minPolarAngle={0.55}
        maxPolarAngle={1.25}
        minAzimuthAngle={-0.6}
        maxAzimuthAngle={1.4}
      />
    </Canvas>
  );
}

function Spin({ children }: { children: React.ReactNode }) {
  const g = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (g.current) g.current.rotation.y += dt * 0.6;
  });
  return <group ref={g}>{children}</group>;
}

/** anteprima 3D della divisa nel guardaroba */
export function ChefPreview({ skin }: { skin: ChefSkin }) {
  return (
    <Canvas className="chef3d" dpr={[1, 1.75]} camera={{ position: [0, 0.2, 3.2], fov: 30 }} gl={{ ...GL_PROPS, alpha: true }}>
      <EnvLight intensity={0.7} />
      <hemisphereLight args={['#fff1dc', '#9a6a52', 0.8]} />
      <directionalLight position={[2, 4, 3]} intensity={2.2} />
      <group position={[0, -0.62, 0]}>
        <Spin>
          <Person3D look={CHEF_LOOK} chef={skin} pose="wave" mood="happy" />
        </Spin>
        <mesh position={[0, -0.03, 0]}>
          <cylinderGeometry args={[0.6, 0.65, 0.06, 24]} />
          <meshStandardMaterial color="#e6dccd" />
        </mesh>
      </group>
    </Canvas>
  );
}

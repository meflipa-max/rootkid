import { Component, Suspense, useMemo, type ReactNode } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Un oggetto d'arredo preso dai pacchetti CC0 (vedi public/models/CREDITS.md).
 *
 * I modelli non arrivano con la nostra scala né con lo stesso punto d'appoggio, quindi li
 * misuriamo e li rimettiamo a posto da soli: centrati su x/z, appoggiati su y = 0 e alti
 * quanto diciamo noi. Così si piazzano come un qualunque oggetto fatto in casa.
 *
 * Se il file non c'è si vede il ripiego (l'oggetto disegnato in codice): il locale non resta
 * mai con un buco al posto del frigo.
 */

const DIR = `${import.meta.env.BASE_URL}models/furniture/`;

type V3 = [number, number, number];

function Model({ file, tall, position = [0, 0, 0], rotation, flip }: { file: string; tall: number; position?: V3; rotation?: V3; flip?: boolean }) {
  const { scene } = useGLTF(DIR + file + '.glb');
  const obj = useMemo(() => {
    const o = scene.clone(true);
    o.traverse((m) => {
      if ((m as THREE.Mesh).isMesh) {
        m.castShadow = true;
        m.receiveShadow = true;
      }
    });
    const box = new THREE.Box3().setFromObject(o);
    const h = box.max.y - box.min.y;
    const k = h > 0.001 ? tall / h : 1;
    const mid = box.getCenter(new THREE.Vector3());
    // il gruppo esterno tiene posizione e rotazione: qui dentro solo scala e centratura
    const g = new THREE.Group();
    o.position.set(-mid.x * k, -box.min.y * k, -mid.z * k);
    o.scale.setScalar(k);
    g.add(o);
    return g;
  }, [scene, tall]);
  return <primitive object={obj} position={position} rotation={rotation ?? [0, 0, 0]} scale={flip ? ([-1, 1, 1] as V3) : 1} />;
}

class Spare extends Component<{ children: ReactNode; spare: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.spare : this.props.children;
  }
}

export function Kit({ file, tall, spare, ...rest }: { file: string; tall: number; spare?: ReactNode; position?: V3; rotation?: V3; flip?: boolean }) {
  return (
    <Spare spare={spare}>
      <Suspense fallback={spare}>
        <Model file={file} tall={tall} {...rest} />
      </Suspense>
    </Spare>
  );
}

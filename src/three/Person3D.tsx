import { Component, Suspense, useLayoutEffect, useMemo, useRef, type ReactNode } from 'react';
import { createPortal } from '@react-three/fiber';
import { useAnimations, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';
import { Crown, PersonMesh, type Pose3 } from './PersonMesh';
import type { Look, Mood } from '../components/Person';
import type { ChefSkin } from '../lib/skins';

/**
 * I personaggi del gioco: modelli CC0 riggati (Kenney Mini Characters, vedi public/models/CREDITS.md)
 * con le loro animazioni. Le 12 varianti condividono scheletro e animazioni, quindi i movimenti
 * stanno in un file solo e li riusiamo su tutti.
 *
 * Se i modelli non si caricano si vedono i personaggi disegnati in codice (PersonMesh): stesse
 * pose, stesse props, solo meno dettaglio. Il gioco non si ferma mai per un file mancante.
 */
export type { Pose3 } from './PersonMesh';

export interface PersonProps {
  look: Look;
  mood?: Mood;
  pose?: Pose3;
  chef?: ChefSkin;
  crown?: boolean;
  seed?: number;
}

const DIR = `${import.meta.env.BASE_URL}models/characters/`;
const NAMES = ['a', 'b', 'c', 'd', 'e', 'f'].flatMap((l) => [`character-male-${l}`, `character-female-${l}`]);
/** le animazioni stanno solo qui: i canali puntano ai nomi delle ossa, uguali in tutte le varianti */
const RIG = `${DIR}character-male-a.glb`;
/**
 * I modelli del pacchetto non hanno la nostra scala e sono anche più tozzi dei personaggi
 * disegnati in codice: li riportiamo a questa altezza, un filo sotto a quella del ripiego,
 * perché a parità di altezza occupano più spazio e sembrerebbero giganti nel locale.
 */
const TALL = 1.02;

/** le pose del gioco tradotte nelle animazioni del pacchetto, con la velocità che le fa leggere bene */
const CLIP: Record<Pose3, { name: string; speed?: number }> = {
  idle: { name: 'idle' },
  walk: { name: 'walk', speed: 1.35 },
  work: { name: 'interact-right', speed: 0.9 },
  cheer: { name: 'jump', speed: 1.1 },
  wave: { name: 'emote-yes' },
  tap: { name: 'emote-no', speed: 1.5 }, // impaziente: scuote la testa, svelto
  sad: { name: 'emote-no', speed: 0.6 },
};

const hash = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};

/** stesso aspetto ⇒ stesso modello: un cliente non cambia faccia mentre aspetta */
/** il cuoco è sempre Giuseppe, il pizzaiolo vero: fatto in Blender da tools/giuseppe.py */
const modelFor = (look: Look, chef?: ChefSkin) =>
  chef ? 'giuseppe' : NAMES[hash(`${look.skin}${look.hair}${look.shirt}${look.style}${look.extra}`) % NAMES.length];

function PersonGLB({ look, pose = 'idle', chef, crown, seed = 0 }: PersonProps) {
  const url = DIR + modelFor(look, chef) + '.glb';
  const { scene } = useGLTF(url);
  const { animations } = useGLTF(RIG);
  const root = useRef<THREE.Group>(null);

  // ogni personaggio ha bisogno del suo scheletro: SkeletonUtils copia anche le ossa
  const model = useMemo(() => {
    const c = SkeletonUtils.clone(scene) as THREE.Group;
    // le divise del Guardaroba su Giuseppe: berretto, maglietta e logo prendono i colori della divisa
    // ("Classico" è il Giuseppe vero, col berretto nero)
    const tint: Record<string, string> | null = chef && chef.id !== 'classic' ? { berretto: chef.hat, maglietta: chef.shirt, logo: chef.apron, cuciture: chef.apron } : null;
    c.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      m.castShadow = true;
      m.receiveShadow = true;
      if (!tint) return;
      const recolor = (x: THREE.Material) => {
        const col = tint[x.name.replace(/\.\d+$/, '')]; // Blender aggiunge .001 ai nomi doppi
        if (!col) return x;
        const y = (x as THREE.MeshStandardMaterial).clone();
        y.color.set(col);
        return y;
      };
      m.material = Array.isArray(m.material) ? m.material.map(recolor) : recolor(m.material);
    });
    return c;
  }, [scene, chef]);

  // il pacchetto non usa la stessa scala del resto della scena: lo riportiamo alla nostra altezza
  const k = useMemo(() => {
    const box = new THREE.Box3().setFromObject(model);
    const h = box.max.y - box.min.y;
    return h > 0.01 ? TALL / h : 1;
  }, [model]);

  const head = useMemo(() => model.getObjectByName('head'), [model]);
  const { actions } = useAnimations(animations, root);

  useLayoutEffect(() => {
    const { name, speed = 1 } = CLIP[pose];
    const next = actions[name] ?? actions.idle;
    if (!next) return;
    next.timeScale = speed;
    next.reset().fadeIn(0.22).play();
    // sfasa i cicli: una fila di clienti non deve respirare all'unisono
    next.time = (seed * 0.37) % (next.getClip().duration || 1);
    return () => {
      next.fadeOut(0.22);
    };
  }, [actions, pose, seed]);

  return (
    <group ref={root}>
      <primitive object={model} scale={k} />
      {head &&
        createPortal(
          // dentro all'osso le misure sono quelle del modello: la scala 1/k le riporta alle nostre,
          // così cappello e corona restano quelli disegnati a mano, con le stesse proporzioni
          <group scale={1 / k}>
            {crown && !chef && <Crown position={[0, 0.37, -0.02]} rotation={[-0.18, 0, 0.12]} />}
          </group>,
          head,
        )}
    </group>
  );
}

/** se un modello non arriva (offline, file cancellato) si continua con i personaggi in codice */
class Fallback extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export function Person3D(props: PersonProps) {
  const spare = <PersonMesh {...props} />;
  return (
    <Fallback fallback={spare}>
      <Suspense fallback={spare}>
        <PersonGLB {...props} />
      </Suspense>
    </Fallback>
  );
}

// le animazioni servono a chiunque: quelle le prendiamo subito, i corpi quando servono
useGLTF.preload(RIG);

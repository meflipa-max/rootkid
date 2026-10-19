import { useEffect, useState } from 'react';
import { useThree } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import { Bloom, BrightnessContrast, EffectComposer, HueSaturation, N8AO, ToneMapping, Vignette } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RGBELoader } from 'three-stdlib';

/**
 * L'"aspetto da gioco": luce d'ambiente morbida (environment map), tone mapping cinematografico,
 * occlusione ambientale negli angoli, bagliore su lampade e fuoco, vignettatura.
 * Se il telefono non regge, scende da solo alla qualità bassa (senza effetti) e se lo ricorda.
 */

export type Quality = 'high' | 'low';
const KEY = 'cac-q3d';
/** ?q=high / ?q=low nell'indirizzo forza la qualita' (per provare su un telefono specifico) */
const forced = (() => {
  try {
    const q = new URLSearchParams(location.search).get('q');
    return q === 'high' || q === 'low' ? (q as Quality) : null;
  } catch {
    return null;
  }
})();
let current: Quality = forced ?? (() => {
  try {
    return (localStorage.getItem(KEY) as Quality) || 'high';
  } catch {
    return 'high';
  }
})();
const subs = new Set<(q: Quality) => void>();
export function setQuality(q: Quality) {
  if (forced) return;
  current = q;
  try {
    localStorage.setItem(KEY, q);
  } catch {
    /* niente */
  }
  subs.forEach((f) => f(q));
}
export function useQuality() {
  const [q, setQ] = useState(current);
  useEffect(() => {
    subs.add(setQ);
    return () => {
      subs.delete(setQ);
    };
  }, []);
  return q;
}

export const GL_PROPS = {
  antialias: true,
  powerPreference: 'high-performance' as const,
  // Neutral tiene i colori pieni (ACES li sbiadisce): meglio per uno stile da cartone
  toneMapping: THREE.NeutralToneMapping,
  toneMappingExposure: 1.0,
};

/**
 * Luce riflessa dell'ambiente. Parte subito con lo studio generato in locale (così non c'è mai
 * un fotogramma al buio), poi passa all'HDRI di Poly Haven appena è scaricato: è una bottega
 * vera, quindi dà riflessi caldi e irregolari che un ambiente finto non ha.
 * Se l'HDRI non arriva (offline, file mancante) resta lo studio: la scena funziona lo stesso.
 */
const HDRI = `${import.meta.env.BASE_URL}models/hdri/artist_workshop.hdr`;
let hdrLoad: Promise<THREE.DataTexture> | null = null;
const loadHdr = () => (hdrLoad ??= new Promise<THREE.DataTexture>((ok, no) => new RGBELoader().load(HDRI, ok, undefined, no)));
/** la mappa cotta vive nel contesto del suo renderer: una per Canvas, non si può riusare altrove */
const cooked = new WeakMap<THREE.WebGLRenderer, THREE.Texture>();

export function EnvLight({ intensity = 0.55 }: { intensity?: number }) {
  const { gl, scene } = useThree();
  useEffect(() => {
    let alive = true;
    const s = scene as THREE.Scene & { environmentIntensity?: number };
    const use = (tex: THREE.Texture) => {
      if (!alive) return;
      s.environment = tex;
      s.environmentIntensity = intensity;
    };
    const ready = cooked.get(gl);
    if (ready) {
      use(ready);
      return () => {
        alive = false;
        s.environment = null;
      };
    }
    const pm = new THREE.PMREMGenerator(gl);
    const room = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    use(room);
    loadHdr()
      .then((tex) => {
        // il Canvas è già andato via: lo studio non lo usa più nessuno
        if (!alive) return room.dispose();
        const env = pm.fromEquirectangular(tex).texture;
        tex.dispose();
        cooked.set(gl, env);
        use(env);
        room.dispose();
      })
      .catch(() => cooked.set(gl, room))
      .finally(() => pm.dispose());
    return () => {
      alive = false;
      s.environment = null;
    };
  }, [gl, scene, intensity]);
  return null;
}

export function Post({ bloom = 0.7, ao = true }: { bloom?: number; ao?: boolean }) {
  const q = useQuality();
  return (
    <>
      {!forced && <PerformanceMonitor onDecline={() => setQuality('low')} flipflops={2} />}
      {q === 'high' && (
        <EffectComposer multisampling={4}>
          {ao ? <N8AO aoRadius={0.55} distanceFalloff={0.7} intensity={2.4} color="#3a2216" halfRes quality="performance" /> : <></>}
          <Bloom mipmapBlur intensity={bloom} luminanceThreshold={0.9} luminanceSmoothing={0.25} />
          <ToneMapping mode={ToneMappingMode.NEUTRAL} />
          <HueSaturation saturation={0.14} />
          <BrightnessContrast contrast={0.08} />
          <Vignette offset={0.28} darkness={0.5} />
        </EffectComposer>
      )}
    </>
  );
}

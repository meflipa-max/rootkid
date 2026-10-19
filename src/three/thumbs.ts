import * as THREE from 'three';
import { useSyncExternalStore } from 'react';
import { buildIng, parseIng } from './ingredients';

/**
 * Icone degli ingredienti renderizzate dai modelli 3D (una volta sola, poi in cache come immagini):
 * così tile, scontrino, chip e liste hanno lo stesso stile della scena.
 */

let gl: boolean | null = null;
export function hasWebGL() {
  if (gl !== null) return gl;
  try {
    const c = document.createElement('canvas');
    gl = !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    gl = false;
  }
  return gl;
}

const SIZE = 144;
const cache = new Map<string, string>();
const queue: string[] = [];
const subs = new Set<() => void>();
let renderer: THREE.WebGLRenderer | null = null;
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let busy = false;
let fontsReady: Promise<unknown> | null = null;

function setup() {
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(SIZE, SIZE, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight('#fff4e2', '#a07a64', 1.6));
  const key = new THREE.DirectionalLight('#fff1dc', 2.2);
  key.position.set(2, 4, 3);
  scene.add(key);
  const rim = new THREE.DirectionalLight('#c9dcff', 0.7);
  rim.position.set(-3, 2, -2);
  scene.add(rim);
  camera = new THREE.PerspectiveCamera(28, 1, 0.1, 50);
}

const box = new THREE.Box3();
const sphere = new THREE.Sphere();

function render(name: string): string {
  if (!renderer) setup();
  const info = parseIng(name);
  const { obj } = buildIng(name, false);
  obj.rotation.y = -0.35;
  scene.add(obj);
  box.setFromObject(obj).getBoundingSphere(sphere);
  const dist = sphere.radius / Math.sin(THREE.MathUtils.degToRad(14)) * 1.02;
  const dir = new THREE.Vector3(0, 0.62, 1).normalize();
  camera.position.copy(sphere.center).addScaledVector(dir, dist);
  camera.lookAt(sphere.center);
  renderer!.render(scene, camera);
  scene.remove(obj);

  const out = document.createElement('canvas');
  out.width = out.height = SIZE;
  const g = out.getContext('2d')!;
  g.drawImage(renderer!.domElement, 0, 0);
  const font = (px: number) => `700 ${px}px Fredoka, Nunito, system-ui, sans-serif`;
  if (info.onlyCount && info.count) {
    // gettone col numero dei pezzi
    g.fillStyle = '#5a3b00';
    g.font = font(info.count.length > 2 ? 40 : 52);
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(info.count, SIZE / 2, SIZE / 2 + 6);
  } else if (info.count) {
    const t = `×${info.count}`;
    g.font = font(30);
    const w = g.measureText(t).width + 20;
    const x = SIZE - w - 2;
    const y = 4;
    g.fillStyle = '#2b211c';
    g.beginPath();
    g.roundRect(x, y, w, 40, 20);
    g.fill();
    g.fillStyle = '#fffaf2';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(t, x + w / 2, y + 22);
  }
  return out.toDataURL('image/png');
}

function pump() {
  if (busy || !queue.length) return;
  busy = true;
  const run = () => {
    const t0 = performance.now();
    while (queue.length && performance.now() - t0 < 12) {
      const n = queue.shift()!;
      if (cache.has(n)) continue;
      try {
        cache.set(n, render(n));
      } catch {
        cache.set(n, '');
      }
    }
    subs.forEach((f) => f());
    if (queue.length) requestAnimationFrame(run);
    else busy = false;
  };
  fontsReady ??= (document.fonts?.ready ?? Promise.resolve()).catch(() => undefined);
  void fontsReady.then(() => requestAnimationFrame(run));
}

const norm = (n: string) => n.trim().toLowerCase();

/** genera in anticipo le icone (es. tutti gli ingredienti del menu) così in turno sono già pronte */
export function prewarm(names: string[]) {
  if (!hasWebGL()) return;
  for (const n of names) thumbOf(n);
}

export function thumbOf(name: string): string | undefined {
  const k = norm(name);
  const v = cache.get(k);
  if (v === undefined && !queue.includes(k)) {
    queue.push(k);
    pump();
  }
  return v;
}

const subscribe = (f: () => void) => {
  subs.add(f);
  return () => subs.delete(f);
};

export function useThumb(name: string): string | undefined {
  return useSyncExternalStore(subscribe, () => thumbOf(name));
}

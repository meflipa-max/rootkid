import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';

/**
 * Ingredienti modellati in Blender (tools/ingredients.py): quelli che disegnati in codice si confondevano
 * (latticini bianchi, funghi, creme, salumi, verdure cotte, fritti, kebab e pulled pork, formaggi duri).
 * Il file si carica una volta all'avvio; finché non c'è (o se non si carica) resta il disegno in codice.
 * `buildIng` è sincrono, quindi qui c'è una cache pronta da clonare, non useGLTF.
 */
const URL = '/models/ingredients/ingredients.glb';

/** nome dell'ingrediente (minuscolo, senza quantità) -> modello Blender. L'ordine conta: prima i nomi più precisi. */
const MODEL_KEYS: [RegExp, string][] = [
  [/stracciatella/, 'stracciatella'],
  [/burrata/, 'burrata'],
  [/bufala/, 'bufala'],
  [/fior di latte/, 'fiordilatte'],
  [/crema di funghi/, 'cfunghi'],
  [/crema di zucca/, 'czucca'],
  [/crema di zucchine/, 'czucchine'],
  [/cacio e pepe/, 'ccacio'],
  [/crema (al|di) gorgonzola/, 'cgorgo'],
  [/crema di radicchio/, 'cradicchio'],
  [/pesto/, 'pesto'],
  [/san marzano/, 'smarzano'],
  [/pelato giallo/, 'pgiallo'],
  [/glassa|balsamico/, 'balsamico'],
  [/porcini (panati|fritti)/, 'porcinifritti'],
  [/porcini/, 'porcini'],
  [/funghi misti/, 'misti'],
  [/funghi freschi|champignon/, 'freschi'],
  [/^funghi$/, 'funghi'],
  [/salamino/, 'salamino'],
  [/spianata/, 'spianata'],
  [/capocollo/, 'capocollo'],
  [/^speck$/, 'speck'],
  [/crudo/, 'crudo'],
  [/prosciutto cotto|^cotto$/, 'cotto'],
  [/pancetta coppata/, 'pcoppata'],
  [/guanciale/, 'guanciale'],
  [/^pancetta$/, 'pancetta'],
  [/salsiccia di norcia/, 'norcia'],
  [/salsiccia/, 'salsiccia'],
  [/friariell/, 'friarielli'],
  [/cicori/, 'cicoria'],
  [/spinaci/, 'spinaci'],
  [/peperoncin/, 'peperoncino'],
  [/scattarisciat/, 'scattarisciati'],
  [/pittul/, 'pittule'],
  // i panzerotti di patate sono crocchette di patate: stesso cibo, stesso disegno
  [/panzerotti di patate|crocchett/, 'crocchette'],
  [/calzon|panzerott/, 'calzoncini'],
  [/patate al forno/, 'patforno'],
  [/patate saltate/, 'patsaltate'],
  [/kebab/, 'kebab'],
  [/pulled/, 'pulled'],
  [/grana/, 'grana'],
  [/parmigiano/, 'parmigiano'],
  [/cacioricotta/, 'cacioricotta'],
];

/**
 * Modelli che sono solo icona: sulla pizza resta lo strato disegnato in codice
 * (le creme sono spalmate, il grana in scaglie).
 */
const ICON_ONLY = new Set(['cfunghi', 'czucca', 'czucchine', 'ccacio', 'cgorgo', 'cradicchio', 'pesto', 'smarzano', 'pgiallo', 'balsamico', 'grana']);

const models = new Map<string, THREE.Object3D>();
const heights = new Map<string, number>();
let state: 'idle' | 'loading' | 'ready' | 'failed' = 'idle';
const subs = new Set<() => void>();

export const modelsReady = () => state === 'ready';
/** avvisa quando i modelli sono arrivati (icone e altezze vanno rifatte) */
export function onModels(f: () => void) {
  subs.add(f);
  return () => {
    subs.delete(f);
  };
}

export function loadIngredientModels() {
  if (state !== 'idle') return;
  state = 'loading';
  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  loader.load(
    URL,
    (gltf) => {
      gltf.scene.updateMatrixWorld(true);
      for (const node of [...gltf.scene.children]) {
        node.position.set(0, 0, 0);
        node.traverse((o) => {
          const m = o as THREE.Mesh;
          if (!m.isMesh) return;
          m.castShadow = true;
          m.receiveShadow = true;
          // stesso aspetto "giocattolo opaco" del resto: niente metallo
          const mats = Array.isArray(m.material) ? m.material : [m.material];
          for (const x of mats) if ((x as THREE.MeshStandardMaterial).isMeshStandardMaterial) (x as THREE.MeshStandardMaterial).metalness = 0;
        });
        models.set(node.name, node);
      }
      state = 'ready';
      subs.forEach((f) => f());
    },
    undefined,
    () => {
      // niente file (offline la prima volta, o errore): restano i disegni in codice
      state = 'failed';
    },
  );
}

/** quale modello Blender usa un ingrediente, se c'è */
export function modelIdOf(name: string): string | null {
  const s = name.trim().toLowerCase().replace(/^\d+(\/\d+)?\s+/, '');
  for (const [re, id] of MODEL_KEYS) if (re.test(s)) return id;
  return null;
}

/** il modello Blender dell'ingrediente (icona o versione bassa per il piatto), o null per usare il disegno in codice */
export function modelFor(name: string, layer: boolean): { obj: THREE.Group; h: number } | null {
  if (state !== 'ready') return null;
  const id = modelIdOf(name);
  if (!id) return null;
  if (layer && ICON_ONLY.has(id)) return null;
  const key = layer && models.has(`${id}__layer`) ? `${id}__layer` : id;
  const src = models.get(key);
  if (!src) return null;
  const g = new THREE.Group();
  g.add(src.clone(true));
  let h = heights.get(key);
  if (h === undefined) {
    h = new THREE.Box3().setFromObject(src).max.y;
    heights.set(key, h);
  }
  return { obj: g, h };
}

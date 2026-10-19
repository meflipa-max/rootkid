import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three-stdlib';
import { keyOf } from '../components/Ing';

/**
 * Ingredienti 3D low-poly, costruiti in codice: stesso stile "giocattolo opaco" per tutto il menu,
 * anche per i prodotti locali che non esistono nei pacchetti di modelli (pittule, Tronky, stracciatella…).
 * y = 0 è la base: ogni modello "appoggia" sulla superficie. `layer` = versione da impilare sul piatto.
 */

type V3 = [number, number, number];

const mats = new Map<string, THREE.MeshStandardMaterial>();
/** materiale opaco "da giocattolo": liscio di default, sfaccettato solo dove serve (alberi, rocce, briciole) */
export function mat(color: string, o: { e?: number; r?: number; flat?: boolean; op?: number; m?: number } = {}) {
  const k = `${color}|${o.e ?? 0}|${o.r ?? 0.85}|${o.flat ? 1 : 0}|${o.op ?? 1}|${o.m ?? 0}`;
  let m = mats.get(k);
  if (!m) {
    m = new THREE.MeshStandardMaterial({
      color,
      roughness: o.r ?? 0.85,
      metalness: o.m ?? 0,
      flatShading: !!o.flat,
      emissive: o.e ? new THREE.Color(color) : new THREE.Color(0),
      emissiveIntensity: o.e ?? 0,
      transparent: (o.op ?? 1) < 1,
      opacity: o.op ?? 1,
    });
    mats.set(k, m);
  }
  return m;
}

const geos = new Map<string, THREE.BufferGeometry>();
const geo = <T extends THREE.BufferGeometry>(k: string, make: () => T): T => {
  let g = geos.get(k) as T | undefined;
  if (!g) {
    g = make();
    geos.set(k, g);
  }
  return g;
};
export const G = {
  cyl: (r: number, h: number, seg = 10, r2 = r, theta = Math.PI * 2) =>
    geo(`c${r}|${h}|${seg}|${r2}|${theta}`, () => new THREE.CylinderGeometry(r, r2, h, seg, 1, false, 0, theta)),
  ball: (r: number, d = 1) => geo(`b${r}|${d}`, () => new THREE.IcosahedronGeometry(r, d)),
  sphere: (r: number, seg = 24) => geo(`s${r}|${seg}`, () => new THREE.SphereGeometry(r, seg, Math.round(seg * 0.7))),
  dome: (r: number) => geo(`d${r}`, () => new THREE.SphereGeometry(r, 20, 8, 0, Math.PI * 2, 0, Math.PI / 2)),
  box: (w: number, h: number, d: number) => geo(`x${w}|${h}|${d}`, () => new THREE.BoxGeometry(w, h, d)),
  /** scatola con gli spigoli arrotondati: prende la luce come un giocattolo vero */
  rbox: (w: number, h: number, d: number, r = 0.04) => geo(`r${w}|${h}|${d}|${r}`, () => new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2.01, h / 2.01, d / 2.01))),
  cap: (r: number, l: number) => geo(`p${r}|${l}`, () => new THREE.CapsuleGeometry(r, l, 6, 14)),
  cone: (r: number, h: number, seg = 8) => geo(`o${r}|${h}|${seg}`, () => new THREE.ConeGeometry(r, h, seg)),
  torus: (R: number, t: number, arc = Math.PI * 2, seg = 12) => geo(`t${R}|${t}|${arc}|${seg}`, () => new THREE.TorusGeometry(R, t, 8, Math.max(seg, 16), arc)),
  dodeca: (r: number) => geo(`q${r}`, () => new THREE.DodecahedronGeometry(r, 0)),
};

class B {
  g = new THREE.Group();
  constructor(private seed: number) {}
  rnd() {
    let t = (this.seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  r(a: number, b: number) {
    return a + (b - a) * this.rnd();
  }
  add(g: THREE.BufferGeometry, c: string, p: V3 = [0, 0, 0], rot: V3 = [0, 0, 0], s: V3 = [1, 1, 1], o?: Parameters<typeof mat>[1]) {
    // briciole e pezzi irregolari restano sfaccettati, il resto è liscio
    const facet = g instanceof THREE.DodecahedronGeometry || (g instanceof THREE.IcosahedronGeometry && (g.parameters.detail ?? 0) < 1);
    const m = new THREE.Mesh(g, mat(c, { flat: facet, ...o }));
    m.position.set(...p);
    m.rotation.set(...rot);
    m.scale.set(...s);
    m.castShadow = true;
    m.receiveShadow = true;
    this.g.add(m);
    return m;
  }
  /** cilindro appoggiato: p è il centro della base */
  cyl(r: number, h: number, c: string, p: V3 = [0, 0, 0], s: V3 = [1, 1, 1], seg = 10, r2 = r) {
    return this.add(G.cyl(r, h, seg, r2), c, [p[0], p[1] + (h * s[1]) / 2, p[2]], [0, 0, 0], s);
  }
  ball(r: number, c: string, p: V3, s: V3 = [1, 1, 1], d = 1) {
    return this.add(d >= 1 ? G.sphere(r, 16) : G.ball(r, 0), c, p, [0, this.r(0, 6), 0], s);
  }
}

const hash = (s: string) => {
  let h = 2166136261;
  for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
};

// ---------- pezzi riutilizzabili ----------

function jar(b: B, body: string, lid = '#fbf7ef') {
  b.cyl(0.15, 0.3, body, [0, 0, 0], [1, 1, 1], 12);
  b.cyl(0.153, 0.12, '#fbf3e3', [0, 0.09, 0], [1, 1, 1], 12);
  b.cyl(0.155, 0.03, '#c65a3c', [0, 0.135, 0], [1, 1, 1], 12);
  b.cyl(0.158, 0.07, lid, [0, 0.3, 0], [1, 1, 1], 12);
  return 0.37;
}
function bottle(b: B, body: string, capc: string) {
  b.cyl(0.11, 0.34, body, [0, 0, 0], [1, 1, 1], 10);
  b.cyl(0.113, 0.12, '#fbf3e3', [0, 0.1, 0], [1, 1, 1], 10);
  b.add(G.cone(0.11, 0.1, 10), body, [0, 0.39, 0]);
  b.cyl(0.06, 0.05, capc, [0, 0.42, 0]);
  b.add(G.cone(0.035, 0.1, 8), capc, [0, 0.51, 0]);
  return 0.56;
}
function blob(b: B, c: string, n = 7, spread = 0.22) {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + b.r(0, 0.6);
    const d = i === 0 ? 0 : b.r(0.06, spread);
    b.ball(0.08, c, [Math.cos(a) * d, 0.02, Math.sin(a) * d], [1.2, 0.35, 1.2], 1);
  }
  return 0.05;
}
function spread(b: B, c: string) {
  b.cyl(0.29, 0.025, c, [0, 0, 0], [1, 1, 1], 12);
  b.add(G.torus(0.13, 0.025, Math.PI * 1.6), c, [0, 0.03, 0], [Math.PI / 2, 0, 0]);
  return 0.04;
}
/** n pezzi uguali disposti in cerchio */
function pieces(b: B, n: number, make: (x: number, z: number, i: number) => void) {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + 0.4;
    const d = n === 1 ? 0 : n <= 3 ? 0.12 : 0.17;
    make(Math.cos(a) * d, Math.sin(a) * d, i);
  }
}

// ---------- modelli ----------

type Build = (b: B, o: { layer: boolean; n: number; name: string }) => number;

const SAUCE: Record<string, [string, string]> = {
  mayo: ['#fff0bf', '#e3a83a'],
  bbq: ['#5a2410', '#2b211c'],
  sburger: ['#ec8a4c', '#c65a3c'],
  cesar: ['#efe2bd', '#6f9a6a'],
  bosc: ['#c9906c', '#8a5a3a'],
};

const ART: Record<string, Build> = {
  patty: (b) => {
    b.cyl(0.3, 0.1, '#6b3a22', [0, 0, 0], [1, 1, 1], 12);
    b.cyl(0.26, 0.012, '#7d4529', [0, 0.1, 0], [1, 1, 1], 12);
    for (let i = -1; i <= 1; i++) b.add(G.rbox(0.42, 0.012, 0.035), '#3d1f10', [i * 0.1, 0.112, 0], [0, 0.6, 0]);
    return 0.11;
  },
  veggie: (b) => {
    b.cyl(0.29, 0.1, '#7d8b3b', [0, 0, 0], [1, 1, 1], 12);
    for (let i = 0; i < 9; i++) b.ball(0.03, ['#e8c547', '#c4453a', '#5aa03b'][i % 3], [b.r(-0.18, 0.18), 0.1, b.r(-0.18, 0.18)], [1, 0.6, 1], 0);
    return 0.11;
  },
  pulled: (b) => {
    b.cyl(0.27, 0.05, '#8a3f22', [0, 0, 0], [1, 1, 1], 10);
    for (let i = 0; i < 16; i++) b.add(G.rbox(0.17, 0.03, 0.035), i % 2 ? '#a24a26' : '#7a3318', [b.r(-0.18, 0.18), b.r(0.06, 0.1), b.r(-0.18, 0.18)], [b.r(-0.3, 0.3), b.r(0, 3), 0]);
    return 0.11;
  },
  tenders: (b) => {
    for (let i = 0; i < 3; i++) b.add(G.cap(0.065, 0.2), '#d38a2c', [0, 0.065, (i - 1) * 0.13], [0, b.r(-0.3, 0.3), Math.PI / 2]);
    return 0.13;
  },
  cotoletta: (b) => {
    b.cyl(0.3, 0.06, '#d39538', [0, 0, 0], [1.25, 1, 0.85], 9);
    for (let i = 0; i < 8; i++) b.ball(0.05, '#e6ad55', [b.r(-0.25, 0.25), 0.06, b.r(-0.15, 0.15)], [1, 0.35, 1], 0);
    return 0.07;
  },
  nuggets: (b, o) => {
    pieces(b, Math.max(4, Math.min(o.n, 6)), (x, z) => b.add(G.dodeca(0.085), '#d38a2c', [x, 0.06, z], [b.r(0, 3), b.r(0, 3), 0], [1.1, 0.7, 1]));
    return 0.12;
  },
  kebab: (b) => {
    b.cyl(0.26, 0.04, '#7b3d1e', [0, 0, 0]);
    for (let i = 0; i < 12; i++) b.add(G.rbox(0.18, 0.035, 0.05), i % 2 ? '#8c4a26' : '#a8612f', [b.r(-0.16, 0.16), b.r(0.05, 0.09), b.r(-0.16, 0.16)], [0, b.r(0, 3), b.r(-0.2, 0.2)]);
    return 0.1;
  },
  wurstel: (b) => {
    for (const z of [-0.08, 0.08]) {
      b.add(G.cap(0.06, 0.34), '#d8735a', [0, 0.06, z], [0, z * 2, Math.PI / 2]);
      for (let k = -1; k <= 1; k++) b.add(G.rbox(0.012, 0.012, 0.1), '#8e3a24', [k * 0.1, 0.12, z], [0, 0.5, 0]);
    }
    return 0.12;
  },
  condimenti: (b) => {
    ['#e0472f', '#f3e2a0', '#7cbf4a'].forEach((c, i) => {
      const a = (i / 3) * Math.PI * 2;
      const p: V3 = [Math.cos(a) * 0.14, 0, Math.sin(a) * 0.14];
      b.cyl(0.11, 0.08, '#fbf7ef', p, [1, 1, 1], 10, 0.085);
      b.cyl(0.095, 0.012, c, [p[0], 0.075, p[2]]);
    });
    return 0.09;
  },
  croccante: (b) => {
    for (let i = 0; i < 18; i++) b.add(G.dodeca(0.035), i % 3 ? '#b8742e' : '#d9a050', [b.r(-0.2, 0.2), b.r(0.02, 0.07), b.r(-0.2, 0.2)], [b.r(0, 3), b.r(0, 3), 0], [1.4, 0.6, 1]);
    return 0.08;
  },
  olio: (b, o) => {
    if (o.layer) {
      b.add(G.torus(0.16, 0.018, Math.PI * 1.7), '#d4bb3c', [0, 0.02, 0], [Math.PI / 2, 0, 0], [1, 1, 1], { r: 0.3 });
      b.add(G.torus(0.07, 0.018, Math.PI * 1.5), '#d4bb3c', [0.04, 0.02, 0], [Math.PI / 2, 0, 1], [1, 1, 1], { r: 0.3 });
      return 0.03;
    }
    b.cyl(0.1, 0.36, '#b9b43f', [0, 0, 0], [1, 1, 1], 10);
    b.cyl(0.102, 0.12, '#fbf3e3', [0, 0.1, 0], [1, 1, 1], 10);
    b.cyl(0.04, 0.14, '#b9b43f', [0, 0.36, 0], [1, 1, 1], 8);
    b.cyl(0.045, 0.06, '#a87a4a', [0, 0.49, 0], [1, 1, 1], 8);
    return 0.55;
  },
  kinder: (b) => {
    for (const z of [-0.07, 0.07]) {
      b.add(G.rbox(0.44, 0.07, 0.11), '#f4ede0', [0, 0.035, z], [0, z, 0]);
      for (let k = -1; k <= 1; k++) b.add(G.rbox(0.1, 0.075, 0.115), '#6b3a1e', [k * 0.14, 0.036, z], [0, z, 0]);
    }
    return 0.08;
  },
  tronky: (b) => {
    for (const z of [-0.07, 0.07]) {
      b.add(G.rbox(0.42, 0.09, 0.11), '#d6312a', [0, 0.045, z], [0, -z, 0]);
      b.add(G.rbox(0.1, 0.095, 0.115), '#fbf7ef', [0, 0.046, z], [0, -z, 0]);
    }
    return 0.1;
  },
  granella: (b) => {
    for (let i = 0; i < 20; i++) b.add(G.dodeca(0.03), i % 2 ? '#c99358' : '#e3bd84', [b.r(-0.22, 0.22), b.r(0.02, 0.05), b.r(-0.22, 0.22)], [b.r(0, 3), b.r(0, 3), 0]);
    return 0.06;
  },
  scaglie: (b) => {
    for (let i = 0; i < 14; i++) b.add(G.rbox(0.08, 0.012, 0.05), '#f8f1de', [b.r(-0.2, 0.2), b.r(0.01, 0.05), b.r(-0.2, 0.2)], [b.r(-0.4, 0.4), b.r(0, 3), b.r(-0.4, 0.4)]);
    return 0.05;
  },
  nocciola: (b) => {
    pieces(b, 6, (x, z) => {
      b.ball(0.055, '#9a5a2a', [x, 0.05, z], [1, 0.9, 1], 1);
      b.ball(0.03, '#c9a074', [x, 0.095, z], [1, 0.5, 1], 0);
    });
    return 0.11;
  },
  pistacchio: (b, o) => (o.layer ? spread(b, '#9cbc4a') : jar(b, '#9cbc4a')),
  nutella: (b, o) => (o.layer ? spread(b, '#4a2516') : jar(b, '#4a2516')),
  nutbianca: (b, o) => (o.layer ? spread(b, '#f1e4c8') : jar(b, '#efe0c0')),
  guac: (b, o) => {
    if (o.layer) return blob(b, '#8bbd45');
    b.cyl(0.24, 0.12, '#f2e9da', [0, 0, 0], [1, 1, 1], 12, 0.15);
    b.cyl(0.215, 0.02, '#8bbd45', [0, 0.11, 0], [1, 1, 1], 12);
    for (let i = 0; i < 5; i++) b.ball(0.06, '#7aad3a', [b.r(-0.1, 0.1), 0.13, b.r(-0.1, 0.1)], [1, 0.5, 1], 0);
    return 0.16;
  },
  funghi: (b, o) => {
    if (o.name.includes('crema')) return o.layer ? spread(b, '#a08468') : jar(b, '#a08468');
    pieces(b, 3, (x, z) => {
      b.cyl(0.04, 0.09, '#efe3cf', [x, 0, z], o.layer ? [1, 0.5, 1] : [1, 1, 1], 8);
      b.add(G.dome(0.1), '#a8744a', [x, o.layer ? 0.045 : 0.085, z], [0, 0, 0], [1, o.layer ? 0.6 : 0.9, 1]);
    });
    return o.layer ? 0.1 : 0.18;
  },
  bacon: (b) => {
    // due strisce ondulate: carne rossa con la venatura di grasso
    for (const z of [-0.08, 0.08]) {
      for (let k = 0; k < 5; k++) {
        const x = (k - 2) * 0.09;
        const y = 0.03 + (k % 2) * 0.025;
        const rz = k % 2 ? -0.5 : 0.5;
        b.add(G.rbox(0.1, 0.022, 0.1), '#b8473a', [x, y, z], [0, z, rz]);
        b.add(G.rbox(0.1, 0.024, 0.03), '#f3d6c2', [x, y + 0.001, z], [0, z, rz]);
      }
    }
    return 0.07;
  },
  crudo: (b) => {
    for (let i = 0; i < 3; i++) {
      const p: V3 = [b.r(-0.08, 0.08), 0.02 + i * 0.015, (i - 1) * 0.1];
      b.ball(0.13, '#fbefe6', [p[0], p[1] - 0.005, p[2]], [1.55, 0.22, 0.85], 1);
      b.ball(0.12, '#e48d86', p, [1.5, 0.25, 0.8], 1);
    }
    return 0.07;
  },
  bresaola: (b) => {
    for (let i = 0; i < 3; i++) b.add(G.cyl(0.14, 0.015, 10), '#8e2b2b', [(i - 1) * 0.11, 0.02 + i * 0.012, b.r(-0.05, 0.05)], [b.r(-0.15, 0.15), 0, b.r(-0.15, 0.15)]);
    return 0.06;
  },
  porchetta: (b) => {
    for (const x of [-0.1, 0.1]) {
      b.cyl(0.21, 0.065, '#9a5525', [x, x > 0 ? 0.02 : 0, 0], [1, 1, 1], 12);
      b.cyl(0.17, 0.07, '#ead0ab', [x, x > 0 ? 0.02 : 0, 0], [1, 1, 1], 12);
      b.add(G.torus(0.08, 0.012, Math.PI * 1.5), '#c98d5a', [x, (x > 0 ? 0.02 : 0) + 0.072, 0], [Math.PI / 2, 0, 0]);
    }
    return 0.1;
  },
  tonno: (b) => {
    for (let i = 0; i < 9; i++) b.add(G.dodeca(0.06), i % 2 ? '#d8a98c' : '#c99278', [b.r(-0.17, 0.17), 0.04, b.r(-0.17, 0.17)], [b.r(0, 3), b.r(0, 3), 0], [1.2, 0.6, 1]);
    return 0.08;
  },
  cheddar: (b) => {
    b.add(G.rbox(0.46, 0.035, 0.46), '#f0a032', [0, 0.018, 0], [0, Math.PI / 4, 0]);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      b.add(G.rbox(0.08, 0.03, 0.08), '#e8961f', [Math.cos(a) * 0.31, -0.005, Math.sin(a) * 0.31], [0.3, a, 0]);
    }
    return 0.04;
  },
  stracc: (b) => {
    for (let i = 0; i < 7; i++) b.ball(0.08, '#f8f3ea', [b.r(-0.14, 0.14), 0.04, b.r(-0.14, 0.14)], [1.1, 0.5, 1.1], 1);
    return 0.08;
  },
  scamorza: (b, o) => {
    if (o.layer) {
      for (const x of [-0.07, 0.07]) {
        b.cyl(0.14, 0.03, '#c98a3a', [x, x > 0 ? 0.015 : 0, 0], [1, 1, 1], 10);
        b.cyl(0.125, 0.032, '#f2dba8', [x, x > 0 ? 0.015 : 0, 0], [1, 1, 1], 10);
      }
      return 0.05;
    }
    b.ball(0.17, '#d9a055', [0, 0.16, 0], [1, 0.9, 1], 1);
    b.ball(0.07, '#d9a055', [0, 0.33, 0]);
    b.add(G.torus(0.06, 0.014), '#7a4a24', [0, 0.29, 0], [Math.PI / 2, 0, 0]);
    return 0.4;
  },
  mozz: (b, o) => {
    if (o.layer) {
      pieces(b, 3, (x, z) => b.cyl(0.11, 0.03, '#f8f6f0', [x, 0, z], [1, 1, 1], 10));
      return 0.04;
    }
    b.ball(0.17, '#f8f6f0', [0, 0.15, 0], [1, 0.88, 1], 1);
    b.ball(0.045, '#f8f6f0', [0, 0.31, 0]);
    return 0.34;
  },
  grana: (b, o) => {
    if (o.layer) {
      for (let i = 0; i < 9; i++) b.add(G.rbox(0.07, 0.012, 0.04), '#f3e0a0', [b.r(-0.18, 0.18), b.r(0.01, 0.04), b.r(-0.18, 0.18)], [b.r(-0.3, 0.3), b.r(0, 3), 0]);
      return 0.04;
    }
    b.add(G.cyl(0.32, 0.17, 6, 0.32, Math.PI / 3), '#f0d98a', [-0.12, 0.085, 0.1], [0, 0.5, 0]);
    b.add(G.cyl(0.322, 0.172, 6, 0.322, Math.PI / 3), '#c9a24e', [-0.125, 0.085, 0.105], [0, 0.5, 0], [1, 1, 0.98]);
    return 0.18;
  },
  valeriana: (b) => {
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const d = i % 2 ? 0.15 : 0.08;
      b.add(G.ball(0.07, 1), i % 2 ? '#3f8a3a' : '#4f9a45', [Math.cos(a) * d, 0.03, Math.sin(a) * d], [-0.3, -a, 0], [1, 0.25, 0.75]);
    }
    return 0.06;
  },
  rucola: (b) => {
    for (let i = 0; i < 9; i++) b.add(G.rbox(0.26, 0.012, 0.055), i % 2 ? '#4c9a3c' : '#3c8430', [b.r(-0.05, 0.05), 0.02 + i * 0.004, b.r(-0.05, 0.05)], [0, (i / 9) * Math.PI, b.r(-0.2, 0.2)]);
    return 0.05;
  },
  insalata: (b, o) => {
    if (o.layer) {
      b.cyl(0.32, 0.025, '#9ed36a', [0, 0, 0], [1, 1, 1], 9);
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2;
        b.ball(0.09, '#86c254', [Math.cos(a) * 0.29, 0.02, Math.sin(a) * 0.29], [1.2, 0.3, 1], 0);
      }
      return 0.05;
    }
    b.ball(0.2, '#b3dd7c', [0, 0.18, 0], [1, 0.9, 1], 1);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      b.add(G.ball(0.15, 1), '#8cc657', [Math.cos(a) * 0.12, 0.13, Math.sin(a) * 0.12], [0, -a, 0.6], [0.5, 1, 1]);
    }
    return 0.38;
  },
  pomodoro: (b, o) => {
    if (o.layer) {
      for (const x of [-0.1, 0.1]) {
        b.cyl(0.14, 0.035, '#d33a2a', [x, x > 0 ? 0.02 : 0, 0], [1, 1, 1], 10);
        b.cyl(0.115, 0.037, '#ef6e58', [x, x > 0 ? 0.02 : 0, 0], [1, 1, 1], 10);
      }
      return 0.06;
    }
    b.ball(0.17, '#d33a2a', [0, 0.15, 0], [1, 0.85, 1], 1);
    for (let i = 0; i < 5; i++) b.add(G.rbox(0.1, 0.015, 0.025), '#4f9a3c', [0, 0.29, 0], [0, (i / 5) * Math.PI, 0]);
    return 0.3;
  },
  pomodorini: (b) => {
    pieces(b, 3, (x, z) => {
      b.ball(0.085, '#e0402e', [x, 0.08, z], [1, 0.9, 1], 1);
      b.add(G.rbox(0.05, 0.012, 0.015), '#4f9a3c', [x, 0.16, z], [0, 1, 0]);
    });
    return 0.17;
  },
  secchi: (b) => {
    for (let i = 0; i < 5; i++) b.add(G.dodeca(0.075), i % 2 ? '#8e2a1e' : '#a6351f', [b.r(-0.15, 0.15), 0.02 + i * 0.006, b.r(-0.15, 0.15)], [0, b.r(0, 3), 0], [1.4, 0.28, 1]);
    return 0.05;
  },
  peperoncino: (b) => {
    for (const z of [-0.07, 0.07]) {
      b.add(G.cone(0.045, 0.32, 7), '#d8261a', [0, 0.045, z], [0, z * 3, -Math.PI / 2]);
      b.add(G.cyl(0.015, 0.06, 5), '#3f8a2c', [-0.19, 0.05, z], [0, 0, Math.PI / 2]);
    }
    return 0.09;
  },
  frigitelli: (b) => {
    for (const z of [-0.07, 0.07]) {
      b.add(G.cap(0.055, 0.26), '#4f9a2c', [0, 0.055, z], [0, z * 2, Math.PI / 2 + 0.1]);
      b.add(G.cyl(0.014, 0.06, 5), '#2f6a1c', [-0.2, 0.08, z], [0, 0, 1.2]);
    }
    return 0.11;
  },
  anelli: (b) => {
    for (let i = 0; i < 3; i++) b.add(G.torus(0.1, 0.045), '#d99a3a', [(i - 1) * 0.1, 0.045 + (i === 1 ? 0.03 : 0), b.r(-0.04, 0.04)], [Math.PI / 2 + b.r(-0.2, 0.2), 0, 0]);
    return 0.12;
  },
  olive: (b, o) => {
    const dark = o.name.includes('leccin') || o.name.includes('nere');
    pieces(b, 5, (x, z) => b.ball(0.06, dark ? '#4b3550' : '#7a8f2e', [x, 0.05, z], [1, 0.8, 0.8], 1));
    return 0.1;
  },
  patatine: (b, o) => {
    if (o.layer) {
      for (let i = 0; i < 10; i++) b.add(G.rbox(0.3, 0.035, 0.035), '#f2c14e', [b.r(-0.08, 0.08), 0.02 + (i % 3) * 0.03, b.r(-0.12, 0.12)], [0, b.r(0, 3), 0]);
      return 0.1;
    }
    for (let i = 0; i < 9; i++) b.add(G.rbox(0.035, 0.3, 0.035), '#f2c14e', [b.r(-0.08, 0.08), 0.28, b.r(-0.05, 0.05)], [b.r(-0.25, 0.25), 0, b.r(-0.25, 0.25)]);
    b.cyl(0.16, 0.26, '#d6312a', [0, 0, 0], [1, 1, 0.7], 8, 0.12);
    return 0.43;
  },
  patate: (b) => {
    for (let i = 0; i < 9; i++) b.add(G.rbox(0.08, 0.08, 0.08), i % 2 ? '#e8b04a' : '#d99a3a', [b.r(-0.16, 0.16), 0.04 + (i > 5 ? 0.06 : 0), b.r(-0.16, 0.16)], [b.r(0, 3), b.r(0, 3), b.r(0, 3)]);
    return 0.13;
  },
  crocchette: (b, o) => {
    pieces(b, Math.min(o.n, 6), (x, z, i) => b.add(G.cap(0.055, 0.14), '#c97b30', [x, 0.055, z], [0, i, Math.PI / 2]));
    return 0.11;
  },
  calzoncini: (b, o) => {
    pieces(b, Math.min(o.n, 6), (x, z, i) => b.add(G.cyl(0.12, 0.06, 10, 0.12, Math.PI), '#d99a40', [x, 0.03, z], [0, i * 1.3, 0]));
    return 0.07;
  },
  pittule: (b, o) => {
    pieces(b, Math.min(o.n, 6), (x, z) => b.add(G.dodeca(0.07), '#d99a3a', [x, 0.06, z], [b.r(0, 3), b.r(0, 3), 0], [1, b.r(0.8, 1), 1]));
    return 0.12;
  },
  arancini: (b, o) => {
    pieces(b, Math.min(o.n, 6), (x, z) => {
      b.ball(0.075, '#e09a3a', [x, 0.075, z], [1, 1, 1], 1);
      b.add(G.cone(0.07, 0.11, 7), '#e09a3a', [x, 0.17, z]);
    });
    return 0.22;
  },
  // basi dei piatti (anche per le icone delle categorie)
  bunbase: (b) => {
    b.cyl(0.33, 0.09, '#d99a4c', [0, 0, 0], [1, 1, 1], 12, 0.3);
    b.cyl(0.3, 0.012, '#f3d9a4', [0, 0.09, 0], [1, 1, 1], 12);
    return 0.1;
  },
  buntop: (b) => {
    b.cyl(0.33, 0.04, '#f3d9a4', [0, 0, 0], [1, 1, 1], 12);
    b.add(G.dome(0.34), '#e3a24e', [0, 0.03, 0], [0, 0, 0], [1, 0.6, 1]);
    for (let i = 0; i < 10; i++) {
      const a = b.r(0, 6.28);
      const d = b.r(0.04, 0.24);
      b.add(G.rbox(0.035, 0.014, 0.018), '#fbf1d8', [Math.cos(a) * d, 0.03 + 0.204 * Math.sqrt(1 - (d / 0.34) ** 2), Math.sin(a) * d], [0, a, 0]);
    }
    return 0.24;
  },
  bun: (b) => {
    ART.bunbase(b, { layer: false, n: 1, name: '' });
    b.cyl(0.31, 0.08, '#6b3a22', [0, 0.1, 0], [1, 1, 1], 12);
    b.add(G.rbox(0.44, 0.03, 0.44), '#f0a032', [0, 0.19, 0], [0, Math.PI / 4, 0]);
    const t = new B(7);
    ART.buntop(t, { layer: false, n: 1, name: '' });
    t.g.position.y = 0.2;
    b.g.add(t.g);
    return 0.46;
  },
  focaccia: (b) => {
    b.cyl(0.36, 0.09, '#e8c27a', [0, 0, 0], [1.15, 1, 0.85], 9);
    for (let i = 0; i < 7; i++) b.add(G.ball(0.03, 0), '#c9963f', [b.r(-0.28, 0.28), 0.09, b.r(-0.2, 0.2)], [0, 0, 0], [1, 0.3, 1]);
    return 0.1;
  },
  ciotola: (b) => {
    b.cyl(0.36, 0.24, '#f2e9da', [0, 0, 0], [1, 1, 1], 14, 0.22);
    b.cyl(0.31, 0.02, '#e9dcc6', [0, 0.2, 0], [1, 1, 1], 14);
    return 0.22;
  },
  pizza: (b) => {
    b.cyl(0.42, 0.04, '#ecc98f', [0, 0, 0], [1, 1, 1], 16);
    b.add(G.torus(0.41, 0.045, Math.PI * 2, 16), '#d9a85e', [0, 0.04, 0], [Math.PI / 2, 0, 0]);
    return 0.04;
  },
  cestino: (b) => {
    b.cyl(0.36, 0.13, '#c9a46a', [0, 0, 0], [1, 1, 1], 12, 0.3);
    b.cyl(0.33, 0.012, '#f3ead8', [0, 0.12, 0], [1, 1, 1], 12);
    return 0.13;
  },
  pezzi: (b) => {
    b.cyl(0.22, 0.07, '#e3a83a', [0, 0, 0], [1, 1, 1], 14);
    b.cyl(0.18, 0.074, '#f2c45c', [0, 0, 0], [1, 1, 1], 14);
    return 0.08;
  },
};

const nums = new Map<string, THREE.MeshStandardMaterial>();
function numberMat(n: string) {
  let m = nums.get(n);
  if (!m) {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d')!;
    g.fillStyle = '#f2c45c';
    g.fillRect(0, 0, 128, 128);
    g.fillStyle = '#5a3b00';
    g.font = `700 ${n.length > 2 ? 54 : 74}px Fredoka, Nunito, sans-serif`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(n, 64, 70);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    m = new THREE.MeshStandardMaterial({ map: t, roughness: 0.8 });
    nums.set(n, m);
  }
  return m;
}

const PALETTE = ['#c65a3c', '#e3a83a', '#6f9a6a', '#5b8db8', '#9a6fb0', '#d98a5f'];
function fallback(b: B, name: string, layer: boolean) {
  const c = PALETTE[hash(name) % PALETTE.length];
  if (layer) return blob(b, c, 6, 0.18);
  b.cyl(0.2, 0.1, '#fbf7ef', [0, 0, 0], [1, 1, 1], 12, 0.15);
  for (let i = 0; i < 5; i++) b.ball(0.07, c, [b.r(-0.08, 0.08), 0.11, b.r(-0.08, 0.08)], [1, 0.5, 1], 0);
  return 0.16;
}

export interface IngInfo {
  key: string;
  count: string | null;
  n: number;
  onlyCount: boolean;
}

export function parseIng(name: string): IngInfo {
  const m = name.trim().match(/^(\d+(?:\/\d+)?)\s+(.+)$/);
  const count = m ? m[1] : null;
  const base = m ? m[2] : name;
  const onlyCount = !!count && /^pezz/i.test(base);
  return { key: onlyCount ? 'pezzi' : keyOf(base) || base.toLowerCase(), count, n: count ? parseInt(count, 10) : 1, onlyCount };
}

const SPREADS = new Set(['nutella', 'nutbianca', 'pistacchio']);
export const isSpread = (name: string) => {
  const k = parseIng(name).key;
  return SPREADS.has(k) || k in SAUCE || k === 'guac' || (k === 'funghi' && name.toLowerCase().includes('crema'));
};

/** modello 3D di un ingrediente (o di una base: bun, focaccia, ciotola, pizza, cestino) */
export function buildIng(name: string, layer = false): { obj: THREE.Group; h: number } {
  const info = parseIng(name);
  const lname = name.toLowerCase();
  const b = new B(hash(lname));
  let h: number;
  if (info.key in SAUCE) {
    const [body, capc] = SAUCE[info.key];
    h = layer ? blob(b, body) : bottle(b, body, capc);
  } else if (ART[info.key]) h = ART[info.key](b, { layer, n: info.n, name: lname });
  else h = fallback(b, lname, layer);
  if (info.onlyCount && info.count) {
    // il numero stampato sul gettone dei pezzi
    const m = new THREE.Mesh(G.cyl(0.165, 0.002, 20), numberMat(info.count));
    m.position.y = 0.076;
    m.rotation.y = 0.35;
    b.g.add(m);
  }
  return { obj: b.g, h };
}

/** base del piatto per ogni categoria */
export const BASE_OF: Record<string, string> = { hamburger: 'bunbase', focacce: 'focaccia', insalatone: 'ciotola', dolci: 'pizza', fritti: 'cestino' };
/** le categorie dove gli ingredienti si impilano (panini) invece di spargersi */
export const STACKED = new Set(['hamburger', 'focacce']);

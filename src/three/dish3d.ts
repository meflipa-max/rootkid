import * as THREE from 'three';
import { BASE_OF, STACKED, buildIng, isSpread, parseIng } from './ingredients';
import { onModels } from './models';

/** Come si compone un piatto in 3D: base della categoria + ingredienti impilati (panini) o sparsi (pizze, ciotole, cestini). */

const heights = new Map<string, number>();
// quando arrivano i modelli di Blender le altezze degli strati cambiano
onModels(() => heights.clear());
export function heightOf(name: string) {
  let h = heights.get(name);
  if (h === undefined) {
    h = buildIng(name, true).h;
    heights.set(name, h);
  }
  return h;
}

export interface Placed {
  name: string;
  /** il modello da disegnare: di solito il nome, ma sulla pizza il pomodoro è salsa, non fette */
  model: string;
  at: [number, number, number];
  scale: number;
}

export function layoutDish(items: string[], cat: string | null): { out: Placed[]; baseKey: string | null; top: number; stacked: boolean } {
  const baseKey = cat ? BASE_OF[cat] : null;
  const baseH = baseKey ? heightOf(baseKey) : 0;
  const out: Placed[] = [];
  const look = (n: string) => (baseKey === 'pizza' && parseIng(n).key === 'pomodoro' && !/pomodorini/i.test(n) ? 'salsa di pomodoro' : n);
  if (cat && STACKED.has(cat)) {
    let y = baseH;
    items.forEach((n, i) => {
      out.push({ name: n, model: n, at: [Math.sin(i * 2.7) * 0.03, y, Math.cos(i * 1.9) * 0.03], scale: 1 });
      y += heightOf(n) * 0.92;
    });
    return { out, baseKey, top: y, stacked: true };
  }
  let ys = baseH;
  let k = 0;
  items.forEach((n) => {
    if (isSpread(look(n))) {
      out.push({ name: n, model: look(n), at: [0, ys, 0], scale: cat === 'dolci' ? 1.1 : 0.9 });
      ys += 0.03;
    }
  });
  items.forEach((n) => {
    if (isSpread(look(n))) return;
    const a = k * 2.4;
    const r = k === 0 && items.length === 1 ? 0 : 0.14 + 0.07 * (k % 3);
    out.push({ name: n, model: n, at: [Math.cos(a) * r, ys + (k >= 6 ? 0.08 : 0), Math.sin(a) * r], scale: items.length > 3 ? 0.7 : 0.85 });
    k++;
  });
  return { out, baseKey, top: ys, stacked: false };
}

/** il piatto finito come un unico oggetto (per icone e anteprime) */
export function buildDish(items: string[], cat: string | null): THREE.Group {
  const g = new THREE.Group();
  const { out, baseKey, top } = layoutDish(items, cat);
  if (baseKey) g.add(buildIng(baseKey, true).obj);
  for (const o of out) {
    const m = buildIng(o.model, true).obj;
    m.position.set(...o.at);
    m.scale.setScalar(o.scale);
    g.add(m);
  }
  if (cat === 'hamburger') {
    const lid = buildIng('buntop', true).obj;
    lid.position.y = top;
    g.add(lid);
  }
  return g;
}

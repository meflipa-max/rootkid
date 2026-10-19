/**
 * Prepara i modelli CC0 per `public/models/`.
 *
 * I pacchetti originali sono grossi: i personaggi portano 32 animazioni (ne usiamo 9) e le
 * texture stanno in un file a parte. Qui teniamo solo quello che serve, incorporiamo la texture
 * dentro al .glb e buttiamo via il resto, così il gioco scarica pochi kB per personaggio.
 *
 * Uso (i pacchetti vanno scaricati a mano, vedi public/models/CREDITS.md):
 *   node tools/prepare-models.mjs <cartella-con-i-kit-scompattati>
 *
 * La cartella deve contenere: kenney_mini-characters/, kenney_furniture-kit/ e artist_workshop_1k.hdr
 */
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, prune, quantize, resample, weld } from '@gltf-transform/functions';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public', 'models');

/** le uniche animazioni che il gioco fa partire (vedi src/three/Person3D.tsx) */
const ANIM = ['idle', 'walk', 'sprint', 'sit', 'pick-up', 'interact-right', 'emote-yes', 'emote-no', 'jump'];

/** personaggi: 12 varianti, scelte in base all'aspetto del cliente */
const CHARACTERS = ['a', 'b', 'c', 'd', 'e', 'f'].flatMap((l) => [`character-male-${l}`, `character-female-${l}`]);
/**
 * Le 12 varianti hanno lo stesso scheletro e le stesse animazioni: tenerle in tutti i file
 * raddoppierebbe il peso per niente. Le teniamo solo qui e le riusiamo su tutti (i canali
 * puntano ai nomi delle ossa — torso, arm-left, head… — che sono identici ovunque).
 */
const RIG = 'character-male-a';

/** arredo del locale: solo i pezzi che stanno bene con il nostro stile caldo */
const FURNITURE = ['chairCushion', 'pottedPlant', 'kitchenFridge', 'kitchenFridgeLarge'];

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);

/** cerca il file dentro al kit, qualunque sia il nome della cartella dei modelli */
async function findGlb(kitDir, name) {
  for (const sub of ['Models/GLB format', 'Models/GLTF format', 'Models/glTF format', 'Models']) {
    const p = join(kitDir, sub, `${name}.glb`);
    if (existsSync(p)) return p;
  }
  return null;
}

async function convert(src, dest, { keepAnim = false } = {}) {
  const doc = await io.read(src);
  const root = doc.getRoot();
  if (keepAnim) {
    for (const a of root.listAnimations()) if (!ANIM.includes(a.getName())) a.dispose();
  } else {
    for (const a of root.listAnimations()) a.dispose();
  }
  await doc.transform(resample(), dedup(), weld(), prune({ keepAttributes: false }), quantize());
  await mkdir(dirname(dest), { recursive: true });
  await writeFile(dest, await io.writeBinary(doc));
  const before = (await readFile(src)).length;
  const after = (await readFile(dest)).length;
  return { before, after };
}

async function group(kitDir, names, outDir, opts) {
  if (!existsSync(kitDir)) {
    console.log(`· salto ${outDir}: manca ${kitDir}`);
    return;
  }
  let before = 0;
  let after = 0;
  let done = 0;
  const missing = [];
  for (const name of names) {
    const src = await findGlb(kitDir, name);
    if (!src) {
      missing.push(name);
      continue;
    }
    const r = await convert(src, join(OUT, outDir, `${name}.glb`), { ...opts, keepAnim: opts?.keepAnim && name === RIG });
    before += r.before;
    after += r.after;
    done++;
  }
  const kb = (n) => `${Math.round(n / 1024)} kB`;
  console.log(`✓ ${outDir}: ${done} modelli, ${kb(before)} → ${kb(after)}`);
  if (missing.length) console.log(`  (non trovati: ${missing.join(', ')})`);
}

/**
 * L'HDRI serve solo come luce riflessa e viene comunque sfocato dal PMREM: a piena risoluzione
 * sarebbero 1,7 MB buttati. Lo riduciamo a 256×128 e lo riscriviamo in RGBE (senza compressione
 * RLE, che three legge lo stesso): ~130 kB, impercettibili nella resa.
 */
async function shrinkHdr(src, dest, w = 256, h = 128) {
  if (!existsSync(src)) {
    console.log(`· salto l'HDRI: manca ${src}`);
    return;
  }
  const buf = await readFile(src);
  // intestazione: righe di testo fino a una riga vuota, poi la risoluzione
  let i = 0;
  const line = () => {
    const end = buf.indexOf(0x0a, i);
    const s = buf.toString('ascii', i, end);
    i = end + 1;
    return s;
  };
  let l = line();
  while (l !== '') l = line();
  const res = line().trim().split(/\s+/); // es. "-Y 512 +X 1024"
  const sh = Number(res[1]);
  const sw = Number(res[3]);
  // pixel: RGBE, eventualmente in RLE adattivo (il formato standard di Radiance)
  const px = new Uint8Array(sw * sh * 4);
  for (let y = 0; y < sh; y++) {
    const row = y * sw * 4;
    if (sw >= 8 && sw < 32768 && buf[i] === 2 && buf[i + 1] === 2 && ((buf[i + 2] << 8) | buf[i + 3]) === sw) {
      i += 4;
      for (let c = 0; c < 4; c++) {
        let x = 0;
        while (x < sw) {
          let n = buf[i++];
          if (n > 128) {
            const v = buf[i++];
            for (let k = 0; k < n - 128; k++) px[row + (x++) * 4 + c] = v;
          } else {
            for (let k = 0; k < n; k++) px[row + (x++) * 4 + c] = buf[i++];
          }
        }
      }
    } else {
      for (let x = 0; x < sw; x++) for (let c = 0; c < 4; c++) px[row + x * 4 + c] = buf[i++];
    }
  }
  // media in spazio lineare dei pixel che finiscono nello stesso pixel ridotto
  const out = Buffer.alloc(w * h * 4);
  const fx = sw / w;
  const fy = sh / h;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let r = 0;
      let g = 0;
      let b = 0;
      let n = 0;
      for (let sy = Math.floor(y * fy); sy < Math.ceil((y + 1) * fy); sy++)
        for (let sx = Math.floor(x * fx); sx < Math.ceil((x + 1) * fx); sx++) {
          const o = (sy * sw + sx) * 4;
          const e = px[o + 3] ? 2 ** (px[o + 3] - 136) : 0; // 128 di bias + 8 bit di mantissa
          r += px[o] * e;
          g += px[o + 1] * e;
          b += px[o + 2] * e;
          n++;
        }
      const o = (y * w + x) * 4;
      const max = Math.max(r, g, b) / n;
      if (max < 1e-8) continue;
      const exp = Math.ceil(Math.log2(max));
      const s = 256 / 2 ** exp / n;
      out[o] = Math.min(255, r * s);
      out[o + 1] = Math.min(255, g * s);
      out[o + 2] = Math.min(255, b * s);
      out[o + 3] = exp + 128;
    }
  const header = Buffer.from(`#?RADIANCE\nFORMAT=32-bit_rle_rgbe\n\n-Y ${h} +X ${w}\n`, 'ascii');
  await mkdir(dirname(dest), { recursive: true });
  await writeFile(dest, Buffer.concat([header, out]));
  const kb = (n) => `${Math.round(n / 1024)} kB`;
  console.log(`✓ hdri: ${sw}×${sh} → ${w}×${h}, ${kb(buf.length)} → ${kb(header.length + out.length)}`);
}

const srcRoot = process.argv[2];
if (!srcRoot) {
  console.error('Serve la cartella con i kit scompattati. Vedi public/models/CREDITS.md');
  process.exit(1);
}
console.log(`Sorgenti: ${resolve(srcRoot)}`);
console.log(`Destinazione: ${OUT}\n`);
await group(join(srcRoot, 'kenney_mini-characters'), CHARACTERS, 'characters', { keepAnim: true });
await group(join(srcRoot, 'kenney_furniture-kit'), FURNITURE, 'furniture');
await shrinkHdr(join(srcRoot, 'artist_workshop_1k.hdr'), join(OUT, 'hdri', 'artist_workshop.hdr'));
console.log(`\nFatto. Ricordati di aggiornare public/models/CREDITS.md se aggiungi un pacchetto.`);

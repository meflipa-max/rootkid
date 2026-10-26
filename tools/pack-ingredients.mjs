/**
 * Alleggerisce gli ingredienti esportati da Blender (tools/ingredients.py) per il gioco:
 * unisce i materiali uguali, salda i vertici, quantizza e comprime con meshopt
 * (three.js lo decodifica da solo con il MeshoptDecoder, senza file in più).
 *
 * Uso:  node tools/pack-ingredients.mjs [ingresso.raw.glb] [uscita.glb] [--solo-quantize]
 * Con --solo-quantize niente meshopt: serve per i personaggi (Giuseppe), che drei carica senza decoder.
 */
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, meshopt, prune, quantize, weld } from '@gltf-transform/functions';
import { MeshoptEncoder } from 'meshoptimizer';
import { stat } from 'node:fs/promises';

const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const only = process.argv.includes('--solo-quantize');
const src = args[0] ?? 'public/models/ingredients/ingredients.raw.glb';
const dest = args[1] ?? 'public/models/ingredients/ingredients.glb';

await MeshoptEncoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder });
const doc = await io.read(src);
await doc.transform(dedup(), weld(), prune({ keepAttributes: false }), quantize(), ...(only ? [] : [meshopt({ encoder: MeshoptEncoder, level: 'high' })]));
await io.write(dest, doc);
const kb = (p) => stat(p).then((s) => Math.round(s.size / 1024));
console.log(`${src}: ${await kb(src)} kB -> ${dest}: ${await kb(dest)} kB`);

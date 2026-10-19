"""
Giuseppe, il pizzaiolo: parte dal personaggio Kenney "character-male-a" (stesso scheletro, così
le animazioni di RIG valgono anche per lui) e gli aggiunge quello che lo rende riconoscibile:
berretto nero girato all'indietro, occhiali, barba e baffi, maglietta bianca, pantaloni a quadretti.

Uso:
  blender -b --python tools/giuseppe.py -- public/models/characters/character-male-a.glb public/models/characters/giuseppe.glb [anteprima.png]
"""
import bpy, bmesh, sys, math
from mathutils import Vector

args = sys.argv[sys.argv.index('--') + 1:]
src, out = args[0], args[1]
preview = args[2] if len(args) > 2 else None

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
for o in list(bpy.data.objects):
    if o.type == 'MESH' and o.name.startswith('Icosphere'):
        bpy.data.objects.remove(o)

arm = next(o for o in bpy.data.objects if o.type == 'ARMATURE')
body = bpy.data.objects['body-mesh']
head = bpy.data.objects['head-mesh']


def mat(name, rgb, rough=0.7):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    p = m.node_tree.nodes['Principled BSDF']
    p.inputs['Base Color'].default_value = (*rgb, 1)
    p.inputs['Roughness'].default_value = rough
    return m


def srgb(h):
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c)


SHIRT = mat('maglietta', srgb('f2f0ea'), 0.85)
PANTS = mat('pantaloni', srgb('ffffff'), 0.8)
# pantaloni da cuoco a quadretti piccoli: texture vera (il glTF non esporta i nodi procedurali)
N = 32
chk = bpy.data.images.new('quadretti', N, N)
dark, light = srgb('2b3350'), srgb('e8e8ea')
pix = []
for y in range(N):
    for x in range(N):
        c = dark if ((x // 2) + (y // 2)) % 2 else light
        pix += [*c, 1]
chk.pixels = pix
chk.pack()
tex = PANTS.node_tree.nodes.new('ShaderNodeTexImage')
tex.image = chk
tex.interpolation = 'Closest'
PANTS.node_tree.links.new(tex.outputs['Color'], PANTS.node_tree.nodes['Principled BSDF'].inputs['Base Color'])
CAP = mat('berretto', srgb('1d2027'), 0.6)
HAIR = mat('barba', srgb('3a2a20'), 0.9)
MUST = mat('baffi', srgb('5a4030'), 0.85)
FRAME = mat('occhiali', srgb('2a2a2e'), 0.35)
SKIN = mat('pelle', srgb('f1c6a4'), 0.75)
LENS = mat('lenti', srgb('c9d6dc'), 0.1)

# --- vestiti: ricolora le facce del corpo che nella texture non sono pelle ------------------
img = bpy.data.images['colormap']
W, H = img.size
px = list(img.pixels)


def sample(uv):
    x = min(W - 1, max(0, int(uv.x * W)))
    y = min(H - 1, max(0, int(uv.y * H)))
    i = (y * W + x) * 4
    return px[i:i + 3]


def is_skin(c):
    r, g, b = c
    return r > g > b and r - b > 0.12 and r > 0.35


groups = {g.index: g.name for g in body.vertex_groups}
me = body.data
body.data.materials.append(SHIRT)
body.data.materials.append(PANTS)
body.data.materials.append(SKIN)
uvl = me.uv_layers.active.data
for poly in me.polygons:
    uv = sum((uvl[li].uv for li in poly.loop_indices), Vector((0, 0))) / poly.loop_total
    w = {}
    for vi in poly.vertices:
        for g in me.vertices[vi].groups:
            n = groups[g.group]
            w[n] = w.get(n, 0) + g.weight
    bone = max(w, key=w.get) if w else 'torso'
    # le scarpe restano com'erano: sono le facce più basse delle gambe
    zmin = min((body.matrix_world @ me.vertices[v].co).z for v in poly.vertices)
    cx_ = sum((body.matrix_world @ me.vertices[v].co).x for v in poly.vertices) / len(poly.vertices)
    if bone == 'torso' or (abs(cx_) < 0.11 and zmin > 0.15):
        poly.material_index = 1  # il petto: la maglietta va chiusa fino al collo
    elif bone.startswith('leg') and zmin <= 0.06:
        continue  # le scarpe restano quelle della texture
    elif is_skin(sample(uv)):
        poly.material_index = 3  # Giuseppe è chiaro di carnagione
    elif bone.startswith('leg'):
        if zmin > 0.06:
            poly.material_index = 2
    else:
        poly.material_index = 1

# UV dei pantaloni rifatti a proiezione: tanti quadretti piccoli
K = 7
for poly in me.polygons:
    if poly.material_index != 2:
        continue
    for li in poly.loop_indices:
        co = body.matrix_world @ me.vertices[me.loops[li].vertex_index].co
        uvl[li].uv = ((co.x + co.y) * K, co.z * K)

# la faccia: stessa carnagione chiara (bocca e capelli restano quelli della texture)
head.data.materials.append(SKIN)
huv = head.data.uv_layers.active.data
for poly in head.data.polygons:
    uv = sum((huv[li].uv for li in poly.loop_indices), Vector((0, 0))) / poly.loop_total
    c = sample(uv)
    # anche la fascia chiara degli occhi del modello: gli occhi ora sono quelli dietro gli occhiali
    if is_skin(c) or (min(c) > 0.45 and c[2] >= c[0] - 0.05):
        poly.material_index = 1
    # Giuseppe è quasi calvo: sotto al berretto niente capelli, solo pelle (la faccia la copre la maschera)
    elif max(c) < 0.35:
        poly.material_index = 1

# --- accessori agganciati all'osso della testa -------------------------------------------
hb = [head.matrix_world @ Vector(c) for c in head.bound_box]
lo = Vector((min(v.x for v in hb), min(v.y for v in hb), min(v.z for v in hb)))
hi = Vector((max(v.x for v in hb), max(v.y for v in hb), max(v.z for v in hb)))
cx, cy = (lo.x + hi.x) / 2, (lo.y + hi.y) / 2
sx, sy, sz = hi.x - lo.x, hi.y - lo.y, hi.z - lo.z
front = lo.y  # i personaggi guardano verso -Y
# il davanti piatto della testa: i vertici a filo della faccia
fv = [head.matrix_world @ v.co for v in head.data.vertices]
fv = [p for p in fv if p.y < front + 0.012]
fx0, fx1 = min(p.x for p in fv), max(p.x for p in fv)
fz0, fz1 = min(p.z for p in fv), max(p.z for p in fv)
print('faccia', fx0, fx1, fz0, fz1, 'testa', lo, hi)
# la maschera copre il davanti fino al bordo del berretto
fz1 = min(fz1, lo.z + sz * 0.68)
EYE_V = 0.62  # altezza degli occhi sulla maschera (0 mento, 1 fronte)
parts = []


def rigged(obj, material):
    obj.data.materials.append(material)
    bpy.ops.object.shade_smooth() if False else None
    for p in obj.data.polygons:
        p.use_smooth = True
    vg = obj.vertex_groups.new(name='head')
    vg.add(range(len(obj.data.vertices)), 1.0, 'REPLACE')
    parts.append(obj)


def add(kind, **kw):
    getattr(bpy.ops.mesh, 'primitive_' + kind + '_add')(**kw)
    return bpy.context.active_object


# berretto: calotta + visiera dietro la nuca
cap = add('uv_sphere', segments=24, ring_count=12, radius=1, location=(cx, cy, lo.z + sz * 0.62))
cap.scale = (sx * 0.6, sy * 0.66, sz * 0.56)
bpy.ops.object.mode_set(mode='EDIT')
bm = bmesh.from_edit_mesh(cap.data)
bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.z < -0.05], context='VERTS')
bmesh.update_edit_mesh(cap.data)
bpy.ops.object.mode_set(mode='OBJECT')
bpy.ops.object.transform_apply(scale=True)
rigged(cap, CAP)
brim = add('cylinder', vertices=24, radius=1, depth=1, location=(cx, hi.y + sy * 0.08, lo.z + sz * 0.6))
brim.scale = (sx * 0.32, sy * 0.3, 0.012)
bpy.ops.object.transform_apply(scale=True)
rigged(brim, CAP)
button = add('uv_sphere', segments=8, ring_count=6, radius=sx * 0.05, location=(cx, cy, lo.z + sz * 1.1))
rigged(button, CAP)

# occhiali: due anelli sottili, lenti, ponte e stanghette
ey = fz0 + (fz1 - fz0) * EYE_V
for s in (-1, 1):
    ring = add('torus', major_radius=sx * 0.1, minor_radius=sx * 0.008, major_segments=20, minor_segments=6,
               location=(cx + s * sx * 0.19, front - 0.006, ey), rotation=(math.pi / 2, 0, 0))
    rigged(ring, FRAME)
    arm_g = add('cube', size=1, location=(cx + s * sx * 0.5, cy - sy * 0.1, ey + sz * 0.02))
    arm_g.scale = (0.006, sy * 0.75, 0.006)
    bpy.ops.object.transform_apply(scale=True)
    rigged(arm_g, FRAME)
bridge = add('cube', size=1, location=(cx, front - 0.004, ey + sx * 0.02))
bridge.scale = (sx * 0.17, 0.006, 0.007)
bpy.ops.object.transform_apply(scale=True)
rigged(bridge, FRAME)

# faccia dipinta: la testa Kenney è squadrata col davanti piatto, quindi ci appoggiamo una "maschera"
# con la texture disegnata qui sotto (barba corta, baffi uniti al pizzetto, occhi socchiusi)
import numpy as np

FW, FH = 256, 256
yy, xx = np.mgrid[0:FH, 0:FW]
u = (xx + 0.5) / FW          # 0 sinistra → 1 destra (guardando Giuseppe)
v = (yy + 0.5) / FH          # 0 in basso → 1 in alto
rng = np.random.default_rng(7)


def hexc(h):
    return np.array([int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)])


skin = hexc('f1c6a4')
beard_c = hexc('2b211c')
img_f = np.ones((FH, FW, 3)) * skin


def paint(mask, col, a=1.0):
    m = np.clip(mask, 0, 1)[..., None] * a
    img_f[:] = img_f * (1 - m) + col * m


def soft(d, w):  # 1 dentro (d<0), sfuma su una larghezza w
    return np.clip(0.5 - d / w, 0, 1)


x = u - 0.5
# ombra leggera del naso
nose = soft(np.hypot((x) / 0.07, (v - 0.5) / 0.08) - 1, 0.6)
paint(nose, skin * 0.86, 0.6)
# barba corta: segue la mascella, più fitta sul mento, sale ai lati fino alle basette
jaw = 0.34 - 0.4 * x ** 2 + 0.8 * np.abs(x) ** 1.5
grain = 0.8 + 0.2 * rng.random((FH, FW))
beard = soft(v - jaw, 0.05) * grain
paint(beard, beard_c, 0.95)
# baffi: arco pieno sopra la bocca che scende agli angoli
mus = soft(np.abs(v - (0.42 - 1.4 * x ** 2)) - 0.042, 0.015) * soft(np.abs(x) - 0.2, 0.02)
paint(mus, hexc(('231914')))
# bocca: una fessura scura appena visibile sotto i baffi
mouth = soft(np.hypot(x / 0.07, (v - 0.35) / 0.014) - 1, 0.5)
paint(mouth, hexc(('5a2f2a')), 0.9)
# occhi piccoli e socchiusi: ovale scuro con la palpebra sopra
for s_ in (-1, 1):
    ex, ey_ = 0.5 + s_ * 0.19 * sx / (fx1 - fx0), EYE_V
    eye = soft(np.hypot((u - ex) / 0.055, (v - ey_) / 0.04) - 1, 0.4) * (v < ey_ + 0.018)
    paint(eye, hexc(('1c1512')))
    lid = soft(np.abs(v - (ey_ + 0.016 - 8 * (u - ex) ** 2)) - 0.006, 0.006) * soft(np.abs(u - ex) - 0.06, 0.01)
    paint(lid, hexc(('6b4a3a')), 0.8)
    brow = soft(np.abs(v - (ey_ + 0.11 - 4 * (u - ex - s_ * 0.01) ** 2)) - 0.016, 0.01) * soft(np.abs(u - ex) - 0.09, 0.015)
    paint(brow, hexc(('2a1d17')))

face_img = bpy.data.images.new('faccia', FW, FH)
face_img.pixels = np.concatenate([img_f, np.ones((FH, FW, 1))], axis=2).astype(np.float32).ravel()
face_img.pack()
FACE = mat('faccia', (1, 1, 1), 0.8)
ft = FACE.node_tree.nodes.new('ShaderNodeTexImage')
ft.image = face_img
FACE.node_tree.links.new(ft.outputs['Color'], FACE.node_tree.nodes['Principled BSDF'].inputs['Base Color'])

mask = add('plane', size=1, location=((fx0 + fx1) / 2, front - 0.0015, (fz0 + fz1) / 2), rotation=(math.pi / 2, 0, 0))
mask.scale = (fx1 - fx0, fz1 - fz0, 1)
bpy.ops.object.transform_apply(scale=True, rotation=True)
rigged(mask, FACE)
# fascetta regolabile del berretto girato: si vede sulla fronte
band = add('cube', size=1, location=(cx, front + 0.004, lo.z + sz * 0.72))
band.scale = (sx * 0.34, 0.01, sz * 0.08)
bpy.ops.object.transform_apply(scale=True)
rigged(band, mat('fascetta', srgb('d9b8a8'), 0.7))

# unisce gli accessori alla testa: un solo mesh, stessa pelle
bpy.ops.object.select_all(action='DESELECT')
for p in parts:
    p.select_set(True)
head.select_set(True)
bpy.context.view_layer.objects.active = head
bpy.ops.object.join()
arm.name = 'giuseppe'

if preview:
    bpy.ops.object.light_add(type='SUN', rotation=(0.9, 0.3, -0.4))
    bpy.context.active_object.data.energy = 4
    bpy.ops.object.camera_add(location=(0.17, -0.75, 0.48), rotation=(math.radians(88), 0, math.radians(18)))
    sc = bpy.context.scene
    sc.camera = bpy.context.active_object
    sc.world = bpy.data.worlds.new('w')
    sc.world.use_nodes = True
    sc.world.node_tree.nodes['Background'].inputs[1].default_value = 0.8
    sc.render.engine = 'BLENDER_EEVEE'
    sc.render.resolution_x = sc.render.resolution_y = 600
    sc.render.filepath = preview
    bpy.ops.render.render(write_still=True)
    for o in list(bpy.data.objects):
        if o.type in ('LIGHT', 'CAMERA'):
            bpy.data.objects.remove(o)

bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', export_animations=False, export_apply=False)

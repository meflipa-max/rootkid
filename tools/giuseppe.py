"""
Giuseppe, il pizzaiolo: parte dal personaggio Kenney "character-male-a" (stesso scheletro, così
le animazioni di RIG valgono anche per lui) e gli aggiunge quello che lo rende riconoscibile:
berretto nero girato all'indietro, occhiali, barba e baffi, maglietta bianca, pantaloni a quadretti.

Uso (Blender, oppure il modulo Python: pip install bpy && python tools/giuseppe.py -- …):
  blender -b --python tools/giuseppe.py -- public/models/characters/character-male-a.glb giuseppe.raw.glb [anteprima.png]
  node tools/pack-ingredients.mjs giuseppe.raw.glb public/models/characters/giuseppe.glb --solo-quantize

Il berretto è girato all'indietro e deve leggersi come berretto anche di fronte (prima sembrava una
capigliatura): calotta aderente fatta con i raggi sulla testa, cuciture, bottone, fascia, visiera dietro
col sotto verde, apertura sulla fronte con la fascetta a bottoncini. La barba è in 3D, i baffi a parte.
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


# berretto girato all'indietro. Prima era una calotta liscia e larga: vista di fronte sembrava una capigliatura.
# Ora aderisce alla testa (i raggi partono dal centro e si fermano sulla pelle), ha le cuciture chiare, il
# bottone in cima, la fascia sul bordo, la visiera ben visibile dietro e, sulla fronte, l'apertura con la
# fascetta a bottoncini: i segni che fanno leggere "berretto" anche da lontano.
from mathutils.bvhtree import BVHTree

hm = head.data
hverts = [head.matrix_world @ v.co for v in hm.vertices]
hbvh = BVHTree.FromPolygons(hverts, [list(p.vertices) for p in hm.polygons])
z_edge = lo.z + sz * 0.69          # il bordo del berretto, appena sopra le sopracciglia
O = Vector((cx, cy, z_edge))
PHI = math.pi / 2


FAR = sz * 3


def ray_len(th, ph):
    """distanza dal centro della superficie più esterna in quella direzione: il raggio parte da fuori e viene
    verso il centro, così trova anche i ciuffi del modello originale che stanno sopra al cranio"""
    d = Vector((math.cos(th) * math.sin(ph), math.sin(th) * math.sin(ph), math.cos(ph))).normalized()
    hit, _, _, _ = hbvh.ray_cast(O + d * FAR, -d)
    return (hit - O).length if hit is not None else sz * 0.5


_lens = {}


def on_cap(th, ph, extra=0.0):
    """punto sulla superficie del berretto: raggio dal centro della testa fino alla pelle, poi un po' più in fuori
    (più in cima). Si prende la distanza più lunga dei dintorni: la testa è squadrata e gli spigoli, fra un punto
    e l'altro, bucherebbero la calotta."""
    k = (round(th, 4), round(ph, 4))
    if k not in _lens:
        _lens[k] = max(ray_len(th + a, min(PHI, max(0.0, ph + b))) for a in (-0.22, -0.11, 0, 0.11, 0.22) for b in (-0.16, -0.08, 0, 0.08, 0.16))
    d = Vector((math.cos(th) * math.sin(ph), math.sin(th) * math.sin(ph), math.cos(ph))).normalized()
    off = sz * (0.035 + 0.09 * math.cos(ph) ** 2) + extra
    return O + d * (_lens[k] + off)


def grid(nu, nv, f):
    bm = bmesh.new()
    rows = [[bm.verts.new(f(i / nu, j / nv)) for i in range(nu + 1)] for j in range(nv + 1)]
    for j in range(nv):
        for i in range(nu):
            bm.faces.new((rows[j][i], rows[j][i + 1], rows[j + 1][i + 1], rows[j + 1][i]))
    return bm


def make(bm, material, name='p', away=None):
    """`away` = punto da cui le facce devono guardare lontano (la calotta guarda fuori dalla testa)"""
    me_ = bpy.data.meshes.new(name)
    bm.normal_update()
    if isinstance(away, str):
        pass  # orientate già da chi chiama
    elif away is None:
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    else:
        for f in bm.faces:
            if (f.calc_center_median() - away).dot(f.normal) < 0:
                f.normal_flip()
    bm.normal_update()
    bm.to_mesh(me_)
    bm.free()
    o = bpy.data.objects.new(name, me_)
    bpy.context.scene.collection.objects.link(o)
    rigged(o, material)
    return o


def tube_along(pts, r, material, seg=6):
    """tubo lungo una linea (cuciture, bordo, baffi); r può cambiare lungo la linea; le punte sono chiuse"""
    bm = bmesh.new()
    rings = []
    for i, p in enumerate(pts):
        d = (pts[min(i + 1, len(pts) - 1)] - pts[max(i - 1, 0)]).normalized()
        a = d.orthogonal().normalized()
        b = d.cross(a)
        ri = r[i] if isinstance(r, (list, tuple)) else r
        rings.append([bm.verts.new(p + (a * math.cos(t) + b * math.sin(t)) * ri) for t in [k / seg * math.tau for k in range(seg)]])
    for i in range(len(rings) - 1):
        for k in range(seg):
            bm.faces.new((rings[i][k], rings[i][(k + 1) % seg], rings[i + 1][(k + 1) % seg], rings[i + 1][k]))
    bm.faces.new(list(reversed(rings[0])))
    bm.faces.new(rings[-1])
    return make(bm, material)


CAP = mat('berretto', srgb('23272f'), 0.7)
SEAM = mat('cuciture', srgb('6b7280'), 0.6)
UNDER = mat('sottovisiera', srgb('2f5a3a'), 0.7)
SNAP = mat('bottoncini', srgb('c9ccd1'), 0.35)
LOGO = mat('logo', srgb('d93a3a'), 0.6)
FRONT = -math.pi / 2               # i personaggi guardano verso -Y: lì c'è l'apertura
BACK = math.pi / 2                 # dietro c'è la visiera

# calotta
make(grid(64, 18, lambda u, v: on_cap(u * math.tau, 0.02 + v * (PHI - 0.02))), CAP, away=O)
# bottone in cima
bt = bmesh.new()
bmesh.ops.create_uvsphere(bt, u_segments=10, v_segments=6, radius=sz * 0.05)
bmesh.ops.translate(bt, verts=bt.verts, vec=on_cap(0, 0.0))
make(bt, CAP)
# sei cuciture dal bottone al bordo
for k in range(6):
    th = k / 6 * math.tau + math.pi / 6
    tube_along([on_cap(th, 0.06 + t / 12 * (PHI - 0.1), sz * 0.004) for t in range(13)], sz * 0.007, SEAM)
# fascia sul bordo
tube_along([on_cap(t / 48 * math.tau, PHI, sz * 0.002) for t in range(49)], sz * 0.022, CAP)

# davanti (cioè sulla fronte, perché è girato): l'apertura ad arco da cui si vede la pelle, e la fascetta
W = 0.3                             # mezza larghezza in radianti
H = 0.32                            # altezza dell'arco
make(grid(10, 6, lambda u, v: on_cap(FRONT + (u * 2 - 1) * W, PHI - 0.05 - v * H * math.sqrt(max(0.0, 1 - (u * 2 - 1) ** 2)), sz * 0.003)), SKIN, away=O)
make(grid(12, 2, lambda u, v: on_cap(FRONT + (u * 2 - 1) * W * 1.25, PHI - 0.03 - v * 0.2, sz * 0.008)), CAP, away=O)
for k in (-1, 0, 1):
    st_ = bmesh.new()
    bmesh.ops.create_uvsphere(st_, u_segments=8, v_segments=5, radius=sz * 0.022)
    bmesh.ops.translate(st_, verts=st_.verts, vec=on_cap(FRONT + k * W * 0.55, PHI - 0.12, sz * 0.014))
    make(st_, SNAP)

# dietro: la visiera (sopra nera, sotto verde come i berretti veri), un po' curva e inclinata in giù
L = sy * 0.55
SPAN = 0.95


def visor(u, v, below=0.0):
    th = BACK + (u * 2 - 1) * SPAN
    base = on_cap(th, PHI, 0)
    out = Vector((math.cos(th), math.sin(th), 0)).normalized()
    reach = L * v * math.sqrt(max(0.0, 1 - (u * 2 - 1) ** 2)) ** 0.7
    p = base + out * reach
    p.z -= reach * 0.22 + (u * 2 - 1) ** 2 * reach * 0.12 + below
    return p


make(grid(16, 5, lambda u, v: visor(u, v)), CAP, away=O - Vector((0, 0, sz * 3)))
make(grid(16, 5, lambda u, v: visor(1 - u, v, sz * 0.02)), UNDER, away=O + Vector((0, 0, sz * 3)))
tube_along([visor(t / 24, 1.0, sz * 0.01) for t in range(25)], sz * 0.012, CAP)
# un piccolo logo rosso dietro, sopra la visiera: girandolo si capisce subito che è un berretto
lg = grid(4, 3, lambda u, v: on_cap(BACK + (u * 2 - 1) * 0.22, PHI - 0.32 - v * 0.28, sz * 0.006))
make(lg, LOGO, away=O)

# occhiali: due anelli sottili, lenti, ponte e stanghette
ey = fz0 + (fz1 - fz0) * EYE_V
for s in (-1, 1):
    ring = add('torus', major_radius=sx * 0.1, minor_radius=sx * 0.008, major_segments=20, minor_segments=6,
               location=(cx + s * sx * 0.19, front - 0.006, ey), rotation=(math.pi / 2, 0, 0))
    rigged(ring, FRAME)
    _o = Vector((cx, cy, ey))
    _d = Vector((s, 0, 0))
    _h = BVHTree.FromPolygons([head.matrix_world @ v.co for v in head.data.vertices], [list(p.vertices) for p in head.data.polygons]).ray_cast(_o + _d * sx * 3, -_d)[0]
    side_x = _h.x if _h is not None else cx + s * sx * 0.45
    arm_g = add('cube', size=1, location=(side_x + s * 0.004, front + sy * 0.28, ey))
    arm_g.scale = (0.006, sy * 0.5, 0.006)
    bpy.ops.object.transform_apply(scale=True)
    rigged(arm_g, FRAME)
# le cavità degli occhi del modello originale (gli occhi erano oggetti a parte, tolti all'inizio) si vedevano
# sullo spigolo come fessure nere: le chiude un tassello color pelle appena dentro la testa
for s in (-1, 1):
    _o = Vector((cx, cy, ey))
    _d = Vector((s, 0, 0))
    _h = BVHTree.FromPolygons([head.matrix_world @ v.co for v in head.data.vertices], [list(p.vertices) for p in head.data.polygons]).ray_cast(_o + _d * sx * 3, -_d)[0]
    side_x = _h.x if _h is not None else cx + s * sx * 0.45
    x0, x1 = sorted((cx + s * (fx1 - fx0) * 0.25, side_x - s * 0.002))
    plug = add('cube', size=1, location=((x0 + x1) / 2, front + 0.04, ey))
    plug.scale = (x1 - x0, 0.074, sz * 0.3)
    bpy.ops.object.transform_apply(scale=True)
    rigged(plug, SKIN)
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
paint(beard, beard_c * 0.7 + skin * 0.3, 0.55)
# baffi: arco pieno sopra la bocca che scende agli angoli
mus = soft(np.abs(v - (0.42 - 1.4 * x ** 2)) - 0.042, 0.015) * soft(np.abs(x) - 0.2, 0.02)
paint(mus, hexc(('231914')), 0.5)
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
# --- barba in 3D: prima era dipinta sulla faccia piatta e sembrava un rettangolo scuro ----------------
# Segue guance e mascella (raggi orizzontali dal centro della testa fino alla pelle), sale ai lati fino alle
# basette sotto il berretto, scende un po' sotto il mento con la punta, e ha il bordo frastagliato.
BEARD = mat('barba3d', srgb('2e221c'), 0.95)
MUST3 = mat('baffi3d', srgb('3b2a20'), 0.9)
from mathutils import noise as _noise

fh = fz1 - fz0
mouth_z = fz0 + fh * 0.35
cheek_z = fz0 + fh * 0.5


def side_ray(th, z):
    """punto più esterno della testa all'altezza z, nella direzione th (0 = davanti, verso -Y)"""
    zz = min(max(z, lo.z + 0.004), hi.z - 0.004)
    o = Vector((cx, cy, zz))
    d = Vector((math.sin(th), -math.cos(th), 0))
    hit, _, _, _ = hbvh.ray_cast(o + d * FAR, -d)
    return (hit if hit is not None else o + d * sx * 0.5), d


def smooth(a, b, x):
    t = min(1.0, max(0.0, (x - a) / (b - a)))
    return t * t * (3 - 2 * t)


TH = 1.3                            # fin dove arriva ai lati: si ferma davanti alle orecchie
HANG = sz * 0.16                    # quanto scende sotto il mento


def beard_pt(u, v, outer=True):
    th = (u * 2 - 1) * TH
    a = abs(th)
    top = mouth_z - fh * 0.02 + (cheek_z - mouth_z) * smooth(0.22, 0.6, a) + fh * 0.08 * smooth(0.9, 1.25, a)
    bot = lo.z - HANG * math.cos(min(a, math.pi / 2)) ** 1.5 + (cheek_z - lo.z) * 0.6 * smooth(1.0, 1.3, a)
    z = top + (bot - top) * v
    p, d = side_ray(th, z)
    if z < lo.z:
        # sotto il mento la barba continua in giù, e si stringe verso la punta
        p = p.copy()
        p.z = z
        p -= d * (lo.z - z) * 0.35
    thick = sz * (0.004 + (0.03 + 0.06 * math.cos(min(a, math.pi / 2)) ** 2) * smooth(0.0, 0.35, v)) if outer else sz * 0.004
    q = p + d * thick
    # bitorzoli da pelo, e il bordo in basso frastagliato
    q += d * sz * 0.012 * abs(_noise.noise(Vector((th * 3, z * 25, 0.3)))) if outer else Vector()
    if v > 0.92 and outer:
        q.z -= sz * 0.03 * (0.5 + 0.5 * math.sin(th * 9))
    return q


bmb = grid(26, 9, lambda u, v: beard_pt(u, v))
# le facce guardano fuori dall'asse verticale della testa (anche quelle sui lati)
bmb.normal_update()
for f in bmb.faces:
    f.smooth = False
    c_ = f.calc_center_median()
    if (c_ - Vector((cx, cy, c_.z))).dot(f.normal) < 0:
        f.normal_flip()
make(bmb, BEARD, away='già orientate')
# il fondo della barba (si vede da sotto e di lato)
make(grid(26, 1, lambda u, v: beard_pt(u, 1.0, outer=(v < 0.5))), BEARD)
# baffi: due ciuffi spessi sopra la bocca che scendono agli angoli
for sgn in (-1, 1):
    pts = []
    for i in range(9):
        t = i / 8
        th = sgn * (0.02 + t * 0.42)
        p, d = side_ray(th, mouth_z + fh * 0.08 - t * t * fh * 0.12)
        pts.append(p + d * sz * (0.035 - 0.012 * t))
    tube_along(pts, [sz * (0.034 - 0.022 * (i / 8) ** 1.5) for i in range(9)], MUST3, 8)

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

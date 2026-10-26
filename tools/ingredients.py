"""
Ingredienti modellati in Blender, scritti in codice: quelli che nel gioco si confondevano fra loro
(latticini bianchi, funghi, creme, salumi, verdure cotte, fritti, patate, kebab e pulled pork, formaggi duri)
o che ingannavano (il peperoncino sembrava una carota, il panzerotto un pezzo di formaggio).

Regola: ogni ingrediente deve essere DIVERSO dagli altri e assomigliare a come si vede al banco.
Stesso stile "giocattolo" del resto del gioco: forme morbide, colori pieni, niente texture.

Esporta un solo file con un oggetto per ingrediente (il nome è la chiave usata in src/three/models.ts);
"<chiave>__layer" è la versione bassa da mettere sulla pizza o nel panino.
Unità come nel gioco (un piatto è largo circa 0,6), base appoggiata a z = 0.

Uso, con Blender installato:
    blender -b --python tools/ingredients.py -- public/models/ingredients/ingredients.raw.glb
oppure con il modulo Python di Blender (pip install bpy):
    python tools/ingredients.py public/models/ingredients/ingredients.raw.glb
poi alleggerire con:
    node tools/pack-ingredients.mjs
"""
import math
import random
import sys

import bpy  # prima di bmesh e mathutils: con il modulo bpy arrivano insieme a lui
import bmesh
from mathutils import Matrix, Vector, noise

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
OUT = argv[0] if argv else 'public/models/ingredients/ingredients.raw.glb'

bpy.ops.wm.read_factory_settings(use_empty=True)
SCENE = bpy.context.scene
rnd = random.Random(7)

# ---------- materiali ----------

_mats = {}


def lin(c):
    c = c / 255
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def mat(hexc, rough=0.8):
    k = (hexc, rough)
    if k in _mats:
        return _mats[k]
    m = bpy.data.materials.new(f'{hexc}_{rough}')
    m.use_nodes = True
    p = m.node_tree.nodes['Principled BSDF']
    h = hexc.lstrip('#')
    p.inputs['Base Color'].default_value = (lin(int(h[0:2], 16)), lin(int(h[2:4], 16)), lin(int(h[4:6], 16)), 1)
    p.inputs['Roughness'].default_value = rough
    p.inputs['Metallic'].default_value = 0
    _mats[k] = m
    return m


# ---------- forme di base (bmesh) ----------

def sphere(r=1.0, seg=16, ring=10):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=ring, radius=r)
    return bm


def cyl(r1, r2, h, seg=16):
    """tronco di cono con la base a z = 0"""
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=r1, radius2=r2, depth=h)
    bmesh.ops.translate(bm, verts=bm.verts, vec=(0, 0, h / 2))
    return bm


def box(sx, sy, sz):
    """parallelepipedo con la base a z = 0"""
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1)
    bmesh.ops.scale(bm, verts=bm.verts, vec=(sx, sy, sz))
    bmesh.ops.translate(bm, verts=bm.verts, vec=(0, 0, sz / 2))
    return bm


def slab(poly, t):
    """poligono nel piano XY estruso in altezza t (base a z = 0): fette, foglie, sagome"""
    bm = bmesh.new()
    vs = [bm.verts.new((x, y, 0)) for x, y in poly]
    f = bm.faces.new(vs)
    if f.normal.z < 0:
        f.normal_flip()
    r = bmesh.ops.extrude_face_region(bm, geom=[f])
    top = [e for e in r['geom'] if isinstance(e, bmesh.types.BMVert)]
    bmesh.ops.translate(bm, verts=top, vec=(0, 0, t))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    # triangola le facce grandi, così le deformazioni restano morbide
    bmesh.ops.triangulate(bm, faces=[f for f in bm.faces if len(f.verts) > 4])
    return bm


def tube(pts, radii, seg=8):
    """tubo lungo una linea (gambi, peperoncini, fili di stracciatella, sfilacci di carne)"""
    bm = bmesh.new()
    rings = []
    n = len(pts)
    for i, p in enumerate(pts):
        p = Vector(p)
        d = (Vector(pts[min(i + 1, n - 1)]) - Vector(pts[max(i - 1, 0)])).normalized()
        a = d.orthogonal().normalized()
        b = d.cross(a).normalized()
        r = radii[i] if isinstance(radii, (list, tuple)) else radii
        rings.append([bm.verts.new(p + (a * math.cos(t) + b * math.sin(t)) * max(r, 0.0015)) for t in [k / seg * math.tau for k in range(seg)]])
    for i in range(n - 1):
        for k in range(seg):
            bm.faces.new((rings[i][k], rings[i][(k + 1) % seg], rings[i + 1][(k + 1) % seg], rings[i + 1][k]))
    bm.faces.new(list(reversed(rings[0])))
    bm.faces.new(rings[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm


def torus(R, r, seg=24, ring=8, arc=math.tau):
    pts = [(R * math.cos(arc * i / seg), R * math.sin(arc * i / seg), 0) for i in range(seg + 1)]
    return tube(pts, r, ring)


# ---------- deformazioni ----------

def warp(bm, f):
    for v in bm.verts:
        v.co = f(v.co.copy())
    return bm


def lumpy(bm, amp, freq=6.0, seed=0.0):
    """bitorzoli morbidi lungo la normale (impasti fritti, carne sbriciolata, verdure cotte)"""
    bm.normal_update()
    for v in bm.verts:
        v.co += v.normal * amp * noise.noise(v.co * freq + Vector((seed, seed * 1.7, seed * 0.3)))
    return bm


def cup(bm, k):
    """fetta che si incurva a coppetta, come il salamino in forno"""
    return warp(bm, lambda c: Vector((c.x, c.y, c.z + k * (c.x * c.x + c.y * c.y))))


def wave(bm, amp, freq, axis=0, phase=0.0):
    """ondulato lungo un asse: fette appoggiate morbide, foglie appassite"""
    return warp(bm, lambda c: Vector((c.x, c.y, c.z + amp * math.sin(c[axis] * freq + phase))))


def bend(bm, k, axis=0):
    """curva verso l'alto alle estremità (strisce croccanti)"""
    return warp(bm, lambda c: Vector((c.x, c.y, c.z + k * c[axis] ** 2)))


# ---------- oggetti ----------

PARTS = []


def part(bm, color, loc=(0, 0, 0), rot=(0, 0, 0), scale=(1, 1, 1), rough=0.8, smooth=True, sub=0):
    me = bpy.data.meshes.new('p')
    bm.to_mesh(me)
    bm.free()
    me.materials.append(mat(color, rough))
    if smooth:
        me.shade_smooth()
    o = bpy.data.objects.new('p', me)
    SCENE.collection.objects.link(o)
    o.location = loc
    o.rotation_euler = rot
    o.scale = scale
    if sub:
        o.modifiers.new('sub', 'SUBSURF').levels = sub
    PARTS.append(o)
    return o


def done(name):
    """unisce i pezzi in un oggetto solo, appoggiato a terra e centrato"""
    global PARTS
    for o in bpy.context.selected_objects:
        o.select_set(False)
    for o in PARTS:
        o.select_set(True)
    bpy.context.view_layer.objects.active = PARTS[0]
    bpy.ops.object.convert(target='MESH')
    if len(PARTS) > 1:
        bpy.ops.object.join()
    o = bpy.context.view_layer.objects.active
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    xs = [v.co.x for v in o.data.vertices]
    ys = [v.co.y for v in o.data.vertices]
    zs = [v.co.z for v in o.data.vertices]
    off = Vector(((min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2, min(zs)))
    o.data.transform(Matrix.Translation(-off))
    o.name = name
    o.data.name = name
    o.location = (0, 0, 0)
    o.select_set(False)
    PARTS = []
    return o


def ring_pos(n, d, start=0.4):
    return [(math.cos(start + i / n * math.tau) * d, math.sin(start + i / n * math.tau) * d) for i in range(n)]


def ellipse(rx, ry, n=20, jitter=0.0, seed=0):
    rr = random.Random(seed)
    return [(rx * math.cos(t) * (1 + rr.uniform(-jitter, jitter)), ry * math.sin(t) * (1 + rr.uniform(-jitter, jitter))) for t in [i / n * math.tau for i in range(n)]]


# ======================================================================
# LATTICINI: quattro bianchi che prima erano la stessa pallina
# ======================================================================

def vaschetta(w=0.46, d=0.34, h=0.07):
    """la vaschetta d'acciaio del banco"""
    part(box(w, d, 0.012), '#7d868b', rough=0.35)
    for sx, sy, lx, ly in ((w, 0.016, 0, d / 2), (w, 0.016, 0, -d / 2), (0.016, d, w / 2, 0), (0.016, d, -w / 2, 0)):
        part(box(sx, sy, h), '#9aa3a8', loc=(lx, ly, 0), rough=0.3)


def fiordilatte():
    # al banco: fior di latte tagliato a julienne nella vaschetta d'acciaio
    vaschetta()
    for i in range(56):
        x, y = rnd.uniform(-0.19, 0.19), rnd.uniform(-0.13, 0.13)
        z = 0.012 + 0.1 * max(0.0, 1 - (x * x / 0.045 + y * y / 0.022)) * rnd.uniform(0.5, 1)
        part(box(0.11, 0.03, 0.028), '#fbf7ee', loc=(x, y, z), rot=(rnd.uniform(-0.3, 0.3), rnd.uniform(-0.3, 0.3), rnd.uniform(0, 3)), rough=0.55, sub=1)
    done('fiordilatte')
    # sulla pizza: chiazze sciolte
    for i, (x, y) in enumerate(ring_pos(4, 0.13) + [(0, 0)]):
        part(lumpy(sphere(0.085, 14, 8), 0.012, 9, i), '#f8f4ea', loc=(x, y, 0), scale=(1.15, 1, 0.28), rough=0.5)
    done('fiordilatte__layer')


def bufala():
    # mozzarella di bufala: grande, lucida, bianco porcellana, con il "nodino" e un pezzo strappato
    part(lumpy(sphere(0.18, 20, 12), 0.006, 4, 1), '#fbfbf7', loc=(-0.05, 0, 0.16), scale=(1, 1, 0.88), rough=0.22, sub=1)
    part(sphere(0.045, 12, 8), '#fbfbf7', loc=(-0.05, 0, 0.32), scale=(1, 1, 0.7), rough=0.22)
    part(torus(0.034, 0.013, 16, 6), '#e9e7dc', loc=(-0.05, 0, 0.305), rough=0.3)
    # il piattino blu fa risaltare il bianco porcellana
    part(cyl(0.27, 0.3, 0.025, 28), '#3f6f8f', loc=(0.02, 0.02, -0.025), rough=0.35)
    # mezzo pezzo strappato: fuori lucido, dentro a fibre
    half = sphere(0.09, 16, 10)
    bmesh.ops.delete(half, geom=[v for v in half.verts if v.co.x > 0.005], context='VERTS')
    part(half, '#fbfbf7', loc=(0.16, 0.05, 0.05), rot=(0, math.pi / 2, 0.4), rough=0.22)
    part(lumpy(cyl(0.088, 0.088, 0.01, 16), 0.01, 25, 3), '#eeeadb', loc=(0.16, 0.05, 0.05), rot=(0, math.pi / 2, 0.4), rough=0.7)
    done('bufala')
    for i, (x, y) in enumerate(ring_pos(4, 0.14) + [(0, 0)]):
        part(lumpy(sphere(0.075, 14, 8), 0.02, 7, i + 4), '#fcfcf8', loc=(x, y, 0.02), scale=(1.1, 0.9, 0.55), rough=0.22)
    done('bufala__layer')


def burrata():
    # sacchetto chiuso col nodo, legato con le foglie verdi come dal caseificio
    part(lumpy(sphere(0.16, 20, 12), 0.008, 5, 2), '#f3ead2', loc=(0, 0, 0.145), scale=(1, 1, 0.82), rough=0.4, sub=1)
    part(cyl(0.07, 0.02, 0.1, 16), '#efe7d0', loc=(0, 0, 0.24), rough=0.45)
    part(torus(0.03, 0.014, 16, 6), '#e9dfc4', loc=(0, 0, 0.33), rough=0.45)
    # appoggiata sulle sue foglie verdi, come arriva dal caseificio, e legata con un filo verde
    for k in range(5):
        t0 = k / 5 * math.tau + 0.3
        lf = wave(slab(leaf(0.3, 0.11, 10, 0, k), 0.008), 0.012, 16)
        part(lf, '#4f9a38' if k % 2 else '#3f8a2e', loc=(math.cos(t0) * 0.06, math.sin(t0) * 0.06, 0.0), rot=(0, -0.12, t0), rough=0.45)
    part(torus(0.045, 0.011, 16, 6), '#3f8a2e', loc=(0, 0, 0.27), rough=0.5)
    done('burrata')
    # sulla pizza: aperta, la pelle intorno e il cuore cremoso
    skin = sphere(0.13, 20, 12)
    bmesh.ops.delete(skin, geom=[v for v in skin.verts if v.co.z > 0.03], context='VERTS')
    part(lumpy(skin, 0.008, 8, 5), '#f6f0de', loc=(0, 0, 0.11), scale=(1, 1, 0.75), rough=0.4)
    part(lumpy(sphere(0.1, 18, 10), 0.012, 10, 6), '#fffaf0', loc=(0, 0, 0.1), scale=(1, 1, 0.45), rough=0.6)
    done('burrata__layer')


def strands(n, rad, h, color, seed, base=0.0):
    rr = random.Random(seed)
    for i in range(n):
        a, d = rr.uniform(0, math.tau), rr.uniform(0, rad * 0.8)
        x0, y0 = math.cos(a) * d, math.sin(a) * d
        ang = rr.uniform(0, math.tau)
        pts = []
        for s in range(9):
            t = s / 8
            pts.append((x0 + math.cos(ang + t * 2.2) * 0.07 * t, y0 + math.sin(ang + t * 2.2) * 0.07 * t, base + h * (0.4 + 0.6 * math.sin(t * math.pi)) * rr.uniform(0.7, 1)))
        part(tube(pts, 0.009, 5), color, rough=0.55)


def stracciatella():
    # nella ciotolina di terracotta: crema filante, sfilacci sopra
    part(cyl(0.15, 0.2, 0.1, 28), '#c66a45', rough=0.7)
    part(cyl(0.175, 0.175, 0.012, 28), '#f8f3e8', loc=(0, 0, 0.09), rough=0.6)
    part(lumpy(sphere(0.15, 20, 10), 0.012, 9, 8), '#fbf6ea', loc=(0, 0, 0.09), scale=(1, 1, 0.35), rough=0.55)
    strands(14, 0.13, 0.05, '#fffdf7', 11, base=0.1)
    done('stracciatella')
    for i, (x, y) in enumerate(ring_pos(5, 0.13)):
        part(lumpy(sphere(0.07, 14, 8), 0.015, 9, i + 20), '#fbf5e8', loc=(x, y, 0), scale=(1.2, 1, 0.32), rough=0.55)
    strands(8, 0.18, 0.03, '#fffdf7', 13, base=0.01)
    done('stracciatella__layer')


# ======================================================================
# FUNGHI: cinque ingredienti, prima un disegno solo
# ======================================================================

def mush_profile(cw, ch, sw, sh, n=12):
    """sagoma della fetta di fungo: cappello a mezzaluna sopra il gambo"""
    pts = [(sw / 2, 0), (sw / 2, sh)]
    for i in range(n + 1):
        t = i / n * math.pi
        pts.append((cw / 2 * math.cos(t), sh + ch * math.sin(t)))
    pts += [(-sw / 2, sh), (-sw / 2, 0)]
    # via i punti doppi
    out = []
    for p in pts:
        if not out or (abs(p[0] - out[-1][0]) > 1e-4 or abs(p[1] - out[-1][1]) > 1e-4):
            out.append(p)
    return out


def mush_slice(cw, ch, sw, sh, t, flesh, edge, loc, rot, rough=0.7):
    prof = mush_profile(cw, ch, sw, sh)
    part(slab([(x, y - (sh + ch) / 2) for x, y in prof], t), flesh, loc=loc, rot=rot, rough=rough)
    # bordino del cappello, appena più scuro
    arc = [(cw / 2 * 1.04 * math.cos(i / 14 * math.pi), sh + ch * 1.06 * math.sin(i / 14 * math.pi) - (sh + ch) / 2) for i in range(15)]
    inner = [(cw / 2 * 0.86 * math.cos(i / 14 * math.pi), sh + ch * 0.8 * math.sin(i / 14 * math.pi) - (sh + ch) / 2) for i in range(14, -1, -1)]
    part(slab(arc + inner, t * 1.08), edge, loc=(loc[0], loc[1], loc[2] - t * 0.04), rot=rot, rough=rough)


def funghi():
    # champignon trifolati: fette cotte, beige brunito e lucide d'olio, col prezzemolo
    for i, (x, y) in enumerate(ring_pos(6, 0.15) + [(0, 0)]):
        mush_slice(0.13, 0.06, 0.045, 0.06, 0.022, '#c4a27c', '#7a5236', (x, y, 0.01 + (i % 2) * 0.012), (0, 0, rnd.uniform(0, 6)), rough=0.45)
    for k in range(10):
        part(sphere(0.012, 6, 4), '#3f7d30', loc=(rnd.uniform(-0.2, 0.2), rnd.uniform(-0.2, 0.2), 0.04), scale=(1, 1, 0.5))
    done('funghi')


def freschi():
    # champignon crudi: bianchi, uno intero e qualche fetta
    part(cyl(0.035, 0.04, 0.07, 14), '#efe8da', loc=(-0.1, 0, 0), rough=0.6)
    cap = sphere(0.1, 20, 12)
    bmesh.ops.delete(cap, geom=[v for v in cap.verts if v.co.z < -0.002], context='VERTS')
    part(cap, '#f1e9da', loc=(-0.1, 0, 0.06), scale=(1, 1, 0.75), rough=0.6, sub=1)
    part(cyl(0.085, 0.085, 0.01, 20), '#d9c7a8', loc=(-0.1, 0, 0.055), rough=0.8)
    for i, (x, y) in enumerate(ring_pos(4, 0.13, 1.2)):
        mush_slice(0.12, 0.055, 0.04, 0.055, 0.02, '#f4eee2', '#cdb594', (x + 0.08, y, 0.0), (0, 0, rnd.uniform(0, 6)))
    done('freschi')
    for i, (x, y) in enumerate(ring_pos(5, 0.15) + [(0, 0)]):
        mush_slice(0.12, 0.055, 0.04, 0.055, 0.02, '#f2ebde', '#cdb594', (x, y, 0.0), (0, 0, rnd.uniform(0, 6)))
    done('freschi__layer')


def chiodino(x, y, h, cap):
    part(tube([(x, y, 0), (x + 0.01, y, h * 0.5), (x + 0.015, y + 0.005, h)], 0.009, 6), '#e2cfa6', rough=0.7)
    part(sphere(0.022, 10, 6), cap, loc=(x + 0.015, y + 0.005, h), scale=(1, 1, 0.55), rough=0.5)


def misti():
    # misto bosco: chiodini a ciuffo, finferli gialli a imbuto, fettine scure
    for k in range(7):
        chiodino(-0.12 + rnd.uniform(-0.04, 0.04), -0.04 + rnd.uniform(-0.04, 0.04), rnd.uniform(0.08, 0.13), '#a8672e')
    for i, (x, y) in enumerate([(0.08, 0.08), (0.14, -0.05)]):
        part(cyl(0.012, 0.055, 0.07, 14), '#e8a83a', loc=(x, y, 0), rough=0.55)
        part(cyl(0.055, 0.05, 0.008, 14), '#d38f2a', loc=(x, y, 0.068), rough=0.55)
    for i, (x, y) in enumerate([(-0.02, 0.14), (0.02, -0.15), (0.17, 0.08)]):
        mush_slice(0.1, 0.05, 0.035, 0.05, 0.02, '#8a6446', '#4a3020', (x, y, 0.0), (0, 0, rnd.uniform(0, 6)))
    done('misti')
    for k in range(4):
        x, y = ring_pos(4, 0.14)[k]
        part(sphere(0.022, 10, 6), '#a8672e', loc=(x, y, 0.015), scale=(1, 1, 0.55), rough=0.5)
        part(tube([(x - 0.05, y, 0.01), (x - 0.01, y, 0.012)], 0.008, 6), '#e2cfa6')
    for i, (x, y) in enumerate(ring_pos(3, 0.08, 1.0)):
        part(cyl(0.04, 0.04, 0.015, 12), '#e8a83a', loc=(x, y, 0), rough=0.55)
    mush_slice(0.1, 0.05, 0.035, 0.05, 0.02, '#8a6446', '#4a3020', (0.17, -0.1, 0), (0, 0, 1))
    done('misti__layer')


def porcino(x, y, s=1.0):
    st = lumpy(cyl(0.075 * s, 0.055 * s, 0.13 * s, 18), 0.006 * s, 20, x)
    part(st, '#ead9b8', loc=(x, y, 0), rough=0.75, sub=1)
    cap = sphere(0.14 * s, 22, 12)
    bmesh.ops.delete(cap, geom=[v for v in cap.verts if v.co.z < -0.001], context='VERTS')
    part(lumpy(cap, 0.006 * s, 6, y), '#6a3a1a', loc=(x, y, 0.115 * s), scale=(1, 1, 0.62), rough=0.4, sub=1)
    part(cyl(0.13 * s, 0.12 * s, 0.014 * s, 22), '#d8c06e', loc=(x, y, 0.105 * s), rough=0.85)


def porcini():
    # porcino intero: cappello marrone scuro lucido, gambo grosso chiaro, sotto la spugna gialla
    porcino(-0.06, 0)
    for i, (x, y) in enumerate([(0.17, -0.06), (0.16, 0.1)]):
        mush_slice(0.17, 0.07, 0.09, 0.08, 0.025, '#f0e3c6', '#6a3a1a', (x, y, 0.0), (0, 0, 0.3 + i), rough=0.65)
    done('porcini')
    for i, (x, y) in enumerate(ring_pos(4, 0.15) + [(0, 0)]):
        mush_slice(0.15, 0.065, 0.08, 0.07, 0.024, '#efe0c0', '#6a3a1a', (x, y, 0.0), (0, 0, rnd.uniform(0, 6)), rough=0.6)
    done('porcini__layer')


def porcinifritti():
    # porcini panati e fritti: la sagoma del fungo, ma dorata e granulosa
    for i, (x, y) in enumerate(ring_pos(4, 0.15) + [(0, 0)]):
        prof = mush_profile(0.15, 0.065, 0.08, 0.07)
        bm = slab([(px, py - 0.07) for px, py in prof], 0.035)
        bmesh.ops.subdivide_edges(bm, edges=bm.edges, cuts=2, use_grid_fill=True)
        part(lumpy(bm, 0.008, 40, i), '#d99a3a', loc=(x, y, 0.0), rot=(0, 0, rnd.uniform(0, 6)), rough=0.85, smooth=False)
    done('porcinifritti')


# ======================================================================
# CREME: la ciotolina con la crema e, accanto, la cosa da cui è fatta
# ======================================================================

def bowl(color):
    part(cyl(0.11, 0.17, 0.11, 28), '#3f6f8f', rough=0.35)
    part(torus(0.168, 0.012, 28, 6), '#e9eef2', loc=(0, 0, 0.11), rough=0.35)
    top = lumpy(sphere(0.16, 22, 10), 0.006, 6, len(PARTS))
    part(top, color, loc=(0, 0, 0.1), scale=(1, 1, 0.22), rough=0.45)
    # il ricciolo della crema
    pts = [(math.cos(t) * (0.1 - t * 0.012), math.sin(t) * (0.1 - t * 0.012), 0.135 + t * 0.004) for t in [i / 16 * 4.5 for i in range(17)]]
    part(tube(pts, 0.016, 8), color, rough=0.45)


def side(x=0.22, y=-0.02):
    return x, y


def czucca():
    bowl('#e8892c')
    # spicchio di zucca: buccia verde, polpa arancione, semi
    wedge = slab([(0, 0)] + [(0.16 * math.cos(t), 0.16 * math.sin(t)) for t in [i / 8 * 0.9 for i in range(9)]], 0.06)
    part(wedge, '#f0a03a', loc=(0.12, -0.2, 0), rot=(0, 0, -0.3), rough=0.6)
    part(torus(0.16, 0.014, 10, 6, 0.9), '#4f6a2e', loc=(0.12, -0.2, 0.03), rot=(0, 0, -0.3))
    for k in range(5):
        part(sphere(0.014, 8, 6), '#f3e6c0', loc=(rnd.uniform(-0.07, 0.07), rnd.uniform(-0.07, 0.07), 0.15), scale=(1.6, 1, 0.5))
    done('czucca')


def czucchine():
    bowl('#a9c76a')
    for i in range(3):
        part(cyl(0.05, 0.05, 0.02, 18), '#3f7a2e', loc=(0.2 + i * 0.03, -0.12 + i * 0.04, 0.0 + i * 0.012), rot=(0.2, 0, 0), rough=0.5)
        part(cyl(0.042, 0.042, 0.022, 18), '#e6edb8', loc=(0.2 + i * 0.03, -0.12 + i * 0.04, 0.0 + i * 0.012), rot=(0.2, 0, 0), rough=0.6)
    done('czucchine')


def czucchine_pepper(n, color='#2b211c', z=0.15, r=0.1):
    for k in range(n):
        a, d = rnd.uniform(0, math.tau), rnd.uniform(0, r)
        part(sphere(0.008, 6, 4), color, loc=(math.cos(a) * d, math.sin(a) * d, z), smooth=False)


def ccacio():
    # cacio e pepe: crema avorio piena di pepe nero, e una forma di pecorino accanto
    bowl('#efe3c4')
    czucchine_pepper(26)
    part(cyl(0.085, 0.085, 0.07, 20), '#f2e8cf', loc=(0.21, -0.12, 0), rough=0.8)
    part(torus(0.085, 0.01, 20, 6), '#8a6a3a', loc=(0.21, -0.12, 0.07), rough=0.8)
    part(torus(0.085, 0.01, 20, 6), '#8a6a3a', loc=(0.21, -0.12, 0.0), rough=0.8)
    for k in range(6):
        part(sphere(0.012, 6, 4), '#2b211c', loc=(0.24 + rnd.uniform(-0.05, 0.05), -0.2 + rnd.uniform(-0.03, 0.03), 0.008), smooth=False)
    done('ccacio')


def cgorgo():
    # crema di gorgonzola: chiara con le venature blu-verdi, e il cubetto di gorgonzola
    bowl('#ece6cf')
    for k in range(5):
        a = rnd.uniform(0, math.tau)
        pts = [(math.cos(a + t) * (0.03 + t * 0.03), math.sin(a + t) * (0.03 + t * 0.03), 0.142) for t in [i / 6 * 1.6 for i in range(7)]]
        part(tube(pts, 0.007, 5), '#4f8a86', rough=0.5)
    part(box(0.1, 0.09, 0.08), '#efe9cf', loc=(0.21, -0.14, 0), rot=(0, 0, 0.4), rough=0.7, sub=1)
    for k in range(5):
        part(sphere(0.014, 8, 6), '#4b7a7a', loc=(0.21 + rnd.uniform(-0.04, 0.04), -0.14 + rnd.uniform(-0.04, 0.04), 0.075), scale=(1.5, 1, 0.4))
    done('cgorgo')


def leaf(length, width, n=10, jag=0.0, seed=0):
    """foglia a punta (con il bordo frastagliato se jag > 0), sdraiata lungo X"""
    rr = random.Random(seed)
    up, lo = [], []
    for i in range(n + 1):
        t = i / n
        w = width * math.sin(math.pi * min(1, t * 1.08)) * (1 - t * 0.25)
        j = (jag * (1 if i % 2 else -0.4) * rr.uniform(0.6, 1)) if 0 < i < n else 0
        up.append((t * length, max(0.002, w / 2 + j)))
        lo.append((t * length, -max(0.002, w / 2 + j)))
    return up + list(reversed(lo[1:-1]))


def cradicchio():
    bowl('#a24a63')
    part(wave(slab(leaf(0.26, 0.14, 10, 0.0, 3), 0.012), 0.02, 18), '#8e2a4a', loc=(0.08, -0.22, 0.01), rot=(0, 0, 0.2), rough=0.5)
    part(slab([(0, 0.006), (0.24, 0.004), (0.24, -0.004), (0, -0.006)], 0.016), '#f3e6ea', loc=(0.08, -0.22, 0.012), rot=(0, 0, 0.2))
    part(wave(box(0.18, 0.05, 0.012), 0.012, 30), '#9b3a30', loc=(0.24, 0.0, 0.0), rot=(0, 0, 1.2), rough=0.6)
    done('cradicchio')


def cfunghi():
    bowl('#b08a63')
    part(cyl(0.025, 0.03, 0.05, 12), '#efe6d6', loc=(0.21, -0.12, 0), rough=0.6)
    cap = sphere(0.06, 16, 8)
    bmesh.ops.delete(cap, geom=[v for v in cap.verts if v.co.z < -0.001], context='VERTS')
    part(cap, '#c49a6c', loc=(0.21, -0.12, 0.045), scale=(1, 1, 0.75), rough=0.5)
    done('cfunghi')


def pesto():
    bowl('#5d9a3a')
    for k in range(6):
        part(sphere(0.014, 8, 6), '#f1e3b8', loc=(rnd.uniform(-0.08, 0.08), rnd.uniform(-0.08, 0.08), 0.15), scale=(1.5, 1, 0.6))
    for i in range(2):
        part(wave(slab(leaf(0.12, 0.07, 8, 0, 9 + i), 0.008), 0.008, 25), '#3f8a2e', loc=(0.16 + i * 0.05, -0.17 + i * 0.03, 0.005 + i * 0.01), rot=(0, 0, 0.5 + i), rough=0.4)
    done('pesto')


def plum(x, y, color, rot=0.0):
    t = lumpy(sphere(0.05, 16, 10), 0.002, 8, x)
    part(t, color, loc=(x, y, 0.045), rot=(0, math.pi / 2, rot), scale=(1.6, 1, 1), rough=0.3)
    part(cyl(0.012, 0.004, 0.03, 6), '#3f7a2a', loc=(x - math.cos(rot) * 0.075, y - math.sin(rot) * 0.075, 0.07), rot=(0, -1.2, rot))


def smarzano():
    # San Marzano: il sugo e due pomodori allungati
    bowl('#c8301f')
    plum(0.2, -0.13, '#d12a1a', 0.4)
    plum(0.25, 0.02, '#c42416', 1.4)
    done('smarzano')


def pgiallo():
    bowl('#f0b93a')
    plum(0.2, -0.13, '#f2b81c', 0.4)
    plum(0.25, 0.02, '#e8a812', 1.4)
    done('pgiallo')


def balsamico():
    # glassa di aceto balsamico: bottiglietta scura col beccuccio e lo zig-zag sul piattino
    part(cyl(0.2, 0.19, 0.015, 28), '#f6f3ee', rough=0.3)
    pts = [(-0.14 + i * 0.028, 0.08 * (1 if i % 2 else -1), 0.02) for i in range(11)]
    part(tube(pts, 0.009, 6), '#3a1f14', rough=0.25)
    part(cyl(0.06, 0.06, 0.22, 18), '#2a1710', loc=(0.16, 0.12, 0), rough=0.25)
    part(cyl(0.06, 0.02, 0.06, 18), '#2a1710', loc=(0.16, 0.12, 0.22), rough=0.25)
    part(cyl(0.012, 0.006, 0.05, 8), '#e8dccb', loc=(0.16, 0.12, 0.28), rough=0.4)
    part(cyl(0.062, 0.062, 0.06, 18), '#e9d9b0', loc=(0.16, 0.12, 0.07), rough=0.6)
    done('balsamico')


# ======================================================================
# SALUMI: fette diverse per ognuno
# ======================================================================

def disc_poly(r, n=20, jit=0.0, seed=0, sx=1.0):
    rr = random.Random(seed)
    return [(r * sx * math.cos(t) * (1 + rr.uniform(-jit, jit)), r * math.sin(t) * (1 + rr.uniform(-jit, jit))) for t in [i / n * math.tau for i in range(n)]]


def dots_on(x, y, z, r, n, color, size=0.012, seed=0, flat=0.35):
    rr = random.Random(seed)
    for k in range(n):
        a, d = rr.uniform(0, math.tau), math.sqrt(rr.uniform(0, 1)) * r
        part(sphere(size * rr.uniform(0.7, 1.2), 6, 4), color, loc=(x + math.cos(a) * d, y + math.sin(a) * d, z), scale=(1, 1, flat), rough=0.7)


def salamino(layer=False):
    # salamino piccante: fettine piccole rosso vivo che si incurvano a coppetta, grasso a puntini
    pos = ring_pos(6, 0.14) + [(0, 0)]
    for i, (x, y) in enumerate(pos):
        bm = slab(disc_poly(0.062, 22), 0.012)
        part(cup(bm, 0 if layer else 4.5), '#c8331f', loc=(x, y, 0.004 * i), rough=0.55)
        part(cup(slab(disc_poly(0.066, 22), 0.008), 0 if layer else 4.5), '#8a1f12', loc=(x, y, 0.004 * i - 0.002), rough=0.6)
        dots_on(x, y, 0.004 * i + (0.012 if layer else 0.02), 0.045, 4 if layer else 6, '#f8d8c8', 0.008, i)
    done('salamino__layer' if layer else 'salamino')


def spianata():
    # spianata piccante: fette grandi e ovali, rosso mattone, grasso a pezzi grossi e scaglie di peperoncino
    for i, (x, y) in enumerate([(-0.09, -0.04), (0.08, 0.05), (0.0, 0.1)]):
        rot = (0, 0, 0.4 + i * 0.9)
        part(slab(disc_poly(0.09, 22, 0.03, i, 1.55), 0.013), '#9a2a20', loc=(x, y, 0.012 * i), rot=rot, rough=0.6)
        rr = random.Random(i + 40)
        for k in range(6):
            dx, dy = rr.uniform(-0.1, 0.1), rr.uniform(-0.05, 0.05)
            c, s = math.cos(rot[2]), math.sin(rot[2])
            part(lumpy(sphere(0.016, 8, 5), 0.004, 30, k), '#f3d6c6', loc=(x + c * dx - s * dy, y + s * dx + c * dy, 0.012 * i + 0.013), scale=(1.2, 1, 0.3))
        for k in range(5):
            dx, dy = rr.uniform(-0.1, 0.1), rr.uniform(-0.05, 0.05)
            part(box(0.012, 0.008, 0.004), '#ef4a1f', loc=(x + dx, y + dy, 0.012 * i + 0.013), rot=(0, 0, rr.uniform(0, 3)))
    done('spianata')


def capocollo():
    # capocollo di Martina Franca: fette marezzate, carne scura con le venature di grasso e il bordo affumicato
    for i, (x, y) in enumerate([(-0.08, -0.03), (0.08, 0.02), (0.0, 0.11)]):
        rot = (0, 0, 0.3 + i * 1.1)
        bm = slab(disc_poly(0.1, 24, 0.06, i + 3, 1.3), 0.012)
        bmesh.ops.subdivide_edges(bm, edges=bm.edges, cuts=1, use_grid_fill=True)
        part(wave(bm, 0.012, 22), '#8e2a26', loc=(x, y, 0.014 * i), rot=rot, rough=0.55)
        part(torus(0.1, 0.008, 24, 5), '#4a1d16', loc=(x, y, 0.014 * i + 0.006), rot=rot, scale=(1.3, 1, 1))
        rr = random.Random(i + 60)
        for k in range(3):
            a = rr.uniform(0, math.tau)
            pts = [((t - 0.5) * 0.16, 0.03 * math.sin(t * 5 + a), 0.0) for t in [s / 7 for s in range(8)]]
            part(tube(pts, 0.006, 5), '#f4d2c6', loc=(x + rr.uniform(-0.03, 0.03), y + rr.uniform(-0.03, 0.03), 0.014 * i + 0.016), rot=rot, scale=(1, 1, 0.4))
    done('capocollo')


def speck():
    # speck: fette larghe e sottili, rosso scuro, disposte a ventaglio con la cotenna nera sul bordo
    for i in range(4):
        r = -0.5 + i * 0.32
        c, sn = math.cos(r), math.sin(r)
        bm = box(0.3, 0.13, 0.01)
        bmesh.ops.subdivide_edges(bm, edges=bm.edges, cuts=3, use_grid_fill=True)
        part(wave(bm, 0.008, 14, 1, i), '#7e2a22', loc=(c * 0.02, sn * 0.02, 0.012 * i), rot=(0, 0, r), rough=0.6)
        part(box(0.3, 0.025, 0.013), '#f3dccd', loc=(-sn * 0.07, c * 0.07, 0.012 * i), rot=(0, 0, r), rough=0.6)
        part(box(0.3, 0.014, 0.016), '#2a120c', loc=(-sn * 0.088, c * 0.088, 0.012 * i), rot=(0, 0, r), rough=0.7)
    done('speck')


def ribbon(length, width, color, fat, loc, rot, folds=2.5, amp=0.035, seed=0):
    """fetta sottile a nastro, piegata a onde (il crudo appoggiato morbido)"""
    bm = box(length, width, 0.01)
    bmesh.ops.subdivide_edges(bm, edges=[e for e in bm.edges if abs(e.verts[0].co.x - e.verts[1].co.x) > 0.05], cuts=14)
    wave(bm, amp, folds * math.tau / length, 0, seed)
    part(bm, color, loc=loc, rot=rot, rough=0.5)
    f = box(length, width * 0.35, 0.012)
    bmesh.ops.subdivide_edges(f, edges=[e for e in f.edges if abs(e.verts[0].co.x - e.verts[1].co.x) > 0.05], cuts=14)
    wave(f, amp, folds * math.tau / length, 0, seed)
    c, s = math.cos(rot[2]), math.sin(rot[2])
    part(f, fat, loc=(loc[0] - s * width * 0.6, loc[1] + c * width * 0.6, loc[2]), rot=rot, rough=0.5)


def crudo():
    # prosciutto crudo: nastri sottili rosa intenso con la fascia larga di grasso, appoggiati a onde
    ribbon(0.36, 0.17, '#e2857f', '#fbefe6', (0, -0.06, 0.05), (0, 0, 0.1), 1.1, 0.045, 0)
    ribbon(0.34, 0.16, '#e9958e', '#fbefe6', (0.02, 0.08, 0.075), (0, 0, -0.2), 1.0, 0.04, 2.0)
    done('crudo')


def cotto():
    # prosciutto cotto: fette grandi rosa chiaro piegate a metà, bordino bianco e la pelle più scura
    for i, (x, y, r) in enumerate([(-0.06, -0.02, 0.3), (0.07, 0.04, 2.2)]):
        half = [(0.15 * math.cos(t), 0.15 * math.sin(t)) for t in [k / 16 * math.pi for k in range(17)]]
        part(slab(half, 0.018), '#f3b4a8', loc=(x, y, 0.02 * i), rot=(0, 0, r), rough=0.5)
        part(torus(0.15, 0.01, 18, 5, math.pi), '#fbe9e2', loc=(x, y, 0.02 * i + 0.009), rot=(0, 0, r))
        part(torus(0.162, 0.006, 18, 5, math.pi), '#c97a6a', loc=(x, y, 0.02 * i + 0.009), rot=(0, 0, r))
    done('cotto')


def pancetta():
    # pancetta a dadini: cubetti a strati rosa e bianchi
    for i in range(11):
        x, y = rnd.uniform(-0.17, 0.17), rnd.uniform(-0.17, 0.17)
        r = rnd.uniform(0, 3)
        for k, c in enumerate(['#d36a62', '#f6e2d6', '#c95a52', '#f6e2d6']):
            part(box(0.05, 0.05, 0.013), c, loc=(x, y, k * 0.013), rot=(0, 0, r), rough=0.6, smooth=False)
    done('pancetta')


def pcoppata():
    # pancetta coppata: fette tonde arrotolate a spirale
    for i, (x, y) in enumerate([(-0.09, -0.04), (0.09, -0.02), (0.0, 0.1)]):
        part(cyl(0.095, 0.095, 0.014, 24), '#d27870', loc=(x, y, 0.012 * i), rough=0.55)
        pts = [(math.cos(t) * t * 0.0075, math.sin(t) * t * 0.0075, 0) for t in [k / 40 * 12 for k in range(41)]]
        part(tube(pts, 0.006, 5), '#f6e6dc', loc=(x, y, 0.012 * i + 0.014), scale=(1, 1, 0.5))
        part(torus(0.095, 0.007, 24, 5), '#8a3a32', loc=(x, y, 0.012 * i + 0.007))
    done('pcoppata')


def guanciale():
    # guanciale croccante: listarelle arricciate, dorate con il grasso ambrato
    for i in range(7):
        x, y = rnd.uniform(-0.14, 0.14), rnd.uniform(-0.14, 0.14)
        r = rnd.uniform(0, 3)
        bm = box(0.15, 0.035, 0.016)
        bmesh.ops.subdivide_edges(bm, edges=[e for e in bm.edges if abs(e.verts[0].co.x - e.verts[1].co.x) > 0.05], cuts=6)
        part(bend(bm, 2.2), '#b8652e', loc=(x, y, 0.0), rot=(0, 0, r), rough=0.5)
        f = box(0.15, 0.012, 0.018)
        bmesh.ops.subdivide_edges(f, edges=[e for e in f.edges if abs(e.verts[0].co.x - e.verts[1].co.x) > 0.05], cuts=6)
        c, s = math.cos(r), math.sin(r)
        part(bend(f, 2.2), '#f0c98a', loc=(x - s * 0.02, y + c * 0.02, 0.0), rot=(0, 0, r), rough=0.35)
    done('guanciale')


def marbling(center_pts, R, n, seed, fat='#f4e0d6', pepper=12):
    """pezzetti di grasso bianco e pepe nero sulla superficie di un budello"""
    rr = random.Random(seed)
    m = len(center_pts)
    for k in range(n + pepper):
        i = rr.randrange(1, m - 1)
        p, q = Vector(center_pts[i - 1]), Vector(center_pts[i + 1])
        t = (q - p).normalized()
        side = t.cross(Vector((0, 0, 1))).normalized()
        a = rr.uniform(-1.3, 1.3)
        d = (side * math.sin(a) + Vector((0, 0, 1)) * math.cos(a)).normalized()
        c = Vector(center_pts[i]) + d * R * 0.97
        if k < n:
            # scaglie di grasso allungate lungo il budello
            part(sphere(rr.uniform(0.008, 0.013), 6, 4), fat, loc=c, rot=(0, 0, math.atan2(t.y, t.x) + rr.uniform(-0.4, 0.4)), scale=(2.2, 1, 0.45), rough=0.4)
        else:
            part(sphere(0.004, 4, 3), '#2b211c', loc=c, smooth=False)


def salsiccia():
    # salsiccia a ruota, cruda: un budello lungo arrotolato a spirale, rosa con il grasso a pezzetti e il pepe
    R = 0.036
    pts = []
    turns = 2.3
    for i in range(140):
        t = i / 139
        a = t * turns * math.tau
        r = 0.25 - t * 0.19
        pts.append((math.cos(a) * r, math.sin(a) * r, R))
    radii = [R * min(1, 0.45 + min(i, 139 - i) / 4) for i in range(140)]
    part(tube(pts, radii, 12), '#a8392c', rough=0.3)
    marbling(pts, R, 140, 3, fat='#f3ddd2', pepper=24)
    done('salsiccia')
    # sulla pizza si sbriciola
    for i in range(12):
        x, y = rnd.uniform(-0.17, 0.17), rnd.uniform(-0.17, 0.17)
        part(lumpy(sphere(0.04, 10, 6), 0.012, 18, i), '#c96650' if i % 3 else '#b8503c', loc=(x, y, 0.02), scale=(1.1, 1, 0.65), rough=0.6, smooth=False)
        dots_on(x, y, 0.045, 0.025, 2, '#f4e0d6', 0.01, i + 50)
    done('salsiccia__layer')


def norcia():
    # salsiccia di Norcia: stesso impasto, ma a catenella di salsicce legate, e qualche rondella
    R = 0.036
    for k, (y, rot) in enumerate([(-0.07, 0.12), (0.05, -0.08)]):
        pts = [(-0.18 + t * 0.36, y + 0.015 * math.sin(t * 3), R) for t in [i / 24 for i in range(25)]]
        # strozzature dove è legata
        radii = [R * (0.45 if i in (0, 24) else 0.55 if i in (8, 16) else 0.8 if i in (7, 9, 15, 17) else 1) for i in range(25)]
        part(tube(pts, radii, 12), '#a8392c', rot=(0, 0, rot), rough=0.3)
        c, s2 = math.cos(rot), math.sin(rot)
        rp = [(px * c - py * s2, px * s2 + py * c, pz) for px, py, pz in pts]
        marbling(rp, R, 26, 20 + k)
        for i in (8, 16):
            part(torus(R * 0.6, 0.006, 12, 4), '#f1e6c8', loc=rp[i], rot=(0, math.pi / 2, rot))
    for i, (x, y) in enumerate([(-0.08, 0.16), (0.04, 0.17), (0.15, 0.13)]):
        part(cyl(0.04, 0.04, 0.02, 16), '#c25a44', loc=(x, y, 0), rough=0.6)
        dots_on(x, y, 0.02, 0.028, 5, '#f4e0d6', 0.008, i + 80)
        dots_on(x, y, 0.02, 0.028, 4, '#2b211c', 0.005, i + 90)
    done('norcia')


# ======================================================================
# VERDURE
# ======================================================================

def friarielli(flat=False):
    # friarielli: steli sottili, foglie strette lucide d'olio e le cimette a grappolo
    for i in range(6):
        a = i / 6 * math.tau + rnd.uniform(-0.3, 0.3)
        z0 = 0.02
        pts = [(math.cos(a) * t * 0.22, math.sin(a) * t * 0.22, z0 + (0 if flat else 0.04) * math.sin(t * math.pi)) for t in [k / 6 for k in range(7)]]
        part(tube(pts, 0.012, 6), '#6a9a3a', rough=0.4)
        tip = Vector(pts[-1])
        for k in range(6):
            part(sphere(0.022, 6, 4), '#2a5a1c', loc=tip + Vector((rnd.uniform(-0.03, 0.03), rnd.uniform(-0.03, 0.03), rnd.uniform(0, 0.02))), rough=0.5, smooth=False)
        for s in (0.2, 0.45, 0.7):
            p = Vector(pts[int(s * 6)])
            part(wave(slab(leaf(0.15, 0.055, 8, 0.008, i), 0.007), 0.012, 30), '#2f6a26', loc=p, rot=(0, 0, a + (0.9 if int(s * 10) % 2 else -0.9)), rough=0.35)
    done('friarielli__layer' if flat else 'friarielli')


def cicoria(flat=False):
    # cicoria ripassata: foglie lunghe frastagliate verde scuro con la costa chiara
    for i in range(8):
        a = i / 8 * math.tau + rnd.uniform(-0.2, 0.2)
        bm = slab(leaf(0.3, 0.11, 14, 0.02, i), 0.008)
        part(wave(bm, 0.01 if flat else 0.025, 20), '#2c5a24', loc=(0, 0, 0.004 * i), rot=(0, 0, a), rough=0.45)
        part(wave(slab([(0, 0.006), (0.25, 0.002), (0.25, -0.002), (0, -0.006)], 0.011), 0.01 if flat else 0.025, 20), '#d6dfbe', loc=(0, 0, 0.004 * i), rot=(0, 0, a), rough=0.5)
    done('cicoria__layer' if flat else 'cicoria')


def spinaci(flat=False):
    # spinaci: foglie tonde e lisce, a cucchiaio, col picciolo corto
    for i, (x, y) in enumerate(ring_pos(6, 0.13) + [(0, 0)]):
        r = rnd.uniform(0, 6)
        part(cup(slab(disc_poly(0.075, 20, 0.0, i, 1.3), 0.008), 0 if flat else 3.0), '#2a6a2c', loc=(x, y, 0.005 * i), rot=(0, 0, r), rough=0.35)
        c, s = math.cos(r), math.sin(r)
        part(tube([(x + c * 0.09, y + s * 0.09, 0.01), (x + c * 0.14, y + s * 0.14, 0.008)], 0.006, 5), '#6a9a3a')
    done('spinaci__layer' if flat else 'spinaci')


def chili(x, y, rot, length=0.3):
    pts = [(t * length, 0.06 * math.sin(t * 2.4) * t, 0.035 * (1 - t)) for t in [k / 12 for k in range(13)]]
    radii = [0.035 * (1 - t ** 1.6) + 0.003 for t in [k / 12 for k in range(13)]]
    part(tube(pts, radii, 12), '#d8261c', loc=(x, y, 0.035), rot=(0, 0, rot), rough=0.25)
    c, s = math.cos(rot), math.sin(rot)
    part(cyl(0.038, 0.03, 0.025, 12), '#3f7a2a', loc=(x - c * 0.012, y - s * 0.012, 0.035), rot=(0, -math.pi / 2, rot), rough=0.5)
    part(tube([(x - c * 0.03, y - s * 0.03, 0.07), (x - c * 0.07, y - s * 0.07, 0.09)], 0.008, 6), '#5a8a3a')


def peperoncino():
    # peperoncino: rosso lucido, curvo e appuntito, col picciolo verde (prima sembrava una carota)
    chili(-0.16, -0.06, 0.15)
    chili(-0.12, 0.08, -0.1, 0.26)
    for i, (x, y) in enumerate([(0.15, -0.12), (0.2, 0.0), (0.13, 0.1)]):
        part(torus(0.026, 0.009, 14, 6), '#d8261c', loc=(x, y, 0.008), rough=0.3)
        dots_on(x, y, 0.008, 0.012, 3, '#f3e1a0', 0.005, i)
    done('peperoncino')
    for i, (x, y) in enumerate(ring_pos(6, 0.15) + [(0, 0)]):
        part(torus(0.026, 0.009, 14, 6), '#d8261c', loc=(x, y, 0.008), rough=0.3)
        dots_on(x, y, 0.008, 0.012, 3, '#f3e1a0', 0.005, i + 5)
    done('peperoncino__layer')


def scattarisciati():
    # pomodorini scattarisciati: saltati in padella, la buccia scoppiata e raggrinzita, qualcuno aperto
    for i, (x, y) in enumerate(ring_pos(5, 0.13) + [(0, 0)]):
        if i % 2:
            t = sphere(0.055, 18, 10)
            lumpy(t, 0.006, 14, i)
            part(t, '#b8261a', loc=(x, y, 0.045), scale=(1, 1, 0.82), rough=0.25)
            part(sphere(0.014, 8, 5), '#5a1a10', loc=(x + 0.02, y - 0.02, 0.085), scale=(1.5, 1, 0.4))
        else:
            h = sphere(0.055, 18, 10)
            bmesh.ops.delete(h, geom=[v for v in h.verts if v.co.z > 0.003], context='VERTS')
            part(lumpy(h, 0.005, 14, i), '#b8261a', loc=(x, y, 0.05), rough=0.25)
            part(cyl(0.05, 0.05, 0.008, 16), '#e8603a', loc=(x, y, 0.046), rough=0.4)
            dots_on(x, y, 0.055, 0.03, 6, '#f2d36a', 0.006, i + 30)
    done('scattarisciati')


# ======================================================================
# FRITTI E PATATE
# ======================================================================

def pittule():
    # pittule: palline di pasta fritta gonfie e irregolari (prima erano poliedri come i bocconcini)
    for i, (x, y) in enumerate(ring_pos(3, 0.09) + [(0, 0.0)]):
        bm = sphere(0.065, 12, 8)
        lumpy(bm, 0.022, 9, i * 3.1)
        part(bm, '#e2a548', loc=(x, y, 0.055 + (0.04 if i == 3 else 0)), scale=(1, 1, 0.85), rough=0.6, sub=1)
        dots_on(x, y, 0.1 + (0.04 if i == 3 else 0), 0.03, 3, '#b8752a', 0.012, i)
    done('pittule')


def half_moon(r, color, loc, rot):
    """mezzaluna fritta gonfia, col bordo chiuso a forchetta"""
    bm = sphere(r, 16, 10)
    warp(bm, lambda c: Vector((c.x, max(c.y, 0) + min(c.y, 0) * 0.05, c.z * 0.42)))
    part(bm, color, loc=loc, rot=rot, rough=0.6, sub=1)
    c, s = math.cos(rot[2]), math.sin(rot[2])
    for k in range(11):
        t = k / 10 * math.pi
        px, py = r * math.cos(t), r * math.sin(t)
        part(box(0.016, 0.03, 0.012), '#c9822e', loc=(loc[0] + c * px - s * py, loc[1] + s * px + c * py, loc[2] + 0.004), rot=(0, 0, rot[2] + t), smooth=False)


def calzoncini():
    # calzoncini: mezzelune fritte gonfie, col bordo chiuso a forchetta
    half_moon(0.11, '#e09a3c', (-0.08, -0.07, 0.03), (0, 0, 0.3))
    half_moon(0.11, '#d98f34', (0.07, 0.05, 0.03), (0, 0, 2.6))
    done('calzoncini')


def croquette(x, y, z, rot, length=0.2, r=0.042, seed=0, open_end=False):
    """crocchetta di patate: cilindro con le punte arrotondate, panatura granulosa e dorata"""
    n = 12
    pts = [(-length / 2 + length * i / n, 0, 0) for i in range(n + 1)]
    radii = [r * math.sqrt(max(0.05, 1 - (2 * i / n - 1) ** 8)) for i in range(n + 1)]
    bm = tube(pts, radii, 12)
    part(lumpy(bm, 0.005, 80, seed), '#c26e1e' if seed % 2 else '#d07c26', loc=(x, y, z + r), rot=(0, 0, rot), rough=0.9, smooth=False)
    if open_end:
        # una spezzata: dentro la patata gialla
        c, s = math.cos(rot), math.sin(rot)
        part(cyl(r * 0.85, r * 0.85, 0.006, 14), '#f4d77a', loc=(x + c * length / 2, y + s * length / 2, z + r), rot=(0, math.pi / 2, rot), rough=0.9)


def crocchette():
    # crocchette (e panzerotti) di patate: allungate e panate, impilate come sul vassoio
    for i, (x, y) in enumerate([(-0.02, -0.1), (0.0, 0.0), (0.02, 0.1)]):
        croquette(x, y, 0.0, 0.25, seed=i, open_end=(i == 1))
    for i, (x, y) in enumerate([(0.0, -0.05), (0.02, 0.05)]):
        croquette(x, y, 0.07, 0.25, length=0.19, seed=i + 3)
    done('crocchette')
    for i, (x, y) in enumerate(ring_pos(4, 0.13)):
        croquette(x, y, -0.02, rnd.uniform(0, 3), length=0.15, r=0.034, seed=i + 7)
    done('crocchette__layer')


def patforno():
    # patate al forno: spicchi corti con la buccia, dorati, col rosmarino
    for i, (x, y) in enumerate(ring_pos(6, 0.12) + [(0, 0)]):
        r = rnd.uniform(0, 6)
        sector = [(0, 0)] + [(0.07 * math.cos(t), 0.07 * math.sin(t)) for t in [k / 6 * 1.3 - 0.65 for k in range(7)]]
        bm = slab(sector, 0.1)
        part(lumpy(bm, 0.004, 20, i), '#f0c25e', loc=(x, y, 0.03), rot=(math.pi / 2, 0, r), rough=0.55, smooth=False)
        skin = [(0.07 * math.cos(t), 0.07 * math.sin(t)) for t in [k / 6 * 1.3 - 0.65 for k in range(7)]] + [(0.08 * math.cos(t), 0.08 * math.sin(t)) for t in [k / 6 * 1.3 - 0.65 for k in range(6, -1, -1)]]
        part(slab(skin, 0.1), '#9a5a26', loc=(x, y, 0.03), rot=(math.pi / 2, 0, r), rough=0.7)
    for k in range(9):
        a = rnd.uniform(0, 3)
        x, y = rnd.uniform(-0.15, 0.15), rnd.uniform(-0.15, 0.15)
        part(tube([(0, 0, 0), (0.07, 0, 0.005)], 0.005, 4), '#3d6a2a', loc=(x, y, 0.1), rot=(0, 0, a))
        for n in range(4):
            part(tube([(0.015 * n, 0, 0), (0.015 * n + 0.012, 0.018, 0)], 0.0035, 4), '#2e5a20', loc=(x, y, 0.1), rot=(0, 0, a))
    done('patforno')


def patsaltate():
    # patate saltate: cubetti dorati e rosolati, col prezzemolo
    for i in range(18):
        a, d = rnd.uniform(0, math.tau), math.sqrt(rnd.uniform(0, 1)) * 0.14
        x, y = math.cos(a) * d, math.sin(a) * d
        part(box(0.065, 0.065, 0.058), '#e8b24a' if i % 3 else '#c98a2e', loc=(x, y, 0.05 * (1 - d / 0.15) * (i % 2)), rot=(rnd.uniform(-0.2, 0.2), rnd.uniform(-0.2, 0.2), rnd.uniform(0, 3)), rough=0.6, sub=1)
    for k in range(12):
        part(sphere(0.01, 6, 4), '#3f7d30', loc=(rnd.uniform(-0.15, 0.15), rnd.uniform(-0.15, 0.15), 0.07), scale=(1, 1, 0.4), smooth=False)
    done('patsaltate')


# ======================================================================
# PANINI: kebab e pulled pork prima erano lo stesso disco marrone
# ======================================================================

def shavings(n, rad, colors, z0=0.0, seed=0):
    rr = random.Random(seed)
    for i in range(n):
        x, y = rr.uniform(-rad, rad), rr.uniform(-rad, rad)
        bm = box(0.09, 0.04, 0.008)
        bmesh.ops.subdivide_edges(bm, edges=[e for e in bm.edges if abs(e.verts[0].co.x - e.verts[1].co.x) > 0.03], cuts=4)
        part(bend(bm, 5), colors[i % len(colors)], loc=(x, y, z0 + rr.uniform(0, 0.03)), rot=(rr.uniform(-0.3, 0.3), 0, rr.uniform(0, 3)), rough=0.6)


def kebab():
    # il cono del kebab sullo spiedo, con le falde tagliate ai piedi
    part(cyl(0.2, 0.2, 0.012, 24), '#c3c9cc', rough=0.3)
    cone = cyl(0.06, 0.15, 0.32, 20)
    bmesh.ops.subdivide_edges(cone, edges=[e for e in cone.edges if abs(e.verts[0].co.z - e.verts[1].co.z) > 0.1], cuts=12)
    warp(cone, lambda c: Vector((c.x * (1 + 0.07 * math.sin(c.z * 90)), c.y * (1 + 0.07 * math.sin(c.z * 90)), c.z)))
    part(lumpy(cone, 0.01, 22, 4), '#8e4a22', loc=(0, 0, 0.03), rough=0.55, smooth=False)
    part(cyl(0.152, 0.15, 0.03, 20), '#6e3416', loc=(0, 0, 0.33), rough=0.6)
    part(cyl(0.012, 0.012, 0.5, 8), '#c3c9cc', loc=(0, 0, 0.0), rough=0.25)
    part(sphere(0.022, 10, 6), '#c3c9cc', loc=(0, 0, 0.5), rough=0.25)
    shavings(8, 0.17, ['#c27a3e', '#9a5a2a'], 0.015, 3)
    done('kebab')
    shavings(16, 0.17, ['#c27a3e', '#9a5a2a', '#b06a32'], 0.0, 4)
    done('kebab__layer')


def pulled(flat=False):
    # pulled pork: tanti sfilacci scuri e lucidi di salsa barbecue
    rr = random.Random(5)
    part(lumpy(sphere(0.19, 20, 10), 0.01, 8, 2), '#5a2410', loc=(0, 0, 0.0), scale=(1, 1, 0.1 if flat else 0.22), rough=0.45)
    for i in range(52):
        a, d = rr.uniform(0, math.tau), math.sqrt(rr.uniform(0, 1)) * 0.17
        x, y = math.cos(a) * d, math.sin(a) * d
        z = (0.02 if flat else 0.04) * (1 - d / 0.2) + 0.012
        ang = rr.uniform(0, math.tau)
        pts = [(x + math.cos(ang) * t * 0.11, y + math.sin(ang) * t * 0.11, z + 0.01 * math.sin(t * 6 + i)) for t in [k / 5 for k in range(6)]]
        part(tube(pts, 0.01, 5), ['#b45a2c', '#8a3a1a', '#c8743a'][i % 3], rough=0.4)
    done('pulled__layer' if flat else 'pulled')


# ======================================================================
# FORMAGGI DURI: grana, parmigiano e cacioricotta, prima uguali o invisibili
# ======================================================================

def wedge(color, rind, dots, loc=(0, 0, 0), r=0.3, h=0.16, rot=-1.95):
    a0, a1 = -0.45, 0.45
    ts = [a0 + (a1 - a0) * k / 10 for k in range(11)]
    part(lumpy(slab([(0, 0)] + [(r * math.cos(t), r * math.sin(t)) for t in ts], h), 0.003, 60, 1), color, loc=loc, rot=(0, 0, rot), rough=0.85, smooth=False)
    band = [(r * math.cos(t), r * math.sin(t)) for t in ts] + [((r + 0.03) * math.cos(t), (r + 0.03) * math.sin(t)) for t in reversed(ts)]
    part(slab(band, h), rind, loc=loc, rot=(0, 0, rot), rough=0.8)
    c, s = math.cos(rot), math.sin(rot)
    for k in range(10):
        t = a0 + (a1 - a0) * (k + 0.5) / 10
        px, py = (r + 0.033) * math.cos(t), (r + 0.033) * math.sin(t)
        for z in (0.3, 0.7):
            part(sphere(0.01, 6, 4), dots, loc=(loc[0] + c * px - s * py, loc[1] + s * px + c * py, loc[2] + h * z), smooth=False)


def grana():
    # Grana Padano: spicchio color paglia, crosta chiara puntinata
    wedge('#f5e4ae', '#e2c06a', '#a8822e')
    done('grana')


def parmigiano():
    # Parmigiano Reggiano: pasta più dorata, crosta più scura, con le scaglie spezzate accanto
    wedge('#e8b84a', '#a8732a', '#5a3a14', loc=(-0.05, 0.06, 0), r=0.28, h=0.17)
    for i, (x, y) in enumerate([(0.16, -0.14), (0.21, -0.02), (0.15, 0.12)]):
        part(lumpy(sphere(0.055, 10, 6), 0.014, 20, i), '#eac05a', loc=(x, y, 0.03), scale=(1.2, 1, 0.65), rough=0.85, smooth=False)
    done('parmigiano')


def cacioricotta():
    # scaglie di cacioricotta: bianche e friabili, sul tagliere perché si vedano
    part(lumpy(box(0.46, 0.3, 0.03), 0.002, 20, 1), '#a8743f', rough=0.7)
    part(cyl(0.08, 0.08, 0.09, 20), '#f3f0e8', loc=(-0.13, 0.03, 0.03), rough=0.8)
    part(torus(0.08, 0.008, 20, 5), '#cfc8b8', loc=(-0.13, 0.03, 0.12), rough=0.8)
    shavings(9, 0.12, ['#f6f3ea', '#ece7da'], 0.035, 8)
    done('cacioricotta')
    shavings(12, 0.17, ['#f6f3ea', '#ece7da'], 0.0, 9)
    done('cacioricotta__layer')


# ======================================================================

BUILDERS = [
    fiordilatte, bufala, burrata, stracciatella,
    funghi, freschi, misti, porcini, porcinifritti,
    czucca, czucchine, ccacio, cgorgo, cradicchio, cfunghi, pesto, smarzano, pgiallo, balsamico,
    salamino, lambda: salamino(True), spianata, capocollo, speck, crudo, cotto, pancetta, pcoppata, guanciale, salsiccia, norcia,
    friarielli, lambda: friarielli(True), cicoria, lambda: cicoria(True), spinaci, lambda: spinaci(True), peperoncino, scattarisciati,
    pittule, calzoncini, crocchette, patforno, patsaltate,
    kebab, pulled, lambda: pulled(True),
    grana, parmigiano, cacioricotta,
]

for b in BUILDERS:
    b()

names = sorted(o.name for o in SCENE.objects)
print('INGREDIENTI', len(names), ' '.join(names))
per = sorted(((sum(len(p.vertices) - 2 for p in o.data.polygons), o.name) for o in SCENE.objects), reverse=True)
print('TRIANGOLI', sum(t for t, _ in per), ' più pesanti:', ', '.join(f'{n} {t}' for t, n in per[:15]))
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', export_apply=True, export_yup=True, export_texcoords=False, export_lights=False, export_cameras=False)
print('SCRITTO', OUT)

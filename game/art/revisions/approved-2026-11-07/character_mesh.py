"""Shared Blender surface builders for the fortress characters. Coordinates below are Y-up, facing -Z."""
import math
from pathlib import Path

import bpy
import bmesh
from mathutils import Vector

BASE = Path(__file__).resolve().parent.parent
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.preferences.filepaths.save_version = 0


def blender(point):
    x, y, z = point
    return (x, -z, y)


def material(name, rgb, roughness=.78, metal=0):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*rgb, 1)
    mat.use_nodes = True
    shader = mat.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value = (*rgb, 1)
    shader.inputs['Roughness'].default_value = roughness
    shader.inputs['Metallic'].default_value = metal
    return mat


wool = material('Lana de pino', (.053,.103,.075))
hem = material('Trama verde salvia', (.17,.205,.117))
leather = material('Jubón de avellana', (.19,.088,.049))
hide = material('Cuero encerado', (.073,.039,.029))
linen = material('Lino crudo', (.48,.40,.27))
trousers = material('Calzas de carbón', (.070,.073,.065))
brass = material('Latón pavonado', (.42,.29,.13), .42, .62)
iron = material('Acero', (.21,.24,.22), .39, .72)
wood = material('Tejo', (.31,.155,.067))
skin = material('Piel tostada', (.47,.258,.168))
lip = material('Labio', (.28,.116,.09))
hair = material('Cabello castaño', (.056,.030,.021))
iris = material('Pupila', (.029,.042,.033))
feather = material('Plumas cobrizas', (.44,.19,.078))


def pivot(name, point=(0,0,0), parent=None):
    obj = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(obj)
    obj.parent = parent
    obj.location = blender(point)
    return obj


# Batch surfaces by pivot and material, keeping individual mesh islands editable.
batches = {}


def surface(parent, mat, vertices, faces):
    verts, polys = batches.setdefault((parent, mat), ([], []))
    start = len(verts)
    verts.extend(blender(v) for v in vertices)
    polys.extend(tuple(start+i for i in face) for face in faces)


def shell(parent, mat, rings, closed=True, caps=True):
    n = len(rings[0])
    faces = []
    for row in range(len(rings)-1):
        for i in range(n if closed else n-1):
            j = (i+1) % n
            faces.append((row*n+i,(row+1)*n+i,(row+1)*n+j,row*n+j))
    if closed and caps:
        faces += [tuple(range(n)), tuple(range(len(rings)*n-1,(len(rings)-1)*n-1,-1))]
    surface(parent, mat, [v for ring in rings for v in ring], faces)


def sections(parent, mat, rows, n=32, fold=0):
    rings = []
    for y, w, d, cz in rows:
        ring = []
        for i in range(n):
            a = i*math.tau/n
            ripple = 1+fold*math.cos(8*a+.6*y)
            ring.append((w*math.sin(a)*ripple,y,cz-d*math.cos(a)*ripple))
        rings.append(ring)
    shell(parent,mat,rings)


def oval(parent, mat, center, size):
    x,y,z = center
    w,h,d = size
    rings = []
    for j in range(13):
        b = (j/12-.5)*math.pi
        rings.append([(x+w*math.sin(i*math.tau/20)*max(.001,math.cos(b)),y+h*math.sin(b),
                       z-d*math.cos(i*math.tau/20)*max(.001,math.cos(b))) for i in range(20)])
    shell(parent,mat,rings)


def cord(parent, mat, points, radii, n=10):
    pts = [Vector(p) for p in points]
    rings = []
    tangent = (pts[-1]-pts[0]).normalized()
    axis = min((Vector((1,0,0)),Vector((0,1,0)),Vector((0,0,1))),key=lambda v:abs(v.dot(tangent)))
    for j,p in enumerate(pts):
        t = (pts[min(j+1,len(pts)-1)]-pts[max(0,j-1)]).normalized()
        u = t.cross(axis).normalized()
        v = t.cross(u)
        r = radii if isinstance(radii,(float,int)) else radii[j]
        rings.append([p+r*(u*math.cos(i*math.tau/n)+v*math.sin(i*math.tau/n)) for i in range(n)])
    shell(parent,mat,rings)


def ribbon(parent, mat, rows):
    shell(parent,mat,rows,False,False)



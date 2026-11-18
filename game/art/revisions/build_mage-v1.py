import bpy, math, os
from mathutils import Vector
from pathlib import Path
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
BASE=Path(__file__).resolve().parent.parent
# Model in game coordinates (Y up, facing -Z), converted to Blender Z up.
def P(p): return Vector((p[0],-p[2],p[1]))
def mat(name,color,rough=.7,metal=0):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True;n=m.node_tree.nodes.get('Principled BSDF');n.inputs['Base Color'].default_value=(*color,1);n.inputs['Roughness'].default_value=rough;n.inputs['Metallic'].default_value=metal;return m
cloth=mat('Lana violeta',(.115,.095,.19));lining=mat('Forro índigo',(.035,.045,.08));gold=mat('Latón envejecido',(.44,.30,.12),.42,.65);skin=mat('Piel',(.46,.31,.23),.8);dark=mat('Cuero oscuro',(.055,.035,.03));eye=mat('Ojos',(.08,.12,.13),.35);gem=mat('Cristal lunar',(.22,.60,.68),.2,.2)
objects=[]
def mesh(name,verts,faces,material,sub=1):
 data=bpy.data.meshes.new(name);data.from_pydata([P(v) for v in verts],[],faces);data.update();o=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(o);o.data.materials.append(material)
 for p in data.polygons:p.use_smooth=True
 bpy.context.view_layer.objects.active=o;o.select_set(True)
 # Recalculate normals independently of the coordinate conversion.
 bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.mesh.normals_make_consistent(inside=False);bpy.ops.object.mode_set(mode='OBJECT');o.select_set(False)
 if sub:
  mod=o.modifiers.new('Superficie subdividida','SUBSURF');mod.levels=sub;mod.render_levels=sub;bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=mod.name)
 objects.append(o);return o
# Ring surface with soft anatomical sections and a deliberately irregular draped hem.
def loft(name,rows,material,fold=0,n=32):
 vs=[]
 for y,w,d,z in rows:
  for i in range(n):
   a=i/n*math.tau;f=fold*math.cos(a*9+.18)*max(0,1.2-y)
   vs.append((math.sin(a)*(w+f),y+(0.012*math.cos(a*5) if y<.3 else 0),z+math.cos(a)*(d+f)))
 fs=[]
 for j in range(len(rows)-1):
  for i in range(n):a=j*n+i;b=j*n+(i+1)%n;fs.append((a,b,b+n,a+n))
 fs.extend([tuple(range(n-1,-1,-1)),tuple((len(rows)-1)*n+i for i in range(n))]);return mesh(name,vs,fs,material)
def ell(name,center,scale,material):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=20,ring_count=12,location=P(center));o=bpy.context.object;o.name=name;o.scale=(scale[0],scale[2],scale[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(material)
 for p in o.data.polygons:p.use_smooth=True
 objects.append(o);o.select_set(False);return o
def tube(name,points,radii,material,n=12):
 vs=[]
 for j,p in enumerate(points):
  tangent=(Vector(points[min(j+1,len(points)-1)])-Vector(points[max(j-1,0)])).normalized();axis=Vector((0,0,1));u=tangent.cross(axis).normalized();v=tangent.cross(u).normalized()
  for i in range(n):vs.append(Vector(p)+radii[j]*(math.cos(i/n*math.tau)*u+math.sin(i/n*math.tau)*v))
 fs=[]
 for j in range(len(points)-1):
  for i in range(n):a=j*n+i;b=j*n+(i+1)%n;fs.append((a,b,b+n,a+n))
 fs.extend([tuple(range(n-1,-1,-1)),tuple((len(points)-1)*n+i for i in range(n))]);return mesh(name,vs,fs,material)
# One continuous robe mesh from hem through the chest and neck.
robe=loft('Túnica continua',[(.13,.31,.22,0),(.16,.325,.23,0),(.29,.31,.22,0),(.52,.27,.19,0),(.78,.215,.15,0),(.98,.17,.13,0),(1.08,.165,.125,0),(1.23,.19,.14,.015),(1.40,.225,.145,.02),(1.48,.205,.12,.02),(1.53,.12,.085,.02),(1.55,.085,.07,.02)],cloth,.033)
# Slightly bent arms, fitted at shoulder and elbow, flared cuffs.
arm_paths={}
for sign,label in [(-1,'L'),(1,'R')]:
 points=[(sign*.19,1.45,.015),(sign*.25,1.40,0),(sign*.29,1.29,-.015),(sign*.31,1.18,-.035),(sign*.32,1.08,-.065),(sign*.32,1.01,-.08)]
 arm_paths[label]=points
 sleeve=tube('Manga '+label,points,[.09,.095,.078,.069,.102,.115],cloth,20)
 # Gauntlet and hand, including individual curved fingers.
 ell('Palma '+label,(sign*.32,.955,-.085),(.045,.075,.032),skin)
 for finger in range(4):
  x=sign*.32+(finger-1.5)*.019
  tube('Dedo '+label+str(finger),[(x,.94,-.09),(x,.91,-.105),(x,.89,-.13)],[.012,.011,.008],skin,8)
 tube('Pulgar '+label,[(sign*.285,.97,-.09),(sign*.27,.94,-.12),(sign*.28,.915,-.135)],[.018,.014,.009],skin,8)
 ell('Bota '+label,(sign*.105,.075,-.055),(.073,.075,.15),dark)
# Shaped head: narrower jaw, cheekbones, temples and brow instead of a ball.
head=loft('Rostro',[(1.59,.045,.047,-.015),(1.62,.065,.065,-.023),(1.68,.086,.083,-.018),(1.74,.089,.084,-.009),(1.80,.081,.078,.006),(1.84,.06,.058,.018),(1.86,.018,.02,.018)],skin,0,24)
loft('Cuello',[(1.48,.05,.05,.01),(1.61,.052,.05,.01)],skin,0,20)
# Nose wedge and discreet eyes/brows.
mesh('Nariz',[(-.018,1.725,-.09),(.018,1.725,-.09),(0,1.68,-.135),(-.022,1.674,-.10),(.022,1.674,-.10)],[(0,1,2),(0,2,3),(1,4,2),(3,2,4),(0,3,4,1)],skin,1)
for sign in [-1,1]:
 ell('Ojo',(sign*.037,1.728,-.094),(.018,.008,.008),eye)
 tube('Ceja',[(sign*.018,1.746,-.095),(sign*.038,1.752,-.094),(sign*.058,1.744,-.087)],[.005,.006,.004],dark,8)
tube('Boca',[(-.026,1.653,-.084),(0,1.65,-.094),(.026,1.653,-.084)],[.003,.004,.003],dark,8)
# Open hood: a U-shaped surface, not a sphere covering the face.
verts=[];faces=[];levels=[(1.51,.125,.11,.02),(1.60,.14,.14,.025),(1.77,.145,.16,.03),(1.90,.125,.135,.03),(1.96,.045,.055,.04)]
N=24
for y,w,d,z in levels:
 for i in range(N+1):
  a=-2.27+i/N*4.54;verts.append((math.sin(a)*w,y,z+math.cos(a)*d))
for j in range(len(levels)-1):
 for i in range(N):a=j*(N+1)+i;faces.append((a,a+1,a+N+2,a+N+1))
hood=mesh('Capucha abierta',verts,faces,cloth,2);mod=hood.modifiers.new('Grosor de paño','SOLIDIFY');mod.thickness=.012;bpy.context.view_layer.objects.active=hood;bpy.ops.object.modifier_apply(modifier=mod.name)
# Stoles drape around the chest and bend away below the belt, gold edging follows their fabric.
for sign in [-1,1]:
 rows=[(1.49,.09,-.115),(1.35,.13,-.151),(1.16,.115,-.153),(1.02,.105,-.145),(.80,.12,-.173),(.53,.145,-.206),(.23,.17,-.244)]
 v=[]
 for y,x,z in rows:
  for u in [-1,0,1]:v.append((sign*x+u*.044,y,z+.01*abs(u)))
 f=[]
 for j in range(len(rows)-1):
  for i in range(2):a=j*3+i;f.append((a,a+1,a+4,a+3))
 stole=mesh('Estola',v,f,lining,2)
 for side in [-1,1]:tube('Borde bordado',[(sign*x+side*.041,y,z+.008) for y,x,z in rows],[.006]*len(rows),gold,8)
# Shoulder cape wrapping down the back, with an open front.
v=[];f=[]
for row,(y,w,d) in enumerate([(1.51,.105,.09),(1.45,.26,.18),(1.35,.285,.20),(1.15,.245,.21),(.98,.24,.22)]):
 for i in range(25):
  a=-1.75+i/24*3.5;v.append((math.sin(a)*w,y+.015*math.cos(a*6)*(row/4),.02+math.cos(a)*d))
for j in range(4):
 for i in range(24):a=j*25+i;f.append((a,a+1,a+26,a+25))
mesh('Manto de hombros',v,f,cloth,2)
# Belt, clasp, pendant and spellbook.
loft('Cinturón',[(1.005,.176,.14,0),(1.015,.18,.143,0),(1.06,.18,.143,0),(1.07,.176,.14,0)],dark,0,32)
ell('Broche',(0,1.038,-.154),(.035,.033,.012),gold)
ell('Colgante',(0,1.365,-.17),(.025,.04,.014),gem)
bpy.ops.mesh.primitive_cube_add(size=1,location=P((-.215,.92,.035)));book=bpy.context.object;book.name='Grimorio';book.scale=(.12,.10,.20);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);book.data.materials.append(dark);bevel=book.modifiers.new('Lomo redondeado','BEVEL');bevel.width=.015;bevel.segments=3;bpy.ops.object.modifier_apply(modifier=bevel.name);objects.append(book);book.select_set(False)
# Curved staff, crescent metal head, suspended gem.
staffparts=[]
staffparts.append(tube('Bastón',[(.34,.08,-.14),(.34,.65,-.14),(.33,1.13,-.14),(.35,1.67,-.14),(.36,1.98,-.14)],[.025,.021,.023,.02,.018],dark))
pts=[(.36+math.sin(a)*.105,2.04+math.cos(a)*.12,-.14) for a in [math.pi*.25+i/20*math.pi*1.5 for i in range(21)]]
staffparts.append(tube('Corona del bastón',pts,[.016]*len(pts),gold))
staffparts.append(ell('Piedra del bastón',(.36,2.045,-.14),(.045,.075,.035),gem))
# Skinning: independent bones and smoothly blended weights at shoulder/elbow.
bpy.ops.object.armature_add();rig=bpy.context.object;rig.name='MageRig';bpy.ops.object.mode_set(mode='EDIT');rig.data.edit_bones.remove(rig.data.edit_bones[0])
def bone(name,a,b,parent=None):
 e=rig.data.edit_bones.new(name);e.head=P(a);e.tail=P(b)
 if parent:e.parent=rig.data.edit_bones[parent]
 return e
bone('root',(0,0,0),(0,.8,0));bone('spine',(0,.95,0),(0,1.5,0),'root');bone('head',(0,1.5,0),(0,1.9,0),'spine')
for sign,label in [(-1,'L'),(1,'R')]:
 bone('upper'+label,(sign*.20,1.45,0),(sign*.31,1.18,-.035),'spine');bone('fore'+label,(sign*.31,1.18,-.035),(sign*.32,.94,-.09),'upper'+label)
bpy.ops.object.mode_set(mode='OBJECT')
for o in objects:
 groups={n:o.vertex_groups.new(name=n) for n in ['root','spine','head','upperL','upperR','foreL','foreR']}
 for vert in o.data.vertices:
  world=o.matrix_world@vert.co;x,y,z=world.x,world.z,-world.y
  if o in staffparts: weights={'foreR':1}
  elif o.name.startswith(('Rostro','Nariz','Ojo','Ceja','Boca','Capucha')): weights={'head':1}
  elif o.name.startswith(('Manga','Palma','Dedo','Pulgar')):
   label='L' if x<0 else 'R';f=max(0,min(1,(1.28-y)/.2));weights={'upper'+label:1-f,'fore'+label:f}
  elif o.name.startswith('Bota'):weights={'root':1}
  else:
   f=max(0,min(1,(y-.90)/.35));weights={'root':1-f,'spine':f}
  for n,w in weights.items():
   if w:groups[n].add([vert.index],w,'REPLACE')
 mod=o.modifiers.new('Deformación por esqueleto','ARMATURE');mod.object=rig;o.parent=rig
# Save editable source and export the actual mesh/skin data.
bpy.ops.object.select_all(action='DESELECT');rig.select_set(True)
for o in objects:o.select_set(True)
bpy.context.view_layer.objects.active=rig
bpy.ops.wm.save_as_mainfile(filepath=str(BASE/'art/mage-slim.blend'))
bpy.ops.export_scene.gltf(filepath=str(BASE/'public/assets/models/mage-slim.glb'),export_format='GLB',use_selection=True,export_animations=False,export_yup=True)
print('MAGE_EXPORT',len(objects),sum(len(o.data.polygons) for o in objects))

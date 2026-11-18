import bpy, math, os
from mathutils import Vector
from mathutils.bvhtree import BVHTree
from pathlib import Path
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
BASE=Path(__file__).resolve().parent.parent
# Model in game coordinates (Y up, facing -Z), converted to Blender Z up.
def P(p): return Vector((p[0],-p[2],p[1]))
def mat(name,color,rough=.7,metal=0):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True;n=m.node_tree.nodes.get('Principled BSDF');n.inputs['Base Color'].default_value=(*color,1);n.inputs['Roughness'].default_value=rough;n.inputs['Metallic'].default_value=metal;return m
cloth=mat('Lana violeta',(.115,.095,.19));lining=mat('Forro índigo',(.035,.045,.08));gold=mat('Latón envejecido',(.44,.30,.12),.42,.65);skin=mat('Piel',(.46,.31,.23),.8);dark=mat('Cuero oscuro',(.055,.035,.03));eye=mat('Ojos',(.08,.12,.13),.35);gem=mat('Cristal lunar',(.22,.60,.68),.2,.2);wood=mat('Madera de tejo',(.105,.065,.04),.82);trim=mat('Lana ciruela',(.07,.05,.125),.85)
gem.node_tree.nodes.get('Principled BSDF').inputs['Emission Color'].default_value=(.20,.75,.85,1);gem.node_tree.nodes.get('Principled BSDF').inputs['Emission Strength'].default_value=.55
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
def drape(a,y):
 # Three overlapping fold families so no two pleats repeat exactly.
 skirt=max(0,min(1,(1.0-y)/.85))**1.25
 blouse=max(0,min(1,(y-1.10)/.10))*max(0,min(1,(1.34-y)/.12))
 wave=.72*math.cos(a*9+.18)+.34*math.cos(a*5+1.3)+.12*math.cos(a*14+2.1)
 # Pinch the valleys so pleats read as cloth, not as a soft ripple.
 return skirt*(wave if wave>0 else wave*(1-.3*wave))+.22*blouse*math.cos(a*7+.6)
def loft(name,rows,material,fold=0,n=32):
 vs=[]
 for y,w,d,z in rows:
  for i in range(n):
   a=i/n*math.tau;f=fold*drape(a,y) if fold else 0
   hem=(0.014*math.cos(a*5)+.038*max(0,-math.cos(a))**3) if fold and y<.3 else 0
   vs.append((math.sin(a)*(w+f),y+hem,z+math.cos(a)*(d+f)))
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
robe=loft('Túnica continua',[(.13,.325,.245,.012),(.16,.335,.25,.012),(.29,.315,.232,.01),(.42,.292,.212,.008),(.56,.266,.19,.006),(.70,.238,.168,.004),(.84,.205,.147,.002),(.95,.176,.132,0),(1.00,.166,.127,0),(1.08,.165,.125,0),(1.15,.182,.137,.008),(1.23,.196,.145,.015),(1.32,.214,.148,.018),(1.40,.225,.145,.02),(1.48,.205,.12,.02),(1.53,.12,.085,.02),(1.55,.085,.07,.02)],cloth,.05,64)
# Darker band sewn along the hem, following the same folds.
loft('Ribete del faldón',[(.128,.328,.248,.012),(.16,.3385,.2535,.012),(.215,.3295,.2455,.011)],trim,.05,64)
# Slightly bent arms, fitted at shoulder and elbow, flared cuffs.
arm_paths={}
for sign,label in [(-1,'L'),(1,'R')]:
 points=[(sign*.19,1.45,.015),(sign*.25,1.40,0),(sign*.29,1.29,-.015),(sign*.31,1.18,-.035),(sign*.32,1.08,-.065),(sign*.32,.99,-.08)]
 arm_paths[label]=points
 # Two rings a millimetre apart hold the cuff open under subdivision, so it reads as a bell and not a gathered bag.
 mouth=(sign*.32,1.02,-.072)
 sleeve=tube('Manga '+label,[(sign*.175,1.435,.015),(sign*.24,1.385,0),(sign*.288,1.285,-.015),(sign*.31,1.18,-.035),(sign*.32,1.09,-.06),(sign*.32,1.022,-.0715),mouth],[.056,.068,.067,.063,.080,.097,.098],cloth,24)
 tube('Manga ribete '+label,[(mouth[0]+.095*math.cos(t),1.019,mouth[2]+.095*math.sin(t)) for t in [i/16*math.tau for i in range(17)]],[.006]*17,gold,8)
 ell('Manga boca '+label,(mouth[0],1.024,mouth[2]),(.090,.008,.090),lining)
 # Wrist shows below the shortened cuff.
 ell('Palma muñeca '+label,(sign*.32,1.0,-.082),(.027,.05,.024),skin)
 # Casting fingers spread naturally; gripping fingers wrap around the vertical staff.
 if label=='R':
  ell('Palma R',(.32,.953,-.106),(.035,.058,.026),skin)
  for finger in range(4):
   y=.980-finger*.021
   tube('Dedo R'+str(finger),[(.344,y,-.108),(.362,y-.002,-.132),
        (.353,y-.003,-.158),(.328,y-.002,-.166)],[.010,.011,.010,.007],skin,10)
  tube('Pulgar R',[(.295,.983,-.111),(.299,.964,-.143),
       (.319,.958,-.165),(.338,.959,-.163)],[.015,.014,.011,.008],skin,10)
 else:
  ell('Palma L',(-.32,.955,-.085),(.040,.060,.029),skin)
  for finger in range(4):
   x=-.32+(finger-1.5)*.019
   tube('Dedo L'+str(finger),[(x,.936,-.087),(x,.902+(finger%2)*.006,-.108),
        (x,.886+(finger%2)*.008,-.137)],[.010,.009,.0065],skin,8)
  tube('Pulgar L',[(-.285,.97,-.09),(-.27,.94,-.12),(-.28,.915,-.135)],
       [.018,.014,.009],skin,8)
 ell('Bota caña '+label,(sign*.105,.13,.0),(.064,.12,.072),dark)
 ell('Bota pie '+label,(sign*.105,.058,-.085),(.068,.052,.15),dark)
 ell('Bota puntera '+label,(sign*.105,.05,-.205),(.052,.04,.05),dark)
# Shaped head: narrower jaw, cheekbones, temples and brow instead of a ball.
head=loft('Rostro',[(1.59,.045,.047,-.015),(1.62,.065,.065,-.023),(1.68,.086,.083,-.018),(1.74,.089,.084,-.009),(1.80,.081,.078,.006),(1.84,.06,.058,.018),(1.86,.018,.02,.018)],skin,0,24)
ell('Cuello',(0,1.555,.005),(.050,.085,.048),skin)
# Nose wedge and discreet eyes/brows.
mesh('Nariz',[(-.018,1.725,-.09),(.018,1.725,-.09),(0,1.68,-.121),(-.022,1.674,-.10),(.022,1.674,-.10)],[(0,1,2),(0,2,3),(1,4,2),(3,2,4),(0,3,4,1)],skin,1)
for sign in [-1,1]:
 ell('Ojo',(sign*.037,1.728,-.094),(.016,.006,.005),skin)
 ell('Ojo iris',(sign*.037,1.729,-.099),(.007,.005,.003),eye)
 tube('Ceja',[(sign*.018,1.746,-.095),(sign*.038,1.752,-.094),(sign*.058,1.744,-.087)],[.005,.006,.004],dark,8)
tube('Boca',[(-.026,1.653,-.084),(0,1.65,-.094),(.026,1.653,-.084)],[.003,.004,.003],dark,8)
# Shaped face opening: close over the brow, ease out at the cheek, settle into the collar.
hood_rows=[]
levels=[(1.29,.218,.165,.018,.92),(1.36,.242,.168,.018,.92),
        (1.43,.225,.15,.018,.92),(1.49,.17,.12,.018,.92),
        (1.54,.108,.09,.016,.92),(1.60,.108,.101,.014,.98),
        (1.68,.110,.110,.012,1.0),(1.76,.106,.117,.010,.90),
        (1.81,.101,.120,.008,.64),(1.84,.094,.116,.008,.28),
        (1.86,.087,.105,.012,0),(1.89,.067,.080,.018,0),
        (1.905,.037,.046,.022,0),(1.91,.005,.008,.022,0)]
N=32
for y,w,d,z,opening in levels:
 row=[]
 for i in range(N+1):
  a=opening+i/N*(math.tau-2*opening)
  # The lower rows are the shoulder mantle itself, continuously joined to the hood.
  shoulder_lift=.105*abs(math.sin(a))*max(0,min(1,(1.49-y)/.20))
  row.append((math.sin(a)*w,y+shoulder_lift,z-math.cos(a)*d))
 hood_rows.append(row)
verts=[p for row in hood_rows for p in row]
faces=[(j*(N+1)+i,j*(N+1)+i+1,(j+1)*(N+1)+i+1,(j+1)*(N+1)+i)
       for j in range(len(hood_rows)-1) for i in range(N)]
hood=mesh('Capucha abierta',verts,faces,cloth,1)
mod=hood.modifiers.new('Grosor de paño','SOLIDIFY');mod.thickness=.010;mod.offset=-1
bpy.context.view_layer.objects.active=hood;bpy.ops.object.modifier_apply(modifier=mod.name)
# A turned edge and dark facing give the opening a readable depth.
for side in [0,-1]:
 edge=[row[side] for row in hood_rows[:11]]
 tube('Capucha ribete',edge,[.007]*len(edge),lining,10)
tube('Capucha orla',hood_rows[0],[.006]*len(hood_rows[0]),gold,8)
# Hair at the temples frames the face below the opening.
for sign in [-1,1]:
 tube('Cabello sien',[(sign*.066,1.80,-.055),(sign*.079,1.745,-.047),
                     (sign*.077,1.68,-.032)],[.014,.013,.006],dark,10)
# Fit decoration onto the evaluated robe instead of guessing an offset for every row.
bpy.context.view_layer.update()
robe_surface=BVHTree.FromObject(robe,bpy.context.evaluated_depsgraph_get())
def fitted(o,offset,thickness=0):
 for v in o.data.vertices:
  world=o.matrix_world@v.co;hit,normal,_,distance=robe_surface.find_nearest(world)
  v.co=o.matrix_world.inverted()@(hit+normal*offset)
 if thickness:
  mod=o.modifiers.new('Tela aplicada con grosor','SOLIDIFY');mod.thickness=thickness;mod.offset=0;bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=mod.name)
 o['surface_gap_m']=offset
 return o
# Stoles are now sewn to the robe and their gold edging follows the same surface.
for sign in [-1,1]:
 rows=[(1.49,.09,-.115),(1.35,.13,-.151),(1.16,.115,-.153),(1.02,.105,-.145),(.80,.12,-.173),(.53,.145,-.206),(.23,.17,-.244)]
 v=[]
 for y,x,z in rows:
  for u in [-1,0,1]:v.append((sign*x+u*.044,y,z+.01*abs(u)))
 f=[]
 for j in range(len(rows)-1):
  for i in range(2):a=j*3+i;f.append((a,a+1,a+4,a+3))
 stole=fitted(mesh('Estola',v,f,lining,2),.003,.002)
 for side in [-1,1]:
  edge=[]
  for y,x,z in rows:
   for u in [-1,1]:edge.append((sign*x+side*.037+u*.0035,y,z))
  faces=[(j*2,j*2+1,j*2+3,j*2+2) for j in range(len(rows)-1)]
  fitted(mesh('Bordado cosido',edge,faces,gold,2),.0055,.001)

# Belt, clasp, pendant and spellbook.
loft('Cinturón',[(1.005,.168,.131,0),(1.015,.174,.137,0),(1.06,.174,.137,0),(1.07,.168,.131,0)],dark,0,32)
ell('Broche',(0,1.038,-.141),(.032,.03,.009),gold)
for dx,low in [(-.018,.74),(.02,.80)]:
 tube('Cinturón caída',[(dx,1.03,-.146),(dx*1.3,.95,-.16),(dx*1.5,.86,-.172),(dx*1.6,low,-.185)],[.013,.012,.011,.009],dark,8)
 ell('Cinturón herrete',(dx*1.6,low-.012,-.186),(.012,.02,.012),gold)
# Sewn jewel setting: its back rests on the chest; short embroidery visibly anchors it.
hit,normal,_,_=robe_surface.find_nearest(P((0,1.365,-.17)))
def game(p):return (p.x,p.z,-p.y)
ell('Montura cosida',game(hit+normal*.004),(.031,.044,.007),gold)
ell('Colgante',game(hit+normal*.010),(.023,.035,.009),gem)
for sign in [-1,1]:
 rows=[(sign*.07,1.48,-.13),(sign*.045,1.44,-.15),(sign*.02,1.395,-.15)]
 vs=[(x+dx,y,z) for x,y,z in rows for dx in [-.002,.002]]
 fitted(mesh('Sujeción bordada',vs,[(0,1,3,2),(2,3,5,4)],gold,2),.004,.001)

# Separate covers and a recessed page block make the belt book legible.
pages=mat('Páginas de pergamino',(.46,.37,.23),.94)
def book_piece(name,center,dimensions,material,radius):
 bpy.ops.mesh.primitive_cube_add(size=1,location=P(center))
 part=bpy.context.object;part.name=name
 part.scale=(dimensions[0],dimensions[2],dimensions[1])
 bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 part.data.materials.append(material)
 bevel=part.modifiers.new('Cantos del libro','BEVEL');bevel.width=radius;bevel.segments=3
 bpy.ops.object.modifier_apply(modifier=bevel.name)
 objects.append(part);part.select_set(False)
book_piece('Grimorio páginas',(-.215,.92,.035),(.105,.180,.042),pages,.005)
for z in [.008,.062]:
 book_piece('Grimorio cubierta',(-.215,.92,z),(.123,.202,.012),dark,.005)
book_piece('Grimorio lomo',(-.270,.92,.035),(.017,.202,.062),dark,.007)
book_piece('Grimorio cierre',(-.182,.92,.000),(.035,.027,.009),gold,.003)
# Visible loop connects the book to the belt.
tube('Correa del grimorio',[(-.16,1.05,.02),(-.20,1.01,.025),(-.22,.94,-.025),(-.22,.84,-.025)],[.012,.012,.01,.01],dark,10)
# Curved staff, crescent metal head, suspended gem.
staffparts=[]
shaft=[(.34,.03,-.14),(.341,.20,-.141),(.338,.42,-.138),(.342,.65,-.142),(.336,.86,-.14),(.34,.97,-.14),(.333,1.13,-.138),(.34,1.34,-.143),(.352,1.52,-.139),(.35,1.67,-.14),(.357,1.84,-.142),(.36,1.955,-.14)]
staffparts.append(tube('Bastón',shaft,[.017,.024,.022,.0235,.021,.021,.0225,.02,.0215,.019,.0205,.022],wood,14))
staffparts.append(tube('Bastón regatón',[(.34,.0,-.14),(.34,.03,-.14),(.341,.11,-.141)],[.012,.021,.027],gold,12))
for y in [.885,.915,.945,.975,1.005,1.035]:
 staffparts.append(tube('Bastón empuñadura',[(.338+.0245*math.cos(t),y+.012*t/math.tau,-.14+.0245*math.sin(t)) for t in [i/12*math.tau for i in range(13)]],[.0065]*13,dark,6))
for y,r in [(1.925,.03),(1.955,.036)]:
 staffparts.append(ell('Bastón collar',(.36,y,-.14),(r,.016,r),gold))
arc=[math.pi*.22+i/24*math.pi*1.56 for i in range(25)]
pts=[(.36+math.sin(a)*.105,2.06+math.cos(a)*.12,-.14) for a in arc]
staffparts.append(tube('Corona del bastón',pts,[.006+.015*math.sin(i/24*math.pi)**.6 for i in range(25)],gold))
for sign in [-1,1]:
 staffparts.append(ell('Corona remate',(.36+sign*.067,2.152,-.14),(.011,.011,.011),gold))
staffparts.append(ell('Piedra del bastón',(.36,2.06,-.14),(.043,.07,.035),gem))
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
  elif o.name.startswith('Capucha'):
   # Anchor the shoulder rows to the torso, with a gradual transition up the neck.
   head_weight=max(0,min(1,(y-1.51)/.15))
   weights={'spine':1-head_weight,'head':head_weight}
  elif o.name.startswith(('Rostro','Nariz','Ojo','Ceja','Boca','Cabello')): weights={'head':1}
  elif o.name.startswith(('Manga','Palma','Dedo','Pulgar')):
   label='L' if x<0 else 'R';f=max(0,min(1,(1.28-y)/.2));weights={'upper'+label:1-f,'fore'+label:f}
  elif o.name.startswith(('Colgante','Montura')):weights={'spine':1}
  elif o.name.startswith('Grimorio'):
   # Covers, spine and pages share one affine transform instead of bending apart.
   weights={'root':.75,'spine':.25}
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

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from character_mesh import *

body = pivot('Doublet')
torso = [(.76,.226,.157,.018),(.79,.234,.164,.016),(.89,.219,.155,.012),
         (1.04,.170,.124,0),(1.13,.171,.126,0),(1.24,.196,.143,0),
         (1.34,.216,.154,.001),(1.405,.222,.143,.012),(1.45,.203,.115,.017),
         (1.49,.132,.092,.008),(1.51,.075,.069,.005)]
# Give the skirt a saddle slit and vertically fluted hem; the folds disappear at the waist.
garment = []
for y,w,d,cz in torso:
    row = []
    drape = min(1, max(0,(1.03-y)/.24))
    for i in range(64):
        a = i*math.tau/64
        slit = max(0,1-abs(math.sin(a/2))/.18)**1.3
        folds = .018*math.cos(8*a+.6*y)+.042*drape*math.cos(10*a+.4)
        row.append((w*math.sin(a)*(1+folds),y+drape*(.087*slit+.010*math.cos(5*a)),
                    cz-d*math.cos(a)*(1+folds)))
    garment.append(row)
shell(body,leather,garment)
cord(body,hide,garment[0]+[garment[0][0]],.0045,8)


def jacket(y, a, gap=.002):
    for (lo,w,d,z),(hi,ww,dd,zz) in zip(torso,torso[1:]):
        if lo <= y <= hi:
            t = (y-lo)/(hi-lo)
            f = 1+.018*math.cos(8*a+.6*y)
            return (((1-t)*w+t*ww)*math.sin(a)*f+gap*math.sin(a), y,
                    (1-t)*z+t*zz-(((1-t)*d+t*dd)*f+gap)*math.cos(a))


# Two fitted front panels with saddle stitching, laces and a diagonal baldric.
for side in (-1,1):
    for a in (.26, .92):
        cord(body,hide,[jacket(.78+i*.022,side*a,.002) for i in range(30)],.0028,6)
    for i in range(19):
        y = .81+i*.029
        cord(body,linen,[jacket(y,side*.88,.004),jacket(y+.011,side*.87,.004)],.0019,5)
    for i in range(6):
        y = 1.12+i*.045
        cord(body,hide,[jacket(y,side*.14,.004),jacket(y+.026,-side*.14,.005)],.003,7)
strap = []
for j in range(39):
    y = .97+j*.013
    a = -.96+1.98*j/38
    strap.append([jacket(y,a+u,.009) for u in (-.14,0,.14)])
ribbon(body,hide,strap)
sections(body,hide,[(.986,.186,.142,0),(.993,.190,.145,0),(1.042,.180,.137,0),(1.049,.176,.133,0)])
for x,y,z in [jacket(1.33,.48,.013),(0,1.017,-.145)]:
    cord(body,brass,[(x-.028,y-.019,z),(x+.028,y-.019,z),(x+.028,y+.019,z),
                     (x-.028,y+.019,z),(x-.028,y-.019,z)],.005,8)
for sign in (-1,1):
    oval(body,hide,(sign*.188,.92,-.049),(.065,.083,.050))
    oval(body,leather,(sign*.195,.945,-.075),(.062,.050,.033))
    oval(body,brass,(sign*.195,.93,-.106),(.008,.008,.004))

# Short bifurcated travelling cape, gathered into the collar. The quiver sits on top.
for sign in (-1,1):
    rings = []
    for j in range(21):
        t = j/20
        row = []
        for i in range(21):
            u = i/20
            a = math.pi + sign*(.035+u*1.77)
            flare = math.sin(min(1,t*4)*math.pi/2)
            w = .105+.152*flare-.033*t
            d = .082+.088*flare+.060*t+.014*math.cos(u*16)*t
            y = 1.515-t*(.69-.39*u**2)+.027*math.sin(u*9)*t*t
            row.append((math.sin(a)*w,y,.017-math.cos(a)*d))
        rings.append(row)
    ribbon(body,wool,rings)
    cord(body,hem,rings[-1],.004)
# The hood's shoulder yoke overlaps the cape and lies lower at the front clasp.
yoke = []
for j,(y,w,d) in enumerate([(1.542,.095,.084),(1.515,.119,.102),(1.483,.177,.127),
                             (1.458,.207,.145),(1.45,.213,.150)]):
    row = []
    for i in range(48):
        a=i*math.tau/48
        drop=(.047*abs(math.cos(a))+.006*math.cos(a*6))*(j/4)**2
        row.append((math.sin(a)*w,y-drop,.006-d*math.cos(a)))
    yoke.append(row)
shell(body,wool,yoke)
cord(body,hem,yoke[-1]+[yoke[-1][0]],.0035,8)
oval(body,brass,(0,1.433,-.144),(.021,.023,.008))

head = pivot('RangerHead',(0,1.52,0),body)
sections(head,skin,[(-.06,.052,.050,0),(.078,.055,.052,.008)])
sections(head,skin,[(.049,.029,.043,-.039),(.062,.052,.065,-.031),(.094,.072,.073,-.021),
                    (.142,.084,.085,-.011),(.177,.092,.085,-.005),(.218,.089,.083,0),
                    (.253,.08,.077,.006),(.285,.054,.056,.006),(.302,.014,.018,.01)])
for sign in (-1,1):
    oval(head,skin,(sign*.084,.15,.003),(.016,.034,.017))
    oval(head,linen,(sign*.034,.174,-.085),(.020,.0055,.006))
    oval(head,iris,(sign*.034,.174,-.091),(.008,.0055,.003))
    cord(head,hair,[(sign*.012,.19,-.087),(sign*.036,.196,-.086),(sign*.058,.191,-.074)],
         [.003,.006,.003])
    cord(head,hair,[(sign*.076,.21,-.044),(sign*.082,.175,-.038),(sign*.079,.135,-.03)],
         [.016,.014,.006])
cord(head,skin,[(0,.184,-.082),(0,.158,-.092),(0,.14,-.108),(0,.136,-.098)],
     [.009,.012,.015,.011])
cord(head,lip,[(-.024,.107,-.088),(0,.105,-.095),(.024,.107,-.088)],[.002,.003,.002])
# Shaped hood with an actual face opening and a bound rim.
hood = []
for y,w,d,cz,opening in [(.006,.111,.098,.018,.83),(.067,.117,.110,.014,.94),
                          (.16,.117,.12,.012,1.02),(.225,.112,.123,.009,.73),
                          (.255,.102,.125,.002,.24),(.268,.099,.122,.005,0),
                          (.295,.092,.102,.010,0),(.315,.073,.081,.022,0),(.328,.027,.042,.032,0),
                          (.329,.004,.007,.033,0)]:
    row=[]
    for i in range(41):
        a=opening+(math.tau-2*opening)*i/40
        row.append((w*math.sin(a),y,cz-d*math.cos(a)))
    hood.append(row)
ribbon(head,wool,hood)
for i in (0,-1):
    cord(head,hem,[r[i] for r in hood[:6]],.004)

for sign,side in [(-1,'Left'),(1,'Right')]:
    leg = pivot('Leg'+side,(sign*.113,.94,0))
    sections(leg,trousers,[(-.55,.056,.059,0),(-.49,.068,.07,-.012),(-.43,.074,.081,-.012),
                           (-.34,.076,.083,.004),(-.23,.094,.108,.007),(-.10,.104,.113,.008),
                           (.012,.101,.099,0)],28,.026)
    sections(leg,hide,[(-.94,.066,.124,-.047),(-.926,.076,.149,-.069),(-.876,.078,.147,-.073),
                       (-.817,.065,.117,-.05),(-.765,.055,.075,-.005),(-.68,.062,.074,.012),
                       (-.57,.076,.081,.012),(-.502,.068,.076,0),(-.478,.069,.078,0)])
    sections(leg,leather,[(-.56,.077,.082,.008),(-.509,.075,.082,.002),(-.497,.075,.08,0)])
    for j in range(4):
        y=-.75+j*.04
        cord(leg,leather,[(-.036,y,-.062),(.004,y+.014,-.078),(.035,y+.021,-.062)],.004)
    arm = pivot('Sleeve'+side)
    sections(arm,wool,[(-.316,.043,.047,0),(-.28,.057,.06,0),(-.21,.063,.065,0),
                       (-.12,.082,.078,0),(-.043,.093,.088,0),(.007,.083,.076,0),
                       (.041,.055,.05,0),(.052,.022,.024,0)],28,.035)
    sections(arm,hem,[(-.251,.064,.067,0),(-.245,.066,.069,0),(-.237,.067,.070,0)])
    fore = pivot('Bracer'+side)
    sections(fore,hide,[(-.282,.027,.030,0),(-.248,.034,.037,0),(-.232,.036,.040,0)])
    sections(fore,wool,[(-.24,.030,.033,0),(-.17,.037,.041,0),(-.10,.048,.050,0),
                        (-.04,.060,.061,0),(.004,.048,.051,0),(.027,.028,.031,0)])
    sections(fore,leather,[(-.24,.038,.045,0),(-.217,.043,.05,0),(-.13,.054,.059,0),
                            (-.077,.06,.065,0),(-.064,.059,.065,0)])
    for j in range(3 if sign<0 else 2):
        t=j*.052
        sections(fore,hide,[(-.216+t,.044+t*.11,.051+t*.1,0),(-.205+t,.046+t*.11,.052+t*.1,0)])
    hand = pivot('Glove'+side)
    oval(hand,hide,(0,.012,.013),(.038,.050,.032))
    for j in range(4):
        y=-.034+j*.018
        cord(hand,leather,[(sign*.022,y,.016),(sign*.034,y,-.008),(sign*.021,y,-.029),
                           (-sign*.007,y,-.026)],[.011,.012,.010,.007])
    cord(hand,leather,[(-sign*.022,.04,.02),(-sign*.039,.023,-.002),(-sign*.021,.005,-.031)],
         [.016,.014,.011])

quiver = pivot('Carcaj',(.027,.89,.214),body)
quiver.rotation_euler.y = -.35  # Blender Y rotation tilts the mouth towards one shoulder.
sections(quiver,hide,[(0,.037,.032,0),(.024,.049,.044,0),(.42,.062,.051,0),
                      (.57,.071,.059,0),(.59,.070,.059,0)])
for y,w,d in [(.055,.052,.046),(.38,.063,.054),(.553,.073,.061)]:
    sections(quiver,leather,[(y,w,d,0),(y+.024,w+.001,d+.001,0)])
cord(quiver,brass,[(0,.075,.048),(0,.30,.054),(0,.54,.061)],.003)


def fletch(parent, x,y,z, angle):
    for j in range(3):
        a=angle+j*math.tau/3
        def pt(h,r): return (x+math.sin(a)*r,y+h,z+math.cos(a)*r)
        ribbon(parent,feather,[[pt(0,.004),pt(.012,.009)],[pt(.046,.004),pt(.07,.022)],
                                [pt(.093,.004),pt(.084,.022)]])
    cord(parent,linen,[(x,y-.007,z),(x,y+.003,z)],.005)


for i,(x,z) in enumerate([(-.032,.012),(.011,.028),(.033,-.008),(-.007,-.02),(-.042,-.02)]):
    y=.665+i%3*.032
    cord(quiver,wood,[(x,.55,z),(x,y+.101,z)],.0045)
    fletch(quiver,x,y,z,i*.87)

bow = pivot('Longbow')
for sign in (-1,1):
    points=[(0,sign*y,z) for y,z in [(0,0),(.08,0),(.17,.002),(.28,.023),(.40,.065),
                                      (.51,.123),(.57,.157),(.602,.15),(.62,.135)]]
    cord(bow,wood,points,[.020,.025,.024,.019,.015,.012,.009,.008,.006],14)
    cord(bow,brass,points[-2:],[.009,.007],10)
for j in range(11):
    y=(j-5)*.011
    cord(bow,hide,[(0,y-.006,0),(0,y+.006,0)],.023)
for name in ('CordTop','CordBottom'):
    string = pivot(name)
    cord(string,linen,[(0,0,0),(0,1,0)],.0024,8)
arrow = pivot('NockedArrow')
cord(arrow,wood,[(0,0,0),(0,.73,0)],.0048)
cord(arrow,iron,[(0,.715,0),(0,.739,0),(0,.775,0)],[.006,.014,.001])
fletch(arrow,0,.013,0,.3)

for (parent,mat),(vertices,faces) in batches.items():
    mesh=bpy.data.meshes.new(parent.name+' '+mat.name)
    mesh.from_pydata(vertices,[],faces)
    mesh.update()
    topology=bmesh.new()
    topology.from_mesh(mesh)
    bmesh.ops.recalc_face_normals(topology,faces=topology.faces[:])
    topology.to_mesh(mesh)
    topology.free()
    obj=bpy.data.objects.new(mesh.name,mesh)
    bpy.context.collection.objects.link(obj)
    obj.parent=parent
    obj.data.materials.append(mat)
    for poly in mesh.polygons:
        poly.use_smooth=True

# Store the ready stance in the editable scene as well as in the exported default pose.
def aim(node,a,b,axis=(0,-1,0),stretch=False):
    delta=Vector(blender(b))-Vector(blender(a))
    node.location=blender(a)
    node.rotation_mode='QUATERNION'
    node.rotation_quaternion=Vector(blender(axis)).rotation_difference(delta.normalized())
    if stretch: node.scale.z=delta.length

for sign,side in [(-1,'Left'),(1,'Right')]:
    shoulder=(sign*.198,1.44,0)
    elbow=(sign*.29,1.175,.042)
    wrist=(sign*.32,.955,-.085)
    aim(bpy.data.objects['Sleeve'+side],shoulder,elbow)
    aim(bpy.data.objects['Bracer'+side],elbow,wrist)
    bpy.data.objects['Glove'+side].location=blender(wrist)
bow.location=blender((-.32,.955,-.085))
for sign,name in [(1,'CordTop'),(-1,'CordBottom')]:
    aim(bpy.data.objects[name],(-.32,.955+sign*.62,.05),(-.32,.955,.05),(0,1,0),True)
# Park the inspection arrow inside the quiver in the source rest pose.
arrow.location=blender((-.15,1.0,.22))
bpy.ops.wm.save_as_mainfile(filepath=str(BASE/'art/archer-ranger.blend'))
bpy.ops.export_scene.gltf(filepath=str(BASE/'public/assets/models/archer-ranger.glb'),
                          export_format='GLB',export_animations=False,export_yup=True)


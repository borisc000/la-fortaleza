"""Original medium-armoured swordsman. Editable segmented meshes with articulated joints."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from character_mesh import *

steel = material('Acero templado', (.25,.29,.32), .43, .78)
edge = material('Filos bruñidos', (.48,.53,.55), .28, .83)
mail = material('Anillas oscuras', (.10,.12,.13), .60, .65)
red = material('Paño granate', (.25,.036,.032))
body = pivot('Torso')
sections(body,leather,[(.85,.23,.156,0),(.91,.235,.163,0),(1.04,.185,.14,0),
    (1.12,.19,.145,0),(1.24,.225,.165,0),(1.35,.26,.17,.008),
    (1.43,.26,.15,.01),(1.49,.215,.12,.012),(1.53,.09,.076,0)],48,.022)

# Shaped partial cuirass, with a gently raised central ridge.
rows=[]
for y,w,d in [(1.20,.214,.164),(1.23,.23,.171),(1.34,.269,.184),(1.42,.269,.164),
               (1.46,.225,.134),(1.48,.135,.10)]:
    rows.append([(w*math.sin(a),y+.012*math.cos(a),-d*math.cos(a)-.012*max(0,math.cos(a))**8)
                 for a in [-1.48+i/36*2.96 for i in range(37)]])
ribbon(body,steel,rows,thickness=.004)
cord(body,edge,rows[0],.005)
cord(body,edge,rows[-1],.004)
for sign in (-1,1):
    cord(body,brass,[(sign*.18,1.23,-.107),(sign*.215,1.33,-.12),
                     (sign*.22,1.42,-.10)],.004)
    for y in (1.26,1.32,1.38):
        oval(body,brass,(sign*.206,y,-.129),(.006,.006,.004))
    # Back harness follows the shoulder blades into the belt.
    ribbon(body,hide,[[(sign*x+dx,y,z) for dx in (-.022,.022)]
                     for x,y,z in [(.13,1.49,.10),(.20,1.38,.196),(.15,1.2,.192),(.11,1.02,.152)]],thickness=.004)
back=[]
for y,w,d in [(1.215,.212,.166),(1.25,.228,.174),(1.34,.262,.184),(1.42,.262,.166),(1.46,.222,.136),(1.485,.14,.104)]:
    back.append([(w*math.sin(a),y,d*math.cos(a)+.010*max(0,math.cos(a))**8) for a in [-1.46+i/36*2.92 for i in range(37)]])
ribbon(body,steel,back,thickness=.004)
cord(body,edge,back[0],.005)
cord(body,edge,back[-1],.004)
for k,(top,low) in enumerate([(1.208,1.152),(1.162,1.098)]):
    lame=[[(w*math.sin(a),y,d*math.cos(a)) for a in [-1.36+i/30*2.72 for i in range(31)]]
          for y,w,d in [(top,.214+.004*k,.168),(low,.209+.004*k,.166)]]
    ribbon(body,steel,lame,thickness=.004)
    cord(body,edge,lame[-1],.0035)
for k,(top,low) in enumerate([(1.208,1.152),(1.162,1.098)]):
    lame=[[(w*math.sin(a),y,-d*math.cos(a)) for a in [-1.36+i/30*2.72 for i in range(31)]]
          for y,w,d in [(top,.214+.004*k,.168),(low,.209+.004*k,.166)]]
    ribbon(body,steel,lame,thickness=.004)
    cord(body,edge,lame[-1],.0035)
sections(body,hide,[(1.015,.194,.148,0),(1.025,.201,.154,0),(1.077,.197,.15,0),(1.085,.189,.141,0)])
cord(body,brass,[(-.034,1.03,-.158),(.034,1.03,-.158),(.034,1.072,-.158),
                 (-.034,1.072,-.158),(-.034,1.03,-.158)],.006)
cord(body,brass,[(0,1.053,-.162),(.025,1.053,-.162)],.0035,8)
oval(body,hide,(-.22,.925,.008),(.075,.091,.052))
oval(body,leather,(-.225,.96,-.027),(.072,.047,.036))
oval(body,brass,(-.225,.943,-.062),(.010,.012,.004))

# Split cloth skirts lie over a short mail shirt. Openings allow a walking stance.
sections(body,mail,[(.73,.25,.174,0),(.76,.25,.172,0),(.91,.229,.158,0),(1.00,.196,.147,0)],48)
for back in (False,True):
    for sign in (-1,1):
        rows=[]
        for j in range(14):
            t=j/13
            row=[]
            for i in range(13):
                u=i/12
                angle=.065+u*.94
                width=.199+.067*math.sin(min(1,t/.55)*math.pi/2)
                depth=.157+.060*math.sin(min(1,t/.60)*math.pi/2)
                fold=.006*math.sin(u*math.pi*3)*t
                row.append((sign*math.sin(angle)*(width+fold),
                            1.044-.39*t+.018*t*u,
                            (1 if back else -1)*math.cos(angle)*(depth+fold)))
            rows.append(row)
        ribbon(body,red,rows,thickness=.003)
        cord(body,brass,rows[-1],.003)

# Actual small links at the exposed hem and shoulder panels.
def links(parent, center, width, height, depth):
    x,y,z=center
    for row in range(height):
        for col in range(width):
            cx=x+(col-(width-1)/2)*.018+(row%2)*.008
            cy=y-row*.014
            points=[]
            for i in range(9):
                a=i*math.tau/8
                px=cx+.010*math.cos(a)
                py=cy+.006*math.sin(a)
                # Follow the mail shirt's elliptical section at the exposed hem.
                surface_depth=.174*math.sqrt(max(0,1-(px/.25)**2))
                points.append((px,py,-surface_depth-.002+depth*math.cos(a)))
            cord(parent,mail,points,.0018,4)
links(body,(0,.807,-.179),25,6,.002)

sections(body,mail,[(1.49,.095,.081,0),(1.54,.091,.078,0),(1.56,.079,.068,0)])
head=pivot('Head',(0,1.53,0),body)
sections(head,skin,[(-.06,.065,.058,0),(.075,.063,.058,0)])
sections(head,skin,[(.045,.034,.043,-.025),(.058,.067,.067,-.022),(.10,.088,.079,-.013),
    (.15,.095,.089,0),(.20,.093,.085,.008),(.25,.085,.077,.013),(.285,.052,.049,.014),(.3,.008,.012,.014)])
for sign in (-1,1):
    oval(head,skin,(sign*.094,.15,.004),(.018,.033,.022))
    oval(head,linen,(sign*.037,.173,-.086),(.020,.006,.006))
    oval(head,iris,(sign*.037,.173,-.092),(.007,.005,.003))
    cord(head,hair,[(sign*.017,.193,-.088),(sign*.040,.198,-.085),(sign*.062,.193,-.074)],[.005,.007,.004])
cord(head,skin,[(0,.19,-.083),(0,.15,-.105),(0,.14,-.107)],[.009,.014,.013])
cord(head,lip,[(-.025,.107,-.085),(0,.104,-.094),(.025,.107,-.085)],.003)
# Swept hair and short beard leave cheekbones and jaw readable.
rows=[]
for j in range(13):
    t=j/12
    row=[]
    for i in range(40):
        a=i*math.tau/40
        y=.224+.095*math.sin(t*math.pi/2)-.045*(1-t)*max(0,-math.cos(a))
        w=.112*math.cos(t*math.pi/2)+.001
        d=.105*math.cos(t*math.pi/2)+.001
        row.append((w*math.sin(a),y,.013-d*math.cos(a)))
    rows.append(row)
shell(head,hair,rows)
for sign in (-1,1):
    cord(head,hair,[(sign*.087,.19,-.012),(sign*.085,.124,-.030),(sign*.058,.075,-.065),
                    (sign*.025,.056,-.07)],[.012,.012,.015,.013])
cord(head,hair,[(-.03,.062,-.074),(0,.055,-.079),(.03,.062,-.074)],.015)

for sign,side in [(-1,'Left'),(1,'Right')]:
    leg=pivot('Leg'+side,(sign*.135,.94,0))
    sections(leg,trousers,[(-.48,.068,.07,0),(-.40,.083,.087,0),(-.25,.105,.11,.006),
                           (-.10,.117,.12,.008),(.01,.112,.105,0)],32,.025)
    sections(leg,hide,[(-.94,.080,.132,-.045),(-.925,.092,.160,-.07),(-.87,.092,.157,-.07),
        (-.80,.076,.100,-.02),(-.71,.074,.086,0),(-.62,.088,.096,.006),(-.54,.092,.096,.004),(-.45,.086,.090,0)])
    sections(leg,hide,[(-.94,.077,.130,-.045),(-.934,.086,.151,-.065),
                       (-.919,.088,.155,-.069),(-.905,.085,.152,-.068)])
    oval(leg,steel,(0,-.43,-.05),(.094,.092,.058))
    oval(leg,brass,(0,-.43,-.108),(.010,.010,.005))
    ribbon(leg,steel,[[(math.sin(a)*w,y,-.012-math.cos(a)*d) for a in [-1.15+i/20*2.3 for i in range(21)]]
                      for y,w,d in [(-.83,.072,.094),(-.77,.081,.099),(-.61,.096,.104),(-.53,.094,.103)]],thickness=.005)
    cord(leg,edge,[(math.sin(a)*.094,-.53,-.012-math.cos(a)*.103) for a in [-1.15+i/20*2.3 for i in range(21)]],.004)
    upper=pivot('Upper'+side,(sign*.245,1.44,0),body)
    sections(upper,mail,[(-.322,.058,.060,0),(-.28,.065,.067,0),(-.25,.071,.073,0),(-.12,.084,.086,0),
                         (-.02,.088,.088,0),(.035,.065,.063,0)],32)
    # Domed pauldron: a spherical cap over the shoulder and two lames down the outer arm.
    cap=[]
    for j in range(10):
        th=.16+j/9*1.59
        cap.append([(sign*.128*math.sin(th)*math.cos(ph),-.03+.11*math.cos(th),.128*math.sin(th)*math.sin(ph))
                    for ph in [-2.25+i/28*4.5 for i in range(29)]])
    ribbon(upper,steel,cap,thickness=.006)
    cord(upper,edge,cap[-1],.0055)
    for k in (1,2):
        top=-.03-k*.05;r=.127-k*.006
        lame=[[(sign*rr*math.cos(ph),y,rr*math.sin(ph)) for ph in [-1.95+i/28*3.9 for i in range(29)]]
              for y,rr in [(top+.032,r-.014),(top,r),(top-.046,r+.004)]]
        ribbon(upper,steel,lame,thickness=.005)
        cord(upper,edge,lame[-1],.0045)
    for ph in (-1.25,0,1.25):
        oval(upper,brass,(sign*.131*math.cos(ph),-.02,.131*math.sin(ph)),(.008,.008,.008))
    fore=pivot('Fore'+side,(0,-.285,0),upper)
    sections(fore,leather,[(-.282,.040,.044,0),(-.22,.051,.057,0),(-.12,.067,.07,0),
                          (-.03,.067,.068,0),(.015,.051,.053,0)])
    ribbon(fore,steel,[[(math.sin(a)*w,y,-.005-math.cos(a)*d) for a in [-1.3+i/20*2.6 for i in range(21)]]
                       for y,w,d in [(-.245,.047,.055),(-.20,.06,.065),(-.08,.073,.078),(-.045,.067,.072)]])
    glove=pivot('Hand'+side,(0,-.284,0),fore)
    oval(glove,hide,(0,-.027,0),(.045,.060,.036))
    sections(glove,hide,[(.004,.040,.038,0),(.022,.042,.040,0),(.045,.039,.037,0)])
    for j in range(4):
        y=-.065+j*.022
        cord(glove,leather,[(sign*.027,y,.006),(sign*.042,y,-.020),(sign*.02,y,-.044),
                            (-sign*.009,y,-.038)],[.013,.013,.011,.008])
    cord(glove,leather,[(-sign*.025,.005,0),(-sign*.041,-.014,-.02),(-sign*.023,-.028,-.045)],.015)
    oval(glove,steel,(0,-.025,.026),(.042,.047,.014))

sword=pivot('Sword',(0,-.025,-.025),bpy.data.objects['HandRight'])
cord(sword,hide,[(0,.14,0),(0,-.09,0)],.022,12)
for j in range(10):
    cord(sword,brass,[(0,.10-j*.018,0),(0,.104-j*.018,0)],.023,10)
oval(sword,steel,(0,.165,0),(.040,.040,.018))
oval(sword,brass,(0,.165,-.019),(.012,.012,.004))
cord(sword,steel,[(-.19,-.142,-.004),(-.15,-.118,0),(-.07,-.104,0),(0,-.102,0),(.07,-.104,0),(.15,-.118,0),(.19,-.142,-.004)],
     [.013,.020,.019,.024,.019,.020,.013],12)
blade=[]
for y,w,t in [(-.118,.050,.014),(-.17,.053,.014),(-.50,.046,.012),(-.76,.036,.010),(-.86,.022,.007),(-.925,.002,.002)]:
    blade.append([(-w,y,0),(-w*.36,y,-t),(0,y,-t*.45),(w*.36,y,-t),(w,y,0),(w*.36,y,t),(0,y,t*.45),(-w*.36,y,t)])
shell(sword,edge,blade)

for (parent,mat),(vertices,faces) in batches.items():
    mesh=bpy.data.meshes.new(parent.name+' '+mat.name)
    mesh.from_pydata(vertices,[],faces)
    mesh.update()
    bm=bmesh.new()
    bm.from_mesh(mesh)
    bmesh.ops.recalc_face_normals(bm,faces=bm.faces[:])
    bm.to_mesh(mesh)
    bm.free()
    obj=bpy.data.objects.new(mesh.name,mesh)
    bpy.context.collection.objects.link(obj)
    obj.parent=parent
    obj.data.materials.append(mat)
    for polygon in mesh.polygons:
        polygon.use_smooth=True

bpy.ops.wm.save_as_mainfile(filepath=str(BASE/'art/warrior-veteran.blend'))
bpy.ops.export_scene.gltf(filepath=str(BASE/'public/assets/models/warrior-veteran.glb'),
                          export_format='GLB',export_animations=False,export_yup=True)

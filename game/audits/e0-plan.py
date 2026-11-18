import json, math, re, html
from pathlib import Path
base=Path('..'); out=base/'e0'
r=json.loads((out/'spatial.json').read_text(encoding='utf-8-sig'))
plan={'status':'design_for_E1_not_implemented','bounds':{'minX':-138,'maxX':142,'minZ':-20,'maxZ':240},'spawn':{'x':20,'z':205},'gate':{'x':4,'z':-18},'cameraDistance':12,
'anchors':[[4,-8],[-35,30],[-30,65],[4,45],[50,55],[35,2],[-95,65],[-78,105],[-28,110],[8,130],[90,120],[100,65],[-85,160],[10,180],[90,190]],
'primary':[[20,205],[10,175],[8,130],[-4,85],[4,40],[4,-8]],
'westLoop':[[10,175],[-85,160],[-78,105],[-28,110],[-35,30],[4,40]],
'eastLoop':[[10,175],[90,190],[90,120],[100,65],[50,55],[4,40]],
'crossLinks':[[[-78,105],[-95,65],[-35,30]],[[-28,110],[8,130],[90,120]],[[-30,65],[-4,85],[50,55]]],
'activities':{'shop':[35,180],'capture':[-20,110],'firstChest':[25,195],'firstSupply':[12,199],'firstCoins':[20,194]},
'sectors':[{'id':'A','name':'Llegada y caravanas','center':[20,205]},{'id':'B','name':'Campos y molinos','center':[-85,145]},{'id':'C','name':'Abadía y cruce','center':[-28,110]},{'id':'D','name':'Bosque y atalaya','center':[90,100]},{'id':'E','name':'Campamentos del cerco','center':[-35,35]},{'id':'F','name':'Explanada y fortaleza','center':[4,-5]}]}
for key in ['primary','westLoop','eastLoop']:
 points=plan[key];length=sum(math.dist(a,b) for a,b in zip(points,points[1:]));plan[key+'Estimate']={'meters':round(length,1),'secondsAt5mps':round(length/5,1),'method':'polyline estimate; no new geometry/collisions yet'}
(out/'propuesta.json').write_text(json.dumps(plan,ensure_ascii=False,indent=2),encoding='utf-8')
# Diagram generated from measured geometry and explicit proposed coordinates, not a game screenshot.
s=['<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="1050" viewBox="0 0 1440 1050"><style>text{font-family:Segoe UI,Arial,sans-serif;fill:#e2e6dc}.small{font-size:13px}.body{font-size:16px}.title{font-size:26px;font-weight:600}.label{font-size:14px;font-weight:600}</style><rect width="1440" height="1050" fill="#111c19"/>']
def text(x,y,t,cl='body',fill=None):s.append(f'<text x="{x}" y="{y}" class="{cl}"'+(f' style="fill:{fill}"' if fill else '')+'>'+html.escape(t)+'</text>')
def line(points,color,width=3,dash=None):s.append('<polyline points="'+' '.join(f'{x:.1f},{y:.1f}' for x,y in points)+f'" fill="none" stroke="{color}" stroke-width="{width}" stroke-linejoin="round"'+(f' stroke-dasharray="{dash}"' if dash else '')+'/>')
def rect(x,y,w,h,fill,stroke=None,dash=None):s.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{fill}"'+(f' stroke="{stroke}"' if stroke else '')+(f' stroke-dasharray="{dash}"' if dash else '')+'/>')
text(40,48,'LOS DOMINIOS EXTERIORES · FASE 0','title');text(40,80,'Diagnóstico y distribución propuesta · 11 noviembre 2026 · Norte / fortaleza arriba','body','#a8b8aa')
for x in [30,740]:rect(x,108,670,870,'#1b2a24','#3c5046')
scale=1.83
def pos(x,z,side=0):return (65+side*710+(x+138)*scale,190+(z+20)*scale)
def path(coords,color,width=3,side=0,dash=None):line([pos(x,z,side)for x,z in coords],color,width,dash)
text(55,145,'ACTUAL · 260 × 240 m','title');text(765,145,'PROPUESTA · 280 × 260 m','title')
for side in [0,1]:
 x,y=pos(-138,-20,side);rect(x,y,280*scale,260*scale,'#24372b','#719482')
 x,y=pos(-128,-20,side);rect(x,y,260*scale,240*scale,'none','#8c9d86','6 5')
 path([[-128,-18],[132,-18]],'#c8bda2',8,side)
 x,y=pos(4,-18,side);rect(x-6,y-5,12,10,'#e8c16d');text(x+12,y-12,'Puerta','small')
 if side:
  text(790,704,'+10 m por lado · +20 m al sur · +16,7 % de superficie','small','#dec17c')
 else:text(80,704,'Límite actual discontinuo · obstáculos en gris','small','#a8b8aa')
# actual obstacle footprints
for b in r['solids']:
 x,z=b['min']['x'],b['min']['z'];w=b['max']['x']-x;h=b['max']['z']-z
 if z>=-20 and -138<x<142 and z<240:
  px,py=pos(x,z);rect(px,py,max(.6,w*scale),max(.6,h*scale),'#657065')
world=Path('src/rendering/world.ts').read_text(encoding='utf-8')
for m in re.findall(r'trail\((\[\[.*?\]\])',world):path(json.loads(m),'#a79e7e',3)
path([[2.3+math.sin(z*.08)*1.4,z]for z in range(-16,221,4)],'#d8c58e',5)
for i,l in enumerate(r['landmarks'],1):
 x,y=pos(l['x'],l['z']);s.append(f'<circle cx="{x}" cy="{y}" r="8" fill="#15201b" stroke="#9dba94"/>');text(x-4,y+4,str(i),'small')
for obj in r['objects']:
 x,y=pos(obj['x'],obj['z']);s.append(f'<circle cx="{x}" cy="{y}" r="2.7" fill="#dfaf65"/>')
x,y=pos(0,7);s.append(f'<circle cx="{x}" cy="{y}" r="6" fill="#faf8dc"/>');text(x+12,y+5,'Inicio actual','small')
# proposed macro-sector areas are guide envelopes, not collision walls
for cx,cz,rx,rz,color in [(20,205,110,30,'#425543'),(-85,140,43,66,'#655139'),(-28,110,42,37,'#514859'),(90,105,40,65,'#34594c'),(-35,40,68,40,'#5e5545'),(4,-3,52,15,'#69604d')]:
 x,y=pos(cx,cz,1);s.append(f'<ellipse cx="{x}" cy="{y}" rx="{rx*scale}" ry="{rz*scale}" fill="{color}" opacity=".65"/>')
for key,col,w in [('primary','#edd097',7),('westLoop','#9fb9a2',4),('eastLoop','#9fb9a2',4)]:path(plan[key],col,w,1)
for coords in plan['crossLinks']:path(coords,'#819881',2,1,'5 4')
for i,(x,z)in enumerate(plan['anchors'],1):
 px,py=pos(x,z,1);s.append(f'<circle cx="{px}" cy="{py}" r="3" fill="#e1d8bd"/>')
for sec in plan['sectors']:
 x,z=sec['center'];px,py=pos(x,z,1);s.append(f'<circle cx="{px}" cy="{py}" r="12" fill="#16231c" stroke="#eed09a"/>');text(px-5,py+5,sec['id'],'label')
for key,label in [('shop','Mercader'),('capture','Captura')]:
 x,y=pos(*plan['activities'][key],1);rect(x-4,y-4,8,8,'#79c6db');text(x+10,y-7,label,'small','#b0dfed')
x,y=pos(20,205,1);text(x+15,y+23,'Nueva llegada','small','#fff0b5')
for y,t in [(746,'15 lugares conectados y 33 objetos iniciales (semilla 9173).'),(775,'Circuito medido de referencia: 519 m / 104 s sin combate.'),(804,'Piedra y barro repetidos; casi todo el terreno está al mismo nivel.'),(833,'La puerta ya domina la vista desde el inicio, a unos 25 m.'),(875,'Conservar: escala del personaje, claros y navegación local.'),(904,'Revisar: sectores, pavimento, vegetación y límites visibles.')]:text(55,y,t,'small')
for y,t in [(746,'A  Llegada y caravanas        B  Campos del asedio y molinos'),(775,'C  Abadía y encrucijada       D  Bosque y atalaya'),(804,'E  Campamentos del cerco     F  Explanada y fortaleza'),(843,'Ruta principal ≈ '+str(plan['primaryEstimate']['meters'])+' m / '+str(plan['primaryEstimate']['secondsAt5mps'])+' s a 5 m/s.'),(872,'Laterales y atajos abiertos; claros de combate de 24–40 m.'),(901,'Las áreas de color orientan el diseño; no son muros ni barreras.'),(930,'Coordenadas propuestas. Validación física pendiente en E1.')]:text(765,y,t,'small')
text(40,1013,'E0 define el diseño. El juego conserva todavía el mapa actual. Los tiempos propuestos excluyen combate y obstáculos nuevos.','body','#a9b8a7')
s.append('</svg>');svg=''.join(s);(out/'plano.svg').write_text(svg,encoding='utf-8');(out/'plano.html').write_text('<!doctype html><html lang="es"><meta charset="utf-8"><title>Los dominios exteriores · Plano E0</title><style>body{margin:0;background:#111c19}svg{width:100%;height:auto;display:block}</style>'+svg+'</html>',encoding='utf-8')
print({k:v for k,v in plan.items()if k.endswith('Estimate')})

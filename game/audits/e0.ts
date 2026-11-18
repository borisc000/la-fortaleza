import * as THREE from 'three';
import { loadAssets } from '../src/rendering/assets.ts';
import { loadWarriorAsset } from '../src/rendering/warrior-asset.ts';
import { createWorld } from '../src/rendering/world.ts';
import { ThirdPersonCamera } from '../src/rendering/camera.ts';
import { createHordeView } from '../src/rendering/horde.ts';
import { Combat } from '../src/domain/combat.ts';
import { LANDMARKS } from '../src/content/map.ts';
import { EXPEDITION } from '../src/content/expedition.ts';
import { PLAY_AREA } from '../src/content/config.ts';
import { Exploration } from '../src/domain/exploration.ts';
import { createExplorationView } from '../src/rendering/exploration.ts';
const el=(id:string)=>document.getElementById(id)!;
const renderer=new THREE.WebGLRenderer({canvas:el('scene') as HTMLCanvasElement,antialias:true});
renderer.setPixelRatio(1);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
await loadWarriorAsset();const assets=await loadAssets(4,()=>{}),world=createWorld(assets),camera=new ThirdPersonCamera();
const group=new THREE.Group();world.scene.add(group);const horde=createHordeView(group);
// Optional functional inspection; the original render benchmark remains unchanged.
const exploration=new URLSearchParams(location.search).has('objects')?new Exploration(PLAY_AREA,world.movementSolids,19):undefined;
const explorationView=exploration?createExplorationView(world.scene):undefined;
if(exploration)document.querySelector('header strong')!.textContent='E1.3 · Encaje funcional';
// Keep E0 coordinates available for like-for-like comparisons after moving the arrival.
const points=[{name:'Inicio E0 (referencia)',x:0,z:7},...LANDMARKS,
 {name:'Llegada sur E1.1',...EXPEDITION.start},
 {name:'Borde suroeste E1.1',x:PLAY_AREA.minX+3,z:PLAY_AREA.maxZ-4},
 {name:'Borde sureste E1.1',x:PLAY_AREA.maxX-3,z:PLAY_AREA.maxZ-4},
 ...(exploration?.objects.filter(o=>['chest','fountain','shop','capture'].includes(o.kind)).map(o=>({name:`${o.kind} · ${o.region}`,x:o.x,z:o.z+4}))??[]),
];
el('zone').replaceChildren(...points.map((p,i)=>new Option(p.name,String(i))));
let combat:Combat,time=0,last=0,samples:number[]|undefined,warmup=0;
function reset(){const p=points[Number((el('zone') as HTMLSelectElement).value)];world.hero.root.position.set(p.x,0,p.z);camera.reset(Number((el('direction') as HTMLSelectElement).value));
 combat=new Combat(PLAY_AREA,world.movementSolids,[],false);const count=Number((el('population') as HTMLSelectElement).value);
 combat.addEnemies(Array.from({length:count},(_,i)=>({x:p.x+Math.sin(i*2.39996)*(4+Math.sqrt(i/count)*13),z:p.z+Math.cos(i*2.39996)*(4+Math.sqrt(i/count)*13)})),0,'thrall');
 samples=undefined;el('status').textContent='Listo';el('result').textContent=`${p.name} · (${p.x}, ${p.z}) · cámara 12 m · DPR 1\nEscena real; carga sintética sin IA, ataques ni habilidades. Fallos de recursos: ${assets.failures.length}`;
}
function resize(){renderer.setSize(innerWidth,innerHeight-64,false);camera.resize(innerWidth,innerHeight-64);}addEventListener('resize',resize);resize();
for(const id of ['zone','direction','population'])el(id).onchange=reset;
el('measure').onclick=()=>{samples=[];warmup=30;el('status').textContent='Midiendo…';};reset();
function tick(now:number){const ms=last?now-last:0,dt=Math.min(ms/1000,.05);last=now;time+=dt;
world.hero.walk(dt,0);world.hero.combatPose(undefined,0);camera.update(world.hero.root.position,world.obstacles,dt);world.update(time);horde.update(combat.enemies,1,time);if(exploration&&explorationView)explorationView.update(exploration.objects,undefined,time);renderer.render(world.scene,camera.camera);
if(samples&&ms>0){if(warmup>0)warmup--;else samples.push(ms);if(samples.length===300){const sorted=[...samples].sort((a,b)=>a-b),result={zone:points[Number((el('zone')as HTMLSelectElement).value)].name,population:combat.enemies.length,samples:300,meanMs:samples.reduce((a,b)=>a+b,0)/300,p95Ms:sorted[284],fps:300000/samples.reduce((a,b)=>a+b,0),calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,width:renderer.domElement.width,height:renderer.domElement.height,dpr:1,cameraDistance:camera.distance,failures:assets.failures,benchmark:'render + instance update; no combat AI'};el('result').textContent=JSON.stringify(result,null,2);el('status').textContent='Medición completa';samples=undefined;}}
requestAnimationFrame(tick);}requestAnimationFrame(tick);
addEventListener('pagehide',()=>{explorationView?.dispose();horde.dispose();world.dispose();assets.dispose();renderer.dispose();},{once:true});

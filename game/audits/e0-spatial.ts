import * as THREE from 'three';
import { createWorld } from '../src/rendering/world.ts';
import { Navigation } from '../src/domain/navigation.ts';
import { Exploration } from '../src/domain/exploration.ts';
import { PLAY_AREA, PLAYER } from '../src/content/config.ts';
import { LANDMARKS } from '../src/content/map.ts';
import { stepMovement, overlaps } from '../src/domain/movement.ts';

const material = new THREE.MeshStandardMaterial();
const world = createWorld({ materials: { castle_wall_slates: material, cobblestone_floor_04: material, brown_mud_02: material, weathered_brown_planks: material }, failures: [], dispose() {} });
const nav = new Navigation(PLAY_AREA, world.movementSolids, PLAYER.radius);
const exploration = new Exploration(PLAY_AREA, world.movementSolids, 9173, PLAYER.radius, true);
function route(points: {x:number; z:number}[]) {
  const body = { ...points[0], yaw: 0 }, trace = [{x:body.x,z:body.z}]; let seconds=0, meters=0, stalled=false;
  for (const target of points.slice(1)) {
    nav.update(target);
    let count=0;
    while (Math.hypot(body.x-target.x,body.z-target.z)>.5 && count++<12000) {
      const next = nav.waypoint(body,target); if(!next) {stalled=true;break;}
      const dx=next.x-body.x,dz=next.z-body.z,d=Math.hypot(dx,dz);
      const speed=stepMovement(body,{right:dx/Math.max(d,.001),forward:-dz/Math.max(d,.001)},0,.05,PLAYER,PLAY_AREA,world.movementSolids);
      seconds+=.05;meters+=speed*.05;if(count%20===0)trace.push({x:body.x,z:body.z});
    }
    if(count>=12000||stalled){stalled=true;break;}
    trace.push({x:body.x,z:body.z});
  }
  return {seconds:+seconds.toFixed(2),meters:+meters.toFixed(2),stalled,trace};
}
const origin={x:0,z:7};
const visits=LANDMARKS.map(l=>({name:l.name,...route([origin,l])}));
const reference=route([origin,LANDMARKS[3],LANDMARKS[9],LANDMARKS[13],LANDMARKS[12],LANDMARKS[7],LANDMARKS[1],origin]);
let free=0, covered=0,maxGap=0,maxPoint={x:0,z:0};
for(let x=-125;x<132;x+=5)for(let z=-15;z<220;z+=5){
  const point={x,z};if(world.movementSolids.some(s=>overlaps(point,.4,s)))continue;free++;
  const d=Math.min(...exploration.objects.map(o=>Math.hypot(x-o.x,z-o.z)));if(d<=24)covered++;
  if(d>maxGap){maxGap=d;maxPoint=point;}
}
nav.update(origin);
const reachable=Array.from(nav.distance).filter(n=>n>=0).length;
console.log(JSON.stringify({bounds:PLAY_AREA,speed:PLAYER.speed,seed:9173,obstacles:world.obstacles.length,movementSolids:world.movementSolids.length,
  navigation:{cells:nav.free.length,free:Array.from(nav.free).filter(Boolean).length,reachable},
  landmarks:LANDMARKS,objects:exploration.objects,visits,reference,
  discoveryCoverage:{gridStep:5,freeSamples:free,within24m:covered,fraction:covered/free,maxGap,maxPoint,ignoresLineOfSight:true},
  solids:world.movementSolids},null,2));
world.dispose();

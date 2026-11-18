import * as THREE from 'three';
import { tailoredVolume } from './tailored-geometry.ts';
import type { Section } from './tailored-geometry.ts';
/** Smooth cross-section profiles instead of linear connections between anatomical landmarks. */
export function organicVolume(sections: readonly Section[], folds=0) {
 const curve=new THREE.CatmullRomCurve3(sections.map(([y,w,d])=>new THREE.Vector3(w,y,d)),false,'centripetal');
 const samples=curve.getPoints((sections.length-1)*4).map(p=>[p.y,p.x,p.z] as Section);
 return tailoredVolume(samples,folds,24);
}
/** Closed garment surface wrapping an elliptical body; hem and silhouette are curved. */
export function organicShell(width:number,height:number,depth:number,spread:number,folds=0,taper=0) {
 const g=new THREE.BoxGeometry(2,1,.014,32,16,1),p=g.getAttribute('position');
 for(let i=0;i<p.count;i++){
  const u=p.getX(i),v=p.getY(i)+.5,thickness=p.getZ(i),angle=u*spread;
  const flare=taper ? 1-taper*(1-v)+.035*Math.sin(v*Math.PI) : 1+.13*(1-v),ripple=folds*Math.cos(angle*7)*(1-v);
  p.setXYZ(i,Math.sin(angle)*(width*flare+thickness+ripple), (v-.5)*height+.025*(1-v)*Math.cos(angle*3),-Math.cos(angle)*(depth+thickness+ripple));
 }
 const index=g.index!;for(let i=0;i<index.count;i+=3){const b=index.getX(i+1);index.setX(i+1,index.getX(i+2));index.setX(i+2,b);}g.computeVertexNormals();return g;
}

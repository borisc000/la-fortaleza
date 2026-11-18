import * as THREE from 'three';
export type Section = readonly [y:number, width:number, depth:number, centerZ?:number];
/** Elliptical cross-sections with connected, smooth normals: tapered cloth, not stacked solids. */
export function tailoredVolume(sections: readonly Section[], folds = 0, segments = 32) {
  const vertices:number[]=[], indices:number[]=[];
  sections.forEach(([y,w,d,z=0],row)=> { for(let i=0;i<=segments;i++){const a=i/segments*Math.PI*2, ripple=1+folds*Math.cos(a*8)*(1-row/(sections.length+1));vertices.push(Math.sin(a)*w*ripple,y,z+Math.cos(a)*d*ripple);}});
  for(let r=0;r<sections.length-1;r++)for(let i=0;i<segments;i++){const a=r*(segments+1)+i,b=a+segments+1;indices.push(a,b,a+1,b,b+1,a+1);}
  for(const row of [0,sections.length-1]){const [y,,,z=0]=sections[row],center=vertices.length/3;vertices.push(0,y,z);for(let i=0;i<segments;i++){const a=row*(segments+1)+i;indices.push(center,...(row===0?[a+1,a]:[a,a+1]));}}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));for(let i=0;i<indices.length;i+=3){const t=indices[i+1];indices[i+1]=indices[i+2];indices[i+2]=t;}g.setIndex(indices);g.computeVertexNormals();return g;
}
/** Thick curved panel for overlapping breastplates or cloth tails. */
export function tailoredPanel(width:number, height:number, depth:number, fold=0) {
 const g=new THREE.BoxGeometry(width,height,depth,20,12,1);const p=g.getAttribute('position');
 for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),t=y/height+.5; p.setX(i,x*(.90+.10*t));p.setZ(i,p.getZ(i)+.045*(x/(width/2))**2+fold*Math.sin(x/width*Math.PI*5)*(1-t));}
 g.computeVertexNormals();return g;
}

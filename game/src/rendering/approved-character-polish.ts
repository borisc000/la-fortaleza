import * as THREE from 'three';
/** Equipment is attached to existing joints so combat animation and fading remain shared. */
export function polishCharacter(root: THREE.Group, kind: 'warrior' | 'mage' | 'archer', m: { cloth: THREE.Material; leather: THREE.Material; metal: THREE.Material; skin: THREE.Material }, arms: THREE.Group[]) {
  function box(parent: THREE.Object3D, material: THREE.Material, x:number,y:number,z:number,w:number,h:number,d:number,roll=0) {
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material); mesh.position.set(x,y,z); mesh.rotation.z=roll; mesh.castShadow=true; mesh.receiveShadow=true; parent.add(mesh); return mesh;
  }
  function sphere(parent: THREE.Object3D, material: THREE.Material,x:number,y:number,z:number,w:number,h:number,d:number) {
    const mesh=new THREE.Mesh(new THREE.SphereGeometry(1,12,8),material); mesh.position.set(x,y,z);mesh.scale.set(w,h,d);mesh.castShadow=true;parent.add(mesh);return mesh;
  }
  // Brow, nose and ears give the blank scale heads readable landmarks.
  sphere(root,m.skin,0,1.71,-.125,.025,.04,.025);
  for(const sign of [-1,1]) { sphere(root,m.skin,sign*.103,1.71,-.005,.022,.04,.025); box(root,m.leather,sign*.044,1.75,-.116,.058,.012,.012,sign*.12); }
  if(kind==='warrior') {
    box(root,m.cloth,0,1.19,-.165,.22,.48,.025);
    box(root,m.cloth,0,.76,-.15,.23,.3,.035);
    for(let i=0;i<4;i++) { box(root,m.metal,0,1.39-i*.105,-.19,.31-i*.025,.08,.038); }
    for(const sign of [-1,1]) { box(root,m.leather,sign*.19,1.24,-.17,.04,.48,.03,sign*.15); sphere(root,m.metal,sign*.19,1.4,-.19,.018,.018,.015); }
    arms.forEach((arm,i)=>{ for(let j=0;j<3;j++)box(arm,m.metal,0,-.02-j*.055,-.08,.26-j*.025,.045,.18,(i?1:-1)*.12); });
    box(root,m.leather,-.25,.86,.02,.14,.19,.14);box(root,m.metal,-.25,.88,-.06,.04,.05,.02);
  } else if(kind==='mage') {
    // Two embroidered stoles and layered skirt panels, rather than one plain cylinder.
    for(const sign of [-1,1]) { box(root,m.metal,sign*.12,1.3,-.155,.035,.39,.022,sign*.13);box(root,m.cloth,sign*.13,.65,-.245,.16,.78,.035,sign*.055);for(let j=0;j<6;j++)box(root,m.metal,sign*.14,.36+j*.09,-.27,.023,.023,.01,Math.PI/4); }
    sphere(root,m.metal,0,1.43,-.18,.06,.065,.025);
    for(let j=0;j<3;j++) {const ring=new THREE.Mesh(new THREE.TorusGeometry(.18+j*.022,.012,6,24),m.metal);ring.position.set(0,1.53-j*.05,.02);ring.rotation.x=Math.PI/2;root.add(ring);}
    box(root,m.leather,-.29,.87,.03,.16,.24,.13);box(root,m.metal,-.29,.87,-.045,.12,.18,.015);
    arms.forEach(arm=>box(arm,m.metal,0,-.37,-.11,.19,.065,.035));
  } else {
    // Asymmetric shoulder mantle, crossed harness and stitched leather panels.
    sphere(arms[0],m.cloth,0,-.015,.025,.18,.11,.18);
    box(root,m.leather,0,1.22,-.17,.055,.55,.03,-.5);
    box(root,m.metal,-.065,1.32,-.195,.075,.06,.02,-.5);
    for(const sign of [-1,1]) { box(root,m.leather,sign*.12,1.14,-.155,.13,.27,.035);for(let j=0;j<5;j++)box(root,m.metal,sign*.18,1.05+j*.045,-.18,.018,.009,.01);box(root,m.leather,sign*.22,.86,-.02,.13,.18,.13); }
    for(let j=0;j<3;j++)box(arms[0],m.metal,0,-.29-j*.045,-.09,.12,.025,.025);
    // Short split cape leaves bow and quiver readable.
    for(const sign of [-1,1])box(root,m.cloth,sign*.13,1.12,.19,.25,.61,.035,sign*.09);
  }
  root.name = `${kind} — estudio detallado, geometría procedural`;
}

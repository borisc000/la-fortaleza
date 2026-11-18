import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createMageAsset } from '../src/rendering/mage-asset.ts';

test('staff fingers wrap at separate heights and every book layer shares rigid weights', async () => {
 const bytes = await readFile(new URL('../public/assets/models/mage-slim.glb', import.meta.url));
 const { scene } = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
 scene.updateMatrixWorld(true);
 const heights: number[] = [];
 let bookParts = 0;
 scene.traverse(node => {
  if (!(node instanceof THREE.SkinnedMesh)) return;
  if (/^Dedo[ _]R/.test(node.name)) {
   node.geometry.computeBoundingBox();
   const center = node.geometry.boundingBox!.getCenter(new THREE.Vector3()).applyMatrix4(node.matrixWorld);
   heights.push(center.y);
   assert.ok(center.x > .33 && center.x < .37);
   assert.ok(center.z < -.12);
  }
  if (!node.name.startsWith('Grimorio')) return;
  bookParts++;
  const indices = node.geometry.getAttribute('skinIndex'), weights = node.geometry.getAttribute('skinWeight');
  for (let i = 0; i < weights.count; i++) {
   let root = 0, spine = 0;
   for (let k = 0; k < 4; k++) {
    const name = node.skeleton.bones[indices.getComponent(i, k)].name;
    if (name === 'root') root += weights.getComponent(i, k);
    if (name === 'spine') spine += weights.getComponent(i, k);
   }
   assert.ok(Math.abs(root - .75) < .0001 && Math.abs(spine - .25) < .0001);
  }
 });
 assert.equal(bookParts, 5);
 assert.equal(heights.length, 4);
 heights.sort((a,b) => a-b);
 for (let i = 1; i < heights.length; i++) assert.ok(heights[i] - heights[i-1] > .017);
});

test('hood extends onto the shoulders and its lower vertices are anchored to the torso', async () => {
 const bytes = await readFile(new URL('../public/assets/models/mage-slim.glb', import.meta.url));
 const { scene } = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
 scene.updateMatrixWorld(true);
 let hood: THREE.SkinnedMesh | undefined;
 scene.traverse(node => { if (node instanceof THREE.SkinnedMesh && node.name.startsWith('Capucha_abierta')) hood = node; });
 // Exporters preserve spaces in some versions.
 if (!hood) scene.traverse(node => { if (node instanceof THREE.SkinnedMesh && node.name.startsWith('Capucha abierta')) hood = node; });
 assert.ok(hood);
 const positions = hood.geometry.getAttribute('position');
 const indices = hood.geometry.getAttribute('skinIndex');
 const weights = hood.geometry.getAttribute('skinWeight');
 let shoulderVertices = 0;
 for (let i = 0; i < positions.count; i++) {
  const position = new THREE.Vector3().fromBufferAttribute(positions, i).applyMatrix4(hood.matrixWorld);
  if (position.y >= 1.48) continue;
  shoulderVertices++;
  let torsoWeight = 0;
  for (let k = 0; k < 4; k++) {
   if (hood.skeleton.bones[indices.getComponent(i, k)].name === 'spine') torsoWeight += weights.getComponent(i, k);
  }
  assert.ok(torsoWeight > .999);
 }
 assert.ok(shoulderVertices > 50, 'hood must extend down onto the shoulder mantle');
});
test('exported mage skins animate finite vertices and cloned rigs remain independent', async () => {
 const buffer=await readFile(new URL('../public/assets/models/mage-slim.glb',import.meta.url));
 const gltf=await new GLTFLoader().parseAsync(buffer.buffer.slice(buffer.byteOffset,buffer.byteOffset+buffer.byteLength),'');
 const a=createMageAsset(gltf.scene)!, b=createMageAsset(gltf.scene)!;
 assert.ok(a&&b);let skins=0;
 a.root.traverse(o=>{if(o instanceof THREE.SkinnedMesh){skins++;assert.ok(o.geometry.getAttribute('skinWeight'));}});assert.ok(skins>0);
 const other=b.root.getObjectByName('upperL')!.quaternion.clone();
 for(let i=0;i<120;i++) {a.walk(1/60,3);a.combatPose(i%2?.1:undefined,.2,i>60);a.root.updateMatrixWorld(true);a.root.traverse(o=>{if(o instanceof THREE.SkinnedMesh){o.skeleton.update();for(let j=0;j<o.geometry.getAttribute('position').count;j+=25){const v=new THREE.Vector3();o.getVertexPosition(j,v);assert.ok(v.toArray().every(Number.isFinite));assert.ok(v.length()<4);}}});}
 assert.ok(b.root.getObjectByName('upperL')!.quaternion.equals(other));assert.ok(!a.root.getObjectByName('upperL')!.quaternion.equals(other));
 a.fade(.3);a.root.traverse(o=>{if(o instanceof THREE.Mesh){for(const m of Array.isArray(o.material)?o.material:[o.material])assert.equal(m.opacity,.3);}});
 a.resetPose();assert.ok(a.root.getObjectByName('upperL')!.quaternion.equals(other));
});

test('stoles and stitched borders stay within eight millimetres of the robe surface', async () => {
 const data=await readFile(new URL('../public/assets/models/mage-slim.glb',import.meta.url));
 const {scene}=await new GLTFLoader().parseAsync(data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength),'');scene.updateMatrixWorld(true);
 let robe:THREE.Mesh|undefined;const panels:THREE.Mesh[]=[];
 scene.traverse(o=>{if(o instanceof THREE.Mesh){if(o.name.startsWith('Túnica')||o.name.startsWith('Tunica'))robe=o;if(o.name.startsWith('Estola')||o.name.startsWith('Bordado'))panels.push(o);}});
 assert.ok(robe);assert.equal(panels.length,6);
 const positions=robe.geometry.getAttribute('position'),index=robe.geometry.index!;
 const triangles:THREE.Triangle[]=[];for(let i=0;i<index.count;i+=3)triangles.push(new THREE.Triangle(...[0,1,2].map(j=>new THREE.Vector3().fromBufferAttribute(positions,index.getX(i+j)).applyMatrix4(robe!.matrixWorld)) as [THREE.Vector3,THREE.Vector3,THREE.Vector3]));
 const nearest=new THREE.Vector3();let maxGap=0;
 for(const panel of panels){const attr=panel.geometry.getAttribute('position');for(let i=0;i<attr.count;i+=17){const p=new THREE.Vector3().fromBufferAttribute(attr,i).applyMatrix4(panel.matrixWorld);let gap=Infinity;for(const triangle of triangles){triangle.closestPointToPoint(p,nearest);gap=Math.min(gap,p.distanceTo(nearest));}maxGap=Math.max(maxGap,gap);}}
 assert.ok(maxGap<.008,`maximum surface gap ${maxGap} m`);
});

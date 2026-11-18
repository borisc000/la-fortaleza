import * as THREE from 'three';
/** Equipment is attached to existing joints so combat animation and fading remain shared. */
export function polishCharacter(
  root: THREE.Group,
  kind: 'warrior' | 'mage' | 'archer',
  m: { cloth: THREE.Material; leather: THREE.Material; metal: THREE.Material; skin: THREE.Material },
  arms: THREE.Group[],
) {
  function box(
    parent: THREE.Object3D,
    material: THREE.Material,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    roll = 0,
  ) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    mesh.position.set(x, y, z);
    mesh.rotation.z = roll;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  function sphere(
    parent: THREE.Object3D,
    material: THREE.Material,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
  ) {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), material);
    mesh.position.set(x, y, z);
    mesh.scale.set(w, h, d);
    mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
  }
  // Brow, nose and ears give the blank scale heads readable landmarks.
  sphere(root, m.skin, 0, 1.71, -0.125, 0.025, 0.04, 0.025);
  for (const sign of [-1, 1]) {
    sphere(root, m.skin, sign * 0.103, 1.71, -0.005, 0.022, 0.04, 0.025);
    box(root, m.leather, sign * 0.044, 1.75, -0.116, 0.058, 0.012, 0.012, sign * 0.12);
  }
  if (kind === 'warrior') {
    box(root, m.cloth, 0, 1.19, -0.165, 0.22, 0.48, 0.025);
    box(root, m.cloth, 0, 0.76, -0.15, 0.23, 0.3, 0.035);
    for (let i = 0; i < 4; i++) {
      box(root, m.metal, 0, 1.39 - i * 0.105, -0.19, 0.31 - i * 0.025, 0.08, 0.038);
    }
    for (const sign of [-1, 1]) {
      box(root, m.leather, sign * 0.19, 1.24, -0.17, 0.04, 0.48, 0.03, sign * 0.15);
      sphere(root, m.metal, sign * 0.19, 1.4, -0.19, 0.018, 0.018, 0.015);
    }
    arms.forEach((arm, i) => {
      for (let j = 0; j < 3; j++)
        box(arm, m.metal, 0, -0.02 - j * 0.055, -0.08, 0.26 - j * 0.025, 0.045, 0.18, (i ? 1 : -1) * 0.12);
    });
    box(root, m.leather, -0.25, 0.86, 0.02, 0.14, 0.19, 0.14);
    box(root, m.metal, -0.25, 0.88, -0.06, 0.04, 0.05, 0.02);
  } else if (kind === 'mage') {
    // Two embroidered stoles and layered skirt panels, rather than one plain cylinder.
    for (const sign of [-1, 1]) {
      box(root, m.metal, sign * 0.12, 1.3, -0.155, 0.035, 0.39, 0.022, sign * 0.13);
      box(root, m.cloth, sign * 0.13, 0.65, -0.245, 0.16, 0.78, 0.035, sign * 0.055);
      for (let j = 0; j < 6; j++)
        box(root, m.metal, sign * 0.14, 0.36 + j * 0.09, -0.27, 0.023, 0.023, 0.01, Math.PI / 4);
    }
    sphere(root, m.metal, 0, 1.43, -0.18, 0.06, 0.065, 0.025);
    for (let j = 0; j < 3; j++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.18 + j * 0.022, 0.012, 6, 24), m.metal);
      ring.position.set(0, 1.53 - j * 0.05, 0.02);
      ring.rotation.x = Math.PI / 2;
      root.add(ring);
    }
    box(root, m.leather, -0.29, 0.87, 0.03, 0.16, 0.24, 0.13);
    box(root, m.metal, -0.29, 0.87, -0.045, 0.12, 0.18, 0.015);
    arms.forEach(arm => box(arm, m.metal, 0, -0.37, -0.11, 0.19, 0.065, 0.035));
  } else {
    // Asymmetric shoulder mantle, crossed harness and stitched leather panels.
    sphere(arms[0], m.cloth, 0, -0.015, 0.025, 0.18, 0.11, 0.18);
    box(root, m.leather, 0, 1.22, -0.17, 0.055, 0.55, 0.03, -0.5);
    box(root, m.metal, -0.065, 1.32, -0.195, 0.075, 0.06, 0.02, -0.5);
    for (const sign of [-1, 1]) {
      box(root, m.leather, sign * 0.12, 1.14, -0.155, 0.13, 0.27, 0.035);
      for (let j = 0; j < 5; j++) box(root, m.metal, sign * 0.18, 1.05 + j * 0.045, -0.18, 0.018, 0.009, 0.01);
      box(root, m.leather, sign * 0.22, 0.86, -0.02, 0.13, 0.18, 0.13);
    }
    for (let j = 0; j < 3; j++) box(arms[0], m.metal, 0, -0.29 - j * 0.045, -0.09, 0.12, 0.025, 0.025);
    // Short split cape leaves bow and quiver readable.
    for (const sign of [-1, 1]) box(root, m.cloth, sign * 0.13, 1.12, 0.19, 0.25, 0.61, 0.035, sign * 0.09);
  }
  root.name = `${kind} — estudio detallado, geometría procedural`;
}

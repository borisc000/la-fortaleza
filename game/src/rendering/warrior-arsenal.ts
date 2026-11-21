import * as THREE from 'three';
import { WarriorArsenal } from '../domain/classes/warrior-arsenal.ts';
import type { Combat } from '../domain/combat.ts';
import { ELEMENTS } from '../content/elements.ts';

/** Bounded procedural shapes; presentation never deals damage. */
export function createWarriorArsenalView(scene: THREE.Scene) {
  const root = new THREE.Group();
  root.name = 'Arsenal del Guerrero';
  scene.add(root);
  const metal = new THREE.MeshStandardMaterial({ color: 0xaebbbf, metalness: 0.75, roughness: 0.4 });
  const glow = new THREE.MeshBasicMaterial({
    color: 0xefd9a4,
    transparent: true,
    opacity: 0.4,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const wood = new THREE.MeshStandardMaterial({ color: 0x533a28 });
  const ring = new THREE.RingGeometry(0.94, 1, 40),
    blade = new THREE.BoxGeometry(0.12, 0.14, 1.5),
    head = new THREE.BoxGeometry(0.65, 0.4, 0.4),
    pole = new THREE.CylinderGeometry(0.045, 0.045, 2.3, 6),
    flag = new THREE.PlaneGeometry(0.9, 0.65);
  const plateOutline = new THREE.Shape();
  plateOutline.moveTo(-0.17, 0.31);
  plateOutline.lineTo(0.17, 0.31);
  plateOutline.lineTo(0.2, -0.08);
  plateOutline.lineTo(0, -0.35);
  plateOutline.lineTo(-0.2, -0.08);
  plateOutline.closePath();
  const plate = new THREE.ExtrudeGeometry(plateOutline, {
    depth: 0.05,
    bevelEnabled: true,
    bevelSize: 0.035,
    bevelThickness: 0.02,
    bevelSegments: 1,
  });
  const iron = new THREE.MeshStandardMaterial({ color: 0xa7bec7, metalness: 0.52, roughness: 0.4 });
  const inlay = new THREE.BoxGeometry(0.07, 0.39, 0.12);
  // Cut a curved silhouette in the plane of travel, with both tips swept behind the edge.
  const crescent = new THREE.Shape();
  crescent.moveTo(-0.98, -0.34);
  crescent.quadraticCurveTo(0, 1.42, 0.98, -0.34);
  crescent.quadraticCurveTo(0, 0.76, -0.98, -0.34);
  const edge = new THREE.ShapeGeometry(crescent, 16);
  const cheekShape = new THREE.Shape();
  cheekShape.moveTo(-0.09, -0.08);
  cheekShape.quadraticCurveTo(0.21, -0.1, 0.36, -0.34);
  cheekShape.quadraticCurveTo(0.58, 0, 0.4, 0.32);
  cheekShape.quadraticCurveTo(0.18, 0.15, -0.09, 0.13);
  cheekShape.closePath();
  const axeHead = new THREE.ExtrudeGeometry(cheekShape, {
    depth: 0.07,
    bevelEnabled: true,
    bevelThickness: 0.018,
    bevelSize: 0.025,
    bevelSegments: 1,
  });
  const edgeShape = new THREE.Shape();
  edgeShape.moveTo(0.36, -0.34);
  edgeShape.quadraticCurveTo(0.58, 0, 0.4, 0.32);
  edgeShape.quadraticCurveTo(0.42, 0, 0.36, -0.34);
  const axeEdge = new THREE.ExtrudeGeometry(edgeShape, { depth: 0.12, bevelEnabled: false });
  // A short tapered wake behind each blade shows its tangent without drawing another full orbit.
  const wakeShape = new THREE.Shape();
  wakeShape.moveTo(0, 0.09);
  wakeShape.quadraticCurveTo(-0.48, 0.08, -0.96, 0.22);
  wakeShape.quadraticCurveTo(-0.48, -0.05, 0, -0.09);
  wakeShape.closePath();
  const axeWake = new THREE.ShapeGeometry(wakeShape);
  axeWake.rotateX(-Math.PI / 2);
  const steelWake = new THREE.MeshBasicMaterial({
    color: 0x8dd3df,
    transparent: true,
    opacity: 0.7,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const spearPoint = new THREE.OctahedronGeometry(0.25);
  const link = new THREE.TorusGeometry(0.1, 0.036, 5, 10);
  const spectral = new THREE.MeshBasicMaterial({ color: 0x8ee7df });
  const badge = new THREE.OctahedronGeometry(0.2);
  const dust = new THREE.IcosahedronGeometry(0.11, 0);
  const clothMat = new THREE.MeshStandardMaterial({ color: 0x983f30, roughness: 0.94, side: THREE.DoubleSide });
  const trim = new THREE.MeshBasicMaterial({ color: 0xffdda0, side: THREE.DoubleSide });
  const objects = new Map<string, THREE.Group>();
  function make(kind: string) {
    const group = new THREE.Group();
    group.userData.kind = kind;
    if (kind === 'guard' || kind === 'guard-wave') {
      for (let i = 0; i < 7; i++) {
        const shard = new THREE.Mesh(plate, iron);
        shard.add(new THREE.Mesh(inlay, glow));
        group.add(shard);
      }
      if (kind === 'guard-wave') {
        const ripple = new THREE.Mesh(ring, glow);
        ripple.rotation.x = -Math.PI / 2;
        group.add(ripple);
      }
    } else if (kind === 'wave') {
      const front = new THREE.Mesh(edge, trim);
      front.rotation.x = -Math.PI / 2;
      const wake = new THREE.Mesh(edge, glow);
      wake.rotation.x = front.rotation.x;
      wake.position.z = 0.3;
      group.add(front, wake);
    } else if (kind === 'chain') {
      for (let i = 0; i < 20; i++) group.add(new THREE.Mesh(link, i % 2 ? metal : trim));
      const hook = new THREE.Mesh(spearPoint, metal);
      hook.scale.set(0.7, 0.7, 1.5);
      group.add(hook);
      const jaw = new THREE.Mesh(link, trim);
      jaw.scale.set(2.8, 2, 1);
      jaw.rotation.z = 0.5;
      hook.add(jaw);
      // Two jaws close around the hooked target, readable above the low orbiting weapons.
      for (const side of [-1, 1]) {
        const claw = new THREE.Mesh(spearPoint, trim);
        claw.position.set(side * 0.44, 0.15, 0);
        claw.scale.set(0.35, 1.35, 0.32);
        claw.rotation.z = -side * 0.55;
        hook.add(claw);
      }
    } else if (kind === 'spear') {
      const shaft = new THREE.Mesh(pole, spectral);
      shaft.scale.set(1.3, 0.9, 1.3);
      shaft.rotation.x = Math.PI / 2;
      const tip = new THREE.Mesh(spearPoint, trim);
      tip.position.z = -1.02;
      tip.scale.set(1.05, 0.52, 2.1);
      group.add(shaft, tip);
      for (const side of [-1, 1]) {
        const barb = new THREE.Mesh(spearPoint, spectral);
        barb.position.set(side * 0.2, 0, -0.72);
        barb.scale.set(0.31, 0.31, 1.1);
        barb.rotation.y = side * 0.62;
        group.add(barb);
      }
    } else if (kind === 'axe') {
      const weapon = new THREE.Group();
      const haft = new THREE.Mesh(blade, wood);
      haft.scale.set(0.7, 0.8, 0.65);
      const cheek = new THREE.Mesh(axeHead, metal);
      cheek.rotation.x = Math.PI / 2;
      const rim = new THREE.Mesh(axeEdge, trim);
      rim.position.set(0.024, 0, -0.025);
      cheek.add(rim);
      cheek.position.z = -0.32;
      weapon.add(haft, cheek);
      group.add(weapon, new THREE.Mesh(axeWake, steelWake));
    } else if (kind === 'standard-bonus') {
      group.add(new THREE.Mesh(badge, trim));
    } else if (kind === 'banner') {
      const shaft = new THREE.Mesh(pole, wood);
      shaft.position.y = 1.15;
      group.add(shaft);
      const cloth = new THREE.Mesh(flag, clothMat);
      cloth.position.set(0.4, 1.9, 0);
      group.add(cloth);
      const circle = new THREE.Mesh(ring, glow);
      circle.rotation.x = -Math.PI / 2;
      circle.position.y = 0.06;
      group.add(circle);
      const sigil = new THREE.Mesh(badge, trim);
      sigil.scale.set(0.72, 1, 0.2);
      cloth.add(sigil);
    } else if (kind === 'hammer') {
      const circle = new THREE.Mesh(ring, glow);
      circle.rotation.x = -Math.PI / 2;
      group.add(circle);
      const block = new THREE.Mesh(head, metal);
      block.position.y = 0.8;
      block.scale.set(1.85, 1.45, 1.6);
      for (const side of [-1, 1]) {
        const band = new THREE.Mesh(inlay, trim);
        band.scale.set(1.4, 1.15, 3.6);
        band.position.x = side * 0.24;
        block.add(band);
      }
      const haft = new THREE.Mesh(pole, wood);
      haft.scale.y = 0.55;
      haft.position.y = 0.57;
      block.add(haft);
      group.add(block);
      for (let i = 0; i < 7; i++) group.add(new THREE.Mesh(dust, metal));
    } else if (kind === 'spear-hit') {
      for (let j = 0; j < 4; j++) group.add(new THREE.Mesh(spearPoint, trim));
    }
    root.add(group);
    return group;
  }
  return {
    update(combat: Combat) {
      const kit = combat.heroKit;
      glow.color.set(combat.loadout.element ? ELEMENTS[combat.loadout.element].color : 0xefd9a4);
      const active = new Set<string>();
      if (kit instanceof WarriorArsenal)
        for (const item of kit.presentation.slice(0, 64)) {
          active.add(item.id);
          let mesh = objects.get(item.id);
          if (!mesh) {
            mesh = make(item.kind);
            objects.set(item.id, mesh);
          }
          mesh.position.set(item.x, item.kind === 'banner' ? 0 : 0.55, item.z);
          mesh.rotation.y = item.yaw;
          if (item.kind === 'guard' || item.kind === 'guard-wave') {
            const burst = item.kind === 'guard-wave',
              phase = item.phase ?? 0;
            const travel = 1 - (1 - phase) ** 2;
            const gap = item.damageFraction ?? 0;
            const r = burst ? 0.76 + (item.radius - 0.76) * travel : item.radius + (1 - phase) * 0.34 + gap * 0.22;
            for (let i = 0; i < 7; i++) {
              const shard = mesh.children[i],
                angle = (i - 3) * (burst ? 0.56 + travel * 0.32 : 0.56 + gap * 0.07);
              shard.position.set(
                Math.sin(angle) * r,
                0.68 + (burst ? 0.38 * Math.sin(phase * Math.PI) - phase * 0.4 : (1 - phase) * 0.35),
                -Math.cos(angle) * r,
              );
              shard.rotation.set(burst ? -phase * 1.6 : -0.12, -angle, (i % 2 ? 1 : -1) * gap * 0.28);
              shard.scale.setScalar(burst ? 1 - phase : 0.8 + phase * 0.2);
              if (!burst) shard.scale.x *= 1 - gap * (i % 2 ? 0.9 : 0.48);
            }
            if (burst) {
              mesh.children[7].position.y = -0.42;
              mesh.children[7].scale.setScalar(r);
            }
          } else if (item.kind === 'spear-hit') {
            mesh.position.y = 1.22;
            const t = item.phase ?? 0;
            mesh.children.forEach((spike, j) => {
              const angle = (j * Math.PI) / 2 + Math.PI / 4,
                r = 0.42 + t * 0.36;
              spike.position.set(Math.cos(angle) * r, Math.sin(angle) * r, 0);
              spike.scale.set(0.27 * (1 - t), 0.85 * (1 - t), 0.32 * (1 - t));
              spike.rotation.z = angle - Math.PI / 2;
            });
          } else if (item.kind === 'chain') {
            const length = item.radius * 2;
            const n = Math.max(3, Math.min(20, Math.ceil(length / 0.22)));
            const phase = item.phase ?? 0;
            for (let i = 0; i < 20; i++) {
              const l = mesh.children[i];
              l.visible = i < n;
              if (!l.visible) continue;
              const t = i / (n - 1);
              l.position.set(
                0.43 * (1 - t) + Math.sin(t * Math.PI) * (0.16 + Math.abs(phase - 0.48) * 0.8),
                0.73 - Math.sin(t * Math.PI) * Math.abs(phase - 0.48) * 0.52,
                item.radius - t * length,
              );
              l.rotation.set(Math.PI / 2, i % 2 ? 0.95 : 0, 0);
              l.scale.set(0.78, Math.max(1, length / n / 0.16), 1);
            }
            const hook = mesh.children[20];
            hook.position.set(0, 0.75, -item.radius);
            for (let j = 1; j <= 2; j++) {
              const side = j === 1 ? -1 : 1;
              hook.children[j].position.x = side * (0.43 + 0.32 * (1 - Math.min(1, phase * 4)));
            }
          } else if (item.kind === 'wave') {
            const returning = item.phase === -1;
            mesh.rotation.z = returning ? -0.48 : 0.28;
            mesh.position.y = returning ? 0.62 : 0.88;
            // The returning crescent travels below the sword and carries a cool steel edge.
            (mesh.children[0] as THREE.Mesh).material = returning ? spectral : trim;
          } else if (item.kind === 'spear') {
            mesh.position.y = 1.18;
            mesh.children[1].rotation.z = combat.time * 7;
          } else if (item.kind === 'axe') {
            mesh.position.y = 0.98;
            mesh.children[0].rotation.set(0.62, combat.time * 9, 0.24);
          } else if (item.kind === 'standard-bonus') {
            mesh.position.y = 1.98 + Math.sin(combat.time * 4) * 0.06;
            mesh.scale.set(0.8, 0.86, 0.8);
            mesh.rotation.y = combat.time * 2;
          } else if (item.kind === 'banner') {
            const age = item.phase ?? 0;
            mesh.position.y = Math.max(0, 1 - age / 0.21) ** 2 * 0.75;
            const unfurl = Math.min(1, 0.08 + age / 0.36);
            const cloth = mesh.children[1];
            cloth.scale.x = unfurl;
            cloth.position.x = unfurl * 0.42;
            cloth.rotation.y = Math.sin(age * 6) * 0.3;
            mesh.children[2].scale.setScalar(item.radius);
          } else if (item.kind === 'hammer') {
            const age = item.phase ?? 0;
            const recoil = THREE.MathUtils.clamp(age / 0.38, 0, 1);
            mesh.position.y = 0.07;
            mesh.children[0].scale.setScalar(item.radius * (0.18 + 0.82 * (1 - (1 - recoil) ** 3)));
            mesh.children[0].visible = recoil < 1;
            const mallet = mesh.children[1];
            mallet.position.y =
              age < 0 ? 0.28 + 2.9 * Math.min(1, -age / 0.12) : 0.28 + Math.sin(recoil * Math.PI) * 0.75;
            mallet.rotation.z = -0.54 + recoil * 0.3;
            mallet.rotation.x = -0.68 + Math.sin(recoil * Math.PI) * 0.85;
            for (let i = 0; i < 7; i++) {
              const chip = mesh.children[2 + i],
                angle = i * 2.4;
              chip.position.set(
                Math.sin(angle) * recoil * item.radius,
                0.12 + Math.sin(recoil * Math.PI) * 0.5,
                Math.cos(angle) * recoil * item.radius,
              );
              chip.scale.setScalar(age < 0 ? 0 : 1.65 * (1 - recoil));
            }
          }
        }
      for (const [id, mesh] of objects)
        if (!active.has(id)) {
          root.remove(mesh);
          objects.delete(id);
        }
    },
    reset() {
      root.clear();
      objects.clear();
    },
    dispose() {
      this.reset();
      scene.remove(root);
      axeWake.dispose();
      steelWake.dispose();
      for (const g of [
        ring,
        blade,
        head,
        pole,
        flag,
        plate,
        inlay,
        edge,
        axeHead,
        axeEdge,
        spearPoint,
        link,
        badge,
        dust,
      ])
        g.dispose();
      for (const m of [metal, glow, wood, iron, clothMat, trim, spectral]) m.dispose();
    },
  };
}

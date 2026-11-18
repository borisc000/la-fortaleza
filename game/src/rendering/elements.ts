import * as THREE from 'three';
import { ELEMENTS } from '../content/elements.ts';
import type { Combat, CombatEvent } from '../domain/combat.ts';

export function createElementView(scene: THREE.Scene) {
  const root = new THREE.Group();
  scene.add(root);
  const ring = new THREE.RingGeometry(0.88, 1, 40),
    shard = new THREE.OctahedronGeometry(1);
  const fire = new THREE.MeshBasicMaterial({
    color: ELEMENTS.fire.color,
    transparent: true,
    opacity: 0.8,
    depthWrite: false,
  });
  const water = new THREE.MeshBasicMaterial({
    color: ELEMENTS.water.color,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const earth = new THREE.MeshBasicMaterial({
    color: ELEMENTS.earth.color,
    transparent: true,
    opacity: 0.75,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const air = new THREE.MeshBasicMaterial({
    color: ELEMENTS.air.color,
    transparent: true,
    opacity: 0.6,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const stoneRing = new THREE.RingGeometry(0.72, 1, 6),
    windArc = new THREE.RingGeometry(0.94, 1, 32, 1, 0, Math.PI * 1.45);
  const stoneGeometry = new THREE.DodecahedronGeometry(0.13);
  const shield = new THREE.Group();
  shield.name = 'Protección pétrea';
  root.add(shield);
  shield.visible = false;
  for (let i = 0; i < 6; i++) {
    const piece = new THREE.Mesh(stoneGeometry, earth);
    const a = (i * Math.PI) / 3;
    piece.position.set(Math.sin(a) * 0.56, 0.65 + (i % 2) * 0.2, Math.cos(a) * 0.56);
    shield.add(piece);
  }
  const vortex = new THREE.Group();
  root.add(vortex);
  vortex.visible = false;
  for (let i = 0; i < 3; i++) {
    const arc = new THREE.Mesh(windArc, air);
    arc.rotation.x = -Math.PI / 2;
    arc.position.y = 0.2 + i * 0.3;
    vortex.add(arc);
  }
  const auraMaterial = water.clone();
  auraMaterial.opacity = 0.35;
  const aura = new THREE.Mesh(ring, auraMaterial);
  aura.rotation.x = -Math.PI / 2;
  root.add(aura);
  const crown = new THREE.Group();
  root.add(crown);
  for (let i = 0; i < 3; i++) {
    const mesh = new THREE.Mesh(shard, auraMaterial);
    mesh.scale.set(0.07, 0.18, 0.07);
    crown.add(mesh);
  }
  const secondaryMaterial = auraMaterial.clone();
  secondaryMaterial.opacity = 0.35;
  const secondaryAura = new THREE.Mesh(ring, secondaryMaterial);
  secondaryAura.name = 'Afinidad de apoyo';
  secondaryAura.rotation.x = -Math.PI / 2;
  secondaryAura.visible = false;
  root.add(secondaryAura);
  const statuses = new Map<number, THREE.Group>();
  const bursts: Array<{
    mesh: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>;
    age: number;
    radius: number;
    wind: boolean;
  }> = [];
  return {
    events(events: readonly CombatEvent[]) {
      for (const event of events)
        if (
          event.type === 'splash' ||
          event.type === 'explosion' ||
          event.type === 'quake' ||
          event.type === 'gust' ||
          event.type === 'ability-pulse'
        ) {
          if (bursts.length >= 24) {
            const old = bursts.shift()!;
            root.remove(old.mesh);
            old.mesh.material.dispose();
          }
          const material = (
            event.type === 'explosion' ? fire : event.type === 'quake' ? earth : event.type === 'gust' ? air : water
          ).clone();
          if (event.type === 'ability-pulse') material.color.set('#d8c99b');
          material.side = THREE.DoubleSide;
          const mesh = new THREE.Mesh(
            event.type === 'quake' ? stoneRing : event.type === 'gust' ? windArc : ring,
            material,
          );
          mesh.rotation.x = -Math.PI / 2;
          mesh.position.set(event.x, 0.18, event.z);
          mesh.scale.setScalar(0.1);
          root.add(mesh);
          bursts.push({ mesh, age: 0, radius: event.amount, wind: event.type === 'gust' });
        }
    },
    update(combat: Combat, hero: THREE.Vector3, alpha: number, dt: number) {
      shield.visible = !!combat.heroKit.state.barrier;
      shield.position.copy(hero);
      shield.rotation.y = combat.time * 0.7;
      vortex.visible = combat.definition.id === 'warrior' && combat.whirlwind?.loadout.element === 'air';
      vortex.position.copy(hero);
      vortex.rotation.y = -combat.time * 5;
      if (vortex.visible)
        vortex.children.forEach((arc, i) => arc.scale.setScalar(combat.whirlwind!.radius * (1 - i * 0.12)));
      secondaryAura.visible = !!combat.loadout.secondary;
      if (combat.loadout.secondary) {
        secondaryMaterial.color.set(ELEMENTS[combat.loadout.secondary.element].color);
        secondaryAura.position.copy(hero).y = 0.055;
        secondaryAura.scale.setScalar(1.02);
      }
      aura.visible = !!combat.loadout.element;
      crown.visible = aura.visible && combat.loadout.mastery;
      if (combat.loadout.element) {
        auraMaterial.color.set(ELEMENTS[combat.loadout.element].color);
        auraMaterial.opacity = combat.loadout.mastery ? 0.65 : 0.25;
        aura.position.copy(hero).y = 0.05;
        aura.scale.setScalar(combat.loadout.mastery ? 0.8 : 0.55);
        crown.position.copy(hero);
        crown.children.forEach((mesh, i) => {
          const angle = combat.time * 1.5 + (i * Math.PI * 2) / 3;
          mesh.position.set(Math.sin(angle) * 0.65, 0.45, Math.cos(angle) * 0.65);
          mesh.rotation.y = angle;
        });
      }
      const active = new Set<number>();
      for (const enemy of combat.enemies) {
        if (enemy.dead || (!enemy.burn && enemy.wetRemaining <= 0 && !(enemy.brokenRemaining! > 0))) continue;
        active.add(enemy.id);
        let status = statuses.get(enemy.id);
        if (!status) {
          status = new THREE.Group();
          const wet = new THREE.Mesh(ring, water);
          wet.rotation.x = -Math.PI / 2;
          wet.scale.setScalar(0.48);
          wet.position.y = 0.06;
          status.add(wet);
          for (let i = 0; i < 3; i++) {
            const flame = new THREE.Mesh(shard, fire);
            flame.scale.set(0.07, 0.18, 0.07);
            status.add(flame);
          }
          const broken = new THREE.Mesh(stoneRing, earth);
          broken.name = 'Quebranto';
          broken.rotation.x = -Math.PI / 2;
          broken.scale.setScalar(0.5);
          broken.position.y = 0.08;
          status.add(broken);
          statuses.set(enemy.id, status);
          root.add(status);
        }
        status.position.set(
          THREE.MathUtils.lerp(enemy.previous.x, enemy.x, alpha),
          0,
          THREE.MathUtils.lerp(enemy.previous.z, enemy.z, alpha),
        );
        status.children[0].visible = enemy.wetRemaining > 0;
        status.children.slice(1, 4).forEach((flame, i) => {
          flame.visible = !!enemy.burn;
          const phase = (combat.time * 1.4 + i / 3) % 1;
          flame.position.set(Math.sin(i * 2.1) * 0.24, 0.65 + phase * 1.25, Math.cos(i * 2.1) * 0.24);
          flame.scale.y = 0.12 + 0.12 * (1 - phase);
        });
        status.children[4].visible = (enemy.brokenRemaining ?? 0) > 0;
      }
      for (const [id, status] of statuses)
        if (!active.has(id)) {
          root.remove(status);
          statuses.delete(id);
        }
      for (let i = bursts.length - 1; i >= 0; i--) {
        const burst = bursts[i];
        burst.age += dt;
        burst.mesh.scale.setScalar(burst.radius * Math.min(1, 0.2 + burst.age / 0.45));
        burst.mesh.material.opacity = Math.max(0, 0.7 * (1 - burst.age / 0.6));
        if (burst.wind) {
          burst.mesh.rotation.z = burst.age * 7;
          burst.mesh.position.y = 0.18 + burst.age * 0.5;
        }
        if (burst.age >= 0.6) {
          root.remove(burst.mesh);
          burst.mesh.material.dispose();
          bursts.splice(i, 1);
        }
      }
    },
    reset() {
      for (const s of statuses.values()) root.remove(s);
      statuses.clear();
      for (const b of bursts) {
        root.remove(b.mesh);
        b.mesh.material.dispose();
      }
      bursts.length = 0;
      aura.visible = false;
      secondaryAura.visible = false;
      crown.visible = false;
      shield.visible = false;
      vortex.visible = false;
    },
    dispose() {
      this.reset();
      scene.remove(root);
      ring.dispose();
      shard.dispose();
      fire.dispose();
      water.dispose();
      auraMaterial.dispose();
      secondaryMaterial.dispose();
      earth.dispose();
      air.dispose();
      stoneRing.dispose();
      windArc.dispose();
      stoneGeometry.dispose();
    },
  };
}

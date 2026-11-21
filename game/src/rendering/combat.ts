import { damageLabels, damageScale, damageTone, DAMAGE_TONES } from './damage-labels.ts';
import type { DamageTone } from './damage-labels.ts';
import { createBasicImpact } from './basic-impact.ts';
import { createHordeView } from './horde.ts';
import * as THREE from 'three';
import { WHIRLWIND, IMPETUS } from '../content/combat.ts';
import { WARRIOR } from '../content/classes/warrior.ts';
import type { ClassDefinition } from '../content/class-definition.ts';
import type { Combat, CombatEvent, Enemy } from '../domain/combat.ts';
import { ELEMENTS } from '../content/elements.ts';
import { ENEMIES, actionStats, isGroundAttack } from '../content/enemies.ts';
import type { EnemyKind } from '../content/enemies.ts';
import { createCastellanWarning } from './castellan-warning.ts';
import { type ArticulatedEnemy, buildEnemyParts, type EnemyPartCache } from './enemy-model.ts';

const UNIT_BOX = new THREE.BoxGeometry(1, 1, 1);

const ENEMY_PALETTES = {
  soldier: { bone: 0xbdb49d, iron: 0x64685d, cloth: 0x666146, dark: 0x383331 },
  archer: { bone: 0xc6beaa, iron: 0x606b70, cloth: 0x405765, dark: 0x4e3e33 },
  charger: { bone: 0xa99a7a, iron: 0x644b46, cloth: 0x77382c, dark: 0x372c27 },
  hunter: { bone: 0xc7a89a, iron: 0x694958, cloth: 0x893758, dark: 0x3a2938 },
  elite: { bone: 0xb8aa8a, iron: 0x696055, cloth: 0x7b5d39, dark: 0x41362c },
  boss: { bone: 0xc2b4ab, iron: 0x64586a, cloth: 0x64475d, dark: 0x322937 },
};
const CROSSBOW_SUPPORT = new THREE.Quaternion().setFromUnitVectors(
  new THREE.Vector3(-0.04, -0.55, -0.105).normalize(),
  new THREE.Vector3(0.38, -0.135, -0.41).normalize(),
);

/** Reuse the merged geometry within a fight. Each actor owns its hit and spawn materials. */
function skeleton(cache: EnemyPartCache, kind: Exclude<EnemyKind, 'thrall'>) {
  const stats = ENEMIES[kind];
  const model = kind === 'hunter' ? 'charger' : kind;
  let parts = cache.get(model);
  if (!parts) {
    parts = buildEnemyParts(model);
    cache.set(model, parts);
  }
  const root = new THREE.Group(),
    body = new THREE.Group();
  root.name = stats.name;
  body.name = 'Cuerpo';
  root.add(body);
  const tint = ENEMY_PALETTES[kind];
  const bone = new THREE.MeshStandardMaterial({ color: tint.bone, vertexColors: true, roughness: 0.87 });
  const iron = new THREE.MeshStandardMaterial({
    color: tint.iron,
    vertexColors: true,
    roughness: 0.69,
    metalness: 0.33,
  });
  const cloth = new THREE.MeshStandardMaterial({ color: tint.cloth, vertexColors: true, roughness: 0.96 });
  const dark = new THREE.MeshStandardMaterial({ color: tint.dark, vertexColors: true, roughness: 0.89 });
  const glow = new THREE.MeshBasicMaterial({
    color: kind === 'boss' ? 0xd3a9fb : kind === 'hunter' ? 0xff789d : 0xffc76b,
    vertexColors: true,
  });
  const materials = [bone, iron, cloth, dark];
  const lookup = { bone, iron, cloth, dark, glow };
  const legs: THREE.Group[] = [],
    arms: THREE.Group[] = [];
  for (const sign of [-1, 1]) {
    const leg = new THREE.Group();
    leg.position.set(sign * (model === 'charger' ? 0.148 : 0.13), 0.88, 0);
    body.add(leg);
    legs.push(leg);
    const arm = new THREE.Group();
    arm.position.set(sign * 0.25, 1.37, -0.03);
    body.add(arm);
    arms.push(arm);
  }
  const slots = { body, leg0: legs[0], leg1: legs[1], arm0: arms[0], arm1: arms[1] };
  for (const { slot, material, geometry } of parts) {
    const m = new THREE.Mesh(geometry, lookup[material]);
    m.castShadow = material !== 'glow';
    m.receiveShadow = material !== 'glow';
    slots[slot].add(m);
  }
  const mesh = (
    parent: THREE.Group,
    geometry: THREE.BufferGeometry,
    mat: THREE.Material,
    x: number,
    y: number,
    z: number,
    sx: number,
    sy: number,
    sz: number,
  ) => {
    const m = new THREE.Mesh(geometry, mat);
    m.position.set(x, y, z);
    m.scale.set(sx, sy, sz);
    parent.add(m);
    return m;
  };
  body.scale.setScalar(stats.scale);
  const warningMat = new THREE.MeshBasicMaterial({
    color: 0xc68032,
    transparent: true,
    opacity: 0.35,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const warning = new THREE.Mesh(
    new THREE.RingGeometry(0.18, stats.range + 0.4, 32, 1, Math.PI / 2 - stats.arc / 2, stats.arc),
    warningMat,
  );
  warning.rotation.x = -Math.PI / 2;
  warning.position.y = 0.04;
  root.add(warning);
  const circle = new THREE.Mesh(new THREE.RingGeometry(0.02, 1, 48), warningMat);
  circle.rotation.x = -Math.PI / 2;
  circle.position.y = 0.045;
  root.add(circle);
  const lane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), warningMat);
  lane.rotation.x = -Math.PI / 2;
  lane.position.y = 0.05;
  root.add(lane);
  const fan = new THREE.Mesh(new THREE.RingGeometry(0.2, 15, 32, 1, Math.PI / 2 - 0.45, 0.9), warningMat);
  fan.rotation.x = -Math.PI / 2;
  fan.position.y = 0.04;
  root.add(fan);
  const groundWarning = kind === 'boss' ? createCastellanWarning(root) : undefined;
  const spawnMaterial = new THREE.MeshBasicMaterial({
    color: 0xcbd4b3,
    transparent: true,
    opacity: 0.65,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  for (const signal of [warning, circle, lane, fan]) signal.renderOrder = 12;
  const spawnRing = new THREE.Mesh(new THREE.RingGeometry(0.48, 0.57, 32), spawnMaterial);
  spawnRing.rotation.x = -Math.PI / 2;
  spawnRing.position.y = 0.05;
  root.add(spawnRing);
  const bar = new THREE.Group();
  bar.position.y = 2.04 * stats.scale;
  root.add(bar);
  const backMaterial = new THREE.MeshBasicMaterial({ color: 0x1a211c, depthTest: false });
  const hpMaterial = new THREE.MeshBasicMaterial({ color: 0xb9a578, depthTest: false });
  mesh(bar, UNIT_BOX, backMaterial, 0, 0, 0, 0.67, 0.065, 0.01);
  const hp = mesh(bar, UNIT_BOX, hpMaterial, 0, 0, 0.01, 0.63, 0.035, 0.01);
  let stride = 0;
  return {
    root,
    update(enemy: Enemy, dt: number, flash: number, selected: boolean, camera: THREE.Camera) {
      stride += Math.min(enemy.speed, 3) * dt * 3;
      const swing = Math.sin(stride) * Math.min(1, enemy.speed / 1.5);
      const attack = enemy.attack,
        data = actionStats(kind, attack?.action);
      legs[0].rotation.x = swing * 0.5;
      legs[1].rotation.x = -swing * 0.5;
      arms[0].rotation.set(-0.17 - swing * 0.2, 0, 0);
      arms[1].rotation.set(swing * 0.16, 0, 0);
      if (kind === 'archer') {
        arms[0].position.x = -0.25;
        arms[1].position.x = 0.25;
      }
      body.rotation.z = enemy.dead ? Math.PI / 2 : 0;
      body.position.y = enemy.dead ? 0.08 : 0;
      body.rotation.x = enemy.dead ? 0 : 0.1;
      if (attack && !enemy.dead) {
        const a = attack.age;
        const progress = THREE.MathUtils.clamp((a - data.windup) / data.active, 0, 1);
        if (attack.action === 'shot') {
          const aim =
            THREE.MathUtils.smoothstep(a, 0, 0.24) * (1 - THREE.MathUtils.smoothstep(a, data.windup, data.duration));
          // Tuck the shoulders toward the stock so the left hand supports the receiver.
          arms[0].position.x += 0.025 * aim;
          arms[1].position.x -= 0.08 * aim;
          arms[1].rotation.x = THREE.MathUtils.lerp(swing * 0.16, 1.2, aim);
          arms[0].quaternion.slerp(CROSSBOW_SUPPORT, aim);
        } else if (attack.action === 'volley') {
          arms[1].rotation.x = 0.68;
          arms[0].rotation.x = 1.48;
        } else if (attack.action === 'charge') {
          body.rotation.x = THREE.MathUtils.lerp(-0.12, -0.32, progress);
          arms[0].rotation.x = 0.88;
          arms[1].rotation.x = 0.66;
        } else if (attack.action === 'slam') {
          arms[1].rotation.x = a < data.windup ? -2.7 : 0.5;
          arms[0].rotation.x = arms[1].rotation.x;
        } else if (isGroundAttack(attack.action)) {
          const lift = THREE.MathUtils.smoothstep(a, 0, 0.35);
          arms[0].rotation.set(-2.3 * lift + 1.9 * progress, 0, -0.32 * lift);
          arms[1].rotation.set(arms[0].rotation.x, 0, -arms[0].rotation.z);
        } else {
          arms[1].rotation.x = a < data.windup ? -2.1 * Math.min(1, a / 0.25) : -2.1 + progress * 2.4;
          arms[0].rotation.x = -0.5;
        }
      }
      root.visible = !enemy.dead || enemy.deathAge < 1.6;
      spawnRing.visible = enemy.spawnRemaining > 0;
      spawnRing.scale.setScalar(1 + enemy.spawnRemaining * 0.5);
      const preparing = !!attack && attack.age < data.windup;
      const showing = !enemy.dead && !!attack && attack.age < data.windup + data.active;
      warning.visible = showing && (!attack?.action || attack.action === 'melee');
      circle.visible = showing && attack?.action === 'slam';
      circle.scale.setScalar(data.range + 0.4);
      lane.visible = !enemy.dead && preparing && (attack?.action === 'shot' || attack?.action === 'charge');
      const length = data.range;
      lane.scale.set(attack?.action === 'charge' ? 2 * (enemy.radius + 0.4) : 0.12, length, 1);
      lane.position.z = -length / 2;
      fan.visible = !enemy.dead && preparing && attack?.action === 'volley';
      groundWarning?.update(enemy.dead ? undefined : attack);
      warningMat.color.set(
        !preparing ? 0xbd4435 : attack?.action === 'shot' || attack?.action === 'volley' ? 0x80c7dc : 0xc68032,
      );
      warningMat.opacity = preparing ? 0.2 + (0.3 * attack!.age) / data.windup : 0.45;
      bar.visible =
        !enemy.dead &&
        (selected ||
          enemy.hp < enemy.maxHp ||
          !!enemy.attack ||
          kind === 'hunter' ||
          kind === 'elite' ||
          kind === 'boss');
      bar.quaternion.copy(root.quaternion).invert().multiply(camera.quaternion);
      const fraction = enemy.hp / enemy.maxHp;
      hp.scale.x = 0.63 * fraction;
      hp.position.x = -0.315 * (1 - fraction);
      hpMaterial.color.set(selected ? 0xe0c785 : 0x9b6d55);
      glow.transparent = enemy.spawnRemaining > 0;
      glow.opacity = enemy.spawnRemaining > 0 ? 0.3 : 1;
      for (const material of materials) {
        material.transparent = enemy.spawnRemaining > 0;
        material.opacity = enemy.spawnRemaining > 0 ? 0.3 : 1;
        material.emissive.set(flash > 0 ? 0xa54c28 : enemy.burn ? 0xd95b16 : 0x206c8a);
        material.emissiveIntensity = flash > 0 ? flash * 2 : enemy.burn || enemy.wetRemaining > 0 ? 0.35 : 0;
      }
    },
    dispose() {
      groundWarning?.dispose();
      [...materials, glow, warningMat, spawnMaterial, backMaterial, hpMaterial].forEach(m => m.dispose());
      [warning, circle, lane, fan, spawnRing].forEach(m => m.geometry.dispose());
    },
  };
}

/** Isolated inspection of the same enemy geometry used in combat, without HUD or warnings. */
export function createEnemyModelPreview(kind: ArticulatedEnemy) {
  const cache: EnemyPartCache = new Map();
  const view = skeleton(cache, kind);
  for (const child of view.root.children.slice(1)) child.visible = false;
  return {
    root: view.root,
    dispose() {
      view.dispose();
      for (const { geometry } of cache.get(kind)!) geometry.dispose();
    },
  };
}

export function createCombatView(scene: THREE.Scene, definition: ClassDefinition = WARRIOR, showEnemies = true) {
  const root = new THREE.Group();
  scene.add(root);
  const horde = createHordeView(root);
  const basicImpact = createBasicImpact(definition.id);
  root.add(basicImpact.mesh);
  const partCache: EnemyPartCache = new Map();
  const enemies = new Map<number, ReturnType<typeof skeleton>>();
  const flashes = new Map<number, number>();
  const numbers: Array<{ sprite: THREE.Sprite; age: number; size: number; drift: number }> = [];
  const numberMaps = new Map<string, THREE.CanvasTexture>();
  const slashMaterial = new THREE.MeshBasicMaterial({
    color: 0xe7d7af,
    transparent: true,
    opacity: 0.4,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  let slashArc = definition.basic.arc;
  const slash = new THREE.Mesh(
    new THREE.RingGeometry(
      1.25,
      definition.basic.range,
      24,
      1,
      Math.PI / 2 - definition.basic.arc / 2,
      definition.basic.arc,
    ),
    slashMaterial,
  );
  slash.rotation.x = -Math.PI / 2;
  slash.visible = false;
  const slashRoot = new THREE.Group();
  const bladeLight = new THREE.MeshBasicMaterial({ color: 0xfff0d1, transparent: true, depthWrite: false });
  const bladeTrace = new THREE.Mesh(new THREE.OctahedronGeometry(1), bladeLight);
  bladeTrace.visible = false;
  slashRoot.add(slash, bladeTrace);
  root.add(slashRoot);
  const spinRoot = new THREE.Group();
  root.add(spinRoot);
  spinRoot.visible = false;
  const spinMaterial = new THREE.MeshBasicMaterial({
    color: 0xdad6c1,
    transparent: true,
    opacity: 0.36,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const pulseMaterial = spinMaterial.clone();
  pulseMaterial.opacity = 0.22;
  const spinGeometry = new THREE.RingGeometry(WHIRLWIND.radius * 0.9, WHIRLWIND.radius, 28, 1, 0, Math.PI * 0.72);
  // Thin the trailing edge while keeping the leading edge at the real hit radius.
  const vertices = spinGeometry.attributes.position;
  for (let i = 0; i < 29; i++) {
    const width = 0.012 + 0.088 * (i / 28) ** 2;
    vertices.setXY(i, vertices.getX(i + 29) * (1 - width), vertices.getY(i + 29) * (1 - width));
  }
  for (let i = 0; i < 2; i++) {
    const arc = new THREE.Mesh(spinGeometry, spinMaterial);
    arc.rotation.x = -Math.PI / 2;
    arc.rotation.z = i * Math.PI;
    arc.position.y = 0.75 + i * 0.12;
    spinRoot.add(arc);
  }
  const pulseGeometry = new THREE.RingGeometry(WHIRLWIND.radius - 0.06, WHIRLWIND.radius, 64);
  const pulse = new THREE.Mesh(pulseGeometry, pulseMaterial);
  pulse.rotation.x = -Math.PI / 2;
  pulse.position.y = 0.06;
  spinRoot.add(pulse);
  let damageFlash = 0;
  function numberMap(amount: number, tone: DamageTone) {
    const display = amount > 0 && amount < 1 ? Math.max(0.1, Math.round(amount * 10) / 10) : Math.round(amount);
    const key = `${display}:${tone}`;
    const cached = numberMaps.get(key);
    if (cached) return cached;
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 64;
    const context = canvas.getContext('2d');
    if (context) {
      context.font = 'bold 42px "Palatino Linotype", Georgia, serif';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.lineWidth = 7;
      context.lineJoin = 'round';
      context.strokeStyle = '#0f1512';
      context.strokeText(String(display), 64, 32);
      context.fillStyle = DAMAGE_TONES[tone];
      context.fillText(String(display), 64, 32);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    numberMaps.set(key, texture);
    return texture;
  }
  function clearNumbers() {
    for (const item of numbers) {
      root.remove(item.sprite);
      item.sprite.material.dispose();
    }
    numbers.length = 0;
  }
  return {
    events(events: CombatEvent[], time: number) {
      for (const event of events)
        if (event.type === 'hit') {
          basicImpact.hit(event, time);
          flashes.set(event.target, 0.16);
          if (event.target === 0) damageFlash = 0.28;
        }
      for (const event of damageLabels(events)) {
        if (numbers.length >= 24) {
          const old = numbers.shift()!;
          root.remove(old.sprite);
          old.sprite.material.dispose();
        }
        const sprite = new THREE.Sprite(
          new THREE.SpriteMaterial({
            map: numberMap(event.amount, damageTone(event)),
            transparent: true,
            depthTest: false,
          }),
        );
        // Deterministic spread so simultaneous labels on a pack do not stack on one spot.
        const drift = (((event.id * 37) % 11) - 5) / 5,
          size = (event.target === 0 ? 1.25 : 1) * damageScale(event.amount);
        sprite.position.set(event.x + drift * 0.25, 2, event.z);
        sprite.scale.set(0, 0, 1);
        sprite.renderOrder = 20;
        root.add(sprite);
        numbers.push({ sprite, age: 0, size, drift });
      }
    },
    update(combat: Combat, hero: THREE.Vector3, camera: THREE.Camera, alpha: number, dt: number) {
      basicImpact.update(camera, combat.time);
      if (showEnemies) horde.update(combat.enemies, alpha, combat.time);
      const existing = new Set(combat.enemies.map(e => e.id));
      for (const [id, view] of enemies)
        if (!existing.has(id)) {
          root.remove(view.root);
          view.dispose();
          enemies.delete(id);
        }
      for (const [id, time] of flashes) {
        if (time <= dt) flashes.delete(id);
        else flashes.set(id, time - dt);
      }
      damageFlash = Math.max(0, damageFlash - dt);
      for (const enemy of showEnemies ? combat.enemies : []) {
        if (enemy.kind === 'thrall') continue;
        let view = enemies.get(enemy.id);
        if (!view) {
          view = skeleton(partCache, enemy.kind);
          enemies.set(enemy.id, view);
          root.add(view.root);
        }
        view.root.position.set(
          THREE.MathUtils.lerp(enemy.previous.x, enemy.x, alpha),
          0,
          THREE.MathUtils.lerp(enemy.previous.z, enemy.z, alpha),
        );
        view.root.rotation.y = enemy.attack?.yaw ?? enemy.yaw;
        view.update(enemy, dt, (flashes.get(enemy.id) ?? 0) / 0.16, combat.targetId === enemy.id, camera);
      }
      for (let i = numbers.length - 1; i >= 0; i--) {
        const item = numbers[i];
        item.age += dt;
        // Pop in, settle, then rise while fading.
        const pop =
          item.age < 0.08 ? 0.5 + (item.age / 0.08) * 0.8 : item.age < 0.18 ? 1.3 - ((item.age - 0.08) / 0.1) * 0.3 : 1;
        item.sprite.scale.set(item.size * pop, item.size * pop * 0.5, 1);
        item.sprite.position.y += dt * Math.max(0.2, 1.5 - item.age * 1.4);
        item.sprite.position.x += item.drift * dt * 0.3;
        item.sprite.material.opacity = Math.max(0, Math.min(1, (0.9 - item.age) / 0.35));
        if (item.age >= 0.9) {
          root.remove(item.sprite);
          item.sprite.material.dispose();
          numbers.splice(i, 1);
        }
      }
      slash.visible =
        definition.id === 'warrior' &&
        !!combat.attack &&
        combat.attack.age >= definition.basic.windup &&
        combat.attack.age < definition.basic.windup + definition.basic.active;
      const currentArc = combat.attack?.arc ?? definition.basic.arc;
      if (slash.visible && currentArc !== slashArc) {
        slash.geometry.dispose();
        slash.geometry = new THREE.RingGeometry(
          1.25,
          definition.basic.range,
          24,
          1,
          Math.PI / 2 - currentArc / 2,
          currentArc,
        );
        slashArc = currentArc;
      }
      slash.scale.setScalar((combat.attack?.range ?? definition.basic.range) / definition.basic.range);
      slashRoot.position.copy(hero).y = combat.whirlwind ? 1.28 : 0.8;
      slashRoot.rotation.y = combat.attack?.yaw ?? 0;
      const slashElement = combat.attack?.loadout?.element;
      slashMaterial.color.set(
        slashElement ? ELEMENTS[slashElement].color : (combat.attack?.multiplier ?? 1) > 1 ? 0xf4d68c : 0xe7d7af,
      );
      bladeTrace.visible = slash.visible && !!combat.attack?.swordStroke;
      if (combat.attack?.swordStroke && slash.visible) {
        const progress = THREE.MathUtils.clamp(
          (combat.attack.age - definition.basic.windup) / definition.basic.active,
          0,
          1,
        );
        const indices = slash.geometry.index!.count;
        const count = Math.max(6, Math.ceil((indices * progress) / 6) * 6);
        slash.geometry.setDrawRange(combat.attack.swordStroke === 'backhand' ? indices - count : 0, count);
        const thrust = combat.attack.swordStroke === 'thrust';
        const sweep = combat.attack.swordStroke === 'backhand' ? 1 - progress : progress;
        const angle = thrust ? 0 : currentArc * (sweep - 0.5);
        const reach = combat.attack.range ?? definition.basic.range;
        const tip = thrust ? reach * (0.5 + 0.5 * Math.sin((progress * Math.PI) / 2)) : reach;
        const length = thrust ? tip * 0.72 : 0.65;
        bladeTrace.rotation.y = angle;
        bladeTrace.position.set(-Math.sin(angle) * (tip - length / 2), 0.13, -Math.cos(angle) * (tip - length / 2));
        bladeTrace.scale.set(thrust ? 0.16 : 0.11, 0.055, length / 2);
        bladeLight.opacity = 0.94 - 0.42 * progress;
        if (thrust) slash.visible = false;
      } else slash.geometry.setDrawRange(0, Infinity);
      slashMaterial.opacity = 0.4 + (combat.impetusStacks / IMPETUS.maxStacks) * 0.18;
      spinRoot.visible = definition.id === 'warrior' && !!combat.whirlwind;
      if (definition.id === 'warrior' && combat.whirlwind) {
        const phase = combat.whirlwind.age / WHIRLWIND.interval;
        spinRoot.scale.setScalar(combat.whirlwind.radius / WHIRLWIND.radius);
        const affinity = combat.whirlwind.loadout.element;
        spinMaterial.color.set(affinity ? ELEMENTS[affinity].color : 0xdad6c1);
        pulseMaterial.color.copy(spinMaterial.color);
        spinRoot.position.copy(hero);
        spinRoot.rotation.y = combat.whirlwind.yaw - phase * Math.PI * 2;
        const pulsePhase = phase - Math.floor(phase);
        spinMaterial.opacity = 0.24 + 0.42 * (1 - pulsePhase) ** 3;
        for (const arc of spinRoot.children.slice(0, 2)) arc.scale.setScalar(0.87 + 0.13 * (1 - pulsePhase));
        pulse.scale.setScalar(0.72 + pulsePhase * 0.28);
        pulseMaterial.opacity = 0.32 * (1 - pulsePhase);
      }
      return { damageFlash: damageFlash / 0.28, heroFlash: (flashes.get(0) ?? 0) / 0.16 };
    },
    reset() {
      basicImpact.reset();
      horde.reset();
      clearNumbers();
      flashes.clear();
      damageFlash = 0;
      slash.visible = false;
      spinRoot.visible = false;
      bladeTrace.visible = false;
      for (const enemy of enemies.values()) {
        root.remove(enemy.root);
        enemy.dispose();
      }
      enemies.clear();
    },
    dispose() {
      this.reset();
      basicImpact.dispose();
      horde.dispose();
      scene.remove(root);
      for (const parts of partCache.values()) for (const { geometry } of parts) geometry.dispose();
      partCache.clear();
      slash.geometry.dispose();
      slashMaterial.dispose();
      bladeTrace.geometry.dispose();
      bladeLight.dispose();
      spinGeometry.dispose();
      pulseGeometry.dispose();
      spinMaterial.dispose();
      pulseMaterial.dispose();
      numberMaps.forEach(t => t.dispose());
    },
  };
}

import * as THREE from 'three';
import type { Combat } from '../domain/combat.ts';
import { ARCHER_KIT as K } from '../content/classes/archer.ts';
import type { Element } from '../content/elements.ts';
import { ELEMENTS } from '../content/elements.ts';

export function createArcherArrowView(scene: THREE.Scene) {
  const root = new THREE.Group();
  scene.add(root);
  const shaftGeometry = new THREE.CylinderGeometry(0.014, 0.014, 0.7, 6);
  shaftGeometry.rotateX(Math.PI / 2);
  const tipGeometry = new THREE.ConeGeometry(0.05, 0.15, 4);
  tipGeometry.rotateX(-Math.PI / 2);
  const featherGeometry = new THREE.BoxGeometry(0.1, 0.018, 0.12);
  const shaftMaterial = new THREE.MeshBasicMaterial({ color: 0xb49b71 });
  const materials = {
    earth: new THREE.MeshBasicMaterial({ color: ELEMENTS.earth.color }),
    air: new THREE.MeshBasicMaterial({ color: ELEMENTS.air.color }),
    physical: new THREE.MeshBasicMaterial({ color: 0xd4d9cc }),
    fire: new THREE.MeshBasicMaterial({ color: ELEMENTS.fire.color }),
    water: new THREE.MeshBasicMaterial({ color: ELEMENTS.water.color }),
  };
  function arrow() {
    const group = new THREE.Group();
    const shaft = new THREE.Mesh(shaftGeometry, shaftMaterial),
      tip = new THREE.Mesh(tipGeometry, materials.physical),
      feathers = new THREE.Mesh(featherGeometry, materials.physical);
    tip.position.z = -0.4;
    feathers.position.z = 0.28;
    group.add(shaft, tip, feathers);
    root.add(group);
    return group;
  }
  function tint(group: THREE.Group, element?: Element) {
    group.children[1].scale.set(element === 'earth' ? 1.8 : 1, 1, 1);
    group.children[2].scale.set(1, 1, element === 'air' ? 2.2 : 1);
    (group.children[1] as THREE.Mesh).material = materials[element ?? 'physical'];
    (group.children[2] as THREE.Mesh).material = materials[element ?? 'physical'];
  }
  const trailGeometry = new THREE.CylinderGeometry(0.036, 0.072, 1, 6);
  trailGeometry.rotateX(Math.PI / 2);
  const trailMaterial = new THREE.MeshBasicMaterial({ color: 0xffdf99, transparent: true, depthWrite: false });
  const trail = new THREE.Mesh(trailGeometry, trailMaterial);
  trail.visible = false;
  root.add(trail);
  const wakeGeo = new THREE.ConeGeometry(0.068, 1, 5);
  wakeGeo.rotateX(Math.PI / 2);
  const wakeMat = new THREE.MeshBasicMaterial({ color: 0xffe4a8, transparent: true, opacity: 0.65, depthWrite: false });
  const basicWake = new THREE.MeshBasicMaterial({
    color: 0xd1f3aa,
    transparent: true,
    opacity: 0.92,
    depthWrite: false,
  });
  const returnWake = new THREE.MeshBasicMaterial({
    color: 0x98e9ff,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
  });
  const originGeo = new THREE.RingGeometry(0.74, 1, 4);
  const originMat = new THREE.MeshBasicMaterial({
    color: 0xe9d8a8,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.58,
    depthWrite: false,
  });
  const origins = new Map<number, THREE.Mesh>();
  const flying = new Map<number, THREE.Group>();
  const rain = Array.from({ length: 16 }, () => {
    const a = arrow();
    a.visible = false;
    return a;
  });
  const embedded = Array.from({ length: 10 }, () => {
    const pin = arrow();
    pin.visible = false;
    return pin;
  });
  const ringGeometry = new THREE.RingGeometry(0.96, 1, 56);
  const ringMaterial = new THREE.MeshBasicMaterial({
    color: 0xcdd2b5,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
  });
  const ring = new THREE.Mesh(ringGeometry, ringMaterial);
  ring.rotation.x = -Math.PI / 2;
  ring.visible = false;
  root.add(ring);
  return {
    update(combat: Combat, alpha: number) {
      const active = new Set<number>();
      if (combat.definition.id === 'archer')
        for (const p of combat.heroKit.state.projectiles ?? []) {
          active.add(p.id);
          let view = flying.get(p.id);
          if (!view) {
            view = arrow();
            if (!p.siege) {
              const tail = new THREE.Mesh(wakeGeo, wakeMat);
              view.add(tail);
              if (p.abilityId === 'return-arrows') view.add(new THREE.Mesh(wakeGeo, returnWake));
            }
            if (p.flightOrigin) {
              const mark = new THREE.Mesh(originGeo, originMat);
              mark.position.set(p.flightOrigin.x, 0.07, p.flightOrigin.z);
              mark.scale.setScalar(0.38);
              mark.rotation.x = -Math.PI / 2;
              root.add(mark);
              origins.set(p.id, mark);
            }
            flying.set(p.id, view);
          }
          tint(view, p.loadout.element);
          view.position.set(
            THREE.MathUtils.lerp(p.previous.x, p.x, alpha),
            1.2,
            THREE.MathUtils.lerp(p.previous.z, p.z, alpha),
          );
          view.rotation.y = Math.atan2(-p.vx, -p.vz);
          view.scale.setScalar(p.siege ? 1.65 : p.empowered ? 1.2 : 1);
          if (p.siege) view.children[1].scale.set(2.6, 2.6, 1.8);
          else {
            const fan = p.abilityId === 'fan-volley',
              returning = (p.leg ?? 0) % 2 === 1;
            const thirdPass = p.abilityId === 'return-arrows' && p.leg === 2;
            const basic = p.abilityId === 'arrow';
            const length = basic
              ? p.echo
                ? 0.55
                : 1.4
              : fan
                ? p.lateral
                  ? 0.65
                  : 1.65
                : returning
                  ? 1.55
                  : p.abilityId === 'ricochet'
                    ? 0.84
                    : 0.9;
            const tail = view.children[3] as THREE.Mesh;
            tail.material = basic ? basicWake : returning || thirdPass ? returnWake : wakeMat;
            const width = basic ? (p.echo ? 1.2 : 1.9) : p.abilityId === 'ricochet' ? 2.3 : returning ? 1.35 : 1;
            tail.scale.set(width, width, length);
            tail.position.set(returning ? -0.17 : 0, 0, 0.27 + length / 2);
            if (view.children[4]) {
              view.children[4].visible = returning || thirdPass;
              view.children[4].position.set(0.17, 0, 0.27 + length / 2);
              view.children[4].scale.copy(tail.scale);
              if (thirdPass) {
                tail.position.z = 0.62;
                tail.scale.set(1.6, 1.6, 0.64);
                view.children[4].position.set(0, 0, 1.43);
                view.children[4].scale.set(1.4, 1.4, 0.38);
              }
            }
            if (fan && !p.lateral) view.children[1].scale.multiplyScalar(1.55);
          }
        }
      for (const [id, view] of flying)
        if (!active.has(id)) {
          root.remove(view);
          flying.delete(id);
          const mark = origins.get(id);
          if (mark) root.remove(mark);
          origins.delete(id);
        }
      const track = combat.heroKit.state.siegeTrail;
      trail.visible = !!track;
      if (track) {
        const dx = track.end.x - track.start.x,
          dz = track.end.z - track.start.z;
        trail.position.set(track.start.x + dx / 2, 1.2, track.start.z + dz / 2);
        trail.rotation.y = Math.atan2(dx, dz);
        trail.scale.z = Math.hypot(dx, dz);
        trailMaterial.color.set(track.element ? ELEMENTS[track.element].color : 0xffdf99);
        trailMaterial.opacity = 0.8 * Math.min(1, track.fade / 0.18);
      }
      const area = combat.definition.id === 'archer' ? combat.heroKit.state.area : undefined;
      ring.visible = !!area;
      if (area?.center) {
        ring.position.set(area.center.x, 0.08, area.center.z);
        ring.scale.setScalar(area.radius);
        ringMaterial.color.set(area.loadout.element ? ELEMENTS[area.loadout.element].color : 0xcdd2b5);
        ringMaterial.opacity = area.age < K.rain.windup ? 0.25 + (0.35 * area.age) / K.rain.windup : 0.55;
      }
      for (let i = 0; i < embedded.length; i++) {
        const pin = embedded[i];
        pin.visible = false;
        if (!area?.center || area.age < K.rain.windup) continue;
        const pulse = Math.min(area.maxPulses - 1, Math.floor((area.age - K.rain.windup + 1e-8) / K.rain.interval));
        const landed = area.age - K.rain.windup - pulse * K.rain.interval;
        if (landed >= 0.26) continue;
        pin.visible = true;
        const angle = i * 2.39996,
          r = area.radius * Math.sqrt((i + 0.5) / rain.length) * 0.9;
        pin.position.set(area.center.x + Math.sin(angle) * r, 0.24, area.center.z + Math.cos(angle) * r);
        pin.rotation.set(-1.22, 0, 0.09 * Math.sin(i));
        pin.scale.setScalar(Math.min(1, (0.26 - landed) / 0.08));
        tint(pin, area.loadout.element);
      }
      for (let i = 0; i < rain.length; i++) {
        const view = rain[i];
        view.visible =
          !!area?.center &&
          area.age >= K.rain.windup - K.rain.interval &&
          area.age <= K.rain.windup + (area.maxPulses - 1) * K.rain.interval;
        if (!view.visible || !area?.center) continue;
        const nextPulse = Math.max(0, Math.ceil((area.age - K.rain.windup - 1e-8) / K.rain.interval));
        const fall = THREE.MathUtils.clamp(
          1 - (K.rain.windup + nextPulse * K.rain.interval - area.age) / K.rain.interval,
          0,
          1,
        );
        const angle = i * 2.39996,
          distance = area.radius * Math.sqrt((i + 0.5) / rain.length) * 0.9;
        view.position.set(
          area.center.x + Math.sin(angle) * distance,
          0.2 + (1 - fall) * 4.5,
          area.center.z + Math.cos(angle) * distance,
        );
        view.rotation.set(-Math.PI / 2, 0, 0.1);
        tint(view, area.loadout.element);
      }
    },
    reset() {
      for (const view of flying.values()) root.remove(view);
      flying.clear();
      for (const mark of origins.values()) root.remove(mark);
      origins.clear();
      for (const pin of embedded) pin.visible = false;
      trail.visible = false;
      ring.visible = false;
      rain.forEach(view => {
        view.visible = false;
      });
    },
    dispose() {
      this.reset();
      scene.remove(root);
      wakeGeo.dispose();
      wakeMat.dispose();
      returnWake.dispose();
      basicWake.dispose();
      originGeo.dispose();
      originMat.dispose();
      trailGeometry.dispose();
      trailMaterial.dispose();
      shaftGeometry.dispose();
      tipGeometry.dispose();
      featherGeometry.dispose();
      shaftMaterial.dispose();
      Object.values(materials).forEach(m => m.dispose());
      ringGeometry.dispose();
      ringMaterial.dispose();
    },
  };
}

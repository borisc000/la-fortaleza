import * as THREE from 'three';
import { RangedArsenal, type RangedVisual } from '../domain/classes/ranged-arsenal.ts';
import type { Combat } from '../domain/combat.ts';
import { ELEMENTS } from '../content/elements.ts';

/** Projectiles retain their class renderer; this view owns persistent zones and constructs. */
export function createRangedArsenalView(scene: THREE.Scene) {
  const root = new THREE.Group();
  root.name = 'Repertorio a distancia';
  scene.add(root);
  const material = new THREE.MeshBasicMaterial({
    color: 0xd8d5ba,
    transparent: true,
    opacity: 0.32,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const metal = new THREE.MeshStandardMaterial({ color: 0x9ba8ab, metalness: 0.6, roughness: 0.4 });
  const ring = new THREE.RingGeometry(0.94, 1, 48),
    orb = new THREE.IcosahedronGeometry(0.22, 1),
    beam = new THREE.BoxGeometry(1, 0.12, 1),
    stake = new THREE.ConeGeometry(0.12, 0.9, 5),
    mirror = new THREE.TorusGeometry(0.45, 0.05, 6, 24);
  const silver = new THREE.MeshBasicMaterial({ color: 0xbdedff, side: THREE.DoubleSide });
  const mirrorGlint = new THREE.PlaneGeometry(0.075, 0.58);
  const beamAura = material.clone();
  beamAura.opacity = 0.14;
  const toothTip = new THREE.MeshBasicMaterial({ color: 0xe1d5bb });
  const runeStroke = new THREE.BoxGeometry(1, 0.045, 0.075);
  const seal = new THREE.RingGeometry(0.94, 1, 6);
  const returnArc = new THREE.RingGeometry(0.38, 0.52, 20, 1, 0, Math.PI);
  returnArc.rotateX(-Math.PI / 2);
  const runeLight = new THREE.MeshBasicMaterial({ color: 0xdebcff, side: THREE.DoubleSide });
  const blast = new THREE.RingGeometry(0.91, 1, 48);
  const engraving = new THREE.MeshBasicMaterial({ color: 0xffdf97, side: THREE.DoubleSide });
  const exitMark = new THREE.RingGeometry(0.78, 1, 4, 1, Math.PI / 2);
  const faint = new THREE.MeshBasicMaterial({ color: 0xeac68a, transparent: true, opacity: 0.44, depthWrite: false });
  const shard = new THREE.OctahedronGeometry(1);
  const disc = new THREE.CircleGeometry(0.41, 24);
  const glass = new THREE.MeshBasicMaterial({
    color: 0x91cddd,
    transparent: true,
    opacity: 0.42,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const crescent = new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3(
      Array.from({ length: 8 }, (_, i) => {
        const t = i * 0.1;
        return new THREE.Vector3(-Math.sin(t), 0, Math.cos(t) - 1);
      }),
    ),
    10,
    0.024,
    5,
    false,
  );
  const crackShape = new THREE.Shape();
  crackShape.moveTo(-0.04, 0);
  crackShape.lineTo(-0.12, 0.43);
  crackShape.lineTo(0.06, 0.62);
  crackShape.lineTo(-0.04, 1);
  crackShape.lineTo(0.14, 0.59);
  crackShape.lineTo(-0.035, 0.39);
  crackShape.lineTo(0.055, 0);
  crackShape.closePath();
  const crack = new THREE.ShapeGeometry(crackShape);
  crack.rotateX(-Math.PI / 2);
  const chevronShape = new THREE.Shape();
  chevronShape.moveTo(-0.32, 0.2);
  chevronShape.lineTo(0, -0.13);
  chevronShape.lineTo(0.32, 0.2);
  chevronShape.lineTo(0.24, 0.23);
  chevronShape.lineTo(0, 0.035);
  chevronShape.lineTo(-0.24, 0.23);
  chevronShape.closePath();
  const chevron = new THREE.ShapeGeometry(chevronShape);
  const geometryByKind: Partial<Record<RangedVisual['kind'], THREE.BufferGeometry>> = {
    seal,
    pierce: exitMark,
    'seal-flash': blast,
    orb,
    beam,
    stake,
    mirror,
    fissure: crack,
    'nova-front': blast,
    'crystal-fall': shard,
    splinters: shard,
    'trap-snap': stake,
    'stake-hit': stake,
    bend: shard,
    mark: chevron,
    snared: stake,
    echo: disc,
    'lance-hit': mirror,
  };
  function addDetails(group: THREE.Group, kind: RangedVisual['kind']) {
    const add = (geo: THREE.BufferGeometry, mat: THREE.Material) => {
      const mesh = new THREE.Mesh(geo, mat);
      group.add(mesh);
      return mesh;
    };
    switch (kind) {
      case 'orb':
        add(crescent, material);
        add(shard, engraving).scale.setScalar(0.13);
        break;
      case 'beam':
        add(beam, engraving);
        add(shard, engraving);
        add(exitMark, glass);
        break;
      case 'fissure':
        for (let j = 1; j < 7; j++) add(crack, j % 2 ? engraving : material);
        break;
      case 'nova-front':
        add(blast, faint);
        add(shard, engraving);
        break;
      case 'crystal-fall':
        add(ring, faint);
        break;
      case 'splinters':
        for (let j = 1; j < 8; j++) add(shard, j % 2 ? engraving : glass);
        break;
      case 'trap-snap':
        for (let j = 1; j < 8; j++) add(stake, j % 2 ? metal : toothTip);
        break;
      case 'snared':
        add(stake, metal);
        break;
      case 'stake':
        add(runeStroke, engraving).scale.set(0.38, 1, 1);
        break;
      case 'stake-hit':
        add(ring, faint);
        break;
      case 'bend':
        add(beam, faint);
        break;
      case 'mirror':
        add(disc, glass);
        add(mirrorGlint, silver);
        break;
      case 'echo': {
        add(shard, glass).scale.set(0.15, 0.19, 0.13);
        add(shard, glass).scale.set(0.23, 0.32, 0.16);
        const staff = add(beam, engraving);
        staff.scale.set(0.04, 8, 0.04);
        const arm = add(runeStroke, glass);
        arm.scale.set(0.42, 2.2, 1.6);
        break;
      }
    }
  }
  function animateDetails(group: THREE.Group, item: RangedVisual, time: number) {
    const [base, second, third, fourth, fifth] = group.children;
    const t = item.phase ?? 0,
      r = item.radius;
    switch (item.kind) {
      case 'orb':
        second.scale.setScalar(item.width ?? 1.8);
        third.rotation.z = time * 4;
        break;
      case 'beam':
        second.scale.set(0.09, 1.5, r);
        third.scale.set((item.width ?? 0.4) * 0.75, 0.13, r * 0.09);
        third.position.z = r * (0.5 - t);
        fourth.position.copy(third.position);
        fourth.scale.set((item.width ?? 0.4) * 1.35, 0.38, 1);
        fourth.rotation.z = Math.PI / 4;
        break;
      case 'fissure':
        group.children.forEach((branch, j) => {
          branch.rotation.y = j * 2.4;
          branch.scale.set(r * (1 - t), 1, r * (0.3 + 0.7 * Math.min(1, t * 3)) * (j % 2 ? 0.74 : 1));
        });
        break;
      case 'nova-front':
        for (const [j, front] of [base, second].entries()) {
          front.rotation.x = -Math.PI / 2;
          front.scale.setScalar(r * (0.14 + 0.86 * (1 - (1 - t) ** 3)) * (1 - j * 0.16));
          front.position.y = (0.09 + j * 0.28) * (1 - t);
        }
        third.rotation.x = 0;
        third.position.y = 1.2 * (1 - t);
        third.scale.setScalar(0.32 * (1 - t) ** 2);
        break;
      case 'crystal-fall':
        base.position.y = 0.2 + 3.2 * (1 - t * t);
        base.scale.set(0.22 * r, 0.68 * r, 0.24 * r);
        base.rotation.z = -0.23;
        second.rotation.x = -Math.PI / 2;
        second.scale.setScalar(r * (0.38 + t * 0.45));
        break;
      case 'splinters':
        group.children.forEach((chip, j) => {
          const angle = j * 2.4;
          chip.position.set(
            Math.sin(angle) * r * t,
            Math.sin(t * Math.PI) * (0.35 + (j % 3) * 0.24),
            Math.cos(angle) * r * t,
          );
          chip.rotation.z = angle + t * 2;
          chip.scale.set(0.09 * r * (1 - t), 0.4 * r * (1 - t), 0.1 * r * (1 - t));
        });
        break;
      case 'trap':
        for (let j = 1; j < group.children.length; j++) {
          const tooth = group.children[j];
          tooth.rotation.z = (j % 2 ? 1 : -1) * (1 - t) * 1.2;
          tooth.scale.setScalar(item.ready ? 0.75 : 0.35 + t * 0.25);
        }
        break;
      case 'trap-snap':
        group.children.forEach((tooth, j) => {
          const angle = (j * Math.PI) / 4,
            lift = Math.sin(Math.PI * Math.min(1, t * 1.5));
          const spread = r * (0.68 - 0.24 * lift);
          tooth.position.set(Math.sin(angle) * spread, 0.24 + lift * 0.58, Math.cos(angle) * spread);
          tooth.rotation.set(-Math.cos(angle) * lift * 0.65, 0, Math.sin(angle) * lift * 0.65);
          tooth.scale.set(1.45 * (1 - t), 1.75 * (1 - t * t), 1.45 * (1 - t));
        });
        break;
      case 'snared':
        base.scale.set(0.64, 0.5, 0.64);
        second.scale.copy(base.scale);
        base.rotation.z = -0.55;
        second.rotation.z = 0.55;
        base.position.set(-0.22, 0.16, -0.08);
        second.position.set(0.22, 0.16, -0.08);
        break;
      case 'stake':
        group.position.y = -0.4 + t * 0.85;
        group.scale.set(1.4, 0.6 + 0.48 * t, 1.4);
        second.position.y = 0.16;
        break;
      case 'stake-hit':
        base.position.y = 0.4;
        base.rotation.z = Math.sin(t * 18) * 0.46 * (1 - t);
        second.rotation.x = -Math.PI / 2;
        second.scale.setScalar(0.28 + t * 0.48);
        break;
      case 'bend':
        group.position.y = 1.2;
        base.scale.setScalar((1 - t) * 0.22);
        base.rotation.z = t * 4;
        second.scale.set(0.07 * (1 - t), 1, r);
        second.position.z = r / 2;
        if (third) {
          second.visible = false;
          third.scale.setScalar(1.25 * (1 - t * t));
        }
        break;
      case 'lance-hit':
        group.position.y = 1.15;
        group.scale.setScalar((0.45 + 1.1 * t) * (1 - t ** 3));
        break;
      case 'mirror':
        group.position.y = 1.68 + Math.sin(time * 3) * 0.09;
        group.scale.set(1.07, 1.45, 1);
        third.position.set(Math.sin(time * 3) * 0.19, 0, 0.07);
        third.rotation.z = 0.81;
        third.scale.y = 0.82 + 0.18 * Math.cos(time * 6);
        break;
      case 'echo':
        group.position.y = 1.68 + t * 0.28;
        group.scale.setScalar(1.1 - t * 0.34);
        second.position.y = 0.32;
        third.position.y = -0.08;
        fourth.position.set(0.28, 0.09, -0.08);
        fourth.rotation.x = -0.25 + t * 0.38;
        fifth.position.set(0.16, 0.1, 0);
        fifth.rotation.z = 0.32 + t * 0.42;
        break;
      case 'beacon':
        second.rotation.y = time * 2.5;
        third.position.y = 2.18 + Math.sin(time * 4) * 0.09;
        third.rotation.y = -time * 2.5;
        break;
      case 'mark':
        group.position.y = 1.98 + Math.sin(time * 4) * 0.035;
        group.scale.setScalar(0.66);
        // Cross two faces so the mark remains legible while the camera orbits.
        if (second) second.rotation.y = Math.PI / 2;
        break;
    }
  }
  const objects = new Map<string, THREE.Group>();
  return {
    update(combat: Combat) {
      const active = new Set<string>(),
        kit = combat.heroKit;
      material.color.set(combat.loadout.element ? ELEMENTS[combat.loadout.element].color : 0xd8d5ba);
      beamAura.color.copy(material.color);
      if (kit instanceof RangedArsenal)
        for (const item of kit.presentation.slice(0, 64)) {
          if (item.kind === 'zone' && kit.state.area && item.id === `area:${kit.state.area.id}`) continue;
          active.add(item.id);
          let group = objects.get(item.id);
          if (!group) {
            group = new THREE.Group();
            const shape = new THREE.Mesh(
              geometryByKind[item.kind] ?? ring,
              ['pierce', 'mark', 'bend', 'lance-hit', 'crystal-fall'].includes(item.kind)
                ? engraving
                : ['stake', 'trap-snap', 'stake-hit', 'snared'].includes(item.kind)
                  ? metal
                  : material,
            );
            if (['zone', 'trap', 'beacon'].includes(item.kind)) shape.rotation.x = -Math.PI / 2;
            if (item.kind === 'beam') shape.material = beamAura;
            if (item.kind === 'mirror') shape.material = silver;
            group.add(shape);
            addDetails(group, item.kind);
            if (item.kind === 'bend' && item.id.startsWith('turn:')) group.add(new THREE.Mesh(returnArc, runeLight));
            if (item.kind === 'seal-flash' && kit.abilities.find(a => a.id === 'mage:detonation')?.finisher === 1)
              group.userData.implosion = true;
            if (item.kind === 'mark') group.add(new THREE.Mesh(chevron, engraving));
            if (item.kind === 'seal' || item.kind === 'seal-flash') {
              shape.rotation.x = -Math.PI / 2;
              for (let j = 0; j < 6; j++) {
                group.add(new THREE.Mesh(runeStroke, engraving));
              }
            }
            if (item.kind === 'trap')
              for (let j = 0; j < 5; j++) {
                const spike = new THREE.Mesh(stake, metal);
                spike.scale.setScalar(0.45);
                spike.position.set(Math.sin(j * 1.256) * 0.55, 0.15, Math.cos(j * 1.256) * 0.55);
                group.add(spike);
              }
            if (item.kind === 'beacon') {
              const marker = new THREE.Mesh(mirror, engraving);
              marker.position.y = 2.18;
              marker.scale.set(0.85, 1.2, 1);
              const core = new THREE.Mesh(shard, metal);
              core.scale.set(0.18, 0.37, 0.18);
              group.add(marker, core);
            }
            root.add(group);
            objects.set(item.id, group);
          }
          group.position.set(
            item.x,
            item.kind === 'orb' || item.kind === 'mirror'
              ? 1
              : item.kind === 'beam'
                ? 0.65
                : item.kind === 'stake'
                  ? 0.45
                  : 0.08,
            item.z,
          );
          group.rotation.y = item.yaw;
          animateDetails(group, item, combat.time);
          if (item.kind === 'pierce') {
            const t = item.phase ?? 0;
            group.position.y = 1.2;
            group.scale.setScalar(item.radius * (0.85 + 0.6 * Math.sin(t * Math.PI)) * (1 - t ** 4));
          }
          if (['zone', 'trap', 'beacon'].includes(item.kind)) group.children[0].scale.setScalar(item.radius);
          if (item.kind === 'seal' || item.kind === 'seal-flash') {
            const t = item.phase ?? 0,
              exploding = item.kind === 'seal-flash';
            const radius = item.radius;
            group.children[0].scale.setScalar(radius * (exploding ? 0.3 + 0.7 * (1 - (1 - t) ** 3) : 1));
            for (let j = 0; j < 6; j++) {
              const stroke = group.children[j + 1];
              const rearming = item.residual && !exploding;
              const charge = THREE.MathUtils.clamp(t * 6 - j, 0, 1);
              (stroke as THREE.Mesh).material = rearming && charge < 0.35 ? faint : runeLight;
              const angle = (j * Math.PI) / 3;
              const closure = rearming ? charge : item.residual ? 1 : THREE.MathUtils.smoothstep(t, 0, 1);
              const r = group.userData.implosion
                ? THREE.MathUtils.lerp(radius * 0.75, 0.32, t)
                : radius * (exploding ? 0.35 + t * 0.58 : 0.54 + (1 - closure) * 0.23);
              stroke.position.set(
                Math.sin(angle) * r,
                exploding ? 0.12 + Math.sin(t * Math.PI) * 0.48 : 0.03,
                Math.cos(angle) * r,
              );
              stroke.rotation.y = group.userData.implosion
                ? angle + Math.PI / 2
                : angle + (exploding ? t : 1 - closure) * 0.94;
              stroke.scale.set(
                Math.min(1.35, radius * (exploding ? (1 - t) * 0.75 : 0.22 + 0.42 * closure)),
                1,
                rearming ? 0.75 + charge * 1.5 : 2.25,
              );
            }
          }
          if (item.kind === 'beam') group.children[0].scale.set(item.width ?? 0.4, 1, item.radius);
        }
      for (const [id, group] of objects)
        if (!active.has(id)) {
          root.remove(group);
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
      for (const g of [
        ring,
        orb,
        beam,
        stake,
        mirror,
        runeStroke,
        seal,
        returnArc,
        blast,
        exitMark,
        shard,
        disc,
        crescent,
        crack,
        chevron,
      ])
        g.dispose();
      mirrorGlint.dispose();
      silver.dispose();
      beamAura.dispose();
      toothTip.dispose();
      material.dispose();
      metal.dispose();
      engraving.dispose();
      faint.dispose();
      runeLight.dispose();
      glass.dispose();
    },
  };
}

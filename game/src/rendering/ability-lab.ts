import { heroFacing, playCombatPose } from './hero.ts';
import * as THREE from 'three';
import { createAbilityTrial, TRIAL_DURATION, TRIAL_STEP, type TrialConfig } from '../domain/ability-lab.ts';
import { catalog, type ModelView } from '../model-catalog.ts';
import { createCombatView } from './combat.ts';
import { createElementView } from './elements.ts';
import { createWarriorArsenalView } from './warrior-arsenal.ts';
import { createRangedArsenalView } from './ranged-arsenal.ts';
import { createMageSpellView } from './mage-spells.ts';
import { createArcherArrowView } from './archer-arrows.ts';

export async function createAbilityLab(
  config: TrialConfig,
  camera: THREE.Camera,
  report: (text: string) => void,
): Promise<ModelView> {
  let trial = createAbilityTrial(config);
  const character = await catalog.find(c => c.id === trial.build.definition.classId)!.create();
  const hero = character.character!;
  const root = new THREE.Scene();
  root.add(hero.root);
  const feedback = createCombatView(root, trial.combat.definition, false);
  const elements = createElementView(root),
    warrior = createWarriorArsenalView(root),
    ranged = createRangedArsenalView(root);
  const spells = createMageSpellView(root),
    arrows = createArcherArrowView(root);
  const views = [feedback, elements, warrior, ranged, spells, arrows];
  const geometry = {
    post: new THREE.CylinderGeometry(0.085, 0.12, 1.5, 8),
    head: new THREE.SphereGeometry(0.19, 12, 8),
    body: new THREE.CylinderGeometry(0.28, 0.21, 0.62, 12),
    arms: new THREE.BoxGeometry(1.05, 0.13, 0.15),
    base: new THREE.CylinderGeometry(0.4, 0.46, 0.09, 16),
  };
  const wood = new THREE.MeshStandardMaterial({ color: 0x72513b, roughness: 0.9 });
  const straw = new THREE.MeshStandardMaterial({ color: 0xb5a277, roughness: 1 });
  const dummies = trial.combat.enemies.map(() => {
    const group = new THREE.Group(),
      material = straw.clone();
    for (const [key, y] of [
      ['post', 0.8],
      ['head', 1.67],
      ['body', 1.17],
      ['arms', 1.35],
      ['base', 0.045],
    ] as const) {
      const mesh = new THREE.Mesh(geometry[key], key === 'head' || key === 'body' ? material : wood);
      mesh.position.y = y;
      group.add(mesh);
    }
    root.add(group);
    return { group, material, flash: 0 };
  });
  let frame = 0;
  const origin = new THREE.Vector3();
  function render(dt: number) {
    const { combat } = trial;
    feedback.update(combat, origin, camera, 1, dt);
    elements.update(combat, origin, 1, dt);
    warrior.update(combat);
    ranged.update(combat);
    spells.update(combat, 1);
    arrows.update(combat, 1);
    hero.walk(dt, 0);
    hero.root.rotation.y = heroFacing(combat, 0);
    playCombatPose(hero, combat, 0);
    hero.fade(1);
    dummies.forEach((dummy, i) => {
      const enemy = combat.enemies[i];
      dummy.group.position.set(enemy.x, 0, enemy.z);
      dummy.flash = Math.max(0, dummy.flash - dt);
      dummy.material.emissive.setHex(0xff9d43);
      dummy.material.emissiveIntensity = dummy.flash * 3;
    });
  }
  function reset() {
    trial.kit.cancel();
    trial = createAbilityTrial(config);
    frame = 0;
    views.forEach(v => v.reset());
    hero.resetPose();
    dummies.forEach(d => {
      d.flash = 0;
    });
    render(0);
  }
  render(0);
  return {
    root,
    framing: { box: new THREE.Box3(new THREE.Vector3(-4, 0, -7), new THREE.Vector3(4, 2, 1)), radius: 6.5 },
    animation: {
      duration: () => TRIAL_DURATION,
      seek(_mode, time) {
        const target = Math.floor(Math.max(0, Math.min(TRIAL_DURATION, time)) / TRIAL_STEP + 1e-7);
        if (target < frame) reset();
        while (frame < target) {
          const events = trial.step();
          frame++;
          feedback.events(events, trial.combat.time);
          elements.events(events);
          for (const event of events)
            if (event.type === 'hit' && event.target > 0) dummies[event.target - 1].flash = 0.25;
          render(TRIAL_STEP);
        }
        report(
          `${trial.hits} impactos · ${trial.damage.toFixed(1)} daño acumulado · barrera ${Math.round(trial.kit.state.barrier?.amount ?? 0)}`,
        );
      },
    },
    dispose() {
      trial.kit.cancel();
      views.forEach(v => v.dispose());
      character.dispose();
      Object.values(geometry).forEach(g => g.dispose());
      wood.dispose();
      straw.dispose();
      dummies.forEach(d => d.material.dispose());
      root.clear();
    },
  };
}

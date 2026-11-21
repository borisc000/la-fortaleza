import {
  COURT_GUARDS,
  COURT_REINFORCEMENTS,
  HALL_CAPTAIN,
  HALL_GUARDS,
  STONE_HEART_ARCH,
  STONE_HEART_BEACON,
  STONE_HEART_COURT,
  STONE_HEART_GATE,
  stoneBounds,
} from '../content/stone-heart.ts';
import type { StoneHeartSpawn } from '../content/stone-heart.ts';
import { EXPLORATION } from '../content/exploration.ts';
import type { Combat } from './combat.ts';
import type { Point, Solid } from './movement.ts';
import { clearPath } from './navigation.ts';

type StoneHeartPhase =
  | 'entry'
  | 'courtyard'
  | 'reinforcements'
  | 'passage'
  | 'hall'
  | 'captain'
  | 'signal'
  | 'complete';

export class StoneHeartMission {
  phase: StoneHeartPhase = 'entry';
  spawned = 0;
  private completeAt = 0;
  private readonly solids: readonly Solid[];
  private readonly closedSolids: readonly Solid[];

  constructor(solids: readonly Solid[]) {
    this.solids = solids;
    this.closedSolids = [...solids, stoneBounds(STONE_HEART_GATE)];
  }

  get gateOpen() {
    return this.phase !== 'entry' && this.phase !== 'courtyard' && this.phase !== 'reinforcements';
  }

  get movementSolids() {
    return this.gateOpen ? this.solids : this.closedSolids;
  }

  get section() {
    return this.gateOpen ? 'Salón principal' : 'Patio de armas';
  }

  get wave() {
    if (this.phase === 'entry' || this.phase === 'courtyard') return 1;
    if (this.phase === 'reinforcements' || this.phase === 'passage') return 2;
    return this.phase === 'hall' ? 3 : 4;
  }

  objective(combat: Combat) {
    const remaining = combat.enemies.filter(enemy => !enemy.dead).length;
    switch (this.phase) {
      case 'entry':
        return 'Cruza el portón y recupera el patio';
      case 'courtyard':
        return `Recupera el patio · ${remaining} por derrotar`;
      case 'reinforcements':
        return `Resiste los refuerzos del patio · ${remaining} por derrotar`;
      case 'passage':
        return 'Patio asegurado · entra al salón principal';
      case 'hall':
        return `Despeja el salón · ${remaining} por derrotar`;
      case 'captain':
        return 'Derrota al Capitán de la guarnición';
      case 'signal':
        return 'Enciende la almenara de la fortaleza';
      case 'complete':
        return 'Fortaleza recuperada';
    }
  }

  destination(combat: Combat, hero: Point): Point & { name: string } {
    const target =
      this.phase === 'passage'
        ? { ...STONE_HEART_ARCH, name: 'Paso al salón' }
        : this.phase === 'signal' || this.phase === 'complete'
          ? { ...STONE_HEART_BEACON, name: 'Almenara' }
          : { ...STONE_HEART_COURT, name: 'Patio de armas' };
    if (!['courtyard', 'reinforcements', 'hall', 'captain'].includes(this.phase)) return target;
    let nearest: Point | undefined;
    let best = Infinity;
    for (const enemy of combat.enemies) {
      if (enemy.dead) continue;
      const distance = Math.hypot(hero.x - enemy.x, hero.z - enemy.z);
      if (distance < best) {
        nearest = enemy;
        best = distance;
      }
    }
    return nearest
      ? { x: nearest.x, z: nearest.z, name: this.phase === 'captain' ? 'Capitán' : 'Enemigo cercano' }
      : target;
  }

  private spawn(combat: Combat, guards: readonly StoneHeartSpawn[], hero: Point, reserve: Point) {
    for (const guard of guards) {
      const point = Math.hypot(guard.x - hero.x, guard.z - hero.z) < 3 ? reserve : guard;
      combat.addEnemies([{ x: point.x, z: point.z }], guard.kind === 'elite' ? 2.2 : 1.35, guard.kind);
    }
    this.spawned += guards.length;
  }

  advance(combat: Combat, hero: Point) {
    if (this.phase === 'entry' && hero.z < 22) {
      this.phase = 'courtyard';
      this.spawn(combat, COURT_GUARDS, hero, { x: 0, z: 5 });
    } else if (this.phase === 'passage' && hero.z < -16.1 && Math.abs(hero.x) < 14.3) {
      this.phase = 'hall';
      this.spawn(combat, HALL_GUARDS, hero, { x: 0, z: -29 });
    } else if (combat.enemies.every(enemy => enemy.dead)) {
      switch (this.phase) {
        case 'courtyard':
          this.phase = 'reinforcements';
          this.spawn(combat, COURT_REINFORCEMENTS, hero, { x: 0, z: 16 });
          break;
        case 'reinforcements':
          this.phase = 'passage';
          combat.projectiles.clear();
          break;
        case 'hall':
          this.phase = 'captain';
          combat.projectiles.clear();
          this.spawn(combat, [HALL_CAPTAIN], hero, { x: 0, z: -26.8 });
          break;
        case 'captain':
          this.phase = 'signal';
          break;
        case 'complete':
          if (combat.time >= this.completeAt) combat.complete();
          break;
      }
    }
  }

  focus(hero: Point) {
    return this.phase === 'signal' &&
      Math.hypot(hero.x - STONE_HEART_BEACON.x, hero.z - STONE_HEART_BEACON.z) <= EXPLORATION.interactionRadius &&
      clearPath(hero, STONE_HEART_BEACON, this.solids, 0.04)
      ? STONE_HEART_BEACON
      : undefined;
  }

  light(combat: Combat, hero: Point) {
    if (!this.focus(hero) || !combat.cleared || combat.hp <= 0) return false;
    this.phase = 'complete';
    this.completeAt = combat.time + 1.2;
    return true;
  }
}

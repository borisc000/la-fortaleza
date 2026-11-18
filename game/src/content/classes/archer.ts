import type { ClassDefinition } from '../class-definition.ts';
import type { ElementalLoadout } from '../elements.ts';

export const ARCHER: ClassDefinition = Object.freeze({
  id: 'archer',
  name: 'Arquero',
  stats: Object.freeze({ hp: 90, armor: 0, protection: 0.35 }),
  movement: Object.freeze({ speed: 5.2, maxSpeed: 6.7, radius: 0.4, height: 1.86, turnSpeed: 14 }),
  weapon: Object.freeze({ id: 'bow', name: 'Flecha' }),
  basic: Object.freeze({ damage: 22, range: 12, arc: 0, windup: 0.16, active: 0.04, duration: 0.32, cooldown: 0.65 }),
  passive: Object.freeze({ id: 'precision', name: 'Precisión' }),
  skill: Object.freeze({ id: 'rain', name: 'Lluvia de flechas' }),
  affinities: Object.freeze({
    earth: Object.freeze({
      description: 'Flechas de pedernal: ignoran un 15 % de armadura y aplican Quebranto durante 3 s.',
      upgradeDescription: 'Ignoran un 25/35 % de armadura y convierten un 40/50 % del daño en Tierra.',
      mastery: 'Lluvia de pedernal',
      masteryDescription: 'La lluvia ignora un 75 % de armadura y su última descarga causa el doble de daño.',
    }),
    air: Object.freeze({
      description: 'Flechas más rápidas, alcance de 14 m y un blanco adicional por flecha.',
      upgradeDescription: 'El alcance aumenta a 15/16 m y las flechas vuelan más rápido.',
      mastery: 'Cazador del vendaval',
      masteryDescription: 'Cada flecha atraviesa otro blanco adicional y la lluvia gana un 25 % de radio.',
    }),
    fire: Object.freeze({
      description: 'Flechas incendiarias: 30 % del daño se vuelve Fuego y aplica quemadura de 3 s.',
      upgradeDescription: 'Aumenta la proporción de Fuego al 40/50 % y la potencia de la quemadura.',
      mastery: 'Lluvia incendiaria',
      masteryDescription: 'Lluvia de flechas pasa de cuatro a seis descargas incendiarias.',
    }),
    water: Object.freeze({
      description: 'Flechas de Agua: ralentizan y su primer impacto libera una salpicadura cercana.',
      upgradeDescription: 'Aumenta la proporción de Agua al 40/50 % y el daño de salpicadura a 8/10.',
      mastery: 'Diluvio perforante',
      masteryDescription: 'Lluvia gana un 20 % de radio y las salpicaduras de las flechas crecen de 1,2 a 1,8 m.',
    }),
  }),
});
export const ARCHER_KIT = Object.freeze({
  precision: Object.freeze({ maxStacks: 3, timeout: 4, targets: Object.freeze([1, 1, 2, 3]) }),
  projectile: Object.freeze({ speed: 24, radius: 0.09, lifetime: 0.9, cap: 32 }),
  rain: Object.freeze({
    cooldown: 16,
    windup: 0.6,
    interval: 0.35,
    pulses: 4,
    damage: 14,
    radius: 3.5,
    recovery: 0.35,
  }),
  mastery: Object.freeze({ firePulses: 6, waterRadius: 1.2, splashRadius: 1.8 }),
  water: Object.freeze({ splashRadius: 1.2, splashDamage: Object.freeze([6, 8, 10]) }),
  earth: Object.freeze({ armorIgnore: Object.freeze([0.15, 0.25, 0.35]), masteryArmorIgnore: 0.75 }),
  air: Object.freeze({ speed: Object.freeze([30, 33, 36]), reach: Object.freeze([2, 3, 4]), masteryRadius: 1.25 }),
});
export function archerRange(loadout: ElementalLoadout) {
  return (
    ARCHER.basic.range +
    (loadout.element === 'air' ? ARCHER_KIT.air.reach[Math.max(0, Math.min(2, loadout.rank - 1))] : 0)
  );
}
export function arrowSpeed(loadout: ElementalLoadout) {
  return loadout.element === 'air'
    ? ARCHER_KIT.air.speed[Math.max(0, Math.min(2, loadout.rank - 1))]
    : ARCHER_KIT.projectile.speed;
}
export function arrowArmorIgnore(loadout: ElementalLoadout, rain = false) {
  return loadout.element === 'earth'
    ? rain && loadout.mastery
      ? ARCHER_KIT.earth.masteryArmorIgnore
      : ARCHER_KIT.earth.armorIgnore[Math.max(0, Math.min(2, loadout.rank - 1))]
    : 0;
}

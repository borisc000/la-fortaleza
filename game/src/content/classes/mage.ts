import type { ClassDefinition } from '../class-definition.ts';
import type { ElementalLoadout } from '../elements.ts';

export const MAGE: ClassDefinition = Object.freeze({
  id: 'mage', name: 'Mago',
  stats: Object.freeze({ hp: 80, armor: 0, protection: .35 }),
  movement: Object.freeze({ speed: 5, maxSpeed: 6.5, radius: .4, height: 1.86, turnSpeed: 14 }),
  weapon: Object.freeze({ id: 'staff', name: 'Proyectil elemental' }),
  basic: Object.freeze({ damage: 24, range: 10, arc: 0, windup: .18, active: .04, duration: .4, cooldown: .9 }),
  passive: Object.freeze({ id: 'arcane', name: 'Acumulación arcana' }),
  skill: Object.freeze({ id: 'cataclysm', name: 'Cataclismo elemental' }),
  affinities: Object.freeze({
    earth: Object.freeze({ description: 'Rocas que aplican Quebranto: +15 % de daño posterior durante 3 s. El cuarto lanzamiento forma una coraza.', upgradeDescription: '+10 % de daño por rango y coraza de 12/16/20 puntos.', mastery: 'Falla tectónica', masteryDescription: 'El último de los tres pulsos del Cataclismo causa el doble de daño.' }),
    air: Object.freeze({ description: 'Proyectiles rápidos que empujan. Cataclismo atrae hacia una zona fija.', upgradeDescription: '+10 % de daño por rango; aumenta alcance, empuje y atracción.', mastery: 'Vórtice creciente', masteryDescription: 'Cataclismo gana un 30 % de radio y un 50 % de fuerza de atracción.' }),
    fire: Object.freeze({ description: 'Bolas de fuego que queman durante 3 s. Cataclismo provoca erupciones.', upgradeDescription: '+10 % de daño elemental por rango, incluida la quemadura.', mastery: 'Erupción mayor', masteryDescription: 'Cataclismo pasa de tres a cinco erupciones sobre la zona marcada.' }),
    water: Object.freeze({ description: 'Orbes de agua que ralentizan durante 3 s. Cataclismo crea oleadas.', upgradeDescription: '+10 % de daño elemental por rango. Conserva la ralentización.', mastery: 'Marea creciente', masteryDescription: 'Cataclismo gana un 25 % de radio y sus oleadas empujan hacia fuera.' }),
  }),
});
export const MAGE_KIT = Object.freeze({
  arcane: Object.freeze({ charges: 3, multiplier: 1.6, radius: 1.7 }),
  projectile: Object.freeze({ speed: 16, radius: .18, lifetime: 1.2, cap: 32 }),
  cataclysm: Object.freeze({ cooldown: 14, windup: .65, interval: .35, pulses: 3, damage: 18, radius: 3.2, recovery: .35 }),
  mastery: Object.freeze({ firePulses: 5, waterRadius: 1.25, push: .55 }),
  earth: Object.freeze({ speed: 12, radius: .24, guard: Object.freeze([12, 16, 20]), guardDuration: 4, guardCooldown: 6 }),
  air: Object.freeze({ speed: 22, reach: Object.freeze([1, 1.5, 2]), push: Object.freeze([.2, .3, .4]), pull: Object.freeze([.3, .4, .5]), protection: .35, masteryRadius: 1.3, masteryPull: 1.5 }),
});
export function mageRange(loadout: ElementalLoadout) { return MAGE.basic.range + (loadout.element === 'air' ? MAGE_KIT.air.reach[Math.max(0, Math.min(2, loadout.rank - 1))] : 0); }
export function mageProjectile(loadout: ElementalLoadout) { return loadout.element === 'earth' ? { speed: MAGE_KIT.earth.speed, radius: MAGE_KIT.earth.radius } : { speed: loadout.element === 'air' ? MAGE_KIT.air.speed : MAGE_KIT.projectile.speed, radius: MAGE_KIT.projectile.radius }; }

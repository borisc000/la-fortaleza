import type { ClassDefinition } from '../class-definition.ts';

export const WARRIOR: ClassDefinition = Object.freeze({
  id: 'warrior',
  name: 'Guerrero',
  stats: Object.freeze({ hp: 100, armor: 0, protection: 0.35 }),
  movement: Object.freeze({ speed: 5, maxSpeed: 6.5, radius: 0.4, height: 1.86, turnSpeed: 14 }),
  weapon: Object.freeze({ id: 'sword', name: 'Espada' }),
  basic: Object.freeze({
    damage: 18,
    range: 2,
    arc: (Math.PI * 2) / 3,
    windup: 0.12,
    active: 0.12,
    duration: 0.42,
    cooldown: 0.75,
  }),
  passive: Object.freeze({ id: 'impetus', name: 'Ímpetu' }),
  skill: Object.freeze({ id: 'whirlwind', name: 'Torbellino' }),
  affinities: Object.freeze({
    earth: Object.freeze({
      description:
        'Aplica Quebranto: +15 % de daño recibido durante 3 s. Acertar con la espada concede una protección de 8 puntos cada 6 s.',
      upgradeDescription: 'La protección aumenta a 12/16 puntos; dura hasta 4 s. Afinidad III permite la maestría.',
      mastery: 'Guerrero sísmico',
      masteryDescription:
        'Cada segundo pulso de Torbellino libera una onda sísmica de 8 de daño en un radio de 3,2 m y aplica Quebranto.',
    }),
    air: Object.freeze({
      description:
        'Tajos con 0,35 m más de alcance y empuje. Torbellino atrae enemigos cercanos respetando su resistencia.',
      upgradeDescription:
        'El alcance adicional aumenta a 0,55/0,75 m y mejora el empuje y la atracción. Afinidad III permite la maestría.',
      mastery: 'Guerrero del vendaval',
      masteryDescription: 'Torbellino gana un 25 % de radio y atrae con más fuerza. No desplaza al jefe.',
    }),
    fire: Object.freeze({
      description: 'Tu espada y Torbellino aplican quemadura durante 3 s.',
      upgradeDescription:
        'Aumenta la proporción de fuego y la potencia de quemadura. Afinidad III permite la maestría.',
      mastery: 'Guerrero de la brasa',
      masteryDescription:
        'Los enemigos quemados explotan al morir. Torbellino añade dos pulsos y 0,8 s a su duración base.',
    }),
    water: Object.freeze({
      description: 'Empapa y ralentiza. La espada empuja a los enemigos, sin congelarlos.',
      upgradeDescription: 'Aumenta el empuje de la espada. Afinidad III permite la maestría.',
      mastery: 'Guerrero de la marea',
      masteryDescription:
        'Golpear con la espada a un enemigo ya empapado provoca salpicadura. Torbellino alcanza un 20 % más lejos.',
    }),
  }),
});
export const WARRIOR_KIT = Object.freeze({
  earth: Object.freeze({
    guard: Object.freeze([8, 12, 16]),
    guardDuration: 4,
    guardCooldown: 6,
    quakeDamage: 8,
    quakeRadius: 3.2,
  }),
  air: Object.freeze({
    reach: Object.freeze([0.35, 0.55, 0.75]),
    push: Object.freeze([0.35, 0.5, 0.65]),
    pull: Object.freeze([0.14, 0.2, 0.26]),
    pushCooldown: 0.75,
    pullCooldown: 0.4,
    masteryRadius: 1.25,
    masteryPull: 0.45,
  }),
  impetus: Object.freeze({ maxStacks: 4, damagePerStack: 0.05, timeout: 3 }),
  whirlwind: Object.freeze({ cooldown: 20, duration: 2.4, radius: 2.6, interval: 0.4, pulses: 6, damage: 12 }),
  mastery: Object.freeze({ fireDuration: 3.2, firePulses: 8, waterRadiusMultiplier: 1.2 }),
  effects: Object.freeze({
    wetPushBonus: 0.25,
    pushes: Object.freeze([0.2, 0.3, 0.4]),
    pushProtection: 0.5,
    explosionRadius: 1.8,
    explosionDamage: 12,
    splashRadius: 1.5,
    splashDamage: 8,
    splashCooldown: 1,
  }),
});

/** Versioned rules for the upcoming class migration; not enabled in the live run yet. */
export const ABILITY_RULES_VERSION = 1;
export const ABILITY_SLOTS = 4;
export const ABILITY_MAX_LEVEL = 10;
export const BRANCHES = ['power', 'expansion', 'specialization', 'rhythm'] as const;
export type Branch = typeof BRANCHES[number];
export type PlayableClass = 'warrior' | 'mage' | 'archer';
export type AbilityDefinition = Readonly<{ id: string; classId: PlayableClass; name: string; kind: 'basic' | 'skill'; initial: boolean }>;
const names = {
  warrior: ['Espada', 'Torbellino', 'Onda de acero', 'Hachas giratorias', 'Martillo de guerra', 'Lanzas espectrales', 'Estandarte de guerra', 'Guardia de represalia', 'Cadena de guerra'],
  mage: ['Proyectil mágico', 'Cataclismo', 'Lanzas arcanas', 'Orbes custodios', 'Sello de detonación', 'Haz rúnico', 'Nova arcana', 'Lluvia de fragmentos', 'Espejo arcano'],
  archer: ['Flecha', 'Lluvia de flechas', 'Salva en abanico', 'Disparo de asedio', 'Flecha rebotadora', 'Trampa de púas', 'Flechas de retorno', 'Baliza de caza', 'Estacas de guardia'],
} as const;
const ids = {
  warrior: ['sword', 'whirlwind', 'steel-wave', 'orbiting-axes', 'war-hammer', 'spectral-spears', 'war-banner', 'retaliation', 'war-chain'],
  mage: ['orb', 'cataclysm', 'arcane-lances', 'guardian-orbs', 'detonation', 'runic-beam', 'nova', 'fragments', 'mirror'],
  archer: ['arrow', 'rain', 'fan-volley', 'siege-shot', 'ricochet', 'spike-trap', 'return-arrows', 'hunting-beacon', 'stakes'],
} as const;
export const ABILITY_CATALOG: readonly AbilityDefinition[] = Object.freeze(
  (Object.keys(names) as PlayableClass[]).flatMap(classId => names[classId].map((name, i) => Object.freeze({
    id: `${classId}:${ids[classId][i]}`, classId, name, kind: i === 0 ? 'basic' as const : 'skill' as const, initial: i <= 1,
  }))),
);

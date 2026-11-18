import type { Element } from '../content/elements.ts';
import { isElement } from '../content/elements.ts';

/** Interface icons drawn for this project: 24 × 24 stroke paths, no external assets. */
const circle = (x: number, y: number, r: number) =>
  `M${x - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;
const SHIELD = 'M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z';
const HEART = 'M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z';
const ELEMENT_ICONS: Record<Element, string> = {
  fire: 'M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-9z',
  water: 'M12 3c4 5 6 8 6 11a6 6 0 0 1-12 0c0-3 2-6 6-11z',
  earth: 'M12 3l7 7-7 11-7-11zM5 10h14M12 3v18',
  air: 'M3 9h11a3 3 0 1 0-3-3M3 14h15a3 3 0 1 1-3 3M3 19h6',
};
export const ABILITY_ICONS: Readonly<Record<string, string>> = {
  'warrior:sword': 'M19 4l-11 11M19 4h-4M19 4v4M6 13l5 5M7.5 16.500L4 20',
  'warrior:whirlwind': 'M12 4a8 8 0 1 1-8 8M12 8a4 4 0 1 1-4 4M4 12l-2-3M4 12l3-2',
  'warrior:steel-wave': 'M5 18a14 14 0 0 1 14-12M5 13a9 9 0 0 1 9-8M10 19a9 9 0 0 1 9-8',
  'warrior:orbiting-axes': `${circle(12, 12, 7)}M12 2l2.5 3-2.5 3-2.5-3zM12 16l2.5 3-2.5 3-2.5-3z`,
  'warrior:war-hammer': 'M5 20l9-9M11 5l8 8-3 3-8-8z',
  'warrior:spectral-spears': 'M3 15L15 3M15 3h-3M15 3v3M6 20L18 8M18 8h-3M18 8v3M11 22l10-10',
  'warrior:war-banner': 'M7 21V3M7 4h11l-3 4 3 4H7',
  'warrior:retaliation': `${SHIELD}M12 8v5M12 16v.5`,
  'warrior:war-chain': 'M9 9a3 3 0 1 0-4 4l1 1a3 3 0 0 0 4-4M15 15a3 3 0 1 0 4-4l-1-1a3 3 0 0 0-4 4M10 14l4-4',
  'mage:orb': `${circle(12, 12, 5)}M19 5l-2 2M5 19l2-2M20 12h-1M5 12H4`,
  'mage:cataclysm': `${circle(14, 15, 5)}M4 3l6 7M3 9l4 4M10 2l3 5`,
  'mage:arcane-lances': 'M4 20L20 4M20 4l-5 1M20 4l-1 5M4 12l6-6M12 20l6-6',
  'mage:guardian-orbs': `${circle(12, 12, 2)}${circle(12, 4, 2)}${circle(5, 17, 2)}${circle(19, 17, 2)}`,
  'mage:detonation': `${circle(12, 12, 8)}M12 7v10M7 12h10M8.5 8.500l7 7M15.5 8.500l-7 7`,
  'mage:runic-beam': 'M3 12h18M3 8h11M3 16h11M18 9l3 3-3 3',
  'mage:nova': 'M12 2v6M12 16v6M2 12h6M16 12h6M5 5l4 4M15 15l4 4M19 5l-4 4M9 15l-4 4',
  'mage:fragments': 'M7 3l2 5-3 1zM16 6l2 5-3 1zM10 13l2 5-3 1zM4 21h16',
  'mage:mirror': 'M12 3l6 9-6 9-6-9zM12 3v18',
  'archer:arrow': 'M4 20L20 4M20 4h-6M20 4v6M4 20l1-5M4 20l5-1',
  'archer:rain':
    'M7 3v9M7 12l-2-2.500M7 12l2-2.500M12 7v9M12 16l-2-2.500M12 16l2-2.500M17 3v9M17 12l-2-2.500M17 12l2-2.500M4 21h16',
  'archer:fan-volley': 'M12 21V4M12 21L4 7M12 21l8-14M12 4l-2 3M12 4l2 3',
  'archer:siege-shot': 'M3 12h15M14 7l5 5-5 5M3 8v8',
  'archer:ricochet': 'M3 18l6-10 5 8 6-11M20 5h-4M20 5v4',
  'archer:spike-trap': 'M3 19h18M5 19l2-8 2 8M10 19l2-11 2 11M15 19l2-8 2 8',
  'archer:return-arrows': 'M5 12a7 7 0 1 1 3 5.700M5 12l-2.5 3M5 12l3.5 2.5',
  'archer:hunting-beacon': `${circle(12, 12, 8)}${circle(12, 12, 3)}M12 2v4M12 18v4M2 12h4M18 12h4`,
  'archer:stakes': 'M5 20l2-13 2 13M11 20l1-15 1 15M15 20l2-13 2 13',
};
export const STAT_ICONS: Readonly<Record<string, string>> = {
  damage: 'M12 3v13M12 3l-2.5 4M12 3l2.5 4M8 16h8M12 16v5',
  vitality: HEART,
  speed: 'M5 6l6 6-6 6M12 6l6 6-6 6',
  collection: `${circle(12, 12, 2.5)}M4 4l4 4M8 5v3H5M20 4l-4 4M16 5v3h3M4 20l4-4M8 19v-3H5M20 20l-4-4M16 19v-3h3`,
  celerity: 'M7 3h10M7 21h10M8 3c0 5 8 5 8 9s-8 4-8 9M16 3c0 5-8 5-8 9s8 4 8 9',
  cadence: 'M4 7l5 5-5 5M10 7l5 5-5 5M16 7l5 5-5 5',
  ballistics: 'M3 17c5-12 13-12 18-2M21 15l-4-.5M21 15l-.5-4',
  reach: 'M3 12h18M17 8l4 4-4 4M7 8l-4 4 4 4',
  area: `${circle(12, 12, 9)}${circle(12, 12, 4)}`,
  persistence: `${circle(12, 12, 9)}M12 7v5l3 3`,
  recovery: `${circle(12, 12, 9)}M12 7v10M7 12h10`,
  ward: SHIELD,
  temple: `${SHIELD}M8 11h8`,
};
export const RELIC_ICONS: Readonly<Record<string, string>> = {
  relic_edge: 'M8 3c0 8 2 14 4 18 2-4 4-10 4-18z',
  relic_heart: `${HEART}M12 11v5`,
  relic_boots: 'M8 3v10l-3 3v3h13v-3c0-2-3-3-6-3V3',
  relic_magnet: 'M6 4v8a6 6 0 0 0 12 0V4h-4v8a2 2 0 0 1-4 0V4zM6 8h4M14 8h4',
  relic_shell: `${circle(12, 14, 6)}M9 3l3 5 3-5M12 12v4M10 14h4`,
  relic_mender: `${circle(12, 12, 8)}M12 8v8M8 12h8`,
  relic_ember: ELEMENT_ICONS.fire,
  relic_tide: ELEMENT_ICONS.water,
  relic_stone: ELEMENT_ICONS.earth,
  relic_wind: ELEMENT_ICONS.air,
  relic_solitude: `${circle(12, 12, 8)}${circle(12, 12, 1.5)}`,
  relic_concord: `${circle(9, 12, 5)}${circle(15, 12, 5)}`,
};
const COINS = `${circle(12, 12, 8)}M12 7v10M14.5 9.500h-3.500a1.5 1.5 0 0 0 0 3h2a1.5 1.5 0 0 1 0 3H9.5`;
const STAR = 'M12 2l3 7 7 .8-5.2 4.800L18.4 22 12 18l-6.4 4 1.6-7.400L2 9.8 9 9z';

export type UpgradeKind =
  | 'learn'
  | 'improve'
  | 'exclusive'
  | 'stat'
  | 'affinity'
  | 'mastery'
  | 'relic'
  | 'coins'
  | 'technique';
const KIND_LABELS: Record<UpgradeKind, string> = {
  learn: 'Nueva habilidad',
  improve: 'Mejora de habilidad',
  exclusive: 'Elección exclusiva',
  stat: 'Estadística',
  affinity: 'Afinidad',
  mastery: 'Maestría',
  relic: 'Reliquia',
  coins: 'Monedas',
  technique: 'Técnica',
};

/** What a level-up or reward option is, read from its id only. */
export function upgradeKind(id: string): { kind: UpgradeKind; label: string } {
  const kind: UpgradeKind = id.startsWith('ability:')
    ? id.includes('/learn/')
      ? 'learn'
      : id.includes('/branch/')
        ? 'improve'
        : 'exclusive'
    : id.startsWith('stat:') || Object.hasOwn(STAT_ICONS, id)
      ? 'stat'
      : id.startsWith('relic_')
        ? 'relic'
        : id === 'salvage'
          ? 'coins'
          : id === 'mastery'
            ? 'mastery'
            : isElement(id) || id.startsWith('secondary') || id === 'affinity'
              ? 'affinity'
              : 'technique';
  return { kind, label: KIND_LABELS[kind] };
}

/** Icon path for an option, ability or relic id; undefined when only the text symbol exists (legacy techniques). */
export function iconPath(id: string, element = ''): string | undefined {
  if (id.startsWith('ability:')) return ABILITY_ICONS[id.slice(8).split('/')[0]];
  if (id.startsWith('stat:')) return STAT_ICONS[id.slice(5)];
  if (id.startsWith('secondary_')) {
    const second = id.slice(10);
    return isElement(second) ? ELEMENT_ICONS[second] : undefined;
  }
  if (id === 'salvage') return COINS;
  if (id === 'mastery') return STAR;
  if (isElement(id)) return ELEMENT_ICONS[id];
  if (id === 'affinity' || id === 'secondary-affinity') return isElement(element) ? ELEMENT_ICONS[element] : undefined;
  return ABILITY_ICONS[id] ?? RELIC_ICONS[id] ?? STAT_ICONS[id];
}

export function createIcon(path: string) {
  const namespace = 'http://www.w3.org/2000/svg',
    svg = document.createElementNS(namespace, 'svg'),
    shape = document.createElementNS(namespace, 'path');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  svg.classList.add('icon');
  shape.setAttribute('d', path);
  svg.append(shape);
  return svg;
}

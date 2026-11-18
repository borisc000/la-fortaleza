import { RELICS } from '../content/relics.ts';
import { ELEMENTS } from '../content/elements.ts';
import type { Progression } from '../domain/progression.ts';

export function relicSummary(p: Progression) { return `Reliquias ${p.relics.length}/4 · ${p.relics.length ? p.relics.map(id => RELICS[id].name).join(' · ') : 'Cuatro espacios libres'}`; }
export function affinitySummary(p: Progression) {
  if (!p.element) return 'Afinidad · elige al nivel 2';
  const rank = ['', 'I', 'II', 'III'];
  return `${ELEMENTS[p.element].name} ${rank[p.affinityRank]}${p.secondaryElement ? ` + ${ELEMENTS[p.secondaryElement].name} ${rank[p.secondaryRank]} de apoyo` : ''}${p.mastery ? ' · Maestría principal' : ''}`;
}

import { abilityData } from '../content/ranged-abilities.ts';
import { ABILITY_CATALOG } from '../content/ability-schema.ts';
import { TECHNIQUES, TECHNIQUE_LEVELS, classTechniques } from '../content/techniques.ts';
import type { Progression } from '../domain/progression.ts';

export function techniqueSummary(p: Progression) {
  if (p.development) return `Habilidades ${p.development.book.slotsUsed}/4 · ` + p.development.book.snapshot.map(s => `${abilityData(s.id).name} ${s.level}/10`).join(' · ');
  const equipped = p.equippedTechniques;
  return `Técnicas ${equipped.length}/3 · ` + Array.from({ length: 3 }, (_, i) => equipped[i] ? `${TECHNIQUES[equipped[i]].name} ${p.techniques[equipped[i]]}/3` : 'Espacio libre').join(' · ');
}
export function techniqueCatalog(p: Progression, level: number) {
  if (p.development) return ABILITY_CATALOG.filter(a => a.classId === p.definition.id).map(a => { const id = a.id, d = abilityData(id); const state = p.development!.book.snapshot.find(s => s.id === id); return { id, name: `${d.name}${state ? ` ${state.level}/10` : ''}`, description: d.base + (state?.mutation !== undefined ? ` · ${d.mutations[state.mutation]}` : '') + (state?.finisher !== undefined ? ` · ${d.finishers[state.finisher]}` : ''), status: state ? `Ramas: potencia ${state.branches.power}/3 · expansión ${state.branches.expansion}/3 · especialización ${state.branches.specialization}/3 · ritmo ${state.branches.rhythm}/3` : p.development!.book.slotsUsed < 4 ? 'Puede aparecer para aprender' : 'Cuatro espacios ocupados' }; });
  return classTechniques(p.definition.id).map(id => {
    const t = TECHNIQUES[id], rank = p.techniques[id] ?? 0;
    const status = rank === 3 ? 'Máximo III' : !rank && p.equippedTechniques.length === 3 ? 'Fuera de esta expedición: tres espacios ocupados' : level < TECHNIQUE_LEVELS[rank] ? `Requiere nivel ${TECHNIQUE_LEVELS[rank]}` : rank ? `Mejora a ${rank + 1}/3 · no ocupa otro espacio` : 'Aprender ocupa un espacio';
    return { id, name: `${t.name}${rank ? ` ${rank}/3` : ''}`, description: t.descriptions[Math.min(2, rank)], status };
  });
}

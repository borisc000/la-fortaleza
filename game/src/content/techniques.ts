import type { ClassId } from './class-definition.ts';

const technique = (classId: ClassId, name: string, symbol: string, values: readonly number[], descriptions: readonly string[]) => Object.freeze({ classId, name, symbol, values: Object.freeze(values), descriptions: Object.freeze(descriptions) });
export const TECHNIQUE_SLOTS = 3;
export const TECHNIQUE_LEVELS = Object.freeze([3, 5, 7]);
export const TECHNIQUES = Object.freeze({
  sweep: technique('warrior', 'Barrido', '◒', [30, 60, 90], ['La espada gana 30° de arco.', 'La espada gana 60° de arco.', 'La espada gana 90° de arco.']),
  lunge: technique('warrior', 'Estocada', '↗', [.35, .7, 1.05], ['La espada gana 0,35 m de alcance.', 'La espada gana 0,70 m de alcance.', 'La espada gana 1,05 m de alcance.']),
  guard: technique('warrior', 'Guardia firme', '◇', [.1, .15, .2], ['Reduce un 10 % el daño recibido, antes de la coraza.', 'Reduce un 15 % el daño recibido, antes de la coraza.', 'Reduce un 20 % el daño recibido, antes de la coraza.']),
  whirl: technique('warrior', 'Giro prolongado', '⟳', [2, 3, 4], ['Torbellino añade dos pulsos y dura 0,8 s más.', 'Torbellino añade tres pulsos y dura 1,2 s más.', 'Torbellino añade cuatro pulsos y dura 1,6 s más.']),
  echo: technique('mage', 'Eco arcano', '❖', [.35, .5, .65], ['Cada lanzamiento repite un proyectil al 35 % de daño base, sin cargas ni explosión arcana.', 'El eco causa un 50 % de daño base.', 'El eco causa un 65 % de daño base.']),
  resonance: technique('mage', 'Resonancia', '◎', [.4, .7, 1], ['La explosión del cuarto proyectil gana 0,4 m de radio.', 'La explosión del cuarto proyectil gana 0,7 m de radio.', 'La explosión del cuarto proyectil gana 1 m de radio.']),
  focus: technique('mage', 'Concentración', '✧', [.1, .17, .24], ['Reduce un 10 % el intervalo entre lanzamientos básicos.', 'Reduce un 17 % el intervalo entre lanzamientos básicos.', 'Reduce un 24 % el intervalo entre lanzamientos básicos.']),
  convergence: technique('mage', 'Convergencia', '◉', [.1, .2, .3], ['Cataclismo gana un 10 % de radio, además de la maestría.', 'Cataclismo gana un 20 % de radio, además de la maestría.', 'Cataclismo gana un 30 % de radio, además de la maestría.']),
  fan: technique('archer', 'Abanico', '⋔', [.35, .5, .65], ['Añade dos flechas laterales al 35 % de daño. No suman ni rompen Precisión.', 'Las flechas laterales causan un 50 % de daño.', 'Las flechas laterales causan un 65 % de daño.']),
  piercing: technique('archer', 'Punta larga', '⇥', [1, 2, 3], ['La flecha central atraviesa un blanco adicional.', 'La flecha central atraviesa dos blancos adicionales.', 'La flecha central atraviesa tres blancos adicionales.']),
  cadence: technique('archer', 'Cadencia', '»', [.08, .16, .24], ['Reduce un 8 % el intervalo entre disparos básicos.', 'Reduce un 16 % el intervalo entre disparos básicos.', 'Reduce un 24 % el intervalo entre disparos básicos.']),
  downpour: technique('archer', 'Lluvia extensa', '⋮', [.1, .2, .3], ['Lluvia de flechas gana un 10 % de radio, además de la maestría.', 'Lluvia de flechas gana un 20 % de radio, además de la maestría.', 'Lluvia de flechas gana un 30 % de radio, además de la maestría.']),
});
export type TechniqueId = keyof typeof TECHNIQUES;
export type TechniqueRanks = Readonly<Partial<Record<TechniqueId, number>>>;
export const TECHNIQUE_IDS = Object.freeze(Object.keys(TECHNIQUES) as TechniqueId[]);
export function isTechnique(id: string): id is TechniqueId { return Object.hasOwn(TECHNIQUES, id); }
export function classTechniques(classId: ClassId) { return TECHNIQUE_IDS.filter(id => TECHNIQUES[id].classId === classId); }
export function techniqueValue(ranks: TechniqueRanks | undefined, id: TechniqueId) { const rank = ranks?.[id] ?? 0; return rank > 0 ? TECHNIQUES[id].values[Math.min(3, Math.floor(rank)) - 1] ?? 0 : 0; }

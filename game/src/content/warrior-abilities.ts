import type { AbilityState } from '../domain/ability-book.ts';
export const WARRIOR_ABILITIES = {
  sword: { name: 'Espada', base: 'Tajo automático; Ímpetu potencia los golpes consecutivos.', b: '+30° de arco', c: '+0,35 m de alcance', mutations: ['Barrido: +30° de arco', 'Estocada: +0,4 m y +10 % de daño'], finishers: ['Ímpetu duradero: caduca en 5 s', 'Filo maestro: +40 % de daño'], damage: 18, radius: 2, cooldown: .75, duration: .42 },
  whirlwind: { name: 'Torbellino', base: 'Seis pulsos de acero a tu alrededor, mientras sigues atacando.', b: '+0,25 m de radio', c: '+1 pulso y +0,4 s', mutations: ['Huracán: +25 % de radio, −15 % de daño', 'Triturador: −15 % de radio, +35 % de daño'], finishers: ['Segunda vuelta: tres pulsos extra al 50 %, sin efectos derivados', 'Centro: +60 % de daño a menos de 1,2 m'], damage: 12, radius: 2.6, cooldown: 20, duration: 2.4 },
  'steel-wave': { name: 'Onda de acero', base: 'Un corte que vuela 7 m y atraviesa hasta tres enemigos.', b: '+1 onda lateral al 40 %', c: '+1 blanco y +0,75 m de recorrido', mutations: ['Abanico: +35° de apertura', 'Retorno: vuelve al 40 % de daño'], finishers: ['Brecha: +100 % de daño al primer blanco', 'Media luna: estalla al terminar, radio 2 m, daño 60 %'], damage: 24, radius: 7, cooldown: 6, duration: 0 },
  'orbiting-axes': { name: 'Hachas giratorias', base: 'Un hacha orbita durante cuatro segundos y corta al pasar.', b: '+1 hacha al 50 %', c: '+0,75 s de duración', mutations: ['Órbita amplia: +0,6 m de radio', 'Órbita cerrada: −0,3 m y +50 % de giro'], finishers: ['Ronda exterior: dos hachas en otra órbita al 35 %', 'Acero persistente: +3 s de duración'], damage: 10, radius: 1.7, cooldown: 9, duration: 4 },
  'war-hammer': { name: 'Martillo de guerra', base: 'Un golpe pesado frente a ti, con daño de área.', b: '+0,25 m de radio', c: '+15 % de daño contra élite y jefe', mutations: ['Ruptura: centro del golpe 1,5 m más lejos', 'Cerco: golpe centrado en ti, −20 % de daño'], finishers: ['Réplica: segundo golpe al 50 % tras 0,6 s', 'Verdugo: +75 % contra enemigos con menos de 35 % de vida'], damage: 38, radius: 2, cooldown: 8, duration: .65 },
  'spectral-spears': { name: 'Lanzas espectrales', base: 'Una lanza a 8 m que atraviesa dos enemigos.', b: '+1 lanza al 45 %', c: '+1 blanco atravesado', mutations: ['Falange: las lanzas avanzan paralelas', 'Cerco: busca amenazas alrededor, daño +20 %'], finishers: ['Asedio: +80 % al primer blanco', 'Línea de muerte: no pierde daño al atravesar'], damage: 22, radius: 8, cooldown: 5, duration: 0 },
  'war-banner': { name: 'Estandarte de guerra', base: 'Una zona de 3 m concede +12 % de daño mientras permaneces dentro.', b: '+0,4 m de radio', c: '+1 s de duración', mutations: ['Avance: el estandarte te sigue, radio −25 %', 'Bastión: fijo, bono base de daño +20 %'], finishers: ['Resistencia: reduce un 15 % el daño recibido dentro', 'Última orden: conserva el bono 3 s al salir'], damage: 0, radius: 3, cooldown: 14, duration: 4 },
  retaliation: { name: 'Guardia de represalia', base: 'Barrera de 12 durante 3 s; al terminar o romperse libera una onda de 16.', b: '+0,25 m al radio de la onda', c: '+4 de barrera', mutations: ['Guardia larga: +2 s de protección', 'Represalia inmediata: la onda sale al activar'], finishers: ['Muro de hierro: +16 de barrera', 'Castigo: +100 % de daño de onda'], damage: 16, radius: 2, cooldown: 12, duration: 3 },
  'war-chain': { name: 'Cadena de guerra', base: 'Golpea y atrae hasta 0,6 m a un enemigo a 6 m; respeta muros y resistencias.', b: '+1 blanco al 50 %', c: '+0,15 m de arrastre', mutations: ['Cadena larga: +3 m de alcance', 'Cadena circular: alcance −1 m, daño +20 %'], finishers: ['Yunque: +12 % de daño posterior por 2 s, no suma con Quebranto', 'Eslabones: hasta dos blancos extra al 35 %, sin encadenar de nuevo'], damage: 18, radius: 6, cooldown: 7, duration: .35 },
} as const;
export type WarriorAbilityId = keyof typeof WARRIOR_ABILITIES;
export const warriorId = (id: string) => id.slice('warrior:'.length) as WarriorAbilityId;
export const GENERAL_STATS = {
  damage: ['Poder', '+8 % de daño base'], vitality: ['Vitalidad', '+15 de vida máxima y recupera 15'], speed: ['Paso', '+0,3 m/s, hasta 6,5 m/s'], collection: ['Recogida', '+0,4 m de atracción y recogida'],
  celerity: ['Celeridad', '−4 % de recarga de habilidades'], cadence: ['Cadencia básica', '−4 % de intervalo del ataque básico'], ballistics: ['Balística', '+12 % de velocidad de proyectiles'], reach: ['Alcance', '+0,4 m de recorrido y alcance de ataques'], area: ['Amplitud', '+4 % al radio de áreas'], persistence: ['Persistencia', '+6 % a la duración de órbitas y ventanas persistentes'], recovery: ['Recuperación', 'Cura 2/3/4/5 de vida cada 20 bajas reales'], ward: ['Resguardo', 'Barrera de 4/8/12/16 al inicio y cada 25 s'], temple: ['Temple', 'Reduce 5 % el daño recibido, hasta 20 %'],
} as const;
export type GeneralStat = keyof typeof GENERAL_STATS;
export type GeneralRanks = Readonly<Partial<Record<GeneralStat, number>>>;
export function warriorParameters(state: AbilityState, stats: GeneralRanks = {}) {
  const id = warriorId(state.id), d = WARRIOR_ABILITIES[id], b = state.branches, m = state.mutation, f = state.finisher;
  const radiusFlat = id === 'sword' ? b.specialization * .35 + (m === 1 ? .4 : 0) : id === 'war-banner' ? b.expansion * .4 : id === 'orbiting-axes' ? (m === 0 ? .6 : m === 1 ? -.3 : 0) : ['whirlwind', 'war-hammer', 'retaliation'].includes(id) ? b.expansion * .25 : id === 'steel-wave' ? b.specialization * .75 : id === 'war-chain' ? (m === 0 ? 3 : m === 1 ? -1 : 0) : 0;
  const area = ['whirlwind', 'war-hammer', 'retaliation', 'war-banner', 'orbiting-axes'].includes(id);
  let radius = (d.radius + radiusFlat + (area ? 0 : (stats.reach ?? 0) * .4)) * (area ? 1 + (stats.area ?? 0) * .04 : 1);
  if (id === 'whirlwind' && m !== undefined) radius *= m === 0 ? 1.25 : .85;
  if (id === 'war-banner' && m === 0) radius *= .75;
  radius = Math.min(d.radius * (area ? 1.8 : 1.75), radius);
  let damage = d.damage * (1 + b.power * .12);
  if (id === 'sword') damage *= (m === 1 ? 1.1 : 1) * (f === 1 ? 1.4 : 1);
  if (id === 'whirlwind') damage *= m === 0 ? .85 : m === 1 ? 1.35 : 1;
  if (id === 'war-hammer' && m === 1) damage *= .8;
  if ((id === 'war-chain' || id === 'spectral-spears') && m === 1) damage *= 1.2;
  if (id === 'retaliation' && f === 1) damage *= 2;
  const reduction = id === 'sword' ? Math.min(.45, b.rhythm * .06 + (stats.cadence ?? 0) * .04) : Math.min(.5, b.rhythm * .08 + (stats.celerity ?? 0) * .04);
  const cooldown = Math.max(id === 'sword' ? .25 : 1, d.cooldown * (1 - reduction));
  let duration: number = d.duration;
  if (id === 'whirlwind') duration += b.specialization * .4;
  if (id === 'orbiting-axes') duration = Math.min(8, (duration + b.specialization * .75 + (f === 1 ? 3 : 0)) * (1 + (stats.persistence ?? 0) * .06));
  if (id === 'war-banner') duration = Math.min(8, (duration + b.specialization) * (1 + (stats.persistence ?? 0) * .06));
  if (id === 'retaliation' && m === 0) duration = 5;
  return Object.freeze({ id, radius, damage, cooldown, duration, speed: 14 * (1 + (stats.ballistics ?? 0) * .12), count: 1 + b.expansion, pierce: Math.min(10, (id === 'steel-wave' ? 3 : 2) + b.specialization), barrier: Math.min(40, 12 + b.specialization * 4 + (f === 0 ? 16 : 0)), banner: (m === 1 ? .2 : .12) + b.power * .02 });
}

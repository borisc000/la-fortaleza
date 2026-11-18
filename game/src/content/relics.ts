import type { Element } from './elements.ts';

const relic = (name: string, description: string, cost: number, element?: Element, mode?: 'pure' | 'dual') =>
  Object.freeze({ name, description, cost, element, mode });
export const RELIC_SLOTS = 4;
export const RELICS = Object.freeze({
  relic_edge: relic('Colmillo de hierro', '+12 % de daño base de tu clase.', 28),
  relic_heart: relic('Corazón de roble', '+25 de vida máxima y recuperas 25 al equiparlo.', 26),
  relic_boots: relic('Botas del caminante', '+0,4 m/s de movimiento, respetando el límite de clase.', 24),
  relic_magnet: relic('Piedra de llamada', '+0,8 m de atracción y recogida de esencia.', 22),
  relic_shell: relic('Medallón de hierro', 'Reduce un 10 % el daño recibido, antes de la coraza.', 30),
  relic_mender: relic(
    'Sello de renovación',
    'Recupera 2 de vida al abatir un enemigo, como máximo una vez por segundo.',
    32,
  ),
  relic_ember: relic(
    'Ascua perpetua',
    '+30 % de potencia de quemadura. Requiere Fuego principal o secundario.',
    30,
    'fire',
  ),
  relic_tide: relic(
    'Perla de las mareas',
    'Empapado dura 1,5 s más. Requiere Agua principal o secundaria.',
    26,
    'water',
  ),
  relic_stone: relic(
    'Runa de fractura',
    'Quebranto dura 1,5 s más. Requiere Tierra principal o secundaria.',
    26,
    'earth',
  ),
  relic_wind: relic(
    'Pluma del vendaval',
    '+0,5 m/s, con el límite de clase. Requiere Aire principal o secundario.',
    24,
    'air',
  ),
  relic_solitude: relic(
    'Sello de pureza',
    '+15 % de daño base. Impide adquirir un segundo elemento en esta expedición.',
    30,
    undefined,
    'pure',
  ),
  relic_concord: relic('Nexo de concordia', '+12 % de daño base. Requiere dos afinidades.', 30, undefined, 'dual'),
});
export type RelicId = keyof typeof RELICS;
export const RELIC_IDS = Object.freeze(Object.keys(RELICS) as RelicId[]);
export function isRelic(id: string): id is RelicId {
  return Object.hasOwn(RELICS, id);
}
export function hasRelic(relics: readonly RelicId[] | undefined, id: RelicId) {
  return relics?.includes(id) ?? false;
}

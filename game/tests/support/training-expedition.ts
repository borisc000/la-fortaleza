import type { ExpeditionLayout } from '../../src/content/expedition.ts';

// Small rule-test arenas retain their original coordinates independently of the real map.
export const TRAINING_EXPEDITION: ExpeditionLayout = {
  start: { x: 0, z: 7, yaw: 0 }, arrivalName: 'La explanada',
  chest: { x: 5, z: 11 }, supply: { x: -4, z: 10 }, coins: { x: 0, z: 12 },
  shop: { x: 19, z: 20 }, capture: { x: -7, z: 28 },
};

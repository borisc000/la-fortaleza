import { WARRIOR } from './classes/warrior.ts';
import { EXPEDITION } from './expedition.ts';
export const SIMULATION_STEP = 1 / 60;
export const CAMERA = { distance: 12, minDistance: 4, maxDistance: 18, wheelSensitivity: 0.006, fov: 65, near: 0.1, far: 300, targetHeight: 1.3, pitch: 0.42, minPitch: -0.08, maxPitch: 1.05, recovery: 7 } as const;
export const PLAYER = Object.freeze({ ...WARRIOR.movement, step: SIMULATION_STEP });
export const PLAY_AREA = { minX: -138, maxX: 142, minZ: -20, maxZ: 240 } as const;
export const VIEWS = [
  { label: EXPEDITION.arrivalName, position: [EXPEDITION.start.x, 0, EXPEDITION.start.z], yaw: EXPEDITION.start.yaw },
  { label: 'Junto a la muralla', position: [-10, 0, -13.6], yaw: Math.PI },
  { label: 'Ante la puerta', position: [4, 0, -9], yaw: 0 },
] as const;

export const CAMPAIGN = { eliteAt: 150, bossAt: 360, arrivalWarning: 6, spawnWarning: 1.5, maxEnemies: 100, corpseSeconds: 2, restStart: 56 } as const;
export const LOCAL_HORDE = { minDistance: 11, maxDistance: 23, ringStep: 4, localRadius: 26, checkInterval: 1, replenishInterval: 2.5, retireDistance: 38, retireAfter: 8 } as const;
export const WAVES = [
  { at: 0, label: 'La guardia despierta', interval: 4, count: 6, archers: 0, chargers: 0, localTarget: 20 },
  { at: 60, label: 'Fuego desde las almenas', interval: 3.5, count: 9, archers: 1, chargers: 0, localTarget: 40 },
  { at: 150, label: 'La marcha del portador', interval: 3, count: 12, archers: 1, chargers: 1, localTarget: 60 },
  { at: 240, label: 'El asedio de los muertos', interval: 2.5, count: 15, archers: 1, chargers: 1, localTarget: 90 },
] as const;

import type { RelicId } from './relics.ts';
import type { UpgradeId } from './progression.ts';

export const CAPTURE = { radius: 6, warning: 3, duration: 25, reward: 25, interval: 6, reinforcements: 3 } as const;
export type OfferId = 'heal' | 'damage' | 'vitality' | 'speed' | RelicId;
export type ShopOffer = { id: OfferId; name: string; description: string; cost: number; stock: number; heal?: number; upgrade?: UpgradeId; relic?: RelicId };
export const SHOP_OFFERS: readonly ShopOffer[] = [
  { id: 'heal', name: 'Ungüento de campaña', description: 'Recupera hasta 40 de vida.', cost: 8, stock: 2, heal: 40 },
  { id: 'damage', name: 'Filo templado', description: '+1 rango de daño para los ataques de tu clase.', cost: 18, stock: 1, upgrade: 'damage' },
  { id: 'vitality', name: 'Vigor de hierro', description: '+1 rango: +20 de vida máxima y recuperas 20.', cost: 18, stock: 1, upgrade: 'vitality' },
  { id: 'speed', name: 'Paso firme', description: '+1 rango: +0,5 m/s de movimiento.', cost: 16, stock: 1, upgrade: 'speed' },
];

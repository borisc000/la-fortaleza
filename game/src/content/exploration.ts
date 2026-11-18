export const EXPLORATION = {
  pickupRadius: 1.6, interactionRadius: 2.6, discoveryRadius: 24,
  combatSupplyEvery: 24, combatSupplyHeal: 12, combatSupplyCap: 4,
  supplyHeal: 20, fountainHeal: 35, fountainUses: 2,
  chestMin: 8, chestExtra: 7, groundCoins: 3,
} as const;
export type ObjectKind = 'chest' | 'fountain' | 'coins' | 'supply' | 'shop' | 'capture';
// Ground footprints of persistent props. The capture circle remains playable.
// Used props keep their footprint; coins and supplies never exclude enemies.
export const OBJECT_FOOTPRINT: Record<ObjectKind, number> = {
  chest: .75, fountain: .8, shop: 1.65, capture: .2, coins: 0, supply: 0,
};
export const OBJECT_NAMES: Record<ObjectKind, string> = {
  chest: 'Cofre', fountain: 'Fuente', coins: 'Monedas', supply: 'Suministro de curación',
  shop: 'Mercader de campaña', capture: 'Puesto de captura',
};

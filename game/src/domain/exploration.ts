import { HORDE_COIN_KILLS } from '../content/progression.ts';
import { EXPLORATION as RULES, OBJECT_NAMES, OBJECT_FOOTPRINT } from '../content/exploration.ts';
import type { ObjectKind } from '../content/exploration.ts';
import { LANDMARKS } from '../content/map.ts';
import { PLAYER } from '../content/config.ts';
import { EXPEDITION, OPENING_GUARD_OFFSETS } from '../content/expedition.ts';
import { routeClearance } from '../content/terrain-layout.ts';
import type { ExpeditionLayout } from '../content/expedition.ts';
import { Navigation, clearPath } from './navigation.ts';
import { overlaps } from './movement.ts';
import type { Bounds, Point, Solid } from './movement.ts';
import type { CombatEvent } from './combat.ts';
import { CAPTURE } from '../content/activities.ts';

export type WorldObject = Point & {
  id: number; kind: ObjectKind; status: 'available' | 'used' | 'closed'; discovered: boolean;
  amount: number; uses: number; region: string; combatDrop?: boolean;
};
type Health = { hp: number; maxHp: number; heal(amount: number): void };
export class Exploration {
  readonly objects: WorldObject[] = [];
  coins = 0;
  chestsOpened = 0;
  fountainUses = 0;
  notice = '';
  noticeRemaining = 0;
  private sequence = 0;
  private credited = new Set<number>();
  private stopped = false;
  private coinKills = 0;
  private denseEconomy: boolean;
  private solids: readonly Solid[];
  constructor(bounds: Bounds, solids: readonly Solid[], seed: number, heroRadius: number = PLAYER.radius, denseEconomy = false, layout: ExpeditionLayout = EXPEDITION) {
    this.denseEconomy = denseEconomy;
    this.solids = solids;
    // Independent stream: scenery does not alter the combat director's seeded sequence.
    let state = (seed ^ 0x6ac1e57d) >>> 0;
    const random = () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; };
    const nav = new Navigation(bounds, solids, heroRadius), start = layout.start;
    nav.update(start);
    const place = (anchor: Point, kind: ObjectKind, region: string, spread = 2.5) => {
      const roadside = layout.roadsidePlacement && ['chest', 'fountain', 'shop'].includes(kind);
      for (let attempt = 0; attempt < (roadside ? 120 : 40); attempt++) {
        const ring = roadside && attempt >= 20 ? 4 + Math.floor((attempt - 20) / 24) * 3 : 0;
        const angle = (attempt % 24) * Math.PI / 12;
        const searchRadius = ring ? .7 : attempt < 20 ? spread : spread + 3;
        const p = { x: anchor.x + Math.sin(angle) * ring + (random() * 2 - 1) * searchRadius, z: anchor.z + Math.cos(angle) * ring + (random() * 2 - 1) * searchRadius };
        const radius = kind === 'capture' ? CAPTURE.radius + .4 : kind === 'shop' ? 2 : kind === 'chest' || kind === 'fountain' ? 1.1 : .6;
        if (p.x < bounds.minX + radius || p.x > bounds.maxX - radius || p.z < bounds.minZ + radius || p.z > bounds.maxZ - radius) continue;
        if (solids.some(s => overlaps(p, radius, s)) || !nav.waypoint(p, start)) continue;
        if (roadside) {
          if (routeClearance(p) < OBJECT_FOOTPRINT[kind] + .8 || !clearPath(anchor, p, solids, heroRadius)) continue;
          // Keep the capture fighting circle free even though it is placed after rewards.
          if (Math.hypot(p.x - layout.capture.x, p.z - layout.capture.z) < CAPTURE.radius + OBJECT_FOOTPRINT[kind] + 2) continue;
          if (OPENING_GUARD_OFFSETS.some(offset => Math.hypot(p.x - start.x - offset.x, p.z - start.z - offset.z) < OBJECT_FOOTPRINT[kind] + .9)) continue;
        }
        if (this.objects.some(o => Math.hypot(o.x - p.x, o.z - p.z) < Math.max(3, radius + 1))) continue;
        const amount = kind === 'chest' ? RULES.chestMin + Math.floor(random() * RULES.chestExtra) : kind === 'fountain' ? RULES.fountainHeal : kind === 'supply' ? RULES.supplyHeal : RULES.groundCoins;
        this.objects.push({ ...p, id: ++this.sequence, kind, region, amount, uses: kind === 'fountain' ? RULES.fountainUses : 1, status: 'available', discovered: false });
        return;
      }
    };
    // Early rewards are close enough to learn the system without crossing the whole territory.
    place(layout.chest, 'chest', layout.arrivalName, .8);
    place(layout.supply, 'supply', layout.arrivalName, .8);
    place(layout.coins, 'coins', layout.arrivalName, .5);
    LANDMARKS.slice(1).forEach((landmark, i) => {
      place(landmark, i % 3 === 0 ? 'fountain' : 'chest', landmark.name);
      place({ x: landmark.x + 4, z: landmark.z + 1 }, i % 2 === 0 ? 'coins' : 'supply', landmark.name, 1);
    });
    place(layout.shop, 'shop', 'Camino del mercader', .6);
    place(layout.capture, 'capture', 'Puesto de la fortaleza', .8);
  }
  /** Spawn clearance only: props do not become walls for combat or navigation. */
  allowsSpawn(point: Point, enemyRadius: number) {
    return this.objects.every(object => {
      const footprint = OBJECT_FOOTPRINT[object.kind];
      return footprint === 0 || Math.hypot(object.x - point.x, object.z - point.z) >= footprint + enemyRadius + .35;
    });
  }
  announce(message: string) { this.tell(message); }
  private tell(message: string) { this.notice = message; this.noticeRemaining = 3; }
  receive(events: readonly CombatEvent[]) {
    if (this.stopped) return;
    for (const event of events) {
      if (event.type !== 'death' || event.target <= 0 || !['thrall', 'soldier', 'archer', 'charger'].includes(event.enemyKind ?? '') || this.credited.has(event.target)) continue;
      this.credited.add(event.target);
      if (this.denseEconomy) {
        this.coinKills++;
        if (this.coinKills % RULES.combatSupplyEvery === 0 && this.objects.filter(o => o.combatDrop && o.kind === 'supply' && o.status === 'available').length < RULES.combatSupplyCap)
          this.objects.push({ x: event.x, z: event.z, id: ++this.sequence, kind: 'supply', status: 'available', discovered: false, amount: RULES.combatSupplyHeal, uses: 1, region: '', combatDrop: true });
        if (this.coinKills % HORDE_COIN_KILLS !== 0) continue;
      }
      const nearby = this.objects.find(o => o.kind === 'coins' && o.status === 'available' && Math.hypot(o.x - event.x, o.z - event.z) < 1 && clearPath(o, event, this.solids, .04));
      if (nearby) nearby.amount++;
      else this.objects.push({ x: event.x, z: event.z, id: ++this.sequence, kind: 'coins', status: 'available', discovered: false, amount: 1, uses: 1, region: '' });
    }
  }
  step(dt: number, hero: Point, health: Health) {
    if (this.stopped || dt <= 0 || health.hp <= 0) return;
    this.noticeRemaining = Math.max(0, this.noticeRemaining - dt);
    for (let i = this.objects.length - 1; i >= 0; i--) {
      const object = this.objects[i], distance = Math.hypot(object.x - hero.x, object.z - hero.z);
      if (distance > RULES.discoveryRadius || !clearPath(hero, object, this.solids, .04)) continue;
      object.discovered = true;
      if (distance > RULES.pickupRadius || object.status !== 'available') continue;
      if (object.kind === 'coins') { this.coins += object.amount; this.tell(`+${object.amount} monedas`); this.objects.splice(i, 1); }
      else if (object.kind === 'supply' && health.hp < health.maxHp) {
        const restored = Math.min(object.amount, health.maxHp - health.hp);
        health.heal(restored); this.tell(`Suministro · +${Math.ceil(restored)} vida`); this.objects.splice(i, 1);
      }
    }
  }
  focus(hero: Point): WorldObject | undefined {
    if (this.stopped) return undefined;
    return this.objects.filter(o => (o.kind === 'chest' || o.kind === 'fountain' || o.kind === 'shop') && Math.hypot(o.x - hero.x, o.z - hero.z) <= RULES.interactionRadius && clearPath(hero, o, this.solids, .04))
      .sort((a, b) => Number(a.status === 'used') - Number(b.status === 'used') || Math.hypot(a.x - hero.x, a.z - hero.z) - Math.hypot(b.x - hero.x, b.z - hero.z) || a.id - b.id)[0];
  }
  interact(id: number, hero: Point, health: Health) {
    if (this.stopped || health.hp <= 0) return false;
    const object = this.objects.find(o => o.id === id);
    if (!object || (object.kind !== 'chest' && object.kind !== 'fountain') || object.status !== 'available' || Math.hypot(object.x - hero.x, object.z - hero.z) > RULES.interactionRadius || !clearPath(hero, object, this.solids, .04)) return false;
    if (object.kind === 'fountain' && health.hp >= health.maxHp) { this.tell('Vida completa · la fuente conserva sus usos'); return false; }
    if (object.kind === 'chest') { this.coins += object.amount; this.chestsOpened++; this.tell(`Cofre abierto · +${object.amount} monedas`); }
    else { const restored = Math.min(object.amount, health.maxHp - health.hp); health.heal(restored); this.fountainUses++; this.tell(`Fuente · +${Math.ceil(restored)} vida`); }
    object.uses--; object.discovered = true;
    if (object.uses <= 0) object.status = 'used';
    return true;
  }
  label(object: WorldObject) {
    if (object.kind === 'capture') return object.status === 'closed' ? 'Captura cerrada' : object.status === 'used' ? 'Puesto asegurado' : `Captura · ${CAPTURE.reward} monedas`;
    if (object.status === 'used') return object.kind === 'chest' ? 'Cofre abierto' : 'Fuente agotada';
    return object.kind === 'fountain' ? `Fuente · ${object.uses} usos` : OBJECT_NAMES[object.kind];
  }
  destinations(hero: Point) {
    return this.objects.filter(o => o.discovered && ['chest', 'fountain', 'shop', 'capture'].includes(o.kind) && Math.hypot(o.x - hero.x, o.z - hero.z) <= 45)
      .sort((a, b) => Number(a.status !== 'available') - Number(b.status !== 'available') || Math.hypot(a.x - hero.x, a.z - hero.z) - Math.hypot(b.x - hero.x, b.z - hero.z) || a.id - b.id).slice(0, 3);
  }
  stop() { this.stopped = true; this.noticeRemaining = 0; }
}

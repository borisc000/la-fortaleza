import type { AbilityState } from '../domain/ability-book.ts';
import { WARRIOR_ABILITIES, warriorParameters } from './warrior-abilities.ts';
import type { GeneralRanks } from './warrior-abilities.ts';

type Definition = {
  name: string;
  base: string;
  b: string;
  c: string;
  mutations: readonly [string, string];
  finishers: readonly [string, string];
  damage: number;
  radius: number;
  cooldown: number;
  duration: number;
};
export const RANGED_ABILITIES: Readonly<Record<string, Definition>> = Object.freeze({
  'mage:orb': {
    name: 'Proyectil mágico',
    base: 'Proyectil de 24; cada cuarto lanzamiento estalla con poder arcano.',
    b: '+0,3 m al radio de explosión arcana',
    c: '+1 blanco atravesado',
    mutations: ['Resonancia: explosión +0,4 m', 'Concentración: intervalo −10 %'],
    finishers: ['Acumulación rápida: potencia cada tercer básico', 'Impacto arcano: explosión +60 % de daño'],
    damage: 24,
    radius: 10,
    cooldown: 0.9,
    duration: 0.4,
  },
  'mage:cataclysm': {
    name: 'Cataclismo',
    base: 'Tres pulsos de 18 en una zona fija de 3,2 m.',
    b: '+0,25 m de radio',
    c: '+1 pulso',
    mutations: ['Concentrado: radio −20 %, daño +35 %', 'Fracturado: dos zonas de 2 m al 55 %'],
    finishers: ['Último sello: último pulso +100 %', 'Desastre extenso: radio +35 %'],
    damage: 18,
    radius: 3.2,
    cooldown: 14,
    duration: 1.7,
  },
  'mage:arcane-lances': {
    name: 'Lanzas arcanas',
    base: 'Lanza de 26 que recorre 11 m y atraviesa dos blancos.',
    b: '+1 lanza lateral al 40 %',
    c: '+1 blanco atravesado',
    mutations: ['Haz estrecho: trayectorias paralelas', 'Dispersión: abanico de 50°'],
    finishers: ['Aguja del vacío: primer blanco +80 %', 'Perforación perfecta: sin pérdida al atravesar'],
    damage: 26,
    radius: 11,
    cooldown: 5,
    duration: 0,
  },
  'mage:guardian-orbs': {
    name: 'Orbes custodios',
    base: 'Un orbe de 9 orbita a 1,8 m durante 5 s.',
    b: '+1 orbe al 50 %',
    c: '+0,75 s de duración',
    mutations: ['Órbita lejana: +0,8 m de radio', 'Órbita veloz: giro +50 %'],
    finishers: ['Anillo doble: dos orbes exteriores al 35 %', 'Guardián: barrera de 15 al activar'],
    damage: 9,
    radius: 1.8,
    cooldown: 10,
    duration: 5,
  },
  'mage:detonation': {
    name: 'Sello de detonación',
    base: 'Explota tras 0,7 s: 40 de daño en 2,4 m.',
    b: '+0,25 m de radio',
    c: 'Preparación −0,1 s, mínimo 0,3 s',
    mutations: ['Doble sello: dos zonas al 60 %', 'Sello hambriento: atrae hasta 0,3 m'],
    finishers: ['Onda residual: repite al 40 % tras 0,8 s', 'Implosión: centro de 0,8 m hace el doble'],
    damage: 40,
    radius: 2.4,
    cooldown: 8,
    duration: 0.7,
  },
  'mage:runic-beam': {
    name: 'Haz rúnico',
    base: 'Cuatro pulsos de 8 en una línea de 9 m; hasta cuatro blancos por pulso.',
    b: '+0,15 m de anchura',
    c: '+1 blanco por pulso',
    mutations: ['Barrido: gira 45° durante la acción', 'Haz partido: dos líneas al 60 %'],
    finishers: ['Canal largo: tres pulsos adicionales', 'Foco absoluto: +75 % si alcanza un solo blanco'],
    damage: 8,
    radius: 9,
    cooldown: 7,
    duration: 1.4,
  },
  'mage:nova': {
    name: 'Nova arcana',
    base: 'Onda de 22 alrededor del héroe, radio 3 m.',
    b: '+0,3 m de radio',
    c: '+0,1 m de empuje',
    mutations: ['Doble frente: segunda onda al 40 % tras 0,6 s', 'Borde cortante: anillo exterior +50 %'],
    finishers: ['Expansión: radio +40 %', 'Pulso defensivo: reduce daño recibido 20 % durante 2 s'],
    damage: 22,
    radius: 3,
    cooldown: 9,
    duration: 0.65,
  },
  'mage:fragments': {
    name: 'Lluvia de fragmentos',
    base: 'Cuatro impactos de 12 repartidos durante 2 s en una zona de 3 m.',
    b: '+1 impacto',
    c: '+0,3 m de radio',
    mutations: ['Bombardeo: zona fija, daño +20 %', 'Persecución: sigue al blanco, daño −15 %'],
    finishers: ['Gran fragmento: último impacto triple en 1,5 m', 'Constelación: cuatro impactos extra al 50 %'],
    damage: 12,
    radius: 3,
    cooldown: 11,
    duration: 2,
  },
  'mage:mirror': {
    name: 'Espejo arcano',
    base: 'Durante 4 s repite cada tercer básico con un eco al 35 %.',
    b: '+10 puntos porcentuales de daño del eco',
    c: '+1 s de duración',
    mutations: ['Réplica doble: dos ecos al 60 % de su daño', 'Eco penetrante: atraviesa dos blancos adicionales'],
    finishers: ['Memoria: eco cada segundo básico', 'Reflejo mayor: daño del eco +60 %'],
    damage: 0,
    radius: 10,
    cooldown: 12,
    duration: 4,
  },
  'archer:arrow': {
    name: 'Flecha',
    base: 'Flecha de 22. Acertar acumula Precisión; fallar la pierde.',
    b: '+1 blanco atravesado',
    c: '+10 % de velocidad y +0,75 m de alcance',
    mutations: ['Abanico: dos laterales al 40 %, sin Precisión', 'Cadencia: intervalo −10 %'],
    finishers: ['Precisión firme: racha dura 6 s', 'Punta maestra: central +50 % de daño'],
    damage: 22,
    radius: 12,
    cooldown: 0.65,
    duration: 0.32,
  },
  'archer:rain': {
    name: 'Lluvia de flechas',
    base: 'Cuatro descargas de 10 sobre una zona fija de 3 m.',
    b: '+0,25 m de radio',
    c: '+1 descarga',
    mutations: ['Cortina: radio +30 %, daño −15 %', 'Punto de caza: radio −20 %, daño +35 %'],
    finishers: ['Aguacero: tres descargas adicionales', 'Flechas pesadas: +60 % a élite y jefe'],
    damage: 10,
    radius: 3,
    cooldown: 16,
    duration: 2,
  },
  'archer:fan-volley': {
    name: 'Salva en abanico',
    base: 'Tres flechas a 10 m: central 18 y laterales al 40 %.',
    b: '+2 flechas laterales al 35 %',
    c: '+1 blanco atravesado',
    mutations: ['Salva estrecha: abanico de 25°', 'Cerco: abanico de 110°'],
    finishers: ['Doble salva: repite al 50 %', 'Puntas abiertas: daño +30 %'],
    damage: 18,
    radius: 10,
    cooldown: 4,
    duration: 0.35,
  },
  'archer:siege-shot': {
    name: 'Disparo de asedio',
    base: 'Flecha de 42 a 13 m; atraviesa hasta cuatro blancos.',
    b: '+1 blanco atravesado',
    c: '+1 m de alcance y +10 % de velocidad',
    mutations: ['Cazador de gigantes: +35 % a élite y jefe', 'Línea devastadora: ancho +0,25 m'],
    finishers: ['Punta implacable: sin pérdida al atravesar', 'Golpe final: explosión final en 2 m al 75 %'],
    damage: 42,
    radius: 13,
    cooldown: 7,
    duration: 0,
  },
  'archer:ricochet': {
    name: 'Flecha rebotadora',
    base: 'Flecha de 16; salta a dos blancos adicionales a 3 m, perdiendo 20 % por salto.',
    b: '+1 salto',
    c: '+0,5 m entre blancos',
    mutations: [
      'Caza dispersa: prioriza blancos no alcanzados',
      'Rebote de duelo: una vuelta al primero con intermediario',
    ],
    finishers: ['Cadena tensa: sin pérdida por salto', 'Dos trayectorias: segunda flecha al 45 %'],
    damage: 16,
    radius: 10,
    cooldown: 6,
    duration: 0,
  },
  'archer:spike-trap': {
    name: 'Trampa de púas',
    base: 'Trampa a 8 m; arma en 0,6 s, causa 24 en 1,8 m y ralentiza 20 % durante 2 s.',
    b: '+1 trampa al 50 % en posición distinta',
    c: '+0,2 m de radio',
    mutations: ['Emboscada: +35 % contra blancos con vida llena', 'Campo de púas: dos pulsos de 6, uno por segundo'],
    finishers: ['Cerco: ralentización dura 4 s', 'Dientes de hierro: activación +70 %'],
    damage: 24,
    radius: 1.8,
    cooldown: 8,
    duration: 2.7,
  },
  'archer:return-arrows': {
    name: 'Flechas de retorno',
    base: 'Dos flechas de 14 que recorren 7 m y regresan al origen; dos blancos por trayecto.',
    b: '+1 flecha al 45 %',
    c: '+1 blanco por trayecto',
    mutations: ['Ala ancha: separación lateral +1 m', 'Regreso feroz: vuelta +50 % de daño'],
    finishers: ['Tercera pasada: otro trayecto al 40 %', 'Retorno rápido: velocidad +70 %, daño +20 %'],
    damage: 14,
    radius: 7,
    cooldown: 7,
    duration: 0,
  },
  'archer:hunting-beacon': {
    name: 'Baliza de caza',
    base: 'Marca durante 4 s una zona de 3 m: enemigos dentro reciben +12 % de daño del héroe.',
    b: '+0,4 m de radio',
    c: '+1 s de duración',
    mutations: ['Marca móvil: sigue al blanco y permanece donde muere', 'Terreno elegido: bono base +20 %'],
    finishers: [
      'Presa mayor: +15 puntos porcentuales contra élite y jefe',
      'Marca persistente: conserva la marca 2 s al salir',
    ],
    damage: 0,
    radius: 3,
    cooldown: 13,
    duration: 4,
  },
  'archer:stakes': {
    name: 'Estacas de guardia',
    base: 'Tres estacas en arco durante 4 s; 14 al cruzar, sin bloquear el paso.',
    b: '+1 estaca',
    c: '+0,75 s de duración',
    mutations: ['Media luna: arco de 180°', 'Pasillo: dos líneas paralelas'],
    finishers: [
      'Puntas dobles: dos activaciones por estaca, intervalo 0,8 s',
      'Madera astillada: al consumirse estalla en 1 m al 40 %',
    ],
    damage: 14,
    radius: 2.5,
    cooldown: 10,
    duration: 4,
  },
});
export function abilityData(id: string): Definition {
  return id.startsWith('warrior:')
    ? WARRIOR_ABILITIES[id.slice(8) as keyof typeof WARRIOR_ABILITIES]
    : RANGED_ABILITIES[id];
}
export function rangedParameters(s: AbilityState, stats: GeneralRanks = {}) {
  const d = abilityData(s.id),
    id = s.id.split(':')[1],
    b = s.branches,
    m = s.mutation,
    f = s.finisher;
  const basic = id === 'orb' || id === 'arrow';
  const area = [
    'cataclysm',
    'guardian-orbs',
    'detonation',
    'nova',
    'fragments',
    'rain',
    'spike-trap',
    'hunting-beacon',
  ].includes(id);
  const flat = ['cataclysm', 'detonation', 'rain'].includes(id)
    ? 0.25 * b.expansion
    : id === 'nova'
      ? 0.3 * b.expansion
      : id === 'hunting-beacon'
        ? 0.4 * b.expansion
        : id === 'guardian-orbs' && m === 0
          ? 0.8
          : id === 'fragments'
            ? 0.3 * b.specialization
            : id === 'spike-trap'
              ? 0.2 * b.specialization
              : id === 'arrow'
                ? 0.75 * b.specialization
                : id === 'siege-shot'
                  ? b.specialization
                  : 0;
  let radius =
    (d.radius + flat + (area || id === 'stakes' ? 0 : (stats.reach ?? 0) * 0.4)) *
    (area ? 1 + (stats.area ?? 0) * 0.04 : 1);
  if (id === 'cataclysm') radius *= (m === 0 ? 0.8 : 1) * (f === 1 ? 1.35 : 1);
  if (id === 'rain') radius *= m === 0 ? 1.3 : m === 1 ? 0.8 : 1;
  if (id === 'nova' && f === 0) radius *= 1.4;
  radius = Math.min(d.radius * (area ? 1.8 : 1.75), radius);
  let damage = d.damage * (1 + b.power * 0.12);
  if (id === 'cataclysm' && m === 0) damage *= 1.35;
  if (id === 'rain') damage *= m === 0 ? 0.85 : m === 1 ? 1.35 : 1;
  if (id === 'fragments') damage *= m === 0 ? 1.2 : m === 1 ? 0.85 : 1;
  if (id === 'arrow' && f === 1) damage *= 1.5;
  if (id === 'fan-volley' && f === 1) damage *= 1.3;
  if (id === 'return-arrows' && f === 1) damage *= 1.2;
  const cooldown = Math.max(
    basic ? 0.25 : 1,
    d.cooldown *
      (1 -
        Math.min(
          basic ? 0.45 : 0.5,
          b.rhythm * (basic ? 0.06 : 0.08) +
            (basic ? (stats.cadence ?? 0) : (stats.celerity ?? 0)) * 0.04 +
            (basic && m === 1 ? 0.1 : 0),
        )),
  );
  let duration = d.duration;
  if (['guardian-orbs', 'stakes', 'mirror', 'hunting-beacon'].includes(id))
    duration = Math.min(
      d.duration * 2,
      (duration + b.specialization * (id === 'guardian-orbs' || id === 'stakes' ? 0.75 : 1)) *
        (1 + (stats.persistence ?? 0) * 0.06),
    );
  return {
    id,
    basic,
    area,
    damage,
    radius,
    cooldown,
    duration,
    width: (0.4 + b.expansion * 0.15) * (1 + (stats.area ?? 0) * 0.04),
    speed:
      (s.id.startsWith('mage:') ? 16 : 24) *
      (1 + (stats.ballistics ?? 0) * 0.12 + (id === 'arrow' || id === 'siege-shot' ? b.specialization * 0.1 : 0)) *
      (id === 'return-arrows' && f === 1 ? 1.7 : 1),
    banner: (m === 1 ? 0.2 : 0.12) + b.power * 0.02,
  };
}
export function abilityParameters(s: AbilityState, stats: GeneralRanks = {}) {
  return s.id.startsWith('warrior:') ? warriorParameters(s, stats) : rangedParameters(s, stats);
}

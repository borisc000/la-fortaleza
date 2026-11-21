import * as THREE from 'three';

// E2.2 surface finish. One shader pass on the existing tiled materials, driven by world position, so it
// needs no extra textures and never depends on how finely a merged mesh is tessellated:
// - macro tone variation breaks the 2.4 m repeat of the textures;
// - damp, grime and moss gather at the foot of walls; dirt and lichen settle on upward faces;
// - rain streaks run down vertical faces; soot rises above the gate torches;
// - iron rusts in patches, losing metalness where it does.
export type Weathering = {
  /** Strength of macro tone variation (0 = flat texture). */
  variation: number;
  /** Darkening of the damp band at the foot of every surface. */
  grime: number;
  /** Height of the damp band, in metres, before noise. */
  dampHeight: number;
  /** Moss tint inside the damp band. */
  moss: number;
  /** Dirt and lichen on faces looking up. */
  top: number;
  /** Rain streaks on vertical faces. */
  streaks: number;
  /** Rust patches; for iron only. */
  rust: number;
};

export const STONE_WEATHERING: Weathering = {
  variation: 1,
  grime: 0.42,
  dampHeight: 1.5,
  moss: 0.42,
  top: 0.45,
  streaks: 0.2,
  rust: 0,
};
/** E3.2 natural rock: lichen on top and a short damp foot, so boulders do not turn green all over. */
export const ROCK_WEATHERING: Weathering = {
  variation: 1,
  grime: 0.3,
  dampHeight: 0.45,
  moss: 0.5,
  top: 0.6,
  streaks: 0.08,
  rust: 0,
};
export const WOOD_WEATHERING: Weathering = {
  variation: 0.8,
  grime: 0.35,
  dampHeight: 0.8,
  moss: 0.3,
  top: 0.3,
  streaks: 0.12,
  rust: 0,
};
export const IRON_WEATHERING: Weathering = {
  variation: 0.5,
  grime: 0.2,
  dampHeight: 0.6,
  moss: 0,
  top: 0,
  streaks: 0,
  rust: 0.5,
};

/** Soot sources shared by every weathered material: xyz position, w strength. */
export const SOOT_SOURCES = 2;

const COMMON = /* glsl */ `
varying vec3 vWeatherPos;
varying vec3 vWeatherNormal;
`;

const NOISE = /* glsl */ `
float wHash(vec3 p) {
  p = fract(p * 0.3183099 + 0.1);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}
float wNoise(vec3 x) {
  vec3 i = floor(x), f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(wHash(i), wHash(i + vec3(1, 0, 0)), f.x), mix(wHash(i + vec3(0, 1, 0)), wHash(i + vec3(1, 1, 0)), f.x), f.y),
    mix(mix(wHash(i + vec3(0, 0, 1)), wHash(i + vec3(1, 0, 1)), f.x), mix(wHash(i + vec3(0, 1, 1)), wHash(i + vec3(1, 1, 1)), f.x), f.y),
    f.z);
}
float wFbm(vec3 p) {
  return wNoise(p) * 0.55 + wNoise(p * 2.07 + 13.1) * 0.3 + wNoise(p * 4.31 + 7.7) * 0.15;
}
`;

const FRAGMENT_PARS = /* glsl */ `
uniform vec4 uWeatherA; // variation, grime, dampHeight, moss
uniform vec4 uWeatherB; // top, streaks, rust, unused
uniform vec4 uWeatherSoot[${SOOT_SOURCES}];
${NOISE}
`;

// Cost matters: walls fill most of the screen. Every noise call sits behind the condition that makes it visible
// (damp band, upward faces, iron), and one two-octave field drives tone, hue and tints.
const FRAGMENT_COLOR = /* glsl */ `
float wRust = 0.0;
{
  vec3 wp = vWeatherPos;
  vec3 wn = normalize(vWeatherNormal);
  float macro = wNoise(wp * 0.17) * 0.65 + wNoise(wp * 0.39 + 13.1) * 0.35;
  diffuseColor.rgb *= mix(1.0, mix(0.8, 1.1, macro), uWeatherA.x);
  diffuseColor.rgb *= mix(vec3(1.0), mix(vec3(1.04, 1.0, 0.93), vec3(0.94, 0.98, 1.04), smoothstep(0.2, 0.8, macro)), uWeatherA.x);
  // Damp foot: an irregular band, darker and mossy where the noise gathers.
  float damp = 0.0;
  if (wp.y < uWeatherA.z * 1.6) {
    float edge = uWeatherA.z * (0.7 + wNoise(vec3(wp.x * 0.6, 0.0, wp.z * 0.6) + 5.0) * 0.9);
    damp = 1.0 - smoothstep(0.0, max(edge, 0.01), wp.y);
    diffuseColor.rgb *= 1.0 - damp * uWeatherA.y;
    if (damp > 0.0 && uWeatherA.w > 0.0) {
      float mossy = smoothstep(0.42, 0.72, wNoise(wp * 0.85 + 3.0) * 0.7 + wNoise(wp * 1.9 + 7.0) * 0.3);
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.19, 0.23, 0.12) * (0.75 + 0.5 * macro), damp * mossy * uWeatherA.w);
    }
  }
  // Dirt and lichen on faces looking up.
  float up = smoothstep(0.55, 0.95, wn.y);
  if (up > 0.0 && uWeatherB.x > 0.0) {
    float lichen = smoothstep(0.5, 0.8, wNoise(wp * 1.7 + 11.0));
    diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * mix(vec3(0.66, 0.68, 0.6), vec3(0.62, 0.7, 0.5), lichen), up * uWeatherB.x);
  }
  // Rain streaks follow the horizontal axis of each vertical face.
  if (up < 1.0 && uWeatherB.y > 0.0) {
    vec2 across = normalize(vec2(-wn.z, wn.x) + vec2(1e-4));
    float streak = smoothstep(0.58, 0.88, wNoise(vec3(dot(wp.xz, across) * 2.3, wp.y * 0.11, 0.0)));
    diffuseColor.rgb *= 1.0 - streak * (1.0 - up) * uWeatherB.y;
  }
  // Soot plumes above the torches.
  for (int i = 0; i < ${SOOT_SOURCES}; i++) {
    vec3 d = wp - uWeatherSoot[i].xyz;
    float above = smoothstep(-0.25, 0.45, d.y);
    float plume = 1.0 - smoothstep(0.15, 1.45, length(d * vec3(1.0, 0.36, 1.0)));
    diffuseColor.rgb *= 1.0 - above * plume * uWeatherSoot[i].w;
  }
  // Rust patches on iron only, heavier towards the ground where water sits.
  if (uWeatherB.z > 0.0) {
    wRust = smoothstep(0.5, 0.8, wFbm(wp * 2.6) + damp * 0.18) * uWeatherB.z;
    diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.2, 0.1, 0.05) * (0.8 + 0.4 * macro), wRust);
  }
}
`;

/**
 * Adds weathering to a material in place and returns it. The same uniform objects back every compiled program,
 * so soot sources can be set once for all materials.
 */
export function weather(material: THREE.MeshStandardMaterial, settings: Weathering, soot: THREE.Vector4[]) {
  const uniforms = {
    uWeatherA: { value: new THREE.Vector4(settings.variation, settings.grime, settings.dampHeight, settings.moss) },
    uWeatherB: { value: new THREE.Vector4(settings.top, settings.streaks, settings.rust, 0) },
    uWeatherSoot: { value: soot },
  };
  material.onBeforeCompile = shader => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader.replace('#include <common>', `#include <common>\n${COMMON}`).replace(
      '#include <project_vertex>',
      `#include <project_vertex>
vec4 wWorld = vec4(transformed, 1.0);
vec4 wNormal = vec4(objectNormal, 0.0);
#ifdef USE_BATCHING
wWorld = batchingMatrix * wWorld;
wNormal = batchingMatrix * wNormal;
#endif
#ifdef USE_INSTANCING
wWorld = instanceMatrix * wWorld;
wNormal = instanceMatrix * wNormal;
#endif
vWeatherPos = (modelMatrix * wWorld).xyz;
vWeatherNormal = normalize(mat3(modelMatrix) * wNormal.xyz);`,
    );
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${COMMON}\n${FRAGMENT_PARS}`)
      .replace('#include <color_fragment>', `#include <color_fragment>\n${FRAGMENT_COLOR}`)
      .replace(
        '#include <roughnessmap_fragment>',
        '#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, 0.97, wRust);',
      )
      .replace(
        '#include <metalnessmap_fragment>',
        '#include <metalnessmap_fragment>\nmetalnessFactor *= 1.0 - 0.85 * wRust;',
      );
  };
  material.customProgramCacheKey = () => `weathering-${settings.rust > 0 ? 'metal' : 'surface'}`;
  material.userData.weathering = settings;
  return material;
}

/** Ground wear is full inside `inner` metres of the centre and gone beyond `outer` (E2.3 sample; E3.1 covers the map). */
export type GroundZone = { x: number; z: number; inner: number; outer: number };
/** E3.1 sector surfaces: how many sector rectangles the ground shader blends. */
export const GROUND_SECTORS = 6;
/**
 * Per-sector ground character, blended across 12 m wide borders. Rectangles are minX, minZ, maxX, maxZ;
 * parameters are wet (damp, darker, smoother patches), green (moss tint), light (brightness offset) and ruts.
 */
export type GroundSectors = { rects: THREE.Vector4[]; params: THREE.Vector4[] };
export type GroundWear = {
  /** How far, as a fraction of the half-width, a ribbon edge may recede. 0 keeps the straight edge. */
  fray: number;
  /** Second, rotated texture sample blended by noise, hiding the repeat. */
  bomb: number;
  /** Macro tone variation. */
  variation: number;
  /** Colour the frayed rim fades to (usually the surrounding mud). */
  rim: THREE.Color;
  /** Brightness multiplier inside the zone, to settle pale ribbons into the mud. */
  shade?: number;
  /** Wheel ruts along a frayed ribbon, scaled by each sector's rut parameter. */
  ruts?: number;
  /** Sector character shared by every ground material. */
  sectors?: GroundSectors;
};

/**
 * Wears a ground material inside the sample zone. Frayed materials need a float `edge` attribute:
 * 0 on the centre line of a ribbon or patch, 1 on its border.
 */
export function wearGround(material: THREE.MeshStandardMaterial, zone: GroundZone, wear: GroundWear) {
  const empty = Array.from({ length: GROUND_SECTORS }, () => new THREE.Vector4());
  const uniforms = {
    uGroundZone: { value: new THREE.Vector4(zone.x, zone.z, zone.inner, zone.outer) },
    uGroundWear: { value: new THREE.Vector4(wear.fray, wear.bomb, wear.variation, wear.shade ?? 1) },
    uGroundRim: { value: wear.rim },
    uGroundRuts: { value: wear.ruts ?? 0 },
    uSectorRect: { value: wear.sectors?.rects ?? empty },
    uSectorParam: { value: wear.sectors?.params ?? empty },
  };
  const fray = wear.fray > 0;
  material.onBeforeCompile = shader => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
varying vec3 vGroundPos;
varying vec4 vGroundSector;
uniform vec4 uSectorRect[${GROUND_SECTORS}];
uniform vec4 uSectorParam[${GROUND_SECTORS}];
${fray ? 'attribute float edge; varying float vGroundEdge;' : ''}
// Per vertex: the ground plane has a vertex every ~1.9 m, finer than the 12 m border blend.
// Sector character, blended over 12 m across each border; outside every rectangle it fades to neutral.
vec4 groundSector(vec2 p) {
  vec4 sum = vec4(0.0);
  float total = 0.0;
  for (int i = 0; i < ${GROUND_SECTORS}; i++) {
    vec4 r = uSectorRect[i];
    float w = smoothstep(r.x - 6.0, r.x + 6.0, p.x) * (1.0 - smoothstep(r.z - 6.0, r.z + 6.0, p.x))
      * smoothstep(r.y - 6.0, r.y + 6.0, p.y) * (1.0 - smoothstep(r.w - 6.0, r.w + 6.0, p.y));
    sum += uSectorParam[i] * w;
    total += w;
  }
  return total > 0.0 ? sum / total : vec4(0.0);
}`,
      )
      .replace(
        '#include <project_vertex>',
        `#include <project_vertex>
vGroundPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
vGroundSector = groundSector(vGroundPos.xz);${fray ? ' vGroundEdge = edge;' : ''}`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
varying vec3 vGroundPos;
${fray ? 'varying float vGroundEdge;' : ''}
uniform vec4 uGroundZone;
uniform vec4 uGroundWear; // fray, bomb, variation, shade
uniform vec3 uGroundRim;
uniform float uGroundRuts;
varying vec4 vGroundSector;
${NOISE}`,
      )
      .replace(
        '#include <map_fragment>',
        `float gZone = 1.0 - smoothstep(uGroundZone.z, uGroundZone.w, distance(vGroundPos.xz, uGroundZone.xy));
#ifdef USE_MAP
  vec4 gTex = texture2D(map, vMapUv);
  // The second, rotated sample only inside the zone; gradients come from outside the branch.
  vec2 gUv = mat2(0.8, -0.6, 0.6, 0.8) * vMapUv * 0.71 + vec2(0.37, 0.11);
  vec2 gDx = dFdx(gUv), gDy = dFdy(gUv);
  if (gZone > 0.0 && uGroundWear.y > 0.0) {
    vec4 gAlt = textureGrad(map, gUv, gDx, gDy);
    gTex = mix(gTex, gAlt, smoothstep(0.3, 0.7, wNoise(vec3(vGroundPos.xz * 0.13, 1.7))) * gZone * uGroundWear.y);
  }
  diffuseColor *= gTex;
#endif`,
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
float gWet = 0.0;
if (gZone > 0.0) {
  float gTone = wNoise(vGroundPos * 0.12) * 0.7 + wNoise(vGroundPos * 0.29 + 4.0) * 0.3;
  diffuseColor.rgb *= mix(1.0, mix(0.82, 1.12, gTone), gZone * uGroundWear.z);
  diffuseColor.rgb *= mix(1.0, uGroundWear.w, gZone);
  // Sector character: damp patches, moss tint and brightness, each fading in with the zone.
  vec4 gSector = vGroundSector * gZone;
  gWet = gSector.x * smoothstep(0.45, 0.75, wNoise(vec3(vGroundPos.xz * 0.06, 5.3)));
  diffuseColor.rgb *= 1.0 - 0.3 * gWet;
  diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.84, 1.0, 0.72), gSector.y * smoothstep(0.3, 0.7, gTone));
  diffuseColor.rgb *= 1.0 + gSector.z;
${
  fray
    ? `  // The edge can only recede by 42 % and its rim starts 30 % inside that, so the centre needs no noise.
  if (vGroundEdge > 0.27) {
    vec3 gEdgePos = vec3(vGroundPos.x, 0.0, vGroundPos.z);
    float gRag = wNoise(gEdgePos * 0.55) * 0.7 + wNoise(gEdgePos * 1.3 + 2.0) * 0.3;
    float gLimit = 1.0 - gZone * (0.1 + 0.32 * gRag) * uGroundWear.x;
    if (vGroundEdge > gLimit) discard;
    float gRim = smoothstep(gLimit - 0.3, gLimit, vGroundEdge) * gZone;
    diffuseColor.rgb = mix(diffuseColor.rgb, uGroundRim, gRim * 0.55);
    // Two wheel ruts, darker and wetter, a little inside each border.
    float gRut = (1.0 - smoothstep(0.03, 0.09, abs(vGroundEdge - 0.42))) * gSector.w * uGroundRuts;
    diffuseColor.rgb *= 1.0 - 0.4 * gRut;
    gWet = max(gWet, gRut * 0.8);
  }`
    : ''
}
}`,
      )
      .replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>
roughnessFactor *= 1.0 - 0.45 * gWet;`,
      );
  };
  material.customProgramCacheKey = () => `ground-${fray ? 'fray' : 'plain'}`;
  return material;
}

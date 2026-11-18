import { createModelAnimation } from './model-animation.ts';
import type { ClassDefinition } from './content/class-definition.ts';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createWarriorAsset } from './rendering/warrior-asset.ts';
import { createMageAsset } from './rendering/mage-asset.ts';
import { createArcher } from './rendering/archer.ts';
import { loadWarriorAsset } from './rendering/warrior-asset.ts';
import { createWarrior as organicWarrior } from './rendering/organic-warrior.ts';
import { loadArcherAsset } from './rendering/archer.ts';
import { createArcher as previousArcher } from './rendering/previous-archer.ts';
import { loadMageAsset } from './rendering/mage-asset.ts';
import { createMage as previousMage } from './rendering/previous-mage.ts';
import { createWarrior as previousWarrior } from './rendering/previous-warrior.ts';
import { createWarrior as beforeWarrior } from './rendering/approved-warrior.ts';
import { createMage as beforeMage } from './rendering/approved-mage.ts';
import { createArcher as beforeArcher } from './rendering/approved-archer.ts';
import * as THREE from 'three';
import { createHeroView } from './rendering/hero.ts';
import { classDefinition } from './content/classes.ts';
import { ENEMIES } from './content/enemies.ts';
import { createEnemyModelPreview } from './rendering/combat.ts';
import { createHordeView } from './rendering/horde.ts';
import { createExplorationView } from './rendering/exploration.ts';
import { loadAssets } from './rendering/assets.ts';
import { createWorld } from './rendering/world.ts';
export type ModelView = {
  root: THREE.Object3D;
  character?: ReturnType<typeof createHeroView>;
  framing?: { box: THREE.Box3; radius: number };
  dispose(): void;
  animation?: ReturnType<typeof createModelAnimation>;
};
export type CatalogItem = {
  id: string;
  name: string;
  category: string;
  source: string;
  note: string;
  create(): ModelView | Promise<ModelView>;
};
function characterPreview(view: ReturnType<typeof createHeroView>, definition: ClassDefinition): ModelView {
  return {
    root: view.root,
    character: view,
    animation: createModelAnimation(view, definition),
    dispose() {
      const geometries = new Set<THREE.BufferGeometry>(),
        materials = new Set<THREE.Material>();
      view.root.traverse(node => {
        if (node instanceof THREE.SkinnedMesh) node.skeleton.dispose();
        if (node instanceof THREE.Mesh) {
          geometries.add(node.geometry);
          (Array.isArray(node.material) ? node.material : [node.material]).forEach(m => materials.add(m));
        }
      });
      geometries.forEach(g => g.dispose());
      materials.forEach(m => m.dispose());
    },
  };
}

export const catalog: CatalogItem[] = [
  ...(['warrior', 'mage', 'archer'] as const).flatMap((id, i) =>
    [false, true].map(before => ({
      id: before ? `${id}-before` : id,
      name: ['Guerrero', 'Mago', 'Arquero'][i] + (before ? ' · Base histórica' : ' · Actual pulido'),
      category: 'Personajes',
      source: id === 'archer' && !before ? 'art/archer-ranger.blend' : `rendering/${before ? 'approved-' : ''}${id}.ts`,
      note: before
        ? 'Revisar silueta, proporciones y equipo.'
        : id === 'warrior'
          ? 'Veterano con cuero, cota de malla, placas curvas y espada articulada. Revisar reposo, movimiento y habilidad.'
          : id === 'archer'
            ? 'Explorador con jubón de cuero y capa corta. En Habilidad puedes revisar el agarre del arco y el anclaje de la cuerda en la mejilla.'
            : 'Malla independiente con esqueleto, creada en Blender. Figura delgada, capucha abierta y túnica continua.',
      create: async () => {
        if (!before && id === 'warrior') await loadWarriorAsset();
        if (!before && id === 'mage') await loadMageAsset();
        if (!before && id === 'archer') await loadArcherAsset();
        return characterPreview(
          before ? [beforeWarrior, beforeMage, beforeArcher][i]() : createHeroView(classDefinition(id)),
          classDefinition(id),
        );
      },
    })),
  ),
  ...(['warrior', 'mage', 'archer'] as const).map((id, index) => ({
    id: id + '-approved',
    name: ['Guerrero', 'Mago', 'Arquero'][index] + ' · Aprobado 07 nov',
    category: 'Personajes',
    source: 'assets/models/approved-2026-11-07/' + id + '.glb',
    note: 'Malla aprobada el 7 de noviembre, conservada antes de esta pasada de pulido.',
    create: async () => {
      const { scene } = await new GLTFLoader().loadAsync(
        `${import.meta.env.BASE_URL}assets/models/approved-2026-11-07/${id}.glb`,
      );
      const view =
        id === 'warrior'
          ? createWarriorAsset(classDefinition(id).basic, scene)!
          : id === 'mage'
            ? createMageAsset(scene)!
            : createArcher(scene);
      // Factories own copies. Release the temporary loaded template.
      scene.traverse(node => {
        if (node instanceof THREE.SkinnedMesh) node.skeleton.dispose();
        if (node instanceof THREE.Mesh) {
          node.geometry.dispose();
          (Array.isArray(node.material) ? node.material : [node.material]).forEach(m => m.dispose());
        }
      });
      return characterPreview(view, classDefinition(id));
    },
  })),
  {
    id: 'warrior-organic',
    name: 'Guerrero · Formas orgánicas anteriores',
    category: 'Personajes',
    source: 'rendering/organic-warrior.ts',
    note: 'Versión inmediatamente anterior preservada.',
    create: () => characterPreview(organicWarrior(), classDefinition('warrior')),
  },
  {
    id: 'archer-previous',
    name: 'Arquero · Pulido anterior',
    category: 'Personajes',
    source: 'rendering/previous-archer.ts',
    note: 'Versión inmediatamente anterior, con hombros equilibrados y paños reflejados.',
    create: () => characterPreview(previousArcher(), classDefinition('archer')),
  },
  {
    id: 'warrior-previous',
    name: 'Guerrero · Pulido anterior',
    category: 'Personajes',
    source: 'rendering/previous-warrior.ts',
    note: 'Versión anterior preservada para comparar la rigidez de torso, hombreras y faldones.',
    create: () => {
      return characterPreview(previousWarrior(), classDefinition('warrior'));
    },
  },
  {
    id: 'mage-previous',
    name: 'Mago · Pulido anterior',
    category: 'Personajes',
    source: 'rendering/previous-mage.ts',
    note: 'Versión anterior conservada para comparación.',
    create: () => characterPreview(previousMage(), classDefinition('mage')),
  },
  ...(['thrall', 'soldier', 'archer', 'charger', 'elite', 'boss'] as const).map(kind => ({
    id: `enemy-${kind}`,
    name: ENEMIES[kind].name,
    category: 'Enemigos',
    source: kind === 'thrall' ? 'rendering/horde.ts' : 'rendering/combat.ts',
    note: 'Modelo provisional. Revisar identificación de amenaza, contraste y equipo. Vista estática sin avisos de combate.',
    create: () => {
      if (kind !== 'thrall') return createEnemyModelPreview(kind);
      const root = new THREE.Group(),
        view = createHordeView(root);
      const body = root.children[0] as THREE.InstancedMesh;
      body.count = 1;
      body.setMatrixAt(0, new THREE.Matrix4());
      body.instanceMatrix.needsUpdate = true;
      return { root, dispose: () => view.dispose() };
    },
  })),
  ...(['chest', 'fountain', 'coins', 'supply', 'shop', 'capture'] as const).map((kind, i) => ({
    id: kind,
    name: ['Cofre', 'Fuente', 'Monedas', 'Suministro', 'Puesto del mercader', 'Estandarte de captura'][i],
    category: 'Objetos',
    source: 'rendering/exploration.ts',
    note: 'Objeto real del escenario, en estado disponible. Revisar lectura a distancia, materiales y detalle.',
    create: () => {
      const root = new THREE.Scene(),
        view = createExplorationView(root);
      view.update(
        [{ id: 1, x: 0, z: 0, kind, status: 'available', discovered: true, amount: 1, uses: 1, region: 'Laboratorio' }],
        undefined,
        0,
      );
      root.traverse(o => {
        if (o instanceof THREE.Mesh && o.geometry instanceof THREE.RingGeometry) o.visible = false;
      });
      return { root, dispose: () => view.dispose() };
    },
  })),
  {
    id: 'world',
    name: 'Los dominios exteriores',
    category: 'Escenario',
    source: 'rendering/world.ts',
    note: 'Conjunto completo del mapa, incluido terreno lejano. La arquitectura está agrupada por material: todavía no se inspeccionan torres y muros individualmente.',
    create: async () => {
      const assets = await loadAssets(4, () => {}),
        world = createWorld(assets);
      world.scene.remove(world.hero.root);
      const lights: THREE.Object3D[] = [];
      world.scene.traverse(o => {
        if (o instanceof THREE.Light) lights.push(o);
      });
      lights.forEach(o => o.removeFromParent());
      return {
        root: world.scene,
        dispose() {
          world.scene.add(world.hero.root);
          world.dispose();
          assets.dispose();
        },
      };
    },
  },
];

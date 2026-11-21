# Procedencia de recursos — 1.3

Descarga: 31 de octubre de 2026. Texturas y HDR de **Poly Haven**, licencia **CC0** según su [página oficial de licencia](https://polyhaven.com/license). Los archivos se incluyen localmente, sin hotlinking. Se conservaron originales 1K; color difuso en sRGB, normal OpenGL y rugosidad lineales.

| Recurso | Uso | Archivos |
|---|---|---|
| [Castle Wall Slates](https://polyhaven.com/a/castle_wall_slates) | Piedra de murallas, torres y ruinas | Difuso, normal GL y rugosidad JPG |
| [Cobblestone Floor 04](https://polyhaven.com/a/cobblestone_floor_04) | Camino exterior | Difuso, normal GL y rugosidad JPG |
| [Brown Mud 02](https://polyhaven.com/a/brown_mud_02) | Explanada y terreno | Difuso, normal GL y rugosidad JPG |
| [Weathered Brown Planks](https://polyhaven.com/a/weathered_brown_planks) | Puerta, tablones y utilería | Difuso, normal GL y rugosidad JPG |
| [Kloofendal Overcast Pure Sky](https://polyhaven.com/a/kloofendal_overcast_puresky) | Cielo nublado e iluminación ambiental | HDR 1K |

[public/assets/manifest.json](public/assets/manifest.json) conserva URL de descarga, fuente, canal y licencia por archivo. Archivos descargados: aproximadamente 8,2 MB decimales, incluido el manifiesto. La transferencia real depende de la compresión y caché del servidor.

Arquitectura, camino, vegetación, ruinas, Guerrero provisional, soldados esqueléticos y antorchas: geometría creada en código para este proyecto. No son modelos extraídos de PokéBonk ni de otro videojuego. Los personajes tienen articulaciones y animaciones procedurales de prueba, sin rig importado ni animación final. Arcos de ataque, barras de vida, destellos y números de daño se dibujan en el motor/Canvas; no se descargaron recursos adicionales para 1.5.

Subfase 1.9: ballesta, armadura del cargador, capa/corona de los enemigos principales, anticipaciones de línea/círculo/abanico, núcleo dorado y virotes se generan con geometría y materiales propios en código. Sin modelos, imágenes o sonidos de terceros nuevos.

Subfase 1.9.1: ampliación de muralla, caminos, campamento, ruinas del sur y arbolado creados proceduralmente para el proyecto, reutilizando los materiales ya acreditados. Sin nuevas descargas ni modelos externos.

Conceptos visuales de `../arte/`: imágenes generadas previamente para este proyecto. `public/assets/interface/puerta.webp` y `exterior.webp` son versiones WebP de **Puerta de hierro** y **Explanada del bastión**, usadas como arte del menú. Los retratos `warrior.webp`, `mage.webp` y `archer.webp` se renderizaron con Three.js a partir de las mallas originales del juego, con iluminación de estudio y fondo transparente.

El corazón de piedra emplea geometría original creada en código y reutiliza los materiales del proyecto. La tarjeta `public/assets/interface/interior.webp` usa una captura del salón renderizado por el propio juego.

Motor [Three.js](https://threejs.org/), licencia MIT. Herramientas de desarrollo: Vite (MIT), TypeScript (Apache-2.0) y tipos de Three.js (MIT). Versiones exactas en `package.json` y dependencias resueltas en `package-lock.json`; los paquetes conservan sus archivos de licencia en `node_modules` tras instalar. Sin fuentes remotas: tipografía del sistema.

Ampliación adicional de 1.9.1 (0.1.11): abadía derruida, molino, atalaya y circuito exterior creados con geometría procedural propia y materiales ya acreditados. Sin recursos externos nuevos.

Subfase 1.9.2: cofres, fuentes, monedas, paquetes de curación y aros creados con geometría/materiales propios. Sin recursos externos nuevos ni imágenes generadas.

Subfase 1.9.3: tenderete, mercader provisional, bandera, círculo y anillo de progreso creados con geometría/materiales propios compartidos. Sin recursos externos nuevos.

Subfase 1.10: señales sonoras sintetizadas en Web Audio con osciladores y envolventes propios. Sin grabaciones, música, paquetes de sonidos ni recursos externos nuevos. Timbre y mezcla aún pendientes de escucha real.

Subfase 2.2: Mago con túnica, capucha y báculo, orbes elementales, señal de Cataclismo y tonos de lanzamiento creados en código para este proyecto. Sin recursos externos nuevos. Modelo y animaciones provisionales; revisión visual y escucha pendientes.

Subfase 2.3: Arquero con arco curvo, cuerda, carcaj, flechas, equipo ligero y animaciones procedurales; proyectiles y lluvia descendente creados en código para este proyecto. Tonos de arco/lluvia sintetizados en Web Audio. Sin recursos externos nuevos. Modelos y animaciones provisionales; revisión visual y escucha pendientes.

Subfase 2.4: símbolos, marcas de Quebranto, fragmentos de coraza, ondas hexagonales, arcos de ráfaga y espirales creados en código; sonidos de piedra/viento sintetizados con Web Audio. Sin recursos externos nuevos. Inspección visual y escucha pendientes.

Subfase 2.5: rocas dodecaédricas, arcos de viento y vórtice del Mago, puntas de pedernal y plumas alargadas del Arquero creados con geometría procedural propia. Reutiliza sonidos y materiales existentes. Sin recursos externos nuevos. Inspección visual y escucha pendientes.

Subfase 2.6: técnicas representadas con el arco de espada ajustado, proyectiles y geometrías existentes; eco pequeño y abanico de flechas creados en código. Catálogo e indicadores propios. Sin recursos externos nuevos. Revisión visual interactiva pendiente.

Subfase 2.7: segundo aro de afinidad, inventario y tarjetas de reliquias creados en código para este proyecto, con materiales y símbolos existentes. Sin recursos externos nuevos. Revisión visual interactiva pendiente.

Subfase 2.7.5: despojos óseos y avisos instanciados creados con geometría procedural propia. Reutiliza los materiales del escenario ya acreditados. Sin recursos externos nuevos; modelo provisional.

## Entrega 2.7.6

Sin recursos externos nuevos. Suministros de combate reutilizan el modelo existente; ajustes de transparencia y avisos sobre materiales y geometrías del proyecto.

## Mago de malla — 2026-11-05

Recurso original creado para este proyecto con Blender 4.2.17 mediante art/build_mage.py; fuente editable art/mage-slim.blend y exportación public/assets/models/mage-slim.glb. Sin recursos de terceros, sin extracción de otros juegos. Blender portátil oficial: https://download.blender.org/release/Blender4.2/ .

## Arquero de malla — 2026-11-06

Malla, materiales y equipo originales del proyecto, creados con Blender 4.2.17. El generador está en `art/build_archer.py`, la escena editable en `art/archer-ranger.blend` y el recurso del juego en `public/assets/models/archer-ranger.glb`.

## Guerrero de malla — 2026-11-07

Recurso original creado en Blender 4.2.17 mediante art/build_warrior.py. Escena editable art/warrior-veteran.blend, GLB en public/assets/models/warrior-veteran.glb. Primitivas de autoría compartidas con el Arquero en art/character_mesh.py.

## Pulido conjunto — 2026-11-07

Ajustes de las mallas originales y preservación de las tres bases aprobadas. Autoría con los generadores Blender del proyecto.

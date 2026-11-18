# Mago — primer recurso de malla independiente

2026-11-05. Entrega artística independiente; fase 2.8 pendiente.

## Resultado

Mago estilizado delgado, túnica continua desde cuello a faldón, mangas con curva de codo, capucha abierta con grosor, rostro estrecho, ojos, nariz, manos con dedos, estolas bordeadas, manto posterior, cinturón, libro y bastón con creciente. Mantiene violeta y latón. Es una primera versión para revisión del usuario, no un personaje de producción final.

Se produce fuera del motor con Blender 4.2.17 mediante el script de autoría `game/art/build_mage.py`: superficies poligonales personalizadas, subdivisión, suavizado, espesores y pesos de huesos. No se afirma escultura manual. La túnica es continua; mangas, rostro, manos y accesorios siguen siendo superficies separadas dentro del recurso. No es una única malla anatómica soldada.

Archivos entregados:

- `game/art/mage-slim.blend`: escena editable con materiales, armature y pesos.
- `game/public/assets/models/mage-slim.glb` contiene 53 mallas y 32.124 triángulos en 1,046,020 bytes.
- `game/art/build_mage.py`: autoría reproducible. Blender portátil de la distribución oficial está en `work/tools` del workspace; no es dependencia del juego.

Blender obtenido de https://download.blender.org/release/Blender4.2/blender-4.2.17-windows-x64.zip . Geometría original del proyecto, sin modelos/texturas de terceros ni recursos extraídos de otros juegos.

## Integración

Carga GLB con GLTFLoader antes de iniciar la escena. Se clona el esqueleto de forma independiente con SkeletonUtils; materiales y geometrías propios por instancia. El modelo antiguo permanece como fallback de las fábricas usadas sin precarga por fixtures y herramientas antiguas; la entrada principal y el catálogo del Mago sí esperan la malla nueva. Errores de carga se propagan al estado de error, sin simular éxito. Texturas de huesos se liberan al retirar personajes.

Siete huesos: raíz, columna, cabeza, dos brazos y dos antebrazos. Pesos interpolados en codos; reposo, balanceo de brazos y lanzamiento controlados por la interfaz existente. El bastón sigue el antebrazo derecho. Materiales responden al daño/desvanecimiento. No se cambia daño, alcance, colisiones o progresión.

Laboratorio: 21 entradas. `Mago · Malla GLB`, `Mago · Pulido anterior` y `Mago · Base aprobada`. Selector Reposo / Movimiento / Habilidad para personajes compatibles. Nota: Movimiento muestra balanceo del torso/brazos; no se presenta como ciclo completo de caminar con piernas e IK.

## Ajuste de vestuario del 6 de noviembre de 2026

Los dos paños de la estola y sus bordes dorados siguen la superficie de la túnica. El broche y la gema se apoyan en su montura, el cinturón se ciñe al talle y una correa sujeta el grimorio. Los dedos rodean el bastón. La malla y la escena anteriores están en `game/art/revisions`.

Se revisó el modelo de perfil durante el lanzamiento. Una prueba sobre el GLB exportado comprueba que los vértices muestreados de la estola y sus bordes quedan a menos de 8 mm de la túnica en reposo. Pasaron las 16 pruebas del Mago y la compilación. Captura en `../../work/mage-fit.png`.

## Verificación de la primera versión

- Tipado y compilación de ambas páginas correctos; aviso habitual de chunk >500 kB.
- 15 pruebas correctas: 14 del Mago y una del GLB real. Carga del binario, pesos, deformación de vértices finitos/acotados durante 120 pasos, independencia de esqueletos clonados, reinicio de pose y opacidad.
- Navegador: carga real en laboratorio, revisión de silueta y pose de habilidad de perfil. Se corrigió el sentido del brazo de lanzamiento tras observarlo.
- Juego: selección de Mago, entrada, desplazamiento, Cataclismo y subida a nivel 2. Sin errores de consola observados. La captura de ratón fue rechazada por IAB y funcionó el modo alternativo, sin certificar pointer lock.
- Captura `../../work/mage-glb.png`; logs `../../work/mage-glb-tests.log`, `../../work/mage-glb-build.log` y `../../work/mage-export.log`.

Pendiente: evaluación artística por el usuario, texturas/UV de producción, animación completa de locomoción, poses de manos/agarre más refinadas, clipping extremo, móvil físico y rendimiento en campaña densa. Materiales actuales planos PBR sin mapas externos. No ropa simulada, ni animación facial, ni clips de animación exportados; las poses del esqueleto se controlan desde el motor.


## 2026-11-07 — Capucha, hombros y rostro refinados

La capucha se cierra sobre la frente y enmarca las mejillas con un borde vuelto. Se añadieron mechones cortos en las sienes, se definieron los iris y se ajustó el cuello de lana. El manto se estrecha sobre la espalda y cae en diagonal sobre los hombros. La palma de lanzamiento y sus dedos tienen proporciones más finas. La base aprobada continúa disponible en el catálogo. La pasada inmediatamente anterior está archivada en `game/art/revisions/mage-polish-1`.

Se revisaron frente en tres cuartos, perfil de lanzamiento y espalda. Pasaron tipado, compilación y 16 pruebas del Mago, incluyendo deformación real, independencia de clones y separación de estolas respecto de la túnica. Capturas en `../../work/mage-refined.png`, `../../work/mage-refined-cast.png` y `../../work/mage-refined-back.png`. Consola con el 404 conocido del favicon. Continúa pendiente la locomoción completa.


## 2026-11-07 — Capucha unida a los hombros

Se corrigió la separación señalada por el usuario. Capucha y manto forman ahora una superficie continua, más ajustada a la cabeza. Se retiró el cuello de lana independiente. Los vértices inferiores se fijan al hueso de columna y transicionan gradualmente hacia la cabeza entre 1,51 y 1,66 m.

Se revisó la prenda desde el frente, perfil y espalda durante el lanzamiento. Pasaron la compilación y 17 pruebas. La prueba nueva comprueba sobre el GLB que la capucha baja hasta los hombros y que sus vértices inferiores están vinculados al torso. Capturas en `../../work/mage-hood.png`, `../../work/mage-hood-side.png` y `../../work/mage-hood-back.png`.

## 2026-11-07 — Grimorio y cuello

Grimorio con tapas, bloque de páginas rebajado, lomo y cierre. Cuello suavizado para eliminar estrías visibles bajo la mandíbula. La unión continua de capucha y manto sigue siendo la geometría vigente.


## 2026-11-07 — Revisión final de agarre y accesorios

Los cuatro dedos de la mano derecha rodean el bastón a alturas diferenciadas, con pulgar opuesto y palma ajustada. Las cinco partes del grimorio comparten pesos uniformes para conservar su montaje durante la animación. Los bordados dorados tienen algo más de ancho y separación respecto de la túnica para mejorar su lectura.

Revisión cercana del agarre, reposo, movimiento de perfil, lanzamiento y espalda en laboratorio. Compilación y 18 pruebas del Mago correctas. La prueba adicional comprueba la distribución vertical de los dedos y los pesos uniformes de las capas del grimorio. Capturas en `../../work/mage-final.png`, `../../work/mage-final-grip.png`, `../../work/mage-final-walk.png` y `../../work/mage-final-back.png`. La locomoción completa continúa pendiente.


## 2026-11-15 — Pulido de túnica, mangas, botas y báculo

Pasada pedida por el usuario sobre la versión del 7 de noviembre, hecha solo en `game/art/build_mage.py` y exportada con el Blender 4.2.17 portátil de `work/tools`. Túnica con tres familias de pliegues superpuestas que nacen bajo el cinturón y crecen hacia el bajo, borde irregular, frente levantado sobre las botas y banda «Ribete del faldón» en lana más oscura. Mangas ceñidas en hombro y codo con puño acampanado, ribete de latón y forro visible. Botas en tres piezas (caña, pie, puntera). Báculo de madera con nudos, empuñadura de cuero, regatón, collar y media luna afinada hacia las puntas; el cristal lleva emisión. Cordón de latón en el borde del manto y dos caídas del cinturón con herretes. Capucha, rostro, manos, estolas y grimorio no se tocaron. Sigue siendo modelado por código, sin texturas ni UV de producción, y los pliegues son estáticos.

El GLB pasa de 53 mallas y 32.124 triángulos (1.046.020 bytes) a 78 mallas y 54.260 triángulos (1.694.752 bytes). La versión anterior (script, `.blend` y GLB) queda en `game/art/revisions/mage-final-2026-11-07`; «Mago · Aprobado 07 nov» sigue en el laboratorio.

Typecheck, build y 33 pruebas (mage-asset, mage, model-animation, polish) correctos. Revisado en el laboratorio en reposo, gesto de habilidad de perfil y caminar de espalda, y en una partida real como Mago; sin errores de consola. Renders de antes y después en `../../work/revision-modelos/`. Observado y no corregido: hombros algo redondeados de espalda, un pliegue más duro en la cadera derecha y la mano izquierda bastante metida en el puño. No se midió el coste de los triángulos añadidos en campaña densa.


## 2026-11-15 — Puños abiertos, muñecas y hombros

Corrección sobre la pasada anterior del mismo día. Los puños se cerraban al subdividir y el ribete quedaba como un plato suelto: ahora dos anillos casi coincidentes mantienen la boca abierta, la manga termina 3 cm más arriba (1,02 m) y una muñeca une mano y antebrazo, de modo que ambas manos se ven. El arranque de la manga es más estrecho y baja antes, para un hombro menos redondo. El «pliegue duro» de la cadera derecha era la sombra del báculo en el render, no geometría; se comprobó ocultando báculo y brazo, y no se cambió nada.

GLB: 80 mallas, 55.524 triángulos, 1.729.720 bytes. Compilación y 21 pruebas del Mago correctas. Revisado con renders de detalle de frente y espalda en `../../work/revision-modelos/`; esta corrección no se volvió a mirar en el laboratorio ni en partida.

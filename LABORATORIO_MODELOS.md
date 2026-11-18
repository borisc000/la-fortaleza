# Atelier — laboratorio de modelos

2026-11-04. Herramienta independiente solicitada como paréntesis antes de 2.8. El juego conserva versión 0.2.12 y el plan mantiene 49 subfases, 22 futuras.

Abrir http://127.0.0.1:5183/model-lab.html con el servidor habitual (`npm run dev` en game). También se incluye en la compilación de producción, junto al juego.

## Catálogo de la entrega inicial

El catálogo vigente tiene 26 entradas y dos modos de revisión. El historial de ampliaciones y las verificaciones actuales aparecen más abajo.

Las 16 entradas iniciales eran: Guerrero, Mago, Arquero; Despojo reanimado, Soldado reanimado, Ballestero hueco, Devastador, Portador del núcleo y Castellano Vacío; Cofre, Fuente, Monedas, Suministro, Puesto del mercader y Estandarte; conjunto Los dominios exteriores.

Se reutilizan las fábricas de geometría del juego. No son réplicas artísticas ni modelos nuevos. Personajes y enemigos se muestran estáticos; se ocultan señales de combate y aros de interacción. Las figuras son provisionales. El mapa aparece completo, con terreno lejano, y no como módulos arquitectónicos individuales: actualmente la geometría del mundo se agrupa por material. Las dimensiones informadas incluyen el conjunto visible, no solo el área jugable.

## Controles y revisión

- Arrastrar para orbitar, rueda para acercar/alejar y botón derecho para desplazar.
- Encuadrar, frente, perfil, espalda y giro automático.
- Malla, cuadrícula y tres opciones de iluminación.
- Búsqueda por nombre/categoría; medidas, mallas y triángulos visibles.
- Notas por modelo guardadas en localStorage de este navegador y origen. Exportación a Markdown de la colección completa. No modifica los modelos ni sincroniza notas entre navegadores; exportar para conservar una copia independiente.

## Implementación

Entradas `model-lab.html`, `src/model-lab.ts`, estilos y `src/model-catalog.ts`. Adaptador de inspección de enemigos en `rendering/combat.ts`, reutilizando la fábrica original. Three OrbitControls, sin dependencias nuevas ni recursos externos. Se liberan materiales y geometrías al cambiar de modelo; carga asíncrona con descarte de resultados antiguos. Vite compila ambas entradas.

## Verificación de la entrega inicial

Tipado y build correctos. Navegador WebGL local: carga de las 16 entradas, giro con arrastre, zoom con rueda, encuadre, perfil y malla del jefe, búsqueda y persistencia de una nota tras recarga. Nota temporal retirada. Exportación Markdown descargada correctamente. Consola sin errores observados. Captura en ../../work/model-lab.png.

Revisión visual a 920 px y distribución estrecha inicial; no se certifica teléfono físico. No incluye animaciones de habilidades, edición de vértices ni comparación simultánea. Siguiente ampliación útil: separar arquitectura en módulos y revisar siluetas de las tres clases con las notas del usuario.

Regresión dirigida: 29/29 pruebas correctas de combate, hordas y actividades tras añadir el adaptador de modelos.

## Pulido de personajes — primera revisión

Catálogo ampliado a 19 entradas. Cada clase tiene Antes (copia preservada baseline-*.ts) y Después (fábrica vigente, también usada en el juego). Comparación alternando entradas, no vista simultánea. Guerrero: placas, correajes y bolsa; Mago: estolas, bordados, cuello y libro; Arquero: hombrera, arnés, costuras, capa y posición de reposo del arco corregida. Los accesorios articulados comparten materiales para conservar parpadeo y desvanecimiento. Sin recursos externos. Sigue siendo arte procedural provisional. Tipado/build correctos y revisión visual de las tres versiones nuevas en navegador.

## 2026-11-05 — Base aprobada y Guerrero: prendas y silueta

El usuario aprueba los accesorios como base de las tres clases. Copias independientes approved-warrior/mage/archer.ts y approved-character-polish.ts conservan exactamente esa entrega. El catálogo compara ahora esa base con el modelo vigente; Mago y Arquero permanecen iguales. Las versiones originales baseline-* siguen archivadas, fuera del catálogo. Las notas antiguas de entradas Antes pueden referirse al modelo anterior.

Guerrero: torso con secciones continuas, cintura más estrecha y pecho estructurado; mangas y piernas con estrechamiento anatómico; hombreras menos esféricas; placas pectorales curvadas; faldones partidos con grosor y pliegues. Altura y accesorios conservados. Se reutilizan articulaciones, materiales y controles de animación; ninguna regla de daño o colisión cambia. Sin recursos externos nuevos. No es todavía una malla orgánica con skinning ni ropa simulada.

Verificación: tipado/build correctos; 13 pruebas de combate correctas; 240 poses de caminar/atacar/girar con matrices finitas y desvanecimiento comprobado en todas las mallas. Revisión visual de tres cuartos y perfil en el laboratorio; corrección de triangulación de superficies curvas. 16.232 triángulos frente a 5.736 de la base: no se ha medido nuevamente el rendimiento de una campaña. Captura ../../work/warrior-tailored.png. Fase 2.8 sigue pendiente.

## 2026-11-05 — Mago y Arquero: prendas y silueta

Las tres clases tienen ahora una entrada Prendas y silueta y otra Base aprobada. Las copias approved-* permanecen intactas. Mago y Arquero actualizados también en el juego, con los accesorios ya aprobados.

Mago: torso entallado continuo, túnica acampanada con pliegues radiales, mangas con amplitud en los puños, estolas con grosor y caída, pequeño manto de hombros y paño posterior. Se conservan bordados, libro, bastón y capucha.

Arquero: torso y chaleco entallados, mangas y pantalones estrechados hacia articulaciones, botas con forma de pantorrilla, paneles de cuero curvados y capa corta partida con pliegues. Se conservan hombrera asimétrica, correajes, bolsas, costuras, arco y carcaj.

Verificación: tipado y build correctos; 480 poses entre ambas clases con matrices finitas y desvanecimiento de todos los materiales. Revisión WebGL de ambos modelos y espalda del Arquero, sin errores de consola observados. Capturas ../../work/mage-tailored.png y ../../work/archer-tailored.png. Mago 8.440 triángulos y Arquero 9.908; sin nueva medición de campaña completa o teléfono. Arte procedural provisional; no ropa simulada ni nuevo rig orgánico. Fase 2.8 permanece pendiente.

## 2026-11-05 — Corrección de simetría del Arquero

Revisión frontal detectó desequilibrio por la hombrera unilateral sobredimensionada. Sustituida en el modelo vigente por dos hombreras iguales de menor volumen; pliegues de los paños de capa reflejados entre lados. Arco, carcaj, correa y brazal mantienen su función asimétrica. Base aprobada intacta. Revisión visual frontal y posterior correcta, compilación y 16 pruebas del Arquero correctas. Captura ../../work/archer-symmetry.png.

## 2026-11-05 — Guerrero: superficies orgánicas

A petición del usuario se rehacen superficies del Guerrero para reducir rigidez. Nuevo módulo organic-geometry.ts: interpolación curva de secciones anatómicas y superficies cerradas que envuelven el cuerpo. Torso y cintura con transición suave, mangas y pantorrillas perfiladas, hombreras redondeadas sin barras horizontales, protecciones de antebrazo y espinilla envolventes, pechera curva y faldones distribuidos alrededor de la cadera. Se conservan espada, bolsas, correajes y paleta; cambia la distribución de las placas. Mago y Arquero sin cambios.

Versión inmediatamente anterior preservada en previous-warrior.ts, con copia estable del pulido de accesorios. Catálogo de 20 entradas: Formas orgánicas, Pulido anterior y Base aprobada para el Guerrero. Modelo vigente también integrado en el juego. No constituye escultura final ni nuevo rig con skinning: conserva articulaciones rígidas y ropa sin simulación.

Verificación: tipado/build y 13 pruebas de combate correctas; geometría y normales finitas, 240 poses de caminar/atacar/girar y desvanecimiento comprobados. Revisión visual frontal, perfil y tres cuartos. Captura ../../work/warrior-organic.png. 47 mallas, 33.684 triángulos frente a 16.232 del pulido anterior. No se repitió medición de rendimiento en campaña/móvil. Sin recursos externos. Fase 2.8 pendiente.

## 2026-11-05 — Mago de malla GLB

Catálogo de 21 entradas, con Mago nuevo de Blender y pulido anterior conservado. Selector de poses de personajes. Detalles, archivos y límites en [MAGO_MALLA.md](MAGO_MALLA.md).

## 2026-11-06 — Arquero de malla GLB

El catálogo tiene 22 entradas. El Arquero vigente, el pulido inmediatamente anterior y la base con accesorios se pueden alternar en reposo, movimiento o habilidad. Al alternar esas tres entradas se conserva la orientación y la distancia relativa de la cámara.

El jubón tiene apertura para montar, faldones con pliegues, lazadas y arnés. La capa se divide bajo el carcaj. Las mangas, brazales y guantes se articulan en el motor. El torso gira al preparar el tiro, la cabeza mira al objetivo, el brazo izquierdo sostiene la empuñadura y la derecha lleva la cuerda a la mejilla. El selector Habilidad detiene al personaje a plena apertura para inspeccionarlo. En partida la cuerda se suelta al final de la preparación del ataque básico. La locomoción es un balanceo articulado sencillo.

La revisión en navegador incluyó reposo, tiro, espalda, comparación con el pulido anterior y entrada en partida como Arquero hasta la primera afinidad. El tipado y la compilación pasaron. Las 19 pruebas dirigidas incluyen el montaje del GLB real, la coincidencia de manos y cuerda, la suelta, las longitudes de los brazos y el reinicio de postura. Capturas en `../../work/archer-ranger-rest.png` y `../../work/archer-ranger-shot.png`.

## 2026-11-07 — Guerrero de malla GLB

Catálogo de 23 entradas. Guerrero vigente y Formas orgánicas anteriores se comparan conservando orientación y zoom relativo. La base aprobada y el pulido previo siguen disponibles. Se modelaron torso, cuirasa parcial, hombros de placas superpuestas, faldones, guantes, rostro, cabello y espada. El golpe usa la preparación, fase activa y recuperación de la definición de ataque del juego.

Fuentes en `game/art/build_warrior.py` y `game/art/warrior-veteran.blend`. Exportación en `game/public/assets/models/warrior-veteran.glb`. Los constructores de superficies compartidos con el Arquero están en `game/art/character_mesh.py`. Geometría original del proyecto. Las extremidades usan una jerarquía articulada de piezas, con materiales PBR planos. Quedan pendientes texturas de producción, deformación continua de codos y locomoción completa.

Tipado y build correctos, con el aviso existente del bundle mayor de 500 kB. Pasaron 17 pruebas dirigidas de combate y de los tres GLB. La prueba nueva comprueba matrices finitas, agarre de espada, independencia de clones, desvanecimiento y reinicio de pose. Revisión visual de reposo, habilidad, espalda, comparación y entrada al territorio. La consola del laboratorio mostró un 404 del favicon. Capturas en `../../work/warrior-veteran.png`, `../../work/warrior-veteran-attack.png` y `../../work/warrior-game.png`. Esta entrega tiene 36 mallas y 35.720 triángulos.

## 2026-11-07 — Aprobación conjunta y pasada de acabado

Los tres GLB aprobados están preservados en `game/public/assets/models/approved-2026-11-07`. Las escenas editables, generadores y manifiesto SHA-256 están en `game/art/revisions/approved-2026-11-07`. El catálogo reúne 26 entradas y distingue Actual pulido, Aprobado 07 nov y Base histórica. Las notas históricas mantienen sus identificadores. Las tres clases permiten comparar la versión aprobada con la actual desde el mismo ángulo y distancia relativa.

El Mago tiene los puños más recogidos, la punta de la nariz menos proyectada y grosor en el manto de hombros. El Arquero tiene interior rebajado y borde vuelto en el carcaj, remate interior de capucha y puños de guante ajustados. El Guerrero tiene continuidad en muñecas y codos, suelas biseladas y corrección del cruce entre cabello y cráneo visible desde atrás.

Las fábricas del juego usan las mallas pulidas. En laboratorio se cargaron las seis variantes, las poses de habilidad, reposo y movimiento, y las vistas de perfil y espalda. Las tres copias aprobadas coinciden con su manifiesto. Compilación y 17 pruebas dirigidas correctas. Continúan pendientes locomoción completa, texturas de producción y evaluación móvil. La consola mostró el 404 conocido del favicon. Evidencia en `../../work/polished-mage.png`, `../../work/polished-archer.png` y `../../work/polish-warrior-hair.png`.

## 2026-11-07 — Segunda pasada del Mago

Capucha ajustada a la frente, rostro enmarcado, cuello y manto integrados, manos afinadas. Se conserva la base aprobada en el laboratorio. Ver [modelo y verificación](MAGO_MALLA.md).

## 2026-11-07 — Acabados de equipo

Pasada pequeña sobre las tres mallas vigentes. Mago con grimorio de tapas y páginas separadas y cuello suavizado. Arquero con grosor en capa y correaje, y ataduras de cuerda sobre los extremos del arco. Guerrero con volumen cerrado en pechera y faldones, y lengüeta de hebilla.

El constructor compartido ribbon admite grosor opcional y cierra los laterales. La autoría conserva materiales y articulaciones por pieza. Las bases aprobadas mantienen sus archivos fechados.

Revisión visual en laboratorio de reposo y habilidad para los tres. Compilación y 18 pruebas dirigidas correctas, incluidas la sujeción de armas, la capucha anclada, el skinning del Mago y combate. Avisos conocidos de favicon y tamaño del bundle. Capturas en `../../work/detail-mage-rest.png`, `../../work/detail-archer-rest.png` y `../../work/detail-warrior-rest.png`. Métricas vigentes de Mago, Arquero y Guerrero respectivamente, 53/45/36 mallas y 31.524/30.876/38.928 triángulos.

## 2026-11-07 — Revisión final del Mago

Se verificaron capucha anclada, manos y grimorio. Agarre derecho corregido y piezas del libro con pesos uniformes. Evidencia y pruebas en MAGO_MALLA.md.

## 2026-11-08 — Ajuste de encaje del Guerrero

Se revisó el modelo a corta distancia. Los faldones se curvan alrededor de la cadera, con la parte superior recogida bajo el cinturón y holgura para cubrir cuero y cota. Las anillas visibles siguen la sección elíptica de la camisa de malla. Las placas inferiores de las hombreras se estrechan y solapan con la superior.

La inclinación de espada se aplica ahora desde la mano. El arma conserva su orientación local durante preparación, golpe, recuperación y habilidad. La prueba del GLB verifica esta relación en 120 pasos.

Compilación y 21 pruebas de representación, combate y clases correctas. Revisión visual de reposo, habilidad, perfil y espalda en movimiento. Evidencia en `../../work/warrior-fit-before.png`, `../../work/warrior-fit-after.png`, `../../work/warrior-fit-cast.png` y `../../work/warrior-fit-back.png`. Se mantiene el aviso de tamaño del bundle y el 404 conocido del favicon. La locomoción completa sigue pendiente.


## 2026-11-08 — Reproductor de animaciones

Panel Animaciones para los trece modelos de personajes del catálogo, incluidas las variantes conservadas. Se reutilizan las fábricas y movimientos del juego. Secuencias disponibles de reposo, caminar en el sitio, ataque básico, gesto de habilidad, impacto recibido y desvanecimiento.

Permite reproducir o pausar, reiniciar, avanzar un fotograma de 1/60 s, recorrer la línea de tiempo, elegir 0,25×, 0,5×, 1× o 2× y activar o desactivar repetición. Al recorrer el tiempo o avanzar un fotograma se pausa automáticamente. Se puede girar la cámara con la animación detenida. Al cambiar de modelo se reinicia el tiempo y se conservan la secuencia, velocidad y estado de pausa. Los modelos estáticos deshabilitan el panel.

El adaptador de laboratorio reconstruye los movimientos mediante pasos fijos para que retroceder reproduzca la misma postura visible. El modo de malla mantiene los materiales usados por las animaciones, incluido el desvanecimiento. El ataque básico respeta la duración propia de la clase y añade medio segundo de descanso entre repeticiones.

El gesto de habilidad representa la postura disponible en cada fábrica, no las ocho habilidades con sus efectos. No hay simulación de daño, proyectiles ni enemigos en movimiento. Impacto prueba el destello de daño actual y desvanecimiento prueba la opacidad, sin incorporar nuevas animaciones de reacción o muerte. La locomoción de los modelos continúa siendo provisional, especialmente la del Mago. No se cambian las fases de desarrollo ni las reglas de partida.

Verificación realizada con tipado y compilación, 29 pruebas dirigidas correctas de modelos, reproducción, clases y combate. Los tres GLB reales tienen pruebas de pausa estable, retroceso reproducible, avance de un fotograma, duración del ataque y recuperación de visibilidad. Revisión en navegador a 1440 × 960 y 1280 × 720, incluidas las trece variantes de personajes, fin sin repetición, controles deshabilitados para Cofre y recuperación del modelo tras desvanecerse en modo malla. Sin errores de ejecución observados. Permanecen los avisos conocidos de tamaño de bundle y favicon ausente. No se hizo prueba en teléfono físico.

Capturas en `../../work/lab-animations-warrior.png`, `../../work/lab-animations-archer.png`, `../../work/lab-animations-mage.png` y `../../work/lab-animations-fade.png`. Registro de pruebas en `../../work/lab-animation-tests.txt`.


## 2026-11-08 — Habilidades completas contra muñecos

Selector de modo en la columna izquierda. Modelos y animaciones conserva el visor anterior. Habilidades completas utiliza los modelos vigentes y permite elegir Guerrero, Mago o Arquero, sus ocho habilidades y su básico, nivel 1–10, prioridad de rama, mutación de nivel 5, remate de nivel 10 y Fuego, Agua, Tierra o Aire. La afinidad se mantiene en rango 1, sin maestría, segunda afinidad ni reliquias. Las ramas se construyen mediante operaciones legales del libro de habilidades. Se prioriza la elegida hasta su máximo y luego se usa el orden del catálogo para las demás. La distribución exacta y las descripciones de variantes se muestran en pantalla.

Cada prueba dura doce segundos e incluye las recargas reales. Se puede ejecutar de nuevo, repetir, pausar, usar cámara lenta, retroceder y avanzar un fotograma. Cambiar una configuración reinicia la prueba; al comparar habilidades o niveles de la misma clase se conserva la orientación y distancia de cámara. Los enlaces `#trial-warrior`, `#trial-mage` y `#trial-archer` abren el modo con la habilidad inicial de cada clase. El enlace no serializa el resto de la configuración.

Seis muñecos sin armadura distribuidos cerca, en fila y en un flanco permiten ver áreas, órbitas, penetración y rebotes. Reciben daño y estados elementales, tienen vida restaurada después de cada paso y no atacan ni se desplazan por IA. Los empujes de habilidades se conservan. Aparecen destellos, cifras de daño, impactos acumulados y barrera. El Espejo arcano, Estandarte y Baliza habilitan también su básico de nivel 1 para observar su apoyo. Las demás pruebas aíslan la habilidad seleccionada.

La simulación de entrenamiento está en `game/src/domain/ability-lab.ts`. Utiliza Combat, WarriorArsenal, RangedArsenal y AbilityBook reales, sin crear ni modificar una Run. Enemy admite objetivos estacionarios opcionales; el comportamiento normal no cambia. La representación en `game/src/rendering/ability-lab.ts` reutiliza los renderizadores de combate, elementos, arsenales, hechizos y flechas. Los muñecos son geometría original de esta herramienta. No se añadieron dependencias ni recursos externos. El renderizador de combate permite omitir los modelos de enemigos y mantener sus efectos y cifras.

Los cuerpos usan exactamente las animaciones actuales del juego, incluido el giro del Guerrero durante Torbellino. Varias habilidades comparten postura y algunas todavía carecen de un gesto corporal propio. Los efectos mantienen su nivel de acabado provisional. No se simulan bajas, explosiones por muerte, enemigos atacando, ruptura de barrera por daño entrante ni condiciones de élite o de poca vida. Esta herramienta ayuda a revisar efectos y comportamiento; sus cifras no certifican el balance de campaña.

Verificación final con tipado/build correctos y 85 pruebas dirigidas de combate, arsenales, animaciones y laboratorio. Se verificaron las 27 opciones al nivel 1 y ambas variantes de nivel 10, progresión legal, objetivos inmóviles, repetibilidad e independencia entre pruebas. El navegador cargó y ejecutó las 27 opciones sin errores, probó los cuatro elementos, variantes, pausa, retroceso con mismo daño, avance por fotograma, fin sin repetición, repetición y retorno al modo de modelos. Revisión visual representativa de Torbellino, Cataclismo, Lluvia de flechas y Orbes a 1440 × 960 y 1280 × 720, incluida conservación de perfil al cambiar nivel. La recarga final y las tres clases no mostraron errores de ejecución. Durante la edición se observó un error transitorio por recarga automática entre cambios de HTML y código; no se reprodujo con los archivos finales. Continúan el aviso conocido de tamaño del bundle y el favicon ausente. No se probó teléfono físico.

Evidencia en `../../work/ability-lab-tests.txt`, `../../work/ability-lab-warrior.png`, `../../work/ability-lab-mage.png`, `../../work/ability-lab-archer.png`, `../../work/ability-lab-orbs-level10.png`, `../../work/ability-lab-final-720.png` y `../../work/ability-lab-profile-preserved.png`. Se mantiene el siguiente hito 2.8, Maestrías.

## 2026-11-15 — Guerrero: hombreras, faldar, espaldar, piernas y espada

Pasada pedida por el usuario, hecha solo en `game/art/build_warrior.py` y exportada con el Blender 4.2.17 portátil de `work/tools`. Las tres láminas cilíndricas del hombro se sustituyen por una hombrera abombada con dos láminas que bajan por el exterior del brazo, canto bruñido y remaches; la manga de malla es más estrecha bajo ella. Faldar de dos láminas entre la pechera y el cinturón, por delante y por detrás. Espaldar con arista central; el correaje pasa ahora por encima. Pantorrilla, bota, greba y rodillera con más volumen. Espada con hoja más ancha de ocho lados con vaceo, guarda abierta hacia las puntas y pomo de disco. Acero algo más claro y pulido, paño algo más vivo. Cabeza, manos, faldones y cota no se tocaron. Las articulaciones (`UpperRight`, `HandRight`, `Sword`, etc.) conservan nombre y posición.

GLB: de 36 mallas y 38.928 triángulos (707.504 bytes) a 44 mallas y 56.520 triángulos (992.832 bytes). Versión anterior en `game/art/revisions/warrior-2026-11-08`; «Guerrero · Aprobado 07 nov» sigue en el laboratorio.

Compilación y 28 pruebas (warrior-asset, model-animation, warrior-kit, functional-fit) correctas. Laboratorio: reposo de frente y caminar de espalda, sin errores de consola. Renders de antes y después en `../../work/revision-modelos/`. No verificado: el ataque básico y el Torbellino con las placas nuevas (la vista previa mostró el mismo fotograma que en reposo), cruces entre hombrera y pechera al levantar el brazo, la partida real y el coste de los triángulos añadidos.

## 2026-11-15 — Arquero: capucha, capa, hombrera y cuchillo

Pasada pedida por el usuario, hecha solo en `game/art/build_archer.py` con el Blender 4.2.17 portátil. La capucha terminaba en un cilindro de techo plano: ahora tiene una corona más alta que cae hacia atrás en punta suave. La capa lleva pliegues más profundos y desiguales. El hombro de la manga baja en pendiente. Hombrera de cuero cosida con remaches en el brazo del arco. Cuchillo de caza envainado en la cadera derecha, con correa al cinturón. Dos ligaduras de lino a los lados de la empuñadura del arco. Rostro, jubón, manos, botas y carcaj no se tocaron; las articulaciones conservan nombre y pose.

GLB: de 49 mallas y 31.016 triángulos (575.644 bytes) a 54 mallas y 34.548 triángulos (637.188 bytes). Versión anterior en `game/art/revisions/archer-2026-11-07`.

Compilación y 31 pruebas (archer-asset, archer, model-animation, functional-fit) correctas. Laboratorio: ataque básico con el arco tensado, sin errores de consola. En la misma sesión se vio al Guerrero del 15 de noviembre en ataque básico y gesto de habilidad: la hombrera acompaña al brazo y no se apreció cruce con la pechera a ese tamaño de vista. No verificado en el Arquero: caminar, espalda en movimiento y partida real; tampoco si la punta de la capucha atraviesa la capa al girar la cabeza.

## 2026-11-15 — Enemigos: equipo por tipo y menos llamadas de dibujo

Los enemigos siguen construyéndose en código (`game/src/rendering/combat.ts` y `horde.ts`), no en Blender, y solo cambia la representación. Antes cada primitiva era una malla propia; ahora `enemyGeometry` fusiona las piezas por grupo articulado (cuerpo, dos piernas, dos brazos) y material, y la geometría se comparte entre todos los enemigos del mismo tipo. Los materiales siguen siendo propios de cada enemigo, porque el destello de golpe, la quemadura y la aparición los cambian.

Equipo nuevo sobre el mismo esqueleto: Soldado con sombrero de hierro, rodela y espada con punta; Ballestero con capucha y esclavina, carcaj y ballesta con verga, cuerda y estribo; Devastador con yelmo de cuernos y visera, peto, hombreras con púa y mazo largo; Portador con peto, escarcelas, capa, cimera y un núcleo luminoso en el pecho; Castellano con corona de púas, manto y capa mayores, ojos encendidos y mandoble más largo. Todos llevan tabardo rasgado y, salvo el Ballestero, grebas y brazales. El núcleo y los ojos usan un material sin iluminación aparte.

Mallas visibles y triángulos por enemigo, medidos con las dos versiones del código: Soldado 32 → 14 mallas (2.284 → 2.942 triángulos), Ballestero 33 → 13 (2.296 → 2.554), Devastador 33 → 13 (2.296 → 2.894), Portador 35 → 14 (2.448 → 3.150), Castellano 40 → 14 (2.508 → 3.532). El Despojo de horda conserva sus tres llamadas para toda la masa, gana hombros encorvados, sudario rasgado y un cuchillo oxidado (524 triángulos) y varía de tamaño entre 0,93 y 1,07 según su id; ese tamaño es solo visual.

Tipado, compilación y 67 pruebas (horde, campaign, combat, archer, mage) correctos. Laboratorio: los seis enemigos en reposo, sin errores de consola. En partida se vieron soldados con su rodela. No verificado: ataques y avisos en partida con el equipo nuevo, élite y jefe en combate, ni fotogramas por segundo reales; la reducción de mallas está medida, su efecto en el rendimiento no.

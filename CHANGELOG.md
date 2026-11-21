# Registro de cambios

Historial de entregas, de la más reciente a la más antigua. El estado vigente y el punto de reanudación están en [ESTADO.md](ESTADO.md); el detalle de cada verificación, en [docs/verificaciones](docs/verificaciones/).

### 2026-11-21 — Asedios, Montería y duelo con el Castellano

Dos Toques de asedio avisan antes de reforzar los flancos con ballesteros y, al final, devastadores. Entre ambos, la Montería trae al Verdugo de la ronda, un perseguidor resistente que fija la dirección de su carga antes de embestir. [Reglas y verificación](docs/verificaciones/PRESION_EXTERIOR.md).

El Castellano añade una arremetida y dos ataques que marcan el suelo desde cualquier distancia. Sal del círculo rojo de la Ruptura del suelo. Con el Edicto del vacío, permanece dentro del anillo turquesa hasta que pase el impacto.

### 2026-11-20 — Pulido de los seis modelos de enemigos

Cinco rondas por modelo. El Despojo gana una postura encorvada y un sudario rasgado. La guarnición se distingue por la rodela del Soldado y la capucha y ballesta del Ballestero. El Devastador lleva placas de asedio, cuernos curvos y un mazo ancho. El Portador y el Castellano tienen mantos, armaduras y núcleos de siluetas diferentes. Se revisaron los agarres, la postura de carga y los avisos de ataque desde la cámara del juego. [Comparativa y registro de rondas](docs/verificaciones/PULIDO_MODELOS_ENEMIGOS.md).

### 2026-11-20 — El corazón de piedra

La segunda expedición se puede iniciar desde el selector con las tres clases. Incluye portón, patio con dos grupos de guardias, armería opcional, rastrillo, salón con capitán y almenara interactiva para ganar. La cámara usa volúmenes de paredes, arcos y pilares. [Diseño](docs/diseno/EL_CORAZON_DE_PIEDRA.md) · [Verificación](docs/verificaciones/EL_CORAZON_DE_PIEDRA.md).

### 2026-11-20 — Interfaz general de campaña

Portada con arte original, selección de expedición de la Era I, preparación con retratos de las tres clases y afinidad inicial del Mago. Guía de juego y ajustes persistentes accesibles desde inicio y pausa. Se añadió el regreso al inicio y la confirmación antes de abandonar una expedición en curso. El HUD muestra una pista de aprendizaje a la vez y agrupa los controles auxiliares de cámara en un desplegable. [Verificación y capturas](docs/verificaciones/INTERFAZ_GENERAL.md).

### 2026-11-18 — Consultas de obstáculos en la persecución

La horda reutiliza las celdas de navegación para visibilidad y para pasos cortos libres. [Mediciones de la segunda optimización](docs/verificaciones/RENDIMIENTO_HORDA_60.md#segunda-optimización-de-la-persecución).

### 2026-11-18 — Rendimiento en hordas

Se aceleraron las consultas contra obstáculos y la búsqueda de blancos del Guerrero en recarga. [Mediciones con 60 enemigos](docs/verificaciones/RENDIMIENTO_HORDA_60.md).

### 2026-11-18 — Animaciones de combate

Se reforzó el contraste del primer impacto de los tres básicos y se diferenciaron las flechas laterales de Abanico de las de Salva. [Prueba de los dos finales cruzados](docs/verificaciones/BASICOS_CRUZADOS_APOYOS_M2_R1.md).

Se afinó el filo visible de Hachas giratorias, la recarga de Onda residual y la estela de Tercera pasada. [Doce encuentros con ambos cuartetos](docs/verificaciones/BASICOS_APOYOS_MUTACION_2_REMATE_1.md).

### 2026-11-18 — E3.2: relieve y límites naturales

Taludes que cierran el claro y afloramientos rocosos; aplicación 0.2.15. Ver [verificación](docs/verificaciones/VERIFICACION_E3_2.md).

- **Taludes:** desde 1,5 m fuera de las vallas el terreno sube 3,5–7 m en unos 11 m, con rocas medio enterradas cada 9–16 m. La malla del suelo pasa de 4 m a 1 m en esas franjas; dentro del claro los vértices no cambian.
- **Freno de cámara:** la cámara no choca con el terreno, así que cajas escalonadas bajo los taludes, y las rocas del talud, la frenan solo a ella (`cameraOnly`). No entran en movimiento, navegación ni apariciones.
- **Afloramientos:** doce grupos de rocas en terreno muerto dentro del mapa, con su propia serie aleatoria. Guardan 9 m a rutas y claros, 5 m a otros sólidos y 26 m a las esquinas donde se prueban las apariciones. Las rocas grandes y medianas colisionan.
- **Material de roca** con desgaste propio (`ROCK_WEATHERING`) y textura proyectada según la orientación de cada cara.
- **Prueba nueva:** la cámara no queda bajo el talud en más de 200 casos de borde, los sólidos de movimiento no pasan de las vallas y los afloramientos dejan libres rutas y claros.
- **Obstáculos:** de movimiento, de 641 a 688; 512 nuevos solo de cámara.

- **Coste:** +0,6 ms de mediana por fotograma sobre E3.1 (máximo +1,0 ms).

Pruebas rápidas 357/357 y simulaciones completas 26/26 (ocho campañas varían ligeramente por los afloramientos, todas con victoria), lint, typecheck y build correctos.

### 2026-11-18 — E3.1: superficies

El suelo gastado de la explanada cubre todo el mapa, con carácter propio por sector; aplicación 0.2.15. Ver [verificación](docs/verificaciones/VERIFICACION_E3_1.md).

- **Todo el mapa:** bordes gastados en caminos y claros, la repetición de la textura oculta y manchas grandes de tono (antes, solo en la zona de la puerta).
- **Sectores (`SECTOR_SURFACES` en `content/terrain-layout.ts`):** humedad, musgo, luz y roderas, fundidos a lo largo de 12 m. Barro empapado en los campos del asedio, suelo musgoso en el bosque, tierra clara con roderas en la llegada y verdín en la abadía.
- **Decoración del suelo:** charcos en caminos y claros, más frecuentes donde hay más humedad; empedrado antiguo en ruinas, abadía y encrucijada; franja de barro mojado a lo largo de toda la muralla.
- **Lectura:** los caminos de tierra pierden la segunda cinta clara que, con los bordes gastados, dibujaba un contorno doble.
- **Coste:** el carácter de sector se calcula por vértice. Primero costaba hasta +2,4 ms por fotograma; queda en +0,5 ms de mediana sobre E2. Mismos 864 obstáculos.

Pruebas rápidas 356/356, simulaciones completas 26/26 (idénticas a E2.4), auditoría de la puerta igual que en E2.4, lint, typecheck y build correctos.

### 2026-11-18 — Básicos con segunda mutación y segundo remate de los apoyos

Se corrigieron los avisos de Cataclismo fracturado y la orientación del básico durante la lluvia. La Onda de acero cambió de silueta en el retorno. [Pruebas de ambos cuartetos](docs/verificaciones/BASICOS_APOYOS_MUTACION_2_REMATE_2.md).

### 2026-11-18 — Impacto de los básicos con ambos cuartetos

Se distinguió el primer blanco alcanzado por la espada, el proyectil mágico y la flecha central. [Doce encuentros con segundos remates de apoyo](docs/verificaciones/BASICOS_AMBOS_CUARTETOS_REMATE_2.md).

### 2026-11-18 — Básicos a nivel 10 con el otro cuarteto

Se ajustaron el golpe durante el Torbellino, la salida del proyectil durante la canalización y la suelta del arco al coincidir con la Salva. [Comparativas por clase](docs/verificaciones/BASICOS_OTRO_CUARTETO.md).

### 2026-11-18 — Básicos a nivel 10 con cuatro apoyos

Se ajustaron el filo del barrido y la estocada, el vuelo del proyectil mágico y la lectura de la flecha central durante la lluvia. [Capturas y configuraciones](docs/verificaciones/BASICOS_NIVEL_10.md).

### 2026-11-18 — Segundo cuarteto de cada clase a nivel 10

Se revisaron las doce técnicas restantes en combate y se ajustaron las lanzas, el espejo y la baliza. [Resultados por variante](docs/verificaciones/COMBATE_NIVEL_10_RESTANTES.md).

### 2026-11-18 — Combate con ambos remates de nivel 10

Se ajustaron las estelas de las hachas, la transparencia del haz, el movimiento de las runas de Implosión y el cierre de las trampas. [Seis encuentros y comparaciones visuales](docs/verificaciones/COMBATE_NIVEL_10.md).

### 2026-11-18 — Cuatro habilidades por clase en combate

Se ajustaron el Torbellino y el gancho de la Cadena, las siluetas del Sello, Cataclismo y Nova, y las señales de suelta, rebote y retorno del arquero. [Comparación de los tres encuentros](docs/verificaciones/COMBATE_CUATRO_HABILIDADES.md).

### 2026-11-18 — Pulido de las 24 habilidades restantes

Se actualizaron ocho animaciones por clase. El laboratorio permite hacer que un muñeco cruce las Estacas de guardia. La Cadena de guerra sigue al guerrero y al objetivo durante el tirón. [Secuencias y verificación](docs/verificaciones/PULIDO_24_HABILIDADES.md).

### 2026-11-18 — Animaciones de Guardia, Sello y Asedio

Placas de guardia que se abren al absorber golpes, runas que cierran al detonar y disparo pesado con retroceso y marcas de perforación. El laboratorio incorpora la cámara de juego y un atacante opcional para probar la barrera. [Verificación visual](docs/verificaciones/ANIMACIONES_GUARDIA_SELLO_ASEDIO.md).

### 2026-11-18 — E2.4: comparación visual y cierre de E2

Cierra la zona de referencia de la puerta; aplicación 0.2.15. Ver [verificación](docs/verificaciones/VERIFICACION_E2_4.md) y [criterios de acabado](docs/diseno/ACABADO_EXTERIOR_E2.md).

- **Antes y después:** trece encuadres de E1 (último commit) frente a E2.4 con los mismos materiales, cámara y resolución, y cuatro con 100 enemigos ante la puerta. La horda se distingue igual o mejor sobre el suelo nuevo.
- **Auditoría `audits/e24-gate-zone.ts`:** compara E1 y E2.4 con hordas de 60 soldados en cuatro sitios y un barrido de cámara de 650 casillas. Nadie atraviesa sólidos. La horda tarda hasta 1 s más en cerrarse junto a la puerta y la cámara se obstruye algo más al pie de las torres (13 % frente a 11 %).
- **Corrección:** el pie de la escala colisionaba hasta 1,2 m y acercaba la cámara a 0,18 m; ahora mide 0,7 m.
- **Coste de render:** el sombreado de E2.2–E2.3 costaba hasta 4,7 ms por fotograma en planos cercanos. Ahora el ruido solo se calcula donde se ve: queda en una mediana de +1,4 ms sobre E1 sin horda (GPU integrada, 1440 × 900). Con 100 enemigos la diferencia queda dentro del ruido de medición.
- **Piezas reutilizables:** `src/rendering/exterior-pieces.ts` reúne materiales, herramientas, la puerta y los restos del asedio. El mundo produce exactamente la misma geometría y colisión, comprobado con una huella. En el laboratorio hay dos entradas nuevas en Escenario, «Puerta y torres» y «Restos del asedio».
- **Criterios de acabado** de escala, materiales, densidad, lectura y coste en `docs/diseno/ACABADO_EXTERIOR_E2.md`, a revisar por el usuario antes de E3.

Pruebas rápidas 355/355 y simulaciones completas 26/26, lint, typecheck y build correctos.

### 2026-11-18 — E2.3: explanada y camino inmediato

Muestra de suelo, vegetación y restos del asedio ante la puerta; aplicación 0.2.15. Ver [verificación](docs/verificaciones/VERIFICACION_E2_3.md).

- **Zona de muestra:** centro (4; −4), entera hasta 34 m y desvanecida a 48 m. El resto del mapa no cambia hasta E3.1.
- **Suelo (`wearGround` en `weathering.ts`):** el camino, la ronda y los claros pierden el borde recto y se gastan hacia el barro. Una segunda muestra girada de la textura oculta la cuadrícula del barro y del empedrado. Las cintas de camino llevan un vértice central y un atributo `edge`.
- **Barro mojado** al pie de la muralla, once charcos que reflejan el cielo y unas 60 piedras sueltas.
- **Vegetación:** malezas altas al pie de la muralla y de las torres, matas entre los adoquines y zarzas en cuatro rincones.
- **Restos del asedio:** un ariete quemado ante la torre este, una escala contra la muralla y otra derribada, un barril y otro reventado, flechas clavadas, escudos caídos, una hoguera apagada, estacas y un estandarte en el barro. Solo colisionan el ariete, el barril y el pie de la escala.
- **Prueba nueva:** el camino, la ronda, la explanada y el primer encuentro quedan libres.
- **Coste:** de 24 a 27 mallas fusionadas, de 861 a 864 obstáculos y +3,2 % de triángulos. GPU sin medir (E2.4).

Pruebas rápidas 353/353 y simulaciones completas 26/26, lint, typecheck y build correctos. Revisión en catorce encuadres fijos, cinco de ellos nuevos para la explanada.

### 2026-11-18 — E2.2: materiales y construcción

Desgaste de piedra, madera y hierro, con remates y daños en la puerta de E2.1; aplicación 0.2.15. Ver [verificación](docs/verificaciones/VERIFICACION_E2_2.md).

- **`rendering/weathering.ts`:** una pasada de sombreado sobre los materiales existentes, por posición en el mundo y sin texturas nuevas. Aplica variación de tono en grande, humedad y musgo al pie, suciedad y liquen en las caras superiores, regueros de lluvia, hollín sobre las antorchas de la puerta y óxido en el hierro.
- **Base:** piedra más fría y con más relieve en las juntas, madera más gris y hierro menos brillante. Como los materiales son compartidos, el cambio alcanza a todo el escenario.
- **Puerta:** albardillas y cornisa; en cada torre un merlón caído y otro partido, con sus piedras al pie; un merlón partido en el cuerpo de guardia; una tabla arrancada del cadalso y otra colgando; estandartes rasgados y banderolas de cola de golondrina.
- **Coste:** mismas 24 mallas fusionadas y 861 obstáculos que en E2.1; +0,2 % de triángulos. Coste de GPU del sombreado sin medir (E2.4).

Pruebas rápidas 347/347, lint, typecheck y build correctos. Revisión en los nueve encuadres de E2.1.

### 2026-11-18 — E2.1: puerta y dos torres

Primera subfase de E2, según el concepto [Puerta de hierro](arte/01-puerta-de-hierro.png). Solo cambian `game/src/rendering/world.ts` y una prueba nueva; aplicación 0.2.15, sin cambios de reglas, clases, cámara ni recuentos del plan. Ver [verificación](docs/verificaciones/VERIFICACION_E2_1.md).

- **Torres:** las dos torres cuadradas de 10 m, casi a ras de la muralla, pasan a ser redondas: pie en talud, imposta, matacanes, almenas hasta 14,3 m, saeteras, estandartes al frente y banderola en lo alto. Están adelantadas 5 m y no llevan tejado, para distinguirlas de las demás torres.
- **Paso:** cuerpo de guardia con bóveda entre las torres y arco de 4,4 × 5,5 m (antes 5,9 × 7,25 m), con dovelas y clave. Rastrillo de hierro bajado en la boca y portón de madera al fondo.
- **Coronación:** cadalso de madera sobre vigas y tornapuntas, con troneras y tejaroz de pizarra.
- **Antorchas** con copa en los flancos interiores de las torres, iluminando la boca. Sin hierba ni piedras en el paso ni al pie de las torres; el reparto de hierba en el resto del mapa no cambia.
- **Colisión:** las torres colisionan por franjas que no quedan dentro de la piedra visible. El personaje llega hasta el rastrillo. La prueba nueva rodea las torres por el pie de la muralla en ambos sentidos.
- **Coste:** de 22 a 24 mallas fusionadas, de 856 a 861 obstáculos y +0,4 % de triángulos. Fotogramas y GPU sin medir (E2.4).

Pruebas rápidas 347/347 y simulaciones completas 26/26 (14 campañas de seis minutos con victoria), lint, typecheck y build correctos. Revisión visual en nueve encuadres fijos antes y después, con las tres clases para la escala. No se recorrió la partida real hasta la puerta en el navegador (panel oculto, un fotograma por segundo).

### 2026-11-17 — Repositorio, CI y orden del código

Sin cambios de jugabilidad; aplicación 0.2.15.

- **Git y GitHub:** repositorio privado borisc000/la-fortaleza. Binarios de arte (.blend, .png, GLB de art/) por Git LFS; game/public en git normal para que la CI no consuma cuota LFS. Finales de línea LF también en Windows.
- **CI (GitHub Actions):** formato y lint, typecheck, pruebas rápidas y build en cada push y PR; simulaciones completas en un trabajo aparte solo en main o a mano.
- **Pruebas:** npm test tardaba más de 40 min porque world.test.ts simulaba 14 campañas de seis minutos (unos 3 min cada una) y balance.test.ts otras 12 sondas. Pasan a tests/simulation/ (npm run test:sim, unos 20 min en paralelo). La suite rápida queda en 346 pruebas y unos 30 s.
- **main.ts dividido:** de 72 KB a 26 KB; la interfaz DOM pasa a src/ui/ (HUD, radar, tutorial, anuncios, subida de nivel, tienda, resultados y ajustes) y lee la partida mediante UiContext. Verificado en navegador: selección de clase, HUD, subida de nivel con teclado, pausa, derrota y resultados, nueva expedición y tienda con salida por Esc. Compra real no probada (sin monedas en la prueba).
- **Biome 2.6.4** como linter y formateador (typescript-eslint no admite TypeScript 7). Todo el código formateado en un commit aparte, listado en .git-blame-ignore-revs.
- **Documentación:** diseño en docs/diseno/, verificaciones y evidencias en docs/verificaciones/, historial en este archivo; 179 enlaces reescritos sin enlaces rotos.
- **Hallazgo de rendimiento (pendiente):** en una campaña simulada, la navegación de enemigos dentro de combat.step (Navigation.update y clearPath contra todos los sólidos) es la mayor parte del coste de CPU de la simulación. Revisar en 4.6.

### 2026-11-15 — Primera pasada visual del escenario

Pedida por el usuario fuera del orden E2 → E6: veía el escenario plano y vacío y quería mejorar a la vez terreno, fortaleza, vegetación y luz. Es una pasada transversal, no el cierre de ninguna subfase; E2.1 sigue abierta. Solo `game/src/rendering/world.ts`.

- **Luz y atmósfera:** sol más bajo, cálido e intenso, ambiente más frío, cielo y niebla más oscuros.
- **Terreno:** suelo subdividido con manchas claras, oscuras y verdosas por color de vértice. Fuera de las vallas sube hasta 7–19 m; el área jugable y la fortaleza siguen planas.
- **Vegetación:** hierba en praderas densas de matas de dos briznas sobre las manchas verdes, barro desnudo en el resto. Arbustos bajos sin colisión lejos de rutas y claros. Pinos de cinco niveles con tono, grosor e inclinación propios, que ahora proyectan sombra. Doce bosquecillos nuevos con colisión dentro del área (margen de 5,5 m a rutas y claros) y un bosque sin colisión fuera de las vallas.
- **Fortaleza:** tejados de pizarra en trece torres, ménsulas bajo los parapetos, pilastras y cornisa en los lienzos largos, galería almenada sobre la puerta, torre del homenaje en piedra más fría con ventanas iluminadas. Colinas más altas y oscuras.

Los obstáculos pasan de 785 a 856, todos por troncos de los bosquecillos; el resto de lo añadido no colisiona. Triángulos del escenario: de 70.880 a unos 300.000 (medido 411.601 antes de recortar la hierba un tercio). Construcción del mundo: de 0,26 s a algo más de 1 s.

Tipado y compilación correctos. Revisado en navegador a 1440 × 900 desde la llegada, ante la puerta, a 60 m de la fortaleza, en el bosque del este y en los campos del asedio. **Rendimiento sin medir:** la pestaña de revisión estaba limitada a 1 FPS ya antes del cambio. Sin tocar: cofres, mercader, fuente y captura (`exploration.ts`), ruinas, campamentos, carretas y bordes de los caminos.

### 2026-11-15 — Pulido de «Acero tallado»

Segunda pasada pedida por el usuario, solo `game/src/style.css`. Las placas (menús, tarjetas de clase, mejora y mercader) ganan un canto visible: borde fino más dos degradados que trazan las diagonales cortadas, porque `clip-path` recortaba bordes y sombras y las placas se fundían con el velo. Los botones secundarios pasan a relleno tenue: su contorno quedaba cortado por el paralelogramo y se veía como dos rayas sueltas. En partida, las tres manchas oscuras por bloque se sustituyen por dos franjas a todo el ancho (arriba y abajo) y el velo del héroe se desvanece sin borde recto. Resúmenes de técnicas y reliquias de los menús en gris acero en vez de dorado.

Compilación correcta. Revisado en navegador a 1440 × 900: inicio, HUD en partida, pausa y elección de afinidad. Sigue sin revisar: mercader, resultados, panel del jefe, avisos de amenaza, vida baja y reglas compactas de móvil. Radar sin cambios.

Continuación el mismo día. Radar: anillos y flecha del héroe en acero (`main.ts`, solo dos colores del dibujo). Mercader: el precio sube a la fila de la etiqueta, porque junto al nombre lo partía en tres líneas. Resultados: columna de cifras del desglose de daño con ancho fijo para que las barras terminen alineadas. Rótulos «Cerca de ti» y lugar actual en tono claro. Tipado y compilación correctos. Mercader, resultados y panel del jefe revisados a 1440 × 900 con contenido de muestra inyectado en la página, no en partida real. Aviso de amenaza y vida baja siguen sin ver: el bucle del juego los restablece en cada fotograma. Móvil sin revisar.

### 2026-11-15 — Interfaz «Acero tallado»

Cambio de estilo pedido por el usuario, que veía la interfaz «de web». Solo `game/src/style.css`: paleta fría de acero en las variables base (los nombres `--gold*` se conservan y ahora valen acero; el dorado de recompensa es `--ember`) y una capa final que redefine forma y materia sin tocar la disposición. El HUD de combate pierde sus paneles: barras en paralelogramo, placas octogonales para las habilidades, casillas de reliquia en rombo, reloj y objetivo como texto sobre la escena, con velos oscuros suaves detrás para que se lea sobre cielo y suelo claros. Menús en una sola placa de acero con cantos cortados; botones en paralelogramo, tarjetas biseladas con símbolo en rombo, títulos en mayúsculas espaciadas y sin píldoras ni radios. No se cambió ningún id ni el código de `main.ts`. Copia de la hoja anterior en el directorio temporal de la sesión, no en el repositorio.

Compilación correcta. Revisado en navegador a 800 × 531–600: inicio, pausa, elección de afinidad y HUD en partida. No revisado con este estilo: mercader, resultados, panel del jefe, avisos de amenaza, pantallas anchas (1440 px o más) ni las reglas compactas de móvil. El radar se dibuja en un canvas con sus colores anteriores; sus anillos siguen en dorado.

### 2026-11-15 — Enemigos: equipo por tipo y menos llamadas de dibujo

Cada tipo de enemigo tiene ya silueta y equipo propios sobre el esqueleto común, con piezas fusionadas por grupo y material: de 32–40 mallas por enemigo a 13–14. El Despojo de horda sigue en tres llamadas, con más silueta y tamaño variable. Solo representación. Tipado, compilación y 67 pruebas correctos; vistos los seis en laboratorio. Rendimiento real y combate de élite y jefe sin medir. Detalle en LABORATORIO_MODELOS.md.

### 2026-11-15 — Arquero: pulido de capucha, capa y equipo

Capucha con corona y caída, capa con pliegues, hombrera de cuero, cuchillo de caza y ligaduras en el arco, instalados en el juego. 54 mallas y 34.548 triángulos. Versión anterior en `game/art/revisions/archer-2026-11-07`. Compilación y 31 pruebas correctas; visto en laboratorio en ataque. Las tres clases tienen ya su pasada de pulido del 15 de noviembre; ninguna se ha medido en campaña densa. Detalle en LABORATORIO_MODELOS.md.

### 2026-11-15 — Guerrero: pulido de armadura y espada

Hombreras abombadas con láminas, faldar, espaldar, piernas con más volumen y espada más ancha, instalados en el juego. 44 mallas y 56.520 triángulos. Versión anterior en `game/art/revisions/warrior-2026-11-08`. Compilación y 28 pruebas correctas; visto en laboratorio en reposo y caminando. Ataque, Torbellino y partida real sin revisar. Detalle en LABORATORIO_MODELOS.md.

### 2026-11-15 — Mago: pulido de túnica, mangas, botas y báculo

Nueva pasada del GLB del Mago instalada en el juego: pliegues en la túnica, mangas acampanadas, botas en tres piezas, báculo detallado y remates de latón. 78 mallas y 54.260 triángulos. Versión anterior archivada en `game/art/revisions/mage-final-2026-11-07`. Typecheck, build y 33 pruebas correctos; visto en laboratorio y en partida. Detalle y pendientes en MAGO_MALLA.md. De paso, la cortina de entrada al territorio se retira con un temporizador aunque el navegador congele la animación.

### 2026-11-14 — Acabado: sonidos de interfaz, transiciones y primeros pasos

Tres señales nuevas en `game/src/audio/game-audio.ts` (`tick`, `select`, `menu`), más suaves que las del mundo: tic al pasar o enfocar un control, clic al pulsarlo y tono al pausar; tarjetas de mejora y ofertas conservan sus señales propias. Al entrar al territorio la escena aparece desde negro y el HUD entra después; el velo de resultados entra más lento. Lista «Primeros pasos» a la izquierda con cinco pistas (caminar, mirar, combatir, recoger esencia, interactuar) que se tachan al cumplirse; al completarse se desvanece y no vuelve a mostrarse (clave `fortaleza.primeros-pasos` en localStorage). Oculta en táctil y pantallas bajas. Typecheck, build y 14 pruebas dirigidas (polish, controls) correctos; suite completa no repetida tras ninguno de los cinco bloques de hoy. En navegador, partida real: lista visible y dos pistas marcadas solas. No verificado: los sonidos (el panel de vista previa no deja oírlos), las transiciones animadas (el panel las congela), las pistas de caminar, mirar e interactuar, ni el cierre de la lista al completarse.

### 2026-11-14 — Menús y flujo: pausa, mercader, resultados y ajustes

Solo interfaz. Pausa con cifras (tiempo, abatidos, nivel, monedas) y resumen de configuración en fichas con icono (habilidades y nivel, afinidad, reliquias, estadísticas); el mismo resumen sustituye a la línea de texto en resultados. Resultados con cifras que cuentan hacia arriba y desglose de daño por origen (ataque básico, habilidad de clase, habilidades, quemadura, etc.) más daño recibido; el desglose lo suma `game/src/app/damage-tally.ts` a partir de los eventos de combate que ya se emiten, sin tocar el dominio, y agrupa todas las habilidades equipadas en una sola fila porque el evento no dice cuál fue. Mercader con icono, tipo, precio destacado, rango «antes → después» y «Faltan N monedas» cuando no alcanza. Ajustes: tamaño de interfaz 85–125 % y «Reducir destellos y sacudidas»; no se guardan entre sesiones. Typecheck, build y 22 pruebas dirigidas (polish, activities) correctos; suite completa no repetida. En navegador, partida real: pausa, HUD a 125 % y resultados de una derrota con desglose. No se vio el mercader con el diseño nuevo ni la opción de efectos reducidos en acción; a 800 × 600 la interfaz a 125 % queda apretada.

### 2026-11-14 — Lectura del encuentro: radar y anuncios

Solo interfaz. Radar circular en el panel «Cerca de ti», centrado en el héroe y orientado con la cámara (alcance 32 m; lo lejano se fija al borde): enemigos, élite/jefe, núcleo y los objetos ya descubiertos (mercader, cofres, fuentes, captura), con el mismo color en la lista de debajo. Anuncios grandes y breves al centro para inicio, aparición del Portador, último obstáculo, llegada y duelo del Castellano, su Furia a media vida, captura inminente y puesto asegurado. El panel del jefe entra con animación. Función pura `radarPoint` en `game/src/app/guidance.ts` con prueba. Typecheck, build y 39 pruebas dirigidas (polish, exploration, campaign) correctos; suite completa no repetida. En navegador, partida real: radar con enemigos, cofre y mercader, y anuncio de inicio (con opacidad forzada, porque el panel de vista previa congela las animaciones). No se vieron en partida los anuncios de élite, jefe, Furia ni captura, ni el radar con alcance 32 m (se revisó a 55 m y se redujo después).

### 2026-11-14 — Progresión: iconos y tarjetas de mejora

Solo interfaz. Juego de iconos propio en `game/src/app/icons.ts` (trazos SVG 24 × 24 dibujados para el proyecto, sin recursos externos): las 27 habilidades, 12 reliquias, 13 estadísticas, cuatro afinidades, maestría y monedas; las técnicas antiguas conservan su símbolo de texto. Tarjetas de mejora con etiqueta y color por tipo (nueva habilidad, mejora, elección exclusiva, estadística, afinidad, reliquia, maestría), icono, rango como paso «antes → después», entrada escalonada y pantalla de «adquirido» con el icono. HUD: icono en cada espacio de habilidad, cuatro casillas de reliquias en la placa del héroe, barra de esencia con relleno animado y destello al recoger, e insignia de nivel que resalta al volver de una subida. Prueba nueva en `tests/polish.test.ts` (todo id de contenido tiene icono; clasificación por id). Typecheck, build y 45 pruebas dirigidas (polish, progression, relics, ability-foundation) correctos; suite completa no repetida. Revisado en navegador en partida real del Guerrero: afinidad de nivel 2, mejora de nivel 3, pantalla de adquirido e icono en la barra. No se vieron en partida las tarjetas de reliquia, maestría ni elección exclusiva, ni las casillas de reliquia ocupadas; Mago y Arquero solo cubiertos por la prueba de iconos.

### 2026-11-14 — Respuesta visual al combate

Solo representación y coordinación, sin tocar reglas. Números de daño con color por origen (quemadura/explosión, salpicadura, temblor, ráfaga, daño recibido), tamaño según el golpe, aparición con rebote y dispersión para no apilarse. Barra de vida con tramo de daño reciente que se vacía con retraso, sacudida al recibir golpes y destello al curarse. Flechas en el borde de pantalla hacia amenazas fuera de cámara (enemigo preparando ataque, proyectil entrante, élite/jefe con distancia, núcleo) y arco rojo breve hacia quien acierta un golpe cuerpo a cuerpo; el aviso de texto se conserva. Funciones puras nuevas `edgeAnchor` (`src/app/guidance.ts`) y `damageTone`/`damageScale` (`src/rendering/damage-labels.ts`) con prueba en `tests/polish.test.ts`. Typecheck, build y 29 pruebas dirigidas (polish, combat, camera) correctos; la suite completa no se repitió. Revisión en navegador en partida real: números con tono y tecla 1 en mejoras. Flechas de borde, arco de golpe y tramo de daño reciente se revisaron con valores de muestra forzados; falta verlos dispararse solos en una partida a velocidad normal.

### 2026-11-13 — Pulido general de interfaz

Rediseño visual de HUD y menús sin tocar reglas ni contenido: placa del héroe (vida, esencia, afinidad), reloj con abatidos y monedas arriba al centro junto a objetivo, jefe y orientación, barra inferior de pasiva y cuatro habilidades con enfriamiento visible, avisos e interacción apilados sobre ella. Inicio en dos columnas con tarjetas de clase y afinidad (los `select` originales siguen siendo la fuente de verdad, ocultos). Mejoras con tarjetas y teclas 1–4, resultados con cuadrícula de cifras, Ajustes como desplegable junto a Pausar. Cambios en `game/index.html`, `game/src/style.css` y coordinación de `game/src/main.ts`. Typecheck y build correctos; revisión visual en navegador a 1440 × 810, 1100 × 620 y 844 × 390 (redimensionado, no prueba física móvil). Mejoras, mercader y resultados se revisaron con contenido de muestra; falta recorrerlos en una partida completa.

### 2026-11-12 — E1.4: recorrido y combate

Tres itinerarios con combate: 2.041 m, siete rutas y seis sectores, sin bloqueos detectados. Doce comprobaciones de límites y retorno, veinte pruebas de cámara/controles/movimiento, typecheck y build correctos. Recorrido sur-puerta en navegador con las tres clases; giro, retracción y rueda 4–18 m revisados. Se mantiene 0.2.15 porque la entrega añade auditorías y documentación, sin cambios de juego. Presión durante avance continuo anotada para E5.3; rendimiento controlado pendiente de E6. [Evidencias](docs/verificaciones/VERIFICACION_E1_4.md). Sigue E2.1.

### 2026-11-11 — E1.3: encaje funcional

Aplicación 0.2.15. Cofres, fuentes y tienda al margen de las rutas, acceso y captura despejados; apariciones separadas de las huellas de objetos persistentes. 65 pruebas dirigidas, 2.880 muestras de cámara y build correctos; inspección visual de seis ubicaciones y arranque de partida real. [Registro](docs/verificaciones/VERIFICACION_E1_3.md). Sigue E1.4.

### 2026-11-11 — E1.2: rutas y sectores

Aplicación 0.2.14. Eje hacia la fortaleza, circuitos oeste/este, tres conexiones transversales y ronda de la muralla; quince hitos redistribuidos, claros de combate, territorios explícitos y referencias de volumen por sector. 35 pruebas dirigidas y build correctos; 4.212 muestras de ancho libre, siete rutas recorridas físicamente, revisión en navegador y laboratorio. [Registro y capturas](docs/verificaciones/VERIFICACION_E1_2.md). Sigue E1.3; el acabado artístico continúa pendiente de E2–E4.

### 2026-11-11 — E1.1: ampliación y llegada sur

Aplicación 0.2.13. Área 280 × 260 m, terreno y límites periféricos ajustados; llegada (20, 205), guardia inicial y recompensas coordinadas. Selección y reinicio verificados en navegador, con revisión de las tres clases. Captura desplazada 8 m respecto del plano para encajar con la abadía existente. Presupuesto inicial conservado. 332 pruebas seleccionadas y compilación correctas; tres campañas de integración con captura, tienda y victoria, con vida ampliada solo en las pruebas. Evidencias, pruebas y límites en [VERIFICACION_E1_1.md](docs/verificaciones/VERIFICACION_E1_1.md). Sigue E1.2; sin avance de 2.8.

### 2026-11-11 — E0: evaluación y redefinición completadas

Revisadas dieciséis vistas, el laboratorio y un recorrido breve en partida. Los quince hitos son accesibles; el circuito de referencia mide 518,75 m y 103,75 s sin combate. El diagnóstico prioriza diferenciación de sectores, distribución de actividades y relieve visual periférico. Ampliación definida para E1: 280 × 260 m, conservando puerta y fortaleza, con llegada desde el sur. Auditoría sintética de render a cámara 12 m, 1440 × 900 y DPR 1: 93,7–96,0 FPS medios, p95 de 12,5–13,4 ms, con 0/100 despojos; no equivale a combate completo ni medición directa de GPU. Compilación correcta. Herramientas, plano y evidencias en [evaluación E0](docs/diseno/EVALUACION_DOMINIOS_E0.md). Sin cambios en `src` ni avance de 2.8.

### 2026-11-11 — Plan de revisión del primer escenario

Definidas siete fases E0–E6, con cuatro subfases cada una, para evaluación, ampliación moderada, acabado de la entrada, terreno, sectores, exploración/combate y cierre. Confirmados en código los límites actuales y revisadas la estructura del escenario y la dirección narrativa. La evaluación visual completa queda como primera tarea de E0. Entrega documental, con revisión de enlaces y coherencia; no requiere pruebas de juego ni supone implementación del mapa.

### 2026-11-08 — Ajustes de encaje del Guerrero

Faldones adaptados a la cadera, anillas ajustadas a la cota, hombreras con solape reducido y espada que gira junto con la mano. Compilación y 21 pruebas correctas. Ver LABORATORIO_MODELOS.md.

### 2026-11-08 — Dirección narrativa de los tres primeros escenarios

Registrada la recuperación de una misma fortaleza. Los dominios exteriores abre el acceso, El corazón de piedra recupera el interior y La primera bandera combina defensa del exterior/patios con una incursión en las catacumbas. La secuencia detallada, los jefes y las transiciones quedan por diseñar. Referencia para el pulido del primer escenario en [campaña por eras](docs/diseno/IDEA_CAMPANA_ERAS.md).

### 2026-11-07 — Revisión final del Mago

Agarre de bastón remodelado, capas del grimorio con deformación compartida y bordados más legibles. Revisión visual y 18 pruebas dirigidas correctas. Detalle en MAGO_MALLA.md.

### 2026-11-07 — Acabados pequeños de las tres clases

Grimorio y cuello del Mago, capa/correaje y ataduras del Arquero, pechera/faldones y hebilla del Guerrero. Las fábricas del juego usan estos GLB. Registro en LABORATORIO_MODELOS.md.

### 2026-11-07 — Unión de la capucha corregida

Capucha y manto del Mago conectados en una superficie, con anclaje al torso y transición hacia la cabeza. Compilación y 17 pruebas correctas. Ver MAGO_MALLA.md.

### 2026-11-07 — Mago refinado nuevamente

Malla vigente con nueva capucha, transición al cuello y manto, rostro y mano de lanzamiento. 16 pruebas correctas. Detalles en MAGO_MALLA.md.

### 2026-11-07 — Tres bases aprobadas y pulido fino

El usuario aprueba los tres modelos GLB como base actual. Copias fechadas de las mallas, escenas y generadores conservadas antes de pulir. El juego usa el pulido vigente. En el laboratorio se compara Actual pulido con Aprobado 07 nov. Ver LABORATORIO_MODELOS.md.

### 2026-11-07 — Guerrero de malla

Guerrero de Blender integrado en partida y laboratorio. Cuero, cota, placas curvas y espada articulada. Apariencia de veterano con barba corta y paño granate. Versión orgánica anterior preservada. Las tres clases cuentan con recurso GLB. Detalles en LABORATORIO_MODELOS.md.

### 2026-11-06 — Arquero articulado

La partida y el laboratorio cargan el nuevo Arquero de Blender. El catálogo conserva su pulido anterior y la base aprobada, con comparación desde el mismo ángulo. Detalle y verificación en [Laboratorio de modelos](docs/diseno/LABORATORIO_MODELOS.md). El siguiente personaje del paréntesis artístico es el Guerrero.

### 2026-11-05 — Mago: recurso GLB articulado

Primera malla exportada desde Blender, fuente editable, rig básico, carga en juego y laboratorio. 15 pruebas dirigidas correctas. Acabado artístico/locomoción completos pendientes. Ver MAGO_MALLA.md. Sin avance de 2.8.

### 2026-11-05 — Guerrero con superficies orgánicas

Nuevo contorno curvo y prendas envolventes; pulido anterior y base aprobada conservados en el laboratorio (20 entradas). Ver LABORATORIO_MODELOS.md. Mago y Arquero no modificados en esta pasada.

### 2026-11-05 — Mago y Arquero refinados

Pulido de proporciones, silueta y prendas integrado en ambas clases. Las tres bases aprobadas con accesorios siguen preservadas en el laboratorio. Detalle y evidencia en LABORATORIO_MODELOS.md.

### 2026-11-05 — Revisión artística del Guerrero

Bases con accesorios aprobadas y preservadas para las tres clases. Guerrero refinado en proporciones, silueta y prendas, disponible en juego y laboratorio. Detalles y límites en LABORATORIO_MODELOS.md. Sin avance de 2.8.

### 2026-11-04 — 2.7.6: ritmo y claridad

- Curva de esencia, ofertas, monedas, suministros, protección de impacto y legibilidad ajustados. Balance inicial; no se declara igualdad entre configuraciones.
- Aplicación 0.2.12; 49 subfases, 22 futuras. Siguiente 2.8. Evidencia en VERIFICACION_2_7_6.md.

### 2026-11-03 — 2.7.5: hordas densas

- Despojos frágiles, amenazas minoritarias, reposición frecuente, cuatro segundos de respiro y presupuesto compartido con capturas.
- Índice espacial de separación, instancias para cuerpos/avisos, laboratorio local reproducible y diagnóstico de población. 279 pruebas y tres campañas completas seleccionadas correctas; build correcto. Alcance de campañas y revisión visual en VERIFICACION_2_7_5.md.
- Aplicación 0.2.11; 49 subfases, 23 futuras. Siguiente 2.7.6.

### 2026-11-03 — 2.7.4: Mago y Arquero

- Integrados dieciséis ataques especiales y sus dos básicos, progresión común, efectos y HUD. Técnicas antiguas migradas a ramas.
- 274 pruebas de regresión y dos campañas seleccionadas correctas; tipado y build correctos. Límites en VERIFICACION_2_7_4.md.
- Aplicación 0.2.10; 49 subfases, 24 futuras. Siguiente 2.7.5.

### 2026-11-02 — División de 2.7.3 y entrega del esqueleto

- Usuario pidió dos entregas y ejecutar primero la base. 2.7.3 se sustituye por 2.7.3a/b; 49 totales, 26 futuras tras cerrar la primera.
- Cuatro módulos nuevos, ocho pruebas dirigidas correctas y build correcto; juego visible sigue en 0.2.8. Arquitectura e integración pendientes documentadas. Siguiente 2.7.3b.

### 2026-11-02 — Idea futura de campaña por eras

- Registrada a petición del usuario en [IDEA_CAMPANA_ERAS.md](docs/diseno/IDEA_CAMPANA_ERAS.md). Eras de tres a cinco etapas; primera era: recuperar exterior, interior y resistir un ataque para consolidar la fortaleza. Desarrollados contexto, posibles etapas opcionales, eras posteriores y relación con progresión.
- Concepto documental para después. Juego 0.2.8, próxima 2.7.3 y plan de 48 subfases/26 futuras conservados. Interior completo y asedio requerirán ampliación de alcance; no se implementan ahora.

### 2026-11-02 — 2.7.1 definida: repertorios y árboles hasta nivel 10

- Petición del usuario: varias habilidades por clase, niveles hasta 10, más de diez opciones y ramas de proyectiles, penetración, recarga y velocidad. Definidos ocho ataques especiales por clase, cuatro espacios contando el inicial, básicos aparte, cuatro ramas de tres rangos e hitos excluyentes 5/10: dieciséis opciones de desarrollo por habilidad.
- Catálogo de 24 habilidades, doce familias generales y Temple, migración de las doce técnicas, reglas de ofertas y topes. Aprender/mejorar/estadísticas compiten; ninguna habilidad se otorga por esperar. Presupuesto de elecciones y experiencia a revisar en 2.7.6.
- Integridad documental comprobada. Sin cambios de código, versión ni nuevas pruebas de juego. Plan: 48 entregas, 27 futuras; fase 2 en 8/15. Siguiente 2.7.2.

### 2026-11-02 — Replanificación: habilidades y combate masivo

- Corrección expresa: las oportunidades de mejora permiten escoger estadísticas, mejorar una habilidad o aprender otra de clase; 30–45 s no garantiza aprender una habilidad. Esencia como vía propuesta de progreso, sin otro premio automático por bajas.
- Se insertan seis subfases 2.7.1–2.7.6 antes de 2.8, con cámara/mapa, repertorios, hordas y balance. Plan: 48 totales, 28 futuras; fase 2 en 7/15. Se ajustan dependencias y tareas de fases 3 y 4. R manual pendiente.
- Solo documentación; juego 0.2.7 sin cambios. Las verificaciones anteriores conservan su alcance. Próxima entrega: definir 2.7.1.

### 2026-11-01 — Subfase 2.7: reliquias y doble afinidad

- Aplicación 0.2.7: doce reliquias, cuatro espacios y segundo elemento opcional desde nivel 5, rangos I–III. El principal conserva kit y única maestría; el apoyo aplica estados/control sin recursión. Sello de pureza permite comprometer una configuración de un solo elemento.
- Cofres ofrecen reliquia o monedas; captura conserva 25 monedas y añade elección; tienda incorpora tres ofertas por semilla. Inventario, requisitos, stock, HUD, resultados y segundo aro elemental.
- **246/246 pruebas y compilación correctas**: 17 nuevas, 36 combinaciones ordenadas en encuentros pequeños y catorce campañas completas; doce con dos cofres, captura, compra, cuatro reliquias, tres técnicas, doble afinidad, núcleo y maestría. Vida ampliada solo en campañas largas; no acredita balance. HTTP 200 de 0.2.7. Registro en VERIFICACION_2_7.md.
- Fase 2 en 7/9; 22 subfases futuras. Siguiente 2.8. Revisión visual, escucha, balance humano, GPU y teléfono pendientes.

### 2026-11-01 — Subfase 2.6: técnicas y espacios de configuración

- Aplicación 0.2.6: cuatro técnicas por clase, tres espacios, rangos I–III a niveles 3/5/7 y exclusión de la cuarta. Aprender/mejorar consume una elección; mejorar no consume otro espacio. Ofertas deterministas y catálogo consultable.
- Guerrero: Barrido, Estocada, Guardia firme y Giro prolongado. Mago: Eco arcano, Resonancia, Concentración y Convergencia. Arquero: Abanico, Punta larga, Cadencia y Lluvia extensa. Todo automático; instantáneas de acciones, colisiones y topes conservados.
- HUD, catálogo y resultados con espacios/rangos. **229/229 pruebas y compilación correctas**, incluidas catorce campañas completas y doce configuraciones con tres técnicas, captura/tienda, núcleo y maestría. Registro final en VERIFICACION_2_6.md. Revisión visual, escucha, balance humano, GPU y teléfono pendientes.
- Fase 2 en 6/9; 23 subfases futuras. Siguiente 2.7; Acorazado aplazado.

### 2026-11-01 — Subfase 2.5: afinidades de las tres clases

- Aplicación 0.2.5: Mago elige cuatro elementos antes de comenzar; Guerrero/Arquero al nivel 2. Doce combinaciones con mejoras y primeras maestrías.
- Mago/Tierra: rocas, Quebranto, coraza y último pulso reforzado. Mago/Aire: alcance, empuje y vórtice fijo. Arquero/Tierra: Quebranto y penetración de armadura. Arquero/Aire: vuelo rápido, alcance y blancos adicionales con Precisión.
- Selector, HUD, geometrías y efectos diferenciados; daño y colisiones en dominio. **213/213 pruebas y compilación correctas**; catorce campañas completas, diez anteriores con resultados idénticos y cuatro combinaciones nuevas con captura, compra, núcleo, maestría y victoria. Registro final en VERIFICACION_2_5.md. Revisión visual, escucha, balance humano, GPU y teléfono pendientes.
- Fase 2 en 5/9; 24 subfases futuras. Siguiente 2.6. Acorazado fuera del alcance activo.

### 2026-11-01 — Subfase 2.4: Tierra y Aire

- Aplicación 0.2.4: Guerrero elige cuatro elementos; Mago/Arquero conservan dos hasta 2.5. Tierra aplica Quebranto, protección de capacidad finita y ondas sísmicas de maestría. Aire amplía alcance, empuja y atrae con colisiones y resistencias explícitas.
- Tarjetas por afinidad disponible, símbolos, HUD, marcas angulares, coraza pétrea y remolino. Protección, debilitamiento y daño resueltos en dominio; representación sin daño propio.
- **193/193 pruebas y compilación correctas**; diez campañas completas, incluidas Tierra/Aire con captura, compra, núcleo, maestría y victoria. Ocho campañas previas y tres trazas del Guerrero conservan resultados. Registro en VERIFICACION_2_4.md. Siguiente 2.5, afinidades de las tres clases; fase 2 en 4/9, quedan 25 subfases. Revisión visual, escucha, balance humano y GPU pendientes.

### 2026-11-01 — Acorazado aplazado y plan reajustado

- Petición expresa: «Dejemos el Acorazado fuera por ahora. Ajusta las subfases considerando esto».
- Acorazado fuera del alcance activo, conservado como propuesta futura sin fecha ni desbloqueo automático. Tres clases iniciales: Guerrero, Mago y Arquero; cuatro elementos, doce combinaciones, doce técnicas y doce maestrías. Doce reliquias y Sacerdote de 3.9 conservados.
- Antigua 2.4 retirada; antiguas 2.5–2.10 renumeradas a 2.4–2.9. Fase 2: 3/9 implementadas; total 42 subfases y 26 futuras. Siguiente: **2.4, Tierra y Aire**.
- Actualizados plan, diseño, criterios de las fases posteriores y referencias activas. Cambio documental: aplicación 0.2.3 y validación anterior de 178 pruebas conservadas, sin ejecutar de nuevo pruebas de código. Los registros anteriores reflejan su alcance y numeración originales.

### 2026-11-01 — Subfase 2.3: Arquero jugable

- Aplicación 0.2.3: tercera clase seleccionable. Flechas físicas, afinidad al nivel 2, hasta tres blancos alineados mediante Precisión y lluvia automática en zona fija.
- Fuego con quemadura y seis descargas por maestría; Agua con una salpicadura por flecha y radios ampliados por maestría. Arco, carcaj, flechas, animación y sonidos propios provisionales.
- **178/178 pruebas y compilación correctas**; ocho campañas completas en mapa real, incluidas Fuego/Agua del Arquero con captura, compra, maestría y victoria. Las seis campañas anteriores y tres trazas del Guerrero conservan sus resultados. Registro en VERIFICACION_2_3.md. Próximo contenido: 2.4, Acorazado. Quedan 27 subfases de implementación; se conserva revisión visual, escucha, balance y rendimiento humano pendientes.

### 2026-11-01 — Subfase 2.2: Mago jugable

- Aplicación 0.2.2: selección Guerrero/Mago antes de comenzar, afinidad Fuego/Agua inicial del Mago y posibilidad de volver al selector desde pausa/resultados.
- Orbes con vuelo y obstáculos, cuarto disparo potenciado en área, Cataclismo anclado en el suelo y dos maestrías. Modelo con túnica/báculo, efectos y señales sonoras procedurales propios.
- **160/160 pruebas y compilación correctas**; seis campañas completas sobre el mapa real, incluidas Fuego/Agua del Mago con captura, compra, maestría y victoria. Resultados en VERIFICACION_2_2.md. Se conserva la referencia de tres trazas del Guerrero sin regenerarla. Balance humano, navegador, GPU y teléfono pendientes.
- Próxima entrega: 2.3, Arquero; quedan 28 subfases de implementación.

### 2026-11-01 — Subfase 2.1: estructura compartida de clases

- Aplicación 0.2.1: definición de estadísticas/arma/kit/afinidades, catálogo solo de clases disponibles, ejecución y efectos por instancia. Guerrero separado del motor común; progresión y tienda usan datos/textos de clase.
- Contratos de habilidades y efectos con prueba de sustitución; representación del personaje resuelta por fábrica. Alias históricos conservados para compatibilidad, sin duplicar valores.
- Tres trazas guardadas antes de editar 0.1.16 coinciden exactamente después: 10.800 pasos en total, sin elemento y con ambas maestrías. Registro completo en VERIFICACION_2_1.md.
- **144/144 pruebas y compilación correctas**. Cuatro campañas completas con los mismos resultados simulados de 1.10. Servidor local reiniciado y HTTP 200 de 0.2.1; revisión visual/auditiva y GPU pendientes, sin atribuirla a estas pruebas.
- Sin cambios de balance, mapa ni controles. No se añade aún Mago o selector; siguiente subfase 2.2.

### 2026-10-31 — Subfase 1.10: pulido inicial

- Aplicación 0.1.16: audio procedural con control de volumen, silencio y límite de ocho voces; cancelación al pausar, perder foco o reiniciar.
- HUD compacto, inicio más breve, paneles con desplazamiento, vida baja y prioridad de amenazas; avisos de proyectiles filtrados por trayectoria y obstáculos.
- Capturas ya no reducen las oleadas avanzadas a tres enemigos; apertura de tienda no aplaza la transición de 6:00. Ajustes pausan; HUD a 10 Hz con simulación y render independientes.
- Precios conservados tras auditoría: catálogo total de 68 monedas; el saldo excedente es un límite reconocido del catálogo provisional. Ver pruebas y pendientes en VERIFICACION_1_10.md.
- Consulta de navegador: sigue desactivado. No se declara revisión visual, escucha, dificultad humana ni FPS verificados.
- **137/137 pruebas y compilación correctas**; cuatro campañas completas con Fuego/Agua, por ruta de combate y pasando por captura/tienda. Vida ampliada solo en esas pruebas. Servidor local HTTP 200 en 0.1.16. Siguiente contenido: 2.1; revisión manual de 1.10 pendiente.

### 2026-10-31 — Subfase 1.9.3: captura y mercader

- Aplicación 0.1.15: un puesto de radio 6 m, aviso de 3 s y 25 s de permanencia; premio único de 25 monedas. Salir conserva el avance. Refuerzos mediante el mismo director y límite global. A 6:00 se cierra una captura incompleta sin premio.
- Mercader con E/botón táctil: pausa simulación, reloj y captura; cuatro ofertas con stock limitado. Curación 8 monedas, daño 18, vitalidad 18 y velocidad 16. Rangos compartidos con subidas de nivel. Esc deja la expedición pausada.
- Recorrido automático sobre el mapa real: captura, desplazamiento al mercader y compra en 35,80 s simulados, saldo 41 → 23. Vida ampliada solo en la prueba; no mide dificultad humana ni GPU. Registro completo en VERIFICACION_1_9_3.md.
- **128/128 pruebas y compilación correctas**, ambas campañas completas con maestría y victoria. HTTP 200 de 0.1.15; revisión visual/GPU y teléfono pendientes. Siguiente: 1.10.

### 2026-10-31 — Subfase 1.9.2: recompensas e interacción

- Aplicación 0.1.14: ocho cofres, cuatro fuentes, monedas y suministros; distribución reproducible con separación y rutas válidas. Moneda de expedición y premio por muerte normal real, sin recompensas por retirada.
- E/botón táctil, radio y línea libre, una activación por pulsación, usos limitados, conservación de curación con vida llena. Descubrimiento, tres destinos cercanos, saldo y resultados.
- Estado visual abierto/agotado, selección contextual, reinicio completo; interacción táctil conserva joystick y giro.
- **117/117 pruebas y build correctos**, geometría real con tres semillas y ambas campañas con maestría/victoria. HTTP 200; servidor local conservado. Revisión visual/GPU y teléfono pendientes por navegador desactivado. Registro en VERIFICACION_1_9_2.md.

### 2026-10-31 — Otro incremento moderado de 1.9.1

- Nueva petición «Un poquito más grande»: aplicación **0.1.13**, mapa **212 × 192 m**, **20,45 % más** que 0.1.12. Caminos exteriores, muralla, torres y terreno extendidos; colinas alejadas y distancia de dibujo de 300 m para abarcar el territorio. Zoom manual conservado.
- **106/106 pruebas y build correctos**, más repetición de ocho comprobaciones de cámara. Doce destinos transitables y 288 apariciones seguras. HTTP 200 de la nueva versión. Revisión visual/GPU sigue pendiente; no se avanzó a 1.9.2.

### 2026-10-31 — Ajuste moderado de tamaño en 1.9.1

- Petición «Un poquito más grande…»: aplicación **0.1.12**, mapa **192 × 176 m**, un **20 % adicional** respecto de 0.1.11. Camino principal y circuito sur extendidos; perímetro, muralla, torres y decoración adaptados.
- Doce zonas, combate y apariciones locales conservados. **106/106 pruebas y build correctos**; HTTP 200 de la nueva versión. Ver detalle en VERIFICACION_1_9_1.md. Sin avanzar a 1.9.2; verificación visual del agente/GPU sigue pendiente.

### 2026-10-31 — Segunda ampliación de 1.9.1

- El usuario pidió más tamaño antes de seguir. Aplicación **0.1.11**: territorio **176 × 160 m**, 3,33 veces la superficie delimitada de 0.1.10, y doce zonas conectadas.
- Nuevo circuito exterior con abadía, molino, atalaya, pradera y arboleda; terreno, muralla y horizonte ampliados. Distancias de refuerzo y controles conservados.
- Preparación de navegación por sectores de obstáculos, manteniendo precisión de colisiones. **106/106 pruebas y build correctos**, 288 apariciones seguras, recorrido físico de doce destinos y ambas campañas con maestría/victoria.
- Revisión visual del agente, GPU y teléfono siguen pendientes por limitación conocida de acceso al navegador. Registro actualizado en VERIFICACION_1_9_1.md. No se avanzó a 1.9.2.

### 2026-10-31 — Subfase 1.9.1: territorio y hordas locales

- Aplicación 0.1.10: exterior 96 × 88 m y seis referencias conectadas. Muestreo de superficie libre: 7.754 m², unas 3,61 veces el sector anterior sin su antigua valla.
- Refuerzos a 11–23 m con preferencia fuera de vista, aviso y navegación segura. Objetivos locales 5/7/9/11; reposición cada seis segundos como mínimo y tope global conservado. Retirada de normales lejanos sin premios; encuentros y núcleo preservados.
- Caminos, campamento, ruinas y bosque provisionales; guía de zona y dirección/distancia hacia encuentros importantes.
- 106/106 pruebas y build correctos; 180 apariciones seguras, recorrido de seis destinos y dos partidas completas con maestría/victoria. Vida ampliada solo en integración; no acredita balance humano. HTTP 200 del servidor local con nueva versión.
- Navegador del agente sigue desactivado; revisión visual, GPU y teléfono pendientes. Detalles en VERIFICACION_1_9_1.md. Próxima entrega: 1.9.2.

### 2026-10-31 — Ampliación del plan tras 1.9

- Insertadas 1.9.1 (mapa amplio/hordas locales), 1.9.2 (recogibles/interacción/orientación) y 1.9.3 (captura/tienda), antes de 1.10; se conservan los identificadores restantes. Total: 43 subfases, 34 pendientes.
- Ajustadas 1.10, 2.8, 3.1–3.2, 3.6–3.7, 3.10 y 4.5–4.6 para reutilizar estos sistemas y completar contenido, economía, tutorial y rendimiento.
- Captura propuesta de un punto territorial, comercio con PNJ mediante moneda de la partida y pausa en tienda; detalles en EXPANSION_1_9.md. Sin captura de criaturas ni comercio entre jugadores en este alcance.
- Diseño, contrato y guía de lectura sincronizados. Sin modificaciones del juego ni nuevas pruebas de ejecución; se mantiene la versión 0.1.9 y su verificación previa.

### 2026-10-31 — Subfase 1.9: el asedio completo

- Oleadas durante seis minutos, con cuatro etapas y respiros sin nuevos refuerzos normales en los últimos doce segundos de cada minuto. Máximo 40 vivos, 100 proyectiles y sin acumulación de oleadas pendientes. Posiciones con semilla reproducible; nueva semilla al reiniciar desde interfaz.
- Tres enemigos normales: soldado, ballestero con preparación de disparo y virotes sin seguimiento, cargador con franja de aviso y trayectoria fija que se detiene ante paredes. Proyectiles con barrido de colisión, tiempo de vida y protección compartida del héroe.
- Portador del núcleo a los 2:30, armadura, barrido y golpe circular. Deja ocho esencias y núcleo dorado recogible; eliminado el premio provisional del segundo grupo. Resistencia de empuje del élite y del jefe aplicada.
- A 6:00 se retiran normales sin recompensas y se limpian proyectiles; el élite vivo debe resolverse. Anuncio de seis segundos del Castellano Vacío, barrido, golpe al suelo y andanada; furia a media vida. Victoria solo al matarlo, derrota gana empates.
- Siluetas provisionales diferenciadas, anticipaciones, núcleo dorado, virotes visibles, avisos fuera de vista, objetivo, barra de élite/jefe y resumen. Cadáveres normales retirados tras dos segundos sin reutilizar IDs; liberación de representación asociada.
- 101/101 pruebas y build. Integración de Fuego: 414,57 s y Agua: 417,25 s de simulación, ambas con 129 bajas, nivel 11, maestría y victoria. Vida ampliada exclusivamente en esas pruebas para aislar reglas; no es validación de dificultad humana ni rendimiento GPU.
- Navegación de cuerpos grandes corregida para aproximarse a un héroe junto a una pared sin exigir ocupar exactamente su centro. Revisión visual, rendimiento con GPU y teléfono físico pendientes por acceso al navegador desactivado.

### 2026-10-31 — Subfase 1.8 y cámara sin arrastre

- Ratón capturado tras Entrar/Continuar/Reiniciar en PC; giro por movimiento, sin mantener botones. Esc/pérdida de captura pausa. Si se rechaza, movimiento libre sobre el paisaje; limpiar deltas al cambiar de superficie. Táctil conserva joystick izquierdo y arrastre derecho, sin pedir captura automática.
- Nivel 2: Fuego o Agua, una afinidad por partida. Afinidad I–III siempre elegible hasta maximizarse junto a dos generales. Conversión 30/40/50 % del daño directo; total conservado y armadura compartida entre componentes en esta entrega.
- Fuego: quemadura de 3 s, potencia máxima conservada y refresco sin reiniciar el intervalo de daño. Agua: Empapado 3 s, −15 % velocidad, empuje básico por rango y protección de 0,5 s. Efectos periódicos/derivados no generan Ímpetu ni efectos recursivos.
- Núcleo provisional al despejar segundo grupo. Con afinidad III, elección adicional de maestría sin gastar nivel. Fuego: explosiones al morir quemados y Torbellino de 3,2 s/ocho pulsos. Agua: salpicadura cada 1 s como máximo al golpear con espada un blanco ya empapado, excluyéndolo del daño extra, y +20 % de radio de Torbellino.
- Cuatro grupos (5/7/8/8) para llegar al nivel 5 y usar maestría antes del final. HUD de afinidad/requisitos; efectos de brasas, anillos de agua, estelas y aura de maestría. Recursos procedurales propios.
- 82/82 pruebas, TypeScript y build correctos. Integración completa de Fuego y Agua sobre el mapa real con vida ampliada solo en tests. Prueba de enlace de entrada con DOM simulado, sin atribuirla a un navegador real.
- Consulta nueva de acceso al navegador: sigue desactivado en Work. Revisión visual, ratón físico, GPU y teléfono pendientes; no se elude el ajuste ni se bloquea el avance.

### 2026-10-31 — Subfase 1.7

- Un cristal de esencia por soldado, sin recompensas duplicadas. Absorción a 1,5 m y atracción desde 3 m, bloqueadas por obstáculos. Umbral 4 + 2 × (nivel − 1), exceso conservado y cola de elecciones.
- Tarjetas de mejoras con pausa completa, aplicación única y confirmación para continuar. Opciones distintas y elegibles; rangos máximos excluidos. Menos de tres opciones si no quedan más y curación del 25 % de vida máxima si todo está al máximo.
- Daño +10 % base por rango para espada/Torbellino; vida máxima +20 con curación equivalente; velocidad +0,5 m/s hasta 6,5; recogida/atracción +0,5 m. Tres rangos cada una. Ofertas deterministas provisionales.
- Tres grupos fijos en cantidad (5/7/8), con posiciones de refuerzo adaptadas a espacio transitable y aviso de 1,2 s. Esperan la recogida de esencia y elecciones pendientes; no equivalen al director de oleadas de 1.9. Victoria tras 20 bajas y recogida, nivel 4 y tres elecciones posibles.
- Derrota se resuelve antes de XP; ninguna mejora resucita. Reinicio limpia experiencia, mejoras, cristales, elecciones, grupos y efectos, conservando ajustes.
- La elección de afinidad del nivel 2 pasa a la implementación 1.8 junto con sus efectos. En 1.7 hay mejoras generales desde nivel 2. Secuenciación de implementación explícita, no decisión atribuida al usuario.
- 61/61 pruebas correctas, TypeScript y build correctos. Integración completa sobre mapa real con vida ampliada únicamente en la prueba para aislar progresión; 48 posiciones comprobadas para aparición segura de refuerzos. Revisión visual interactiva y teléfono físico pendientes.

### 2026-10-31 — Subfase 1.6

- Ímpetu: una acumulación por espadazo que acierta, máximo cuatro, +5 % de daño por acumulación y pérdida tras 3 s sin acertar. El multiplicador se fija al iniciar el golpe; todos sus objetivos reciben el mismo daño.
- Torbellino: listo al inicio, objetivo válido incluso único, radio 2,6 m más radio enemigo, seis pulsos de 12 de daño a intervalos de 0,4 s y duración 2,4 s. Recarga de 20 s desde el final. No atraviesa paredes ni acumula/refresca Ímpetu.
- La habilidad espera que termine un espadazo ya iniciado y sustituye al básico mientras gira. Movimiento y cámara independientes. Pausa, derrota y reinicio gestionan todos los temporizadores y efectos.
- Indicadores de acumulaciones, bonificación, expiración y recarga; arcos y pose giratoria provisionales sin botones de habilidades. Encuentro y estadísticas de enemigos conservados.
- TypeScript/build correctos y 48/48 pruebas. Incluye las trece nuevas del kit y el encuentro completo con Torbellino automático habilitado. Navegador interactivo y teléfono físico pendientes, sin bloquear esta entrega.

### 2026-10-31 — Subfase 1.5

- Primer encuentro fijo con cinco soldados esqueléticos provisionales. Persecución con rutas compartidas alrededor de ruinas, separación suave y ataques anunciados con arco ámbar y preparación visible.
- Espadazo automático de 18 de daño, alcance 2 m más radio del blanco, arco 120°, preparación/ventana de 0,12 s y periodo mínimo de 0,75 s. Orientación del golpe fija; locomoción y cámara independientes.
- Vida, protección de 0,35 s tras recibir daño, impactos únicos, daño sin atravesar paredes y muerte única. Derrota tiene prioridad ante muerte simultánea. HUD, destellos, números, resultado y reinicio limpio.
- Se retiraron teletransportes de prueba de la interfaz activa. No se adelantaron Ímpetu, Torbellino, elementos, experiencia ni oleadas.
- 35/35 pruebas correctas, incluidos encuentro completo y navegación por ruinas reales. Comprobación interactiva del agente y teléfono físico pendientes; modelos/animaciones todavía provisionales.

### 2026-10-31 — Subfase 1.4

- Usuario acepta visualmente 1.3 y pide continuar. Se implementa movimiento relativo a cámara a 5 m/s, diagonales normalizadas, giro suave del personaje y marcha articulada provisional.
- Simulación fija a 60 Hz, interpolación visual, cuerpo circular de 0,4 m con deslizamiento y subpasos contra paredes finas. Colisión compartida con arquitectura y decorados grandes; límites visibles mediante vallado.
- Joystick flotante izquierdo y arrastre derecho con identificadores independientes; zona muerta, liberación/cancelación individual y limpieza al pausar, perder foco o usar controles de interfaz.
- Conservados cámara libre, zoom 4–12 m y distancia inicial 8 m. Centrar sitúa la cámara detrás del rumbo actual del personaje.
- Compilación correcta y 20/20 pruebas. La integración recorre 36 rutas de 300 pasos sobre el escenario real sin solapar sólidos ni situar la cámara dentro de ellos.
- Validación interactiva del agente y teléfono físico pendientes; no se atribuyen resultados de rendimiento. Próximo contenido: 1.5.

### 2026-10-31 — Encuadre más abierto y zoom

- El usuario valoró positivamente la escena y pidió alejar un poco la vista y permitir zoom con rueda y límites.
- Se cambió la distancia inicial de 6 a 8 m y se añadió rueda sobre la escena activa, limitada entre 4 y 12 m y sincronizada con el panel. Los valores son decisiones de implementación, no cifras dictadas por el usuario.
- Se mantienen las colisiones: un muro puede acercar temporalmente la cámara por debajo del mínimo manual. No se captura la rueda sobre menús o pausa ni Ctrl/⌘ + rueda.
- La valoración visual del usuario no sustituye las pruebas técnicas pendientes. El navegador de la herramienta sigue desactivado.
- Tras el ajuste: compilación correcta y nueve pruebas existentes correctas. La rueda aún requiere comprobación interactiva en navegador.

### 2026-10-31 — Implementación inicial de 1.3

- Proyecto web independiente, carga de 13 recursos locales con reserva ante fallos, escena exterior, cámara de tercera persona y tres puntos de observación.
- Cámara con volumen de colisión conservador, acercamiento inmediato, recuperación suave, límites de inclinación y separación de la orientación del personaje.
- Entrada explícita; arrastre y captura solicitada por botón; pausa por Esc, pérdida de captura/foco o pestaña oculta; reanudación explícita. Diagnóstico de FPS/p95 y dos calidades gráficas.
- Texturas y HDR CC0 con manifiesto y créditos. Figura de escala provisional; sin movimiento, combate ni enemigos todavía.
- `npm test`: 9/9. `npm run build`: correcto, advertencia de paquete JS >500 kB registrada. HTML y 13 recursos servidos con HTTP 200 y bytes idénticos a los originales locales.
- Revisión visual, controles reales, fallos inducidos y medición inicial: pendientes por navegador local desactivado. No se inventa una captura ni un resultado de rendimiento. 1.3 continúa abierta.

### 2026-10-31 — Aceptación del estilo de 1.2

- Usuario: «Se ven como iguales... Pero está bien asi». Acepta el estilo común; no elige un número.
- Se adopta imagen 3 por espacio abierto de combate y se mantienen las otras como referencias secundarias.
- Primer intento de Agua fallido por permiso de red revocado; segundo intento exitoso tras restaurarse disponibilidad. PNG guardado e inspeccionado. Paleta, encuadre orientativo, enemigo y recursos pendientes documentados. 1.2 cerrada como definición artística; implementación no verificada y muestra adicional sin valoración expresa del usuario.

### 2026-10-31 — Inicio de subfase 1.2

- Usuario eligió semirrealismo, ambiente medieval sombrío legible con cielo nublado, Guerrero de armadura media y no muertos medievales.
- Brief y criterios artísticos en [DIRECCION_ARTISTICA_1_2.md](docs/diseno/DIRECCION_ARTISTICA_1_2.md).
- Se generaron e inspeccionaron tres alternativas independientes de vista de juego, guardadas junto a sus prompts. La selección visual y comprobaciones restantes siguen pendientes.

### 2026-10-31 — Subfase 1.1

- Se recogieron cuatro decisiones de producto del usuario y se sustituyeron las hipótesis de cámara elevada y definitiva manual.
- Se definieron reglas de movimiento, adquisición estable, automatización, daño, estados, experiencia, maestría, pausa y ciclo de partida.
- Se fijó una porción de prueba de seis minutos más jefe, manteniendo diez minutos como objetivo del MVP.
- Se revisaron arquitectura, entrada y combate de prototipos anteriores. Se identificaron patrones adaptables y reglas incompatibles, sin copiar ni modificar esos proyectos.
- Se comprobó disponibilidad de Node/npm y hardware PC. Los presupuestos de rendimiento son objetivos sin medición de juego; el teléfono físico queda por identificar.
- Verificación de entrega: coherencia de documentación, enlaces locales, controles vigentes y conservación de las cuarenta subfases. No se ejecutaron pruebas de juego porque todavía no hay implementación.

### 2026-10-31 — Plan inicial

- Se consolidó el diseño conversado y se sustituyeron los elementos, el nombre de Acorazado y el enfoque del escenario según la última indicación del usuario.
- Se conservaron los cuatro grandes hitos y se documentaron tareas y criterios de cierre para las cuarenta subfases.
- Se distinguieron decisiones confirmadas, hipótesis de implementación y decisiones pendientes.
- Se mantuvo el Sacerdote como primer desbloqueo del plan previo, con alcance reducido por concretar en 3.9; no forma parte de las cuatro clases iniciales.

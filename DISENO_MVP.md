> Estado vigente: **2.7.3a entregada, siguiente 2.7.3b**. La antigua 2.7.3 se divide en esqueleto e integración del Guerrero. Base de código probada, aún sin activar en combate; aplicación 0.2.8. Plan: 49 subfases, 26 futuras. Ver [contrato de integración](BASE_HABILIDADES_2_7_3A.md).

# Diseño y alcance del MVP

Versión de diseño: **0.6** · Fecha: **2026-11-02**. Reglas implementables en [CONTRATO_1_1.md](CONTRATO_1_1.md). Ampliación planificada tras el prototipo 1.9 en [EXPANSION_1_9.md](EXPANSION_1_9.md).

## 1. Decisiones confirmadas por el usuario

| Aspecto | Decisión vigente |
|---|---|
| Formato | Webapp jugable en navegador |
| Género y tono | Survivor con progresión roguelite y fantasía oscura |
| Referencia | PokéBonk como referencia de estructura y atractivo; personajes y mundo propios |
| Clases iniciales | Guerrero, Mago y Arquero; Acorazado aplazado |
| Elementos iniciales | Fuego, Agua, Tierra y Aire |
| Lugar inicial | Alrededores de un castillo-fortaleza; posibilidad de incluir una parte interior pequeña |
| Construcción del personaje | Clase reconocible y estable, modificada por elecciones elementales durante la partida |
| Organización | Cuatro fases grandes divididas en numerosas subfases |
| Prioridad y orientación | PC primero; celular en horizontal |
| Control de combate | Movimiento WASD; ataque básico y todas las habilidades automáticos |
| Cámara | Tercera persona detrás del personaje, girada con el ratón |
| Estilo artístico | Semirrealista, proporciones naturales y materiales medievales creíbles |
| Ambiente | Cielo nublado, piedra húmeda, vegetación y antorchas; sombrío pero legible |
| Apariencia del Guerrero | Armadura media de cuero, cota de malla y algunas placas |
| Familia enemiga inicial | Esqueletos y soldados reanimados con equipo deteriorado |
| Escala y exploración | Mapa más amplio, hordas cerca del jugador y destinos con recogida e interacciones; incorporar capturas y tiendas al plan |

El usuario descartó la premisa de «condenados». No desarrollar esa identidad narrativa.

La ampliación vigente de combate se planifica en [COMBATE_MASIVO_2_7.md](COMBATE_MASIVO_2_7.md): más hordas y habilidades, cámara más alejada y mapa mayor. El usuario aclara que las oportunidades de elección permiten estadísticas, mejorar habilidades o aprender nuevas; no otorgan habilidades obligatorias por tiempo. Todavía no está implementada en 0.2.7.

## 2. Hipótesis de implementación

Los detalles siguientes concretan el plan previo. Son valores y soluciones iniciales para validar, no preferencias expresas del usuario:

- Three.js + TypeScript, con interfaz web para menús y HUD.
- PC primero y móvil horizontal, movimiento libre y combate totalmente automático mientras el personaje se desplaza; decisión confirmada en 1.1.
- Una habilidad especial inicial por clase y hasta cuatro automáticas equipadas como propuesta para 2.7.1–2.7.6; básico y pasiva aparte. Aprender nuevas compite con estadísticas y mejoras. El término «definitiva» usado en los kits originales no implica activación manual; R queda pendiente de decisión. No se incluyen esquiva, salto ni apuntado manual en la primera implementación.
- Cámara de perspectiva en tercera persona detrás del personaje, orientada con ratón; en móvil, joystick izquierdo y arrastre derecho. La selección de enemigos no gira la cámara.
- MVP de aproximadamente diez minutos antes del jefe; ajustar con pruebas. Primera porción de fase 1: seis minutos antes del jefe para iteración rápida.
- Al morir o ganar se pierden los poderes de esa partida, pero se conservan desbloqueos y descubrimientos.
- Sin registro de cuenta para empezar; progreso local en el dispositivo.
- Nuevas 1.9.1–1.9.3: ampliar primero el mapa y las apariciones; después recogibles/interacción; finalmente una captura territorial y una tienda. Capturar un punto permaneciendo en él y usar moneda temporal son propuestas concretas, no definiciones confirmadas por el usuario. El detalle está en EXPANSION_1_9.md.

## 3. Clases iniciales

Los nombres y roles están confirmados. Los kits son propuestas concretas que se afinan al implementar.

| Clase | Rol | Ataque inicial | Pasiva propuesta | Habilidad especial inicial |
|---|---|---|---|---|
| Guerrero | Luchador cuerpo a cuerpo | Tajos de espada en arco | Ímpetu: golpear de forma continuada potencia sus ataques | Torbellino móvil |
| Mago | Hechizos elementales a distancia y de área | Proyectil mágico del elemento elegido | Acumulación arcana: cada cierto número de hechizos potencia el siguiente | Cataclismo elemental |
| Arquero | Distancia, precisión y posicionamiento | Flechas rápidas hacia objetivos cercanos | Precisión: mantener aciertos favorece la penetración | Lluvia de flechas |

### Reglas de identidad

- El Guerrero conserva la iniciativa y el combate cercano; no se convierte en un lanzador de proyectiles genérico.
- El Mago utiliza hechizos elementales desde el inicio. En su primera partida se elige afinidad antes del primer combate, integrada en el tutorial; no necesita pasar por una identidad de magia de sombra o hielo.
- El Arquero conserva arco y flechas reconocibles, incluso con modificadores.
- El mismo elemento se expresa de forma distinta en cada clase.

### Contenido aplazado: Acorazado

El usuario dejó al Acorazado fuera del alcance actual. Se conserva como propuesta futura: tanque con maza y escudo, bloqueo periódico, contraataque y Bastión con ondas de represalia. Sus afinidades previstas eran armadura abrasadora, escudo de agua, protección pétrea y barridos de viento. No se implementa, no se incluye en los recuentos ni se convierte automáticamente en desbloqueable. Su posible regreso requerirá revisar el alcance y el plan. El Sacerdote de 3.9 permanece como primer desbloqueable acotado.

## 4. Los cuatro elementos

| Elemento | Identidad mecánica propuesta | Efectos principales | Límite de diseño |
|---|---|---|---|
| Fuego | Daño continuo y propagación | Quemadura, estallidos y suelo ardiente | Limitar propagaciones y efectos simultáneos |
| Agua | Flujo, desplazamiento y desgaste | Oleadas, salpicaduras, empuje y estado empapado | No convertirlo en Hielo ni conceder curación ilimitada |
| Tierra | Impacto, defensa y ruptura | Fragmentos, pulsos sísmicos, protección y quebranto | Evitar bloqueos permanentes de rutas y aturdimientos infinitos |
| Aire | Movilidad, alcance y agrupación | Ráfagas, cortes de viento, remolinos y desvíos | Evitar descontrol de cámara, enemigos o velocidad |

El contrato 1.1 fija las reglas iniciales: Empapado ralentiza y aumenta el desplazamiento recibido por Agua; Quebranto aumenta temporalmente el daño recibido. Sus cifras se validan al implementar. Cada estado tiene beneficio por sí mismo; Agua no depende de obtener un segundo elemento para resultar útil.

No incluir Hielo, Tormenta o Sombra como afinidades iniciales. Aire se representa principalmente mediante viento y presión; no es un cambio de nombre para el antiguo elemento Tormenta.

### Ejemplos de expresión por clase

| Clase | Fuego | Agua | Tierra | Aire |
|---|---|---|---|---|
| Guerrero | Tajos ardientes y explosión de quemaduras | Cortes de oleaje que empujan y salpican | Golpes pesados que rompen defensas | Tajos extendidos y torbellino que reúne enemigos |
| Mago | Bolas de fuego y erupciones | Orbes de agua y oleadas | Rocas y pulsos sísmicos | Proyectiles de viento y remolinos |
| Arquero | Flechas incendiarias | Flechas que liberan salpicaduras | Flechas pétreas que penetran defensas | Flechas veloces y perforantes |

Estos ejemplos definen una dirección, no un catálogo final de habilidades. Las habilidades definitivas también cambian al alcanzar la maestría del elemento.

## 5. Configuración durante la partida

- Máximo de **dos afinidades elementales**.
- En 0.2.7 hay **cuatro técnicas por clase y tres espacios**. En 2.7.1 se definió su migración hacia mejoras de habilidades/básico/pasiva; no dar por hecho otro inventario obligatorio junto a cuatro habilidades.
- Objetivo nuevo: hasta **cuatro habilidades automáticas**, incluida la inicial; repertorio mayor que los espacios para elegir. Definido en [HABILIDADES_2_7_1.md](HABILIDADES_2_7_1.md): ocho por clase, nivel 10, cuatro ramas de tres rangos e hitos 5/10; 24 habilidades en total.
- **Doce reliquias** en el catálogo inicial, con un máximo de cuatro equipadas.
- Elecciones entre tres alternativas válidas al subir de nivel: estadísticas, mejorar habilidades conocidas o aprender del repertorio de clase, junto a afinidades compatibles. Sin habilidad garantizada por tiempo ni obligación de llenar espacios. Explicar beneficios, requisitos y límites.
- Primera afinidad elegible entre los cuatro elementos. El Mago la elige al salir; las otras clases pueden obtenerla mediante el primer hito temprano.
- Las elecciones posteriores deben favorecer opciones compatibles sin eliminar toda variación.
- Renovaciones limitadas de opciones; cantidad inicial pendiente de pruebas.
- Una técnica obtenida puede mejorarse sin consumir otro espacio.
- Definir por separado las mejoras repetibles de estadísticas y las mejoras que alteran comportamiento.

### Maestrías

Las tres clases iniciales tienen una maestría por elemento: **12 en total**.

Para el MVP se propone **una maestría elegida por partida**. Requiere suficiente afinidad y un núcleo obtenido de un élite. La segunda afinidad puede aportar efectos y sinergias sin activar una segunda transformación completa.

Cada maestría incluye cambio de comportamiento, modificación de habilidades automáticas y señales visuales reconocibles. Se reutilizan modelos y animaciones con variaciones de arma, detalles y efectos: no exige producir 12 personajes completos.

Especializarse en un elemento debe competir con mezclar dos. Las fusiones únicas para cada pareja, con nombre, modelo y definitiva propios, quedan fuera del MVP.

## 6. Primer escenario: alrededores de la fortaleza

### Distribución propuesta

1. **Exterior cercano:** camino de acceso, campamentos abandonados, barricadas y ruinas de construcciones auxiliares.
2. **Perímetro fortificado:** murallas, torres, foso o desniveles, espacios junto a la puerta y un acceso lateral.
3. **Linde de bosque:** vegetación, senderos y claros conectados con el exterior del castillo.
4. **Incursión interior acotada:** patio de entrada y, si aporta variedad sin complicar navegación y cámara, una estancia breve conectada con él.

El exterior concentra la mayor parte del tiempo y superficie jugables. No construir un castillo completo, varias plantas ni una red de mazmorras.

El cementerio del plan anterior deja de ser una zona obligatoria. Puede usarse como detalle ambiental si encaja, pero no sustituye el foco en la fortaleza.

### Reglas del mapa

- Una sola expedición y un mapa conectado, sin pantallas de carga entre zonas.
- Rutas con espacio suficiente para esquivar y mover hordas.
- Entradas, muros y obstáculos deben ser legibles y coherentes con las colisiones.
- Evitar que puertas estrechas o paredes oculten peligros o trivialicen las hordas.
- La cámara debe seguir siendo útil cerca de murallas y en el patio interior; definir ocultación de obstáculos si hace falta.
- No incluir asedio, construcción o destrucción de fortificaciones como sistemas del MVP.
- Cofres, altares, fuentes, zonas de captura, tiendas y élites proporcionan destinos opcionales. La exploración debe ofrecer decisiones durante la partida; aumentar superficie sin destinos ni presión cercana no cumple el objetivo.
- Mapa amplio pero acotado: primeras rutas y emplazamientos en 1.9.1, interacciones en 1.9.2–1.9.3 y desarrollo final en 3.1–3.7. 2.7.2 amplía de nuevo cámara y terreno para hordas; cifras aproximadas de prueba en COMBATE_MASIVO_2_7.md. Tamaño y distancias se ajustan a la duración de la expedición.
- Situar al jefe en una zona amplia; ubicación definitiva durante 3.1.

## 7. Enemigos y ritmo

- Mayoría de enemigos débiles para barrer grupos, con resistentes y amenazas especiales minoritarios. Más frecuencia y densidad local; objetivos sujetos a medición en 2.7.5 y economía/experiencia ajustadas en 2.7.6.
- Cinco enemigos normales con comportamientos distintos: perseguidor, tirador, cargador, protector y amenaza de área.
- Dos élites con patrones propios.
- Un jefe con anticipación, ejecución y recuperación comprensibles.
- Resistencia a control para élites y jefe; definir límites por efecto, sin depender de congelación.
- Alternar presión y oportunidades de recuperación. Ajustar densidad, composición y tiempos, no solo vida enemiga.
- Generar refuerzos alrededor de la posición actual del jugador, con distancia segura y ruta navegable; preferir fuera de vista y anunciar apariciones visibles. Compartir límites de población entre hordas y capturas. Retirar normales muy lejanos sin recompensas, preservando encuentros y premios únicos.
- La maestría debe llegar con tiempo suficiente para disfrutarla antes de terminar.
- Cada habilidad automática tiene recarga propia y se activa automáticamente con un objetivo válido, incluso si es un jefe aislado. Sin objetivo permanece lista.

## 8. Progresión entre partidas

### Economía e interacciones de expedición

Recogibles por proximidad; cofres, fuentes y tiendas mediante E o botón táctil contextual. El combate sigue siendo totalmente automático. Como primera propuesta, capturar consiste en permanecer en un punto mientras se resisten enemigos, con recompensa única. Las tiendas usan moneda exclusiva de la expedición, existencias limitadas y menús que pausan mundo y reloj. Las capturas y compras son opcionales; no sustituyen el núcleo de élite ni la victoria por derrotar al jefe.

La moneda y estados de cofres/capturas/tiendas se reinician por partida; no crean una segunda progresión persistente. Reglas y alcance provisional en EXPANSION_1_9.md.

### Progreso persistente

Conservar ajustes, resultados, descubrimientos y desbloqueos; reiniciar la configuración de poderes de la partida.

Refugio mediante menús, sin necesidad de construir un segundo escenario explorable. Resultados con clase, elementos, técnicas, reliquias, maestría y objetivo pendiente.

El plan previo incluye **Sacerdote como primer desbloqueable**, adicional a las tres clases iniciales. Su incorporación se mantiene como objetivo acotado de 3.9: definir su kit reducido y las afinidades disponibles antes de implementarlo. Las 12 maestrías y 12 técnicas del alcance base corresponden a las tres clases iniciales; no implican un catálogo completo adicional del Sacerdote. Si un kit reducido rompe el ciclo de partida, revisar su alcance en 3.9 en vez de entregar una clase incompleta sin advertirlo.

## 9. Alcance y exclusiones

### Alcance base

- Tres clases iniciales y cuatro elementos.
- Un mapa, cinco enemigos normales, dos élites y un jefe.
- Mapa amplio con hordas locales, recogibles, cofres, fuentes, altares, capturas territoriales y tiendas con moneda de expedición.
- Repertorios de habilidades adquiribles/mejorables de las tres clases, migración explícita de las doce técnicas existentes, doce reliquias y doce maestrías.
- Un desbloqueo de clase acotado, tutorial, guardado local y resultados.
- Controles PC/táctiles, opciones de audio y gráficos, PWA y enlace publicado al final.

### Fuera del MVP

Multijugador, cuentas, guardado en servidor, comercio entre jugadores, monetización, fabricación, construcción de base, destrucción del castillo, mapas adicionales o mundo infinito, resto de clases, fusiones elementales completas, funcionamiento sin conexión y publicación en tiendas móviles. Las tiendas de PNJ con moneda temporal sí forman parte del alcance revisado.

PWA no equivale a funcionamiento sin conexión. Las pruebas de navegador con tamaño móvil no acreditan pruebas en un teléfono físico.

## 10. Calidad y validación

- Legibilidad por silueta, animación e iconos además del color. Distinguir especialmente Agua y Aire.
- Ambientación oscura con suelo, personaje y avisos visibles.
- Sonidos y efectos con límites de simultaneidad desde las primeras fases.
- Separar lógica, datos, renderizado, interfaz y persistencia.
- Probar reglas de daño, estados, recompensas y guardado cuando se implementen; verificar visualmente cambios de cámara, controles e interfaz.
- El contrato 1.1 fija el equipo PC de referencia y presupuestos propuestos; medir desde 1.3 y ampliar cargas en 4.6. Falta identificar y probar el teléfono físico de referencia antes de cerrar 4.7.
- Identificar procedencia y condiciones de uso de recursos artísticos y sonoros.

## 11. Decisiones pendientes

Resolver en su subfase, sin bloquear por adelantado trabajo independiente:

- 1.1 definida: controles, cámara, prioridad PC, orientación móvil, reglas, duración y arquitectura constan en el contrato. Sus cifras no están verificadas jugando.
- 1.2 definida: estilo común aceptado por el usuario; imagen 3 adoptada por el asistente como referencia de trabajo. Muestra de Agua, especificación de enemigo y paleta documentadas. Modelos y animaciones pendientes de producción/selección. Ver [DIRECCION_ARTISTICA_1_2.md](DIRECCION_ARTISTICA_1_2.md).
- 2.1 implementada: estructura compartida de clases y Guerrero adaptado; ver ARQUITECTURA_CLASES_2_1.md. 2.2 implementada: Mago con afinidad inicial y kit propio; ver MAGO_2_2.md. 2.3 implementada: Arquero con Precisión, penetración y Lluvia de flechas; ver ARQUERO_2_3.md. 2.4 implementada: Tierra/Aire en Guerrero; ver TIERRA_AIRE_2_4.md. 2.5 implementada: doce combinaciones y primeras maestrías; ver AFINIDADES_2_5.md. 2.6 implementada: doce técnicas, tres espacios y tres rangos; ver TECNICAS_2_6.md. 2.7 implementada: doce reliquias, cuatro espacios y segundo elemento de apoyo; ver RELIQUIAS_AFINIDADES_2_7.md. 2.7.1 definida: repertorios, árboles hasta 10, ofertas y migración en HABILIDADES_2_7_1.md. Siguiente: 2.7.2, cámara/mapa; implementación de habilidades en 2.7.3–2.7.4.
- 2.7.1–2.7.6: elecciones/repertorios, cámara/mapa, sistema y Guerrero, Mago/Arquero, hordas/rendimiento y balance conjunto. Ver COMBATE_MASIVO_2_7.md.
- 2.8: revisión final de maestrías sobre el nuevo sistema de habilidades y hordas.
- Definitiva con R: posibilidad pendiente, no incluida automáticamente en el bloque nuevo.
- 1.9.1 implementada: extensión y director local disponibles; valores y validación en VERIFICACION_1_9_1.md. 1.9.2 implementada: moneda temporal, suministros, cofres, fuentes e interacción E/botón táctil; ver VERIFICACION_1_9_2.md. 1.9.3 implementada: captura territorial de 25 s por 25 monedas y mercader con cuatro ofertas limitadas; ver VERIFICACION_1_9_3.md. Pulido inicial 1.10 disponible: correcciones de presión, audio esencial, HUD y auditoría de precios; ver VERIFICACION_1_10.md. Balance humano y rendimiento GPU todavía pendientes.
- 3.1: escala definitiva sobre el mapa ampliado y si el interior se limita al patio o incluye una estancia.
- 3.9: alcance funcional inicial del Sacerdote.
- 4.9: nombre, alojamiento y dirección de publicación.


## Idea narrativa para después

[Campaña por eras y etapas](IDEA_CAMPANA_ERAS.md), registrada el 2026-11-02: cada era reúne tres a cinco etapas. Era I: establecer el reino recuperando exterior, interior y defendiendo la fortaleza. El escenario actual puede representar su primera etapa. Es una propuesta futura; no añade implementación ni cambia los recuentos del plan. Próxima entrega técnica: 2.7.3.

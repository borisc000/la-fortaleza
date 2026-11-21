# Los dominios exteriores — revisión y producción del escenario

Definido el 11 de noviembre de 2026. **E0, E1, E2, E3.1 y E3.2 completadas; E3.3–E3.4 y E4–E6 pendientes.** Diagnóstico, mediciones y decisiones en [evaluación E0](EVALUACION_DOMINIOS_E0.md); distribución en [plano](../verificaciones/evidencias/e0/plano.png).

## Objetivo y alcance

Revisar la distribución del primer escenario, ampliarlo moderadamente y desarrollar un acabado coherente con los tres personajes vigentes. Debe sentirse como el territorio de una fortaleza ocupada que nuestra expedición viene a liberar, con espacio para hordas, exploración e interacciones.

Este es un plan específico del escenario. Los identificadores E0–E6 evitan confundirlo con las fases 1–4 del MVP. No se renumeran las entregas existentes ni se cambian sus contadores. Maestrías 2.8 queda como siguiente hito del plan general después de este trabajo de escenario.

Referencias vigentes: [estado](../../ESTADO.md), [plan general](../../PLAN_DESARROLLO.md), [campaña por eras](IDEA_CAMPANA_ERAS.md) y [laboratorio](LABORATORIO_MODELOS.md).

## Punto de partida y ampliación propuesta

La referencia histórica de E0 tenía un área jugable de **260 × 240 m**, delimitada por X −128 a 132 y Z −20 a 220 en `game/src/content/config.ts`. El terreno visible se extiende más allá. El escenario tiene muralla, puerta, torres, silueta interior, caminos en circuitos, campamentos y ruinas. Su construcción principal está en `game/src/rendering/world.ts`, con regiones y referencias en `game/src/content/map.ts`.

E0 define para E1 una ampliación a **280 × 260 m**: 16,7 % más superficie, con X −138 a 142 y Z −20 a 240. Añade 10 m a cada costado y 20 m al sur, conservando la puerta. La llegada propuesta pasa a (20, 205), con seis sectores principales, quince hitos secundarios y dos circuitos laterales. E1.1 ya aplica los límites de 280 × 260 m y la llegada sur. E1.2 ya construye los seis sectores, los circuitos laterales y sus conexiones, con geometría sencilla. E1.3 adapta interacciones y apariciones a las rutas; E1.4 completa la revisión de recorrido y combate con las tres clases. Se conservan escala de personajes, cámara y distancias de combate. Diferenciar área jugable adicional de paisaje lejano que aporte profundidad visual.

Conservar cámara libre, rueda, clases, progresión y combate automático. Las hordas deben mantener presión local alrededor del jugador. Los mapas interiores y las catacumbas pertenecen a los escenarios siguientes. Conservar por ahora la victoria exterior y el jefe actuales; cualquier cambio posterior de su papel narrativo debe quedar documentado.

## E0 — Evaluación y redefinición del escenario

- **E0.1 · Inventario y referencia inicial.** Recorrer el mapa actual en juego y laboratorio. Registrar panorámicas y vistas a altura de cámara, regiones, rutas, puntos de interés, obstáculos, vacíos, repeticiones y problemas de escala. Medir una ruta de referencia y obtener una medición inicial de rendimiento con carga comparable.
- **E0.2 · Composición y relato.** Definir llegada de la expedición, vista de la fortaleza, acceso principal y función de cada sector. Clasificar lo que se conserva, se remodela, se desplaza o se sustituye. Evaluar si las regiones existentes ayudan a orientarse o fragmentan demasiado el territorio.
- **E0.3 · Tamaño y recorridos.** Contrastar el tamaño actual con la propuesta de 280 × 260 m. Dibujar rutas principales, circuitos laterales, espacios de combate y límites naturales. Estimar tiempos de desplazamiento, cobertura de encuentros e interacciones y líneas de visión hacia la fortaleza.
- **E0.4 · Diseño de referencia.** Entregar un plano anotado con tamaño objetivo, sectores, hitos, rutas, claros, ubicaciones candidatas de actividades y referencias de materiales y escala. Registrar decisiones, riesgos y criterios de comparación con el estado actual.

**Cierre:** un diseño concreto que guíe la construcción y un diagnóstico apoyado en recorrido visual y mediciones. La lectura de código realizada para redactar este plan no cierra esta fase. E0 no exige producir todavía edificios definitivos.

**Completada el 11 de noviembre:** dieciséis vistas del mapa, laboratorio, recorrido breve en partida, navegación a los quince hitos, referencia de render con 0/100 despojos y plano anotado. La evaluación distingue mediciones actuales de estimaciones de diseño y carga de render de combate completo. Evidencias y criterios de E1 en [EVALUACION_DOMINIOS_E0.md](EVALUACION_DOMINIOS_E0.md).

## E1 — Distribución jugable y ampliación moderada

- **E1.1 · Límites y terreno base — completada.** [Entrega y verificación](../verificaciones/VERIFICACION_E1_1.md). Implementar la extensión acordada en E0 y adaptar límites jugables, paisaje periférico y superficies caminables. Mantener la fortaleza como ancla espacial.
- **E1.2 · Rutas y sectores — completada.** [Entrega y verificación](../verificaciones/VERIFICACION_E1_2.md). Reorganizar caminos, conexiones laterales y claros con geometría sencilla. Dar identidad espacial a los sectores definidos en E0.
- **E1.3 · Encaje funcional — completada.** [Entrega y verificación](../verificaciones/VERIFICACION_E1_3.md). Adaptar regiones, aparición local de enemigos, ubicación válida de interacciones, navegación y colisiones a la nueva distribución. Conservar actividades existentes como referencias provisionales.
- **E1.4 · Prueba de recorrido — completada.** [Registro y hallazgos](../verificaciones/VERIFICACION_E1_4.md). Recorrer y combatir con las tres clases. Comprobar conexiones, tiempos, límites, visibilidad y ausencia de atascos o zonas accidentalmente inaccesibles. Ajustar cámara solo si la revisión lo justifica.

**Cierre:** mapa ampliado y redistribuido que sigue siendo jugable, con recorridos legibles y presión de combate comparable. Resolver aquí los cambios estructurales antes del detalle artístico.

## E2 — Primera zona con acabado de referencia

- **E2.1 · Puerta y dos torres — completada.** [Entrega y verificación](../verificaciones/VERIFICACION_E2_1.md). Refinar proporciones y modelado de la entrada, arco, portón, torres y conexiones con la muralla. Evaluar silueta desde cerca y a distancia.
- **E2.2 · Materiales y construcción — completada.** [Entrega y verificación](../verificaciones/VERIFICACION_E2_2.md). Definir piedra, madera, metal, juntas, remates, daños y variaciones de superficie. Evitar detalles que no se lean desde la cámara de juego.
- **E2.3 · Explanada y camino inmediato — completada.** [Entrega y verificación](../verificaciones/VERIFICACION_E2_3.md). Producir una muestra completa de suelo, transición de materiales, vegetación y restos de asedio junto a la entrada.
- **E2.4 · Comparación visual — completada.** [Entrega y verificación](../verificaciones/VERIFICACION_E2_4.md); criterios resultantes en [ACABADO_EXTERIOR_E2.md](ACABADO_EXTERIOR_E2.md). Registrar antes y después bajo condiciones equivalentes, revisar escala junto a los personajes y comprobar combate, cámara y coste de renderizado en esa zona. Preparar las piezas reutilizables útiles para el laboratorio.

**Cierre:** una zona terminada como referencia de calidad para el resto del exterior, con criterios claros de materiales, escala, densidad y lectura. Incorporar el feedback recibido antes de extender ese acabado.

## E3 — Terreno, vegetación y profundidad

- **E3.1 · Superficies — completada.** [Entrega y verificación](../verificaciones/VERIFICACION_E3_1.md). Extender caminos gastados, barro, piedra y transiciones con bordes irregulares y variación coherente.
- **E3.2 · Relieve y límites naturales — completada.** [Entrega y verificación](../verificaciones/VERIFICACION_E3_2.md). Incorporar taludes, rocas y desniveles visuales. Mantener estable la superficie de combate; cualquier desnivel realmente transitable exige resolver antes su soporte en movimiento, colisión y cámara.
- **E3.3 · Vegetación.** Distribuir hierba, arbustos y árboles por grupos y condiciones del terreno, manteniendo libres las rutas y la lectura de amenazas.
- **E3.4 · Paisaje y atmósfera.** Revisar cielo nublado, niebla, luz, humedad de materiales y paisaje lejano. Ajustar densidad, distancia de dibujo y reutilización de recursos a medida que se incorporan.

**Cierre:** territorio continuo con profundidad y variedad, cuyas superficies y vegetación permiten distinguir enemigos, proyectiles y objetos recogibles.

## E4 — Sectores reconocibles y huellas del asedio

- **E4.1 · Campamentos y abastecimiento.** Refinar tiendas, carretas y suministros con agrupaciones que expliquen su uso anterior.
- **E4.2 · Ruinas y puestos de vigilancia.** Producir hitos distintos en forma, altura y organización, aprovechando las estructuras que E0 decida conservar.
- **E4.3 · Campo de asedio.** Incorporar barricadas quebradas, restos de defensa y estandartes deteriorados donde refuercen rutas y relato. Separar decoración de objetos interactivos.
- **E4.4 · Coherencia del conjunto.** Extender el acabado de E2 a muros y edificios restantes, variar repeticiones y registrar piezas reutilizables que puedan aparecer reparadas en el tercer escenario.

**Cierre:** cada sector principal se reconoce por su paisaje y arquitectura. El detalle conserva claros de combate y evita cubrir el mapa de obstáculos pequeños.

## E5 — Exploración, encuentros e interacciones en el escenario acabado

- **E5.1 · Puntos de interés.** Integrar visualmente cofres, mercader, suministros, fuentes y capturas existentes, con acceso claro y separación entre usos.
- **E5.2 · Ritmo de exploración.** Comprobar distancias entre oportunidades y recompensas. Ajustar su distribución para que la ampliación mantenga el interés durante el recorrido.
- **E5.3 · Hordas y espacios de combate.** Probar los sectores y las transiciones con la población actual prevista, incluida la situación de hasta 100 enemigos vivos. Revisar aparición, navegación y líneas de tiro alrededor de la nueva decoración. Hallazgo E1.4: avanzar continuamente puede dejar la horda detrás; revisar presión de flancos/avance y recogida de esencia, manteniendo avisos y espacio de esquiva.
- **E5.4 · Acceso y enfrentamiento final.** Pulir el espacio exterior del jefe y la lectura visual del acceso ocupado, conservando las reglas de victoria actuales. Documentar cómo prepara narrativamente la entrada al segundo escenario.

**Cierre:** exploración y combate funcionan sobre el escenario acabado, con actividades accesibles y rutas que no se vuelven vacías o embudos por los cambios visuales. No incluye nuevos sistemas de tienda, captura o campaña.

## E6 — Pulido integral, rendimiento y cierre

- **E6.1 · Encuentros exigentes.** Revisar Guerrero, Mago y Arquero con múltiples habilidades y elementos en los sectores representativos. Corregir confusiones entre efectos, suelo, vegetación y enemigos.
- **E6.2 · Cámara y colisiones.** Revisar muros, puertas, árboles, ruinas y límites desde diferentes ángulos y distancias de zoom. Corregir bloqueos y oclusiones molestas.
- **E6.3 · Rendimiento y limpieza.** Comparar con la referencia de E0 en condiciones equivalentes. Ajustar instancias, geometría, sombras, materiales, cargas y residuos de versiones anteriores. Registrar la cobertura real de PC y móvil; redimensionar el navegador no equivale a probar un teléfono.
- **E6.4 · Entrega documentada.** Ejecutar verificaciones relevantes y compilación, realizar revisión visual, actualizar estado y métricas y guardar capturas comparables y límites pendientes.

**Cierre:** Los dominios exteriores tiene un acabado coherente con los personajes, funciona en el ciclo actual de partida y cuenta con evidencia de calidad visual, navegación y rendimiento.

## Orden y reglas de trabajo

Secuencia prevista: **E0 → E1 → E2 → E3 → E4 → E5 → E6**. Navegación, rendimiento y revisión visual se comprueban desde la fase que introduce cada cambio; E6 consolida esas verificaciones. Las decisiones rutinarias de implementación no requieren una aprobación adicional. Una modificación importante del alcance debe quedar explicada y documentada.

La zona de referencia E2 está terminada ([criterios](ACABADO_EXTERIOR_E2.md)). E3.1 extendió su suelo gastado a todo el mapa con carácter por sector, y E3.2 cerró el claro con taludes de 3,5–7 m (con freno de cámara) y añadió doce afloramientos rocosos en terreno muerto. La siguiente tarea es **E3.3, vegetación**: hierba, arbustos y árboles por grupos y según el terreno, sin cerrar rutas ni tapar amenazas.

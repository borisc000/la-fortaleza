# E0 — Evaluación y redefinición de Los dominios exteriores

11 de noviembre de 2026. E0.1–E0.4 completadas como evaluación y diseño. El mapa jugable permanece sin modificar. La ejecución de la propuesta corresponde a E1.

## Decisión de diseño

Adoptar **280 × 260 m** como objetivo de E1, ampliar 10 m en cada lateral y 20 m al sur, mantener la fortaleza en su posición y organizar el territorio en seis sectores principales con quince hitos secundarios. Cambiar el punto de llegada al sur y conservar rutas abiertas hacia la puerta, con dos recorridos laterales y atajos. La fortaleza seguirá siendo la referencia del escenario, con vistas enmarcadas por vegetación, ruinas y paisaje periférico.

El problema principal encontrado es la repetición y falta de jerarquía espacial. Aumentar solo los límites prolongaría ese problema. La ampliación debe acompañarse de redistribución, superficies más naturales, hitos reconocibles y colocación de actividades.

Plano comparativo [PNG](e0/plano.png), [SVG](e0/plano.svg) y [HTML](e0/plano.html). Coordenadas de propuesta en [JSON](e0/propuesta.json). Las áreas de color son guías de composición, no límites de movimiento.

## E0.1 — Inventario y evidencia del estado actual

Se inspeccionaron el escenario completo en el laboratorio y dieciséis puntos de vista, incluyendo el inicio y los quince hitos, con los recursos reales y la cámara de tercera persona de 12 m. Una página de auditoría reutiliza `createWorld`, materiales, modelo del Guerrero y cámara del juego para obtener encuadres reproducibles. No sustituye una campaña completa. También se inició una partida normal de Guerrero y se caminó hacia el sur con enemigos activos.

Capturas representativas [entrada](e0/actual-entrada.png), [sur](e0/actual-sur.png), [combate real](e0/actual-combate.png) y [conjunto en laboratorio](e0/actual-conjunto.png). El recorrido visual completo está guardado en `../../work/e0-zone-0.png` a `e0-zone-15.png`.

| Aspecto | Hallazgo | Consecuencia de diseño |
|---|---|---|
| Fortaleza | La muralla, puerta y torres se distinguen desde el sur. Desde el inicio ya se está a unos 25 m de la puerta. | Conservar el destino visible; trasladar la llegada para construir la aproximación. |
| Distribución | Muchos circuitos similares, gran visibilidad sobre un plano casi continuo y poca diferencia entre sectores. | Jerarquizar seis sectores y simplificar los trazados redundantes. |
| Caminos | Pavimento claro y repetitivo sobre barro, con cortes muy marcados y cruces anchos. | Reservar piedra para el acceso y tramos justificados; introducir tierra, rodadas y transiciones. |
| Ruinas | Muros bajos repetidos alrededor de los puntos de interés, con poco cambio de forma o función. | Sustituir parte de esa repetición por conjuntos reconocibles, conservando claros. |
| Naturaleza | Árboles geométricos, hierba dispersa, colinas periféricas similares entre sí. | Concentrar vegetación por ambientes y renovar siluetas; variar el paisaje lejano. |
| Límites | Vallado continuo y horizonte abierto producen una lectura de recinto rectangular. | Sustituir visualmente tramos por bosque, taludes y rocas manteniendo límites físicos claros. |
| Legibilidad | Enemigos claros y piedra clara comparten tonos; los efectos y las señales de captura compiten con el pavimento. | Separar valores entre suelo, enemigos y efectos sin oscurecer excesivamente la escena. |
| Escala | El personaje y la fortaleza funcionan como referencias; los vacíos y cruces hacen que el terreno parezca menos trabajado. | Mantener dimensiones de personaje y cámara inicial; revisar espacio y arquitectura antes de tocar zoom. |

### Mediciones espaciales

Fuente reproducible [spatial.json](e0/spatial.json), semilla de exploración 9173, geometría de colisión real y velocidad base del Guerrero de 5 m/s. Se usaron materiales de respaldo solo en el análisis sin renderizado; la geometría de obstáculos es la misma. Las capturas sí usan las texturas y modelos cargados.

- Área actual 62.400 m²; límites X −128 a 132, Z −20 a 220.
- 805 cajas de obstáculos de cámara/entorno y 542 sólidos relevantes para movimiento.
- Malla de navegación de 97.500 celdas, 94.024 libres y 94.010 alcanzables desde el inicio. Las 14 celdas libres desconectadas no impidieron llegar a los quince hitos; no se afirma accesibilidad de cada centímetro del terreno.
- Los quince destinos se alcanzaron mediante navegación y movimiento reales, con pasos de 0,05 s y tolerancia final de 0,5 m. Sin enemigos ni recogidas durante esa medición.
- 33 objetos iniciales para esta semilla. Solo mercader y captura tienen ubicaciones fijas especiales, ambos cerca del inicio actual; el resto sigue los hitos.
- En una cuadrícula de 5 m se contaron 2.424 muestras libres. De ellas, 990 están a menos de 24 m de algún objeto, **40,8 %**. Es cobertura geométrica aproximada, sin línea de visión, accesibilidad individual ni objetos generados por bajas; no equivale al porcentaje de mapa sin contenido.

| Trayecto desde (0, 7) | Tiempo de movimiento simulado |
|---|---:|
| Explanada ante la puerta | 3,05 s |
| Campamento abandonado | 6,55 s |
| Cruce del sur | 9,40 s |
| Abadía derruida | 21,45 s |
| Encrucijada del exilio | 22,80 s |
| Gran explanada del sur | 39,35 s |
| Campos del asedio | 46,00 s |
| Camino de las caravanas | 46,65 s |

Circuito de comparación para futuras entregas: inicio → Cruce del sur → Encrucijada del exilio → Gran explanada del sur → Campos del asedio → Camino de los molinos → Campamento abandonado → inicio. Resultado **518,75 m y 103,75 s**, sin atasco. El recorrido sigue navegación de distancia corta y puede cortar por los claros; no representa seguir estrictamente el pavimento. El JSON conserva sus muestras de posición.

La partida real confirmó desplazamiento desde (0, 7) a aproximadamente (−6,07, 44,60), con ocho segundos de tecla S, cámara despejada, vida completa, dos bajas y población local activa. El tiempo de tecla y el de simulación pueden diferir ligeramente. Registro [game-check.json](e0/game-check.json).

### Referencia de rendimiento

Chrome local, imagen renderizada de 1440 × 900, DPR 1, cámara de 12 m, sombras PCF y exposición 1,05. Cada muestra tiene 30 fotogramas de calentamiento y 300 medidos. La carga sintética usa cero o cien despojos instanciados en un anillo determinista, sin IA, ataques ni habilidades y sin exigir una posición de aparición válida. Sirve para comparar representación del entorno, no para certificar combate con cien enemigos. Cero fallos de recursos.

| Vista | Despojos | FPS medios | p95 de intervalo | Llamadas | Triángulos |
|---|---:|---:|---:|---:|---:|
| Inicio | 0 | 95,0 | 13,1 ms | 95 | 141.584 |
| Inicio | 100 | 96,0 | 13,3 ms | 96 | 178.384 |
| Encrucijada | 0 | 95,2 | 12,5 ms | 93 | 141.172 |
| Encrucijada | 100 | 94,6 | 13,1 ms | 94 | 177.972 |
| Explanada sur | 0 | 93,7 | 12,5 ms | 93 | 141.172 |
| Explanada sur | 100 | 96,0 | 13,4 ms | 94 | 177.972 |

Las pequeñas diferencias entre muestras son ruido de ejecución, no una mejora por añadir enemigos. Los intervalos incluyen trabajo del navegador y sincronización de presentación; no miden tiempo de GPU. Resultados completos en [performance.json](e0/performance.json).

El diagnóstico de una ventana de la partida real mostró 93,7 FPS, p95 14,4 ms, 21 enemigos, 643 llamadas y 181.860 triángulos. Incluye sistemas y representaciones que no están en la prueba sintética. No comparar directamente ambas cargas. No se probó móvil físico, partida completa ni configuraciones de cuatro habilidades.

## E0.2 — Reorganización narrativa y espacial

La expedición llega por el camino de las caravanas al sur. Encuentra restos de abastecimiento, atraviesa terrenos ocupados y puede aproximarse a la fortaleza por el camino principal o desviarse a molinos, abadía y bosque. Los circuitos permiten continuar combatiendo sin imponer una ruta lineal ni vaciar el mapa después de pasar por un sector.

| Sector principal | Función y carácter | Tratamiento |
|---|---|---|
| A · Llegada y caravanas | Entrada de la expedición, primeros suministros y acceso al mercader. Caminos de tierra y carros abandonados. | Reubicar inicio y recompensas tempranas; integrar explanada sur y caravanas como sublugares. |
| B · Campos del asedio y molinos | Claro amplio con restos militares; molino como orientación vertical. | Desplazar el campo hacia el noroeste respecto de su posición actual, conservar molino como referencia. |
| C · Abadía y encrucijada | Conjunto de ruinas reconocible, paso transversal y actividad de captura. | Conservar posición aproximada de la abadía, redefinir su arquitectura y despejar conexiones. |
| D · Bosque y atalaya | Vegetación agrupada, claros conectados y puesto de vigilancia. | Extender la identidad del bosque hacia el lateral este; torre separada de la masa de muralla. |
| E · Campamentos del cerco | Restos de la antigua guarnición y rutas de aproximación a la entrada. | Reorganizar tiendas, suministros y ruinas en conjuntos, evitando barricadas que cierren el paso. |
| F · Explanada y fortaleza | Destino visual, espacio amplio ante el acceso y referencia de acabado de E2. | Conservar puerta y anclaje de fortaleza; remodelar los volúmenes y materiales después del bloqueo espacial. |

Los quince hitos pueden conservarse como sublugares y anclas de contenido. Los seis sectores deben orientar al jugador sin alternar nombres de regiones pequeñas a cada cruce. Su clasificación espacial se definirá mediante zonas explícitas y transiciones coherentes, evitando depender únicamente del punto más cercano.

Conservar las tres clases, cámara de 12 m y rueda de 4–18 m, velocidad base, progresión y regla de victoria. El relato de liberación orienta el escenario; esta fase no implementa misiones nuevas ni mueve al jefe por guion. El interior y las catacumbas quedan para sus escenarios acordados.

## E0.3 — Dimensiones, rutas y contenido

### Límites para implementar en E1

X **−138 a 142**; Z **−20 a 240**. Área objetivo **72.800 m²**, incremento de 10.400 m², **16,7 %**. Mantener la puerta en (4, −18); la ampliación no abre acceso al interior. Las posiciones actuales del terreno lejano y cercas tendrán que ajustarse, conservando la distinción entre escenario jugable y fondo visual.

Nueva llegada de referencia **(20, 205)**, mirando hacia la fortaleza. No colocar el inicio en el mismo límite sur, para disponer de espacio alrededor para las apariciones locales. E1 deberá trasladar conjuntamente personaje, enemigos iniciales, recompensas cercanas, objetivo de navegación de exploración y referencias de interfaz. No basta con cambiar una coordenada de cámara.

| Hito | Actual X, Z | Referencia para E1 X, Z |
|---|---|---|
| La explanada | 4, −8 | 4, −8 |
| Campamento abandonado | −31, 19 | −35, 30 |
| Ruinas del camino | −24, 47 | −30, 65 |
| Cruce del sur | 5, 54 | 4, 45 |
| Linde del bosque | 34, 41 | 50, 55 |
| Torre del este | 35, 2 | 35, 2 |
| Pradera de poniente | −65, 37 | −95, 65 |
| Camino de los molinos | −61, 92 | −78, 105 |
| Abadía derruida | −24, 112 | −28, 110 |
| Encrucijada del exilio | 17, 120 | 8, 130 |
| Arboleda del sur | 66, 99 | 90, 120 |
| Atalaya lejana | 68, 47 | 100, 65 |
| Campos del asedio | −94, 194 | −85, 160 |
| Gran explanada del sur | 2, 204 | 10, 180 |
| Camino de las caravanas | 112, 180 | 90, 190 |

Estas coordenadas son anclas de diseño, sujetas a ajustes locales por colisiones al construir E1. No son posiciones ya verificadas sobre el escenario nuevo.

### Recorridos

- Principal entre llegada y explanada, **216,9 m / 43,4 s** teóricos a 5 m/s. Anchura orientativa 8–10 m, con variaciones y claros.
- Desvío oeste entre los cruces del recorrido principal, **322,4 m / 64,5 s**. Campo del asedio, molino, abadía y campamento. Con el tramo de regreso por el eje principal forma un circuito.
- Desvío este, **306,7 m / 61,3 s**. Caravanas, bosque, atalaya y aproximación. También se cierra mediante el camino principal.
- Rutas laterales de 6–8 m, conexiones secundarias de 4–6 m y claros principales de 24–40 m de diámetro. Usar el espacio libre alrededor de caminos; no convertirlos en corredores amurallados.

Los tiempos de propuesta son longitudes de polilíneas sin obstáculos ni combate; no se comparan como si fueran la misma ruta medida en el mapa actual. E1 medirá físicamente sus recorridos.

### Actividades y presión local

Mercader de referencia (35, 180), captura (−20, 110), primer cofre (25, 195), suministro (12, 199) y monedas (20, 194). Respetar las validaciones de espacio, accesibilidad y separación de objetos al colocarlos. Mantener el presupuesto de recompensas de la partida; redistribuir los objetos existentes antes de añadir más.

En las rutas principales, buscar una señal de interés visible o un desvío claro cada 35–50 m, como objetivo de composición, con recorridos de aproximadamente 7–10 s a velocidad base. No significa colocar un cofre cada diez segundos. Evitar que tienda, fuente y captura compitan por el mismo espacio o que todo el contenido interesante quede en los primeros treinta metros.

Conservar inicialmente el anillo de aparición de 11–23 m, radio local de 26 m y límite de cien enemigos. El área adicional no implica aumentar la población total automáticamente. Comprobar especialmente los bordes nuevos, los claros junto al bosque y la captura, sin apariciones dentro de decoración ni caminos cerrados por ruinas.

## E0.4 — Dirección visual, límites y criterios de cierre de E1

Referencias de material existentes: `castle_wall_slates`, `cobblestone_floor_04`, `brown_mud_02` y `weathered_brown_planks`. Mantener su procedencia documentada, revisar escala y variación antes de sustituirlas. Piedra gris húmeda, tierra menos uniforme, madera oscura, hierro mate y paños granate apagados forman la paleta de trabajo. Reservar la saturación y el brillo fuertes para efectos, señales y antorchas.

La zona de referencia de E2 sigue siendo puerta, dos torres, explanada y tramo de camino. Conservar sus dimensiones generales hasta comparar con los tres personajes. Emplear piezas arquitectónicas reutilizables con volúmenes y remates modelados, y revisar su lectura desde la cámara real. Evitar producir el detalle completo de una pieza cuya posición todavía pueda cambiar en E1.

Relieve visual en periferia e islas decorativas; superficie de combate inicialmente plana. El sistema actual de movimiento no sigue una superficie con altura variable, por lo que rampas o desniveles transitables necesitarían un trabajo específico. No introducirlos incidentalmente al decorar.

Las mallas estáticas están fusionadas por material para el conjunto del mapa. Esto explica que la carga de geometría visible cambie poco entre vistas. Mantener esa eficiencia de llamadas y considerar agrupación por sectores al aumentar detalle, para poder descartar zonas lejanas. Medir antes de cambiar la estrategia; E0 no determina un presupuesto de GPU de producción.

E1 se considerará completa cuando:

1. Los límites y anclas estén implementados, con inicio sur seguro y primeras oportunidades cercanas.
2. Los quince hitos y todas las actividades colocadas sean accesibles; existan eje principal, recorridos laterales y conexiones sin atascos.
3. Se conserve la presión local en centro, bordes y nuevos claros, con las tres clases. Los encuentros exigentes completos siguen correspondiendo a E5/E6.
4. La fortaleza se reconozca desde llegada, cruce central y claros seleccionados; la decoración pueda enmarcarla sin bloquear toda orientación.
5. Se repita la ruta de referencia actual cuando siga siendo válida y se registren por separado los nuevos recorridos. No confundir estimaciones de plano con tiempos de juego.
6. La auditoría de render se repita con los mismos encuadres, resolución y cargas. Una variación de p95 superior al 15 % exige repetir y analizar, no atribuir automáticamente una regresión a una sola muestra.
7. Haya capturas y mediciones que permitan comparar antes/después y explicar diferencias de geometría, llamadas y calidad visual.

## Reproducción y verificación de esta entrega

- Análisis espacial desde `game`: `node --experimental-strip-types audits/e0-spatial.ts`. Produce JSON por salida estándar. No modifica el mundo ni la partida.
- Auditoría visual local con el servidor de desarrollo en `/audits/e0.html`. Permite elegir cada hito, orientación, carga y una medición de 300 fotogramas. Los valores de inicio se leen del código vigente; para comparar E1 deben registrarse además las coordenadas de cada vista.
- Generador de plano `game/audits/e0-plan.py`, ejecutado desde `game`, con datos explícitos de propuesta y las mediciones conservadas en `../e0/spatial.json`. El plano sirve como artefacto de diseño; no se carga como configuración del juego.
- Tipado y compilación del juego y laboratorio correctos. El navegador cargó la auditoría con cero fallos de recursos; las vistas se inspeccionaron visualmente. Se conserva el aviso conocido del tamaño de bundle y el favicon ausente. La página de auditoría no forma parte de las entradas de producción.
- No se modificaron `src`, límites de mapa, recursos artísticos ni reglas de combate durante E0. Los archivos añadidos son herramientas de evaluación, evidencias y documentación. No se declara una campaña completa probada.

**Siguiente: E1.1, implementar los límites y terreno base de la distribución definida, junto con las dependencias del nuevo punto de llegada.**

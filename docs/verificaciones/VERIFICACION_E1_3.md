# E1.3 — Encaje funcional

Implementada el 11 de noviembre de 2026 · aplicación **0.2.15**.

## Problema y cambios

La redistribución de E1.2 dejó numerosos cofres y fuentes en el camino o su margen inmediato. La auditoría de las semillas 1, 19, 77 y 9173 encontró respectivamente 15, 14, 14 y 15 objetos con menos de 1 m de separación respecto al borde de una ruta. El acceso era posible, pero la colocación no respetaba la distribución nueva.

- Cofres, fuentes y mercader buscan un lugar junto a su referencia, fuera del ancho del camino y con **0,8 m de margen adicional a su huella**. La búsqueda es determinista, acotada y comprueba límites, sólidos, navegación y acceso directo desde la referencia.
- Se reserva el círculo de captura y la separación respecto de la guardia inicial. Se conservan **33 objetos iniciales**, incluyendo las primeras recompensas próximas a la llegada. No aumenta la economía por el tamaño del mapa.
- El director descarta apariciones sobre cofres, fuentes, tienda y mástil. Incluye su huella, radio del enemigo y 0,35 m extra; también respeta objetos usados que siguen visibles. Monedas, suministros y la superficie del círculo de captura permiten apariciones. Se mantienen las reglas de presión local, población y distancia.
- Las huellas sirven para colocación y aparición; no convierten los objetos interactivos en nuevas paredes para el movimiento o los ataques. Las colisiones estructurales existentes siguen siendo compartidas por navegación y combate.
- Se conserva la cámara de 12 m, con rueda 4–18 m. La revisión no justifica modificarla.

La opción `roadsidePlacement` está activada en la expedición de producción. La pequeña arena histórica de las pruebas aisladas conserva su distribución anterior. Las pruebas de integración usan el mapa y la expedición reales.

## Verificación

**65 pruebas dirigidas correctas**, sin fallos: 41 de exploración, actividades, llegada de las tres clases, ampliación, rutas y encaje; 24 de hordas y campaña. Typecheck y build correctos. Permanece el aviso conocido de un paquete de aproximadamente 830 kB.

Las once pruebas nuevas verifican ocho semillas, conservación de los 33 objetos, margen de caminos, descubrimiento desde las rutas, acceso desde al menos cuatro direcciones y foco de interacción. También comprueban 648 posiciones solicitadas alrededor de quince hitos, llegada, mercader y captura, con radios de enemigo normal, élite y jefe: todos los lotes de doce encuentran espacio. Una regresión coloca deliberadamente un cofre usado en un destino previamente válido y verifica que el director lo descarte. El círculo de captura permanece disponible para enemigos excepto el mástil.

La auditoría antes/después de cuatro semillas pasa de 14–15 objetos en el camino o margen inmediato a **cero**, conservando 33 objetos y ocho direcciones de acceso libres en todas las ubicaciones de interacción muestreadas. La navegación de siete rutas conserva sus 4.212 muestras libres y tiempos de recorrido.

Barrido de cámara: **2.880 combinaciones** de hitos/rutas, orientación y zoom 4/12/18. Distancia mínima observada: 4 m; 26 casos de retracción por geometría. Es una muestra de colisión de cámara, no una garantía para cada posición posible.

Revisión visual en navegador a 1440 × 900 con recursos reales: llegada, fuente del sur, tienda, captura, abadía y molinos. Se inspeccionaron caminos, proximidad de recompensas, acceso y círculo despejado. Partida real iniciada con Guerrero, sin errores de consola, y dejada pausada. La auditoría auxiliar tiene un 404 de favicon; los recursos de escena cargaron correctamente.

## Evidencias y reproducción

- [Antes](evidencias/e1-3/before.json), [después](evidencias/e1-3/after.json), [pruebas espaciales](evidencias/e1-3/spatial-tests.txt), [director y campaña](evidencias/e1-3/director-tests.txt), [build](evidencias/e1-3/build.txt), [navegador](evidencias/e1-3/browser.txt).
- Capturas: [llegada](../../game/output/playwright/e13-arrival.png), [fuente](../../game/output/playwright/e13-field.png), [mercader](../../game/output/playwright/e13-shop.png), [captura](../../game/output/playwright/e13-capture.png), [abadía](../../game/output/playwright/e13-abbey.png), [molinos](../../game/output/playwright/e13-mill.png), [partida](../../game/output/playwright/e13-game.png).
- `node --experimental-strip-types audits/e13-fit.ts` reproduce el muestreo espacial y de cámara con materiales de sustitución; el navegador verifica los recursos reales.
- `/audits/e0.html?objects=1` añade las interacciones de la semilla 19 y destinos de inspección a la auditoría existente. Sin el parámetro se conserva su referencia de carga. La herramienta no simula IA, habilidades ni combate y no forma parte de las entradas de producción.

## Siguiente paso

**E1.4 — Prueba de recorrido:** recorrido y combate consolidados con Guerrero, Mago y Arquero sobre esta distribución, incluyendo conexiones, límites, visibilidad y atascos. Las pruebas de esta entrega no sustituyen ese recorrido ni prueban balance humano prolongado, GPU o teléfono físico. Después corresponde E2.1, puerta y torres como primera zona de acabado. El arte del entorno sigue provisional.

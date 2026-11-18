# E1.4 — Prueba de recorrido

Completada el **12 de noviembre de 2026**, sobre la aplicación **0.2.15**. Cierra la distribución jugable E1. Se añadieron auditorías reproducibles y evidencias; no fue necesario modificar reglas, modelos, tamaño ni cámara del juego.

## Recorridos con combate

Tres itinerarios continuos parten de la llegada real. Usan movimiento, colisiones, navegación, progresión, habilidades y director de `Run`, a 60 pasos por segundo. Se camina entre rutas: no se teletransporta al personaje. Las elecciones se resuelven automáticamente con ofertas válidas, priorizando aprender habilidades. La vida de estas tres simulaciones se amplía a 100.000 **solo en la auditoría** para poder completar la revisión espacial.

| Clase | Rutas | Duración simulada | Distancia | Bajas | Pico de enemigos |
|---|---|---:|---:|---:|---:|
| Guerrero | Principal, oeste inverso, poniente | 159,77 s | 798,83 m | 68 | 80 |
| Mago | Principal, ronda de muralla inversa, este inverso | 130,60 s | 653,00 m | 83 | 69 |
| Arquero | Principal, ruinas, travesía inversa de la abadía | 113,33 s | 589,33 m | 68 | 67 |

En conjunto: **2.041,17 m, siete rutas y seis sectores**. Los tres llegan a todos los puntos previstos sin bloqueo, muerte duplicada o solapamiento sólido en las comprobaciones periódicas de personaje/enemigos. La cámara se muestrea cada segundo en la dirección de avance y a 90°/180°: mínima 11,90 m, una retracción leve en la ruta del Arquero. Las duraciones de la tabla incluyen conexiones entre rutas y no son una comparación de potencia entre clases.

El camino principal tarda 43,28 s para Guerrero/Mago y 41,63 s para Arquero, coherente con sus velocidades actuales. La distribución conserva margen de circulación durante la persecución.

## Límites y controles

Una segunda auditoría comprueba **doce aproximaciones a los bordes**, cuatro por clase. Incluye las esquinas del sur y el cierre norte junto a los extremos laterales. Se comprueba tanto detenerse sin atravesar sólidos como volver hacia el mapa. Al norte la muralla cierra el recorrido antes del límite numérico Z −20: la primera sonda se corrigió porque iniciaba al personaje dentro de esa muralla, una posición a la que no se llega caminando. No se cambió la colisión para hacer pasar la prueba.

**20 pruebas unitarias de cámara, controles y movimiento correctas.** Typecheck y build correctos; permanecen las dos entradas de producción, juego y laboratorio. Continúa el aviso conocido del paquete compartido de aproximadamente 830 kB.

## Revisión en navegador

Chromium visible, ventana 1440 × 900 y estadísticas normales del juego. Se recorrió con WASD el acceso sur hasta la explanada de la puerta con las tres clases, observando animación, referencias, rótulos y ataques automáticos.

- Guerrero: llegada a (4,72; −8,04), 100 de vida, una baja durante el avance. Cámara de 12 m.
- Mago: llegada a (5,00; −4,05), 80 de vida y tres bajas durante el avance. Carga de modelo y desplazamiento correctos.
- Arquero: llegada a (4,75; −7,57), 90 de vida y tres bajas durante el avance. Al detenerse, la horda alcanza la explanada y el contador sube a ocho bajas en la captura de combate; once al terminar la comprobación de cámara.
- Ratón sin arrastre verificado. Al mirar hacia el exterior con la muralla detrás de la cámara, la distancia se retrae a **10,87 m**; al girar vuelve a **12 m**. La rueda llega a **4 m y 18 m**, y la distancia solicitada queda limitada a 18.
- La consola del juego termina con **cero errores y cero advertencias**. Un intento de pulsar botones de cámara mediante clic automatizado fue interceptado por el lienzo mientras estaba capturado el ratón; se verificó el giro con movimiento real del ratón. No se contabiliza ese intento como una revisión visual completada.

La partida queda abierta y pausada. Los registros de datos del lienzo y capturas permiten distinguir observación visual de simulación.

## Hallazgos para el acabado

1. **E2.1–E2.3:** la puerta funciona como referencia visible durante la aproximación, pero el arco, torres y superficie de piedra todavía muestran el carácter modular provisional. El siguiente trabajo es mejorar esa zona como referencia de acabado.
2. **E5.2–E5.3:** avanzar constantemente puede dejar a la horda detrás. En el recorrido directo hubo solo una baja con Guerrero y tres con cada clase a distancia antes de detenerse; la imagen mirando al sur muestra a los perseguidores. Revisar presión de flancos/avance y oportunidades para recoger esencia, conservando avisos y espacio de esquiva. No se interpreta como ausencia de enemigos ni como una prueba suficiente de balance.
3. **E6.1/E6.3:** las simulaciones registran tiempos CPU por paso, con percentiles 95 de alrededor de 28–29 ms. Algunas se ejecutaron mientras había otras comprobaciones activas: no son una medición aislada, no equivalen a FPS y no certifican rendimiento GPU. Repetir una comparación controlada tras el acabado, con cargas de habilidades y enemigos comparables.

No se encontraron bloqueos estructurales en los recorridos muestreados. Se mantienen los 280 × 260 m, los personajes y la cámara actuales. El balance prolongado, configuraciones de cuatro habilidades, prueba del jefe y dispositivo móvil físico no se vuelven a certificar en esta entrega; corresponden a sus pruebas previas o a la revisión integral E6.

## Evidencias y reproducción

- [Resumen](evidencias/e1-4/summary.json), [Guerrero](evidencias/e1-4/warrior.json), [Mago](evidencias/e1-4/mage.json), [Arquero](evidencias/e1-4/archer.json), [límites](evidencias/e1-4/boundaries.json).
- [Pruebas de controles](evidencias/e1-4/controls-tests.txt), [compilación](evidencias/e1-4/build.txt), [consola](evidencias/e1-4/console.txt), [recuperación y zoom](evidencias/e1-4/camera-recovery.txt).
- Llegada ante la puerta: [Guerrero](../../game/output/playwright/e14-warrior-gate.png), [Mago](../../game/output/playwright/e14-mage-gate.png), [Arquero](../../game/output/playwright/e14-archer-gate.png).
- [Horda al mirar atrás](../../game/output/playwright/e14-archer-wall.png), [combate en explanada](../../game/output/playwright/e14-archer-combat.png), [zoom cercano](../../game/output/playwright/e14-warrior-camera.png).

Desde `game`: `node --experimental-strip-types audits/e14-traverse.ts warrior` (también `mage` y `archer`), `node --experimental-strip-types audits/e14-boundaries.ts`, `node --experimental-strip-types --test tests/camera.test.ts tests/controls.test.ts tests/movement.test.ts` y `npm run build`.

**Siguiente: E2.1 — Puerta y dos torres.** Refinar silueta, arco, portón, proporciones, torres y unión con la muralla, conservando los pasos revisados. Materiales detallados y explanada se desarrollan en E2.2/E2.3.

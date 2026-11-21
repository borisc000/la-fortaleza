# E2.4 — Comparación visual

Entregada el **18 de noviembre de 2026**, sobre la aplicación **0.2.15**. Cierra el trabajo de E2: compara la zona de la puerta con su estado de E1 en condiciones equivalentes, revisa escala, combate, cámara y coste de render, y prepara piezas reutilizables para el laboratorio. Los criterios de acabado que salen de E2 están en [ACABADO_EXTERIOR_E2.md](../diseno/ACABADO_EXTERIOR_E2.md). **Falta la opinión del usuario** antes de extender el acabado.

## Antes y después

La referencia «antes» es el `world.ts` del último commit (E1, antes de E2), cargado en la misma página que el actual. Ambos se ven con los mismos materiales, HDR, cámara de juego, encuadres y resolución (1440 × 900):

[Cerca](evidencias/e2-4/cerca.jpg) · [Contrapicado](evidencias/e2-4/contrapicado.jpg) · [Detalle](evidencias/e2-4/detalle.jpg) · [Oblicua este](evidencias/e2-4/oblicua-este.jpg) · [Media](evidencias/e2-4/media.jpg) · [Lejana](evidencias/e2-4/lejana.jpg) · [Aproximación](evidencias/e2-4/aproximacion.jpg) · [Escala con las tres clases](evidencias/e2-4/escala.jpg) · [Explanada desde arriba](evidencias/e2-4/explanada-alta.jpg) · [Camino](evidencias/e2-4/camino.jpg) · [Flanco oeste](evidencias/e2-4/flanco-oeste.jpg) · [Flanco este](evidencias/e2-4/flanco-este.jpg) · [Suelo](evidencias/e2-4/suelo.jpg)

## Escala con personajes y enemigos

- Con las tres clases ante la puerta, el vano mide unas tres veces su altura y el arranque del arco queda por encima de sus cabezas.
- Con **100 enemigos** ante la entrada, los soldados se distinguen igual de bien o mejor que en E1. El suelo más oscuro y variado los recorta, y ni los charcos ni los restos se confunden con ellos: [cerca](evidencias/e2-4/horda-cerca.jpg) · [media](evidencias/e2-4/horda-media.jpg) · [explanada](evidencias/e2-4/horda-explanada-alta.jpg) · [camino](evidencias/e2-4/horda-camino.jpg).

## Combate y cámara en la zona

Nueva auditoría reproducible, `audits/e24-gate-zone.ts`, ejecutada sobre el mundo de E1 y sobre el actual: [E1](evidencias/e2-4/zona-e1.json), [E2.4](evidencias/e2-4/zona-e2.json).

**Hordas.** Sesenta soldados en un anillo de 12–22 m alrededor de un héroe quieto. Nadie muere, para aislar el movimiento. Se probaron cuatro sitios: la explanada, la boca de la puerta y los flancos del ariete y de la escala.

| Sitio | E1: 50 % a menos de 6 m | E2.4: 50 % a menos de 6 m | E2.4: llegan a menos de 6 m en 25 s |
|---|---:|---:|---:|
| Explanada | 4,7 s | 5,1 s | 60 de 60 |
| Boca de la puerta | 5,1 s | 6,2 s | 60 de 60 |
| Flanco este, junto al ariete | 5,2 s | 6,2 s | 60 de 60 |
| Flanco oeste, junto a la escala | 5,6 s | 5,6 s | 58 de 60 |

- En ningún muestreo hay enemigos dentro de sólidos.
- La horda tarda hasta 1 s más en cerrarse junto a la puerta, porque rodea las torres adelantadas y el ariete. La presión se mantiene.
- Los que no llegan son dos casos:
  - Un soldado del anillo aparece en una bolsa sin salida: tras la muralla en E1, o en el paso tras el rastrillo en E2.4. El juego no coloca a nadie ahí, porque su director comprueba que el sitio tenga acceso.
  - En el flanco oeste, otro soldado queda detrás de la aglomeración junto a una ruina antigua, pero no está bloqueado: lanzados de uno en uno desde cada punto del anillo, todos los soldados alcanzan al héroe en los dos mundos, salvo el de la bolsa.

**Cámara.** Se probaron 650 casillas libres de 2 m entre los dos flancos, de la muralla hasta 22 m al sur, con 16 orientaciones cada una.

| | E1 | E2.4 |
|---|---:|---:|
| Distancia mediana | 12 m | 12 m |
| Percentil 5 | 4,62 m | 2,93 m |
| Muestras por debajo de 6 m | 6 % | 8 % |
| Muestras con obstrucción | 11 % | 13 % |

- Las torres adelantadas acercan la cámara cuando el héroe está a su pie y mira hacia ellas, igual que contra la muralla. El peor caso, con el héroe pegado al fuste, es de 0,24 m (en E1, 0,13 m contra la muralla).
- **Corrección hecha:** el pie de la escala tenía una colisión de 1,2 m de alto que acercaba la cámara a 0,18 m al pasar al lado. Ahora mide 0,7 m: sigue bloqueando el paso, pero la cámara pasa por encima.

## Coste de render

Fotograma sincronizado con la GPU (render más lectura de 1 píxel), con mediana de 40 fotogramas por encuadre en una GPU integrada AMD Radeon a 1440 × 900. El panel del navegador estaba oculto, así que no equivale a FPS en partida. Detalle en [render.json](evidencias/e2-4/render.json).

- **La primera medición destapó un coste alto:** el sombreado de E2.2–E2.3 añadía hasta 4,7 ms en planos cercanos (2,9 ms el suelo y 1,8 ms el desgaste).
- **Optimización:** el ruido solo se calcula donde se ve (banda húmeda, caras superiores, hierro, zona de muestra, bordes de cinta). Un campo de dos octavas sirve para tono y tinte, y la segunda muestra de textura solo se toma dentro de la zona. El aspecto apenas cambia.
- **Resultado sin horda:** E1 tarda 8,5–9,8 ms y E2.4 9,6–12,2 ms, una mediana de **+1,4 ms**. Las llamadas de dibujo pasan de 122 a 128 y los triángulos por fotograma (sombras incluidas) de 469.590 a 488.132.
- **Con 100 enemigos:** 1.500–2.900 llamadas en ambos mundos. La horda domina el coste y la variación entre rondas supera la diferencia entre E1 y E2. No se puede afirmar ni una mejora ni un empeoramiento.

## Piezas para el laboratorio

- **Módulo nuevo `src/rendering/exterior-pieces.ts`:** reúne los materiales de E2.2, las herramientas de construcción y las piezas: puerta y torres, ariete, barril, escala, flecha, escudo, hoguera y estaca. El mundo lo usa en lugar de su código propio. Una huella exacta del mundo antes y después de la extracción coincide: mismos 864 obstáculos, mismos vértices por malla y misma suma de posiciones.
- **Laboratorio:** dos entradas nuevas en Escenario, «Puerta y torres» y «Restos del asedio». La colección pasa a 28 entradas. La puerta se ve de frente con el rastrillo, mide unos 20 m de ancho con sus piedras caídas y supera los 17 m de alto con los mástiles. Los restos miden 13,3 × 3,4 × 6,7 m, con 79 mallas y 2.138 triángulos.
- **Prueba nueva `tests/exterior-pieces.test.ts`:** la puerta se construye aislada con su tamaño y las mismas 28 cajas de colisión que en el mundo. De los restos, solo colisionan el ariete y el barril.

## Verificación

- **Pruebas rápidas:** 355 de 355 correctas. [Mundo, piezas, expansión, encaje y rutas](evidencias/e2-4/pruebas.txt): 26 de 26.
- **Simulaciones completas** (`npm run test:sim`): **26 de 26 correctas**, con cifras idénticas a las de E2.3. La extracción a `exterior-pieces.ts` no cambia la geometría, y el pie de la escala más bajo sigue bloqueando el mismo paso. [Resultados](evidencias/e2-4/simulaciones.txt).
- **Lint**, **typecheck** y **build** correctos. [Compilación](evidencias/e2-4/compilacion.txt).

## Límites

- No se recorrió la partida real en el navegador: el panel oculto la limita a un fotograma por segundo. La auditoría y las pruebas cubren movimiento, navegación y cámara.
- Las medidas de render son de una sola GPU integrada y no incluyen la simulación ni la interfaz. Teléfono físico sin probar.
- El acabado sigue limitado a la zona de muestra. El resto del mapa no cambia hasta E3.

## Reproducción

Desde `game`: `node --experimental-strip-types audits/e24-gate-zone.ts` (con un módulo de mundo y una etiqueta opcionales para comparar con otra versión), `node --experimental-strip-types --test tests/exterior-pieces.test.ts tests/world.test.ts`, `npm test`, `npm run test:sim` y `npm run build`. Encuadres y medición de render con la herramienta temporal de `m/work/e2-1-revision/`, fuera del repositorio.

**Siguiente:** revisión del usuario sobre la zona de referencia E2 (decisiones abiertas en [ACABADO_EXTERIOR_E2.md](../diseno/ACABADO_EXTERIOR_E2.md) y [ESTADO.md](../../ESTADO.md)). Después, **E3.1 — Superficies**, que extiende el suelo gastado al resto del mapa.

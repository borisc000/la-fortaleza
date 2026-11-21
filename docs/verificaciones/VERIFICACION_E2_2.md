# E2.2 — Materiales y construcción

Entregada el **18 de noviembre de 2026**, sobre la aplicación **0.2.15** y la puerta de [E2.1](VERIFICACION_E2_1.md). Define el acabado de piedra, madera y hierro, y añade remates y daños a la puerta y sus torres. No cambia reglas, colisiones, cámara ni recuentos del plan.

## Materiales

Un módulo nuevo, `game/src/rendering/weathering.ts`, añade desgaste a los materiales existentes con una pasada de sombreado calculada por posición en el mundo. No necesita texturas nuevas ni depende de cuántos vértices tenga cada malla fusionada.

| Efecto | Qué hace | Dónde se lee |
|---|---|---|
| Variación en grande | Tono más claro u oscuro y ligeramente frío o cálido en manchas de varios metros. Rompe la repetición de 2,4 m de la textura | Lienzos largos y fuste de las torres, a media distancia |
| Pie húmedo y musgo | Banda irregular de hasta 1,5 m, más oscura, con musgo verde donde se acumula | Pie de torres, muralla, ruinas, cajas |
| Caras superiores | Suciedad y liquen en lo que mira hacia arriba | Albardillas, cornisas, adarve, rocas |
| Regueros | Vetas verticales oscuras siguiendo cada cara | Muros altos |
| Hollín | Mancha que sube sobre cada antorcha de la puerta | Fuste de las torres junto a la boca |
| Óxido | Manchas pardas que quitan brillo metálico, más abundantes cerca del suelo | Rastrillo, flejes, mástiles y soportes |

Ajustes de base: la piedra es algo más fría y oscura (color 0xcac9c3) y sus juntas tienen más relieve (escala de normales 0,9 en lugar de 0,65). Las piezas de remate son un poco más oscuras que el paramento. La madera es más gris, de tablas viejas. El hierro es menos brillante (metalicidad 0,75). Los valores están en el [registro de medidas](evidencias/e2-2/medidas.json).

**Alcance:** los materiales los comparten todas las piezas del escenario, así que el desgaste también llega a la muralla, las ruinas, la abadía, las carretas y las rocas. En cambio, los remates y daños geométricos son solo de la puerta; extenderlos al resto corresponde a E4.4.

## Remates y daños de la puerta

- **Remates:** albardillas sobre cada merlón de las torres y del cuerpo de guardia, y cornisa en el borde del cuerpo de guardia.
- **Almenas dañadas:** en cada torre falta un merlón y otro está partido; en el cuerpo de guardia hay un merlón partido al frente. Sus piedras están caídas al pie de cada torre, sin colisión y fuera del camino.
- **Cadalso:** falta una tabla y otra cuelga de un clavo.
- **Estandartes rasgados:** borde inferior deshilachado y un desgarrón, distintos en cada torre. Las banderolas de lo alto tienen cola de golondrina.
- **Hierro:** el rastrillo conserva su lectura de reja oscura. Una primera prueba con más óxido lo volvía naranja y parecía de madera, así que se redujo a manchas.

No se añadieron grietas finas ni sillares sueltos en los fustes: a 9–12 m de cámara no se leían. Se prefirieron daños con silueta propia, como las almenas, las piedras caídas, las tablas y los estandartes.

## Verificación

- **Pruebas rápidas:** 347 de 347 correctas. [Mundo, cámara, movimiento y expansión](evidencias/e2-2/pruebas.txt): 29 de 29, incluida la prueba de la puerta de E2.1.
- **Lint**, **typecheck** y **build** correctos, con las dos entradas de producción. [Compilación](evidencias/e2-2/compilacion.txt).
- **Colisiones sin cambios:** 861 obstáculos, igual que en E2.1. Las piedras caídas y las almenas rotas no colisionan, así que las [26 simulaciones completas de E2.1](evidencias/e2-1/simulaciones.txt) siguen valiendo para este mapa.
- **Geometría:** 24 mallas fusionadas, igual que en E2.1; triángulos de 259.442 a 260.070 (+0,2 %).
- **Sombreado:** las operaciones de ruido añadidas por píxel no se midieron. Su coste en GPU queda para E2.4.

## Revisión visual

Mismos nueve encuadres fijos que en E2.1, con E2.1 a la izquierda y E2.2 a la derecha:

[Cerca](evidencias/e2-2/cerca.jpg) · [Contrapicado](evidencias/e2-2/contrapicado.jpg) · [Detalle de la boca](evidencias/e2-2/detalle.jpg) · [Oblicua este](evidencias/e2-2/oblicua-este.jpg) · [Oblicua oeste](evidencias/e2-2/oblicua-oeste.jpg) · [Media distancia](evidencias/e2-2/media.jpg) · [Lejana](evidencias/e2-2/lejana.jpg) · [Aproximación](evidencias/e2-2/aproximacion.jpg) · [Escala con las tres clases](evidencias/e2-2/escala.jpg)

- De cerca, la piedra tiene relieve en las juntas, manchas grandes que ocultan la repetición, y musgo y humedad al pie. El rastrillo es hierro oscuro con algo de óxido.
- Desde la cámara de juego se leen los estandartes rasgados, las piedras caídas, la tabla rota del cadalso y las albardillas.
- A media distancia, la fortaleza entera pierde el tono beige uniforme y gana suciedad en la base de los muros.
- El hollín sobre las antorchas es discreto: domina el brillo de la propia luz.

## Límites

- El desgaste es procedural. No sustituye una textura pintada ni sillares modelados; su escala está pensada para la cámara de 4–18 m.
- La explanada y el camino inmediato siguen sin acabado; corresponden a **E2.3**.
- Coste de GPU, comparación con carga de combate y piezas para el laboratorio: **E2.4**.
- Teléfono físico sin probar.

## Reproducción

Desde `game`: `npm test`, `npm run lint` y `npm run build`. Encuadres con la herramienta temporal de `m/work/e2-1-revision/`, fuera del repositorio.

**Siguiente: E2.3 — Explanada y camino inmediato.** Suelo, transiciones de materiales, vegetación y restos del asedio junto a la entrada.

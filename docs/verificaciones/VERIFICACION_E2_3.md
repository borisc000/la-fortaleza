# E2.3 — Explanada y camino inmediato

Entregada el **18 de noviembre de 2026**, sobre la aplicación **0.2.15** y la puerta de [E2.1](VERIFICACION_E2_1.md)–[E2.2](VERIFICACION_E2_2.md). Es una muestra de suelo, transiciones, vegetación y restos del asedio ante la entrada. No cambia reglas, rutas, sectores, cámara ni recuentos del plan.

## Zona de muestra

El acabado de suelo se limita a una **zona de muestra** con centro en (4; −4): actúa entero hasta 34 m y desaparece a 48 m. Cubre la explanada, los primeros 40 m del camino principal, el arranque de la ronda de la muralla y los dos flancos de la puerta. Fuera de esa zona, caminos y suelo siguen como en E1, sin un corte visible. **E3.1** lo extenderá al resto del mapa.

## Suelo y transiciones

`weathering.ts` incorpora `wearGround`, un tratamiento de suelo por posición en el mundo:

- **Bordes gastados:** el camino empedrado, la ronda y los claros pierden el borde recto; se deshilachan hasta un 42 % de su media anchura según el ruido. Junto al borde, el empedrado se mezcla con el barro. Las cintas llevan ahora un vértice central y un atributo `edge` (0 en el eje, 1 en el borde).
- **Repetición oculta:** una segunda muestra de la textura, girada y a otra escala, se mezcla con ruido. Así se rompe la cuadrícula de 4 m que se veía en el barro y la de 2,4 m del empedrado.
- **Tono:** manchas grandes de variación. La cinta de tierra clara bajo el camino y la ronda se oscurece dentro de la zona: antes dibujaba un halo claro alrededor del empedrado.
- **Barro mojado** al pie de la muralla, en una franja de 68 m que se deshilacha hacia el campo.
- **Once charcos** en roderas y hondonadas, sobre el camino y fuera de él. El agua refleja el cielo nublado y cada charco tiene un borde de barro mojado. Una primera versión, más oscura, parecía agujeros vistos desde arriba.
- **Adoquines sueltos:** unas 60 piedras pequeñas en los bordes gastados del camino y alrededor de la explanada.

## Vegetación

- **Malezas altas** a lo largo de la muralla y alrededor del pie de las dos torres, sin entrar en la boca empedrada.
- **Matas cortas** entre los adoquines de los bordes del camino.
- **Zarzas** en cuatro rincones al pie de la muralla.

Las malezas usan su propia serie de números aleatorios: el reparto de hierba del resto del mapa no cambia.

## Restos del asedio

| Resto | Lugar | Colisión |
|---|---|---|
| Ariete con techo de tablas, sin una rueda y con el lado sur quemado | Este de la puerta, (20,5; −10,2), apuntando a la entrada | Sí, una caja de 6,3 × 2,6 m |
| Escala apoyada en la muralla, con un peldaño roto | Lienzo oeste, x −21 | Solo el pie |
| Escala derribada | Oeste de la explanada | No |
| Barril junto a las cajas y otro reventado en duelas | Al pie de la torre este | El barril entero |
| Flechas clavadas, inclinadas hacia las almenas | Cinco grupos alrededor de la explanada, fuera de los caminos | No |
| Tres escudos caídos | Explanada y flanco oeste | No |
| Hoguera apagada: anillo de piedras, troncos quemados y ceniza | Oeste de la explanada | No |
| Estacas de un abatís, casi todas derribadas | Campo oeste | No |
| Estandarte caído con la tela en el barro | Sobre la ronda | No |

Solo colisionan los objetos con volumen que alguien rodearía. Lo plano o fino no colisiona para no enganchar a la horda.

## Verificación

- **Pruebas rápidas:** 353 de 353 correctas. La suite incluye pruebas nuevas de otra sesión que trabaja en paralelo en las habilidades.
- **Prueba nueva E2.3** en `tests/world.test.ts`: recorre los últimos 50 m del camino principal y toda la ronda con la anchura completa de un soldado. Comprueba que nada bloquea la explanada en tres radios ni las cinco posiciones del primer encuentro. [Mundo, expansión, encaje, exploración y rutas](evidencias/e2-3/pruebas.txt): 34 de 34.
- **Simulaciones completas** (`npm run test:sim`): **26 de 26 correctas**, con victoria ante el jefe en las 14 campañas de seis minutos. [Resultados](evidencias/e2-3/simulaciones.txt). Las cifras coinciden exactamente con las de E2.1: las partidas simuladas son deterministas y sus recorridos no pasan junto al ariete, el barril ni la escala, así que no ejercitan esos obstáculos. La prueba E2.3 es la que los cubre.
- **Lint**, **typecheck** y **build** correctos. [Compilación](evidencias/e2-3/compilacion.txt).
- **Coste** ([medidas](evidencias/e2-3/medidas.json)): las mallas fusionadas pasan de 24 a 27 (barro mojado, charcos y plumas de las flechas), los obstáculos de 861 a 864 (ariete, barril y pie de la escala) y los triángulos de 260.070 a 268.495 (+3,2 %). El sombreado de suelo añade ruido por píxel en una superficie grande; su coste en GPU no se midió.

## Revisión visual

Encuadres fijos de E2.1 y cinco nuevos de la explanada, con E2.2 a la izquierda y E2.3 a la derecha:

[Explanada desde arriba](evidencias/e2-3/explanada-alta.jpg) · [Camino](evidencias/e2-3/camino.jpg) · [Flanco oeste](evidencias/e2-3/flanco-oeste.jpg) · [Flanco este](evidencias/e2-3/flanco-este.jpg) · [Suelo de cerca](evidencias/e2-3/suelo.jpg) · [Cerca](evidencias/e2-3/cerca.jpg) · [Escala con las tres clases](evidencias/e2-3/escala.jpg) · [Media distancia](evidencias/e2-3/media.jpg)

- El camino ya no es una cinta de bordes rectos: se gasta hacia el barro, con charcos y adoquines sueltos.
- El barro no muestra la cuadrícula de la textura dentro de la zona.
- El ariete, la escala contra la muralla, las flechas y el estandarte caído cuentan el asalto fallido sin cerrar la explanada.
- A media distancia la muestra se funde con el resto sin corte visible.

## Límites

- Charcos y barro son planos: no hay relieve, salpicaduras ni ondas. Los estandartes y la tela no se mueven.
- La zona de muestra no llega a los caminos lejanos; corresponde a **E3.1**.
- Coste de GPU del sombreado de suelo, comparación con carga de combate y piezas para el laboratorio: **E2.4**.
- Teléfono físico sin probar.

## Reproducción

Desde `game`: `node --experimental-strip-types --test tests/world.test.ts`, `npm test`, `npm run test:sim`, `npm run lint` y `npm run build`. Encuadres con la herramienta temporal de `m/work/e2-1-revision/`, fuera del repositorio, que ahora tiene 14 encuadres.

**Siguiente: E2.4 — Comparación visual.** Antes y después en condiciones equivalentes, escala junto a los personajes, combate, cámara y coste de render en la zona, y piezas reutilizables para el laboratorio.

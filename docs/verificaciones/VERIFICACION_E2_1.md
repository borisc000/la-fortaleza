# E2.1 — Puerta y dos torres

Entregada el **18 de noviembre de 2026**, sobre la aplicación **0.2.15**. Primera subfase de E2: rehace la entrada de la fortaleza como referencia de proporciones y silueta. Solo cambia la representación del escenario (`game/src/rendering/world.ts`) y añade una prueba; no cambia reglas, clases, cámara, tamaño del mapa ni recuentos del plan.

## Referencia y decisiones

La referencia es el concepto [Puerta de hierro](../../arte/01-puerta-de-hierro.png) de la dirección artística 1.2: dos torres redondas adelantadas a la muralla, un cuerpo de guardia hundido entre ellas, un arco con rastrillo de hierro, un cadalso de madera sobre el arco y estandartes en las torres.

| Elemento | Antes | E2.1 |
|---|---|---|
| Torres | Cuadradas de 5,6 m, casi a ras de la muralla (sobresalían 0,6 m), 10 m con tejado de pizarra | Redondas, fuste de 3,1 m de radio con pie en talud de 3,55 m, centros a ±6 m del eje y adelantadas 5 m; adarve a 12,4 m, matacanes, almenas hasta 14,3 m y mástil con banderola |
| Arco | 5,9 m de ancho y 7,25 m hasta la clave, en el plano de la muralla | 4,4 m de ancho y 5,5 m hasta la clave, unas tres veces la altura de los personajes; dovelas con clave y salmeres |
| Paso | Sin profundidad: el portón estaba en la cara de la muralla | Cuerpo de guardia de 6,8 × 3,6 m con bóveda; rastrillo bajado a 0,55 m de la boca y portón de madera unos 2 m más adentro |
| Coronación | Galería almenada de piedra | Cadalso de madera sobre vigas y tornapuntas, con tablas, troneras y tejaroz de pizarra; almenas delante y detrás |
| Unión con la muralla | Las torres cortaban la muralla en ángulo recto | Los lienzos entran en el fuste redondo; zócalo, cornisa y almenas de la muralla quedan dentro de las torres |
| Antorchas y estandartes | En la cara de la muralla | Antorchas con copa en los flancos interiores de las torres, iluminando la boca; estandartes largos al frente de cada torre |

Decisiones tomadas en esta entrega, abiertas a revisión:

- **Rastrillo bajado.** La puerta sigue cerrada y no se puede atravesar, como antes. Un rastrillo bajado lo comunica sin texto y destaca a contraluz sobre el portón.
- **Torres de la puerta sin tejado.** Como en el concepto: la coronación almenada con banderola las distingue de las torres con tejado de pizarra del resto de la muralla y del recinto interior.
- **Vano más pequeño.** El vano anterior medía casi cuatro veces la altura del Guerrero. El nuevo mantiene la presencia de una puerta principal sin empequeñecer la masa de las torres.

## Recorrido y colisión

- El pie de cada torre colisiona como doce franjas que nunca quedan por dentro de la piedra visible. Nadie entra en el talud; el exceso máximo, en las esquinas de las franjas extremas, llega a unos 0,6 m.
- El personaje llega a la boca del arco y se detiene ante el rastrillo, con el centro en z ≈ −16,2. El bloque sobre el paso solo cuenta para la cámara.
- Las torres sobresalen hasta z −11,45. La explanada (círculo de 5 m en (4; −8)), las cajas junto a la torre este y los cinco guardias de apertura quedan fuera de ellas.
- La hierba y las piedras sueltas ya no aparecen en el paso ni al pie de las torres. La hierba consume los mismos números aleatorios que antes, así que su reparto en el resto del mapa no cambia.
- El camino empedrado conserva sus 6 m hasta el frente de las torres y se estrecha a 4,4 m hasta el rastrillo.

Nueva prueba en `tests/world.test.ts`: el personaje navega de oeste a este, y de vuelta, a lo largo de la muralla rodeando las dos torres; entra recto desde la explanada hasta el rastrillo; y ningún punto del perímetro de las torres admite un cuerpo dentro de la piedra.

## Verificación

- **Pruebas rápidas:** 347 de 347 correctas, incluida la nueva. [Pruebas de mundo, cámara, movimiento, expansión, encaje y rutas](evidencias/e2-1/pruebas.txt): 41 de 41.
- **Simulaciones completas** (`npm run test:sim`): **26 de 26 correctas**. Son 12 sondas de supervivencia con vida normal y 14 campañas de seis minutos en el mapa real con las tres clases y los cuatro elementos, todas con victoria ante el jefe; picos de 84–94 enemigos vivos. [Resultados](evidencias/e2-1/simulaciones.txt). Corrieron en paralelo con otro trabajo; los tiempos no sirven como medida de rendimiento.
- **Lint** (Biome), **typecheck** y **build** correctos, con las dos entradas de producción. Continúa el aviso conocido del paquete compartido de unos 840 kB. [Compilación](evidencias/e2-1/compilacion.txt).
- **Coste de geometría** ([medidas](evidencias/e2-1/medidas.json)): las mallas fusionadas del escenario pasan de 22 a 24 (las dos copas de las antorchas), los obstáculos de 856 a 861 y los triángulos de 258.446 a 259.442 (+0,4 %). El tiempo de construcción no cambia de forma medible (unos 2,7 s con el panel oculto; orientativo).

## Revisión visual

Página de revisión temporal con el `createWorld` real, materiales y HDR cargados, 1440 × 900 y la cámara en tercera persona del juego con su colisión. Nueve encuadres fijos antes y después, con el Guerrero de escala y, en el último, Mago y Arquero a su lado:

[Cerca](evidencias/e2-1/cerca.jpg) · [Contrapicado](evidencias/e2-1/contrapicado.jpg) · [Detalle de la boca](evidencias/e2-1/detalle.jpg) · [Oblicua este](evidencias/e2-1/oblicua-este.jpg) · [Oblicua oeste](evidencias/e2-1/oblicua-oeste.jpg) · [Media distancia](evidencias/e2-1/media.jpg) · [Lejana](evidencias/e2-1/lejana.jpg) · [Aproximación desde 118 m](evidencias/e2-1/aproximacion.jpg) · [Escala con las tres clases](evidencias/e2-1/escala.jpg)

- De cerca, las torres enmarcan la boca y el rastrillo se lee contra el portón iluminado. El paso tiene profundidad desde las vistas oblicuas.
- A media distancia y desde 118 m, la puerta se reconoce por las dos torres redondas con estandartes y banderolas, delante de las torres con tejado del recinto interior.
- Con las tres clases delante, el vano mide unas tres veces su altura y el arranque del arco queda por encima de sus cabezas.

En la partida real se cargó el juego con el Guerrero, sin errores de consola. **No se recorrió la partida hasta la puerta en el navegador:** el panel estaba oculto y la página avanzaba a un fotograma por segundo. La aproximación a pie la cubren la prueba de mundo y la navegación de la prueba nueva.

## Reproducción

Desde `game`: `node --experimental-strip-types --test tests/world.test.ts`, `npm test`, `npm run test:sim`, `npm run lint` y `npm run build`. La página de revisión de los nueve encuadres es una herramienta temporal fuera del repositorio, en `m/work/e2-1-revision/` junto a la carpeta del proyecto, con instrucciones en su `LEEME.md`.

## Límites

- Materiales, juntas, daños y variación de superficie siguen siendo los genéricos del escenario; corresponden a **E2.2**. La explanada y el camino inmediato, a **E2.3**.
- No se midieron fotogramas ni GPU; la comparación de coste de render en esta zona es parte de **E2.4**.
- Los estandartes y banderolas son planos estáticos, sin viento.
- Teléfono físico sin probar.

**Siguiente: E2.2 — Materiales y construcción.** Piedra, madera, metal, juntas, remates y daños de la puerta y las torres, legibles desde la cámara de juego.

# E3.1 — Superficies

Entregada el **18 de noviembre de 2026**, sobre la aplicación **0.2.15**. Primera subfase de E3: extiende al mapa entero el suelo gastado de la zona de muestra de [E2.3](VERIFICACION_E2_3.md), con un carácter propio en cada sector. El usuario dio paso a E3.1 tras el cierre de [E2.4](VERIFICACION_E2_4.md); lo interpretamos como visto bueno a los criterios de [ACABADO_EXTERIOR_E2.md](../diseno/ACABADO_EXTERIOR_E2.md). No cambia reglas, colisiones, rutas, cámara ni recuentos del plan.

## Qué cambia

**El suelo gastado llega a todo el mapa.** La zona de `wearGround`, que en E2.3 se desvanecía a 48 m de la puerta, ahora cubre el mapa entero. En todas partes:

- Las cintas de camino y los claros pierden el borde recto y se gastan hacia el barro.
- La repetición de la textura del barro, la tierra y el empedrado queda oculta.
- Hay manchas grandes de tono.

**Carácter por sector.** Está definido en `SECTOR_SURFACES` de `content/terrain-layout.ts` y se funde a lo largo de 12 m en cada frontera:

| Sector | Humedad | Musgo | Luz | Roderas | Lectura |
|---|---:|---:|---:|---:|---|
| F · Explanada y fortaleza | 0,35 | 0,15 | 0 | 0,5 | Como en E2.3 |
| A · Llegada y caravanas | 0,2 | 0,35 | +0,07 | 1 | Tierra más seca y clara, roderas marcadas de los carros |
| B · Campos del asedio y molinos | 0,95 | 0,08 | −0,07 | 0,7 | Barro oscuro y empapado, muchos charcos |
| C · Abadía y encrucijada | 0,4 | 0,55 | 0 | 0,3 | Verdoso, con empedrado antiguo |
| D · Bosque y atalaya | 0,6 | 0,8 | −0,1 | 0,2 | Suelo oscuro y musgoso de bosque |
| E · Campamentos del cerco | 0,55 | 0,12 | −0,04 | 0,6 | Tierra pisoteada |

- **Humedad:** manchas más oscuras y menos rugosas, que brillan con la luz.
- **Musgo:** tinte verde.
- **Luz:** aclara u oscurece el suelo.
- **Roderas:** dos surcos oscuros y húmedos dentro de cada camino de tierra.

**Más elementos de suelo**

- **Charcos en los caminos y claros de todo el mapa,** más frecuentes en los sectores húmedos. Llevan su propia serie de números aleatorios, así que los de la explanada siguen donde estaban.
- **Empedrado antiguo** roto en los patios de las ruinas, la abadía y la encrucijada, más oscuro y musgoso que el camino.
- **La franja de barro mojado al pie de la muralla** cubre ahora toda la muralla, no solo la zona de la puerta.

**Arreglo de lectura:** los caminos de tierra tenían una segunda cinta más ancha debajo. Con los bordes gastados dibujaba un contorno doble y claro, así que ahora solo la lleva el camino empedrado. Los caminos de tierra y los claros se oscurecen un poco más para asentarse en el barro.

## Revisión visual

Encuadres de la cámara de juego en los seis sectores; a la izquierda, el estado de E2:

[Llegada](evidencias/e3-1/a-llegada.jpg) · [Caravanas](evidencias/e3-1/a-caravanas.jpg) · [Campos del asedio](evidencias/e3-1/b-campos.jpg) · [Molinos](evidencias/e3-1/b-molinos.jpg) · [Abadía](evidencias/e3-1/c-abadia.jpg) · [Encrucijada](evidencias/e3-1/c-encrucijada.jpg) · [Bosque](evidencias/e3-1/d-bosque.jpg) · [Atalaya](evidencias/e3-1/d-atalaya.jpg) · [Campamento](evidencias/e3-1/e-campamento.jpg) · [Ruinas](evidencias/e3-1/e-ruinas.jpg) · [Explanada](evidencias/e3-1/explanada-alta.jpg) · [Camino](evidencias/e3-1/camino.jpg)

- **Cada sector se distingue por el suelo:** los campos del asedio con barro oscuro y charcos, el bosque con suelo musgoso, la abadía con su empedrado y la llegada con tierra clara y roderas.
- **La zona de la puerta no cambia de forma apreciable,** porque usa los parámetros de E2.3.
- **Con 100 enemigos,** los soldados se recortan con claridad sobre el barro de los campos, el empedrado de la encrucijada y el suelo del bosque: [campos](evidencias/e3-1/horda-b-campos.jpg) · [encrucijada](evidencias/e3-1/horda-c-encrucijada.jpg) · [bosque](evidencias/e3-1/horda-d-bosque.jpg). Ni los charcos ni el musgo se confunden con avisos ni con enemigos.

## Coste

Medido con el método de E2.4 en 24 encuadres, sobre la misma GPU integrada a 1440 × 900 ([render.json](evidencias/e3-1/render.json)).

- **Primera versión:** calculaba el carácter de sector en cada píxel y costaba unos +1,2 ms en los sectores, hasta +2,4 ms en los cruces.
- **Versión final:** el cálculo pasa al sombreado de vértice. El plano del suelo tiene un vértice cada 1,9 m, más fino que la fusión de 12 m entre sectores.
- **Resultado sobre E2:** mediana de **+0,5 ms**, con un máximo de +1,6 ms en la encrucijada, donde se cruzan muchos caminos. La variación entre rondas es de unos ±0,5 ms.
- **Geometría:** de 27 a 28 mallas fusionadas (empedrado antiguo) y +0,3 % de triángulos. Los obstáculos no cambian (864).

## Verificación

- **Pruebas rápidas:** 356 de 356 correctas. La prueba nueva comprueba que cada sector tenga un carácter de suelo válido y que la nueva decoración no añada obstáculos. [Mundo, piezas, expansión, encaje, exploración y rutas](evidencias/e3-1/pruebas.txt): 37 de 37.
- **Auditoría de la zona de la puerta** (`audits/e24-gate-zone.ts`): resultados idénticos a E2.4 en cámara y hordas. [Resultado](evidencias/e3-1/zona-puerta.json).
- **Simulaciones completas** (`npm run test:sim`): **26 de 26 correctas**, con cifras idénticas a las de E2.4. E3.1 solo cambia superficies y decoración plana, sin obstáculos nuevos. [Resultados](evidencias/e3-1/simulaciones.txt).
- **Lint**, **typecheck** y **build** correctos. [Compilación](evidencias/e3-1/compilacion.txt).

## Límites

- El suelo sigue plano. Los taludes y desniveles corresponden a **E3.2**, y la hierba, los arbustos y los árboles por grupos, a **E3.3**.
- La transición entre sectores es una fusión rectangular de 12 m: en las esquinas de los sectores puede leerse como una banda recta si se mira desde arriba.
- No se recorrió la partida real en el navegador (panel oculto). Teléfono físico sin probar.

## Reproducción

Desde `game`: `npm test`, `npm run test:sim`, `node --experimental-strip-types audits/e24-gate-zone.ts` y `npm run build`. Encuadres de sector y medición de render con la herramienta temporal de `m/work/e2-1-revision/`, ahora con 24 encuadres, fuera del repositorio.

**Siguiente: E3.2 — Relieve y límites naturales.** Taludes, rocas y desniveles visuales, sin alterar la superficie de combate.

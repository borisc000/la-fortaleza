# E3.2 — Relieve y límites naturales

Entregada el **18 de noviembre de 2026**, sobre la aplicación **0.2.15** y las superficies de [E3.1](VERIFICACION_E3_1.md). Añade relieve visual sin tocar la superficie de combate:
- taludes que cierran el claro por el oeste, el este y el sur;
- rocas sobre esos taludes;
- doce afloramientos rocosos dentro del mapa.

El suelo donde se camina y se combate sigue plano. No cambia reglas, rutas, sectores, cámara ni recuentos del plan.

## Taludes

- **Altura y forma:** a partir de 1,5 m fuera de las vallas, el terreno sube entre 3,5 y 7 m en unos 11 m, con altura variable a lo largo del borde, y enlaza con las colinas lejanas de antes. El claro ya no termina en una valla sobre la llanura: termina al pie de una ladera.
- **Malla del suelo:** mantiene su rejilla de 4 m (los mismos vértices que antes dentro del claro) y pasa a 1 m en las franjas de 20 m de los taludes, para que la pendiente no se vea en facetas.
- **Lo que hay sobre ellos:** el bosque exterior se apoya en el talud, como ya hacía con las colinas. Sobre él hay grupos de rocas medio enterradas cada 9–16 m.
- **Freno de la cámara:** la cámara no choca con el terreno. Para que no se meta en la ladera, cientos de cajas escalonadas bajo el talud (2 m de fondo por 20 m de largo, con la altura máxima de su tramo) y las rocas del talud la frenan solo a ella. Están fuera del claro y quedan excluidas de movimiento, navegación y apariciones. Al mirar hacia fuera desde el borde, la cámara se acerca como ya hacía contra la muralla.

## Afloramientos

- **Dónde:** doce grupos de rocas en terreno muerto dentro del mapa:
  - a más de 9 m de cualquier ruta, claro de combate, llegada, captura o mercader;
  - a más de 6 m de los árboles con colisión y a más de 5 m de cualquier otro sólido;
  - a más de 26 m de las esquinas donde se prueban las apariciones;
  - a más de 30 m entre sí.
- **Composición:** una roca grande (1,6–2,7 m), dos a cuatro medianas y piedras sueltas. Las grandes y medianas colisionan con cajas desde el suelo; las piedras sueltas, no.
- **Aleatoriedad:** tienen su propia serie de números aleatorios, así que ajustar las rocas del talud no los mueve.
- **Primera versión corregida:** uno cayó en un rincón de la abadía en ruinas, pegado a sus muros. De ahí la regla de los 5 m a otros sólidos.

**Material de roca:** la textura de mampostería, más clara y en facetas. Lleva un desgaste propio (`ROCK_WEATHERING` en `weathering.ts`): liquen en lo alto y una franja húmeda corta, para que las rocas no queden verdes enteras. La textura se proyecta según la orientación de cada cara, como en `box()`; en la primera versión se estiraba sobre las caras inclinadas.

## Revisión visual

A la izquierda, E3.1; a la derecha, E3.2:

[Talud oeste](evidencias/e3-2/talud-oeste.jpg) · [Talud sur](evidencias/e3-2/talud-sur.jpg) · [Talud este](evidencias/e3-2/talud-este.jpg) · [Cámara en el borde](evidencias/e3-2/borde-camara.jpg) · [Afloramiento en los campos](evidencias/e3-2/afloramiento-oeste.jpg) · [Afloramiento central](evidencias/e3-2/afloramiento-centro.jpg) · [Afloramiento junto a la abadía](evidencias/e3-2/afloramiento-abadia.jpg) · [Campos del asedio](evidencias/e3-2/b-campos.jpg) · [Llegada](evidencias/e3-2/a-llegada.jpg) · [Vista lejana](evidencias/e3-2/lejana.jpg)

- **Taludes:** con las rocas encima cierran el horizonte cercano por los tres lados, y el bosque exterior queda por encima del claro.
- **Afloramientos:** se leen como peñas a la altura del personaje, sin tapar caminos ni claros.
- **Cámara:** con la cámara baja mirando hacia fuera desde la valla, se para dentro del talud y el personaje sigue visible detrás de la valla. En E3.1 quedaba en el campo exterior, al otro lado de un árbol.

## Verificación

- **Prueba nueva E3.2** en `tests/world.test.ts`:
  - el claro sigue plano y el talud supera los 3 m a 12 m de la valla;
  - mirando hacia fuera desde 53 posiciones de borde, con cuatro inclinaciones (incluida la mínima), dos distancias y tres giros, la cámara nunca queda bajo el terreno (más de 200 casos sobre el talud);
  - ningún sólido de movimiento queda más allá de las vallas oeste, este y sur;
  - los afloramientos guardan distancia a rutas y claros.
- **Pruebas rápidas:** 357 de 357 correctas, incluidas las de expansión, apariciones y encaje funcional con los nuevos obstáculos. [Mundo, piezas, expansión, encaje, exploración, rutas y cámara](evidencias/e3-2/pruebas.txt): 46 de 46.
- **Simulaciones completas** (`npm run test:sim`): **26 de 26 correctas**, con victoria ante el jefe en las 14 campañas de seis minutos. Ocho campañas cambian ligeramente respecto a E3.1 (entre −23 y +10 bajas, picos de 79–94 enemigos), porque los afloramientos alteran apariciones y rutas de la horda. [Resultados](evidencias/e3-2/simulaciones.txt).
- **Lint**, **typecheck** y **build** correctos. [Compilación](evidencias/e3-2/compilacion.txt).
- **Obstáculos:**
  - de movimiento, de 641 a 688 (los afloramientos);
  - solo de cámara, 512 nuevos (cajas del talud y rocas del talud);
  - en total, de 864 a 1.423.
- **Coste de render** (método de E2.4, 14 encuadres, CPU libre; [render.json](evidencias/e3-2/render.json)):
  - mediana de **+0,6 ms** por fotograma sobre E3.1, con un máximo de +1,0 ms;
  - +2 llamadas de dibujo, por el material de roca;
  - unos 48.000 triángulos más por fotograma, sombras incluidas, sobre todo por la rejilla de 1 m de los taludes.

  Una primera medición con las simulaciones en marcha dio tiempos 2–3 ms más altos en ambos mundos y se descartó.

## Límites

- El relieve no es transitable: el claro sigue plano. Un desnivel por el que se pueda caminar exigiría resolver antes el movimiento, la colisión y la cámara sobre terreno, como pide el plan.
- **Colisión aproximada:** las rocas colisionan con su caja envolvente, que en las esquinas sobresale algo de la roca visible. Para la horda equivale a rodear un poco más.
- **Copas de los pinos:** siguen sin frenar la cámara. No es nuevo, pero los encuadres cerca del bosque lo muestran.
- No se recorrió la partida real en el navegador (panel oculto). Teléfono físico sin probar.

## Reproducción

Desde `game`: `node --experimental-strip-types --test tests/world.test.ts`, `npm test`, `npm run test:sim` y `npm run build`. Encuadres y medición de render con la herramienta temporal de `m/work/e2-1-revision/`, fuera del repositorio.

**Siguiente: E3.3 — Vegetación.** Hierba, arbustos y árboles por grupos y según el terreno, sin cerrar rutas ni tapar amenazas.

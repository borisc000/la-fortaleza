# Acabado del exterior — criterios de la zona de referencia E2

Definido el 18 de noviembre de 2026 al cerrar E2.4. Recoge lo que E2.1–E2.4 dejaron fijado en la puerta, sus torres y la explanada para extenderlo en E3–E4. El usuario dio paso a extenderlo (E3.1, 18 de noviembre); las decisiones de la puerta siguen abiertas a revisión.

Referencias: [plan del escenario](PLAN_DOMINIOS_EXTERIORES.md), verificaciones [E2.1](../verificaciones/VERIFICACION_E2_1.md), [E2.2](../verificaciones/VERIFICACION_E2_2.md), [E2.3](../verificaciones/VERIFICACION_E2_3.md) y [E2.4](../verificaciones/VERIFICACION_E2_4.md), y el concepto [Puerta de hierro](../../arte/01-puerta-de-hierro.png).

## Escala

- **Personajes:** héroe de 1,86 m. Las piezas se revisan con las tres clases y con una horda delante.
- **Vanos de paso:** unas tres veces la altura del héroe. La puerta mide 4,4 × 5,5 m y su arco arranca a 3,3 m, por encima de las cabezas.
- **Torres principales:** más del doble de altas que el lienzo que flanquean (14,3 m de almenas frente a 7,6–8,6 m), adelantadas para que la entrada se lea desde lejos.
- **Remates:** albardillas de 0,12 m y matacanes de 0,6 m. Por debajo de unos 0,1 m, un detalle no se lee desde la cámara de juego de 9–12 m.

## Materiales

- **Piedra:** textura de mampostería con color 0xcac9c3 y relieve de juntas 0,9. Las piezas de remate son algo más oscuras (0xa9a89d). La piedra del recinto interior es más fría (0x8f9291) para separarla de la muralla.
- **Madera:** tablas grises y viejas (0xb3a797). Lo quemado se marca con un tono oscuro, nunca negro puro.
- **Hierro:** oscuro y poco brillante (metalicidad 0,75), con manchas de óxido que no lo vuelven naranja.
- **Desgaste** (`weathering.ts`): variación en grande, humedad y musgo hasta 1,5 m, suciedad en caras superiores, regueros y hollín sobre fuentes de fuego. Se ajusta con los parámetros de `STONE_WEATHERING`, `WOOD_WEATHERING` e `IRON_WEATHERING`, sin texturas nuevas.
- **Suelo** (`wearGround`): bordes de camino gastados hasta un 42 % de su media anchura, segunda muestra girada de la textura para ocultar la repetición y cintas claras oscurecidas para asentarlas en el barro. Desde E3.1 cubre todo el mapa, con un carácter por sector (`SECTOR_SURFACES`: humedad, musgo, luz y roderas) calculado por vértice.
- **Agua:** charcos de color 0x48524f, rugosidad 0,04 y metalicidad 0,3, con borde de barro mojado. Más oscuros, se leen como agujeros vistos desde arriba.

## Relieve (E3.2)

- **Taludes:** el claro es plano y lo cierran taludes de 3,5–7 m que empiezan 1,5 m fuera de las vallas. Las rocas del talud quedan medio enterradas.
- **Cámara y terreno:** la cámara no choca con el terreno. Todo relieve al alcance de la cámara (18 m desde el borde) necesita cajas solo de cámara (`cameraOnly`), con la altura máxima de su tramo, que nunca entran en movimiento.
- **Afloramientos:** peñas de 1,6–2,7 m en terreno muerto, a 9 m de rutas y claros y a 5 m de otros sólidos. Colisionan las rocas grandes y medianas; las piedras sueltas no.

## Densidad y colisión

- **Solo colisiona lo que alguien rodearía:** el ariete, un barril entero, las torres y el pie de una escala. Lo plano o fino (charcos, flechas, escudos, estacas derribadas, telas, ruedas sueltas, duelas, malezas) no colisiona, para no enganchar a la horda.
- **Colisiones bajas:** las cajas de colisión de objetos bajos no superan 0,7 m. Así la cámara pasa por encima; con 1,2 m, el pie de la escala la acercaba a 0,18 m.
- **Siempre libres:** caminos con su anchura completa, la ronda, los claros de combate (círculos de `LANDMARKS`) y las posiciones del primer encuentro. Lo comprueba la prueba E2.3.
- **Restos del asedio:** agrupados donde cuentan algo, como el ariete apuntando a la puerta, las flechas inclinadas hacia las almenas o la escala contra el lienzo. Unos diez grupos en una franja de unos 50 × 20 m ante la muralla; no se reparten por todo el terreno.
- **Vegetación:** malezas al pie de muros y torres, matas en los bordes gastados y zarzas en los rincones. Se reparten con su propia serie de números aleatorios para no alterar la hierba del resto del mapa.

## Lectura

- **Silueta antes que textura:** se prefieren daños con forma propia (almenas partidas, piedras caídas, tablas arrancadas, telas rasgadas) a grietas o sillares pintados.
- **Contraste con la horda:** con 100 enemigos delante, el suelo más oscuro y variado los recorta mejor que el beige uniforme de E1. Nada del suelo debe parecerse a un aviso de ataque: sin círculos rojos ni naranjas en el decorado.
- **Luz:** las antorchas de la puerta marcan la boca y ennegrecen la piedra encima. Sus llamas siguen siendo esferas estiradas; mejorarlas queda para la fase 4.

## Coste

- **Presupuesto medido** (GPU integrada, 1440 × 900): el acabado añade una mediana de **+1,4 ms por fotograma** sin horda respecto a E1. Con 100 enemigos, la horda domina el coste.
- **Reglas del sombreado:** el ruido por píxel solo se calcula donde se ve (banda húmeda, caras superiores, hierro, zona de muestra, bordes de cinta). Se prefiere reutilizar un campo de ruido a añadir otro. Cualquier efecto nuevo se mide con el método de E2.4 antes de aceptarlo.
- **Geometría:** todo lo estático se fusiona por material. E2 añadió 5 mallas fusionadas (de 22 a 27), 8 obstáculos y un 4 % de triángulos por fotograma.

## Piezas reutilizables

`src/rendering/exterior-pieces.ts` construye las mismas piezas para el mundo (fusionadas y con colisión) y para el laboratorio (como grupo inspeccionable):

- `createPieceMaterials` (materiales de E2.2), `createKit` (cajas, cilindros, tambores de mampostería y colisión redonda) y `pieceGroup` (para el laboratorio).
- `buildGate` (puerta y torres) y `GATE` (sus medidas).
- `buildRam`, `buildBarrel`, `buildLadder`, `buildArrow`, `buildShield`, `buildCampfire` y `buildStake`.

En el laboratorio, «Puerta y torres» y «Restos del asedio» están en la categoría Escenario. E4.4 puede usar estas piezas para la versión reparada del tercer escenario.

## Al extender el acabado (E3–E4)

1. Ampliar la zona de muestra de `wearGround` o sustituirla por zonas por sector, y revisar con los mismos encuadres.
2. Pasar muros y torres restantes a `exterior-pieces.ts` antes de detallarlos, comprobando con una huella de geometría que no cambia nada.
3. Medir el coste con el método de E2.4 en cada paso y repetir la auditoría `audits/e24-gate-zone.ts` en la zona que cambie.

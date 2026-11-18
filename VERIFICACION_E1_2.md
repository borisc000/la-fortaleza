# E1.2 — Rutas, claros y seis sectores

11 de noviembre de 2026 · Aplicación 0.2.14 · E1.2 completada.

## Distribución implementada

El plano E0 se convierte en una distribución jugable dentro de los límites de 280 × 260 m. Los quince hitos secundarios se trasladan a sus coordenadas de diseño, con círculos libres de 24–36 m de diámetro en el exterior; los espacios próximos a la puerta y la torre antigua conservan dimensiones más pequeñas. La llegada sigue en (20, 205).

| Sector | Organización espacial |
| --- | --- |
| Llegada y caravanas | Franja sur, carretas en los márgenes, entrada al eje principal y bifurcación hacia ambos circuitos. |
| Campos del asedio y molinos | Poniente abierto, molino reconocible desde los campos, tramos de empalizada separados y desvío por la pradera. |
| Abadía y encrucijada | Ruina al norte del acceso oeste y claro central que conecta con el bosque. |
| Bosque y atalaya | Masas de árboles al este, claros amplios, torre fuera del espacio de combate y salida hacia la muralla. |
| Campamentos del cerco | Tiendas y ruinas a los lados del camino, con salidas abiertas. |
| Explanada y fortaleza | Puerta y muralla como referencia final del eje principal. |

`game/src/content/terrain-layout.ts` reúne los territorios y siete rutas. Los sectores tienen límites espaciales explícitos; los rótulos siguen mostrando el nombre del hito al acercarse y el sector en los espacios intermedios. La llegada conserva su rótulo específico.

La geometría usa las mismas muestras de camino para dibujar el suelo y mantener alejados árboles, piedras dispersas y claros. Los cambios de dirección se redondean sin salirse del trazado de control. El camino principal tiene 9 m de ancho; los circuitos laterales, 8 m; conexiones secundarias, 5–6 m. La ronda de la muralla incorpora una curva adicional para evitar la base de la torre existente.

Se retiró la red repetida de adoquines y los pares de escombros idénticos alrededor de cada hito. Piedra en el eje principal, tierra en los circuitos y variación moderada del suelo en los claros. Abadía, molino, atalaya y campamentos se colocan fuera de los pasos y círculos de combate. Carretas y líneas de asedio son referencias de volumen, sin recompensas adicionales.

Es una entrega de distribución con geometría sencilla. Los edificios, árboles y transiciones del terreno siguen siendo provisionales; el acabado artístico corresponde a E2–E4. Se reutilizan materiales y fábricas existentes; no se añaden recursos externos. Escala de personajes, cámara, reglas de combate, economía y población máxima se conservan.

## Comprobaciones

**35 pruebas dirigidas correctas**, TypeScript y compilación de juego y laboratorio correctos. Se mantiene el aviso conocido de bundle mayor de 500 kB.

- 4.212 muestras del centro y laterales de los siete caminos, comprobadas contra colisiones reales con radio de personaje. Recorrido físico de cada ruta con el movimiento del juego, sin depender únicamente de la conectividad del navegador.
- Quince hitos accesibles, claros comprobados, 342 apariciones seguras de enemigos normales/élite/jefe en hitos y bordes.
- Llegada de las tres clases y colocación reproducible de 33 objetos en las semillas comprobadas. Cofres, fuentes, monedas, tienda y captura siguen disponibles.
- Expedición simulada que captura el puesto y llega caminando al mercader para comprar; cámara, persecución entre ruinas y encuentro de cinco soldados correctos.

| Recorrido | Tiempo medido a 5 m/s, sin combate |
| --- | ---: |
| Eje llegada–explanada | 43,30 s |
| Desvío oeste entre cruces principales | 62,40 s |
| Desvío este entre cruces principales | 60,30 s |
| Paso de poniente | 22,20 s |
| Travesía de la abadía | 24,65 s |
| Paso de las ruinas | 18,65 s |
| Ronda de la muralla | 17,50 s |

Los tiempos laterales corresponden al desvío, no a una vuelta cerrada completa: el circuito se cierra regresando por el eje principal. Las mediciones usan pasos de 0,05 s y tolerancia de 0,15 m por muestra. No son tiempos de una partida con enemigos.

Resultados: [pruebas espaciales y actividades](e1-2/spatial-tests.txt), [mundo y cámara](e1-2/world-tests.txt), [compilación](e1-2/build.txt), [comprobación de partida en navegador](e1-2/browser.txt).

Para repetir desde `game`:

```powershell
npm.cmd run build
node --experimental-strip-types --test tests/routes.test.ts tests/expansion.test.ts tests/exploration.test.ts tests/arrival.test.ts tests/activities.test.ts
node --experimental-strip-types --test --test-name-pattern 'the actual fortress|walking from every spawn|five-soldier encounter|a pursuer|reinforcements have' tests/world.test.ts
```

## Revisión visual

Chrome local, cámara de juego a 12 m. Revisadas llegada, campos, molino, abadía, bosque, campamento, puerta y vista general del laboratorio. La auditoría cargó los recursos de escena sin fallos; conserva el aviso 404 conocido del favicon. Ajustados contraste del suelo y arbolado occidental tras revisar las capturas.

- [Llegada](game/output/playwright/e12-arrival.png), [campos y molino](game/output/playwright/e12-field.png).
- [Abadía](game/output/playwright/e12-abbey.png), [bosque](game/output/playwright/e12-wood.png), [campamento](game/output/playwright/e12-camp.png).
- [Conjunto en laboratorio](game/output/playwright/e12-overview.png), [inicio en partida](game/output/playwright/e12-game.png).

No se repitieron las campañas completas con jefe de E1.1: esta entrega valida distribución, recorrido, colocación y controles con comprobaciones dirigidas. La revisión consolidada de combate con tres clases y la comparación de rendimiento quedan en E1.4. No se atribuye verificación en teléfono físico ni un nuevo resultado de FPS.

## Siguiente entrega

**E1.3 — Encaje funcional.** Revisar sistemáticamente aparición local y ocupación de los nuevos claros, distribución/discovery de actividades, navegación y cámara alrededor de construcciones. Los anclajes actuales son referencias funcionales; E1.3 debe resolver ajustes de acceso y lectura antes del recorrido consolidado E1.4.

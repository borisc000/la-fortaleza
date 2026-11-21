# Verificación de El corazón de piedra

Prototipo jugable integrado al selector de expediciones el 20 de noviembre de 2026. [Planta y reglas](../diseno/EL_CORAZON_DE_PIEDRA.md).

## Partidas simuladas con vida normal

Las tres partidas usan la misma geometría de colisión que el escenario, movimiento de juego y selecciones válidas de mejoras. Todas recorren el patio y el salón, eliminan a sus veinte enemigos y encienden la almenara. La semilla de referencia es 19 y el pico de enemigos vivos es siete.

| Clase | Segundos de partida | Vida restante | Cofre de la armería |
|---|---:|---:|---|
| Guerrero | 78,5 | 40 | Abierto |
| Mago | 61,6 | 76 | Abierto |
| Arquero | 49,5 | 68 | Ruta directa |

Se comprobó que el rastrillo separa el salón al inicio, que la almenara solo se puede encender tras recuperar el salón y que las fases se recorren en orden. Se muestrearon 288 combinaciones de cámara en ocho puntos del portón, patio, armería, pasaje y salón, con zoom de 4, 12 y 18 m y doce ángulos por punto. Se comprobó la colisión del rastrillo cerrado, su apertura y su restablecimiento. Las cinco pruebas están en [stone-heart.test.ts](../../game/tests/stone-heart.test.ts).

## Navegador

En Chromium con WebGL 2, el Mago de Fuego entró desde el selector y completó la expedición con WASD, E y los botones de mejora. Ganó en 1:02, con 20 bajas y 80 de 80 de vida tras usar los suministros. Se verificaron la apertura del rastrillo, el cofre de la armería, el combate del capitán y la acción que enciende la almenara. Desde resultados se repitió la misma etapa con la misma clase y afinidad. Tras abandonar desde pausa, se inició la etapa exterior.

En una pantalla táctil emulada de 844 × 390 se comprobó la selección de etapa, el movimiento hasta el patio, la pausa al girar a vertical y la reanudación. En la compilación servida desde `/la-fortaleza/` cargaron la imagen del salón y las tarjetas de expedición, y se entró al patio con teclado.

## Comprobaciones del proyecto

| Comando | Resultado |
|---|---|
| `npm test` | 366 pruebas correctas. |
| `npm run test:sim` | 26 simulaciones correctas del mapa exterior. Usan la resistencia ampliada del banco de pruebas. |
| `npm run lint` | Correcto, con dos advertencias existentes. |
| `npm run build` con base `/la-fortaleza/` | Compilación y tipos correctos. Vite conserva el aviso de tamaño de un paquete. |

## Capturas

- [Selector de expediciones](evidencias/corazon-de-piedra/selector.webp)
- [Combate en el patio de armas](evidencias/corazon-de-piedra/patio.webp)
- [Salón principal](evidencias/corazon-de-piedra/salon.webp)
- [Victoria al encender la almenara](evidencias/corazon-de-piedra/victoria.webp)
- [Patio con controles táctiles emulados](evidencias/corazon-de-piedra/tactil.webp)

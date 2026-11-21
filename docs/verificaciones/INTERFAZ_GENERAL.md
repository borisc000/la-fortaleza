# Interfaz general de La Fortaleza

Entrega del 20 de noviembre de 2026. La [verificación de El corazón de piedra](EL_CORAZON_DE_PIEDRA.md) recoge la activación posterior de la segunda tarjeta.

## Flujo de campaña

**Inicio → Expediciones → Clase y afinidad → Partida → Resultados.** Los dominios exteriores abre la partida del exterior. El corazón de piedra y La primera bandera muestran su objetivo y el estado «En desarrollo». La preparación muestra los retratos de los modelos del juego y las estadísticas de cada clase. El Mago puede iniciar con Fuego, Agua, Tierra o Aire. Guerrero y Arquero eligen el elemento al nivel 2.

**Pausa y resultados** permiten continuar cuando corresponde, repetir con la misma clase y afinidad inicial, preparar otra clase o volver al inicio. La pausa pide confirmación antes de descartar la partida. En pausa, mercader y resultados se puede desplazar el contenido con las acciones a la vista.

**Ayuda y ajustes** se abren desde inicio y pausa. Los ajustes de imagen, HUD, cámara, efectos y sonido se guardan en el navegador y se pueden restaurar. El HUD muestra una indicación de aprendizaje a la vez. Los botones para centrar, girar y volver a capturar el ratón están en el desplegable Cámara.

Los menús se pueden usar en vertical. En móvil, la expedición se inicia en horizontal y se pausa al girar a vertical durante el juego.

## Verificación

| Comprobación | Resultado |
|---|---|
| `npm test` | 361 pruebas correctas. |
| `npm run lint` y `npm run build` | Correctos. Biome informa de dos advertencias existentes en pruebas y Vite conserva el aviso de tamaño de un paquete. |
| Chromium con WebGL 2, escritorio | Navegación de campaña, tres clases, afinidad del Mago, ajustes al recargar y restaurar, movimiento con WASD, pausa, confirmaciones y reinicio. |
| Interacciones de partida | Se abrió el cofre con E, se eligieron las monedas, se compró al mercader y se comprobó salir con Esc y con el botón de continuación. Para reproducir la prueba se situó al héroe junto a ambas interacciones y se preparó el saldo. |
| Resultados y teclado | Se indujeron victoria y derrota para comprobar el resumen, el orden de foco y las acciones de repetir, cambiar clase y volver al inicio. |
| Compilación alojada en `/la-fortaleza/` | La interfaz, los retratos y el escenario cargan con la ruta base que utiliza GitHub Pages. |
| Pantallas táctiles emuladas | Menús a 390 × 844, preparación y juego a 844 × 390, desplazamiento con el joystick virtual, pausa al girar y reanudación explícita. |

## Capturas

- [Inicio](evidencias/interfaz/inicio.webp)
- [Expediciones](evidencias/interfaz/expediciones.webp)
- [Preparación del Mago](evidencias/interfaz/preparacion.webp)
- [Ajustes](evidencias/interfaz/ajustes.webp)
- [Mercader](evidencias/interfaz/mercader.webp)
- [Resultados](evidencias/interfaz/resultados.webp)
- [Preparación en móvil horizontal](evidencias/interfaz/movil.webp)

# Subfase 1.9.2 — Recogibles e interacción

Fecha: **2026-10-31**. Aplicación **0.1.14**. Implementación disponible localmente; revisión visual interactiva del agente, GPU y teléfono pendientes.

## Contenido y reglas

- **Moneda temporal de expedición**, separada de esencia. Se reinicia al empezar otra partida; el resultado muestra saldo, cofres abiertos y usos de fuente. No se añade moneda persistente, tienda ni captura en esta entrega.
- Distribución inicial nominal de **25 objetos**: ocho cofres, cuatro fuentes, siete grupos de monedas y seis suministros. Primer cofre, monedas y suministro cerca del inicio. Posiciones y cantidad de moneda de cofres reproducibles por semilla; secuencia aleatoria independiente de las oleadas.
- Emplazamientos separados al menos 3 m, libres de sólidos y conectados al inicio con radio del jugador. Si falla la búsqueda inicial, se amplía el área de búsqueda sin relajar seguridad; se omite un emplazamiento sin candidato válido. Las tres semillas verificadas producen los 25 objetos completos.
- Monedas y suministros se recogen a **1,6 m**, con acceso libre y sin atravesar paredes. Cada grupo inicial vale tres monedas. Un suministro cura hasta **20 puntos**, se conserva con vida llena y no revive tras una muerte.
- Cada enemigo normal muerto realmente deja **una moneda recogible**. Se agrupan monedas situadas a menos de un metro, sin moverlas a través de obstáculos. Una muerte no se acredita dos veces; retirar enemigos lejanos no genera recompensa.
- Cofres y fuentes: **E en PC o botón contextual**, a un máximo de **2,6 m** y con acceso libre. El cofre entrega **8–14 monedas una sola vez**. Cada fuente tiene **dos usos de hasta 35 puntos de curación** y no consume usos con vida llena.
- Acciones instantáneas con estados disponible/usado: no abren menús ni pausan el combate. El combate sigue automático y la cámara conserva sus controles vigentes. La pulsación mantenida de E no encadena usos; la pausa o elección descarta la acción pendiente y exige soltar la tecla.
- Botón táctil independiente: pulsarlo no limpia el joystick ni el puntero de cámara. Los demás controles de interfaz mantienen su comportamiento anterior.
- Descubrimiento a **24 m** con línea libre; se recuerda durante la partida. HUD con saldo y hasta tres puntos descubiertos a menos de **45 m**, distancia y dirección relativa a cámara. Prioridad a puntos disponibles; usados llevan texto y marca de completado.
- Representación provisional propia: cofre con tapa que se abre, fuente cuyo agua desaparece al agotarse, monedas y paquetes de curación. Los objetos bajos no añaden obstáculos físicos a las rutas. Las indicaciones distinguen función y estado sin depender solo del color.
- Al perder o ganar, los premios se detienen; al reiniciar se limpian saldo, consumos, descubrimientos, mensajes, objetos y acciones de entrada. Las elecciones de nivel congelan interacciones y recogida; un golpe mortal se resuelve antes que curación o recompensa.

## Comprobaciones

- **117/117 pruebas correctas**, incluidas once nuevas sobre interacción, recompensas y controles. Campaña Fuego: maestría y victoria a 414,63 s, 191 bajas, nivel 13 y pico 11 enemigos; Agua: 417,32 s, 177 bajas, nivel 13 y pico 12. Vida ampliada solo en tests para aislar reglas, sin validación de dificultad humana.

- Pruebas específicas de moneda/curación, vida llena, paredes, cofres únicos, fuentes agotadas, radio, prioridad estable, muerte/recompensa única, retirada sin premio, descubrimiento, pausa, golpe mortal y reinicio.
- Colocación sobre la geometría real con semillas **1, 19 y 77**: 25 objetos por semilla, ocho cofres y cuatro fuentes; separación, colisiones y navegación comprobadas. Integración de recogida y apertura a través de `Run.step`.
- Prueba de entrada con DOM simulado: E una vez por pulsación, descarte al pausar, exclusión de menús y pulsación táctil conservando movimiento y giro independientes. No equivale a una prueba física de navegador o teléfono.
- Prueba de representación con Three.js sin GPU: tapa abierta, agua agotada, retirada de recogibles, reinicio y liberación de recursos.
- Se detectó un recogible omitido por quedar demasiado cerca de un cofre en una semilla. Corregido mediante búsqueda secundaria más amplia, manteniendo distancia, colisión y acceso.
- TypeScript y build correctos; continúa la advertencia de bundle JS >500 kB. Servidor local HTTP 200 con versión 0.1.14, HUD y módulo de exploración nuevos. Sin publicación externa.

## Límites y siguiente entrega

Consulta nueva de acceso: **“Local browser use is disabled in Work settings”**. No se eludió el ajuste ni se inventaron capturas, FPS o validación visual. Quedan revisión visual interactiva, legibilidad real del HUD, gesto táctil físico y balance de curaciones/economía; las pruebas automáticas acreditan reglas e integración.

**Siguiente: 1.9.3**, primera captura territorial y tienda con moneda de expedición. Los cofres actuales entregan moneda, sin anticipar técnicas/reliquias aún no implementadas.

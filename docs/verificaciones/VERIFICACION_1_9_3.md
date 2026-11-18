# Verificación 1.9.3 — Captura y tienda de expedición

Fecha: **2026-10-31** · Aplicación **0.1.15** · Siguiente: **1.10**.

## Entrega

Un puesto capturable y un mercader se suman a los 25 objetos iniciales de exploración. Se conservan el mapa de 212 × 192 m, las hordas locales, cámara por movimiento de ratón, combate automático, seis minutos más jefe y configuraciones de Fuego/Agua. Los dos destinos nuevos usan emplazamientos transitables con variación por semilla y el descubrimiento existente. No añaden una colisión física al decorado provisional.

La captura comienza al entrar en el círculo de 6 m: aviso de 3 s y 25 s de permanencia para recibir 25 monedas una sola vez. Salir conserva el avance y suspende su presión adicional. Mientras se mantiene activa solicita hasta tres refuerzos cada seis segundos mediante el director existente, sujeto a posiciones seguras y comprobaciones periódicas; no crea una segunda horda ni supera el máximo de 40 enemigos vivos. Puede generar refuerzos durante el respiro de fin de minuto. A 6:00 se cierra si está incompleta; un premio conseguido se conserva. No concede núcleo ni condiciona la victoria.

El mercader se abre con E/botón contextual, a 2,6 m y con línea libre. Pausa reloj, combate, proyectiles, captura y director; libera el cursor. Continuar expedición reanuda explícitamente; Esc cierra y deja la partida pausada. Cambiar de pestaña conserva el menú. No se abre ante una elección pendiente ni después de morir.

| Oferta | Efecto | Precio | Existencias por partida |
|---|---|---:|---:|
| Ungüento de campaña | Hasta 40 de vida | 8 | 2 |
| Filo templado | Un rango de daño: +10 % base | 18 | 1 |
| Vigor de hierro | Un rango de vitalidad: +20 vida máxima y curación equivalente | 18 | 1 |
| Paso firme | Un rango de velocidad: +0,5 m/s | 16 | 1 |

Las mejoras comparten sus tres rangos máximos con las subidas de nivel. Ofertas sin saldo, sin existencias o sin beneficio quedan deshabilitadas. Una revisión de menú invalida clics antiguos; reabrir no renueva stock. Reiniciar restablece saldo, captura, compras, ofertas y representación. Los resultados muestran saldo, gasto y puesto asegurado.

## Comprobaciones

- Batería completa `npm test`: **128/128 correctas**, ninguna omitida, duración aproximada de 114 s. Incluye campañas completas de Fuego y Agua con maestría y victoria, además de las once pruebas nuevas de actividades.
- Pruebas específicas de actividades y exploración: **21/21 correctas**. Incluyen aviso, progreso al salir/volver, premio único, obstáculos, cierre ante jefe, límite global, cadencia compartida, pausa de tienda, saldo, stock, rangos máximos y rechazo de acciones antiguas.
- Integración sobre geometría real: captura y desplazamiento físico hasta mercader; compra de vitalidad en **35,80 s simulados**, **41 monedas antes de comprar y 23 después**. Vida ampliada exclusivamente en la prueba para aislar el funcionamiento. No acredita dificultad humana ni rendimiento gráfico.
- Representación de mercader y puesto: cambios de estado y reutilización de geometría tras reiniciar; eliminación de objetos y recursos al disponer la vista. Son pruebas de objetos Three.js sin GPU.
- `npm run build`: **correcto**, incluido TypeScript. HTML 9,13 kB, CSS 16,78 kB y JavaScript 693,60 kB (184,80 kB gzip). Persiste el aviso conocido de paquete JavaScript mayor de 500 kB.
- Servidor local: **HTTP 200** en `http://127.0.0.1:5183/`, HTML 0.1.15 con tienda y panel de captura. No se ha publicado.
- Nueve documentos revisados sin enlaces locales rotos; 89 IDs de HTML únicos, referencias DOM de la aplicación y versiones de package/lock coherentes.

## Límites y continuación

La revisión visual interactiva del agente permanece pendiente: el acceso local al navegador figura desactivado en el último intento registrado; no se elude ese ajuste. No se acreditan pruebas de ratón físico, teléfono, legibilidad real del tenderete ni FPS/GPU con esta entrega. Personajes y objetos siguen siendo representaciones procedurales provisionales.

Duraciones, precios, posiciones e intensidad son decisiones iniciales de implementación, no cifras elegidas por el usuario. **1.10** revisará legibilidad, audio esencial, densidad, orientación, economía, dificultad y partida completa con y sin objetivos opcionales. Quedan **31 subfases** del plan de 43.

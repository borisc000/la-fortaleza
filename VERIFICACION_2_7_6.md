# Verificación 2.7.6

2026-11-04 · Aplicación 0.2.12.

## Alcance

Tipado y build de producción correctos. Vite mantiene el aviso de paquete mayor de 500 kB; no es una medición de rendimiento. 279 pruebas de regresión correctas, excluyendo deliberadamente las campañas largas de world.test.ts. No se presentan las campañas históricas con vida ampliada como evidencia de supervivencia actual.

La batería balance.test.ts añade tres comprobaciones de curva/elecciones, economía/suministros y números de daño, más doce recorridos de supervivencia con vida normal. Comprueba premios únicos, cuatro suministros de combate como máximo y 12 de curación por suministro.

Los doce recorridos usan semilla 19, arena 70 × 80 sin obstáculos, dirección de hordas real, élite y jefe. El bot recoge esencia y curación, puede comprar curación con monedas ganadas y elegir vitalidad; no se aumenta artificialmente la vida. Dos políticas: intentar conservar dos habilidades o intentar llenar cuatro. Una derrota temprana puede impedir llenar espacios. Las pruebas exigen estados válidos y detener la simulación al terminar; aprobar no significa ganar.

## Revisión visual

Navegador local sobre el mapa real: Mago Fuego, primera mejora con Orbes custodios como opción, elección y ejecución de una segunda habilidad. A los 16 segundos: nivel 2, 14/24 esencia, 20 bajas, 48/80 vida. Sin errores de consola observados. Captura: ../../work/balance-2-7-6.png. El navegador integrado rechazó capturar el ratón; se comprobó el modo alternativo de movimiento sin arrastrar, no pointer lock.

La captura antecede al último ajuste de ponderación y contador de afinidad; ese ajuste de reglas está cubierto por pruebas, no por una nueva sesión visual. El servidor local permanece en el puerto 5183.

## Límites y pendientes

No se certifica equilibrio entre todas las configuraciones: una política automática concreta no equivale a habilidad humana. Tampoco se repitió una campaña completa por la fortaleza con obstáculos, ni captura bajo presión máxima con vida normal. La regresión de captura y mercader sí está incluida. No se midió nuevamente GPU ni teléfono físico, ni se certifica legibilidad de cuatro habilidades en el pico de 100 enemigos. Revisión humana prolongada y consolidación en 2.9/fase 4.

## Resultados finales reproducibles

294 pruebas correctas: 279 de regresión + 15 de balance (incluyen doce recorridos). Logs en `../../work/tests-2-7-6-final.log`, `../../work/balance-2-7-6-final.log` y `../../work/build-2-7-6.log`.

Los recorridos terminaron en 4 victorias y 8 derrotas. Son resultados de esta semilla y política, no tasas estimadas de victoria.

| Clase | Elemento | Objetivo espacios | Resultado | Segundos | Nivel | Intervalo medio elecciones | Monedas restantes | Pico enemigos |
|---|---|---|---|---:|---:|---:|---:|---:|
| warrior | fire | 2 | defeat | 104.5 | 6 | 20.9 s | 21 | 36 |
| warrior | fire | 4 | defeat | 123.6 | 7 | 20.9 s | 30 | 36 |
| warrior | earth | 2 | victory | 443.5 | 13 | 32.2 s | 67 | 93 |
| warrior | earth | 4 | victory | 424.6 | 13 | 29.0 s | 77 | 92 |
| mage | fire | 2 | defeat | 315.9 | 11 | 33.6 s | 29 | 93 |
| mage | fire | 4 | victory | 410.4 | 15 | 30.2 s | 110 | 95 |
| mage | water | 2 | defeat | 261.7 | 10 | 28.9 s | 51 | 81 |
| mage | water | 4 | defeat | 304.5 | 11 | 29.5 s | 35 | 94 |
| archer | fire | 2 | defeat | 102.0 | 5 | 26.1 s | 15 | 40 |
| archer | fire | 4 | defeat | 244.8 | 8 | 34.7 s | 28 | 62 |
| archer | air | 2 | victory | 458.0 | 13 | 38.9 s | 84 | 95 |
| archer | air | 4 | defeat | 239.9 | 9 | 29.6 s | 38 | 62 |

El intervalo excluye maestrías/reliquias y mide tiempo simulado entre elecciones, no duración de los menús. El objetivo de 30–45 segundos no es una garantía; algunas configuraciones suben antes. Las muertes tempranas con Fuego y las diferencias entre builds requieren seguimiento humano y más semillas al consolidar el balance.

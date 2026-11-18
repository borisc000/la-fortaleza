# Verificación 2.7.3b — aplicación 0.2.9

Fecha: 2026-11-02.

## Comprobado

- `npm run build`: typecheck y compilación correctos. Advertencia de Vite por paquete de aproximadamente 785 kB sin comprimir; no equivale a una medición de FPS.
- 247/247 pruebas fuera de `world.test.ts`, incluidas doce específicas del arsenal. Registro: `../../work/tests-2-7-3b-unit.log`.
- Repertorio completo y dos trayectorias hasta nivel 10 por ataque; daño/protección finitos, cuatro espacios, ramas, compra, vitalidad, afinidades, pausa/reinicio, límites y paredes. Las pruebas recorren caminos representativos, no todas las combinaciones combinatorias posibles.
- Encuentros cortos con vida normal: victoria con cada afinidad. Cadena: daño previo a exposición y visual persistente. Guardia: recarga al romperse, una sola onda. Las campañas largas usan vida ampliada exclusivamente en la prueba para comprobar el ciclo, no el balance.
- Ruta de combate Guerrero/Fuego en mapa real: victoria a 407,92 s, 196 bajas, nivel 13, maestría, pico de 11 enemigos; jefe, núcleo, recompensas y limpieza de fin de partida. Registro: `../../work/tests-2-7-3b-campaign.log` (incluye el primer ensayo de la ruta opcional y su expectativa antigua fallida).
- Navegador Opera/PC: bienvenida 0.2.9, escena/cámara, barra de cuatro espacios, combate automático inicial, movimiento, nivel 2 con cuatro afinidades y repertorio desplegable. Sin errores en el registro de consola consultado. Captura: `../../work/guerrero-2-7-3b.png`.

## Límites

La captura automática del ratón fue rechazada en la sesión del navegador y apareció correctamente el modo alternativo sin arrastre; no se certifica pointer lock desde automatización. No se revisaron visualmente todas las mutaciones ni una partida humana completa. Sin prueba física móvil ni medición GPU. Hordas siguen con su presupuesto anterior; ampliación en 2.7.5. Experiencia, oportunidades y balance global en 2.7.6.

Las pruebas antiguas de progresión se adaptaron a cuatro rangos y ofertas que compiten con habilidades. Se conservaron las pruebas de técnicas antiguas de Mago/Arquero y las del dominio histórico del Guerrero; la expedición real del Guerrero utiliza el arsenal nuevo.

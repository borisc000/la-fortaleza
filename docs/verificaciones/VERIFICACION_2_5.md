# Verificación 2.5 — Afinidades de las tres clases

Fecha: 2026-11-01 · Aplicación 0.2.5.

## Alcance

Doce combinaciones seleccionables, Tierra/Aire del Mago y Arquero, cuatro primeras maestrías adicionales, HUD y representación. Reglas en [AFINIDADES_2_5.md](../diseno/AFINIDADES_2_5.md). No se implementan técnicas de 2.6 ni doble afinidad de 2.7.

## Comprobaciones automatizadas

- TypeScript sin errores; compilación de producción correcta con 63 módulos. HTML 10,39 kB, CSS 20,64 kB, JavaScript 739,40 kB (197,55 kB gzip). Persiste advertencia conocida de bloque superior a 500 kB; no equivale a rendimiento GPU medido.
- 16 pruebas nuevas de afinidades correctas: selección/mejora/núcleo para las doce combinaciones, coraza por rango y recarga, instantánea de acciones, último pulso reforzado, Quebranto, daño real contra armadura, resistencias, límites del desplazamiento, alcance/velocidad, penetración sin multiplicar Precisión, colisión de proyectiles con muros finos y representación sin GPU.
- Cuatro encuentros pequeños con vida inicial normal terminan en victoria: Mago/Tierra, Mago/Aire, Arquero/Tierra y Arquero/Aire. No prueban la dificultad de una expedición completa.
- 43 pruebas existentes de Mago, Arquero y Tierra/Aire correctas antes de la batería completa.
- Servidor de desarrollo existente: HTTP 200 en `http://127.0.0.1:5183/`, HTML de 0.2.5 y cuatro opciones de afinidad inicial. Comprobar contenido HTTP no acredita interacción ni renderizado.
- Batería completa: **213/213 pruebas correctas**, cero fallos. Registro en `../../work/tests-2-5.log`.

## Campañas sobre el mapa real

Se ejecutan catorce rutas: dos de Guerrero por combate y doce combinaciones pasando por captura/tienda. Incluyen seis minutos de oleadas, núcleo, afinidad III, maestría y victoria sobre el jefe. Todas conservan la geometría del mapa y las colisiones; verifican bajas únicas, diferentes tipos enemigos, premios y gasto de tienda.

La vida se amplía únicamente en estas pruebas para aislar las reglas. **No son una prueba de balance humano, supervivencia con vida normal, gráficos ni FPS.** Las catorce rutas terminan en victoria. Las diez rutas anteriores conservan exactamente sus tiempos, bajas, niveles, elecciones, pico de población y moneda; comparación automática con el registro 2.4. Las tres trazas de regresión del Guerrero también pasan sin regenerar referencias.

| Clase / afinidad | Ruta | Segundos simulados | Bajas | Nivel | Pico enemigos | Saldo | Gasto |
|---|---|---:|---:|---:|---:|---:|---:|
| Guerrero / Fuego | ruta de combate | 414.63 | 191 | 13 | 11 | 190 | 0 |
| Guerrero / Agua | ruta de combate | 417.32 | 177 | 13 | 12 | 172 | 0 |
| Guerrero / Fuego | con captura/tienda | 414.63 | 184 | 13 | 12 | 193 | 18 |
| Guerrero / Agua | con captura/tienda | 418.08 | 180 | 13 | 11 | 186 | 18 |
| Guerrero / Tierra | con captura/tienda | 409.98 | 188 | 13 | 14 | 197 | 18 |
| Guerrero / Aire | con captura/tienda | 418.15 | 187 | 13 | 15 | 191 | 18 |
| Mago / Fuego | con captura/tienda | 399.23 | 209 | 14 | 12 | 203 | 18 |
| Mago / Agua | con captura/tienda | 406.58 | 184 | 13 | 11 | 186 | 18 |
| Mago / Tierra | con captura/tienda | 401.45 | 190 | 13 | 11 | 187 | 18 |
| Mago / Aire | con captura/tienda | 404.75 | 196 | 13 | 11 | 176 | 18 |
| Arquero / Fuego | con captura/tienda | 411.53 | 199 | 13 | 14 | 195 | 18 |
| Arquero / Agua | con captura/tienda | 412.37 | 212 | 14 | 16 | 213 | 18 |
| Arquero / Tierra | con captura/tienda | 402.82 | 198 | 13 | 11 | 194 | 18 |
| Arquero / Aire | con captura/tienda | 412.37 | 201 | 13 | 15 | 202 | 18 |

## Comprobaciones pendientes

- Revisión interactiva de selector, HUD, distinción visual Agua/Aire, roca, puntas y remolino en la escena real.
- Escucha de sonidos y mezcla, dificultad de las doce combinaciones con vida normal y elección humana de mejoras.
- Rendimiento con GPU, legibilidad entre hordas y móvil físico horizontal.

El último estado conocido del navegador del agente es deshabilitado. No se elude ese ajuste ni se atribuyen capturas, escucha o pruebas visuales no realizadas. Las pruebas de objetos Three.js comprueban geometrías, materiales y limpieza en memoria, sin renderizar una escena.

Próximo contenido: **2.6 · Técnicas y espacios de configuración**. Plan actualizado a 5/9 entregas de fase 2 y 24 subfases futuras. Acorazado continúa aplazado.

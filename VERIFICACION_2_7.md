# Verificación 2.7 — Reliquias y doble afinidad

Fecha: 2026-11-01 · Aplicación 0.2.7.

## Alcance y comprobaciones

Reglas implementadas en [RELIQUIAS_AFINIDADES_2_7.md](RELIQUIAS_AFINIDADES_2_7.md). **246/246 pruebas únicas correctas, cero fallos**: 227 fuera de `world.test.ts` y 19 del mapa real. No se suman las ejecuciones iniciales repetidas.

- Diecisiete pruebas nuevas: catálogo de doce reliquias, requisitos, cuatro espacios, duplicados, bloqueo por pureza, rangos del apoyo, máximo de dos elementos y una maestría.
- Las 36 combinaciones ordenadas de clase/principal/apoyo se ejercitan en encuentros pequeños con vida normal. No equivalen a 36 campañas completas ni prueban balance humano.
- Daño directo único, potencia de Fuego, duración de estados, control con resistencias y obstáculos, efectos derivados sin recursión, límites de velocidad y aplicación de vida máxima una sola vez.
- Medallón con Guardia/coraza, renovación limitada por tiempo y sin resurrección; elegibilidad elemental, requisitos de pureza/concordia y configuración de acciones ya disparadas.
- Recompensas deterministas y de una sola entrega, elección pausada sin consumir nivel, monedas alternativas, inventario lleno, apertura real con E, captura, compras atómicas, stock, revisión de compra y reinicio.
- Resumen del equipo y aro secundario comprobados en memoria. Las tres trazas previas de combate del Guerrero conservan resultados exactos, sin regenerar referencias.
- `npm run build` correcto, incluido TypeScript: 69 módulos. HTML 11.18 kB, CSS 21.16 kB, JavaScript 755.04 kB (200.02 kB gzip calculado sobre el artefacto).
- HTTP 200 en `http://127.0.0.1:5183/`, versión 0.2.7 y nodos de inventario/tienda presentes. Esto no demuestra renderizado visual.

## Integración en el mapa real

Los filtros positivos dividieron `world.test.ts`: Mago/Fuego (1), Guerrero y geometría (11), restantes afinidades del Mago (3), Arquero (4). Registros en `../../work/tests-2-7-map-first.log`, `tests-2-7-warrior.log`, `tests-2-7-mage.log` y `tests-2-7-archer.log`, todos bajo `../../work/`. Batería general: `../../work/tests-2-7-unit-final.log`.

Las primeras rutas Mago/Aire, Arquero/Agua y Guerrero/Agua con actividades ganaron pero fallaron la comprobación de tres técnicas: la estrategia del test priorizaba mejorar el apoyo y había elegido solo dos. Se ajustaron esas estrategias para aprender la tercera antes de otra mejora del apoyo, sin cambiar reglas ni balance del juego. Repeticiones correctas en `../../work/tests-2-7-mage-air.log`, `tests-2-7-archer-water.log` y `tests-2-7-warrior-water.log`, bajo `../../work/`; cada caso se cuenta una sola vez en las 246 pruebas únicas. Los registros iniciales conservan los fallos y los casos que ya pasaron. Las otras rutas ejercitan la prioridad contraria de inversión.

Catorce campañas completas: dos rutas de combate puras y doce rutas con doble afinidad, tres técnicas, cuatro reliquias, dos cofres, captura, compra real, núcleo, maestría y victoria. También se comprueban navegación, aparición local, colisiones, máximos de población, muertes únicas y limpieza final.

**Estas catorce campañas amplían la vida solo en el test para aislar las reglas.** No acreditan supervivencia con vida normal ni rendimiento GPU. Las decisiones y recorridos cambian respecto a 2.6: no comparar los tiempos como si se hubiera usado la misma configuración.

| Clase / principal | Ruta | Apoyo / rango | Segundos simulados | Bajas | Nivel | Reliquias |
|---|---|---|---:|---:|---:|---:|
| Mago / Fuego | con captura/tienda | Tierra 3 | 397.10 | 207 | 14 | 4 |
| Guerrero / Fuego | ruta de combate | —  | 417.35 | 198 | 13 | 0 |
| Guerrero / Agua | ruta de combate | —  | 417.25 | 178 | 13 | 0 |
| Guerrero / Fuego | con captura/tienda | Agua 3 | 423.13 | 176 | 13 | 4 |
| Guerrero / Tierra | con captura/tienda | Aire 3 | 412.15 | 197 | 13 | 4 |
| Guerrero / Aire | con captura/tienda | Fuego 3 | 415.07 | 194 | 13 | 4 |
| Guerrero / Agua | con captura/tienda | Tierra 3 | 418.68 | 177 | 13 | 4 |
| Mago / Agua | con captura/tienda | Aire 3 | 395.78 | 221 | 14 | 4 |
| Mago / Tierra | con captura/tienda | Fuego 3 | 393.82 | 202 | 14 | 4 |
| Mago / Aire | con captura/tienda | Agua 3 | 392.25 | 215 | 14 | 4 |
| Arquero / Fuego | con captura/tienda | Agua 3 | 415.33 | 186 | 13 | 4 |
| Arquero / Tierra | con captura/tienda | Aire 3 | 390.80 | 218 | 14 | 4 |
| Arquero / Aire | con captura/tienda | Fuego 3 | 388.03 | 214 | 14 | 4 |
| Arquero / Agua | con captura/tienda | Tierra 3 | 389.83 | 225 | 14 | 4 |

Los registros conservan técnicas, rangos y reliquias concretas, saldo y gasto de cada campaña. Todas las rutas mixtas terminaron con cuatro reliquias distintas y tres técnicas válidas.

## Pendientes y límites

Revisión visual interactiva de tarjetas, inventario, tienda y doble aro; legibilidad en móvil horizontal, escucha, balance humano y medición GPU/teléfono. El último estado conocido del navegador del agente sigue deshabilitado; no se elude ese ajuste ni se atribuyen pruebas visuales no realizadas.

Persiste el aviso conocido de JavaScript superior a 500 kB. Recursos, dependencias, mapa y controles conservados; sin publicación externa. Siguiente: **2.8 · Doce maestrías**, revisión con técnicas, apoyo y reliquias y presentación completa.

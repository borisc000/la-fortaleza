# Verificación 2.3 — Arquero

Fecha: 2026-11-01 · Aplicación 0.2.3.

## Entrega

Arquero seleccionable, flechas físicas desde el inicio, afinidad en nivel 2, Precisión y penetración, Lluvia de flechas y maestrías de Fuego/Agua. Modelo, animaciones y efectos provisionales propios. Se sigue el plan original por instrucción expresa; no se añaden subfases de pulido. Reglas en [ARQUERO_2_3.md](ARQUERO_2_3.md).

## Comprobaciones

- `npm run build`: TypeScript y compilación correctos. JavaScript 727,62 kB, gzip 194,10 kB. Persiste la advertencia de paquete superior a 500 kB; no es una medición de FPS.
- Comprobación focalizada: **37/37 pruebas correctas**, incluidas Arquero, Mago y estructura de clases. La compilación detectó un tipo genérico de conjunto sin concretar; se corrigió a `Set<number>` y se evitó la intersección de dos tipos de array para los proyectiles.
- Dieciséis pruebas nuevas del Arquero: selección, afinidad en nivel 2, estadísticas y compra; vuelo, rumbo fijado, instantánea de carga/daño, penetración por alineación, impacto único, obstáculos, fallos y caducidad de Precisión.
- Lluvia con anticipación, posición fija, daño guardado, cuatro/seis pulsos, recarga completa, respeto del lanzamiento actual, muros y avisos de aparición. Los pulsos no generan Precisión.
- Quemadura proporcional al componente elemental y salpicadura única por flecha, incluso con penetración. Radio de maestría, sin recursión ni daño a través de muros.
- Pausa de mejoras/tienda, cancelación por derrota y reinicio sin poderes heredados. Representación de las tres clases intercambiada sin actores sobrantes; flechas del Arquero no se dibujan como orbes del Mago. Geometría finita y limpieza de recursos, sin GPU.
- Tres encuentros cortos con tres soldados, usando los 90 puntos de vida normales: físico, Fuego y Agua terminan en victoria. No equivale a una evaluación humana del balance completo.
- Audio: selección de señales de arco/lluvia comprobada; escucha pendiente.
- Servidor local: HTTP 200 con versión 0.2.3 y opción Arquero en el HTML de `http://127.0.0.1:5183/`. Sin publicación.

**Suite completa: 178/178 pruebas correctas**, ninguna omitida; duración total 493,42 s. Son 16 pruebas nuevas del Arquero y dos campañas nuevas, además de las 160 anteriores. Las tres trazas de 3.600 pasos del Guerrero siguen coincidiendo exactamente con las referencias guardadas; no se regeneraron.

### Campañas sobre el mapa real

Semilla 19, mapa 212 × 192 m, navegación y física reales; vida ampliada únicamente en las campañas de integración. Las ocho llegan a maestría y victoria, con muertes únicas, población dentro del límite y proyectiles limpiados al terminar.

| Clase | Afinidad | Ruta | Tiempo simulado (s) | Bajas | Nivel | Pico enemigos | Saldo | Gasto |
|---|---|---|---:|---:|---:|---:|---:|---:|
| Guerrero | Fuego | ruta de combate | 414.63 | 191 | 13 | 11 | 190 | 0 |
| Guerrero | Agua | ruta de combate | 417.32 | 177 | 13 | 12 | 172 | 0 |
| Guerrero | Fuego | con captura/tienda | 414.63 | 184 | 13 | 12 | 193 | 18 |
| Guerrero | Agua | con captura/tienda | 418.08 | 180 | 13 | 11 | 186 | 18 |
| Mago | Fuego | con captura/tienda | 399.23 | 209 | 14 | 12 | 203 | 18 |
| Mago | Agua | con captura/tienda | 406.58 | 184 | 13 | 11 | 186 | 18 |
| Arquero | Fuego | con captura/tienda | 411.53 | 199 | 13 | 14 | 195 | 18 |
| Arquero | Agua | con captura/tienda | 412.37 | 212 | 14 | 16 | 213 | 18 |

Las seis campañas anteriores de Guerrero/Mago conservan exactamente sus resultados de 0.2.2. Las dos del Arquero completan captura y compra de vitalidad, eligen afinidad en nivel 2, alcanzan afinidad III y maestría, y derrotan al jefe.

## Límites

El último estado conocido de la herramienta de navegador es desactivado; no se ha eludido ese ajuste. No se declara inspección visual interactiva, escucha, medición GPU/FPS o prueba de teléfono físico. El modelo, la cuerda y las animaciones siguen siendo provisionales.

Las campañas largas usan vida ampliada únicamente en las pruebas para comprobar integración: navegación, captura/compra, elección elemental, núcleo, maestría y victoria. No acreditan que un jugador complete toda la expedición con la vida normal ni que las clases estén equilibradas.

Actualización posterior de planificación: Acorazado aplazado. Siguiente contenido: **2.4 · Tierra y Aire**. Se mantienen los pendientes de revisión manual del proyecto.

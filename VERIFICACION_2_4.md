# Verificación 2.4 — Tierra y Aire

Fecha: 2026-11-01 · Aplicación 0.2.4.

## Implementado

Cuatro afinidades elegibles para Guerrero, Quebranto, coraza de capacidad finita, ondas sísmicas de maestría, alcance/empuje de Aire, atracción y maestría de vendaval. Indicadores, símbolos, geometrías y sonidos propios. Mago y Arquero siguen limitados a Fuego/Agua según el alcance de 2.4. Ver [TIERRA_AIRE_2_4.md](TIERRA_AIRE_2_4.md).

## Comprobaciones

- `npm run build`: TypeScript y Vite correctos. JavaScript 734,14 kB, gzip 196,15 kB; continúa la advertencia de paquete superior a 500 kB. No acredita rendimiento gráfico.
- Trece pruebas nuevas: disponibilidad por clase, validación de afinidades, Quebranto +15 %/renovación/caducidad, coraza por rango/impacto/recarga y absorción real de daño cuerpo a cuerpo/proyectiles.
- Tres ondas sísmicas por activación, sin daño a través de obstáculos; alcance de Aire guardado al preparar el ataque, desplazamientos según resistencia normal/élite/jefe, conservación de preparaciones enemigas y distancia mínima al héroe.
- Empuje/atracción repetidos contra muro delgado y límite del mapa; bloqueos de línea de visión. Pausas de mejora/tienda, retirada, derrota y partida nueva sin coraza/Quebranto heredados.
- Maestrías alcanzables con elección real y núcleo; encuentros cortos con tres soldados completados usando los 100 puntos de vida normales para ambas afinidades.
- Representación instanciada sin GPU: marca de Quebranto, protección pétrea, ráfagas, limpieza de efectos y señales de audio diferenciadas. La prueba anterior de limpieza visual se adaptó para comparar los objetos permanentes iniciales, ahora que existen coraza y remolino, y exigir que queden ocultos tras reiniciar.
- HTTP 200 de `http://127.0.0.1:5183/`, versión 0.2.4 y nuevo indicador elemental presentes. Sin publicación.

**Suite completa: 193/193 pruebas correctas**, ninguna omitida; duración total 504,94 s. Trece pruebas nuevas de reglas y dos campañas nuevas, más las 178 anteriores. Las tres trazas del Guerrero de 3.600 pasos siguen coincidiendo exactamente con las referencias guardadas; no fueron regeneradas.

### Campañas en el mapa real

Semilla 19, mapa de 212 × 192 m, navegación y colisiones reales; vida ampliada solo en estas campañas. Todas alcanzan maestría y victoria, con muertes únicas, límite de población respetado y proyectiles limpiados al terminar.

| Clase | Afinidad | Ruta | Tiempo simulado (s) | Bajas | Nivel | Pico enemigos | Saldo | Gasto |
|---|---|---|---:|---:|---:|---:|---:|---:|
| Guerrero | Fuego | ruta de combate | 414.63 | 191 | 13 | 11 | 190 | 0 |
| Guerrero | Agua | ruta de combate | 417.32 | 177 | 13 | 12 | 172 | 0 |
| Guerrero | Fuego | con captura/tienda | 414.63 | 184 | 13 | 12 | 193 | 18 |
| Guerrero | Agua | con captura/tienda | 418.08 | 180 | 13 | 11 | 186 | 18 |
| Guerrero | Tierra | con captura/tienda | 409.98 | 188 | 13 | 14 | 197 | 18 |
| Guerrero | Aire | con captura/tienda | 418.15 | 187 | 13 | 15 | 191 | 18 |
| Mago | Fuego | con captura/tienda | 399.23 | 209 | 14 | 12 | 203 | 18 |
| Mago | Agua | con captura/tienda | 406.58 | 184 | 13 | 11 | 186 | 18 |
| Arquero | Fuego | con captura/tienda | 411.53 | 199 | 13 | 14 | 195 | 18 |
| Arquero | Agua | con captura/tienda | 412.37 | 212 | 14 | 16 | 213 | 18 |

Las ocho campañas previas conservan exactamente sus resultados respecto a 0.2.3. Las dos nuevas completan captura, compra de vitalidad, afinidad III, núcleo/maestría y victoria contra el jefe. Se verifican también colisiones de enemigos durante los recorridos; no equivale a una evaluación de rendimiento o dificultad humana.

## Límites

El navegador del agente figura desactivado según el último intento conocido. No se eludió ese ajuste. Inspección interactiva, legibilidad real de las cuatro tarjetas, escucha, FPS/GPU, balance humano y teléfono físico siguen pendientes. La construcción de geometrías y HTTP no sustituyen esas pruebas.

Las campañas largas usan vida ampliada únicamente en sus pruebas para comprobar integración, navegación, captura, compra, progresión, núcleo, maestría y victoria. Los encuentros cortos con vida normal no acreditan el equilibrio de una partida completa.

Siguiente contenido: **2.5 · Afinidades de las tres clases**. Acorazado permanece aplazado y no se insertan subfases de pulido.

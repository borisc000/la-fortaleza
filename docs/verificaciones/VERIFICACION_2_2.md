# Verificación 2.2 — Mago

Fecha: 2026-11-01 · Aplicación 0.2.2 · Entrega autorizada: «Sigue con lo siguiente».

## Implementado

Mago disponible junto al Guerrero en el selector inicial. Afinidad Fuego/Agua antes del combate; ataque a distancia, pasiva de cuatro disparos, Cataclismo fijo y dos maestrías. Túnica/báculo, orbes, círculo de anticipación, HUD y sonidos procedurales propios. Cambio de clase desde pausa/resultados mediante nueva expedición. Reglas numéricas en [MAGO_2_2.md](../diseno/MAGO_2_2.md).

## Comprobaciones

- `npm run build`: TypeScript y Vite correctos. JavaScript 714,79 kB, gzip 190,81 kB. Se conserva la advertencia de paquete superior a 500 kB; no equivale a medición de rendimiento.
- Tres trazas del Guerrero de 3.600 pasos cada una coinciden exactamente con las referencias previas de 0.1.16. La referencia no fue regenerada.
- Nuevas pruebas: afinidad obligatoria antes de comenzar, nivel 2 sin repetir selección, datos inmutables y daño elemental; tiempo de vuelo, rumbo independiente de cámara, primer enemigo, obstáculos, caducidad y daño guardado al lanzar.
- Acumulación: cuarto orbe potenciado y daño único por blanco, cargas sin caducidad; Cataclismo con anticipación, centro fijo, intervalos, recarga al finalizar, espera al lanzamiento, obstáculos y exclusión de enemigos en aviso.
- Maestrías y estados: cinco pulsos de Fuego, radio de Agua y empuje desde el centro, quemadura renovada sin apilar, ausencia de explosiones de muerte heredadas del Guerrero.
- Pausas de mejora/tienda congelan estados, vuelos y reloj. Derrota cancela hechizos y una expedición nueva no hereda cargas, afinidad mejorada ni proyectiles.
- Tres soldados se eliminan con ambas afinidades usando los 80 puntos de vida normales. Es un encuentro acotado automatizado, no una evaluación de dificultad completa.
- Modelos/efectos instanciados sin GPU: reemplazo reiterado Guerrero/Mago sin actores residuales, geometría finita, animaciones y disposición de recursos. Audio comprueba selección de señales, no escucha.
- Servidor local: HTTP 200 de `http://127.0.0.1:5183/`, con versión 0.2.2 y selector de clase en el HTML. No se publicó el juego.

**Suite completa: 160/160 pruebas correctas**, ninguna omitida; duración total 387,62 s. Incluye 14 pruebas nuevas del Mago y dos campañas nuevas, además de las 144 pruebas anteriores. La comprobación focalizada detectó una expectativa incorrecta de prueba: un lanzamiento ya preparado seguía liberándose después de retirar su objetivo. Se corrigió la preparación de la prueba de caducidad de cargas cancelando ese lanzamiento antes de medirlas; no se alteró el comportamiento para forzar el resultado.

### Campañas sobre el mapa real

Semilla 19, navegación y geometría de 212 × 192 m. Vida ampliada únicamente en estas campañas de integración. Las seis alcanzan maestría y victoria, con muertes únicas, límite de población respetado y proyectiles limpiados al terminar.

| Clase | Afinidad | Ruta | Tiempo simulado (s) | Bajas | Nivel | Pico enemigos | Saldo | Gasto |
|---|---|---|---:|---:|---:|---:|---:|---:|
| Guerrero | Fuego | ruta de combate | 414.63 | 191 | 13 | 11 | 190 | 0 |
| Guerrero | Agua | ruta de combate | 417.32 | 177 | 13 | 12 | 172 | 0 |
| Guerrero | Fuego | con captura/tienda | 414.63 | 184 | 13 | 12 | 193 | 18 |
| Guerrero | Agua | con captura/tienda | 418.08 | 180 | 13 | 11 | 186 | 18 |
| Mago | Fuego | con captura/tienda | 399.23 | 209 | 14 | 12 | 203 | 18 |
| Mago | Agua | con captura/tienda | 406.58 | 184 | 13 | 11 | 186 | 18 |

Las cuatro campañas del Guerrero conservan exactamente sus resultados anteriores. Ambas campañas del Mago completan captura y compra de vitalidad, alcanzan afinidad III y consumen el núcleo para su maestría antes de vencer al jefe.

## Límites de verificación

La herramienta de navegador figuraba desactivada en el último intento. No se eludió ese ajuste. Están pendientes revisión visual interactiva del selector, silueta y anticipaciones, escucha, equilibrio de clases, FPS/GPU y teléfono físico. Construir objetos Three.js y comprobar HTTP no sustituye esas verificaciones.

Las campañas largas usan vida ampliada únicamente en sus pruebas para comprobar navegación, progresión, núcleo, maestría, captura/tienda y victoria; no acreditan que un jugador complete la partida con vida normal. El modelo y las animaciones siguen siendo provisionales. El Mago tiene acceso temprano a afinidad I por diseño; su balance frente al Guerrero requiere uso real.

Siguiente contenido: **2.3 · Arquero**. Revisión manual pendiente conservada en el estado del proyecto.

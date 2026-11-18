# Verificación 2.6 — Técnicas y espacios de configuración

Fecha: 2026-11-01 · Aplicación 0.2.6.

## Alcance y comprobaciones

- Doce técnicas y tres espacios por expedición. Reglas en [TECNICAS_2_6.md](TECNICAS_2_6.md).
- **210/210 pruebas fuera de `world.test.ts` correctas**, incluidas 16 nuevas de técnicas. Registro `../../work/tests-2-6-unit.log`.
- Comprobados catálogo inmutable, tres rangos, requisitos por nivel en cola, rechazos de clase/elección inválida, las cuatro posibles exclusiones por clase, ocupación máxima, mejoras sin espacio adicional, estados al reiniciar y resumen de configuración.
- Efectos probados en combate: arco/alcance, mitigación antes de coraza, duración y pulsos con las cuatro maestrías, eco retrasado sin cargas/área adicionales, radio de explosión con paredes, intervalos de disparo, radios de áreas, abanico sin alterar Precisión, penetración con Aire y paredes, pausa/muerte y representación en memoria sin GPU.
- Las tres trazas de combate del Guerrero sin técnicas conservan su resultado exacto. No se regeneraron referencias.
- TypeScript y compilación de producción correctos: 65 módulos, HTML 10,87 kB, CSS 21,16 kB, JavaScript 745,94 kB (199,84 kB gzip). HTTP 200 del servidor local con versión 0.2.6, catálogo y espacios presentes en HTML; esto no acredita renderizado visual.

## Integración en el mapa real

**229/229 pruebas únicas correctas en conjunto**, cero fallos: 210 pruebas de la batería general y 19 de `world.test.ts`. Registro completo del mapa en `../../work/tests-2-6-world.log`. También finalizaron correctamente las comprobaciones filtradas de Mago y Arquero, cuyos resultados coinciden; no se cuentan dos veces. El filtro de la ejecución principal incluyó el archivo completo, por lo que produjo cobertura adicional repetida.

Incluyen catorce campañas: dos por ruta de combate y doce combinaciones con captura, tienda, núcleo, maestría y tres técnicas. Cada afinidad deja fuera una técnica distinta para cubrir los cuatro conjuntos posibles de cada clase. Se verifican límites, muertes únicas, colisiones y limpieza final. La nueva política de elección prioriza técnicas tras afinidad III; sus resultados no deben compararse como si la configuración fuera la misma que en 2.5.

**Solo estas pruebas amplían la vida para aislar las reglas.** No acreditan supervivencia humana con vida normal ni balance, FPS o GPU. Las catorce campañas terminaron en victoria, incluidas las doce con tres técnicas, captura/tienda, afinidad III, núcleo y maestría. Configuraciones y resultados:

| Clase / afinidad | Ruta | Segundos simulados | Bajas | Nivel | Técnicas y rangos |
|---|---|---:|---:|---:|---|
| Guerrero / Fuego | ruta de combate | 414.63 | 183 | 13 | Sin técnicas |
| Guerrero / Agua | ruta de combate | 417.32 | 176 | 13 | Sin técnicas |
| Guerrero / Fuego | con captura/tienda | 428.63 | 166 | 12 | Guardia firme 2, Giro prolongado 2, Estocada 3 |
| Guerrero / Agua | con captura/tienda | 433.50 | 172 | 12 | Guardia firme 3, Giro prolongado 3, Barrido 2 |
| Guerrero / Tierra | con captura/tienda | 416.97 | 177 | 13 | Giro prolongado 3, Barrido 3, Estocada 2 |
| Guerrero / Aire | con captura/tienda | 427.17 | 184 | 13 | Guardia firme 3, Barrido 3, Estocada 2 |
| Mago / Fuego | con captura/tienda | 397.45 | 209 | 14 | Resonancia 3, Concentración 3, Convergencia 3 |
| Mago / Agua | con captura/tienda | 391.85 | 214 | 14 | Concentración 3, Convergencia 3, Eco arcano 3 |
| Mago / Tierra | con captura/tienda | 391.12 | 210 | 14 | Resonancia 3, Convergencia 3, Eco arcano 3 |
| Mago / Aire | con captura/tienda | 389.67 | 221 | 14 | Resonancia 3, Concentración 3, Eco arcano 3 |
| Arquero / Fuego | con captura/tienda | 412.83 | 198 | 13 | Cadencia 3, Lluvia extensa 2, Punta larga 3 |
| Arquero / Agua | con captura/tienda | 386.25 | 226 | 14 | Cadencia 3, Lluvia extensa 3, Abanico 3 |
| Arquero / Tierra | con captura/tienda | 386.88 | 221 | 14 | Lluvia extensa 3, Abanico 3, Punta larga 3 |
| Arquero / Aire | con captura/tienda | 386.23 | 227 | 14 | Cadencia 3, Abanico 3, Punta larga 3 |

## Pendientes y límites

Revisión visual interactiva del catálogo y HUD, lectura de tarjetas en móvil horizontal, escucha, balance humano y medición con GPU/teléfono. El navegador del agente sigue deshabilitado según el último estado conocido; no se elude el ajuste ni se atribuyen pruebas visuales no realizadas. Las comprobaciones Three.js son sobre objetos y materiales en memoria.

Persiste la advertencia conocida de bloque JavaScript superior a 500 kB. Recursos procedurales propios, dependencias y mapa conservados. No se publica fuera del servidor local. Siguiente: **2.7 · Reliquias y doble afinidad**.

# Verificación 2.1 — Estructura compartida de clases

Fecha: **2026-11-01** · Aplicación **0.2.1** · Siguiente: **2.2, Mago**.

## Entrega

Datos de clase separados de la ejecución de habilidades y de los sistemas comunes. Guerrero usa su definición inmutable, un `WarriorKit` nuevo por partida y efectos elementales registrados con su clase. El motor común conserva enemigos, daño, muerte y recompensas; `Run` conserva director, progresión, exploración, tienda y objetivos. Vida, armadura, movimiento, radio, nombres y maestrías se obtienen de la definición. Arquitectura y pasos de ampliación en [ARQUITECTURA_CLASES_2_1.md](ARQUITECTURA_CLASES_2_1.md).

Esta entrega es principalmente interna: continúa disponible únicamente el Guerrero. No cambia el balance, mapa, cámara, precios ni controles, ni introduce un selector que ofrezca clases incompletas. No se incorporaron recursos artísticos, sonidos ni dependencias nuevos.

## Equivalencia con 0.1.16

Antes de editar el motor se ejecutó `tests/support/warrior-trace.ts` sobre 0.1.16 y se guardó el resultado en `tests/fixtures/warrior-0.1.16.json`. Ese archivo representa la versión previa; no se regeneró para hacer coincidir la refactorización.

Tres recorridos deterministas de 3.600 pasos (60 segundos cada uno) comparan mediante SHA-256 el estado público y los eventos de **cada paso**: vida, daño, posiciones, enemigos, ataques, identificadores, objetivos, recargas, acumulaciones, afinidades y proyectiles. Se verificó coincidencia exacta de las tres trazas tras la extracción.

| Configuración | Pasos idénticos | Bajas | Eventos de impacto |
|---|---:|---:|---:|
| Sin elemento | 3.600 | 8 | 72 |
| Fuego con maestría | 3.600 | 8 | 108 |
| Agua con maestría | 3.600 | 8 | 72 |

Vida ampliada solo en estas pruebas para cubrir todas las acciones sin terminar por derrota. Las trazas validan equivalencia, no dificultad humana ni rendimiento gráfico.

## Comprobaciones adicionales

- Batería completa: **144/144 pruebas correctas**, ninguna omitida, aproximadamente 348 s de ejecución local. Las cuatro campañas completas de Fuego/Agua con y sin captura/tienda llegan a maestría y victoria. Vida ampliada solo en las simulaciones; su tiempo de ejecución no mide FPS/GPU.
- Siete pruebas nuevas: tres trazas, catálogo/definiciones inmutables, aislamiento entre partidas, consumo real de estadísticas y sustitución de kit.
- Una variante exclusiva de prueba cambia vida, armadura, velocidad, radio, alcance y daño. Se comprueba que combate, colisión de proyectiles, límite de velocidad, descripciones y compra de vitalidad usan esos datos.
- Un kit de prueba independiente del Guerrero utiliza el mismo motor para aplicar armadura, producir muerte/recompensa, finalizar y entregar esencia. No acumula Ímpetu ni dispara Torbellino; demuestra el punto de sustitución sin añadir una clase ficticia al producto.
- 56 pruebas focalizadas de combate, kit, elementos y progresión correctas antes de la batería completa.
- TypeScript y compilación correctos: HTML 9,32 kB; CSS 19,74 kB; JavaScript 702,96 kB (187,58 kB gzip). Se mantiene el aviso conocido de paquete JS mayor de 500 kB.
- El servidor local estaba detenido: se inició `npm run dev` en loopback, puerto 5183. HTTP 200 del HTML 0.2.1 y de los módulos de aplicación, catálogo y kit. Ocho documentos sin enlaces locales rotos; 94 IDs HTML únicos, referencias DOM y versiones de package/lock coherentes. Sin publicación externa.

Resultados de campaña iguales a los registrados en 1.10: Fuego por combate 414,63 s/191 bajas; Agua por combate 417,32 s/177 bajas; Fuego con objetivos opcionales 414,63 s/184 bajas; Agua con objetivos opcionales 418,08 s/180 bajas. Todas alcanzan nivel 13; las dos rutas opcionales compran vitalidad por 18 monedas. Estas cifras son tiempo simulado de partida.

## Pendientes conservados

La revisión visual/auditiva del pulido 1.10, dificultad humana, GPU y teléfono físico siguen pendientes. El último intento de navegador registró acceso local desactivado; esta entrega interna no atribuye una nueva prueba visual. Los modelos de personaje y sus animaciones continúan siendo provisionales.

Siguiente contenido: **2.2 — Mago**, utilizando estas interfaces. Quedan **29 subfases de implementación futuras**; la revisión manual de 1.10 continúa registrada aparte.

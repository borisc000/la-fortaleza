# Rendimiento con 60 despojos

El 18 de noviembre de 2026 se comparó el mismo claro antes y después del ajuste, en Chrome con WebGL por hardware (AMD Radeon integrada, Direct3D 11), sombras activas y un lienzo de 960 × 640. Cada fila corresponde a una ejecución por versión.

| Distribución | Ataques del Guerrero | Simulación p95 antes → después (ms) | Fotograma p95 antes → después (ms) | Impactos antes y después |
|---|---|---:|---:|---:|
| Dispersos | Ninguno | 7,6 → 1,9 | 14,8 → 14,8 | 0 |
| Dispersos | Básico + cuatro habilidades | 12,2 → 1,9 | 14,7 → 14,8 | 92 |
| Juntos | Ninguno | 8,8 → 2,2 | 14,7 → 14,8 | 0 |
| Juntos | Básico + cuatro habilidades | 16,1 → 2,2 | 29,2 → 14,9 | 619 |

Los impactos cuentan eventos de daño del héroe durante los 360 pasos. Los 60 enemigos siguieron vivos en los ocho ensayos. Un perfil de CPU separado de 1200 pasos con el grupo junto y las habilidades activadas situó a clearPath en primer lugar (7355 muestras directas), seguido de moveCircle (1915). El mapa aportó 688 obstáculos. El tiempo de CPU dedicado a actualizar la vista y enviar el dibujo en el caso más exigente fue de 1,9 ms p95 en ambas versiones. El intervalo de fotograma incluye la presentación y la espera de refresco. El ensayo carece de temporizador de GPU.

El movimiento y la línea de visión descartan ahora por coordenadas los obstáculos fuera del alcance de la consulta antes de resolver el contacto o intersecar el segmento. El arsenal del Guerrero también evita buscar y ordenar blancos durante la recarga, salvo cuando el Martillo necesita preparar el aviso de impacto.

## Reproducción

Con el servidor de desarrollo activo, abrir [la prueba de densidad](http://127.0.0.1:5183/audits/horde-density.html) y pulsar «Medir las cuatro escenas». La cuadrícula de 10 × 6 usa separaciones de 2,3 m y 0,6 m. Cada segundo simulado se restaura la formación y entre reposiciones funcionan la persecución, la separación y los ataques. El héroe y los enemigos tienen vida ampliada. La cámara y el escenario son idénticos. El Guerrero usa Torbellino, Onda de acero, Hachas giratorias y Martillo de guerra, con básico y habilidades a nivel 1.

Se ejecuta un paso de 1/60 s por fotograma. Se descartan los primeros 60 y se miden los siguientes 300. La escena controla la carga de combate y de sus vistas en el claro. Una expedición con otras clases, enemigos o resolución puede dar tiempos distintos.

En 50 000 escenarios generados con semilla fija, el movimiento resultante y las consultas de visibilidad coincidieron con la implementación anterior. Una segunda ejecución desde el botón de la auditoría, durante las pruebas automatizadas, conservó los recuentos de impactos y arrojó 14,7 ms de fotograma y 2,4 ms de simulación p95 para el grupo junto con habilidades.
Pasaron las 360 pruebas rápidas, las 26 simulaciones de campaña y supervivencia, el tipado, la compilación y el lint (con advertencias).

## Segunda optimización de la persecución

El perfil de simulación posterior al primer ajuste situó el movimiento circular y la visibilidad en los primeros lugares (346 y 263 muestras directas). La persecución ahora reutiliza el índice de obstáculos estáticos de navegación, en celdas de 4 m. Los pasos cortos con espacio libre aceptan su destino directamente. El solucionador completo sigue resolviendo contactos, desplazamientos largos y bordes del mapa.

Se volvió a ejecutar el mismo ensayo inmediatamente antes y después del cambio. Ambos grupos de medidas son de esta segunda tanda.

| Distribución | Ataques del Guerrero | Simulación p95 antes → después (ms) | Fotograma p95 antes → después (ms) |
|---|---|---:|---:|
| Dispersos | Ninguno | 1,9 → 1,0 | 7,1 → 7,1 |
| Dispersos | Básico + cuatro habilidades | 2,6 → 1,0 | 7,1 → 7,1 |
| Juntos | Ninguno | 2,0 → 1,3 | 7,1 → 7,1 |
| Juntos | Básico + cuatro habilidades | 2,0 → 1,4 | 7,1 → 7,1 |

Los ocho ensayos terminaron con 60 enemigos vivos. Con habilidades se repitieron los 92 impactos dispersos y los 619 juntos. Una comparación adicional de 50 000 movimientos y líneas de visión, con posiciones dentro y fuera de los límites, coincidió con los cálculos completos. La prueba de regresión también cubre paredes que cruzan celdas, coordenadas negativas, movimientos grandes y diferentes radios.
Pasaron las 361 pruebas rápidas, las 26 simulaciones de campaña y supervivencia, el tipado, la compilación y el lint con dos advertencias.

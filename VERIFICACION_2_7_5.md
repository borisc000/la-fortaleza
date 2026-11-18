# Verificación 2.7.5

2026-11-03 · aplicación 0.2.11.

## Pruebas

- 274/274 pruebas de regresión fuera de world.test.ts: work/tests-2-7-5.log.
- 5/5 nuevas pruebas: equivalencia del índice espacial con distancias exactas, llenado 20/40/60/90 con mayoría frágil y amenazas acotadas, muerte/recompensa única, cien instancias y limpieza, simulación sobre mapa real. Registro work/horde-2-7-5.log.
- Prueba dirigida del renderizador repetida tras mejorar geometría: work/horde-render-2-7-5.log.
- Tipado y build de producción correctos: work/build-2-7-5.log. Persiste advertencia de bloque JavaScript mayor de 500 kB; no equivale a error de compilación.

## CPU aislada, mapa real

600 pasos a 60 Hz por carga, 60 de calentamiento, héroe sin ataques y vida ampliada; no mide progresión ni balance. Milisegundos observados, sin umbral temporal frágil en las pruebas:

| Actores | Mediana | p95 | Máximo |
|---|---:|---:|---:|
| 20 | 1,36 | 2,23 | 5,35 |
| 60 | 4,32 | 5,94 | 7,46 |
| 100 | 7,26 | 10,03 | 12,45 |

## WebGL real

Laboratorio en navegador integrado, 1150 × 835, mapa con recursos, 540 muestras después de calentamiento. Con 100 despojos: muestra de 142,5 FPS / p95 de fotograma 7,1 ms; repetición durante otras comprobaciones locales: 108,1 FPS / p95 14,0 ms. CPU p95 observada 7,8–14,3 ms. Con 60: 142,5 FPS / p95 7,1 ms y CPU p95 5,7 ms. No son ensayos de equipo aislado; no extrapolar a otros dispositivos. 92 llamadas de dibujo en esas muestras, cero fallos de recursos. Captura work/horda-100-2-7-5.png.

Con 20 despojos: 139,4 FPS / p95 7,1 ms y CPU p95 2,5 ms.

No se midió tiempo GPU directo. El máximo 100 es provisional para PC: falta medir cuatro habilidades, tipos resistentes y efectos simultáneos en partidas prolongadas, además de teléfono físico. El laboratorio usa vista fija y no acredita controles ni balance. Los recorridos largos se registran a continuación.


## Partida normal y siguiente ajuste

Revisión visual del Guerrero con vida normal: desplazamiento WASD entre grupos, aparición de despojos, muertes, recogida de monedas/esencia, elección de Agua y aumento de arco de Espada. Nivel 2 a 7 s, nivel 3 a 14 s, nivel 4 a 18 s en este recorrido breve; 40/100 de vida al final tras permanecer quieto durante parte de la revisión. No constituye una prueba de supervivencia prolongada ni de balance final. Captura: work/partida-2-7-5.png.

La densidad acelera mucho las elecciones tempranas: revisar experiencia y pausas en 2.7.6, sin garantizar habilidades nuevas por tiempo. El navegador integrado rechazó captura del puntero; se mostró el control alternativo sin arrastre. No se declara pointer lock validado en esta revisión. Cero errores de consola en la partida revisada. El aviso previo de sombras obsoletas se corrigió usando la alternativa ya aplicada por Three.js.


## Campañas completas sobre el mapa real

Guerrero/Fuego: correcta, victoria a 390,93 s, 1.324 bajas, nivel 36, 39 elecciones y pico de 83 enemigos vivos. Captura, compra, dos cofres, cuatro habilidades, cuatro reliquias, apoyo Agua III y maestría. Saldo 1.218 monedas tras gastar 26. Registro: work/campaign-2-7-5-warrior.log.

Mago/Fuego: correcta, victoria a 387,05 s, 1.333 bajas, nivel 36, 39 elecciones y pico de 85 vivos. Captura, compra, dos cofres, cuatro habilidades, cuatro reliquias, apoyo Tierra III y maestría. Saldo 1.226 tras gastar 26. Registro: work/campaign-2-7-5-mage.log.

Arquero/Fuego: correcta, victoria a 385,47 s, 1.317 bajas, nivel 35, 38 elecciones y pico de 95 vivos. Captura, compra, dos cofres, cuatro habilidades, cuatro reliquias, apoyo Agua III y maestría. Saldo 1.226 tras gastar 26. Registro: work/campaign-2-7-5-archer.log.

Cierre: **279 pruebas cortas/de carga + 3 campañas completas seleccionadas correctas**, además de tipado, compilación y revisión visual. No se ejecutó la matriz completa de campañas para todos los elementos. El pico global puede superar el objetivo local de 90 cuando hay enemigos más alejados; las tres campañas respetaron el límite global de 100.

Estas campañas usan vida ampliada y comprueban ciclo, colisiones, recompensas únicas y cierre, sin acreditar balance humano. Los registros interrumpidos no se cuentan como resultados. La nueva densidad exige revisar la economía y las elecciones en 2.7.6.

# Cuatro habilidades por clase en combate

18 de noviembre de 2026. Chrome, cámara de juego a 12 m, desplazamiento lateral y frontal, afinidad de fuego de rango 1.

| Clase | Habilidades equipadas además del ataque básico | Resultado visual |
| --- | --- | --- |
| Guerrero | Torbellino, Hachas giratorias, Guardia de represalia y Cadena de guerra | El arco del Torbellino se estrecha hacia la cola. Se ve más suelo durante el giro y las dos puntas del gancho se cierran mientras el guerrero recoge el brazo. |
| Mago | Cataclismo, Sello de detonación, Nova arcana y Haz rúnico | El Sello se arma en un hexágono con seis trazos lilas. Cataclismo conserva un borde circular más fino y la Nova se reconoce por el frente que se expande desde el mago. |
| Arquero | Salva en abanico, Flecha rebotadora, Flechas de retorno y Trampa de púas | La Salva abre el gesto de suelta. El rebote lleva una estela corta y ancha. El retorno marca el giro con un semicírculo y vuelve con dos estelas celestes. |

[Comparación animada antes y después](evidencias/habilidades/combate-cuatro-habilidades.gif). Las columnas muestran el mismo instante y recorte. La secuencia ralentiza los primeros 1,4 segundos para ver los solapamientos.

## Condiciones y resultados

Se repitió cada encuentro con la semilla 1927, 37 enemigos añadidos y el mismo recorrido. Cada pasada duró 496 pasos de simulación (8,27 s). Para equipar exactamente el cuarteto del arquero se sustituyó su habilidad inicial en la sesión de prueba. Se elevó el umbral de experiencia durante la captura para evitar pausas por subida de nivel.

Los registros coincidieron en los 20 puntos de comparación por clase, incluida la posición del héroe, las activaciones, los impactos y las bajas. Las cuatro técnicas de cada clase se activaron y hubo enemigos preparando ataques en los tres encuentros.

| Clase | Impactos en enemigos | Bajas | Salud final |
| --- | ---: | ---: | ---: |
| Guerrero | 199 | 32 | 100 |
| Mago | 94 | 32 | 64 |
| Arquero | 115 | 16 | 68 |

Pasaron las 355 pruebas, el chequeo de tipos y la compilación. El linter terminó con dos advertencias. El alcance visual de esta comparación es cámara a 12 m y habilidades de nivel 1.

# Combate a nivel 10 con las dos variantes finales

Los tres cuartetos se probaron desde la cámara de juego a 12 m. En cada clase, la primera pasada combina la primera mutación de nivel 5 y el primer remate de nivel 10 para las cuatro habilidades. La segunda usa la segunda opción en ambos hitos. Se priorizó expansión en los siete puntos de rama para observar la superposición de efectos. El ataque básico se mantuvo a nivel 1.

| Clase | Habilidades, en orden | Primeros remates | Segundos remates |
| --- | --- | --- | --- |
| Guerrero | Torbellino, Hachas giratorias, Guardia de represalia, Cadena de guerra | Segunda vuelta, Ronda exterior, Muro de hierro, Yunque | Centro, Acero persistente, Castigo, Eslabones |
| Mago | Cataclismo, Sello de detonación, Nova arcana, Haz rúnico | Último sello, Onda residual, Expansión, Canal largo | Desastre extenso, Implosión, Pulso defensivo, Foco absoluto |
| Arquero | Salva en abanico, Flecha rebotadora, Flechas de retorno, Trampa de púas | Doble salva, Cadena tensa, Tercera pasada, Cerco | Puntas abiertas, Dos trayectorias, Retorno rápido, Dientes de hierro |

## Lectura desde la cámara

- **Guerrero.** Las cabezas de las hachas se confundían con destellos de impacto y con las placas de Guardia. Una estela corta de acero azulado marca la dirección de cada órbita y deja huecos entre las armas. [Comparación del guerrero](evidencias/habilidades/nivel10-warrior.gif).
- **Mago.** El doble haz ocupaba demasiado suelo y los trazos de dos sellos podían cruzarse. La envolvente del haz es más transparente y las runas tienen una longitud máxima. En Implosión convergen sobre el centro del sello. La Onda residual conserva su expansión hacia fuera. [Comparación del mago](evidencias/habilidades/nivel10-mage.gif).
- **Arquero.** Las púas se perdían entre las piernas de los enemigos al coincidir con las flechas de retorno. Al dispararse, la corona sube y se cierra hacia dentro con dientes claros alternados. [Comparación del arquero](evidencias/habilidades/nivel10-archer.gif).

## Prueba de combate

Se repitieron los seis encuentros antes y después con la semilla 1927, afinidad de fuego de rango 1, el mismo recorrido y 37 enemigos añadidos. Cada pasada duró 496 pasos a 60 Hz. Los GIF ralentizan siete instantes de los primeros 1,88 s. Cada columna compara el mismo recorte y momento. El navegador equipó los cuartetos con mejoras legales del laboratorio y elevó temporalmente el umbral de experiencia para evitar pausas durante la captura.

| Clase | Final | Impactos en enemigos | Bajas | Salud final |
| --- | ---: | ---: | ---: | ---: |
| Guerrero | 1 | 180 | 39 | 100 |
| Guerrero | 2 | 173 | 38 | 100 |
| Mago | 1 | 97 | 38 | 58 |
| Mago | 2 | 110 | 36 | 70 |
| Arquero | 1 | 185 | 29 | 80 |
| Arquero | 2 | 214 | 35 | 80 |

Las cuatro habilidades se activaron en los seis encuentros. Los registros de simulación coincidieron antes y después en los 66 puntos de control. Pasaron las 355 pruebas, el chequeo de tipos y la compilación. El linter terminó con dos advertencias y Vite avisó del tamaño del paquete de combate.

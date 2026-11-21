# Presión en Los dominios exteriores

21 de noviembre de 2026

## Eventos

| Evento | Inicio aproximado | Qué cambia |
|---|---|---|
| Primer Toque de asedio | 1:20–1:30 | Cuatro ballesteros y dos soldados refuerzan los flancos en una ventana de 14 s. |
| Montería del Verdugo | 3:08–3:16 | Aparece el Verdugo de la ronda, un perseguidor de 275 de vida con carga de 13,5 m. Su franja fija la dirección de la embestida. |
| Segundo Toque de asedio | 4:35–4:42 | Cuatro ballesteros y dos devastadores refuerzan los flancos en una ventana de 14 s. |

La semilla de la expedición determina el momento de cada evento. Cada evento se anuncia cuatro segundos antes. Los Toques de asedio reservan sitio para sus refuerzos dentro del límite de enemigos de las oleadas. El núcleo de maestría lo sigue soltando el Portador. Si el Verdugo continúa vivo a los seis minutos, se retira con la horda.

## Duelo con el Castellano

| Ataque nuevo | Aviso | Cómo esquivarlo |
|---|---|---|
| Arremetida | Una franja fija anuncia el avance de 16,4 m con 1,05 s de antelación. | Esquiva hacia un lado de la franja. |
| Ruptura del suelo | Círculo rojo de 3,25 m de radio, fijo donde se encontraba el héroe al empezar el ataque. | Sal del círculo antes del impacto, tras 1,45 s. |
| Edicto del vacío | Anillo turquesa de 2,65 m de radio, fijo donde se encontraba el héroe al empezar el ataque. | Quédate dentro del anillo hasta el impacto, tras 1,55 s. |

La Ruptura y el Edicto alcanzan al héroe desde cualquier sector, incluso detrás de muros. Ambos se resuelven en un solo impacto. El jefe tiene 1400 de vida y conserva el barrido, el golpe circular y la andanada. Al llegar a media vida, la furia acelera su movimiento un 22 %, acorta las recargas un 20 % y aumenta la andanada a cinco proyectiles.

## Navegador

En Chrome a 1440 × 900 se inició Los dominios exteriores con el Arquero desde el menú y se comprobó el movimiento. En la misma sesión, Playwright adelantó el reloj y las fases de la compilación de desarrollo para revisar el contador del Toque de asedio, el marcador y la barra de vida del Verdugo, el círculo rojo de la Ruptura y el anillo turquesa del Edicto con la amenaza marcada en el exterior. La consola quedó limpia durante la revisión.

## Pruebas automatizadas

`npm test` pasó las 375 pruebas. Las nuevas cubren la programación por semilla, el límite compartido, el retiro del Verdugo, el alcance de los hechizos tras un muro, las dos respuestas a los avisos y la arremetida esquivable. [Incursiones](../../game/tests/incursions.test.ts) · [Combate del Castellano](../../game/tests/castellan.test.ts).

`npm run lint` y `npm run build` finalizaron correctamente. Siguen los avisos previos de lint y tamaño de paquete de Vite.

## Supervivencia con vida normal

Se compararon doce partidas en una arena de entrenamiento con la semilla 19. Cada clase usó dos afinidades y configuraciones con hasta dos o cuatro habilidades. El piloto actualizado responde a las dos marcas del Castellano.

| Clase | Victorias antes del ajuste | Victorias con el ajuste |
|---|---:|---:|
| Guerrero | 3 de 4 | 2 de 4 |
| Mago | 0 de 4 | 1 de 4 |
| Arquero | 4 de 4 | 1 de 4 |
| Total | 7 de 12 | 4 de 12 |

La única victoria del Arquero terminó con 2 puntos de vida y la del Mago con 8. Las doce sondas llegaron a un resultado válido y respetaron el límite de enemigos. Los resultados corresponden a esta semilla y a las decisiones del piloto. El balance con partidas humanas sigue pendiente.

## Campañas del mapa exterior

Los 26 casos de `npm run test:sim` pasaron en la versión final, incluidos los doce recorridos con vida normal. En las catorce campañas del mapa real, el piloto con vida ampliada encontró los tres eventos y al Verdugo, conservó las interacciones de captura y mercader y ganó todos los duelos. Los picos fueron de 82 a 97 enemigos vivos. Cada escenario terminó entre 2,75 y 11,94 s después de su referencia automatizada de E3.2.

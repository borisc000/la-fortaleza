# Los cuartetos restantes en combate a nivel 10

Se probaron las otras cuatro técnicas de cada clase juntas. Cada fila representa una habilidad equipada en ambos encuentros de su clase.

| Clase | Habilidad | Final 1 | Final 2 |
| --- | --- | --- | --- |
| Guerrero | Onda de acero | Brecha | Media luna |
| Guerrero | Martillo de guerra | Réplica | Verdugo |
| Guerrero | Lanzas espectrales | Asedio | Línea de muerte |
| Guerrero | Estandarte de guerra | Resistencia | Última orden |
| Mago | Lanzas arcanas | Aguja del vacío | Perforación perfecta |
| Mago | Orbes custodios | Anillo doble | Guardián |
| Mago | Lluvia de fragmentos | Gran fragmento | Constelación |
| Mago | Espejo arcano | Memoria | Reflejo mayor |
| Arquero | Lluvia de flechas | Aguacero | Flechas pesadas |
| Arquero | Disparo de asedio | Punta implacable | Golpe final |
| Arquero | Baliza de caza | Presa mayor | Marca persistente |
| Arquero | Estacas de guardia | Puntas dobles | Madera astillada |

## Cambios visibles

- **Guerrero.** La media luna dorada de Onda de acero ocultaba las lanzas al salir juntas. Las Lanzas espectrales tienen ahora un asta turquesa y una punta con dos aletas, visibles durante el vuelo. [Antes y después](evidencias/habilidades/nivel10-restantes-warrior.gif).
- **Mago.** El Espejo se confundía con los Orbes custodios cerca del hombro del mago. Se elevó su óvalo, se aclaró el marco y se añadió un reflejo que recorre el cristal. El eco nace a la altura del espejo y asciende al copiar el disparo. [Antes y después](evidencias/habilidades/nivel10-restantes-mage.gif).
- **Arquero.** Las marcas sobre la horda competían con la propia Baliza durante la lluvia. Se redujo el tamaño de las marcas y se elevó el aro central. Un rombo suspendido permite seguir su centro cuando el aro gira de canto. [Antes y después](evidencias/habilidades/nivel10-restantes-archer.gif).

## Condiciones

Cámara de juego a 12 m, héroe en movimiento, 37 enemigos añadidos, semilla 1927 y fuego de rango 1. Cada pasada duró 496 pasos (8,27 s). El básico se mantuvo a nivel 1. Las cuatro habilidades se equiparon en la sesión del navegador usando mejoras legales del laboratorio y priorizando expansión. El primer encuentro empareja la primera mutación con el primer remate de cada habilidad y el segundo usa las segundas opciones. Se elevó el umbral de experiencia para evitar pausas de selección.

| Clase | Final | Impactos en enemigos | Bajas | Salud final |
| --- | ---: | ---: | ---: | ---: |
| Guerrero | 1 | 139 | 31 | 79,6 |
| Guerrero | 2 | 150 | 37 | 90 |
| Mago | 1 | 213 | 37 | 68 |
| Mago | 2 | 217 | 37 | 80 |
| Arquero | 1 | 159 | 38 | 68 |
| Arquero | 2 | 101 | 31 | 80 |

Los GIF emparejan el mismo instante antes y después. Los tiempos impresos son segundos de combate.

Las cuatro habilidades se activaron en cada encuentro. Los registros coincidieron antes y después en los 66 puntos de control. Pasaron el chequeo de tipos y la compilación. El linter terminó con tres advertencias. En la última ejecución de la suite pasaron 356 de 357 pruebas. El único fallo correspondió al relieve E3.2, en la comprobación de los límites del área jugable.

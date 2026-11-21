# Pulido de las 24 habilidades restantes

18 de noviembre de 2026 · Atelier de La Fortaleza · PC, Chrome.

Las secuencias reúnen doce fotogramas por habilidad. Se capturaron en el laboratorio con la cámara a 12 m y su campo de visión de 65°. Primero se comprobó el efecto desde atrás y luego se giró la cámara en horizontal para ver las trayectorias que quedan ocultas por los muñecos alineados. Los GIF recortan el visor y usan intervalos de reproducción propios para mostrar los efectos breves.

| Clase | Habilidad | Qué observar |
|---|---|---|
| Guerrero | Espada | Alternancia entre tajo y revés. Estocada adelanta el hombro y estrecha la estela. |
| Guerrero | Torbellino | El arco se ilumina en cada pulso y pierde intensidad entre golpes. |
| Guerrero | Onda de acero | Una media luna sale del filo. En la vuelta cambia de orientación e inclinación. |
| Guerrero | Hachas giratorias | Cada hacha gira sobre su mango mientras recorre la órbita. |
| Guerrero | Martillo de guerra | La cabeza rebota y despide esquirlas al impactar. En la siguiente activación se ve la caída desde arriba. |
| Guerrero | Lanzas espectrales | Asta translúcida y punta metálica. Cuatro destellos cortos señalan dónde atraviesa un enemigo. |
| Guerrero | Estandarte de guerra | El asta baja, el paño se despliega y aparece una insignia sobre el héroe mientras recibe el bono. |
| Guerrero | Cadena de guerra | Los eslabones se tensan y recuperan holgura. El inicio sigue al guerrero y el gancho al objetivo durante la recuperación. |
| Mago | Proyectil mágico | Las cargas aparecen como chispas junto al cristal del bastón. El proyectil potenciado lleva un núcleo pulsante. |
| Mago | Cataclismo | Las grietas se abren alrededor de cada punto de impacto. |
| Mago | Lanzas arcanas | Agujas alargadas y aros breves al perforar. |
| Mago | Orbes custodios | El núcleo y la cola curva hacen visible el sentido de giro. |
| Mago | Haz rúnico | El mago orienta el bastón y una banda luminosa recorre el haz en cada pulso. |
| Mago | Nova arcana | El destello del torso da paso a dos bordes que se expanden desde el héroe. |
| Mago | Lluvia de fragmentos | Los impactos sucesivos muestran el lugar de caída, el cristal y sus esquirlas. |
| Mago | Espejo arcano | La superficie del espejo muestra una silueta y un bastón cuando repite el disparo. |
| Arquero | Flecha | La trayectoria deja una estela corta. Los aciertos encienden las marcas de Precisión en el arco. |
| Arquero | Lluvia de flechas | Tras cada descarga quedan flechas clavadas e inclinadas durante un instante. |
| Arquero | Salva en abanico | La punta y la estela central destacan entre las flechas laterales. |
| Arquero | Flecha rebotadora | Cada cambio de blanco deja un destello y una sección del recorrido anterior. |
| Arquero | Trampa de púas | Los dientes se arman, se abren al activarse y dejan púas visibles junto al enemigo ralentizado. |
| Arquero | Flechas de retorno | El origen queda marcado en el suelo. En el giro aparece un destello y la estela se duplica durante la vuelta. |
| Arquero | Baliza de caza | La baliza gira y los enemigos afectados llevan una marca sobre la cabeza. |
| Arquero | Estacas de guardia | Las estacas emergen en sucesión. La que alcanza al muñeco vibra en el momento del cruce. |

[Secuencia del Guerrero](evidencias/habilidades/pulido-guerrero.gif) · [Secuencia del Mago](evidencias/habilidades/pulido-mago.gif) · [Secuencia del Arquero](evidencias/habilidades/pulido-arquero.gif)

## Pruebas en el laboratorio

- En **Habilidades completas**, se reprodujeron las 24 habilidades en nivel 1 con Fuego. En nivel 10 se comprobaron dos combinaciones, la primera mutación con el primer remate y la segunda mutación con el segundo remate. Se verificó que rebobinar y volver al mismo instante reproducía las métricas de esta última combinación.
- En **Estacas de guardia**, la opción **Cruzar las estacas** pone en movimiento un muñeco de la fila. A los 4,2 s se registraron 7 impactos con Fuego en nivel 1 y 16 en nivel 10 con Pasillo y el segundo remate. El contador incluye efectos secundarios.
- En **Cadena de guerra**, la reproducción en nivel 10 devolvió los mismos 28 impactos y 86,7 de daño tras rebobinar. En una comprobación adicional en Chrome se desplazaron el héroe y el objetivo durante doce pasos. El enganche y el origen de los eslabones siguieron sus posiciones con error inferior a una millonésima de metro. El daño directo permaneció en 18 tras el golpe inicial.

Los efectos nuevos usan geometría procedural de Three.js y los modelos y articulaciones existentes en el proyecto.

## Cierre de la entrega

Pasaron las 352 pruebas rápidas y las 26 simulaciones de la corrida de campaña. Tras el ajuste final de formato se repitieron las 35 pruebas del laboratorio. La comprobación de tipos y la compilación de producción pasaron. Biome terminó con dos advertencias y sin errores.

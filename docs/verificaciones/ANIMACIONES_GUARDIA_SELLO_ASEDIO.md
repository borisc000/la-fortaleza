# Guardia de represalia, Sello de detonación y Disparo de asedio

18 de noviembre de 2026. Revisión de las tres habilidades en el Atelier con Chrome y Playwright. Los efectos usan geometría procedural de Three.js y las articulaciones del modelo de arquero del proyecto.

[Secuencia de las tres habilidades a media velocidad](evidencias/habilidades/animaciones.gif)

## Reproducir en el laboratorio

Abrir el modo **Habilidades completas** de `/model-lab.html`, elegir la clase y la habilidad y pulsar **Cámara de juego**. El encuadre sitúa la cámara detrás del héroe a 12 m, con 65° de campo de visión vertical, inclinación de 0,42 radianes y objetivo a 1,3 m de altura. Las capturas PNG conservan el visor completo. El GIF recorta el centro de ese encuadre y reproduce los fotogramas a media velocidad.

| Prueba | Resultado observado |
|---|---|
| Guardia de represalia, nivel 1 | [Placas cerradas](evidencias/habilidades/guardia.png) con 12 de barrera. Al expirar la protección, la [onda con las placas](evidencias/habilidades/represalia.png) alcanza tres muñecos por 48 de daño total. |
| Guardia, nivel 5, Especialización, con **Recibir golpes de prueba** | El atacante frontal deja la barrera en 12 de 24. Las [placas se separan](evidencias/habilidades/guardia-danada.png). Tras el segundo golpe se ve la [rotura anticipada](evidencias/habilidades/guardia-rota.png). Con [Represalia inmediata](evidencias/habilidades/guardia-inmediata.png) se ven a la vez la onda y la protección activa. |
| Sello de detonación, nivel 1 | Los [trazos iniciales](evidencias/habilidades/sello-inicio.png) forman un [hexágono cerrado](evidencias/habilidades/sello-cierre.png). Al [estallar](evidencias/habilidades/detonacion.png) se elevan las piezas y se registran cuatro impactos por 160 de daño. |
| Sello de detonación, nivel 10, Doble sello y Onda residual | Tras el primer estallido quedan [dos inscripciones tenues](evidencias/habilidades/sello-residual.png) hasta el [segundo pulso](evidencias/habilidades/sello-segundo.png). |
| Disparo de asedio, nivel 1 | La [flecha pesada](evidencias/habilidades/asedio.png) atraviesa la fila central. El primer disparo da tres impactos por 108 de daño acumulado. En el segundo ciclo se aprecia el tensado previo y el retroceso. Un [rombo en cada perforación](evidencias/habilidades/asedio-perforacion.png) permite seguir el paso por blancos alineados que tapan parte de la estela recta. |

El disparo inicial sale en el primer paso de combate si ya hay un blanco. En los ciclos siguientes, el arquero empieza a tensar el arco durante los últimos 0,22 s de recarga si tiene objetivo. La estela sigue el recorrido efectivo del proyectil y persiste hasta 0,18 s después del último tramo.

## Pruebas de regresión

La prueba de guardia ejercita una absorción parcial y cuenta una única onda al romperse. La de sello comprueba ambas detonaciones y la inscripción residual. La de asedio comprueba tres perforaciones y la desaparición de la estela después del proyectil.

Pasaron las 349 pruebas rápidas y las 26 simulaciones. La comprobación de tipos y la compilación finalizaron correctamente. Biome terminó con dos advertencias y sin errores.

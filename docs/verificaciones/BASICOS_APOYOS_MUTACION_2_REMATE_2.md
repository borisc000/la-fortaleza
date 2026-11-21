# Básicos con segunda mutación y segundo remate de los apoyos

Se probaron los dos cuartetos completos de cada clase. Todos los ataques estaban en nivel 10 con prioridad a expansión. En cada cuarteto, el básico pasó por sus dos combinaciones de mutación y remate. Cada apoyo llevó la segunda opción en ambos hitos.

## Habilidades equipadas

| Clase | Cuarteto | Apoyos con su mutación y remate |
| --- | ---: | --- |
| Guerrero | 1 | Torbellino (Triturador, Centro), Hachas giratorias (Órbita cerrada, Acero persistente), Guardia de represalia (Represalia inmediata, Castigo), Cadena de guerra (Cadena circular, Eslabones) |
| Guerrero | 2 | Onda de acero (Retorno, Media luna), Martillo de guerra (Cerco, Verdugo), Lanzas espectrales (Cerco, Línea de muerte), Estandarte de guerra (Bastión, Última orden) |
| Mago | 1 | Cataclismo (Fracturado, Desastre extenso), Sello de detonación (Sello hambriento, Implosión), Nova arcana (Borde cortante, Pulso defensivo), Haz rúnico (Haz partido, Foco absoluto) |
| Mago | 2 | Lanzas arcanas (Dispersión, Perforación perfecta), Orbes custodios (Órbita veloz, Guardián), Lluvia de fragmentos (Persecución, Constelación), Espejo arcano (Eco penetrante, Reflejo mayor) |
| Arquero | 1 | Salva en abanico (Cerco, Puntas abiertas), Flecha rebotadora (Rebote de duelo, Dos trayectorias), Flechas de retorno (Regreso feroz, Retorno rápido), Trampa de púas (Campo de púas, Dientes de hierro) |
| Arquero | 2 | Lluvia de flechas (Punto de caza, Flechas pesadas), Disparo de asedio (Línea devastadora, Golpe final), Baliza de caza (Terreno elegido, Marca persistente), Estacas de guardia (Pasillo, Madera astillada) |

## Lectura desde la cámara

- **Guerrero.** La media luna que regresa cruzaba el tajo con el mismo borde dorado que en la ida. Al volver pasa más baja, más inclinada y con el filo turquesa. [Cuarteto 1](evidencias/habilidades/basicos-mutacion2-remate2-c1-warrior.gif) · [Cuarteto 2](evidencias/habilidades/basicos-mutacion2-remate2-c2-warrior.gif).
- **Mago.** Cataclismo fracturado se anunciaba con un único círculo grande. Cada zona dibuja ahora su borde y su pulso en el centro y con el radio que usa el golpe. Una pared que bloquee una de las dos zonas también oculta su señal. [Cuarteto 1](evidencias/habilidades/basicos-mutacion2-remate2-c1-mage.gif) · [Cuarteto 2](evidencias/habilidades/basicos-mutacion2-remate2-c2-mage.gif).
- **Arquero.** Durante la lluvia, el cuerpo seguía apuntando hacia la zona de caída aunque el básico cambiara de blanco. Al tensar y soltar el básico gira hacia su objetivo. Disparo de asedio conserva su orientación durante su pose. [Cuarteto 1](evidencias/habilidades/basicos-mutacion2-remate2-c1-archer.gif) · [Cuarteto 2](evidencias/habilidades/basicos-mutacion2-remate2-c2-archer.gif).

## Condiciones y resultados

Cámara a 12 m, semilla 1927, afinidad de fuego de rango 1, héroe en movimiento y 37 enemigos añadidos. Se repitieron 496 pasos a 60 Hz por encuentro. El navegador equipó los ataques mediante las mejoras legales del laboratorio y elevó temporalmente el umbral de experiencia para evitar pausas. Cada GIF compara dos instantes de los primeros cuatro básicos de cada variante, con el tiempo de combate impreso.

| Mutación y remate del básico | Básicos ejecutados (C1 / C2) | Impactos del encuentro (C1 / C2) | Bajas (C1 / C2) |
| --- | --- | --- | --- |
| Barrido + Ímpetu duradero | 11 / 9 | 145 / 136 | 40 / 39 |
| Estocada + Filo maestro | 9 / 9 | 113 / 116 | 42 / 40 |
| Resonancia + Acumulación rápida | 9 / 9 | 103 / 165 | 40 / 38 |
| Concentración + Impacto arcano | 10 / 10 | 104 / 165 | 39 / 39 |
| Abanico + Precisión firme | 13 / 13 | 202 / 124 | 39 / 37 |
| Cadencia + Punta maestra | 14 / 14 | 180 / 101 | 41 / 40 |

En los doce encuentros se activaron los cuatro apoyos. Los registros antes y después coincidieron en los 108 puntos de control. Pasaron las 360 pruebas rápidas, el chequeo de tipos y la compilación. El linter terminó con tres advertencias.

También pasaron las 12 pruebas de supervivencia y las 14 de campaña. Tras interrumpirse la ejecución conjunta, se completaron las campañas por separado con las mismas pruebas por clase, ruta y afinidad.

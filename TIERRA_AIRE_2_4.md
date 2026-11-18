# Subfase 2.4 — Tierra y Aire

Fecha: 2026-11-01 · Aplicación 0.2.4.

El usuario confirmó continuar con la siguiente subfase, tras aplazar Acorazado. Se implementan Tierra y Aire primero en Guerrero, conforme al plan reajustado. Mago y Arquero conservan Fuego/Agua; su integración elemental corresponde a 2.5. Las cifras son valores iniciales de implementación, pendientes de balance jugando.

## Elección y progresión

Guerrero elige entre **Fuego, Agua, Tierra y Aire al nivel 2**, con cuatro tarjetas y nombres, símbolos y descripciones propios. Las mejoras ordinarias siguen ofreciendo hasta tres opciones. Cada clase declara únicamente sus afinidades disponibles: Mago/Arquero no pueden adquirir Tierra/Aire mediante una opción incompatible ni heredar la selección de otra clase.

Afinidades I–III conservan la conversión elemental de 30/40/50 % sin aumentar el daño directo total. Tierra y Aire tienen una maestría inicial con afinidad III y núcleo. El catálogo actual dispone de ocho combinaciones y ocho maestrías: cuatro del Guerrero y dos por cada clase a distancia. El objetivo final sigue siendo doce.

## Tierra: Quebranto, coraza y ondas sísmicas

- Espada y Torbellino aplican **Quebranto durante 3 s**. El enemigo recibe un 15 % más de daño después de armadura mientras el estado está activo. Incluye daño directo, periódico y derivado. Se renueva duración, sin acumular intensidad; el impacto que aplica por primera vez el estado aún no recibe el aumento. Funciona también contra élite y jefe.
- Acertar un espadazo concede **Coraza pétrea**: capacidad de 8/12/16 puntos según rango, duración máxima de 4 s y recarga de 6 s desde que se obtiene. Un golpe que alcanza varios enemigos solo la activa una vez. No se obtiene por los pulsos de Torbellino ni por daño derivado.
- La coraza absorbe daño entrante después de armadura, incluidos proyectiles. Consume su capacidad y deja pasar el excedente. No cura, no suma escudos y no se renueva antes de la recarga. Se conserva la protección breve normal entre impactos, incluso si el golpe queda completamente absorbido.
- **Guerrero sísmico:** cada segundo pulso de Torbellino libera una onda adicional de 8 de daño base y radio 3,2 m; tres ondas por activación. Las ondas aplican Quebranto, respetan línea libre y no producen ondas recursivas. Escalan con las mejoras generales de daño igual que Torbellino.

Quebranto muestra una marca angular bajo el enemigo. La coraza se representa con fragmentos pétreos alrededor del héroe y un indicador de capacidad/duración/recarga. Las ondas usan anillos hexagonales; no crean objetos sólidos ni bloquean rutas.

## Aire: alcance, empuje y remolino

- La espada gana 0,35/0,55/0,75 m de alcance según rango: alcance total 2,35/2,55/2,75 m, más radio del enemigo. Conserva el arco de ataque del Guerrero. Alcance y afinidad se guardan al preparar el golpe.
- Un espadazo empuja 0,35/0,50/0,65 m antes de resistencia. Hay una protección por objetivo de 0,75 s entre desplazamientos iniciados por la espada.
- Torbellino atrae 0,14/0,20/0,26 m por pulso antes de resistencia; protección de 0,4 s entre desplazamientos. Empuje y atracción comparten el temporizador por objetivo, evitando aplicarse sin límite en el mismo instante.
- La atracción se detiene a la suma de radios del héroe y enemigo más 0,08 m: no arrastra al enemigo a través del centro del jugador.
- **Guerrero del vendaval:** Torbellino alcanza 3,25 m de radio (+25 %) y atrae 0,45 m por aplicación antes de resistencia. Conserva seis pulsos, duración de 2,4 s y recarga de 20 s desde el final.
- Resistencias: normales 100 %, élite 40 %, jefe 0 %. El viento no cancela preparaciones enemigas, aturde ni cambia la cámara. No aplica Empapado ni Quebranto.

Empujes y atracciones usan desplazamiento subdividido con colisiones y límites del mapa, además de línea libre. Aire se representa con tajos extendidos, arcos de ráfaga y espirales elevadas; su diferencia con Agua no depende solo del color.

## Integración y límites

`content/elements.ts` contiene los cuatro elementos y Quebranto; `content/classes/warrior.ts`, las cifras y textos del Guerrero. `WarriorKit` propone la coraza y ondas, y guarda el alcance de Aire. `WarriorEffects` aplica estados y movimientos. El motor común resuelve mitigación, consumo de protección, daño, muerte y recompensas.

Pausar por nivel/tienda congela estados, coraza y recargas. La muerte o retirada limpia Quebranto; el fin de partida cancela la coraza. Una expedición nueva comienza sin estados ni poderes heredados. Los efectos visuales son limitados y no aplican daño por sí mismos.

El mapa, las reglas de Fuego/Agua y las clases a distancia mantienen su alcance previo. Comprobaciones y límites en [VERIFICACION_2_4.md](VERIFICACION_2_4.md). Siguiente: **2.5 · Afinidades de las tres clases**, completando Tierra/Aire en Mago y Arquero.

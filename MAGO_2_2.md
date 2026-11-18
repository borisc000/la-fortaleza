# Subfase 2.2 — Mago jugable

Fecha: 2026-11-01 · Aplicación 0.2.2.

Implementación de la siguiente entrega autorizada con «Sigue con lo siguiente». Las cifras son decisiones iniciales de balance, pendientes de valoración jugando.

## Identidad y selección

- Segunda clase disponible junto al Guerrero. El selector aparece al abrir el juego; no comienza el combate hasta pulsar Entrar.
- El Mago elige **Fuego o Agua antes de la expedición** y comienza con afinidad I. En nivel 2 ya recibe mejoras; no repite la elección de elemento.
- 80 de vida, sin armadura, velocidad base de 5 m/s, hasta 6,5 con mejoras. Radio y altura corporal conservados.
- Túnica, capucha y báculo procedurales provisionales. Proyectiles naranjas o azules, círculo de anticipación y pulsos de área. Animación de lanzamiento propia; sin giro de Torbellino.
- Desde pausa o resultados se puede iniciar una nueva expedición y elegir clase/afinidad. Reiniciar conserva la selección y restablece vida, cargas, compras y progresión.
- WASD, cámara con movimiento del mouse y rueda, controles táctiles y combate completamente automático conservados. No se apunta con la cámara ni se pulsan habilidades.

## Ataque y pasiva

El proyectil elemental selecciona un objetivo visible a 10 m (más su radio), prepara 0,18 s, inflige 24 de daño y tiene cadencia de 0,9 s. Viaja en dirección fija a 16 m/s; puede fallar si el enemigo se desplaza. Impacta al primer enemigo y se destruye en obstáculos. Dura como máximo 1,2 s, con límite de 32 proyectiles.

**Acumulación arcana:** tres disparos liberados acumulan tres cargas sin caducidad. El cuarto las consume: +60 % de daño y explosión de radio 1,7 m alrededor del impacto, con el mismo daño a los enemigos alcanzables. No atraviesa paredes ni golpea dos veces al objetivo inicial. Los fallos cuentan como lanzamientos; Cataclismo no suma cargas.

Los disparos guardan daño, afinidad, rango y maestría al prepararse; una mejora elegida durante su vuelo no cambia retroactivamente el disparo.

## Cataclismo automático

Se activa con un enemigo visible a alcance cuando está listo, después de terminar un lanzamiento en curso. Marca la posición del objetivo en ese instante: la zona no sigue al enemigo ni al héroe. Permite seguir caminando, pero suspende nuevos disparos mientras está activo; los proyectiles ya liberados continúan.

- Aviso: 0,65 s.
- Radio: 3,2 m.
- Tres pulsos de 18 de daño, separados por 0,35 s.
- Duración total: 1,70 s, incluida recuperación.
- Recarga: 14 s desde el final.
- Daño y afinidad guardados al activarse. Pulsos con línea libre desde el centro; no dañan apariciones durante su aviso.

## Afinidades y maestrías

Todo el daño directo del Mago es elemental. Los rangos II/III aumentan un 10/20 % el daño respecto a I, además de las mejoras generales de daño. La armadura sigue mitigando daño físico y elemental por igual en este prototipo.

| Afinidad | Efecto | Maestría con afinidad III y núcleo |
|---|---|---|
| Fuego | Quemadura de 3 s; cada segundo inflige un 20 % del daño bruto del impacto. Se conserva la mayor potencia y se renueva duración, sin acumular quemaduras. | **Erupción mayor:** cinco pulsos de Cataclismo; duración total 2,40 s. |
| Agua | Empapado durante 3 s y ralentización del 15 %, ajustada por la resistencia del enemigo. Los orbes no empujan. | **Marea creciente:** radio de Cataclismo de 4 m y empuje de 0,55 m desde el centro, ajustado por resistencia y respetando colisiones. Protección de 0,3 s entre empujes. |

La explosión del cuarto orbe es parte de la pasiva, disponible para ambos elementos desde el principio. El Mago no hereda explosiones de muerte ni salpicaduras del Guerrero. Tierra/Aire y segunda afinidad siguen en sus subfases previstas.

## Integración

Contenido en `game/src/content/classes/mage.ts`; decisiones de combate en `domain/classes/mage-kit.ts`; estados elementales en `mage-effects.ts`. El motor compartido conserva daño, protección, muerte y recompensa únicos. Representación en `rendering/mage.ts` y `mage-spells.ts`.

Las pausas por mejoras y tienda congelan proyectiles, habilidad, cargas y reloj. Derrota/victoria cancelan hechizos. No se cambian mapa, encuentros, economía ni reglas del Guerrero. Validación y límites en [VERIFICACION_2_2.md](VERIFICACION_2_2.md). Próxima entrega: **2.3, Arquero**.

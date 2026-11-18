# Subfase 2.3 — Arquero jugable

Fecha: 2026-11-01 · Aplicación 0.2.3.

Autorización: «Na sigamos como teniamso pensado. Dale con el arquero». Se conserva la secuencia del plan; no se insertan las subfases de pulido propuestas. Las cifras siguientes son decisiones iniciales de implementación, pendientes de evaluación jugando.

## Identidad y selección

- Tercera clase disponible: Guerrero, Mago y Arquero. Actualización de alcance: Acorazado aplazado; la nueva 2.4 es Tierra y Aire.
- 90 de vida, sin armadura, velocidad de 5,2 m/s; hasta 6,7 con mejoras. Radio 0,4 m y altura corporal 1,86 m.
- Comienza con flechas físicas. En nivel 2 elige Fuego o Agua; el elemento elegido previamente para el Mago no se hereda al cambiar de clase.
- Arco curvo con cuerda, carcaj, flechas y equipo ligero procedurales. Animaciones de marcha, preparación y suelta provisionales.
- Todo el combate es automático. La cámara no apunta las flechas; el jugador usa posición y movimiento para alinear enemigos. Mapa, controles, tienda, captura y ciclo de seis minutos más jefe conservados.

## Flechas y Precisión

Ataque base de 22 de daño, alcance de 12 m más el radio del objetivo, preparación de 0,16 s y cadencia de 0,65 s. La dirección queda fijada al preparar el disparo; un blanco en movimiento puede esquivarlo. La flecha viaja a 24 m/s, con radio 0,09 m, duración máxima 0,9 s y límite de 32 proyectiles activos.

**Precisión** premia flechas que realmente alcanzan enemigos:

| Cargas al preparar el disparo | Máximo de enemigos atravesados |
|---:|---:|
| 0 | 1 |
| 1 | 1 |
| 2 | 2 |
| 3 | 3 |

Cada flecha concede una sola carga al primer impacto, aunque atraviese varios enemigos. El daño no disminuye entre blancos, cada enemigo recibe un impacto directo por flecha y el vuelo continúa en línea recta. No rebota ni busca otros objetivos.

La racha termina al pasar cuatro segundos sin acertar o al desaparecer una flecha sin haber golpeado a ningún enemigo, por obstáculo o caducidad. Una flecha que golpea antes de chocar con un muro sí cuenta como acierto. Los fallos se resuelven cuando termina el vuelo; un proyectil antiguo fallado puede romper una racha más reciente. Los disparos guardan daño, afinidad, rango, maestría y penetración al prepararse.

## Lluvia de flechas

Se activa automáticamente con un objetivo visible a alcance, después del disparo en preparación. Marca una zona fija en la posición del objetivo, sin seguir al jugador ni al enemigo.

- Aviso de 0,6 s y radio de 3,5 m.
- Cuatro descargas de 14 de daño, separadas por 0,35 s.
- Duración de 2 s, incluida recuperación. Recarga de 16 s desde el final.
- El Arquero puede caminar; durante la habilidad no prepara flechas nuevas. Las que estaban en vuelo continúan.
- Los pulsos requieren línea libre desde el centro, respetan los avisos de aparición y no generan Precisión. Daño y afinidad se guardan al activarse.
- Representación con círculo y flechas descendentes; las flechas visuales no aplican daño por separado.

## Afinidades y maestrías

Los rangos I/II/III convierten 30/40/50 % del daño directo al elemento elegido, conservando el total. La armadura sigue mitigando ambos componentes por igual en este prototipo. Las mejoras generales de daño aumentan flecha y lluvia; la salpicadura tiene valores propios por rango.

| Afinidad | Efecto | Maestría con afinidad III y núcleo |
|---|---|---|
| Fuego | Flechas y lluvia aplican quemadura de 3 s. Daño por segundo equivalente al 20 % de la parte elemental del impacto; conserva la mayor potencia y renueva duración, sin apilar quemaduras. | **Lluvia incendiaria:** seis descargas; duración 2,7 s. |
| Agua | Flechas y lluvia aplican Empapado 3 s y ralentización del 15 %, modificada por resistencia del enemigo. El primer impacto de cada flecha libera salpicadura de radio 1,2 m y daño 6/8/10 a enemigos próximos distintos del blanco principal. | **Diluvio perforante:** radio de lluvia 4,2 m y salpicaduras de 1,8 m. |

Una flecha perforante solo salpica una vez. Un enemigo puede recibir esa salpicadura y después el impacto directo si también está alineado. Los efectos no atraviesan paredes ni producen cadenas recursivas; los pulsos de lluvia no generan salpicaduras adicionales. No hay empuje ni explosiones de muerte propios del Guerrero/Mago.

## Integración

Datos en `game/src/content/classes/archer.ts`; reglas en `domain/classes/archer-kit.ts` y `archer-effects.ts`; representación en `rendering/archer.ts` y `archer-arrows.ts`. Temporizadores y limpieza de estados elementales compartidos con Mago en `domain/status-effects.ts`, conservando sus reglas.

El motor común conserva vida, protección, muertes y recompensas. Las pausas de mejoras y tienda congelan flechas, Precisión, lluvia y reloj. Derrota/victoria cancelan acciones; reiniciar crea un kit nuevo y conserva solo la clase seleccionada. El HUD muestra cargas, límite de blancos y tiempo de racha; los sonidos distinguen arco y lluvia.

Ver [VERIFICACION_2_3.md](../verificaciones/VERIFICACION_2_3.md). Próxima entrega según el plan reajustado: **2.4 · Tierra y Aire**.

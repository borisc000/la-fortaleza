# Subfase 2.6 — Técnicas y espacios de configuración

Fecha: 2026-11-01 · Aplicación 0.2.6.

Doce técnicas: cuatro de Guerrero, cuatro de Mago y cuatro de Arquero. Alteran el kit automático existente, son independientes del elemento y duran una expedición. Acorazado sigue aplazado. Los valores son decisiones iniciales de implementación; balance humano pendiente.

## Aprendizaje y límites

- Tres espacios, inicialmente vacíos. Aprender una técnica consume una elección de nivel y un espacio. Mejorarla consume otra elección y conserva el mismo espacio.
- Tres rangos, con requisitos mínimos de nivel 3, 5 y 7. Se comprueba el nivel de la elección que se está resolviendo, no el último nivel acumulado al recoger mucha esencia.
- Con tres técnicas aprendidas, la cuarta queda excluida de la expedición. No hay sustituciones ni reembolsos en esta entrega. El jugador puede consultar las cuatro opciones y sus requisitos durante las elecciones.
- La primera afinidad y la maestría mantienen sus elecciones propias. En las mejoras normales se reserva una oferta de técnica elegible y las restantes para afinidad/mejoras generales; si faltan generales, se muestran más técnicas elegibles, hasta tres tarjetas.
- Las ofertas rotan de forma determinista por nivel y clase. No ofrecen técnicas ajenas, rangos máximos, mejoras prematuras ni una cuarta técnica. Si no queda ninguna mejora elegible, se conserva la compensación de curación del 25 % de vida máxima.
- Las renovaciones de opciones y la pantalla completa de preparación siguen en 2.9. Reliquias, sustitución de premios provisionales y doble afinidad siguen en 2.7.

## Catálogo

Los incrementos son totales por rango, no sumas de los rangos anteriores.

| Clase | Técnica | Rango I / II / III |
|---|---|---|
| Guerrero | Barrido | +30° / +60° / +90° de arco de espada |
| Guerrero | Estocada | +0,35 / +0,70 / +1,05 m de alcance de espada |
| Guerrero | Guardia firme | −10 / −15 / −20 % de daño recibido, antes de consumir coraza |
| Guerrero | Giro prolongado | +2 / +3 / +4 pulsos de Torbellino; +0,8 / +1,2 / +1,6 s de duración |
| Mago | Eco arcano | Segundo proyectil tras 0,12 s al 35 / 50 / 65 % del daño base del lanzamiento |
| Mago | Resonancia | +0,4 / +0,7 / +1 m de radio a la explosión del cuarto proyectil |
| Mago | Concentración | −10 / −17 / −24 % del intervalo de lanzamiento básico |
| Mago | Convergencia | +10 / +20 / +30 % de radio de Cataclismo |
| Arquero | Abanico | Dos flechas laterales al 35 / 50 / 65 % del daño de la central |
| Arquero | Punta larga | +1 / +2 / +3 blancos atravesados por la flecha central |
| Arquero | Cadencia | −8 / −16 / −24 % del intervalo de disparo básico |
| Arquero | Lluvia extensa | +10 / +20 / +30 % de radio de Lluvia de flechas |

## Interacciones

**Guerrero.** Barrido amplía el arco de 120° hasta 210°; sigue comprobando alcance y paredes, una vez por blanco. Estocada se suma al alcance de Aire. Giro prolongado se suma a los pulsos y duración de la maestría de Fuego; con rango III alcanza doce pulsos. La maestría de Tierra sigue creando una onda cada dos pulsos, por lo que puede generar más ondas con esta técnica. La recarga empieza al terminar la duración ampliada. Guardia firme mitiga golpes y proyectiles antes de la absorción de coraza; no cura ni da invulnerabilidad.

**Mago.** Eco arcano conserva origen y rumbo del lanzamiento; no sigue al jugador durante su retraso. Tiene identificador y colisiones propios. Hereda el elemento y su daño base con mejoras, pero nunca la bonificación del cuarto proyectil, su explosión ni una carga arcana. Tampoco crea una segunda coraza. Puede aplicar los estados elementales normales, respetando la protección entre empujes. Resonancia amplía solo la explosión potenciada, no Cataclismo. Convergencia multiplica el radio después de aplicar la maestría.

**Arquero.** Abanico lanza a ±0,16 radianes del disparo central. Cada lateral alcanza un solo enemigo y aplica su afinidad, pero acertar o fallar con ella no altera Precisión; la central mantiene las reglas habituales. Punta larga se suma a Precisión y Aire; máximo actual de ocho blancos con ambas técnicas/maestría al máximo. Las flechas siguen trayectorias rectas y se detienen ante paredes. Lluvia extensa multiplica el radio después de la maestría; no añade descargas.

Los proyectiles adicionales cuentan para el mismo máximo de 32. Si falta capacidad, se omiten extras; nunca se supera el límite. No hay efectos recursivos que generen nuevos ecos o abanicos. Ataques y proyectiles conservan la configuración fijada al prepararse; las áreas guardan radio, duración y pulsos al iniciarse. Las mejoras se aplican a las siguientes acciones. Pausa, tienda, elección, derrota y reinicio conservan el tratamiento común.

## Presentación y arquitectura

HUD con tres espacios y rangos; tarjetas de aprendizaje/mejora; catálogo desplegable con cuatro opciones, requisitos y exclusión; resumen de técnicas en resultados. Barrido muestra su arco real, Estocada su alcance, el eco aparece pequeño después del retraso, Abanico dibuja sus trayectorias y las áreas usan sus radios ampliados.

Catálogo y cifras en `game/src/content/techniques.ts`; elegibilidad y rangos en `Progression`; ejecución en kits de clase y mitigación en `Combat`. Los nuevos resúmenes se construyen desde el estado real. No se calcula daño en renderizado. Sin recursos externos nuevos ni nuevos controles manuales.

Ver [verificación](VERIFICACION_2_6.md). Siguiente: **2.7 · Reliquias y doble afinidad**. Se mantienen cuatro fases, 42 subfases, 6/9 entregas de fase 2 y 23 subfases futuras.

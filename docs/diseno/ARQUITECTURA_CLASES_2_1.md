# Estructura compartida de clases — 2.1

Fecha: **2026-11-01** · Aplicación **0.2.1**.

## Responsabilidades

| Parte | Responsabilidad | Archivo principal |
|---|---|---|
| Definición | Identidad, estadísticas, cuerpo, arma, ataque básico, nombres de pasiva/habilidad y textos de afinidad/maestría | `game/src/content/class-definition.ts` |
| Datos del Guerrero | Valores inmutables y parámetros propios de Ímpetu, Torbellino y sus efectos elementales | `game/src/content/classes/warrior.ts` |
| Catálogo | Enumerar únicamente clases implementadas; rechazar identificadores no disponibles | `game/src/content/classes.ts` |
| Implementación por clase | Crear un kit y un conjunto de efectos nuevos para cada partida | `game/src/domain/classes.ts` |
| Contratos de habilidades | Estado por instancia, temporizadores, decisiones automáticas, propuestas de impactos, fin de paso y cancelación | `game/src/domain/hero-kit.ts` |
| Kit del Guerrero | Elegir blanco, preparar espada, acumular Ímpetu y activar/pulsar Torbellino | `game/src/domain/classes/warrior-kit.ts` |
| Efectos del Guerrero | Quemadura, Empapado, empuje, explosión y salpicadura propios del kit | `game/src/domain/classes/warrior-effects.ts` |
| Motor común | Enemigos, colisiones, armadura, resolución de impactos, protección, muertes y eventos de recompensa | `game/src/domain/combat.ts` |
| Partida común | Director, élite/jefe, progresión, recogibles, captura, tienda, derrota y victoria | `game/src/domain/run.ts` |
| Representación | Resolver el modelo de personaje; el mundo recibe su vista y dimensiones | `game/src/rendering/hero.ts` |

La definición está separada de los estados mutables. Dos expediciones pueden compartir datos congelados, pero nunca recargas, golpes activos, acumulaciones, salpicadura, mejoras ni existencias de tienda.

## Orden de un paso de combate

1. Avanzar reloj/protección y temporizadores del kit.
2. Actualizar rutas, efectos periódicos y proyectiles existentes.
3. Mover enemigos y preparar/liberar sus acciones.
4. Pedir al kit las propuestas de impactos del personaje.
5. Reunir los impactos enemigos válidos del mismo paso.
6. Aplicar armadura, daño y efectos; resolver muertes y recompensas una sola vez.
7. Cerrar la habilidad terminada y cancelar acciones al acabar el encuentro. La derrota conserva prioridad en empates.

El kit no actualiza saldo, experiencia ni resultados de partida. Sus impactos pasan por el mismo motor que ya resuelve el Guerrero. Conserva una única secuencia de identificadores de eventos/ataques y el orden anterior para no alterar resultados de semillas existentes.

## Conexión con otros sistemas

- `Run(bounds, solids, seed, classId)` resuelve datos e implementación. El identificador predeterminado sigue siendo `warrior`.
- Vida, armadura y protección proceden de la clase; velocidad base/máxima, radio, altura y giro también. El paso fijo de simulación permanece global a 1/60 s.
- El radio de clase se transmite a colisiones de proyectiles enemigos, navegación de refuerzos, colocación accesible de objetos y avisos de proyectiles. El movimiento usa las dimensiones y velocidad efectiva de la clase.
- Progresión conserva sus reglas y rangos. Usa la velocidad de la clase y sus textos de afinidad/maestría. Tienda y elección de mejoras comparten las descripciones del arma/habilidad de esa clase.
- La interfaz obtiene los nombres de clase, pasiva y habilidad de la definición. La identidad de Fuego/Agua conserva nombres y colores comunes; las maestrías dejan de estar en esa tabla global.
- `world.hero` es la vista de personaje utilizada por la aplicación. Se conserva `world.warrior` como alias de compatibilidad para las pruebas históricas.

## Incorporación del Mago en 2.2

Crear su definición, kit automático, efectos y representación; registrarlos en los dos catálogos y en la fábrica de vista. Añadir las señales visuales/sonoras y las capacidades de proyectil aliado/área que use realmente. La selección temprana de afinidad del Mago se concretará en esa subfase. Reutilizar el director, experiencia, núcleo, compras, captura, victoria y reinicio; no copiar `Run` ni el motor completo de combate.

Actualmente **solo Guerrero es jugable**. Mago, Arquero y Acorazado tienen identificadores reservados, pero no entradas ficticias ni una sustitución silenciosa por Guerrero. No se añade aún selector de clases, catálogo de técnicas adicionales ni árbol genérico de habilidades. Las técnicas y sus límites se desarrollan en 2.6–2.7 según la numeración actualizada al aplazar Acorazado.

## Compatibilidad y límites

Los nombres de acceso `combat.impetusStacks`, `combat.whirlwind` y equivalentes delegan al estado del kit para conservar presentación y pruebas existentes. Los valores exportados `HERO_COMBAT`, `IMPETUS`, `WHIRLWIND` y `PLAYER` son alias derivados de los datos del Guerrero, no segundas copias editables. `domain/elements.ts` conserva una reexportación de compatibilidad.

Las vistas y señales de espada/Torbellino siguen siendo específicas del único personaje disponible. No se afirma que crear un registro de datos baste para implementar todas las futuras mecánicas: cada clase necesitará sus ataques y su presentación. Los contratos actuales cubren las acciones en uso y se ampliarán cuando la siguiente clase lo requiera.

## Extensión 2.2

Mago incorporado al catálogo con MageKit y MageEffects. HeroKitState admite proyectiles propios y AreaAction un centro fijo opcional. HeroHit puede indicar el origen del área para empujes; Combat continúa aplicando daño, muertes y recompensas. La afinidad inicial se valida al crear Progression/Run del Mago. El selector reemplaza solo el héroe y su vista de combate, reutilizando el escenario. Se conserva la interfaz anterior y la referencia de trazas del Guerrero. Ver MAGO_2_2.md.

## Extensión 2.3

Arquero registrado con ArcherKit, ArcherEffects y representación propia. Sus proyectiles extienden el estado común con identificadores ya golpeados y máximo de blancos; precisión se actualiza por flecha acertada, no por blanco atravesado. Attack admite penetración guardada al preparar el disparo. MageEffects y ArcherEffects comparten temporizadores, quemadura y limpieza de estados mediante status-effects.ts; no comparten reglas de habilidad ni salpicadura. El render del Mago filtra por clase para evitar dibujar flechas como orbes. El motor común sigue resolviendo daño, muerte y recompensa. Ver ARQUERO_2_3.md.

## Ajuste de alcance posterior a 2.3

Acorazado queda aplazado. Su identificador reservado no habilita una clase jugable ni compromete una entrega. El catálogo activo sigue ofreciendo Guerrero, Mago y Arquero; no hace falta modificar el código para este ajuste documental. Próxima subfase: 2.4 Tierra y Aire.

## Extensión 2.4

Element incluye Tierra y Aire. Las definiciones de clase solo declaran afinidades disponibles; Progression filtra opciones y classAffinity valida el acceso a sus textos. HeroKitState admite una barrera de capacidad/duración y su recarga; Combat consume la capacidad después de armadura y aplica Quebranto al daño posterior. Attack guarda el alcance ampliado de Aire. WarriorKit activa la protección y ondas; WarriorEffects aplica Quebranto y desplazamientos con colisiones. Los campos nuevos de enemigos son opcionales para conservar trazas anteriores. Ver TIERRA_AIRE_2_4.md.

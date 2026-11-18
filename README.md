> Estado vigente: **E1 completada, aplicación 0.2.15; siguiente E2.1 antes de 2.8**. Las tres clases tienen ocho habilidades, cuatro espacios y niveles hasta 10. Plan: 49 subfases, 22 futuras.

Ver [ritmo y economía 2.7.6](RITMO_2_7_6.md).

# MVP de fantasía oscura — documentación de desarrollo

Nombre de trabajo: **Dark Fantasy MVP**. El nombre definitivo está pendiente.

Actualizado: **11 de noviembre de 2026**.

## Lectura para comenzar

1. [Diseño y alcance del MVP](DISENO_MVP.md): decisiones del usuario, reglas propuestas y límites.
2. [Plan de desarrollo: 4 fases y 49 subfases](PLAN_DESARROLLO.md): trabajo, dependencias y criterios de cierre.
3. [Contrato de la subfase 1.1](CONTRATO_1_1.md): controles confirmados, reglas implementables, arquitectura y objetivos de rendimiento.
4. [Estado y siguiente entrega](ESTADO.md): avance real y punto de reanudación.
5. [Dirección artística 1.2](DIRECCION_ARTISTICA_1_2.md): preferencias confirmadas y referencias visuales en exploración.
6. [Ampliación 1.9.1–1.9.3](EXPANSION_1_9.md): mapa, hordas locales e interacciones. [Guerrero 2.7.3b](GUERRERO_HABILIDADES_2_7_3B.md): repertorio integrado y siguiente desarrollo.

Las subfases 1.1/1.2 están definidas; el núcleo de juego, sus ampliaciones, tres clases, afinidades, reliquias y doble afinidad están implementados. Aplicación actual **0.2.15**: Guerrero con cuatro espacios de habilidades y niveles hasta 10; Mago/Arquero también usan los nuevos árboles. Territorio 280 × 260 m, quince regiones, cámara 12 m/rueda 4–18, captura, mercader, cofres, fuentes, élite y jefe. Ver [verificación de esta entrega](VERIFICACION_E1_4.md) para distinguir pruebas automáticas, revisión visual y límites.

Consultar [ejecución y controles](game/README.md), [registro de verificación 2.7](VERIFICACION_2_7.md) y [procedencia de los recursos](game/CREDITOS.md). El servidor de desarrollo se sirve en `http://127.0.0.1:5183/` cuando está ejecutándose `npm run dev`.

## Decisiones vigentes

La ampliación [2.7.1–2.7.6](COMBATE_MASIVO_2_7.md) está integrada con balance inicial. Repertorios de las tres clases, cámara/mapa ampliados y hordas densas integrados. R manual pendiente.

Siguiente trabajo: **E2.1, puerta y dos torres de Los dominios exteriores**, antes de retomar 2.8. E1.1 amplía el mapa y traslada la llegada al sur; E1.2 construye rutas y seis sectores; E1.3 adapta interacciones y apariciones; E1.4 verifica recorrido y combate con las tres clases. Ver [plan del escenario](PLAN_DOMINIOS_EXTERIORES.md) y [cierre E1.4](VERIFICACION_E1_4.md). Plan de 49 subfases, 22 futuras. Balance humano, GPU y teléfono siguen pendientes.

- Juego web de fantasía oscura, inspirado en la estructura de un survivor como PokéBonk, con identidad y recursos propios.
- Tres clases iniciales: **Guerrero, Mago y Arquero**. Acorazado queda aplazado, fuera del alcance actual.
- Cuatro elementos iniciales: **Fuego, Agua, Tierra y Aire**.
- Primer escenario: **alrededores de un castillo-fortaleza**, con una posible incursión breve en su interior. El exterior es el centro del mapa.
- La clase conserva su identidad; los elementos modifican sus ataques, habilidades y progresión durante la partida.
- PC primero; celular en horizontal. WASD y ratón para girar una cámara de tercera persona detrás del héroe.
- Ataque básico y todas las habilidades automáticos. En móvil: joystick izquierdo y arrastre derecho para mirar. No hay botón de definitiva.

Las propuestas antiguas de Hielo, Tormenta y Sombra como elementos iniciales quedan sustituidas. El Acorazado (antes llamado «Guardián») queda conservado como idea futura, sin reincorporación automática. No usar documentos o mensajes anteriores para reintroducir esos nombres o elementos como parte del MVP.

## Forma de trabajo

- Desarrollar de forma acumulativa: conservar lo que funciona y añadir una subfase comprobable cada vez.
- Distinguir entre implementado, verificado y revisado por el usuario.
- Actualizar ESTADO.md al cerrar una entrega, incluyendo cambios, comprobaciones y problemas pendientes.
- Los criterios de cierre describen resultados que hay que demostrar; no son afirmaciones de que ya se cumplan.
- Este plan no exige pedir aprobación por cada tarea técnica. Las decisiones de producto aún abiertas se resuelven en su subfase correspondiente; los cambios materiales de alcance se hacen explícitos.
- Antes de reutilizar código de otros prototipos, revisar sus instrucciones y dependencias. Trabajar en un proyecto independiente, conservando los anteriores.


## Idea narrativa para después

[Campaña por eras y etapas](IDEA_CAMPANA_ERAS.md), registrada el 2026-11-02: cada era reúne tres a cinco etapas. Era I: establecer el reino recuperando exterior, interior y defendiendo la fortaleza. El escenario actual puede representar su primera etapa. Es una propuesta futura; no añade implementación ni cambia los recuentos del plan. Próxima entrega técnica: 2.7.3.

## Hordas 2.7.5

Mayoría de no muertos frágiles, objetivos locales de 20/40/60/90 y límite provisional de 100 vivos. Avisos y recompensas únicos, captura con presupuesto compartido. Ver [entrega](HORDAS_2_7_5.md) y [verificación](VERIFICACION_2_7_6.md).

## Laboratorio de modelos

Abrir [Atelier](http://127.0.0.1:5183/model-lab.html) con el servidor iniciado. Catálogo de 16 modelos/conjuntos, giro, zoom, malla, iluminación y notas por modelo exportables. [Alcance y verificación](LABORATORIO_MODELOS.md).

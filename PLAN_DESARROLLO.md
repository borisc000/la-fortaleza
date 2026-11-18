# Plan de desarrollo del MVP

**4 fases · 49 subfases · Versión 0.11 · 2026-11-04**

Fuente de alcance: [DISENO_MVP.md](docs/diseno/DISENO_MVP.md). Estado real: [ESTADO.md](ESTADO.md).

Las **1.1 y 1.2 están definidas**. **1.3–1.10 y las inserciones 1.9.1–1.9.3 están implementadas**, sin bloquear el avance por revisión técnica interactiva del agente pendiente. Las 2.1–2.7 incorporan tres clases, doce combinaciones principales, doce técnicas, doce reliquias y doble afinidad; ver VERIFICACION_2_7.md. Quedan **22 subfases futuras**, dos en fase 2 y diez en cada fase posterior; la revisión manual de 1.10 sigue pendiente. Los controles vigentes son WASD, cámara en tercera persona girada con ratón y combate completamente automático; PC primero y celular horizontal.

## Ajuste de alcance — Acorazado aplazado

Por petición del usuario, Acorazado queda fuera del alcance actual, sin fecha de reincorporación ni desbloqueo sustituto. Se trabaja con Guerrero, Mago y Arquero. Cuatro elementos × tres clases = **12 combinaciones básicas y 12 maestrías**; cuatro técnicas por clase = **12 técnicas**. Se conservan las 12 reliquias y el Sacerdote acotado de 3.9.

Se retira la antigua 2.4 (Acorazado). Las antiguas 2.5–2.10 pasan a 2.4–2.9: Tierra/Aire, afinidades, técnicas, reliquias/doble afinidad, maestrías y preparación/balance, respectivamente. Las entregas 2.1–2.3 y las fases 1, 3 y 4 conservan sus identificadores. Los registros históricos pueden citar la numeración anterior; rige este plan actualizado. La numeración de este ajuste histórico se conserva. Con la ampliación de combate del 2026-11-02, total vigente: **49 subfases, 22 pendientes**.

## Ampliación vigente — combate masivo y elecciones

Se insertan **2.7.1–2.7.6 antes de 2.8**, sin renumerar entregas existentes. Regla del usuario: cada oportunidad permite competir entre estadísticas, mejorar habilidades y aprender habilidades de clase; no se desbloquea una habilidad obligatoria a los 30–45 segundos. Hasta cuatro habilidades automáticas contando la inicial como propuesta de trabajo. El catálogo y migración están definidos en [HABILIDADES_2_7_1.md](docs/diseno/HABILIDADES_2_7_1.md): ocho habilidades por clase, nivel 10, cuatro ramas de tres rangos y dos hitos excluyentes. Básico y pasiva aparte. R manual pendiente, fuera de esta implementación. Cámara, mapa y densidad se revisan juntos. [Alcance y valores de prueba](docs/diseno/COMBATE_MASIVO_2_7.md).

La antigua 2.7.3 se sustituye por **2.7.3a y 2.7.3b**, por petición del usuario. Ambas entregadas; 2.7.4 y 2.7.5 también implementadas. 2.7.6 integrada con balance inicial. Siguiente 2.8. Total vigente: **49 subfases y 22 futuras**.

## Convenciones

### Trabajo de escenario definido el 11 de noviembre de 2026

Antes de retomar 2.8 se establece el [plan de Los dominios exteriores](docs/diseno/PLAN_DOMINIOS_EXTERIORES.md), con fases E0–E6 y cuatro subfases por fase. **E0 completada**: [evaluación y plano](docs/diseno/EVALUACION_DOMINIOS_E0.md) definen 280 × 260 m, llegada sur y seis sectores. **E1.1 completada:** límites y llegada implementados, con [verificación](docs/verificaciones/VERIFICACION_E1_1.md). **E1.2 completada:** rutas y seis sectores construidos con geometría sencilla, con [verificación](docs/verificaciones/VERIFICACION_E1_2.md). **E1.3 completada:** interacciones y apariciones adaptadas, con [verificación](docs/verificaciones/VERIFICACION_E1_3.md). **E1.4 completada:** recorridos con combate, límites y cámara revisados, con [evidencias](docs/verificaciones/VERIFICACION_E1_4.md). Sigue E2.1, puerta y torres como muestra de acabado; después, materiales, terreno, sectores, integración de encuentros y cierre. E2–E6 pendientes. Este plan específico conserva la numeración y los contadores del MVP.

- Orden de referencia: secuencial. Dentro de una subfase se pueden agrupar tareas compatibles.
- Inserción tras 1.9: **1.9.1 → 1.9.2 → 1.9.3 → 1.10**. Se conservan los identificadores posteriores; cada inserción cuenta como una entrega adicional. Reglas detalladas en [EXPANSION_1_9.md](docs/diseno/EXPANSION_1_9.md).
- La fase 2 depende del cierre del núcleo de fase 1; fase 3 del sistema de clases y configuraciones; fase 4 del ciclo completo.
- Cada cierre registra qué se implementó, cómo se verificó y qué falta.
- Rendimiento, controles táctiles, claridad y pruebas de reglas se trabajan desde que aparece el sistema correspondiente. La fase 4 los consolida.
- Los valores de balance permanecen en datos editables. Evitar añadir contenido para compensar un núcleo que todavía no funciona bien.

## Fase 1 — Primera partida completa y entretenida

**Alcance:** Guerrero, Fuego y Agua, exterior ampliado de la fortaleza, hordas alrededor del jugador y primeras interacciones de exploración, dentro de un ciclo completo de prueba.

### 1.1 · Contrato del prototipo y arquitectura
- **Estado:** definición completada en [CONTRATO_1_1.md](docs/diseno/CONTRATO_1_1.md). Controles elegidos expresamente por el usuario; reglas y cifras iniciales documentadas para validar al implementar.
- **Trabajo:** convertir las hipótesis del diseño en reglas implementables; definir movimiento, selección de objetivos, daño, estados, recarga y configuración de partida. Elegir orientación y dispositivos de referencia; fijar presupuesto de rendimiento y estructura de módulos.
- **Entrega y cierre:** decisiones concretas, alcance de la primera partida y comprobaciones previstas. Identificar qué código se puede reutilizar sin modificar prototipos anteriores.

### 1.2 · Dirección artística
- **Estado:** definición completada. Estilo común aceptado; imagen 3 como referencia operativa. Muestra de Agua, paleta, encuadre y especificación del enemigo documentados; recursos 3D todavía por producir/seleccionar. Ver [DIRECCION_ARTISTICA_1_2.md](docs/diseno/DIRECCION_ARTISTICA_1_2.md).
- **Trabajo:** definir Guerrero, enemigo inicial, muralla y terreno exterior; establecer proporciones, paleta, materiales, encuadre de tercera persona detrás del héroe y lenguaje visual para Fuego y Agua. Revisar recursos disponibles y su procedencia.
- **Entrega y cierre:** referencia visual seleccionada que sirva para implementar. La oscuridad ambiental mantiene claras las amenazas y el personaje.

### 1.3 · Base web, escena y cámara
- **Trabajo:** crear el proyecto independiente, integrar Three.js y TypeScript, carga de recursos, bucle de juego, escena exterior y cámara de perspectiva. Incorporar giro con ratón, obstrucciones y diagnóstico básico de rendimiento.
- **Entrega y cierre:** escena visible y estable en navegador, con errores de carga tratados y medición inicial registrada.
- **Avance 2026-10-31:** implementada y aceptada visualmente por el usuario. Se continúa por instrucción expresa; las pruebas técnicas no realizadas se conservan en [VERIFICACION_1_3.md](docs/verificaciones/VERIFICACION_1_3.md), sin bloquear 1.4 ni exigir otra aprobación de la escena.

### 1.4 · Movimiento y controles
- **Trabajo:** WASD relativo a cámara, joystick izquierdo y arrastre derecho independientes, desplazamiento independiente de framerate, colisiones y límites de escenario. Gestionar captura de ratón y evitar entradas retenidas al perder foco.
- **Entrega y cierre:** desplazamiento fiable cerca de muros y obstáculos. Interactuar con la interfaz no mueve accidentalmente al personaje.
- **Avance 2026-10-31:** implementada en versión 0.1.4. Compilación y 20 pruebas correctas, incluidos 10.800 pasos por geometría real y propiedad independiente de los dos dedos. Registro y límites de comprobación en [VERIFICACION_1_4.md](docs/verificaciones/VERIFICACION_1_4.md). Siguiente contenido: 1.5, combate básico.

### 1.5 · Combate básico
- **Trabajo:** enemigo perseguidor, selección de blanco estable, espadazo automático, detección de impactos, vida, daño, muerte y señales de impacto.
- **Entrega y cierre:** el Guerrero combate mientras se mueve; un impacto no se acredita varias veces por error y las muertes no duplican recompensas.
- **Avance 2026-10-31:** versión 0.1.5 con encuentro fijo de cinco perseguidores, navegación alrededor de obstáculos, selección estable, arcos y preparación, daño, muerte, resultado y reinicio. 35 pruebas correctas; ver [VERIFICACION_1_5.md](docs/verificaciones/VERIFICACION_1_5.md). Todavía no hay experiencia ni recompensas económicas; se garantiza emisión única de muerte y baja para su integración posterior.

### 1.6 · Kit completo del Guerrero
- **Trabajo:** Ímpetu, golpes potenciados y Torbellino automático con recarga y condición de objetivo válido. Incorporar animación y señales de disponibilidad, sin botón de combate.
- **Entrega y cierre:** la pasiva se reconoce, Torbellino se activa automáticamente también contra un único objetivo, no consume recarga sin objetivo y la pausa congela correctamente las acciones.
- **Avance 2026-10-31:** versión 0.1.6 con cuatro acumulaciones de Ímpetu, multiplicador por espadazo, expiración y Torbellino automático de seis pulsos. Indicadores de pasiva y recarga, giro del personaje sin girar cámara y animación provisional. 48 pruebas correctas, incluida pausa, muros, objetivo único y recarga completa. Ver [VERIFICACION_1_6.md](docs/verificaciones/VERIFICACION_1_6.md).

### 1.7 · Experiencia y elecciones
- **Avance 2026-10-31:** versión 0.1.7. Cristales, recogida con obstáculos, exceso de experiencia conservado, cola de niveles, tarjetas pausadas y cuatro mejoras de tres rangos. Tres grupos de prueba (20 soldados) permiten llegar al nivel 4. Reinicio completo, derrota prioritaria y recompensa de reserva si no quedan opciones. 61 pruebas correctas; ver [VERIFICACION_1_7.md](docs/verificaciones/VERIFICACION_1_7.md). La elección Fuego/Agua del nivel 2 se integra en 1.8 con sus efectos; esta entrega ofrece mejoras generales desde el nivel 2.
- **Trabajo:** esencia, recogida, niveles, pausa de elección, tres opciones y aplicación de mejoras. Manejar varios niveles ganados de una vez y límites de opciones disponibles.
- **Entrega y cierre:** cada elección se aplica una sola vez; se puede seguir una progresión durante la partida y retomar el combate sin entradas accidentales.

### 1.8 · Fuego, Agua y primeras maestrías
- **Avance 2026-10-31:** versión 0.1.8. Afinidad al nivel 2, rangos I–III, quemadura, Empapado, empuje, explosión/salpicadura sin recursión, núcleo provisional al despejar el segundo grupo y elección de maestría independiente. Cuarto grupo para probarla. Cámara sigue el mouse sin arrastrar, captura al entrar/continuar y alternativa sin botones si falla. 82 pruebas correctas y build; ver [VERIFICACION_1_8.md](docs/verificaciones/VERIFICACION_1_8.md).
- **Trabajo:** quemadura, oleaje/salpicadura y estado empapado según reglas de 1.1; afinidad, requisitos y dos maestrías del Guerrero. Usar un disparador provisional de núcleo hasta integrar el élite en 1.9.
- **Entrega y cierre:** Fuego y Agua cambian el comportamiento del Guerrero y su definitiva. Agua no utiliza congelación como sustituto de identidad.

### 1.9 · Ciclo de partida y amenazas
- **Avance 2026-10-31:** versión 0.1.9. Director de seis minutos con respiros y límite de población; ballestero con virote, cargador con rumbo fijado, élite con núcleo/8 esencias y jefe con barrido/golpe al suelo/andanada. Transición limpia, espera al élite pendiente, victoria solo por muerte del jefe y derrota prioritaria. HUD, anticipaciones, recogible dorado, resultados y semilla nueva al reiniciar. 101 pruebas correctas y build; ver [VERIFICACION_1_9.md](docs/verificaciones/VERIFICACION_1_9.md).
- **Trabajo:** completar tres enemigos, un élite, jefe preliminar, recorrido de prueba de seis minutos antes del jefe, núcleo de maestría, victoria, derrota y reinicio. Toda la partida sucede en la sección exterior de prueba.
- **Entrega y cierre:** empezar, mejorar, transformarse y terminar funciona sin herramientas de desarrollo. Reiniciar limpia las entidades y poderes de la partida anterior.

### 1.9.1 · Mapa amplio y hordas alrededor del jugador
- **Estado:** implementada y ampliada de nuevo por petición del usuario en aplicación 0.1.13. Territorio 212 × 192 m, doce zonas conectadas, guía de objetivos, refuerzos a 11–23 m con preferencia fuera de vista, reposición local y retirada de normales lejanos sin premios. 106 pruebas y build correctos; ver [VERIFICACION_1_9_1.md](docs/verificaciones/VERIFICACION_1_9_1.md). Revisión visual/GPU pendiente.
- **Trabajo:** ampliar la superficie transitable con caminos, claros, ruinas, muralla y referencias visibles; reservar emplazamientos para interacciones. Sustituir posiciones de refuerzo ligadas al escenario pequeño por candidatos en una franja alrededor de la posición actual del jugador, con distancia segura, acceso navegable y preferencia por fuera de vista. Regular población local y global; retirar normales muy lejanos fuera de vista sin bajas ni recompensas, conservando élites, jefe y recogibles importantes. Evitar generar el mapa entero lleno de enemigos.
- **Entrega y cierre:** explorar distintas zonas mantiene presión cercana sin apariciones sobre el héroe, dentro de sólidos o sin ruta. Comprobar bordes, rincones y desplazamiento continuo; aplazar refuerzos si no hay posición segura. Preservar seis minutos más jefe, progresión y núcleo accesible. El mapa debe sentirse más extenso por sus recorridos y referencias, no solo por ampliar el suelo.

### 1.9.2 · Recogibles, interacción y orientación
- **Estado:** implementada en aplicación 0.1.14. Monedas, suministros, ocho cofres y cuatro fuentes; E/botón táctil, estados usados, descubrimiento y saldo temporal. Ver [VERIFICACION_1_9_2.md](docs/verificaciones/VERIFICACION_1_9_2.md). Revisión visual/GPU pendiente.
- **Trabajo:** base común de puntos interactivos y estados disponibles/usados, recogida por proximidad, señalización y acciones contextuales. Incorporar suministros de curación y moneda de expedición, un cofre y una fuente; distribuirlos en emplazamientos válidos con variación reproducible. PC: E para interactuar; móvil: botón contextual. Mantener ataques y habilidades automáticos.
- **Entrega y cierre:** recoger, abrir y usar producen efectos distintos y útiles; ninguna recompensa se duplica. Marcadores orientan hacia destinos descubiertos sin saturar la pantalla. El reinicio limpia usos y moneda; pausa, interfaz y captura del ratón se coordinan sin movimientos involuntarios.

### 1.9.3 · Primera captura y tienda de expedición
- **Estado:** implementada en aplicación 0.1.15. Captura de 25 s tras aviso de 3 s, recompensa única de 25 monedas y mercader con cuatro ofertas limitadas y pausa completa. Reglas económicas ajustables, sin atribuir aprobación de cifras al usuario. Ver [VERIFICACION_1_9_3.md](docs/verificaciones/VERIFICACION_1_9_3.md). Revisión visual/GPU pendiente.
- **Trabajo:** un punto capturable permaneciendo en un área mientras llegan enemigos, con progreso y recompensa única; una tienda provisional con moneda exclusiva de la partida, existencias limitadas y compras de suministros/mejoras generales. Pausar el mundo al abrir la tienda y reanudar explícitamente. Compartir el presupuesto de enemigos entre captura y director normal.
- **Entrega y cierre:** recorrer el mapa permite decidir entre seguir avanzando, resistir por una recompensa o gastar recursos. No existe compra sin saldo, premio repetible ni horda duplicada por eventos. El núcleo de maestría sigue procediendo del élite y el jefe sigue siendo la condición de victoria. Capturas y tiendas son opcionales.

### 1.10 · Pulido y revisión del núcleo ampliado
- **Estado:** pulido inicial implementado en 0.1.16. Audio, HUD, avisos, correcciones del director y pausa, comprobaciones automáticas y auditoría económica. Revisión visual/auditiva, pruebas manuales de dificultad y GPU pendientes por acceso de navegador desactivado. No equivale al cierre de esas comprobaciones. Ver [VERIFICACION_1_10.md](docs/verificaciones/VERIFICACION_1_10.md).
- **Trabajo:** HUD, pausa y pérdida de foco, audio esencial, anticipaciones enemigas, dificultad, controles y rendimiento inicial. Revisar densidad local, distancias de recorrido, orientación, economía provisional y presión durante capturas. Realizar pruebas manuales de ambas configuraciones, explorando y omitiendo objetivos opcionales.
- **Entrega y cierre:** versión jugable con evidencias y problemas conocidos. No ampliar clases mientras siga habiendo problemas importantes de control, legibilidad o respuesta al impacto.

**Hito de fase 1:** una partida completa de Guerrero con Fuego o Agua que permite evaluar combate, exploración, captura y compra en un exterior amplio.

## Fase 2 — Clases y construcción de combinaciones

**Alcance:** tres clases iniciales, cuatro elementos, habilidades adquiribles/mejorables, cámara y mapa ampliados y combate contra hordas densas. Trece entregas implementadas y 2.7.1 definida: 14/16 entregables de definición/implementación.

### 2.1 · Estructura compartida de clases
- **Estado:** implementada en 0.2.1. Datos inmutables, kit/efectos del Guerrero separados del motor, estadísticas y presentación conectadas por clase. Tres trazas previas idénticas y prueba de kit independiente. Ver [VERIFICACION_2_1.md](docs/verificaciones/VERIFICACION_2_1.md) y [arquitectura](docs/diseno/ARQUITECTURA_CLASES_2_1.md).
- **Trabajo:** organizar estadísticas, armas, pasivas, definitivas, técnicas y efectos en contratos y datos compartidos. Adaptar Guerrero sin introducir abstracciones que todavía no tengan uso.
- **Entrega y cierre:** Guerrero conserva su comportamiento y se puede incorporar otra clase sin duplicar el ciclo de partida.

### 2.2 · Mago
- **Estado:** implementada en 0.2.2: selección de clase/afinidad inicial, proyectiles, Acumulación arcana, Cataclismo y maestrías Fuego/Agua. Modelo y efectos provisionales propios. Ver [diseño implementado](docs/diseno/MAGO_2_2.md) y [verificación](docs/verificaciones/VERIFICACION_2_2.md). Revisión visual y balance humano pendientes.
- **Trabajo:** ataque elemental desde el comienzo, Acumulación arcana y Cataclismo. Conectar la selección temprana de afinidad; implementar primero Fuego y Agua.
- **Entrega y cierre:** Mago jugable, con daño a distancia y área reconocibles, y capaz de terminar la partida.

### 2.3 · Arquero
- **Estado:** implementada en 0.2.3: flechas, Precisión, penetración de hasta tres enemigos, lluvia automática, afinidad Fuego/Agua en nivel 2 y maestrías. Modelo y efectos propios provisionales. Ver [reglas](docs/diseno/ARQUERO_2_3.md) y [verificación](docs/verificaciones/VERIFICACION_2_3.md). Revisión visual y balance humano pendientes.
- **Trabajo:** flechas, precisión, penetración, Lluvia de flechas y animaciones; integrar Fuego y Agua disponibles.
- **Entrega y cierre:** posicionarse para atravesar enemigos aporta valor; los disparos y su selección de objetivo son consistentes.

### 2.4 · Tierra y Aire
- **Estado:** implementada en 0.2.4 para Guerrero. Cuatro afinidades elegibles, Quebranto, coraza limitada, ondas sísmicas, alcance/empuje/atracción con resistencias y colisiones. Maestrías iniciales y representación propia. Mago/Arquero mantienen Fuego/Agua hasta 2.5. Ver [reglas](docs/diseno/TIERRA_AIRE_2_4.md) y [verificación](docs/verificaciones/VERIFICACION_2_4.md).
- **Trabajo:** implementar impacto/protección/quebranto para Tierra y ráfagas/empuje/remolinos para Aire. Fijar límites y resistencia a control. Darles una primera integración en Guerrero.
- **Entrega y cierre:** los dos elementos funcionan con identidad propia y sin romper colisiones, navegación o posición de enemigos.

### 2.5 · Afinidades de las tres clases
- **Estado:** implementada en 0.2.5: Tierra/Aire en Mago y Arquero, doce combinaciones seleccionables, cuatro maestrías nuevas, HUD y representación diferenciados. Ver [reglas](docs/diseno/AFINIDADES_2_5.md) y [verificación](docs/verificaciones/VERIFICACION_2_5.md). Balance humano y revisión visual pendientes.
- **Trabajo:** completar la expresión de Fuego, Agua, Tierra y Aire en ataques y pasivas de todas las clases; separar efectos comunes de comportamientos específicos.
- **Entrega y cierre:** 12 combinaciones básicas comprobadas. Agua y Aire se distinguen por comportamiento y representación, no únicamente por color.

### 2.6 · Técnicas y espacios de configuración
- **Estado:** implementada en 0.2.6: doce técnicas, tres espacios, rangos I–III con requisitos de nivel 3/5/7, ofertas elegibles, exclusión de la cuarta, catálogo y resumen. Ver [reglas](docs/diseno/TECNICAS_2_6.md) y [verificación](docs/verificaciones/VERIFICACION_2_6.md). Revisión visual y balance humano pendientes.
- **Trabajo:** definir e implementar cuatro técnicas por clase y tres espacios equipables. Añadir niveles, requisitos, mejoras y exclusiones cuando correspondan.
- **Entrega y cierre:** 12 técnicas funcionales; los límites se cumplen y elegir unas posibilidades implica renunciar a otras.

### 2.7 · Reliquias y doble afinidad
- **Estado:** implementada en 0.2.7: doce reliquias, cuatro espacios, recompensas de cofres/captura, tienda y segundo elemento de apoyo desde nivel 5. Una maestría principal, límites y efectos sin recursión. Ver [reglas](docs/diseno/RELIQUIAS_AFINIDADES_2_7.md) y [verificación](docs/verificaciones/VERIFICACION_2_7.md). Balance humano y revisión visual pendientes.
- **Trabajo:** catálogo de 12 reliquias, cuatro espacios, dos elementos como máximo e interacciones básicas. Integrar recompensas de cofres, capturas y ofertas de tienda con elegibilidad y límites de equipo; sustituir gradualmente sus premios provisionales. Resolver orden de efectos y evitar cadenas recursivas ilimitadas.
- **Entrega y cierre:** configuraciones puras y mixtas completas; las descripciones corresponden a los efectos reales y los límites se respetan.

### 2.7.1 · Elecciones y repertorios de habilidades
- **Estado:** definición completada en [HABILIDADES_2_7_1.md](docs/diseno/HABILIDADES_2_7_1.md). Veinticuatro habilidades, cuatro espacios, nivel 10, dieciséis opciones de desarrollo por árbol y migración de las doce técnicas. Doce familias generales más Temple exclusivo del Guerrero. Reglas de ofertas, topes y criterios de implementación documentados. Aplicación 0.2.7 sin cambios; siguiente 2.7.2.
- **Trabajo:** definir catálogo por clase, cuatro espacios contando la habilidad inicial, rangos, requisitos y ofertas entre estadísticas/aprender/mejorar. Mantener esencia como vía de niveles; tiempo como referencia de ritmo, sin premios de habilidad programados. Resolver la migración de cada una de las doce técnicas y su convivencia con afinidades, reliquias y maestría.
- **Entrega y cierre:** reglas implementables, tabla de habilidades y migración, ejemplos de elecciones con espacios libres/llenos y configuraciones con pocas habilidades. Distinguir cifras de prueba y decisiones confirmadas; no hace falta otra autorización genérica para definirlas.

### 2.7.2 · Cámara y espacio para hordas
- **Estado:** implementada en app 0.2.8; ver [verificación](docs/verificaciones/VERIFICACION_2_7_2.md). Integración del Guerrero entregada en 2.7.3b.
- **Trabajo:** alejar y elevar el encuadre por defecto, conservar rueda y giro sin arrastrar, ampliar territorio con claros/caminos anchos y destinos. Probar aproximadamente 260 × 240 m y distancia de cámara 11–12 con máximo 16–18. Ajustar aparición según encuadre, obstáculos y rutas. Evaluar modelos tras el cambio de cámara.
- **Entrega y cierre:** más campo visible y espacio transitable, destinos accesibles y apariciones seguras. Cifras ajustadas con evidencia; sin atribuir inspección visual o rendimiento no medidos.

### 2.7.3a · Esqueleto común de habilidades
- **Estado:** implementado como módulos de dominio y pruebas; integrado al Guerrero en 0.2.9 mediante 2.7.3b. Ver [BASE_HABILIDADES_2_7_3A.md](docs/diseno/BASE_HABILIDADES_2_7_3A.md).
- **Trabajo:** catálogo e IDs, configuración por clase, cuatro espacios, nivel 10, ramas/hitos, ofertas reproducibles y tiempos independientes. Establecer contrato de integración con progresión, combate y UI.
- **Entrega y cierre:** operaciones legales y revisiones, instantáneas, garantías de oportunidad, pausa y reinicio comprobados. Ocho pruebas correctas; 54 trayectorias de árboles y 600 ofertas. Sin atribuir efectos de ataques aún no conectados.

### 2.7.3b · Guerrero completo e integración jugable
- **Estado:** implementada en 0.2.9; ver [entrega](docs/diseno/GUERRERO_HABILIDADES_2_7_3B.md) y [verificación](docs/verificaciones/VERIFICACION_2_7_3B.md).
- **Trabajo:** conectar el esqueleto con Run/Progression/Combat y los menús; datos y efectos reales de las ocho habilidades, básico hasta 10, estadísticas, afinidades y tienda. Migrar las técnicas del Guerrero; implementar HUD de cuatro espacios/recargas, animación y resultados.
- **Entrega y cierre:** configuraciones de pocas habilidades desarrolladas y cuatro intermedias jugables. Topes, recargas, estados elementales, colisiones, pausa y reinicio integrados; revisión visual y pruebas de combate documentadas. Mago/Arquero conservan su sistema actual hasta 2.7.4.

### 2.7.4 · Habilidades de Mago y Arquero
- **Estado:** implementada en 0.2.10. Ver MAGO_ARQUERO_2_7_4.md y VERIFICACION_2_7_4.md: 274 pruebas, dos campañas seleccionadas y build correctos; revisión visual inicial y límites documentados.
- **Trabajo:** completar las dieciséis habilidades de Mago/Arquero, sus básicos hasta 10 y migraciones; acciones diferenciadas por clase y por elementos, apoyo, reliquias y estados. Conservar identidad de cada arma y límites de efectos derivados.
- **Entrega y cierre:** las tres clases pueden elegir estadísticas, aprender y mejorar; probar distintas selecciones, no solo equipar siempre las mismas cuatro habilidades. Catálogo y descripciones corresponden al efecto real.

### 2.7.5 · Hordas densas y rendimiento inicial
- **Estado:** implementada en 0.2.11. Objetivos 20/40/60/90, máximo provisional 100; 279 pruebas, tres campañas seleccionadas, build y laboratorio WebGL sobre mapa real. Entrega y límites en HORDAS_2_7_5.md y VERIFICACION_2_7_5.md. Balance humano y medición completa de habilidades en 2.7.6.
- **Trabajo:** variante débil del perseguidor como masa, amenazas minoritarias, frecuencia/reposición mayor y respiros más breves. Probar objetivos locales 15–25 / 35–60 / 80–120, sujetos a medición. Revisar navegación, consultas espaciales, renderizado, efectos y reparto de población con capturas; fijar límites por evidencia.
- **Entrega y cierre:** presión sigue al jugador, hay rutas de escape y grupos que pueden barrerse. Registrar carga máxima probada, CPU/GPU y límites; no declarar rendimiento a partir de simulaciones sin GPU. Mantener muertes/premios únicos y apariciones seguras.

### 2.7.6 · Ritmo y claridad del combate masivo
- **Estado:** implementada en 0.2.12 con balance inicial. Ver [reglas](docs/diseno/RITMO_2_7_6.md) y [evidencia y límites](docs/verificaciones/VERIFICACION_2_7_6.md).
- **Trabajo:** ajustar experiencia por enemigo, frecuencia de elecciones, pesos de ofertas, daño, moneda y costes para la nueva densidad. Revisar cuatro recargas, indicadores, partículas, audio y avisos enemigos; recorridos de exploración, captura y jefe con vida normal.
- **Entrega y cierre:** crecer pronto sin forzar habilidades nuevas; configuraciones con pocas habilidades mejoradas y cuatro equipadas comprobadas. Registrar balance humano, mediciones y pendientes. No cerrar por campañas con vida artificialmente ampliada. Definitiva R sigue pendiente salvo decisión explícita.

### 2.8 · Doce maestrías
- **Base disponible desde 2.5:** doce primeras maestrías. Se revisan después de 2.7.6, sobre habilidades simultáneas, técnicas migradas, doble afinidad y reliquias.
- **Trabajo:** completar las maestrías de tres clases por cuatro elementos, con requisitos visibles, modificación de habilidades automáticas y cambios de presentación; comprobar interacciones con los nuevos repertorios. No presupone definitiva manual. Integrar elección de una maestría por partida.
- **Entrega y cierre:** las 12 se pueden obtener y verificar. La segunda afinidad sigue aportando sin activar otra transformación completa.

### 2.9 · Preparación, selección y balance
- **Trabajo:** pantalla de clases, explicación de kits, resumen de configuración, ponderación de estadísticas/aprender/mejorar/afinidades, renovaciones y correcciones de combinaciones dominantes sobre el ritmo validado en 2.7.6.
- **Entrega y cierre:** las tres clases pueden completar partidas; el usuario entiende qué elige y hacia qué maestría avanza. Registrar configuraciones probadas y problemas pendientes.

**Hito de fase 2:** tres clases con identidad clara y variedad comprobable de configuraciones elementales.

## Fase 3 — Fortaleza, exploración y progreso

**Alcance:** escenario completo, objetivos, contenido enemigo final y ciclo persistente.

### 3.1 · Diseño espacial del mapa
- **Trabajo:** refinar el mapa ampliado en 2.7.2 sobre la base de 1.9.1, conservando escala exploratoria, caminos anchos y densidad validada; no duplicar otra ampliación sin necesidad. Distribuir camino de acceso, ruinas, perímetro de muralla, linde de bosque y posible patio interior. Resolver si se añade una estancia; colocar entradas, rutas alternativas, arena del jefe, zonas de captura y tiendas. Ajustar distancias entre objetivos y tiempo de recorrido; no rehacer desde cero lo validado.
- **Entrega y cierre:** plano y recorrido bloqueado con geometría sencilla; predominio claro del exterior y pasos transitables para jugador y hordas.

### 3.2 · Construcción del escenario
- **Trabajo:** terreno, arquitectura, vegetación, iluminación e hitos visuales sobre el mapa ampliado. Dar identidad a capturas, tiendas y recogibles. Resolver colisiones, ocultación de muros y cámara al entrar en el patio o estancia seleccionados; conservar espacio para apariciones navegables alrededor del jugador.
- **Entrega y cierre:** mapa conectado y legible, sin cargas entre zonas ni paredes que oculten sistemáticamente ataques.

### 3.3 · Cinco enemigos normales definitivos
- **Trabajo:** completar perseguidor (incluida su variante débil masiva de 2.7.5), tirador, cargador, protector y amenaza de área; animaciones, anticipación, recuperación y navegación en el mapa.
- **Entrega y cierre:** las cinco conductas se distinguen y combinan; los enemigos no quedan atrapados de forma habitual en puertas o ruinas.

### 3.4 · Dos élites y núcleos de maestría
- **Trabajo:** terminar dos élites, aparición, patrones, recompensas y entrega de núcleos. Comunicar riesgo y utilidad antes de iniciar el encuentro.
- **Entrega y cierre:** ambos pueden vencerse con las tres clases, sus recompensas se acreditan una vez y permiten alcanzar maestría a tiempo.

### 3.5 · Jefe final
- **Trabajo:** modelo, animaciones, patrones, avisos, ventanas de ataque y resistencias a efectos. Elegir política de hordas durante el encuentro y comprobar cuatro habilidades simultáneas sin ocultar avisos ni trivializar al jefe.
- **Entrega y cierre:** combate final justo para las tres clases, sin bloqueo permanente por control ni dependencia de una configuración concreta.

### 3.6 · Puntos de interés, capturas y tiendas completas
- **Trabajo:** ampliar los sistemas de 1.9.2–1.9.3 con cofres, altares elementales, fuentes, capturas y tiendas de temática medieval. Completar catálogo, costes, existencias, recompensas compatibles con clase/configuración y distribución entre partidas. Variar riesgo, duración y premio de capturas sin crear sistemas independientes por cada variante. Ajustar señalización, descubrimiento y distancias entre destinos.
- **Entrega y cierre:** explorar ofrece decisiones útiles con las tres clases; las activaciones y compras no se duplican. Existen rutas viables con y sin objetivos opcionales, y el jugador reconoce beneficios, costes y peligros antes de comprometerse. El catálogo definitivo sustituye los premios provisionales sin exigir nuevos tipos de moneda.

### 3.7 · Ritmo de expedición
- **Trabajo:** combinar composición de hordas alrededor del jugador, presión, descansos, capturas, compras y transición al jefe. Partir del director de 2.7.5 y balance de 2.7.6; ajustar duración final, distancias, economía, oportunidades de elección y momento esperado de maestría. El reloj de expedición se detiene en menús pausados; los encuentros comparten límites de población y no se acumulan al cerrar una tienda.
- **Entrega y cierre:** partidas completas con una curva reconocible, tiempo para disfrutar la transformación y sin largos tramos vacíos o picos inevitables.

### 3.8 · Refugio, resultados y persistencia
- **Trabajo:** refugio mediante menús, preparación, resumen de habilidades/rangos, afinidades y reliquias, resultados, descubrimientos y desbloqueos. Guardado local con versión, validación y tratamiento de datos inválidos.
- **Entrega y cierre:** cerrar y volver a abrir conserva progreso y ajustes; una partida nueva reinicia solo sus poderes temporales. No confundir guardado de progreso con reanudación de una partida en curso, que no es requisito del MVP.

### 3.9 · Primer desbloqueable: Sacerdote
- **Trabajo:** definir explícitamente kit, repertorio adquirible/mejorable y afinidades iniciales dentro de un alcance reducido compatible con el sistema de 2.7.1–2.7.6; implementar evento del santuario, condición de desbloqueo, notificación y selección posterior. Evitar añadir un elemento nuevo para esta clase.
- **Entrega y cierre:** el Sacerdote se obtiene jugando, queda guardado y puede completar el ciclo disponible. Si el kit reducido no permite ese resultado, revisar el alcance antes de declarar el desbloqueo terminado.

### 3.10 · Tutorial y ciclo completo
- **Trabajo:** introducir movimiento/cámara, afinidad, elección entre estadísticas/aprender/mejorar y espacios de habilidades automáticas, recogida, interacción, captura, compras, altares y maestría durante la primera partida. Adaptar las instrucciones a la clase y a teclado/ratón/táctil; comprobar premios y progresión de principio a fin.
- **Entrega y cierre:** una persona puede empezar sin explicación externa, interpretar una derrota y encontrar un objetivo para la siguiente partida.

**Hito de fase 3:** expedición completa por los alrededores de la fortaleza, progreso persistente y primer desbloqueo funcional.

## Fase 4 — Acabado, estabilidad y publicación

**Alcance:** pulido final, dispositivos reales y entrega pública del MVP.

### 4.1 · Coherencia artística
- **Trabajo:** unificar modelos, materiales, iluminación, efectos e interfaz para el encuadre más amplio y hordas densas; sustituir recursos provisionales. Revisar procedencia y créditos.
- **Entrega y cierre:** identidad visual consistente y ninguna pieza provisional importante sin identificar.

### 4.2 · Animaciones e impactos
- **Trabajo:** mejorar desplazamientos, ataques, bloqueos, retrocesos, muertes y maestrías; mantener sincronía con reglas y estados.
- **Entrega y cierre:** las acciones se sienten y se leen con claridad, sin efectos que oculten las anticipaciones enemigas.

### 4.3 · Audio y ambiente
- **Trabajo:** música, ambiente exterior/interior, sonidos de clases, elementos y enemigos; prioridades, volumen y límites de simultaneidad.
- **Entrega y cierre:** audio coherente que no satura durante hordas y respeta ajustes y pausas.

### 4.4 · Interfaz y accesibilidad
- **Trabajo:** textos, iconos, contraste, tamaño táctil, estados de botones y navegación por teclado en menús. Opciones de reducción de destellos y movimiento visual.
- **Entrega y cierre:** interfaz comprensible y legible; comunicar estados sin depender solo de colores y mantener consistencia entre entradas.

### 4.5 · Balance global
- **Trabajo:** revisar daño, vida, experiencia, recompensas, duración, repertorios y rangos de habilidades, técnicas migradas, reliquias y eficacia de elementos; incluir economía de tiendas, capturas, distancias y densidad local. Probar también configuraciones menos favorecidas y recorridos con distintos niveles de exploración.
- **Entrega y cierre:** curva consistente y alternativas viables. Registrar observaciones de partidas, no afirmar equilibrio completo por inspección de cifras.

### 4.6 · Rendimiento con hordas
- **Trabajo:** consolidar las mediciones y optimizaciones iniciales de 2.7.5 con arte final, cuatro habilidades simultáneas, mapa amplio, capturas y jefe; optimizar entidades, navegación, consultas espaciales, proyectiles, partículas, luces, recursos y actualizaciones de interfaz. Limitar trabajo de zonas lejanas conservando sus estados y recompensas. Incorporar perfiles gráficos donde aporten valor.
- **Entrega y cierre:** cumplir el presupuesto definido en 1.1 o documentar y resolver su revisión con mediciones. Ninguna cifra de rendimiento se declara validada sin prueba.

### 4.7 · Pruebas en PC y teléfono físico
- **Trabajo:** partidas completas, controles, orientación, interrupciones, pérdida de foco y sesiones prolongadas en dispositivos objetivo. Revisar diferencias de navegador.
- **Entrega y cierre:** resultados registrados por dispositivo. Si falta un teléfono físico, dejar esa validación pendiente explícitamente.

### 4.8 · Robustez y carga
- **Trabajo:** fallos de recursos, datos de guardado inválidos, migraciones, reinicios, pausa y pérdida del contexto gráfico. Revisar tamaños y progreso de carga.
- **Entrega y cierre:** fallos previsibles no bloquean silenciosamente el juego ni destruyen progreso; la recuperación comunica lo ocurrido.

### 4.9 · PWA y despliegue de prueba
- **Trabajo:** nombre de publicación, iconos, manifiesto, configuración de alojamiento y versión de prueba. Revisar ruta base y carga de recursos en el destino real.
- **Entrega y cierre:** URL operativa y comportamiento de añadir a inicio comprobado donde sea compatible. No prometer modo sin conexión.

### 4.10 · Prueba externa y cierre
- **Trabajo:** recoger observaciones de jugadores, priorizar bloqueos, corregirlos y repetir las comprobaciones afectadas. Documentar limitaciones y contenido final.
- **Entrega y cierre:** MVP publicado, ciclo completo verificado y pendientes separados del alcance entregado. La prueba externa se registra solo cuando ocurra.

**Hito de fase 4:** versión web compartible con progreso fiable, controles verificados y limitaciones conocidas.

## Registro mínimo de cada entrega

1. Subfase y estado: pendiente / en curso / implementada / verificada.
2. Cambios visibles y reglas incorporadas.
3. Comprobaciones realizadas y resultado.
4. Problemas abiertos y su impacto.
5. Revisión del usuario, solo si existe una valoración explícita.
6. Siguiente subfase y dependencias pendientes.


## Idea narrativa para después

[Campaña por eras y etapas](docs/diseno/IDEA_CAMPANA_ERAS.md), registrada el 2026-11-02: cada era reúne tres a cinco etapas. Era I: establecer el reino recuperando exterior, interior y defendiendo la fortaleza. El escenario actual puede representar su primera etapa. Es una propuesta futura; no añade implementación ni cambia los recuentos del plan. Próxima entrega técnica: 2.7.3.

# Subfase 1.1 — Contrato del prototipo y arquitectura

Fecha: **2026-10-31** · Versión: **0.1**.

**Estado: definición completada; implementación pendiente.** Los controles y la cámara fueron elegidos expresamente por el usuario. Los valores de balance y soluciones técnicas restantes son decisiones iniciales de diseño para probar, no resultados de pruebas ni aprobaciones atribuidas al usuario.

Este contrato concreta [DISENO_MVP.md](DISENO_MVP.md). En caso de discrepancia con versiones anteriores, rigen las decisiones del usuario registradas aquí.

## 1. Decisiones expresas de esta subfase

| Tema | Decisión |
|---|---|
| Prioridad | PC primero; celular en horizontal |
| Movimiento PC | WASD |
| Combate | Ataque básico y habilidades automáticos, incluida la habilidad especial de clase |
| Cámara | Detrás del personaje, en tercera persona |
| Control de cámara PC | Girar con el ratón |
| Equivalente móvil | Joystick izquierdo y arrastre derecho para cámara |

El jugador controla posición, recorrido, cámara y elecciones de mejoras. No necesita pulsar ataques, apuntar disparos ni activar una definitiva. El ratón sirve para mirar, no para seleccionar blancos.

Se sustituye la propuesta anterior de definitiva manual y cámara elevada. El término «definitiva» puede seguir apareciendo en documentos de habilidades; significa **habilidad especial potente de activación automática**, no un botón de combate.

## 2. Alcance del primer prototipo jugable

Construcción distribuida entre 1.3 y 1.10:

**Actualización de alcance 2026-10-31:** el usuario pidió ampliar el mapa y generar hordas alrededor del jugador, con recogibles, capturas y tiendas. Se insertan 1.9.1–1.9.3 antes de 1.10; ver [EXPANSION_1_9.md](EXPANSION_1_9.md). La sección exterior pequeña descrita abajo corresponde al prototipo hasta 1.9 y será ampliada. El combate continúa automático; la interacción contextual con el entorno es independiente. Las 1.9.1–1.9.3 están implementadas en aplicación 0.1.15; recogibles, captura territorial y mercader con pausa completa. Reglas y resultados en [VERIFICACION_1_9_3.md](VERIFICACION_1_9_3.md).

- Guerrero con espada, Ímpetu y Torbellino automático.
- Fuego y Agua; una afinidad para esta primera porción de prueba. La segunda afinidad se implementa en 2.7 (antes 2.8; plan reajustado al aplazar Acorazado).
- Una sección exterior del castillo-fortaleza: camino, claro, tramo de muralla y puerta cerrada como referencia visual. Sin interior todavía.
- Tres enemigos normales: perseguidor, tirador y cargador. Un élite y un jefe preliminar.
- Subidas de nivel con tres opciones, dos maestrías alternativas y reinicio completo de partida.
- **Seis minutos de recorrido más el jefe**, con objetivo de jefe de 60–90 segundos para balance inicial. El MVP completo mantiene diez minutos antes del jefe; no son dos modos de juego para publicar.
- Sin progreso permanente de personaje durante la fase 1. La ampliación 1.9.2–1.9.3 introduce moneda temporal de expedición; la progresión persistente llega en 3.8.
- El prototipo comienza con pantalla de inicio explícita, carga, partida, resultados y reinicio. No comienza a combatir al abrir la URL.

Los números de este contrato se guardarán en datos editables. Se ajustan tras probar sin rehacer la arquitectura.

## 3. Entrada y cámara

### PC

- W/S: avanzar/retroceder respecto al rumbo horizontal de la cámara; A/D: desplazarse lateralmente. Normalizar diagonales.
- Ratón: modificar rumbo e inclinación de cámara **al moverlo, sin arrastrar ni mantener botones**, según petición expresa en 1.8. Captura del puntero tras pulsar Entrar, Continuar o Reiniciar en PC; nunca al abrir la página o volver a la pestaña por sí sola.
- Esc o pérdida de captura: pausar y liberar el ratón. Volver a la pestaña no reanuda automáticamente.
- Menús y elección de mejoras: cursor libre. Elegir una opción no mueve al héroe ni dispara acciones. Reanudar mediante acción explícita si el navegador exige volver a capturar el puntero.
- Si no se puede capturar el ratón, ofrecer giro al moverlo sobre la escena, sin mantener botones, y explicar el control. Al salir de la escena o entrar a un menú se descartan los deltas anteriores para evitar saltos. Sustituye la alternativa de arrastre tras la petición del usuario en 1.8.
- No incluir salto, carrera con consumo, esquiva ni apuntado manual en esta primera implementación.

### Celular horizontal

- Joystick flotante en la mitad izquierda; arrastre de cámara en la mitad derecha.
- Seguir por separado el identificador de ambos dedos. Soltar un dedo no cancela el otro.
- Excluir botones y paneles de las zonas de movimiento/cámara.
- Botón de pausa accesible. No hay botones de combate.
- En vertical: pausar y ofrecer indicación para girar. No depender de que el navegador permita forzar orientación.
- Sensibilidad de cámara ajustable y opción de invertir eje vertical, incorporadas antes del pulido final.

### Cámara en tercera persona

- Cámara de perspectiva detrás y ligeramente encima del héroe. Distancia inicial de **8 m**, punto observado a **1,3 m** de altura y campo de visión vertical de **65°**. Ajuste de 1.3 tras la petición del usuario de alejar la vista: reemplaza los 6 m originales. Rueda para acercar/alejar entre **4 y 12 m**; cifras iniciales de implementación, ajustables tras uso. Las obstrucciones pueden acercar temporalmente la cámara por debajo del mínimo elegido.
- Rumbo libre; inclinación limitada para no atravesar el suelo ni perder de vista la zona jugable.
- La cámara sigue la posición del héroe, pero **no hereda los giros que provoca la selección automática de enemigos**.
- Movimiento, orientación de ataque y cámara se calculan por separado. El héroe puede atacar a un lado mientras continúa desplazándose.
- Al obstruirse con un muro, acercar la cámara hasta una distancia segura; recuperar la distancia con suavizado al despejarse. Comprobar un volumen, no solo un rayo central que permita atravesar esquinas.
- Si queda demasiado cerca del personaje, reducir su opacidad de forma local para mantener la vista. Esto es presentación, no invulnerabilidad ni modificación de colisiones.
- Sin balanceo de cabeza. Sacudidas y pulsos breves opcionales, sin alterar el rumbo elegido por el usuario.
- Avisos de amenazas relevantes fuera de pantalla: proyectil entrante, carga y daño recibido. No colocar un indicador por cada enemigo de la horda.

## 4. Movimiento, espacio y navegación

- Unidad de simulación: metro; tiempo: segundos. Movimiento sobre el plano XZ con representación 3D. Primera zona esencialmente llana, sin plataformas ni varias plantas.
- Guerrero: velocidad inicial **5 m/s**, radio físico **0,4 m**, vida máxima **100**.
- Colisión del jugador con obstáculos estáticos y separación suave respecto a enemigos. Los enemigos no producen daño únicamente por tocar el cuerpo: su daño procede de ataques definidos con preparación visible.
- Los enemigos no forman muros físicos rígidos entre sí; usar separación suave y límites de densidad.
- Navegación inicial con obstáculos sencillos y rutas de rodeo. Desde 3.1/3.3, usar una representación común de zonas transitables para evitar que una persecución directa los atasque en puertas.
- Las apariciones evitan suelo no transitable, solaparse con el jugador y materializar enemigos dentro de su vista sin aviso. Las apariciones visibles especiales requieren señal anticipada.
- Alcances de ataque se miden de centro a centro, incluyendo explícitamente el radio del objetivo en la prueba de intersección; las descripciones para el jugador no necesitan mostrar estas unidades internas.

## 5. Selección de objetivo y ataque automático

### Adquisición estable

1. Considerar enemigos vivos, vulnerables y dentro del alcance de adquisición de la habilidad.
2. Exigir trayectoria/visibilidad válida: ni espadas ni proyectiles atraviesan paredes salvo una habilidad que lo declare expresamente.
3. Adquirir el enemigo válido más cercano. Conservarlo mientras siga siendo válido; cambiar a otro solo si resulta al menos **25 % más cercano**, o el actual muere o sale de alcance.
4. Recalcular cuando un evento invalida al objetivo o a un máximo inicial de **10 veces por segundo**, no ordenar toda la horda cada cuadro.
5. Resolver empates por identificador estable para reproducir casos de prueba.

La selección puede abarcar 360° alrededor del héroe; girar la cámara no apunta las habilidades. Fijar orientación de cada golpe al comenzar su preparación. La animación no gira la cámara.

### Golpe del Guerrero

- Alcance inicial **2 m**, arco **120°**, daño físico base **18**, periodo mínimo entre inicios **0,75 s**.
- Preparación **0,12 s**, ventana activa **0,12 s**. Durante ella puede alcanzar varios enemigos, pero cada enemigo recibe como máximo un impacto de ese golpe.
- La dirección no cambia durante la ventana activa. Mantener movimiento durante el ataque.
- Sin blanco válido, el ataque queda listo sin consumir recarga.
- Golpear no interrumpe la entrada del jugador. La respuesta visual de impacto no debe introducir retrasos en el movimiento.

### Ímpetu

- Cada ataque básico que acierta suma una acumulación, aunque golpee varios enemigos.
- Máximo **4** acumulaciones; cada una aumenta **5 %** el daño del ataque básico.
- Se pierden las acumulaciones tras **3 s** sin acertar un ataque básico.
- Quemaduras, salpicaduras y ticks de Torbellino no generan Ímpetu.

### Torbellino automático

- Recarga inicial **20 s**, lista al empezar; duración **2,4 s**, radio **2,6 m**, seis pulsos separados por **0,4 s**, daño base **12** por pulso y objetivo.
- Se activa si está lista y hay al menos un enemigo vivo, alcanzable y no separado por un muro dentro del radio. No depende de bajas ni exige varios enemigos, para funcionar contra el jefe.
- Durante Torbellino sustituye al ataque básico; el jugador sigue moviéndose a velocidad normal.
- Recarga comienza al terminar. Si no hay enemigos, queda lista; no se acumulan usos.
- Cada pulso lleva su propio identificador de ataque. Los efectos elementales especifican si se activan por golpe, pulso o lanzamiento.
- El HUD muestra recarga/estado automático, no un botón que sugiera activación manual.

Para otras habilidades automáticas se reutiliza el contrato: condición de activación + objetivo + preparación + ejecución + recuperación + recarga. No se activa una habilidad de curación si no puede producir su beneficio, salvo una conversión ofensiva explícita.

## 6. Daño, estados y muerte

### Resolución común

- Daño final inicial: daño base × modificadores de fuente × modificadores de vulnerabilidad × `100 / (100 + armadura)`; armadura mínima cero. No añadir críticos aleatorios en fase 1.
- Mantener precisión interna; redondear solo la presentación. Vida siempre entre cero y su máximo.
- Tras un impacto recibido, el jugador obtiene **0,35 s** de protección contra nuevas fuentes externas para evitar muertes por solapamiento instantáneo. La protección no cura ni permite atravesar paredes.
- Ataques poseen identidad para impedir impactos duplicados. Cada muerte y recompensa se procesan una sola vez.
- El paso resuelve acciones válidas al inicio de la ventana de impacto, acumula daño de forma estable y después procesa muertes. Si el jugador y el jefe mueren en el mismo paso, el resultado es **derrota**; no se concede victoria por orden accidental del renderizado.
- Una derrota cancela elecciones pendientes, habilidades, proyectiles y recompensas futuras. Un golpe ya inválido no recupera vida para evitar la muerte retroactivamente.

### Fuego

- Un golpe elemental directo aplica una quemadura de **3 s**, con daño por segundo equivalente al **20 %** del daño base del componente de fuego que la originó, antes de modificadores del objetivo.
- Una quemadura activa por objetivo. Una nueva aplicación conserva la mayor potencia y renueva duración; no suma infinitamente potencias.
- El daño de quemadura no vuelve a aplicar quemadura, Ímpetu ni salpicadura.
- El primer ataque elemental mezcla daño físico y fuego con un presupuesto de daño total explícito; no duplicar silenciosamente el daño del golpe al añadir afinidad.
- Maestría inicial propuesta: al morir un enemigo quemado, explosión de radio **1,8 m** y daño de fuego **12**. Esta explosión no genera otra explosión ni quemadura. En 2.7 se podrán definir cadenas limitadas si aportan valor.

### Agua

- Un golpe elemental directo aplica **Empapado durante 3 s**: **15 %** de reducción de velocidad y **25 %** más de desplazamiento recibido por efectos de Agua. No se acumula; nuevas aplicaciones renuevan duración.
- El empuje básico de Agua desplaza hasta **0,4 m** antes de modificadores. Tiene una protección por objetivo de **0,5 s** frente a nuevas aplicaciones de ese empuje para evitar bloqueos continuos.
- No congela, no cura automáticamente y no requiere un segundo elemento para ser útil.
- Maestría inicial propuesta: el primer golpe básico de cada **1 s** sobre un objetivo empapado genera una salpicadura de radio **1,5 m**, daño **8** a enemigos vecinos y aplica Empapado. La salpicadura no genera otra salpicadura; el objetivo principal queda excluido de su daño extra.
- Torbellino de Agua amplía su radio un **20 %** al alcanzar maestría. Sus pulsos aplican el estado pero no disparan la salpicadura reservada al ataque básico.

### Contratos de Tierra y Aire para la fase 2

- Tierra puede aplicar **Quebranto**, que aumenta **15 %** el daño recibido durante **3 s**; no acumula intensidad. Protección y pulsos sísmicos son habilidades separadas. Cifras a validar en 2.4.
- Aire modifica trayectoria, alcance y posición mediante ráfagas/remolinos. No necesita un estado universal adicional en fase 1. Los desplazamientos tienen magnitud, duración y límite de repetición explícitos.
- Resistencias iniciales al control: normales 100 %, élites 40 %, jefe 0 % para desplazamiento forzado y 25 % para la intensidad de ralentización. Quemadura y Quebranto siguen aplicándose salvo excepción visible del enemigo.
- Mantener un historial corto de eventos y etiquetas de origen: directo, periódico, área derivada y contraataque. Cada efecto declara qué orígenes lo activan.

## 7. Experiencia, elecciones y maestría de prueba

**Actualización 1.8 (2026-10-31):** ya se implementa la elección Fuego/Agua en nivel 2. La sustitución temporal por mejoras generales de 1.7 ha finalizado. Afinidades I/II/III convierten 30/40/50 % del daño directo sin aumentar su total. Empuje básico de Agua: 0,2/0,3/0,4 m antes del 25 % de Empapado; se aplica el estado antes de empujar. Desde 1.9, las maestrías usan el núcleo real que deja el élite, recogible junto con ocho esencias. Sustituye el disparador provisional de 1.8.

- Enemigo normal concede **1 esencia**; élite **8** más un núcleo. Absorción a **1,5 m**; atracción desde **3 m**.
- Umbral de siguiente nivel: **4 + 2 × (nivel actual − 1)** esencias. El exceso se conserva.
- En nivel 2, elegir explícitamente Fuego o Agua en el prototipo; es una excepción de dos opciones a la selección ordinaria de tres. El MVP ofrecerá cuatro afinidades en esta elección.
- Elecciones ordinarias: tres mejoras distintas y elegibles. Nunca mostrar opciones maximizadas o incompatibles. Si faltan tres, completar con mejoras generales válidas; si no existe ninguna, convertir la subida en una recompensa definida, sin bloquear la partida.
- Pausar el mundo mientras se elige. Si se ganan varios niveles, encolar elecciones; resolver una por una, sin perder experiencia ni reanudar entre ellas.
- Un golpe enemigo y una subida en el mismo paso se resuelven primero en el dominio de combate. Solo se abre la elección si el jugador sigue vivo.
- Para fase 1: afinidad I/II/III y cuatro mejoras generales provisionales (daño, vida máxima con aumento equivalente de vida actual, velocidad limitada y radio de recogida). Catálogo amplio de técnicas/reliquias llega en fase 2.
- Maestría requiere afinidad III y un núcleo. Si falta uno de los requisitos, conservar el otro y mostrarlo. Se concede elección de maestría sin consumir una subida de nivel, una vez cumplidos ambos.
- Primera maestría de Fuego añade la explosión descrita y Torbellino prolongado a **3,2 s** con ocho pulsos. La de Agua usa la salpicadura y ampliación de radio descritas.

## 8. Estructura de la partida de seis minutos

**Implementación 1.9:** cuatro etapas de generación, pausa de refuerzos normales en los últimos doce segundos de cada minuto, máximo 40 enemigos vivos y 100 proyectiles. A 6:00 se retiran los normales sin premios y se limpian sus proyectiles; si queda el élite se exige derrotarlo antes de anunciar al jefe durante seis segundos. No se acumulan dos enemigos principales ni se concede victoria por reloj. Datos en `game/src/content/campaign.ts` y `enemies.ts`.

| Tiempo de simulación | Contenido propuesto |
|---|---|
| 0:00–1:00 | Perseguidores espaciados, movimiento y primera afinidad |
| 1:00–2:30 | Introducir tiradores, oportunidades de recoger esencia |
| 2:30 | Primer élite accesible y claramente anunciado |
| 2:30–4:00 | Cargadores y combinación de amenazas; posibilidad de maestría |
| 4:00–6:00 | Mayor presión, oportunidades de recuperación y tiempo para usar maestría |
| 6:00 | Anunciar y activar jefe; detener aparición normal y limpiar proyectiles hostiles residuales antes de la transición |
| Jefe | Arena conectada en la misma sección; sin victoria por agotar tiempo |

- El reloj cuenta tiempo de juego activo, excluyendo pausas, cargas y elecciones.
- La transición al jefe elimina enemigos ordinarios residuales sin dar recompensas adicionales. El élite debe resolverse o retirarse de forma visible; el prototipo no apila dos jefes por accidente.
- La lógica de oleadas limita población y composición, no aumenta indefinidamente la velocidad enemiga.
- Sin enemigo ni jugador fuera de límites válidos. Una recuperación de posición nunca concede premios.
- Victoria o derrota muestran duración, bajas, nivel y configuración; reiniciar crea un estado nuevo y semilla nueva. Una semilla fija está disponible solo en desarrollo para reproducir problemas.

## 9. Máquina de estados y orden de simulación

Estados principales: `boot → loading → menu → running → results`; desde `running` se puede pasar a `choosing` o `paused` y volver mediante acciones explícitas. `error` dispone de recuperación o regreso al menú.

- Pausa conserva el estado de combate; resultados lo terminan. Son estados distintos.
- Ocultar pestaña, perder foco o perder captura pausa. Si se estaba eligiendo, conservar la selección pendiente y no saltarla al volver.
- Renderizado puede seguir mostrando la escena en pausa, pero no avanza vida, proyectiles, estados, recargas, reloj ni generación de enemigos.
- La simulación usa paso fijo de **1/60 s**, con interpolación visual. Máximo **5 pasos recuperados por cuadro**; registrar saturación y no simular minutos atrasados al volver de una interrupción.
- Orden: entrada normalizada → temporizadores/estados → movimiento/colisiones → objetivos/acciones → impactos y daño → muertes/recompensas → experiencia/elecciones → eventos para presentación.
- Evitar dependencia de hora del sistema o azar global dentro del dominio. RNG con semilla y orden estable para pruebas; no se promete determinismo idéntico entre todos los navegadores.

## 10. Arquitectura prevista

Se creará código en **1.3**, tras elegir la referencia visual en **1.2**. Esta estructura es una especificación, no carpetas ya implementadas.

```text
src/
  app/          arranque, ciclo principal, cambios de pantalla y coordinación
  game/         estado, movimiento, combate, objetivos, estados, progreso y oleadas
  content/      datos de clases, habilidades, enemigos, mejoras, mapa y balance
  rendering/    escena Three.js, cámara de tercera persona, actores, animación y efectos
  input/        teclado, ratón, captura de puntero, joystick y arrastre de cámara
  ui/           menús, HUD, selección de mejoras y resultados
  audio/        eventos sonoros, música, mezcla y límites
  platform/     capacidades, ajustes locales, persistencia y ciclo de visibilidad
  diagnostics/  métricas y controles de prueba solo de desarrollo
tests/
  game/         reglas y casos de regresión
  integration/  transiciones, selección, recompensas y guardado
public/assets/  recursos finales identificados por manifiesto
```

### Dependencias y contratos

- Three.js para representación 3D; TypeScript estricto para reglas y aplicación; Vite como herramienta de desarrollo y build. Versiones exactas y compatibilidad se comprobarán y fijarán en 1.3, sin actualizar instalaciones globales.
- Dominio `game/` no importa Three.js, DOM ni almacenamiento del navegador. Usa coordenadas y datos numéricos.
- `input/` entrega intención de movimiento y delta de mirada; la aplicación la convierte en movimiento sobre XZ según el rumbo de cámara y la pasa al dominio.
- `rendering/` consume estado y eventos, sin modificar vida, daño ni recompensas. Cámara y colisiones visuales no deciden impactos.
- `content/` define identificadores estables, cifras y condiciones; las implementaciones de efectos viven en sistemas, no en funciones guardadas dentro de partidas.
- Eventos identificados como impacto, daño, muerte, recogida, lanzamiento, nivel y maestría permiten reproducir audio y efectos una sola vez.
- Índice espacial para consultas de enemigos y colisiones; reutilización de proyectiles/efectos donde se mida beneficio. No añadir un framework ECS ni un motor físico general de inicio.
- Estado de partida separado de ajustes y progreso persistente. Guardado con espacio de nombres propio; nunca leer ni escribir partidas de los otros prototipos.
- Interfaz actualizada por cambios y con frecuencia limitada para contadores. No reconstruir el HUD completo cada cuadro.
- Recursos con carga inicial mínima y liberación explícita al abandonar la escena. Un manifiesto identifica archivo, uso y procedencia.

## 11. Reutilización evaluada

Revisión de código y documentación, **sin ejecutar ni copiar proyectos anteriores en esta subfase**.

| Origen | Evidencia revisada | Decisión |
|---|---|---|
| Frontera / Expediciones | `src/platform/training-input.ts` | Adaptar limpieza de teclado/punteros, exclusión de UI y cancelaciones. Rehacer zonas táctiles para movimiento y cámara simultáneos. |
| Frontera / Expediciones | `src/game/training.ts`, `src/game/combat.ts` | Reutilizar como referencia normalización, paso fijo, estados y separación de reglas. No copiar la condición de detenerse para atacar. |
| Frontera / Expediciones | `docs/arquitectura.md` | Tomar patrones de recompensas únicas y presentación por eventos. Su cámara ortográfica y salas no cubren esta tercera persona. |
| Frontera / Expediciones | `src/game/frontier-combat.ts` revisado en análisis previo | No usar como núcleo de hordas: está orientado a pocos enemigos y territorio persistente. |
| Project Chaos | `src/core/game.ts` y `src/core/content.ts` | Referencia de clases, acciones y eventos. No trasladar física lateral, plataformas, destrucción ni controles de duelo. |

Ubicaciones de referencia:

```text
C:\Users\boris\Documents\Codex\2026-09-30\qui\outputs\expediciones-mvp
C:\Users\boris\Documents\Codex\2026-09-23\par\outputs\project-chaos
```

Cada reutilización efectiva se revisa de nuevo al implementar y se acompaña de las pruebas que correspondan. No se estima un porcentaje de código reutilizable sin hacer la adaptación.

## 12. Entorno y presupuesto de rendimiento

### Verificado en esta subfase

- Node.js **22.18.0** y npm **10.9.3** disponibles.
- Equipo local: **AMD Ryzen 5 6600H**, GPU **NVIDIA GeForce RTX 3050 Laptop** y gráfica AMD integrada presentes.
- La presencia de una GPU no prueba que el navegador la utilice. Registrar el entorno real de renderizado al medir.
- No se han instalado dependencias, creado servidor ni ejecutado el juego.

### Objetivos de ingeniería, todavía no medidos

| Perfil | Objetivo | Escena de carga de referencia |
|---|---|---|
| PC local, 1920 × 1080, calidad media | 60 FPS objetivo; p95 de tiempo entre cuadros ≤20 ms | 120 enemigos activos, 100 proyectiles, 150 recogibles y 120 partículas visibles |
| Móvil horizontal, calidad baja | 30 FPS objetivo; p95 ≤40 ms | La misma población lógica, con menor resolución y efectos visuales |
| Desarrollo, fase 1 | 60 enemigos como techo inicial de juego; prueba sintética adicional de 120 | Guerrero con Torbellino y estados elementales simultáneos |

- Partículas y decoración pueden reducirse por calidad; daño, recompensas y cantidad lógica de enemigos no cambian por dispositivo.
- El exceso sobre el límite de población pausa o difiere nuevas apariciones de forma acotada. No mantener una cola infinita de enemigos que aparezca toda junta después.
- Punto de partida: una luz con sombras, sin sombras individuales para todos los enemigos y densidad de píxeles limitada. Ajustar al diseño seleccionado.
- Objetivo de carga inicial comprimida: **≤15 MB**, con personaje y zona inicial prioritarios. Música y contenido posterior pueden cargar por separado.
- Medir una ventana de 60 s después de calentamiento, varios picos de combate y una partida completa; revisar memoria tras cinco reinicios. Estos son procedimientos de aceptación futura.
- Teléfono físico exacto pendiente de identificar antes de afirmar compatibilidad móvil. No bloquea la definición ni la implementación PC; queda como requisito de 4.7.

## 13. Verificación requerida al implementar

| Sistema | Comprobación significativa |
|---|---|
| Movimiento | Diagonal no aumenta velocidad; con el mismo tiempo simulado las posiciones coinciden a distintas frecuencias de renderizado. |
| Cámara | Ratón gira la vista; un cambio de enemigo no la gira; paredes y esquinas no la atraviesan. |
| Entrada | Esc, pérdida de foco y cancelación de puntero no dejan movimiento retenido; dos dedos controlan canales separados. |
| Automatización | Ataques y Torbellino se ejecutan sin pulsar combate; sin objetivo quedan listos y no consumen recarga. |
| Objetivos | Enemigo muerto, oculto tras muro o fuera de alcance no recibe un ataque nuevo; blancos próximos no provocan cambios erráticos. |
| Daño | Un golpe no daña dos veces al mismo objetivo; muerte simultánea de héroe y jefe termina en derrota definida. |
| Estados | Quemadura, Empapado y sus límites cumplen duración/potencia; efectos derivados no generan bucles. |
| Progreso | Varios niveles se resuelven sin perder experiencia; elección y recompensa no se acreditan dos veces. |
| Maestría | Requiere afinidad III y núcleo, independientemente del orden en que se obtienen; modifica comportamiento y habilidad especial. |
| Ciclo | Pausa congela reglas; reinicio limpia estado temporal; no quedan oyentes o recursos acumulándose. |
| Rendimiento | Registrar población, cuadros, tiempo de simulación y efectos durante escenas reproducibles. |

No escribir pruebas que solo repitan constantes. Las pruebas se añaden cuando existan las reglas, junto con casos límite y regresiones reales. En 1.1 únicamente se revisa coherencia documental.

## 14. Cierre y continuidad

### Resuelto

- Plataforma prioritaria, orientación, controles y cámara, con respuestas explícitas del usuario.
- Alcance de la primera partida, duración de prueba y relación con el MVP.
- Reglas implementables de objetivo, ataque, habilidad automática, daño, estados, progreso y pausa.
- Arquitectura, oportunidades y límites de reutilización.
- Entorno local comprobado, presupuesto propuesto y plan de verificación.

### Pendiente por fase, sin bloquear 1.1

- 1.2: referencia artística, proporciones y encuadre visual definitivo en tercera persona.
- 1.3: versiones exactas de paquetes y primer proyecto ejecutable.
- 1.5–1.10: comprobar y ajustar cifras con jugabilidad real.
- 2.4: validar Tierra/Aire en juego; las cifras de este contrato son una base.
- 3.9: kit reducido del Sacerdote, con automatización completa.
- 4.7: dispositivo móvil físico y resultado real de pruebas.

**Siguiente entrega: 1.2 · Dirección artística**, preparando una referencia de Guerrero en los alrededores de la fortaleza desde cámara de tercera persona. No iniciar 1.3 ni construir el escenario antes de establecer esa referencia.

Referencia técnica oficial consultada para el catálogo de componentes gráficos: [documentación de Three.js](https://threejs.org/docs/). Las decisiones de juego y presupuestos de este documento son propuestas del proyecto, no garantías de rendimiento de la biblioteca.

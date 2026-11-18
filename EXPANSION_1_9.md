# Ampliación tras 1.9: mapa, hordas y exploración

Fecha: **2026-10-31**. Estado: **1.9.1–1.9.3 implementadas** en aplicación 0.1.15; pulido inicial **1.10 implementado en 0.1.16**, con revisión manual pendiente en [VERIFICACION_1_10.md](VERIFICACION_1_10.md). Captura y tienda verificadas en [VERIFICACION_1_9_3.md](VERIFICACION_1_9_3.md). Interacciones y reglas verificadas en [VERIFICACION_1_9_2.md](VERIFICACION_1_9_2.md). Resultado y valores elegidos en [VERIFICACION_1_9_1.md](VERIFICACION_1_9_1.md); lo siguiente conserva la propuesta de diseño y las entregas futuras.

## Dirección solicitada

El usuario quiere un mapa que se sienta más masivo, enemigos que aparezcan cerca de donde se desplaza y espacio para recoger objetos, capturar e interactuar con tiendas u otros destinos. Se incorpora antes del pulido 1.10. Se conserva tercera persona, cámara por movimiento del ratón, combate automático y fortaleza como escenario.

Las reglas siguientes son propuestas concretas para desarrollar, no cifras ni decisiones expresamente elegidas por el usuario. «Captura» se interpreta inicialmente como asegurar puntos del terreno; no implica colección de criaturas ni reclutamiento.

## 1.9.1 — Extensión y presión cercana

- Medir el área transitable actual y probar aproximadamente **3–4 veces esa superficie útil**, ajustando recorridos a la velocidad del Guerrero y a una partida de seis minutos más jefe. Es una hipótesis de tamaño, no una dimensión ya implementada ni un objetivo rígido. No multiplicar cada lado por cuatro.
- Conectar claros, caminos entre ruinas, explanada de muralla y borde de bosque. Reservar puntos de interés y referencias que permitan orientarse. El paisaje y las siluetas de la fortaleza aportan escala sin llenar todo de obstáculos.
- Elegir refuerzos en una franja configurable alrededor del jugador. Su distancia interior protege de apariciones a quemarropa y su distancia exterior evita largos tiempos sin contacto. Calibrar por velocidad enemiga, cámara y tiempo hasta el encuentro.
- Preferir posiciones fuera de vista, pero validar distancia segura, suelo libre y ruta hasta el jugador antes de crear un enemigo. Si es visible, anunciarlo antes de que pueda atacar; si no hay candidato seguro, aplazarlo sin acumular una deuda de oleadas.
- Conservar límites globales y añadir objetivo de densidad cercana. Movimiento, rincones, puertas y bordes no deben producir emboscadas inevitables ni dejar la zona vacía indefinidamente.
- Retirar normales persistentemente lejanos y fuera de vista sin bajas, esencia ni dinero; no teletransportar enemigos delante del jugador. No retirar de esta forma élites, jefe, núcleo ni premios únicos. Mantener recogibles accesibles y limitar su coste mediante agrupación compatible con las reglas.
- Revisar la ubicación y acceso del élite y jefe en el mapa ampliado: señalización del destino, ruta transitable y transición que no exija cruzar el mapa sin orientación. Mantener el núcleo del élite y la victoria por muerte del jefe.
- Verificar posiciones con distintas semillas y rutas sobre geometría real, población acotada y limpieza de reinicio; registrar por separado la revisión visual y las mediciones de rendimiento.

## 1.9.2 — Recoger, abrir y usar

| Tipo | Acción propuesta | Primera utilidad |
|---|---|---|
| Esencia, moneda y suministros | Recoger por proximidad, respetando obstáculos | Experiencia, saldo de expedición y curación |
| Cofre | E / botón contextual, cerca y con acceso libre | Premio único de moneda o mejora general |
| Fuente | E / botón contextual | Curación de uso limitado |
| Marcador | Ver destino descubierto y distancia | Elegir hacia dónde explorar |

- Interacción contextual con prioridad estable si hay varios objetos cercanos. No activar a través de paredes ni por una tecla mantenida al cerrar un menú.
- Estados comunes: disponible, en uso y agotado/completado. Semilla de partida para distribución, emplazamientos separados y transitables; no colocar recompensas dentro de sólidos.
- Un saldo de moneda temporal y separado de esencia. Reinicia al comenzar otra expedición; no añadir inventario persistente ni moneda premium.
- Para un suministro de curación con vida llena, dejarlo disponible hasta que pueda aportar beneficio. Cofres/fuentes no generan premios ilimitados al volver a la zona.
- No cambiar la automatización del combate. E se utiliza exclusivamente para el entorno; en teléfono habrá botón contextual independiente del joystick y del giro.

## 1.9.3 — Asegurar un punto y comprar

### Captura provisional: puesto de la fortaleza

Entrar en una zona inicia la captura tras un aviso visible. Permanecer dentro acumula progreso mientras se resiste una oleada; salir detiene el progreso y lo conserva para permitir retirarse. Completarlo concede un premio único y cambia su aspecto. Implementado: radio 6 m, aviso 3 s, permanencia 25 s y premio de 25 monedas; valores editables en `game/src/content/activities.ts`. Solicita hasta tres refuerzos cada seis segundos mediante el director compartido, sujeto a sus comprobaciones y al límite global. Mientras se captura no se aplica el respiro de fin de minuto.

El evento pide enemigos al mismo director y respeta el máximo global; no suma una segunda horda sin límite. Captura y enemigos se congelan durante pausa o elección. Es opcional, no sustituye al élite y no entrega otro núcleo obligatorio. Al entrar en la transición final se desactiva cualquier captura incompleta sin premio, con aviso; una recompensa ya ganada no se pierde.

### Tienda provisional: mercader de campaña

Abrir con E o botón contextual pausa simulación y reloj, libera el ratón y muestra saldo, precio, efecto y existencias. Al salir se requiere la acción de continuar para recuperar controles. Se evita recibir daño mientras se lee el catálogo.

Primer catálogo implementado: curación de 40 por 8 monedas (dos unidades), daño +10 % por 18, vida máxima +20 con curación de 20 por 18, velocidad +0,5 m/s por 16 (una unidad de cada mejora). Estas mejoras comparten el máximo de tres rangos con las subidas de nivel. Las ofertas agotadas o sin efecto útil se deshabilitan; saldo, compra y recompensa se actualizan una sola vez. No hay venta, reventa, crédito ni renovación infinita de ofertas. En 2.7 y 3.6 se incorporan reliquias y recompensas del catálogo definitivo.

La moneda se obtiene de recompensas controladas y de enemigos normales eliminados realmente, con cantidades ajustables. Retirar enemigos lejanos no genera saldo. Las compras no son necesarias para completar la partida y el saldo no persiste entre expediciones.

## Ajustes posteriores

- **1.10:** pulido técnico y auditoría económica aplicados. Verificación automática de recorridos completos; diversión, mezcla de audio, revisión visual, dificultad humana y GPU pendientes en VERIFICACION_1_10.md.
- **2.7:** conectar técnicas/reliquias y límites de configuración a recompensas y ofertas elegibles, sin duplicar catálogos de efectos.
- **3.1–3.2:** ampliar y vestir el mapa ya probado; distribuir destinos y ajustar recorridos, sin reconstrucción obligatoria.
- **3.6–3.7:** versiones completas de puntos de interés, capturas y tiendas; balance conjunto de exploración, hordas, tiempo y economía.
- **3.10:** tutorial contextual de interacción, captura y compra.
- **4.5–4.6:** balance de rutas y economía; rendimiento del mapa ampliado y hordas locales.

Se mantienen cuatro fases grandes y sus identificadores originales. El plan tiene **43 subfases**, con **29 subfases de implementación futuras** tras implementar 2.1; la revisión manual de 1.10 permanece pendiente. No se introduce mundo infinito, supervivencia con fabricación, construcción de bases ni comercio entre jugadores.

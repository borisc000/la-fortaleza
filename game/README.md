> Estado vigente: **E1 completada, aplicación 0.2.15; siguiente E2.1 antes de 2.8**. Las tres clases tienen ocho habilidades, cuatro espacios y niveles hasta 10. Plan: 49 subfases, 22 futuras.

Ver [ritmo y economía 2.7.6](../docs/diseno/RITMO_2_7_6.md).

# La Fortaleza — Los dominios exteriores 0.2.15

Nombre provisional. Prototipo del [MVP](../README.md), realizado con Three.js y TypeScript. Guerrero con ocho habilidades automáticas, cuatro espacios y espada independiente, niveles hasta 10 y ramas. Las tres clases usan los nuevos árboles. Doce reliquias, apoyo elemental opcional y una maestría principal. Mapa de 280 × 260 m; cámara inicial 12 m y rueda 4–18. Acorazado aplazado; hordas densas integradas y primer ajuste de ritmo, economía y claridad integrado; balance humano prolongado pendiente. [Entrega y límites](../docs/diseno/HORDAS_2_7_5.md).

Llegada sur (20, 205), con guardia y primeras recompensas próximas. Seis sectores y siete rutas ya implementados. Interacciones al margen de los caminos y apariciones separadas de sus huellas. Recorridos con combate y cámara verificados en E1.4. Sigue E2.1, puerta y dos torres. Ver [cierre E1](../docs/verificaciones/VERIFICACION_E1_4.md).

## Abrir en el PC

Requiere Node.js 22.12 o superior. Desde esta carpeta:

```powershell
npm ci
npm run dev
```

Abrir http://127.0.0.1:5183/ en un navegador con WebGL 2 y aceleración gráfica. El servidor escucha únicamente en el propio PC. Mantener la terminal abierta; Ctrl+C lo detiene. Los recursos se sirven localmente: no se consultan servicios externos durante la escena. No abrir `index.html` mediante `file://`.

## Controles de esta entrega

- **Equipo y apoyo:** hasta cuatro reliquias distintas, sin reemplazo en esta expedición. Cofres permiten tomar una reliquia compatible o monedas; el puesto añade un premio y el mercader tres ofertas. Desde nivel 5, en niveles impares, puede aparecer otra afinidad o su mejora hasta III. El principal conserva el kit y la única maestría; el apoyo añade estados/control. Sello de pureza bloquea la segunda afinidad. [Catálogo y reglas](../docs/diseno/RELIQUIAS_AFINIDADES_2_7.md).

- **Habilidades automáticas:** ocho por clase, cuatro espacios contando la inicial y básico aparte. Aprende, mejora hasta nivel 10 o elige estadísticas. Las ramas cambian alcance, proyectiles, penetración, duración y recarga; hitos excluyentes en niveles 5 y 10. [Entrega](../docs/diseno/MAGO_ARQUERO_2_7_4.md).

- **Clase y afinidad:** selecciona Guerrero, Mago o Arquero antes de entrar. El Mago elige entre los cuatro elementos desde el comienzo. Desde pausa/resultados puedes volver al selector iniciando una nueva expedición.
- **Arquero automático:** 90 de vida, alcance de 12 m y flechas rápidas. Precisión permite atravesar dos blancos tras dos aciertos y tres tras tres; fallar o pasar 4 s sin acertar rompe la racha. Lluvia automática: cuatro descargas y recarga de 16 s desde el final. Fuego quema; Agua salpica una vez por flecha. [Detalles y maestrías](../docs/diseno/ARQUERO_2_3.md).
- **Mago automático:** 80 de vida, orbes a 10 m y cada cuarto disparo +60 % de daño en área. Cataclismo marca una zona fija, avisa y libera tres pulsos; recarga 14 s desde el final. Todo sin botones de combate.
- **Nuevas afinidades:** Mago/Tierra crea coraza con el cuarto lanzamiento; Mago/Aire empuja con proyectiles y atrae con Cataclismo. Arquero/Tierra aplica Quebranto e ignora armadura; Arquero/Aire aumenta alcance, velocidad y blancos atravesados. [Rangos y maestrías](../docs/diseno/AFINIDADES_2_5.md).
- **Afinidades del Mago:** Fuego quema y Agua ralentiza. Rangos II/III añaden 10/20 % de daño. Maestrías: Erupción mayor suma dos pulsos; Marea creciente amplía el radio y empuja. [Valores completos](../docs/diseno/MAGO_2_2.md).
- **Entrar en el territorio:** inicia explícitamente el encuentro; antes de pulsarlo los enemigos no avanzan.
- **WASD:** caminar respecto al rumbo horizontal de la cámara, a 5 m/s de base (hasta 6,5 con mejoras); Arquero: 5,2–6,7 m/s. Las diagonales no aceleran. El héroe gira hacia donde se desplaza.
- **Táctil horizontal:** joystick flotante al tocar la mitad izquierda; arrastre en la derecha para mirar. Cada dedo conserva su función aunque cruce de lado. Soltar o cancelar uno no cancela el otro.
- **Mover el mouse, sin mantener botones:** girar cámara. Al entrar, continuar tras pausa/elección o reiniciar desde un botón se solicita captura del puntero en PC. Esc libera y pausa. En menús el cursor queda libre. Si el navegador rechaza la captura, mover el mouse sobre el paisaje también gira la vista sin arrastrar; al salir del paisaje deja de girar. El arrastre se conserva para cámara táctil.
- **Rueda sobre el paisaje:** hacia delante acerca; hacia atrás aleja. Distancia inicial de 12 m, ajustable entre 4 y 18 m. Los muros pueden acercar temporalmente la cámara por debajo de ese mínimo para evitar atravesarlos. La rueda no modifica la cámara sobre menús ni durante la pausa; Ctrl/⌘ + rueda conserva el zoom del navegador.
- **Capturar ratón:** permite reintentar la captura si el navegador la rechazó. El control habitual ya la solicita al entrar o continuar; no necesitas este botón normalmente.
- **Espada automática:** el Guerrero selecciona enemigos cercanos y ataca sin clics. Sigue caminando durante los golpes; girar la cámara no cambia su blanco.
- **Ímpetu:** cada espadazo que acierta suma una acumulación, aunque alcance a varios enemigos. Cada una añade 5 % al daño de los siguientes espadazos, hasta +20 %. Tras 3 s sin acertar un nuevo espadazo se pierden todas. El panel muestra cuatro marcas, bonificación y tiempo restante.
- **Torbellino automático:** listo al inicio; se activa al tener un enemigo alcanzable a 2,6 m más su radio. Dura 2,4 s y hace seis pulsos de 12 de daño, separados por 0,4 s. Puede coincidir con la espada y permite caminar a velocidad normal. No atraviesa muros ni genera Ímpetu. Recarga de 20 s desde el final; el panel muestra disponibilidad, duración o recarga, sin botón.
- **Esencia:** cada soldado deja un cristal verde pálido. Se atrae desde 3 m y se recoge a 1,5 m, sin atravesar paredes. El HUD muestra nivel, esencia, oleada y tiempo hasta la transición al jefe.
- **Subida de nivel:** el mundo se detiene. Guerrero y Arquero eligen entre los cuatro elementos al nivel 2; el Mago comienza con afinidad I. Después compiten aprender habilidades, desarrollar las equipadas, estadísticas y afinidades; tres opciones válidas. Pulsa Continuar para retomar; si hay más elecciones pendientes, resuélvelas antes. Perder foco conserva la elección.
- **Tierra del Guerrero:** Quebranto +15 % de daño recibido durante 3 s. La espada obtiene coraza de 8/12/16 puntos, hasta 4 s, cada 6 s. Maestría: tres ondas sísmicas adicionales por Torbellino.
- **Aire del Guerrero:** espada con +0,35/0,55/0,75 m de alcance y empuje. Torbellino atrae; la maestría amplía su radio un 25 %. Respeta muros y resistencia: élite 40 %, jefe inmóvil.
- **Fuego del Guerrero:** convierte 30/40/50 % del daño directo según rango, conservando el total, y aplica quemadura de 3 s. La mayor potencia prevalece y los impactos renuevan duración.
- **Agua del Guerrero:** aplica Empapado 3 s, ralentiza 15 % y la espada empuja hasta 0,2/0,3/0,4 m según rango, aumentado 25 % por Empapado. Protección de 0,5 s entre empujes; no atraviesa paredes, congela ni cura.
- **Núcleo y maestría:** el Portador del núcleo aparece hacia los 2:30. Al derrotarlo deja un cristal dorado con ocho esencias y el núcleo; hay que recogerlo. Con afinidad III se abre una elección extra, sin consumir nivel. Guerrero de la brasa: explosiones al morir enemigos quemados y Torbellino de 3,2 s/ocho pulsos. Guerrero de la marea: salpicadura sobre enemigos ya empapados y Torbellino con 20 % más radio. Un núcleo temprano se conserva; el HUD muestra qué requisito falta.
- **Oleadas:** llegan con el tiempo, sin esperar a recoger toda la esencia. Desde 1:00 incluyen ballesteros; desde 2:30, cargadores. Los últimos cuatro segundos de cada minuto dejan de generar refuerzos normales, salvo mientras resistes dentro de una captura activa; pero los enemigos presentes siguen activos. Aparición anunciada de 1,5 s, tres segundos para el élite y seis para el jefe.
- **Ballestero:** una línea azul anuncia su tiro. Esquiva lateralmente; el virote no te sigue y lo bloquean las paredes.
- **Devastador:** una franja ámbar marca su carga. Sal de ella antes de que avance; no puede girar para perseguirte durante la embestida.
- **Castellano Vacío:** tras seis minutos se retiran los enemigos normales sin recompensas. Si el élite sigue vivo, debes vencerlo primero. El jefe anuncia barrido, golpe circular y andanada; a media vida entra en furia. Aprovecha su recuperación entre ataques. Solo derrotarlo da la victoria.
- **Arco ámbar enemigo:** prepara un ataque. Sal de su alcance o dirección antes del golpe. Tocar al enemigo no produce daño por sí solo.
- **↶ / ↷ / Centrar:** girar y volver a situar la cámara detrás de la orientación actual del personaje; conserva la distancia elegida.
- **Ajustes y diagnóstico:** calidad, distancia, sensibilidad, invertir vertical, sonidos y volumen. Abrir el panel pausa la expedición; Continuar lo cierra. Sonidos al 25 % inicialmente, activados después de Entrar; conserva los ajustes al reiniciar. Los avisos visuales siguen disponibles al silenciar.
- **Pausar / Esc / pérdida de foco:** detener el bucle; volver a la pestaña exige pulsar Continuar.
- **Reiniciar encuentro:** disponible en pausa y en el resultado. Restablece vida, enemigos, posiciones, ataques, reloj, experiencia, mejoras y elecciones, conservando ajustes y distancia de cámara. Los antiguos botones de teletransporte se retiraron de la interfaz de combate.

En vertical estrecho se pausa y se pide girar el dispositivo; al regresar hay que pulsar Continuar. La pausa, pérdida de foco o interacción con menús limpian teclas y punteros. Una tecla mantenida durante una pausa debe soltarse antes de volver a mover. No hay ataques manuales ni botones de habilidades. La victoria exige sobrevivir al asedio y derrotar al Castellano; llegar a seis minutos por sí solo no termina la partida. El jefe se combate en el territorio cerca de la ubicación actual, sin teletransporte. Cada reinicio genera una semilla nueva para las posiciones de refuerzo.

## Arquitectura

### Territorio y director local

Refuerzos a 11–23 m con distancia segura, ruta para el enemigo y el héroe, y preferencia fuera del encuadre. Aviso antes de activarse incluso si aparecen visibles. Reposición local limitada y suspendida durante respiros; máximo provisional de 100 vivos. Normales a más de 38 m durante ocho segundos continuos fuera de vista se retiran sin recompensas. Élites, jefe y recogibles se conservan. El jefe aparece cerca de la ubicación actual sin teletransporte del héroe. Nombre de zona y guía relativa a la cámara indican puerta/élite/núcleo/jefe. El núcleo pendiente tiene prioridad.

| Carpeta | Responsabilidad |
|---|---|
| `src/content` | Parámetros de cámara, jugador, enemigo, ataque, mejoras, tipos enemigos y etapas de oleadas |
| `src/domain` | Movimiento, contactos, navegación, objetivos, ataques, Ímpetu, Torbellino, daño, muerte, esencia, progresión, quemadura, Empapado, efectos derivados, proyectiles y director de partida |
| `src/app` | Estado de carga, entrada, pausa, elección, resultado y error |
| `src/input` | Estado de teclas y dos punteros; conexión de teclado, ratón, táctil, captura y pérdida de foco |
| `src/rendering` | Escena, materiales, personajes provisionales, animación, arcos, números de daño, cristales de esencia/núcleo, anticipaciones, proyectiles y cámara |
| `src/rendering/collision.ts` | Funciones puras de volumen de cámara y recuperación |
| `src/ui` | Interfaz DOM: HUD, radar, tutorial, anuncios, subida de nivel, tienda, resultados y ajustes. Lee la partida mediante `UiContext`; no la modifica salvo a través de `run.choose` y `run.shop.buy` |
| `src/main.ts` | Coordinación: carga, bucle de simulación y render, fases, redimensionado y botones |
| `public/assets` | Materiales y cielo locales con manifiesto de origen |

El render consume eventos y estado; no decide daño ni orientación de ataque. Movimiento y combate corren a 60 pasos por segundo con interpolación visual. Se recuperan como máximo cinco pasos por cuadro (83,33 ms), registrando saturación en diagnóstico. Unidades: metros y segundos. La cámara conserva su rumbo aunque el Guerrero golpee hacia otro lado. Los personajes y sus animaciones son provisionales.

El perseguidor usa una rejilla de navegación de 0,8 m con conexiones estáticas comprobadas, búsqueda inversa compartida y actualización de ruta cada 0,3 s. El desplazamiento físico conserva las colisiones circulares. Enemigos separados suavemente; sin empuje dañino por contacto.

## Validación

```powershell
npm test
npm run build
npm run preview
```

`npm test` ejecuta la suite rápida (unos 30 s). Las partidas completas simuladas (14 campañas de seis minutos sobre el mapa real y 12 sondas de supervivencia) están en `tests/simulation/` y se ejecutan con `npm run test:sim` (unos 20 min). La CI de GitHub corre la suite rápida, el typecheck y el build en cada push y PR, y las simulaciones solo en `main` o a mano.

La última orden sirve `dist/` en http://127.0.0.1:4183/. Compilar no publica el proyecto. La advertencia de tamaño del paquete se debe principalmente al motor Three.js; se registra para optimización posterior.

Consultar [VERIFICACION_2_7.md](../docs/verificaciones/VERIFICACION_2_7.md) y los registros históricos anteriores. Los FPS del panel son una muestra reciente de intervalos de `requestAnimationFrame`; p95 mide el intervalo de fotograma, no tiempo de GPU. Se reinicia la ventana de muestreo al pausar. No extrapolar las pruebas de simulación a rendimiento de hordas o teléfonos físicos. El límite de población no es una medición de FPS.

## Recursos y límites

Ver [CREDITOS.md](CREDITOS.md). Carga de 13 archivos con tiempo máximo de descarga por archivo de 15 s, progreso, materiales de reserva y aviso de fallos. Errores de WebGL muestran recuperación mediante recarga. Sombras y resolución limitadas por calidad; geometría estática agrupada por material. La cámara comprueba un volumen conservador contra cajas de arquitectura y suelo, se acerca inmediatamente y vuelve suavemente.

El jugador usa un cuerpo circular de radio 0,4 m. Las colisiones cubren murallas, puerta, ruinas, cajas, troncos, viga caída y vallado; piedras pequeñas y hierba son transitables. No hay salto, escalada ni interior accesible. Esta entrega implementa el ciclo de seis minutos, élite y jefe preliminar; el núcleo provisional de 1.8 ha sido retirado. Las ofertas generales siguen rotando de forma determinista. Las posiciones de refuerzo varían por semilla; el dominio acepta una semilla fija para reproducir pruebas (la usada por el navegador figura en el atributo data-seed del canvas). Máximo 100 enemigos vivos, 100 proyectiles enemigos y 32 proyectiles del héroe; las oleadas omitidas por saturación no se acumulan. Los cadáveres normales se retiran de simulación tras dos segundos con identificadores no reutilizados. Audio esencial y pulido de claridad implementados en 1.10; balance humano, escucha real, revisión visual y medición GPU permanecen pendientes. No se requiere cuenta ni se guarda progreso.

## Recogibles e interacción — 1.9.2

- Monedas y suministros se recogen a 1,6 m con línea libre. Los suministros curan hasta 20 y esperan si la vida está llena.
- E o botón contextual a 2,6 m: cofres con elección de una reliquia o 8–14 monedas, una sola apertura; fuentes de dos usos, hasta 35 de vida cada uno. Mantener E no encadena usos.
- Un enemigo normal muerto deja una moneda; retirarlo por distancia no da premios. El saldo se reinicia en otra expedición.
- Descubrimiento a 24 m, hasta tres puntos cercanos señalizados; tapa abierta y fuente sin agua identifican usos agotados.
- Los cofres abren una elección y pausan; las fuentes conservan su interacción inmediata sin menú. El botón táctil permite interactuar sin ataque manual.

## Captura y mercader — 1.9.3

- Cerca de la explanada hay un puesto con bandera y círculo de 6 m. Entrar inicia un aviso de 3 s; resistir 25 s concede 25 monedas y una elección de reliquia o 12 monedas adicionales, una sola vez. Salir conserva el avance. Atrae refuerzos del director existente y respeta su máximo de 100 enemigos.
- La captura es opcional y no da núcleo. A 6:00 se cierra si no se completó. Las pausas, elecciones y compras detienen su progreso.
- El mercader se descubre igual que los demás destinos. Acércate y pulsa E o el botón contextual: el mundo y el reloj se detienen y el cursor queda libre.
- Ungüento: hasta 40 de vida por 8 monedas, dos unidades. Daño +10 % por 18; vida máxima +20 con curación equivalente por 18; velocidad +0,5 m/s por 16; una unidad de cada mejora. Comparten los tres rangos máximos con las subidas de nivel.
- El mercader añade tres reliquias por semilla: dos generales y una especializada, con una unidad de cada una. Requisitos y espacios disponibles se comprueban antes de cobrar.
- Sin saldo, con vida llena, rango máximo o existencias agotadas, la oferta queda deshabilitada. Las compras y el stock no se renuevan al reabrir.
- Continuar expedición reanuda y solicita captura del ratón; Esc cierra y deja el juego pausado. Reiniciar limpia captura, compras, stock y saldo.
- Puesto y tenderete son representaciones procedurales provisionales y transitables, como los demás objetos de exploración.

## Hordas 2.7.5

Mayoría de no muertos frágiles, objetivos locales de 20/40/60/90 y límite provisional de 100 vivos. Avisos y recompensas únicos, captura con presupuesto compartido. Ver [entrega](../docs/diseno/HORDAS_2_7_5.md) y [verificación](../docs/verificaciones/VERIFICACION_2_7_6.md).

## Laboratorio de modelos

Abrir [Atelier](http://127.0.0.1:5183/model-lab.html) con el servidor iniciado. Catálogo de 16 modelos/conjuntos, giro, zoom, malla, iluminación y notas por modelo exportables. [Alcance y verificación](../docs/diseno/LABORATORIO_MODELOS.md).

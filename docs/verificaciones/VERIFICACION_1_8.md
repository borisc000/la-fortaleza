# Subfase 1.8 — Fuego, Agua, maestrías y cámara sin arrastre

Fecha: **2026-10-31** · Versión **0.1.8** · Estado: **implementada; 82 pruebas automatizadas, TypeScript y compilación correctos**.

## Cambio de cámara solicitado

- En PC, **Entrar**, **Continuar** después de pausa/elección y **Reiniciar** solicitan captura del puntero desde esa acción del usuario. No se captura al cargar la página ni al volver a una pestaña automáticamente.
- La cámara usa el movimiento relativo del mouse sin mantener botones. Se conservan sensibilidad, inversión vertical, colisión y zoom de 4–12 m.
- Esc, pérdida de captura, foco o visibilidad pausa. Las elecciones liberan el cursor y conservan la pausa hasta resolverlas y pulsar Continuar.
- Si el navegador rechaza la captura, mover el mouse sobre el paisaje también gira la cámara **sin arrastrar**. Fuera del paisaje o sobre controles no gira; al volver se descarta el primer delta para evitar saltos. Un aviso explica esta alternativa y el botón **Capturar ratón** permite reintentar.
- Táctil conserva joystick izquierdo y arrastre derecho. Una entrada táctil no solicita captura automática; ambos dedos mantienen controles independientes.
- Una captura que llega tarde, después de pausar, se libera sin reanudar la partida.

## Afinidad y progresión

- Nivel 2: dos opciones explícitas, **Fuego** o **Agua**, una por partida. Sustituye la mejora general provisional de 1.7 en ese nivel.
- Elegir elemento concede afinidad I. En posteriores niveles se ofrece afinidad II/III junto a dos mejoras generales válidas. Al llegar a III, desaparece esa opción y vuelven las tres generales elegibles.
- Afinidad convierte **30/40/50 %** del daño directo en componente elemental. El total directo se conserva: por ejemplo, 18 de espada sigue sumando 18 entre físico y elemental. Ambos componentes usan la armadura del objetivo; resistencias elementales independientes todavía no se implementan.
- Para Fuego, la proporción aumenta la potencia de quemadura. Para Agua, el empuje básico aumenta por rango. Las mejoras generales conservan límites y comportamiento de 1.7.
- Al despejar el **segundo grupo** se concede un **núcleo provisional**, una sola vez y sin dar experiencia adicional. No aparece un élite ficticio: esta fuente se sustituirá por el élite real en 1.9.
- Afinidad III + núcleo abre una elección extra de maestría correspondiente al elemento elegido. Funciona en cualquier orden de obtención; el HUD muestra afinidad y núcleo pendiente/obtenido. La maestría consume el núcleo y no consume un nivel ni otra elección.
- La cola de maestría tiene identidad propia; repetir un clic no duplica la transformación. No se reanuda entre elecciones pendientes. Derrota cancela la cola; reinicio borra afinidad, núcleo, maestría y estados.

## Fuego

- Espada y pulsos de Torbellino aplican quemadura de **3 s**. DPS igual al **20 % del componente de Fuego antes de la armadura del objetivo**. Una quemadura por enemigo; se conserva la mayor potencia activa y se renueva duración.
- Daño periódico en intervalos de **0,5 s**, seis pulsos en una quemadura no refrescada. Refrescar no reinicia el intervalo pendiente: los ataques frecuentes no impiden que ocurra el daño.
- Quemadura no genera Ímpetu, nueva quemadura ni salpicadura. Los números fraccionarios inferiores a uno se muestran con un decimal, evitando falsos impactos de cero.
- **Guerrero de la brasa:** un enemigo que muere quemado explota en radio **1,8 m**, causando **12 de daño** a vecinos válidos. Se comprueban obstáculos. La explosión no aplica quemadura ni provoca otra explosión, incluso al matar un vecino que ya estaba quemado.
- Su siguiente Torbellino dura **3,2 s** y ejecuta **ocho pulsos** separados por 0,4 s. Recarga de 20 s desde el final.

## Agua

- Espada y Torbellino aplican **Empapado durante 3 s**, renovable sin acumular intensidad: **−15 % de velocidad** y **+25 % de desplazamiento de Agua recibido**.
- La espada empuja **0,2/0,3/0,4 m** según afinidad, antes del modificador de Empapado. El estado se aplica antes de empujar: el máximo efectivo de esta entrega es 0,5 m en rango III.
- Protección por enemigo de **0,5 s** entre empujes. El desplazamiento respeta cuerpos, arquitectura y límites mediante el mismo resolvedor de colisiones. Los pulsos de Torbellino empapan, pero no empujan.
- Agua no congela ni cura automáticamente.
- **Guerrero de la marea:** el primer espadazo sobre un enemigo **ya empapado** produce una salpicadura de radio **1,5 m**, daño **8** a vecinos y Empapado. El objetivo principal queda excluido del daño extra. Máximo una salpicadura por segundo para el Guerrero, compartido entre blancos, sin cadenas ni activación por Torbellino.
- Su siguiente Torbellino tiene **20 % más radio**, de 2,6 a **3,12 m**, conservando seis pulsos y 2,4 s. La adquisición y los impactos usan el radio ampliado; las paredes siguen bloqueando.

## Integración y representación

- El ataque básico conserva la afinidad y multiplicador que tenía al comenzar. Un Torbellino ya iniciado conserva elemento, duración, pulsos y radio; una mejora o maestría adquirida durante su ejecución se refleja en el siguiente lanzamiento.
- Los impactos directos y periódicos comparten resolución de daño/muerte. Las fuentes derivadas están etiquetadas para impedir recursión. Derrota simultánea tiene prioridad y no concede núcleo, experiencia ni elección salvadora.
- Cuatro grupos de prueba **5/7/8/8**, **28 soldados**, para llegar al nivel 5. Elegir afinidad II y III en las primeras oportunidades permite activar maestría durante el tercer grupo y usarla contra el cuarto. También se puede priorizar mejoras generales y posponer la maestría.
- HUD con elemento, rango y requisitos; resultado incluye la configuración. Brasas en enemigos quemados, anillos de Agua para Empapado, colores de espada/Torbellino, ondas de explosión/salpicadura y aura con tres marcas para maestría. Geometría procedural propia; sin nuevas descargas ni dependencias.
- Los arcos de anticipación del enemigo conservan su función. Personajes, animaciones y efectos siguen siendo provisionales; no se presenta esta geometría como arte final semirrealista.
- Efectos visuales de área limitados a 24 simultáneos; liberación de materiales, geometrías, estados y objetos al reiniciar/salir. La representación no decide daño.

## Comprobaciones realizadas

- **82/82 pruebas correctas**, incluidas las regresiones anteriores y 21 casos añadidos: 19 de elementos/progresión/mirada/representación, uno de conexión de entrada con DOM simulado y una segunda integración completa del mapa para Agua.
- Casos cubiertos: afinidad única, requisitos de maestría en ambos órdenes, núcleo único, conservación de presupuesto directo, duración/potencia/refresco de quemadura, muerte única, explosión sin cadena y bloqueada por muro, ocho pulsos, configuración conservada durante ataques, ralentización real, empuje limitado con protección y colisiones, salpicadura con límite global y exclusión del principal, radio de Agua, derrota simultánea, pausa y reinicio.
- Entrada: deltas con cero botones pulsados, giro sin captura, descarte al entrar/salir de UI y pausa, solicitud de captura, pérdida de captura, rechazo y exclusión de entrada táctil. **Es una prueba de lógica con DOM simulado, no una interacción real con el navegador.**
- Integración de **Fuego** sobre mapa real: victoria a **67,48 s de simulación**, 28 bajas, 28 esencias, nivel 5 y maestría. **Agua:** victoria a **69,18 s**, mismos resultados de progreso. Cada ruta resuelve cuatro elecciones de nivel y una de maestría. Solo estas pruebas amplían vida para aislar progresión y navegación; el juego mantiene 100 de vida base. No son mediciones de dificultad humana ni FPS.
- Se conservan las pruebas de refuerzos desde 48 posiciones del mapa, movimiento, cámara, muros, controles táctiles, daño, Ímpetu y Torbellino.
- `npm run build` correcto, incluido TypeScript. HTML **7,02 kB**, CSS **11,49 kB**, JS **658,36 kB**, gzip estimado de JS **173,30 kB**. Persiste la advertencia de paquete JS >500 kB; sin dependencias nuevas.
- Servidor local HTTP **200**, versión 0.1.8 e indicadores de afinidad y mouse presentes. Disponible en `http://127.0.0.1:5183/`. Sin publicación.

## Pendientes y siguiente entrega

Se volvió a consultar la herramienta de navegador: **“Local browser use is disabled in Work settings”**. No se eludió este ajuste. Revisión visual de los nuevos efectos/menús, captura con ratón físico, GPU, teléfono horizontal y balance jugado por una persona siguen pendientes; no se atribuyen esas comprobaciones a los tests automatizados.

Siguiente subfase: **1.9 · Ciclo de partida y amenazas**: enemigos adicionales, élite real y su núcleo, director de oleadas y jefe preliminar. La prueba de cuatro grupos no sustituye ese ciclo.

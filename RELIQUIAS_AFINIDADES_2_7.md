# Reliquias y doble afinidad — 2.7

Fecha: 2026-11-01 · Aplicación 0.2.7. Valores iniciales de balance, pendientes de prueba humana.

## Configuración de la expedición

Cada personaje puede llevar tres técnicas, cuatro reliquias distintas y hasta dos elementos. Los espacios de técnicas y reliquias son independientes. Las reliquias no tienen rangos ni se sustituyen durante la expedición; el reinicio limpia el equipo. Guerrero, Mago y Arquero conservan sus armas y habilidades automáticas. Acorazado permanece aplazado.

El elemento principal conserva el kit, sus rangos y la única maestría. Desde nivel 5, en niveles impares, puede aparecer una segunda afinidad entre las tres alternativas, en rotación. Aprenderla y mejorarla hasta III consume elecciones de nivel; no es obligatorio. Una vez adquirida, se ofrecen sus mejoras en lugar de otros elementos. No hay tercer elemento, otra maestría ni fusiones nuevas.

| Elemento de apoyo | Efecto en rangos I / II / III |
|---|---|
| Fuego | Quemadura durante 3 s, con 3 / 4 / 5 % del daño del impacto por segundo |
| Agua | Empapado durante 0,8 / 1,2 / 1,6 s; ralentiza 15 % |
| Tierra | Quebranto durante 0,8 / 1,2 / 1,6 s; aumenta 15 % el daño posterior |
| Aire | Los ataques básicos empujan 0,10 / 0,16 / 0,22 m; protección de 0,5 s entre empujes |

El apoyo añade estados o control sin duplicar el daño directo. Si Fuego es principal, combinarlo reduce su potencia de quemadura al 70 %; conserva sus restantes reglas. El apoyo no hereda las habilidades completas de otro kit. Los empujes respetan muros y posiciones: enemigos normales 100 %, élite 40 %, jefe 0 %. Agua y Fuego pueden coexistir; no hay cancelaciones elementales.

## Doce reliquias

Los porcentajes de daño se suman al daño base junto a las mejoras generales. Los aumentos de velocidad respetan el máximo de cada clase. Las reliquias elementales admiten el elemento como principal o apoyo.

| Reliquia | Efecto | Precio |
|---|---|---:|
| Colmillo de hierro | +12 % de daño base | 28 |
| Corazón de roble | +25 de vida máxima y recupera 25 una sola vez al equipar | 26 |
| Botas del caminante | +0,4 m/s | 24 |
| Piedra de llamada | +0,8 m de atracción y recogida de esencia | 22 |
| Medallón de hierro | Reduce 10 % el daño recibido, antes de coraza | 30 |
| Sello de renovación | Recupera 2 de vida al matar, como máximo una vez por segundo | 32 |
| Ascua perpetua | +30 % de potencia de quemadura; requiere Fuego | 30 |
| Perla de las mareas | +1,5 s de Empapado; requiere Agua | 26 |
| Runa de fractura | +1,5 s de Quebranto; requiere Tierra | 26 |
| Pluma del vendaval | +0,5 m/s; requiere Aire | 24 |
| Sello de pureza | +15 % de daño base; exige una afinidad y bloquea adquirir la segunda | 30 |
| Nexo de concordia | +12 % de daño base; requiere dos afinidades | 30 |

Sello de renovación no revive al héroe ni cura por enemigos retirados. Ninguna reliquia puede comprarse o recibirse dos veces. El Sello de pureza compromete la configuración durante esta expedición; su descripción avisa de ello antes de elegir.

## Obtención y decisiones en el mapa

- Cofres: E abre una elección pausada con hasta tres reliquias compatibles y la alternativa de tomar sus 8–14 monedas originales. Se abre una vez; elegir reliquia no concede además esas monedas.
- Puesto: completar la captura conserva las 25 monedas y añade una elección de reliquia, intercambiable por 12 monedas adicionales.
- Mercader: conserva las cuatro ofertas generales y añade tres reliquias por semilla, dos generales y una elemental, pura o dual. Una unidad de cada una; las incompatibles muestran el requisito y no cobran monedas.
- Cuatro espacios llenos: los premios siguen permitiendo tomar monedas y la tienda bloquea otra reliquia. Nunca se pierde una existente ni se exige reemplazarla.

Estas recompensas no consumen elecciones de nivel. Maestría pendiente tiene prioridad, después reliquias y después niveles. Todos los menús detienen mundo y reloj. La semilla reproduce las ofertas; no cambian al reabrir ni al pulsar repetidamente. Nuevas elecciones revalidan requisitos y duplicados.

## Combate, interfaz y límites

El impacto aplica su daño una vez, resuelve el efecto principal y luego el apoyo. El Quebranto recién aplicado beneficia golpes posteriores. Quemaduras, explosiones y salpicaduras derivadas no vuelven a activar apoyos; no generan cadenas recursivas. Las acciones en vuelo conservan la configuración con que salieron. Las mitigaciones de armadura/Guardia/Medallón se resuelven antes de la coraza finita.

El HUD y resultados muestran ambos elementos, una maestría principal y los cuatro espacios de reliquias. El menú de elecciones incluye inventario con descripciones; la tienda muestra el equipo actual. Un segundo aro distingue visualmente la afinidad de apoyo, manteniendo una sola corona de maestría. Representación procedural provisional, pendiente de revisión visual interactiva.

Se mantienen mapa de 212 × 192 m, seis minutos más jefe, controles y dependencias. Ver [verificación](VERIFICACION_2_7.md). La siguiente subfase es **2.8: doce maestrías**, para revisar sus interacciones con técnicas, apoyo y reliquias y completar su presentación.

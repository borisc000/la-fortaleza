# 2.7.1 — Repertorios y elecciones de habilidades

Fecha: 2026-11-02. **Definición completada; implementación en 2.7.3–2.7.4.** Aplicación disponible: 0.2.7. Las cifras siguientes son valores iniciales de diseño, pendientes de balance con hordas. Sustituye las propuestas de cinco habilidades y rangos sin concretar de COMBATE_MASIVO_2_7.md.

## 1. Lo que se construye durante una partida

- **Ocho habilidades por clase**, 24 en total. Hasta **cuatro equipadas**, incluida la inicial. Sin reemplazo durante la expedición; las tarjetas avisan del espacio que ocuparán.
- Básico y pasiva propios fuera de esos espacios. Torbellino, Cataclismo y Lluvia empiezan a nivel 1 y ocupan el primero; las otras siete se aprenden eligiendo una tarjeta.
- Cada habilidad tiene **niveles 1–10** y su propio árbol. Aprender concede nivel 1; cada mejora elegida sube exactamente un nivel. Las mejoras del árbol son alternativas, no puntos gratuitos adicionales.
- Un básico también puede mejorarse hasta 10, con árbol propio descrito abajo; no se aprende de nuevo ni consume espacio. La pasiva conserva su funcionamiento y recibe solo los modificadores expresamente indicados.
- Tres alternativas al subir de nivel: invertir en estadísticas, desarrollar un ataque conocido o aprender una habilidad de la clase. Afinidades compiten en estas elecciones. Sin adquisición obligatoria por tiempo, enemigo especial o nivel de personaje.
- Cuatro reliquias, dos afinidades máximas y una maestría principal se conservan. No se requiere llenar todos los espacios ni llevar todo a 10. R manual sigue pendiente; todo este repertorio se activa automáticamente.

Hay 35 selecciones posibles de tres habilidades adicionales entre siete por clase, antes de considerar ramas, estadísticas y elementos. Una configuración de Torbellino muy desarrollado y pocas habilidades debe competir con otra de cuatro ataques menos desarrollados.

## 2. Nivel 10 y más de diez opciones por habilidad

Cada árbol tiene **cuatro ramas de tres rangos**: doce inversiones posibles. Se nombran A/B/C/D en las tablas. Los niveles 2, 3, 4, 6, 7, 8 y 9 conceden siete inversiones en esas ramas: cada tarjeta elige una rama y sube un rango. No se puede completar todo el árbol en una expedición.

En **nivel 5**, se escoge una de dos mutaciones; en **nivel 10**, uno de dos remates. Son elecciones excluyentes por expedición. Resultado: **16 opciones diseñadas por habilidad** (doce rangos de rama, dos mutaciones, dos remates), de las que una trayectoria toma nueve después de aprender. Las ramas no elegidas no se cobran ni se conceden automáticamente.

| Nivel de habilidad alcanzado | Elección |
|---|---|
| 1 | Aprender; comportamiento base |
| 2, 3, 4 | Una inversión A/B/C/D, respetando tres rangos por rama |
| 5 | Una de dos mutaciones exclusivas |
| 6, 7, 8, 9 | Otra inversión A/B/C/D |
| 10 | Uno de dos remates exclusivos; después desaparecen ofertas de mejora |

Las ramas se pueden mezclar. Por ejemplo, A3/B3/C1 es distinto de A1/B1/C2/D3. No se reinician al alcanzar una mutación. Una habilidad de nivel 10 tiene siete puntos de rama, una mutación y un remate; su nivel es independiente del nivel de personaje.

**Regla común de ramas.** A es Potencia: +12 % de daño base por rango, salvo que la tabla declare un efecto defensivo. B/C son formas específicas de atacar. D es Ritmo: −8 % de recarga base por rango, salvo excepción explícita. Las cifras de B/C son incrementos por rango sobre el valor base, no valores totales. Proyectiles adicionales llevan la fracción de daño indicada para que su número no multiplique sin límite el daño total.

Las mutaciones cambian forma, orientación o persistencia. Los remates dan una recompensa visible al especializarse. Ninguno activa otra habilidad, otra mutación o una cadena infinita por su cuenta. Los efectos se aplican sobre la configuración con la que empezó cada acción.

## 3. Guerrero — controlar el espacio con acero

Abreviaturas: daño físico antes de afinidades/bonificaciones, CD = recarga; todos los ataques respetan muros. El daño periódico indica daño por impacto o pulso, no daño total.

| Habilidad | Base de nivel 1 | B: expansión | C: especialización | Mutaciones de nivel 5 (escoge una) | Remates de nivel 10 (escoge uno) |
|---|---|---|---|---|---|
| **Torbellino**, inicial | 6 pulsos × 12, radio 2,6 m; CD 20 s tras terminar | +0,25 m de radio/rango | +1 pulso y +0,4 s/rango | **Huracán de acero:** radio +25 %, daño/pulso −15 % · **Giro triturador:** radio −15 %, daño/pulso +35 % | **Segunda vuelta:** repite una vez 3 pulsos al 50 % sin nuevos procs · **Centro de la tormenta:** núcleo de 1,2 m hace +60 % de daño |
| **Onda de acero** | Corte frontal de 24, recorre 7 m y hasta 3 blancos; CD 6 s | +1 onda lateral al 40 %/rango; abanico centrado, no aumenta recarga | +1 blanco atravesado y +0,75 m de recorrido/rango | **Abanico de guerra:** apertura +35° · **Hoja de retorno:** vuelve por su trayecto al 40 %, una vez por blanco en regreso | **Brecha:** primer blanco recibe +100 % · **Media luna:** impacto final estalla en 2 m al 60 %, una vez por onda |
| **Hachas giratorias** | 1 hacha orbital, 10/golpe, radio 1,7 m, activa 4 s; CD 9 s tras terminar | +1 hacha al 50 %/rango, máximo 4 | +0,75 s de duración/rango | **Órbita amplia:** radio +0,6 m · **Círculo cerrado:** radio −0,3 m, velocidad angular +50 % | **Ronda exterior:** una segunda órbita de 2 hachas al 35 % · **Acero persistente:** +3 s de duración |
| **Martillo de guerra** | Golpe frente al héroe, 38 en radio 2 m; CD 8 s | +0,25 m de radio/rango | +15 % de daño contra élite/jefe/rango | **Ruptura:** alcance frontal +1,5 m · **Cerco:** círculo centrado en héroe con daño −20 % | **Réplica:** segundo golpe al 50 % tras 0,6 s · **Verdugo:** +75 % contra blancos por debajo de 35 % de vida |
| **Lanzas espectrales** | Lanza de acero espectral de 22, alcance 8 m, atraviesa 2 blancos; CD 5 s | +1 lanza al 45 %/rango, hacia blancos distintos si existen | +1 blanco atravesado/rango | **Falange:** lanzas paralelas al frente · **Cerco de lanzas:** reparto radial hacia amenazas cercanas | **Punta de asedio:** +80 % al primer blanco · **Línea de muerte:** pérdida de daño por penetración pasa de 15 % a 0 % |
| **Estandarte de guerra** | Zona fija de 3 m durante 4 s: +12 % de daño del héroe dentro; CD 14 s tras terminar | +0,4 m de radio/rango | +1 s de duración/rango | **Avance:** se ancla al héroe, radio −25 % · **Bastión:** fijo, daño del aura pasa a +20 % | **Resistencia:** dentro reduce 15 % de daño recibido · **Última orden:** tras salir conserva el bono 3 s, sin acumulación |
| **Guardia de represalia** | Barrera de 12, dura hasta 3 s; al romperse/expirar una onda de 16 en 2 m; CD 12 s tras terminar | +0,25 m al radio de onda/rango | +4 de barrera/rango | **Guardia larga:** +2 s de duración · **Represalia inmediata:** onda al activar, no al terminar | **Muro de hierro:** +16 de barrera · **Castigo:** onda +100 % de daño, sin aumentar barrera |
| **Cadena de guerra** | Gancho al enemigo cercano a ≤6 m, 18 y arrastre hacia héroe de hasta 0,6 m; CD 7 s | +1 blanco al 50 %/rango | +0,15 m de arrastre/rango | **Cadena larga:** alcance +3 m · **Cadena circular:** busca alrededor, daño +20 %, alcance −1 m | **Yunque:** blancos alcanzados reciben +12 % de daño durante 2 s, no suma con Quebranto: usa el mayor · **Eslabones:** une hasta 2 blancos cercanos adicionales al 35 %, sin volver a encadenar |

Excepciones A: Estandarte +2 puntos porcentuales de su bono/rango; Guardia +12 % de daño de onda/rango, la barrera solo sube por C. Las armas espectrales conservan aspecto de acero y la lectura cuerpo a cuerpo del Guerrero; no usan teletransporte ni invocaciones autónomas.

## 4. Mago — proyectiles, zonas y combinaciones

| Habilidad | Base de nivel 1 | B: expansión | C: especialización | Mutaciones de nivel 5 | Remates de nivel 10 |
|---|---|---|---|---|---|
| **Cataclismo**, inicial | 3 pulsos × 18 en zona fija de 3,2 m; CD 14 s tras terminar | +0,25 m de radio/rango | +1 pulso/rango, intervalo 0,35 s | **Concentrado:** radio −20 %, daño +35 % · **Fracturado:** dos zonas separadas de radio 2 m al 55 % por pulso | **Último sello:** último pulso +100 % · **Desastre extenso:** radio +35 % |
| **Lanzas arcanas** | Proyectil de 26, alcance 11 m, hasta 2 blancos; CD 5 s | +1 lanza lateral al 40 %/rango | +1 blanco atravesado/rango | **Haz estrecho:** trayectorias paralelas · **Dispersión:** abanico de 50° | **Aguja del vacío:** +80 % al primer blanco · **Perforación perfecta:** sin pérdida de daño al atravesar |
| **Orbes custodios** | 1 orbe orbital, 9/golpe en radio 1,8 m, 5 s; CD 10 s tras terminar | +1 orbe al 50 %/rango | +0,75 s de duración/rango | **Órbita lejana:** radio +0,8 m · **Órbita veloz:** velocidad angular +50 % | **Anillo doble:** segunda órbita con 2 orbes al 35 % · **Guardián:** +15 de barrera al activar, una vez por activación |
| **Sello de detonación** | Marca suelo bajo un grupo; tras 0,7 s explota por 40 en 2,4 m; CD 8 s | +0,25 m de radio/rango | −0,1 s de preparación/rango, mínimo 0,3 s | **Doble sello:** 2 zonas a blancos distintos al 60 % · **Sello hambriento:** atrae hasta 0,3 m antes del estallido, con resistencias | **Onda residual:** repite una vez al 40 % tras 0,8 s · **Implosión:** centro de 0,8 m hace +100 % |
| **Haz rúnico** | Línea desde el héroe fijada al comenzar, 4 pulsos × 8 a 9 m; CD 7 s tras terminar | +0,15 m de anchura/rango, base 0,4 m | +1 blanco máximo por pulso/rango, base 4 | **Barrido:** gira 45° durante la acción · **Haz partido:** dos líneas divergentes al 60 % | **Canal largo:** +3 pulsos · **Foco absoluto:** +75 % contra un único blanco en la línea |
| **Nova arcana** | Onda instantánea de 22 alrededor, radio 3 m; CD 9 s | +0,3 m de radio/rango | +0,1 m de empuje/rango, base 0,15 m | **Doble frente:** otra onda al 40 % tras 0,6 s · **Borde cortante:** anillo exterior hace +50 % | **Expansión:** radio +40 % · **Pulso defensivo:** reduce 20 % de daño recibido durante 2 s, no acumulable consigo mismo |
| **Lluvia de fragmentos** | 4 impactos de 12 en una zona de 3 m durante 2 s; CD 11 s tras terminar | +1 impacto/rango | +0,3 m de zona/rango | **Bombardeo:** impactos en zona fija, daño +20 % · **Persecución:** cada impacto retoma la posición del blanco, daño −15 % | **Gran fragmento:** último impacto triple, radio 1,5 m · **Constelación:** +4 impactos al 50 % |
| **Espejo arcano** | Repite cada tercer básico con un eco al 35 %; ventana 4 s, CD 12 s tras terminar | +10 puntos porcentuales de daño del eco/rango | +1 s de duración/rango | **Réplica doble:** dos ecos al 60 % de su daño actual · **Eco penetrante:** el eco atraviesa 2 blancos adicionales | **Memoria:** cada segundo básico activa eco · **Reflejo mayor:** eco +60 % de daño multiplicativo |

Espejo repite solo el básico: no genera cargas arcanas, otro eco, explosión del cuarto lanzamiento ni copias de habilidades. Orbes y Haz tienen intervalos de impacto por blanco. Los nombres describen forma de ataque; el principal lo expresa como fuego, agua, roca o viento, sin introducir afinidades nuevas.

## 5. Arquero — trayectorias, penetración y trampas

| Habilidad | Base de nivel 1 | B: expansión | C: especialización | Mutaciones de nivel 5 | Remates de nivel 10 |
|---|---|---|---|---|---|
| **Lluvia de flechas**, inicial | 4 descargas × 10, zona fija de 3 m; CD 16 s tras terminar | +0,25 m de radio/rango | +1 descarga/rango | **Cortina:** radio +30 %, daño −15 % · **Punto de caza:** radio −20 %, daño +35 % | **Aguacero:** +3 descargas · **Flechas pesadas:** +60 % de daño a élite/jefe |
| **Salva en abanico** | 3 flechas, central 18 y laterales al 40 %, 10 m, 1 blanco/flecha; CD 4 s | +2 flechas laterales al 35 %/rango | +1 blanco atravesado/rango | **Salva estrecha:** abanico de 25° · **Cerco:** abanico de 110° | **Doble salva:** repite una vez al 50 % · **Puntas abiertas:** cada flecha hace +30 % de daño |
| **Disparo de asedio** | Flecha de 42, hasta 4 blancos, 13 m; CD 7 s | +1 blanco atravesado/rango | +1 m de recorrido y +10 % de velocidad de vuelo/rango | **Cazador de gigantes:** +35 % a élite/jefe · **Línea devastadora:** ancho de impacto +0,25 m | **Punta implacable:** no pierde daño al atravesar · **Golpe final:** al terminar estalla una vez en 2 m al 75 % |
| **Flecha rebotadora** | 16, salta a 2 blancos adicionales a ≤3 m, −20 % de daño por salto; CD 6 s | +1 salto/rango | +0,5 m de alcance entre blancos/rango | **Caza dispersa:** prioriza no alcanzados · **Rebote de duelo:** permite una vuelta al primer blanco si hay otro intermediario | **Cadena tensa:** sin pérdida por salto · **Dos trayectorias:** segunda flecha al 45 % |
| **Trampa de púas** | Coloca bajo enemigo a ≤8 m; arma en 0,6 s, 24 en 1,8 m y ralentiza 20 % por 2 s; CD 8 s | +1 trampa al 50 %/rango, posiciones distintas | +0,2 m de radio/rango | **Emboscada:** +35 % a blancos con vida llena · **Campo de púas:** tras activar persiste 2 s, un pulso de 6/s | **Cerco:** duración de ralentización +2 s · **Dientes de hierro:** daño de activación +70 % |
| **Flechas de retorno** | 2 flechas al frente de 14, recorren 7 m y regresan a la posición de lanzamiento; CD 7 s | +1 flecha al 45 %/rango | +1 blanco atravesado por trayecto/rango, base 2 | **Ala ancha:** separación lateral +1 m · **Regreso feroz:** vuelta +50 % de daño | **Tercera pasada:** una pasada extra al 40 % · **Retorno rápido:** velocidad de vuelo +70 %, daño +20 % |
| **Baliza de caza** | Zona de 3 m durante 4 s: ataques del héroe contra enemigos dentro hacen +12 % de daño; CD 13 s tras terminar | +0,4 m de radio/rango | +1 s de duración/rango | **Marca móvil:** sigue a un blanco y permanece donde muere · **Terreno elegido:** fija, bono pasa a +20 % | **Presa mayor:** añade +15 puntos porcentuales solo contra élite/jefe · **Marca persistente:** al salir el enemigo conserva la marca 2 s |
| **Estacas de guardia** | Coloca 3 estacas espectrales en arco frente al héroe; duran 4 s, daño 14 al cruzar una, sin obstáculo físico; CD 10 s tras terminar | +1 estaca/rango | +0,75 s de duración/rango | **Media luna:** arco de 180° · **Pasillo:** dos líneas paralelas, mismo número total | **Puntas dobles:** dos activaciones por estaca, mínimo 0,8 s contra el mismo blanco · **Madera astillada:** al consumirse, área de 1 m al 40 %, sin cadenas |

Excepción A de Baliza: +2 puntos porcentuales de bono/rango. Rebotes necesitan línea libre y no eligen el mismo blanco consecutivamente; se limitan por conteo de saltos. Trampas y estacas no crean sólidos ni bloquean rutas. Ningún disparo de habilidad suma o rompe Precisión: esa pasiva pertenece al básico.

## 6. Básicos y pasivas; migración de las doce técnicas

El básico usa la misma estructura de nivel 10, siete inversiones y dos hitos; sus ramas D dan −6 % de intervalo por rango en lugar de −8 %. CD global de habilidades no acelera el básico. Las pasivas no ocupan ranura ni tienen otra barra de niveles.

| Básico | A | B | C | Nivel 5 | Nivel 10 |
|---|---|---|---|---|---|
| Espada | +12 % daño/rango | +30° de arco/rango | +0,35 m alcance/rango | **Barrido:** +30° · **Estocada:** +0,4 m y daño +10 % | **Ímpetu duradero:** expira en 5 s · **Filo maestro:** daño +40 % |
| Proyectil mágico | +12 % daño/rango | +0,3 m al radio de explosión arcana/rango | +1 blanco atravesado/rango | **Resonancia:** explosión +0,4 m · **Concentración:** intervalo −10 % | **Acumulación rápida:** potencia cada tercer básico · **Impacto arcano:** explosión +60 % daño |
| Flecha | +12 % daño/rango | +1 blanco atravesado/rango | +10 % velocidad de vuelo y +0,75 m alcance/rango | **Abanico:** dos laterales al 40 % sin Precisión · **Cadencia:** intervalo −10 % | **Precisión firme:** racha expira en 6 s · **Punta maestra:** central +50 % daño |

| Técnica actual | Destino en el sistema nuevo |
|---|---|
| Barrido | Rama B y mutación del básico de espada |
| Estocada | Rama C y mutación del básico de espada |
| Guardia firme | Estadística **Temple** del Guerrero: 5/10/15/20 % de reducción; cuatro rangos |
| Giro prolongado | Rama C de Torbellino; contador explícito de pulsos |
| Eco arcano | Habilidad Espejo arcano: se vuelve adquirible y con ventana propia; ya no modifica siempre cada básico |
| Resonancia | Rama B y mutación del básico mágico |
| Concentración | Rama D y mutación del básico mágico |
| Convergencia | Rama B de Cataclismo |
| Abanico | Mutación del básico de flecha; Salva es una habilidad distinta con su propia activación |
| Punta larga | Rama B del básico de flecha |
| Cadencia | Rama D y mutación del básico de flecha |
| Lluvia extensa | Rama B de Lluvia |

Se retiran los tres espacios de técnicas cuando una clase migra: sus modificadores pasan a estas elecciones, sin otro inventario. Algunas cifras y condiciones cambian deliberadamente, especialmente Eco. Se conserva el efecto reconocible, no se promete igualdad de daño con 0.2.7. Cada clase lleva una versión de reglas explícita durante la transición; jamás aplica técnica vieja y mejora nueva al mismo tiempo. No hay partidas guardadas que migrar; los reinicios reconstruyen la configuración. Los registros históricos y trazas antiguas siguen describiendo la versión anterior; no se regeneran para esconder cambios de balance.

## 7. Estadísticas generales

Catálogo de **doce familias**, con cuatro rangos salvo indicación. Cada adquisición consume una elección, sin subir nivel de habilidad.

| Familia | Incremento por rango y límite |
|---|---|
| Poder | +8 % al daño base de básico y habilidades; máximo +32 % |
| Vitalidad | +15 de vida máxima y cura 15 al adquirir; máximo +60 |
| Paso | +0,3 m/s; respeta máximo de clase 6,5 m/s |
| Recogida | +0,4 m de atracción y absorción; máximo +1,6 m |
| Celeridad | −4 % de recarga global de habilidades; máximo −16 % |
| Cadencia básica | −4 % de intervalo de básico; máximo −16 % |
| Balística | +12 % velocidad de vuelo; máximo +48 %; solo si hay proyectiles |
| Alcance | +0,4 m a ataques de alcance finito, sin ampliar áreas; máximo +1,6 m |
| Amplitud | +4 % a radios/anchuras de áreas, no recorrido; máximo +16 % |
| Persistencia | +6 % a duración de ventanas/zonas; máximo +24 %; no añade pulsos ni estados elementales |
| Recuperación | Cada 20 bajas reales recupera 2/3/4/5 de vida según rango; no revive ni cuenta retiradas |
| Resguardo | Barrera adicional de 4/8/12/16 al inicio y cada 25 s de combate; no se acumula consigo misma |

Temple es una familia adicional exclusiva del Guerrero, no parte de las doce generales. No hay crítico universal ni suerte/experiencia adicional en este bloque: más proyectiles, penetración, ecos y áreas ya aportan variación suficiente. La tienda vende Poder/Vitalidad/Paso usando los mismos rangos del sistema nuevo; sus costes se revisan en 2.7.6. Una compra de estadística no sube habilidades.

## 8. Ofertas y economía de elecciones

1. El Mago mantiene afinidad principal antes de entrar. Guerrero/Arquero conservan la elección principal al nivel 2 como excepción de introducción; desde la siguiente elección usan el menú común. Maestría y reliquias conservan colas separadas.
2. Menú normal: **tres tarjetas distintas**, generadas una vez por elección con semilla, nivel de personaje y configuración. Reabrir no cambia opciones. Resolver niveles acumulados en orden; no usar un nivel futuro para adelantar requisitos.
3. Reservar una tarjeta para una estadística elegible, otra para desarrollar un ataque conocido y una abierta. Si falta una categoría, rellenar con otra válida. Las cuatro ramas compiten por la tarjeta de desarrollo; rotación ponderada con preferencia por ramas no ofrecidas recientemente.
4. Tarjeta abierta: pesos iniciales **aprender 45, desarrollar 25, afinidad 20, estadística 10**; renormalizar categorías elegibles. Con espacio libre, si pasan dos elecciones normales sin mostrar aprendizaje, la siguiente tarjeta abierta muestra uno. Garantiza oportunidad, nunca adquisición. Las siete habilidades tienen la misma prioridad inicial, con rotación para no repetir siempre una.
5. Afinidad principal mejorable desde la primera elección normal, apoyo adquirible/mejorable desde nivel de personaje 5. Si pasan tres elecciones elegibles sin mostrar afinidad, reservar la tarjeta de estadística de la siguiente elección para ella. Una garantía de aprendizaje simultánea usa la abierta; no se anulan. Pureza sigue bloqueando apoyo. Se abandona la restricción anterior de ofrecer apoyo solo en niveles impares.
6. Cuando una habilidad seleccionada para desarrollo está en 4 o 9, presentar sus **dos hitos alternativos** en dos tarjetas, y una tercera alternativa fuera de esa habilidad. Al elegir otra cosa el hito queda pendiente. Las garantías de aprendizaje/afinidad pueden ocupar esa tercera tarjeta y, si coinciden ambas, posponer el menú de hitos para mostrar las dos garantías y otra opción. No puede ser obligatorio aceptar una mutación para salir del menú.
7. Con cuatro espacios, aprendizaje es inelegible; con nivel 10 o rama III, esa mejora es inelegible. No ofrecer velocidad ya limitada, curación de recuperación sin mejora efectiva, ni Balística sin proyectiles. Si quedan menos de tres opciones, mostrar las disponibles; si no queda ninguna, curación de reserva de 25 % de vida máxima por nivel, con límite de vida.
8. Una elección cuesta un nivel de personaje; aprender no exige monedas ni una baja de especie concreta. El núcleo no concede niveles de habilidad. Mantener exceso de esencia, IDs de elección y aplicación única frente a doble clic.

**Presupuesto real:** cuatro habilidades al 10 cuestan 39 elecciones (9 de la inicial y 10 por cada una de las tres aprendidas), antes de básico, estadísticas y afinidades. No es objetivo maximizar todo en seis minutos. La batería actual llega aproximadamente a nivel 13–14, por lo que el nuevo árbol exige revisar experiencia junto a hordas en 2.7.6. Hipótesis de ritmo: unas 25–35 elecciones normales durante una expedición activa de seis minutos, suficiente para una o dos especializaciones fuertes o cuatro habilidades intermedias. Medir pausas y fatiga; no inflar niveles hasta exigir una elección cada pocos segundos. Validar rutas de exploración y distintas velocidades de baja.

### Ejemplos de tarjetas

| Situación | Tres alternativas posibles |
|---|---|
| Guerrero temprano, 1/4 habilidades | Vitalidad I · Torbellino 1→2: radio +0,25 m · Aprender Onda de acero 1 |
| Mago, Cataclismo 4, 2/4 espacios | Cataclismo 4→5 Concentrado · Cataclismo 4→5 Fracturado · Aprender Orbes custodios |
| Arquero, 4/4 espacios | Celeridad II · Disparo de asedio 6→7: penetración +1 · Afinidad de Agua II |
| Guerrero, prefiere pocos ataques | Poder II · Torbellino 6→7: +1 pulso · Aprender Martillo (puede rechazarlo) |
| Ataque de nivel 9 seleccionado | Remate A 9→10 · Remate B 9→10 · Recogida III |

## 9. Resolución de combate y topes iniciales

- Daño = base × (1 + Poder + reliquias de daño base + rama A) × modificadores explícitos de forma y situación. Bonos de Estandarte/Baliza se suman entre sí y se limitan conjuntamente a +50 %; nunca se realimentan. Armadura y estados se resuelven después según las reglas del objetivo. Mostrar fórmula y cambios antes/después en catálogo técnico, no en el flujo de combate.
- Recarga = base × (1 − reducción local − Celeridad), reducción total máxima 50 %, recarga mínima 1 s. Básico: reducciones sumadas con máximo 45 %, intervalo mínimo 0,25 s. Una velocidad de proyectil mayor no acelera lanzamientos.
- Radio de área: (base + incrementos planos) × (1 + Amplitud) × mutación × maestría; máximo 1,8 veces el radio base. Alcance de recorrido máximo 1,75 veces el base. No prometer toda la suma si el tope la absorbe: excluir mejoras sin beneficio.
- Duraciones: (base + incrementos planos) × Persistencia, máximo dos veces la base. Torbellino/lluvias/haz tienen pulsos explícitos; Persistencia solo se ofrece si existe otra ventana/zona elegible y no agrega impactos a una secuencia. El motor guarda por separado ventana de contacto y número de pulsos.
- Áreas/orbitales continuos: mínimo 0,4 s entre impactos de la misma activación al mismo blanco. Si varias armas orbitales coinciden, comparten ese intervalo por activación. Flechas/ondas tienen una lista de blancos por trayecto; ida/regreso son trayectos explícitos.
- Penetración: máximo 10 blancos por proyectil; pérdida base 15 % por blanco adicional, multiplicativa, suelo 25 %, salvo remate que la elimina. Rebotes: máximo 6 saltos, con su propia pérdida indicada. Proyectiles por activación: máximo 9; no confundir con máximo activo global, a medir en 2.7.5.
- Los golpes originales de habilidades aplican elemento principal y apoyo una vez por impacto válido. Ecos, retornos extra de remate, repeticiones y explosiones derivadas causan su daño indicado sin generar otro eco, apoyo ni derivación. El regreso normal de Hoja de retorno/Flechas de retorno es un trayecto original marcado, no un remate recursivo. Precisar etiquetas de fuente para cada caso.
- Empuje/arrastre conserva muros, separación, resistencias y protección compartida de 0,5 s. Habilidades nuevas no conceden coraza/curación elemental gratuita: solo efectos definidos. Resguardo no suma barreras infinitas; fuentes distintas comparten una barrera con capacidad máxima 40 y duración máxima 5 s; renovación usa el mayor saldo, sin sumar capacidad, y vuelve a un máximo de 5 s. La barrera de Tierra se adapta a este contrato al migrar la clase.
- Regeneración por bajas se procesa tras daño y muerte del héroe, nunca lo revive. Pausa congela todas las recargas, ventanas y contadores. Reiniciar elimina habilidades, ramas, hitos, proyectiles, marcas y efectos de la expedición anterior.
- Animaciones principales corresponden al básico; habilidades adicionales se representan mediante arma/gesto breve y efectos sin apropiarse del movimiento ni impedir otro ataque automático. Recargas arrancan al terminar secuencias/ventanas, o al emitir en acciones instantáneas. Si no hay objetivo/zona útil, la habilidad permanece lista; guardias se activan solo con amenaza a ≤8 m, estandarte/baliza con enemigo a ≤12 m.

## 10. Datos, entregas y criterios de implementación

Separar definición de habilidad (ID, clase, tipo, base, ramas, hitos, fuente, selección de blancos, topes) de estado por expedición (nivel, cuatro rangos, mutación, remate, recarga, activaciones). La progresión ofrece operaciones `aprender`, `invertir-rama`, `elegir-mutación`, `elegir-remate` y estadísticas/afinidades. Una sola operación validada modifica el estado; los efectos visuales consumen eventos y no deciden daño. Registrar versión de reglas, semilla y trayectoria para reproducir fallos.

**2.7.2** sigue siendo cámara/mapa. **2.7.3** incorpora motor común, ocho habilidades del Guerrero, básico, estadísticas y ofertas; tabla de migración del Guerrero. **2.7.4** completa las otras dieciséis habilidades y sus básicos/migraciones. Si alguna capacidad requiere dividir la implementación, usar inserciones explícitas y actualizar el estado antes de declararla terminada; este catálogo no se marca implementado por existir el documento. **2.7.5** mide y adapta hordas/topes. **2.7.6** ajusta experiencia, elecciones, compras y balance humano. **2.8** revisa las doce maestrías para que convivan con los hitos 5/10 sin duplicarlos.

Criterios futuros: probar al menos dos trayectorias distintas por habilidad, tope 10 y siete inversiones, exclusiones de hitos, cuatro espacios, garantías de ofertas sin adquisición forzada, estadísticas al tope, muerte/pausa/reinicio, efecto de apoyo único, múltiples habilidades simultáneas, colisiones, jefe y stock. Comprobar una configuración con dos habilidades especializadas y otra con cuatro intermedias por clase. Separar reglas en simulación, inspección visual y rendimiento medido.

Esta entrega 2.7.1 es documental. Se verifican integridad de catálogos, recuentos, migración, ejemplos y enlaces; no corresponde ejecutar de nuevo las 246 pruebas históricas de una aplicación sin cambios. El usuario pidió creatividad y árboles de hasta 10; nombres, cantidades concretas, fórmulas y cifras son decisiones de diseño del asistente, abiertas al ajuste jugando.

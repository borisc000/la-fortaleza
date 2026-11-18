# Subfase 1.9.1 — Territorio ampliado y hordas locales

Fecha: **2026-10-31**. Estado: **implementada y ampliada de nuevo**, aplicación **0.1.13**. Seguimos en la subfase 1.9.1. Revisión visual interactiva y rendimiento GPU pendientes.

## Segundo ajuste moderado — 0.1.13

- Nueva petición: «Un poquito más grande». De **192 × 176 m a 212 × 192 m**: **40.704 m² delimitados**, un **20,45 % adicional** sobre 0.1.12. Se conservan doce zonas, velocidades, controles, duración y reglas de hordas locales.
- Nuevo arco exterior por el oeste y sur, conectado al recorrido existente. Muralla, torres, vallado y terreno ampliados; colinas decorativas alejadas para mantener libre el área jugable. Plano lejano de cámara de 220 a 300 m para abarcar la fortaleza desde los extremos; zoom manual permanece 4–12 m.
- Muestreo libre: **39.151 m²**. Comprobación de expansión: **288 apariciones seguras** en destinos y nuevos bordes, doce destinos transitables, tramo máximo probado **21,2 s**.
- **106/106 pruebas correctas**, incluidas ambas expediciones completas con maestría y victoria. Ocho comprobaciones de cámara repetidas correctamente tras ajustar su plano lejano. Simulaciones con vida ampliada solo en test; no acreditan balance humano ni FPS.
- TypeScript y build correctos. HTML 7,45 kB, CSS 13,68 kB y JS 676,39 kB (179,55 kB gzip); advertencia de bundle >500 kB conservada. Servidor local HTTP 200 con versión 0.1.13.
- La revisión visual del agente/GPU/teléfono permanece pendiente por la limitación de navegador conocida. No se ha iniciado 1.9.2.

## Ajuste adicional moderado — 0.1.12

- Petición: «Un poquito más grande…». De **176 × 160 m a 192 × 176 m**, exactamente **20 % más de superficie delimitada** (33.792 m²). Se conservan las doce zonas y las reglas del director local.
- Perímetro, muralla y torres exteriores extendidos; camino principal llega al nuevo borde y recorrido adicional por el sur conectado a la abadía, encrucijada y arboleda. Distribución de piedra y hierba adaptada a los límites; ninguna nueva interacción.
- Muestreo libre: **32.297 m²**. Pruebas de expansión: **288 apariciones seguras**, doce destinos transitables y tramo máximo probado de **21,3 s**.
- **106/106 pruebas correctas**. Campañas con maestría y victoria: Fuego 415,03 s, 180 bajas, pico 11; Agua 418,07 s, 184 bajas, pico 15. Ambas nivel 13 y 13 elecciones. Vida ampliada exclusivamente en tests; no son pruebas de dificultad humana ni GPU.
- TypeScript y build correctos: HTML 7,45 kB, CSS 13,68 kB y JS 676,26 kB (179,50 kB gzip). Conserva advertencia de JS >500 kB. HTTP 200 con versión 0.1.12 y límites nuevos servidos.
- Revisión visual del agente/GPU/teléfono sigue pendiente por la limitación de navegador ya registrada. Próxima subfase: 1.9.2; no se ha iniciado.

## Ampliación adicional solicitada por el usuario — 0.1.11

- Petición: «Bien, mejor aunque me gustaría Más grande aun. Hazlo más grande antes de seguir». Se amplía el mapa antes de avanzar a recogibles/interacción.
- De **96 × 88 m a 176 × 160 m**: 28.160 m² delimitados, **3,33 veces** la extensión de la versión anterior. No se escala el héroe, la velocidad ni el alcance de ataques.
- **Doce zonas**: las seis anteriores más pradera de poniente, camino de los molinos, abadía derruida, encrucijada del exilio, arboleda del sur y atalaya lejana. Circuito exterior, conexiones transversales, muralla más larga, arbolado y referencias arquitectónicas nuevas. Terreno y colinas de fondo desplazados/ampliados para no invadir el territorio transitable.
- Distancias de aparición y límites de enemigos conservados: el aumento del mapa no aleja los refuerzos del jugador. Núcleo, élite y jefe siguen señalizados.
- Construcción de la rejilla de navegación con consulta de obstáculos por sectores de 4 m para celdas y conexiones. Conserva comprobaciones geométricas exactas, radio y margen; no reduce precisión para ganar tamaño.
- **106/106 pruebas y build correctos**. Prueba de expansión adaptada a todos los destinos y nuevos bordes: **288 apariciones** seguras de tres tamaños; recorrido físico de las doce zonas, tramo máximo probado **21,2 s**. Las 48 posiciones del sector original siguen pasando.
- Muestreo libre a pasos de 1 m: **26.765 m²**, frente a 7.754 m² de la primera ampliación (aproximadamente **3,45 veces** su superficie libre). Frente al sector inicial sin su antigua valla, razón 12,47. Son aproximaciones por muestreo con radio del héroe, distintas de la superficie rectangular.
- Campañas completas, semilla 19 y vida ampliada solo en test: Fuego alcanza maestría y victoria en **415,15 s**, 188 bajas, nivel 13, 13 elecciones y pico de 11 enemigos; Agua en **417,32 s**, 184 bajas, nivel 13, 13 elecciones y pico de 15. No acreditan balance humano ni rendimiento GPU.
- Build: HTML 7,45 kB, CSS 13,68 kB y JS 676,03 kB (179,44 kB gzip). Advertencia de bundle >500 kB conservada. Servidor local HTTP 200 con versión 0.1.11; sin publicación externa.
- Se conserva la limitación conocida de navegador local desactivado: sin revisión visual interactiva del agente ni teléfono físico. El usuario valoró la primera ampliación como mejor y pidió mayor extensión; no atribuirle revisión de esta segunda versión todavía.
- Próxima subfase pendiente: **1.9.2**. Esta revisión no añade tiendas, captura ni nuevos recogibles.

## Registro histórico — primera ampliación 0.1.10

## Cambios visibles

- Límites de 51 × 48 m a **96 × 88 m**: 3,45 veces la superficie delimitada. Se mantiene el comienzo junto a la fortaleza y se extiende el territorio al sur y ambos lados.
- Seis referencias: explanada, campamento abandonado, ruinas del camino, cruce del sur, linde del bosque y torre del este. Caminos conectados en circuito, muralla extendida, ruinas, estructuras de campamento, arbolado y claros reservados para actividades posteriores.
- Menos niebla lejana para leer la fortaleza; sombras próximas siguen al héroe durante el recorrido. Materiales existentes y nueva geometría procedural propia; aspecto provisional.
- Nombre de zona y orientación relativa a cámara con distancia hacia la puerta, élite, núcleo recogible o jefe. El núcleo pendiente tiene prioridad en la guía.
- Refuerzos a **11–23 m** del jugador, priorizando fuera del encuadre. La aplicación transmite el volumen visible de la cámara con margen de 2,5 m para el cuerpo del actor; no asume que estar detrás de una pared equivale a estar fuera de vista. Se conserva aviso de 1,5 s incluso en apariciones visibles, tres segundos para élite y seis para jefe.
- Ruta y espacio libre comprobados para el tamaño del enemigo y, como mínimo, el jugador. Si no hay espacio seguro, se aplaza el refuerzo; no se acumulan oleadas atrasadas.
- Objetivos de población local de 5/7/9/11 según etapa, dentro de 26 m. Revisión cada tres segundos, al menos seis segundos entre refuerzos, máximo de una tanda por intervalo y tope global de 40 vivos con plaza reservada para el élite. Los doce segundos de respiro por minuto suspenden también la reposición local.
- Normales a más de 38 m y fuera de vista durante ocho segundos se retiran sin muerte, bajas ni premios; volver a verlos o acercarse reinicia ese plazo. Élites, jefe y premios se conservan. Los proyectiles ya disparados conservan su vida útil normal.
- Élites y jefe siguen apareciendo en una posición segura cerca de la ubicación actual, sin teletransportar al héroe ni exigir volver a una arena distante. Se mantiene seis minutos más jefe y núcleo real del élite.

## Comprobaciones realizadas

- **106/106 pruebas correctas**: cinco nuevas pruebas de expansión, más la suite previa completa.
- Preferencia por apariciones fuera de vista, alternativa visible con aviso, radios seguros, recinto desconectado sin posiciones válidas y recuperación sin acumulación de oleadas.
- Retirada tras plazo continuo, reinicio del plazo por visibilidad, congelación al elegir mejoras, supervivencia de élite/jefe/núcleo y ausencia de premios por retirada.
- Reposición alrededor del jugador desplazado, límites y descansos; partida nueva limpia el estado del director.
- **180 apariciones** comprobadas para tres tamaños de enemigo en seis destinos y cuatro bordes; 48 posiciones adicionales de jugador en el sector original.
- Centros y espacios reservados transitables. Recorrido físico por los seis destinos con navegación y colisiones reales: tramo máximo probado **7,7 s** a velocidad base. No representa la distancia entre todos los pares de puntos del mapa.
- Muestreo a intervalos de 1 m con radio del héroe: **7.754 m² libres** frente a **2.147 m² del rectángulo anterior sin su antigua valla**, razón **3,61**. Es una aproximación de superficie, no una medición exacta de polígonos ni una reconstrucción del escenario anterior.
- Se encontró y corrigió un candidato junto a una viga que resultaba navegable para un soldado de radio 0,36 m pero no para el héroe de 0,4 m; la selección usa ahora el mayor radio y margen.
- Integración completa con semilla 19 sobre geometría real, vida ampliada **solo en la prueba** para aislar reglas:

| Afinidad | Resultado | Tiempo simulado | Bajas | Nivel | Elecciones | Pico vivo |
|---|---|---:|---:|---:|---:|---:|
| Fuego | Maestría y victoria | 415,12 s | 186 | 13 | 13 | 14 |
| Agua | Maestría y victoria | 417,32 s | 180 | 13 | 13 | 11 |

- `npm run build`: TypeScript y Vite correctos. HTML 7,44 kB, CSS 13,68 kB y JS 674,43 kB (178,80 kB gzip). Continúa la advertencia de bundle JS >500 kB; no es un fallo de compilación.
- Servidor local en `http://127.0.0.1:5183/`: HTTP 200, versión 0.1.10 y guía presentes; módulo del director servido con la lógica nueva. Sin publicación externa.

## Límites de verificación

La consulta de acceso volvió a devolver **“Local browser use is disabled in Work settings”**. No se eludió el ajuste. No hay captura del juego, validación visual interactiva del agente, medición de FPS/GPU ni prueba física de teléfono en esta entrega. Las simulaciones no acreditan dificultad humana, legibilidad final ni rendimiento gráfico. El incremento de reposición aumenta bajas/experiencia posibles; balance y densidad se afinan jugando en 1.10.

## Siguiente entrega

**1.9.2 — Recogibles, interacción y orientación de puntos de interés**: moneda, suministros, cofre, fuente y acciones contextuales. Los claros actuales solo reservan espacio: no se presentan como capturas, tiendas o premios funcionales. Captura y tienda corresponden a 1.9.3.

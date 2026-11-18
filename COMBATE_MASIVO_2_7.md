> Estado vigente: **2.7.6 implementada, aplicación 0.2.12; siguiente 2.8**. Plan: 49 subfases, 22 futuras. Ver HORDAS_2_7_5.md. Las hipótesis y versiones originales de abajo se conservan como contexto del diseño.

Ver [ritmo y economía 2.7.6](RITMO_2_7_6.md).

# Ampliación del combate — 2.7.1 a 2.7.6

Fecha: 2026-11-02. Estado: **2.7.1 definida; 2.7.2–2.7.6 pendientes**. La aplicación sigue en 0.2.7.

## Dirección y regla de elección

El usuario pide más ataques simultáneos, crecimiento temprano del personaje, hordas más densas, mapa mayor y cámara más alejada. Aclara que una oportunidad de mejora debe permitir escoger entre estadísticas generales, mejorar una habilidad conocida o aprender una del repertorio de esa clase. No se entrega obligatoriamente una habilidad nueva al pasar 30–45 segundos ni se garantiza tener cuatro a cierta hora.

Se conserva la esencia de enemigos derrotados como vía inicial para subir de nivel; no se añade a la vez otro contador de bajas que entregue poderes duplicados. Los tiempos sirven para medir el ritmo de obtención de elecciones. La frecuencia depende del combate y la recogida. Los tipos de enemigos pueden aportar oportunidades especiales más adelante, sin bloquear el repertorio básico tras un enemigo raro.

Propuesta operativa: básico y pasiva fuera de los espacios, hasta **cuatro habilidades automáticas equipadas**, incluida la especial inicial de clase. Torbellino, Cataclismo y Lluvia siguen disponibles al comenzar. Aprender ocupa un espacio; mejorar no ocupa otro. No es obligatorio llenar los cuatro: una partida puede invertir en pocas habilidades fuertes y estadísticas.

El menú conserva tres alternativas válidas. Mezcla categorías cuando sean elegibles, sin exigir una tarjeta de cada tipo en toda elección. Con espacios llenos no ofrece aprender otra habilidad; si aún quedan rangos ofrece mejorar las conocidas. Evitar tarjetas incompatibles, rangos superados, duplicados y niveles perdidos. Afinidades, técnicas y estadísticas comparten el presupuesto de elecciones, con pesos explícitos para que no desaparezcan las nuevas habilidades. Cofres/reliquias y núcleo/maestría conservan sus elecciones independientes.

## Repertorios y técnicas existentes

Definición vigente en [HABILIDADES_2_7_1.md](HABILIDADES_2_7_1.md): **ocho habilidades por clase, cuatro equipadas, niveles 1–10**, cuatro ramas de tres rangos y elecciones excluyentes en 5/10. Veinticuatro habilidades con dieciséis opciones de desarrollo por árbol. Básicos hasta 10 fuera de espacios. Los nombres y cifras están definidos para implementar y probar, no atribuidos como aprobación de balance del usuario.

Las doce técnicas de 2.6 siguen funcionando en 0.2.7. La ampliación debe asignar cada técnica a una mejora de habilidad, básico o pasiva, o justificar conservarla separada. Preferencia de diseño: integrar los modificadores de una habilidad en sus mejoras y evitar sumar otro inventario obligatorio de técnicas sobre cuatro habilidades y cuatro reliquias. La tabla de migración de las doce técnicas está cerrada en HABILIDADES_2_7_1.md: pasan a ramas/hitos del básico o habilidad, Espejo y Temple, retirando espacios de técnicas al migrar cada clase; no borrar efectos ni sumar dos veces sus bonificaciones. La transición se aplica primero al Guerrero y después a Mago/Arquero, manteniendo las otras clases jugables en cada entrega.

## Espacio, densidad y presentación

Valores para experimentar, no compromisos de rendimiento ni cifras confirmadas por el usuario:

| Aspecto | Aplicación 0.2.7 | Hipótesis de partida |
|---|---|---|
| Cámara | Distancia 8, rueda 4–12 | Distancia 11–12, máximo 16–18; algo más elevada |
| Mapa | 212 × 192 m | Aproximadamente 260 × 240 m, con claros y caminos más anchos |
| Enemigos cercanos | Objetivo de 5 a 11 | 15–25 al inicio, 35–60 en medio, 80–120 al final |
| Límite global | 40 | Se redefine después de medir simulación y renderizado |

La cámara sigue siendo tercera persona, con ratón sin arrastrar y rueda limitada. Primero ajustar encuadre; después evaluar tamaño aparente, siluetas y detalle de modelos. No reducir cuerpos o colisiones arbitrariamente ni abandonar el estilo semirrealista.

La mayoría de la horda debe poder barrerse con ataques de área. Usar una variante débil del perseguidor y proporciones menores de enemigos resistentes, tiradores y cargadores; no añadir por ello una sexta conducta obligatoria a los cinco enemigos previstos. Aumentar frecuencia y reposición, acortar respiros y mantener rutas de escape. Los objetivos de densidad son locales, no llenar todo el mapa con entidades activas.

Las apariciones conservan distancia segura, rutas navegables y aviso si son visibles; ampliar el zoom obliga a revisar el encuadre usado por el director. Capturas y hordas comparten población. Retirada lejana sin premios, recompensas únicas, colisiones, resistencias y límites de efectos continúan vigentes. El mapa mayor conserva destinos alcanzables, no solo superficie vacía.

Las habilidades tienen recargas propias y pueden coexistir. Definir cómo coinciden animaciones, proyectiles y áreas sin bloquear movimiento ni multiplicar efectos derivados sin límite. Mostrar cuatro espacios, rangos y recargas; priorizar avisos peligrosos sobre partículas, números y cadáveres. Medir CPU, GPU y carga de entidades; las simulaciones sin GPU no validan fluidez.

## Secuencia de entregas

1. **2.7.1 — Elecciones y repertorios (definida):** reglas de ofertas, esencia, espacios/rangos, catálogo por clase y migración de técnicas. Entrega documental implementable, sin otra aprobación genérica obligatoria.
2. **2.7.2 — Cámara y terreno para hordas:** encuadre más amplio, mapa ampliado, rutas y destinos; revisar aparición visible, colisiones y legibilidad de modelos.
3. **2.7.3 — Sistema de habilidades y Guerrero:** acciones automáticas independientes, adquirir/mejorar, primeras opciones del Guerrero, migración y HUD funcional. Probar también una configuración que no llene espacios.
4. **2.7.4 — Repertorios de Mago y Arquero:** integrar ambas clases, identidad, afinidades, apoyo y reliquias; verificar varias selecciones y mejoras por clase.
5. **2.7.5 — Hordas y rendimiento inicial:** masa de enemigos débiles, amenazas minoritarias, apariciones más frecuentes y carga progresiva medida; optimizar antes de fijar el máximo.
6. **2.7.6 — Ritmo, claridad y balance conjunto:** ajustar frecuencia de elecciones, pesos, daño, experiencia y economía para el nuevo volumen; probar partidas con vida normal, pocas habilidades mejoradas y cuatro equipadas. Registrar límites y revisión visual pendiente cuando corresponda.

Después: **2.8 maestrías** sobre el nuevo sistema y **2.9 preparación/selección/balance**. La fase 3 termina escenario, encuentros y progresión persistente; la fase 4 consolida arte, rendimiento y dispositivos reales.

## Definitiva manual y alcance conservado

La referencia a una definitiva con R es una posibilidad pendiente de decisión. Este bloque mantiene combate automático; no implementa R, carga de definitiva ni botón táctil adicional. Si se decide incorporarla, habrá que definir su relación con la habilidad inicial, carga, control móvil y maestrías, y ajustar el plan explícitamente.

Se conservan tres clases iniciales, cuatro elementos, dos afinidades máximas, una maestría y cuatro reliquias. Acorazado aplazado. Sacerdote sigue acotado en 3.9, pero deberá adaptarse al sistema nuevo. Se mantienen seis minutos más jefe durante esta iteración; la duración final se revisa en 3.7.

El nuevo alcance añade seis entregas: **cuatro fases, 48 subfases totales, 27 futuras; fase 2 en 8/15 entregables**. Los registros históricos describen sus versiones originales y no se reescriben como si esta ampliación ya estuviera disponible.

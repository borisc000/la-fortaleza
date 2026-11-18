# 2.7.3b — Guerrero e integración jugable

Entrega: 2026-11-02 · aplicación 0.2.9.

## Qué cambia en una expedición

El Guerrero comienza con Espada y Torbellino de nivel 1. La espada queda fuera de los cuatro espacios de habilidades. Desde las elecciones posteriores a la afinidad inicial compiten estadísticas, aprender habilidades, desarrollar las equipadas y afinidades. No se entrega una segunda habilidad por esperar un tiempo fijo.

Repertorio automático: Torbellino, Onda de acero, Hachas giratorias, Martillo de guerra, Lanzas espectrales, Estandarte de guerra, Guardia de represalia y Cadena de guerra. La espada continúa durante Torbellino y las habilidades tienen temporizadores independientes.

Cada ataque llega a nivel 10. En 2/3/4/6/7/8/9 se invierte un punto entre potencia, expansión, especialización y ritmo, con máximo tres por rama. En 5 se elige una de dos mutaciones; en 10, uno de dos remates. Hay dieciséis opciones posibles de desarrollo, pero se eligen nueve mejoras por ataque: no se obtienen todas en una partida.

Los valores y textos ejecutables están en `game/src/content/warrior-abilities.ts`. Ejemplos: onda que vuelve y explota al terminar; hachas con órbita exterior; martillo que repite el impacto; estandarte móvil o fijo; cadena que expone al enemigo para golpes posteriores. Cerco de lanzas recibe +20 % de daño además del reparto hacia amenazas: ajuste explícito respecto de la tabla conceptual 2.7.1.

## Estadísticas y compatibilidad

Doce familias generales y Temple, cuatro rangos: Poder, Vitalidad, Paso, Recogida, Celeridad, Cadencia básica, Balística, Alcance, Amplitud, Persistencia, Recuperación, Resguardo y Temple. Balística exige proyectiles; Persistencia exige hachas o estandarte. Alcance, Amplitud y Persistencia no se ofrecen si no producen beneficio. Vitalidad del Guerrero concede 15 de vida por rango; tienda y elecciones usan los mismos límites.

Las cuatro técnicas anteriores del Guerrero se sustituyen por las ramas de espada y Torbellino y por Temple. No se equipan simultáneamente ambos sistemas. Mago y Arquero conservan sus técnicas hasta 2.7.4. Las doce reliquias, apoyo elemental desde nivel 5, núcleo y maestría siguen disponibles.

## Reglas de combate

- Instantánea de habilidad, daño y afinidad al activar; mejoras posteriores no cambian proyectiles en vuelo.
- Máximo 32 proyectiles del arsenal; representación limitada a 64 objetos. Colisiones y daño pertenecen al dominio, no al renderizado.
- Ondas, lanzas y ataques remotos respetan paredes. El desplazamiento de cadena usa resistencias y protección compartida.
- Golpes derivados no generan nuevos efectos elementales ni cadenas recursivas. Retorno normal de la onda sí conserva su condición de trayecto original.
- Barreras comparten saldo máximo 40 y duración máxima 5 s; no suman sus capacidades. Guardia libera una sola onda y comienza su recarga al romperse la barrera.
- Yunque se aplica después del daño de cadena y usa el mayor bono entre exposición y Quebranto.
- Pausa congela simulación; derrota y reinicio cancelan acciones, proyectiles y estados transitorios.

## Presentación y alcance

Barra de cuatro espacios con nivel/recarga, catálogo consultable, tarjetas de ramas/hitos, resumen final y representaciones procedurales de armas y áreas. Se mantiene el personaje provisional. La revisión visual cubrió entrada, HUD, combate inicial, afinidad y catálogo en PC; no certifica todas las combinaciones de efectos ni rendimiento móvil.

Siguiente: 2.7.4, repertorios de Mago y Arquero. La densidad de hordas y el ritmo global quedan en 2.7.5/2.7.6. No se implementa R manual ni campaña por eras en esta entrega.

## Observación para balance 2.7.6

En el recorrido automático con semilla 19, priorizar aprendizaje permitió llegar al jefe con cuatro habilidades, nivel 13, afinidad II y núcleo conservado; no llegó a maestría ni eligió apoyo. La ruta centrada en combate sí obtuvo maestría. Son inversiones alternativas válidas: no garantizar simultáneamente cuatro habilidades, apoyo y maestría en todas las expediciones. Revisar presupuesto de esencia y frecuencia de oportunidades en 2.7.6 con pruebas humanas.

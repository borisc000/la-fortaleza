# 2.7.4 — Repertorios de Mago y Arquero

Entrega: 2026-11-03 · aplicación 0.2.10.

Las tres clases usan ahora el sistema de elecciones de 2.7.3: aprender una habilidad, desarrollar una equipada o mejorar estadísticas compiten en cada subida. Ocho habilidades por clase, cuatro espacios contando la inicial y básico independiente. Cada árbol llega a nivel 10, con ramas de potencia, expansión, especialización y ritmo; elecciones excluyentes en niveles 5 y 10. No se aprende una habilidad por esperar un tiempo fijo.

## Mago

Cataclismo, lanzas, orbes orbitales, sello de detonación, haz rúnico, nova, lluvia de fragmentos y espejo. Incluyen variantes de concentración, zonas múltiples, penetración, órbitas exteriores, pulsos repetidos, seguimiento y ecos. El proyectil básico también evoluciona. Los ecos no generan cargas arcanas ni copian explosiones potenciadas; sus parámetros se conservan desde la activación del espejo.

## Arquero

Lluvia, abanico, disparo de asedio, rebote, trampa de púas, flechas de retorno, baliza de caza y estacas. Incluyen proyectiles adicionales, penetración, retornos, rebotes entre objetivos, zonas de vulnerabilidad y control de rutas. El básico conserva Precisión; los disparos de habilidades no generan esa pasiva. Los rebotes tienen un límite explícito y las flechas de retorno recorren ambas direcciones.

## Integración y límites

- Recargas independientes: el básico puede dispararse mientras una habilidad está activa. Pausa, muerte y reinicio detienen o limpian los efectos correspondientes.
- Afinidad principal, apoyo elemental, reliquias y primeras maestrías conservados. Los ataques derivados no vuelven a disparar cadenas elementales recursivas.
- Las técnicas antiguas se migran a ramas; no se ofrecen simultáneamente con los árboles nuevos. Los módulos históricos permanecen para pruebas de regresión.
- HUD de cuatro espacios, catálogo de clase y descripciones de opciones conectados al sistema común `ability-development.ts`.
- Daño, trayectorias, marcas y colisiones pertenecen al dominio; los efectos visuales procedurales solo representan el estado. Sin recursos externos nuevos.
- Límites de esta implementación: 32 proyectiles por arsenal y 64 grupos visuales reutilizables. Las trampas esperan hasta 6 segundos; los fragmentos usan impactos de 0,9 m. Persistencia afecta órbitas, espejo, baliza y estacas; no prolonga indiscriminadamente cada pulso instantáneo.
- Mapa 260 × 240 m y cámara 12 m (rueda 4–18) conservados. El límite de población actual no se amplía aquí.

Ver HABILIDADES_2_7_1.md para diseño y VERIFICACION_2_7_4.md para evidencia y límites. Siguiente: 2.7.5, hordas densas y rendimiento inicial; después 2.7.6, ritmo y claridad.

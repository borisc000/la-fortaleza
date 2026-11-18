# 2.7.6 — Ritmo y claridad

Entrega 0.2.12 · 2026-11-04. Implementación e iteración inicial de balance; siguiente 2.8, maestrías.

## Progresión y elecciones

Primera subida con 4 de esencia; después 24, 34, 44… (24 + 10 × (nivel − 2)). Con 1300 de esencia se alcanza nivel 16 y 15 elecciones. La frecuencia depende de derrotar enemigos y recoger esencia, no de un temporizador. Cada elección puede invertir en estadísticas, desarrollar o aprender; aprender no es obligatorio.

La primera oferta de mejoras incluye aprender si hay candidatos; vuelve a garantizarse tras dos ofertas sin aprendizaje. La afinidad principal elegible vuelve a aparecer tras tres ofertas sin ella: ofrecer apoyo elemental no reinicia ese contador. Pesos del relleno: aprender 30, desarrollar 40, afinidad 20, estadísticas 10. La selección inicial de desarrollo pondera por el cuadrado del nivel invertido (1–10), favoreciendo continuar una habilidad sin excluir otras. Se conservan tres tarjetas, elegibilidad, cuatro espacios e hitos excluyentes.

## Supervivencia y economía

- Despojos: 18 de vida y 4 de daño. Protección tras impacto de al menos 0,65 segundos en los repertorios actuales.
- Jefe: 1100 de vida; conserva ataques. Vida inicial de las clases sin aumento artificial.
- Una moneda por cada ocho bajas normales únicas. Retiradas y eventos duplicados no producen premios adicionales.
- Cada 24 bajas normales puede aparecer un suministro de 12 de vida. Máximo cuatro suministros de combate disponibles; hay que acercarse a recogerlos. Si el límite está lleno, esa oportunidad se omite.
- Cofres, captura, precios del mercader, fuentes y suministros fijos conservan sus valores. La economía anterior de una moneda por baja deja de ser adecuada a estas hordas.

## Legibilidad

Daños al mismo objetivo se agrupan por actualización. Máximo ocho números nuevos, priorizando el daño recibido por el héroe y conservando el límite global de 24. Todos los impactos siguen aplicándose. Efectos aliados más transparentes; avisos enemigos con prioridad de dibujo y prueba de profundidad conservada.

Mapa 260 × 240, cámara 12 m (4–18), objetivos de población 20/40/60/90 y techo 100 sin cambios. R manual pendiente. No hay recursos externos nuevos: se reutilizan geometrías y materiales del proyecto.

## Límites

Los recorridos automáticos usan una arena sin obstáculos y una estrategia concreta, no representan a todos los jugadores. No se declara equivalencia entre todas las configuraciones ni balance final. Ver VERIFICACION_2_7_6.md. La revisión humana prolongada, capturas bajo máxima presión, GPU con cuatro habilidades y móvil físico siguen pendientes; consolidar en 2.9 y fase 4.

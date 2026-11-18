# Estado del proyecto

Actualizado el 17 de noviembre de 2026.

## Situación actual

- Aplicación **0.2.15**, **2.7.6 implementada**: hordas locales de 20/40/60/90, mayoría de despojos frágiles, máximo provisional de 100 vivos, representación por instancias y separación espacial. Ver [entrega](docs/diseno/RITMO_2_7_6.md) y [verificación](docs/verificaciones/VERIFICACION_2_7_6.md).
- Guerrero, Mago y Arquero con ocho habilidades por clase, cuatro espacios y básico aparte, niveles hasta 10. Doce reliquias y doble afinidad.
- Mapa **280 × 260 m**, llegada sur y quince hitos; cámara 12 m/rueda 4–18. E1 completada: distribución e interacciones adaptadas, recorridos con combate de las tres clases verificados; sigue E2.1, puerta y dos torres.
- Plan: **49 subfases, 22 futuras**. Fase 1: 13 entregables; fase 2: **14/16** (13 implementaciones y 1 definición); fases 3/4: 0/10 cada una.
- WASD, ratón sin arrastrar, rueda y combate automático; PC primero/móvil horizontal. Acorazado aplazado; R manual pendiente.
- Carga WebGL local comprobada hasta 100 despojos. No equivale a medir GPU directa, cuatro habilidades simultáneas ni teléfono físico. Balance humano prolongado pendiente. La Era I acordada comprende exterior, recuperación interior y defensa con descenso a catacumbas. Ver [campaña por eras](docs/diseno/IDEA_CAMPANA_ERAS.md).
- **Infraestructura (17 de noviembre):** repositorio git privado con CI en GitHub Actions (lint, typecheck, pruebas rápidas y build en cada push; simulaciones completas en `main`). `npm test` en unos 30 s; partidas simuladas aparte con `npm run test:sim`. Interfaz separada de `main.ts` en `src/ui/`. Formato y lint con Biome. Ver [CHANGELOG](CHANGELOG.md).

## Herramienta de revisión

El Mago del laboratorio y del juego usa la malla con la estola ajustada a la túnica, el grimorio sujeto al cinturón y el agarre del bastón revisado. Ver [detalle del modelo](docs/diseno/MAGO_MALLA.md).

El laboratorio de `/model-lab.html` reúne 26 entradas. Permite girar, acercar y revisar las animaciones de las tres clases y sus versiones conservadas. Incluye pausa, repetición, velocidades de 0,25× a 2×, línea de tiempo y avance de un fotograma. El modo Modelos conserva la revisión de gestos. El nuevo modo Habilidades completas permite ejecutar los 24 especiales y los tres básicos con sus efectos contra seis muñecos, elegir nivel 1–10, rama, mutación, remate y los cuatro elementos. Las pruebas están aisladas de la partida y muestran impactos, daño acumulado y barrera. En el catálogo de modelos, enemigos, objetos y escenario siguen estáticos. Ver [controles y registro de revisión](docs/diseno/LABORATORIO_MODELOS.md).

## Punto de reanudación

**Siguiente trabajo de escenario: E2.1 — Puerta y dos torres.** E0 y E1 completadas. Refinar silueta, arco, portón, torres y unión con la muralla sin cerrar los pasos verificados. Ver [cierre E1.4](docs/verificaciones/VERIFICACION_E1_4.md) y [plan completo](docs/diseno/PLAN_DOMINIOS_EXTERIORES.md).

**Siguiente hito del plan general después del trabajo de escenario: 2.8 — Maestrías.** Ritmo, economía y claridad integrados; balance inicial y límites en [VERIFICACION_2_7_6.md](docs/verificaciones/VERIFICACION_2_7_6.md). Se conservan la numeración y los contadores del MVP.

## Historial

El historial de entregas está en [CHANGELOG.md](CHANGELOG.md).

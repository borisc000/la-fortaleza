# Estado del proyecto

Actualizado el 21 de noviembre de 2026.

## Situación actual

- La expedición **Los dominios exteriores** suma dos Toques de asedio, la Montería del Verdugo y ataques del Castellano que pueden activarse desde cualquier distancia. [Reglas y verificación](docs/verificaciones/PRESION_EXTERIOR.md).
- **Modelos de enemigos** con cinco rondas de pulido en los seis tipos. Las mallas nuevas se usan en ambas expediciones y en el Atelier. [Comparativa y verificación](docs/verificaciones/PULIDO_MODELOS_ENEMIGOS.md).
- **El corazón de piedra**, prototipo jugable de la segunda expedición. El patio y el rastrillo dan paso al salón principal. La armería es un desvío opcional y encender la almenara cierra la partida. [Diseño](docs/diseno/EL_CORAZON_DE_PIEDRA.md) · [Verificación](docs/verificaciones/EL_CORAZON_DE_PIEDRA.md).
- **Interfaz general** con portada, selector de expediciones de la Era I, preparación por clase, guía y ajustes guardados en el navegador. El selector abre Los dominios exteriores y El corazón de piedra. La primera bandera figura como «En desarrollo». [Verificación de la interfaz](docs/verificaciones/INTERFAZ_GENERAL.md).

La segunda optimización redujo el p95 de simulación de 2,0 a 1,4 ms con los 60 enemigos juntos y cuatro habilidades. [Comparativa con la primera optimización](docs/verificaciones/RENDIMIENTO_HORDA_60.md#segunda-optimización-de-la-persecución).

En la prueba del claro con 60 despojos juntos y cuatro habilidades del Guerrero, el p95 de fotograma bajó de 29,2 a 14,9 ms. [Condiciones y cuatro escenarios](docs/verificaciones/RENDIMIENTO_HORDA_60.md).

- Se verificaron los básicos de nivel 10 con sus dos finales cruzados y ambos cuartetos de apoyos. [Doce encuentros y capturas comparadas](docs/verificaciones/BASICOS_CRUZADOS_APOYOS_M2_R1.md).

- Se comprobaron los doce encuentros con la segunda mutación y el primer remate de cada apoyo. [Resultados y seis comparaciones de cámara](docs/verificaciones/BASICOS_APOYOS_MUTACION_2_REMATE_1.md).

- Los básicos se revisaron con la segunda mutación y el segundo remate de todos los apoyos de ambos cuartetos. [Doce configuraciones y comparaciones](docs/verificaciones/BASICOS_APOYOS_MUTACION_2_REMATE_2.md).

- Los básicos de nivel 10 se verificaron con ambos cuartetos y el segundo remate en los cuatro apoyos. [Doce configuraciones y capturas](docs/verificaciones/BASICOS_AMBOS_CUARTETOS_REMATE_2.md).

- Se completó la comparación de los básicos a nivel 10 con el otro cuarteto de cada clase. [Seis encuentros con Torbellino, Haz rúnico y Salva en abanico](docs/verificaciones/BASICOS_OTRO_CUARTETO.md).

- Se probaron los tres ataques básicos a nivel 10 con ambos remates y cuatro apoyos equipados. [Ver los seis encuentros](docs/verificaciones/BASICOS_NIVEL_10.md).

- Los tres cuartetos restantes se probaron con los dos remates de nivel 10. Se pulieron las Lanzas espectrales, el Espejo arcano y la Baliza de caza. [Comparaciones](docs/verificaciones/COMBATE_NIVEL_10_RESTANTES.md).

- Los tres cuartetos se probaron a nivel 10 con ambos remates y se ajustó su lectura en combate. [Resultados y capturas por clase](docs/verificaciones/COMBATE_NIVEL_10.md).

- Se verificaron tres combinaciones de cuatro habilidades en combate y se pulieron los efectos que se solapaban desde la cámara de juego. [Comparación por clase](docs/verificaciones/COMBATE_CUATRO_HABILIDADES.md).

- Las 24 habilidades restantes tienen animaciones probadas desde la cámara de juego. [Ver secuencias por clase y pruebas](docs/verificaciones/PULIDO_24_HABILIDADES.md).
- Guardia de represalia, Sello de detonación y Disparo de asedio tienen animaciones verificadas con el encuadre de combate del laboratorio. [Ver secuencia y pruebas](docs/verificaciones/ANIMACIONES_GUARDIA_SELLO_ASEDIO.md).

- Aplicación **0.2.15**, **2.7.6 implementada**: hordas locales de 20/40/60/90, mayoría de despojos frágiles, máximo provisional de 100 vivos, representación por instancias y separación espacial. Ver [entrega](docs/diseno/RITMO_2_7_6.md) y [verificación](docs/verificaciones/VERIFICACION_2_7_6.md).
- Guerrero, Mago y Arquero con ocho habilidades por clase, cuatro espacios y básico aparte, niveles hasta 10. Doce reliquias y doble afinidad.
- Mapa **280 × 260 m**, llegada sur y quince hitos; cámara 12 m/rueda 4–18. E1 completada: distribución e interacciones adaptadas, recorridos con combate de las tres clases verificados. **E2.1 completada:** puerta rehecha según el concepto «Puerta de hierro», con torres redondas adelantadas, rastrillo bajado y cadalso de madera. Ver [verificación](docs/verificaciones/VERIFICACION_E2_1.md). **E2.2 completada:** desgaste procedural de piedra, madera y hierro en todo el escenario, con remates, almenas rotas, piedras caídas y estandartes rasgados en la puerta. Ver [verificación](docs/verificaciones/VERIFICACION_E2_2.md). **E2.3 completada:** explanada y primer tramo del camino con bordes gastados, barro mojado, charcos, malezas y restos del asalto (ariete, escalas, flechas, escudos). Ver [verificación](docs/verificaciones/VERIFICACION_E2_3.md). **E2.4 completada:** comparación con E1 en condiciones equivalentes, auditoría de horda y cámara, coste de render medido y optimizado (+1,4 ms de mediana sin horda), y piezas de la puerta y del asedio en el laboratorio. Ver [verificación](docs/verificaciones/VERIFICACION_E2_4.md) y [criterios de acabado](docs/diseno/ACABADO_EXTERIOR_E2.md). **E3.1 completada:** el suelo gastado cubre todo el mapa, con humedad, musgo, luz y roderas propias de cada sector, charcos y empedrado antiguo en ruinas y abadía (+0,5 ms de mediana). Ver [verificación](docs/verificaciones/VERIFICACION_E3_1.md). **E3.2 completada:** taludes de 3,5–7 m fuera de las vallas, con rocas y freno de cámara, y doce afloramientos rocosos con colisión dentro del mapa; el claro sigue plano. Ver [verificación](docs/verificaciones/VERIFICACION_E3_2.md).
- Plan: **49 subfases, 22 futuras**. Fase 1: 13 entregables; fase 2: **14/16** (13 implementaciones y 1 definición); fases 3/4: 0/10 cada una.
- WASD, ratón sin arrastrar, rueda y combate automático; PC primero/móvil horizontal. Acorazado aplazado; R manual pendiente.
- Carga WebGL local comprobada hasta 100 despojos. No equivale a medir GPU directa, cuatro habilidades simultáneas ni teléfono físico. Balance humano prolongado pendiente. La Era I acordada comprende exterior, recuperación interior y defensa con descenso a catacumbas. Ver [campaña por eras](docs/diseno/IDEA_CAMPANA_ERAS.md).
- **Infraestructura (17 de noviembre):** repositorio git privado con CI en GitHub Actions (lint, typecheck, pruebas rápidas y build en cada push; simulaciones completas en `main`). `npm test` en unos 30 s; partidas simuladas aparte con `npm run test:sim`. Interfaz separada de `main.ts` en `src/ui/`. Formato y lint con Biome. Ver [CHANGELOG](CHANGELOG.md).

## Herramienta de revisión

El Mago del laboratorio y del juego usa la malla con la estola ajustada a la túnica, el grimorio sujeto al cinturón y el agarre del bastón revisado. Ver [detalle del modelo](docs/diseno/MAGO_MALLA.md).

El laboratorio de `/model-lab.html` reúne 26 entradas. Permite girar, acercar y revisar las animaciones de las tres clases y sus versiones conservadas. Incluye pausa, repetición, velocidades de 0,25× a 2×, línea de tiempo y avance de un fotograma. El modo Modelos conserva la revisión de gestos. El nuevo modo Habilidades completas permite ejecutar los 24 especiales y los tres básicos con sus efectos contra seis muñecos, elegir nivel 1–10, rama, mutación, remate y los cuatro elementos. Las pruebas están aisladas de la partida y muestran impactos, daño acumulado y barrera. En el catálogo de modelos, enemigos, objetos y escenario siguen estáticos. Ver [controles y registro de revisión](docs/diseno/LABORATORIO_MODELOS.md).

## Punto de reanudación

**Siguiente trabajo de escenario: E3.3 — Vegetación.** Hierba, arbustos y árboles por grupos y según el terreno, manteniendo libres rutas y lectura de amenazas. Siguen abiertas a revisión las decisiones de la puerta (rastrillo bajado, torres sin tejado, vano de 4,4 × 5,5 m), el carácter de suelo por sector de E3.1 y la altura de los taludes de E3.2. Ver [criterios de acabado](docs/diseno/ACABADO_EXTERIOR_E2.md) y [plan completo](docs/diseno/PLAN_DOMINIOS_EXTERIORES.md). El hito general siguiente sigue siendo 2.8 — Maestrías.

**Siguiente hito del plan general después del trabajo de escenario: 2.8 — Maestrías.** Ritmo, economía y claridad integrados; balance inicial y límites en [VERIFICACION_2_7_6.md](docs/verificaciones/VERIFICACION_2_7_6.md). Se conservan la numeración y los contadores del MVP.

## Historial

El historial de entregas está en [CHANGELOG.md](CHANGELOG.md).

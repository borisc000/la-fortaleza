# 2.7.3a — Esqueleto común de habilidades

Fecha: 2026-11-02. **Implementado como módulos de dominio y pruebas.** La aplicación jugable sigue en 0.2.8; el nuevo sistema aún no está conectado a `Run`, `Progression` ni a los menús. Los efectos actuales siguen siendo la referencia jugable hasta migrar cada clase.

## División acordada

El usuario pidió separar 2.7.3 en dos entregas y ejecutar primero el esqueleto:

- **2.7.3a: estructura común**, entregada aquí: catálogo identificable, configuración, niveles, ramas, hitos, ofertas y tiempos independientes; comprobaciones automáticas y contrato de integración.
- **2.7.3b: Guerrero jugable sobre esa estructura**, siguiente: parámetros y efectos de sus ocho habilidades y básico, estadísticas, adaptación de progresión/tienda/afinidades, retirada de técnicas antiguas para esta clase, HUD, animaciones y validación integrada.

Sustituyen la antigua 2.7.3; no se cuentan además como hijos de otra entrega. Total: **49 subfases, 26 futuras; fase 2 en 10/16 entregables**, nueve implementaciones y una definición. Mago/Arquero siguen en 2.7.4.

## Módulos implementados

| Archivo en game/src | Responsabilidad |
|---|---|
| content/ability-schema.ts | Catálogo inmutable de 24 habilidades y tres básicos, IDs estables, clase, iniciales y límites compartidos; versión de reglas 1 |
| domain/ability-book.ts | Configuración por expedición: básico separado, cuatro espacios, niveles 1–10, ramas hasta III, hitos excluyentes en 5/10, revisiones y operaciones legales |
| domain/ability-offers.ts | Tres tarjetas desde candidatos elegibles, semilla, caché de menú, pesos por categoría, garantías de oportunidad, pares de hitos, validación de selección y cierre |
| domain/ability-clock.ts | Activaciones concurrentes, tiempos de acción y recarga por habilidad, copia de configuración al lanzar, pausa, cierre y generación de expedición para invalidar acciones antiguas |

El catálogo identifica todo el repertorio, pero no afirma que estén implementados sus ataques. No contiene daño ficticio ni ejecutores vacíos presentados como habilidades funcionales. Las cifras, mutaciones y efectos concretos se incorporan en 2.7.3b/2.7.4 desde HABILIDADES_2_7_1.md.

## Invariantes comprobadas

- Inicio con básico y habilidad inicial de nivel 1; solo la habilidad usa espacio. Aprender otra consume un espacio; mejorar no. No se aprende algo de otra clase ni una quinta habilidad.
- Cada nivel sube mediante una operación legal: siete inversiones de rama, una mutación y un remate. Ramas máximas III y nivel máximo 10. En 4/9 solo se ofrecen las dos alternativas del hito correspondiente; no se puede saltarlo.
- Los estados y opciones son copias inmutables. Las revisiones impiden aplicar dos veces un clic antiguo, incluso después de reiniciar. Una configuración previa sigue representando lo que se lanzó antes de mejorar.
- Las ofertas reservan estadística/desarrollo cuando existen y usan pesos 45/25/20/10 para aprender/desarrollar/afinidad/estadística en la tarjeta abierta. Tras dos elecciones sin aprendizaje elegible lo muestran; tras tres sin afinidad elegible la muestran. Esto cuenta oportunidades, no obliga al usuario a adquirir nada.
- Los hitos muestran ambas alternativas y dejan una tercera opción cuando existe. Dos garantías simultáneas posponen el par de hitos. La cola es estable al reabrir; semilla y secuencia permiten reproducirla. Los candidatos elegibles los aporta el adaptador de progresión.
- Cada acción tiene duración y recarga independientes; la recarga de una secuencia empieza al terminar, conservando el excedente del paso de simulación. Sin objetivo válido no consume recarga. Pausa congela los tiempos; terminar invalida las acciones antiguas y reiniciar limpia temporizadores.

## Contrato para 2.7.3b

1. Crear un libro, una cola de ofertas y un reloj por expedición/clase migrada. Usar una versión explícita del sistema para que técnicas antiguas y ramas nuevas nunca apliquen simultáneamente. No habilitar nuevas habilidades en el menú antes de tener su ejecutor.
2. Progresión sigue siendo dueña de esencia, niveles, afinidades, reliquias y cola de recompensas. Convierte `book.options()` en candidatos con clave estable; añade estadísticas y afinidades después de revisar requisitos, topes y beneficio real. Antes de publicar la oferta, filtrar habilidades aún sin ejecutor. Prioridad de maestría/reliquia/nivel y requisitos del nivel en cola se conservan.
3. Una selección se resuelve sincrónicamente: validar ID de oferta, clave y revisión con `canChoose`; revalidar requisitos; aplicar la operación de libro o estadística/afinidad; solo al tener éxito hacer `commit` y consumir el nivel. El dueño debe usar una revisión común que cambie también al comprar/equipar, no solo la revisión del libro. `commit` es confirmación interna, no una API de UI que conceda mejoras por sí sola. Si cambian requisitos durante una oferta, invalidar/reconstruir esa transacción conservando garantías; no usar reset para renovar opciones.
4. Ofertas vacías requieren que el adaptador aplique una sola vez la curación de reserva. Una única mejora existente puede mostrar menos de tres tarjetas; si solo queda un par de hitos y se quiere permitir rechazarlo, añadir una alternativa de reserva explícita. Los nombres/descripciones antes/después provienen de datos reales, no de las claves internas.
5. El ejecutor obtiene la habilidad del libro actual, resuelve objetivo/obstáculos y parámetros, y llama al reloj. El reloj no valida equipamiento, no calcula daño, no elige blancos y no emite impactos. `accepts` comprueba generación/pausa/estado; la identidad de activación y las listas de impactos se controlan en combate. No es un sistema de autenticación de eventos.
6. Básico y pasiva se adaptan al contrato de clase existente; el reloj permite simultaneidad, pero su introducción no debe duplicar los temporizadores antiguos. Los ejecutores son responsables de pulsos, blancos alcanzados, fuentes originales/derivadas y ausencia de recursión. Ventanas activas e instantes de impacto requieren datos explícitos.
7. La pausa se comunica a los tres componentes mediante el dueño; muerte llama `stop`; otra expedición crea instancias nuevas o reinicia las tres. Un proyectil puede seguir volando cuando acaba su animación: conserva su instantánea, y una generación antigua nunca vuelve a causar daño tras reiniciar.
8. Conectar HUD y resultados al estado de solo lectura. Retirar espacios de técnicas para Guerrero conforme a la tabla de migración. Mantener Mago/Arquero actuales hasta 2.7.4. Revisión visual y pruebas de combate pertenecen a esta integración, no se atribuyen a las pruebas del esqueleto.

## Verificación de esta entrega

Ocho pruebas dirigidas correctas en `game/tests/ability-foundation.test.ts`; registro `../../work/tests-2-7-3a.log`. Incluyen 54 recorridos de árboles (dos por cada una de las 27 definiciones), slots y clases, exclusión de hitos, transacciones repetidas/antiguas, simultaneidad, instantáneas, pausas, tiempos inválidos y reinicio. Veinte semillas durante treinta ofertas comprueban las garantías de aprendizaje y afinidad. Pares de hitos, menú vacío y cierre también comprobados.

TypeScript y compilación de producción correctos. Los módulos nuevos están comprobados en dominio y typecheck; al no estar importados por la aplicación activa, Vite conserva el mismo juego y no los incluye aún en el paquete de navegador. No se repitieron campañas largas ni se atribuyen nuevas pruebas visuales/GPU. Esta entrega deja una base ejecutable y probada para completar la migración, no una modificación visible del combate.

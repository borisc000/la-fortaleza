# Subfase 1.3 — implementación y verificación

Fecha: **2026-10-31**. Estado actualizado: **implementada y aceptada visualmente por el usuario**. Tras verla y pedir más zoom, el usuario indicó «ya lo vi y se ve bien.. Sigue con la 1.4 no más». Se continúa por esa instrucción; las comprobaciones técnicas no realizadas que siguen abajo se conservan como pendientes, no como una nueva aprobación ni bloqueo. Este registro describe la entrega 1.3; el código actual incluye [1.4](VERIFICACION_1_4.md).

## Alcance implementado

- Proyecto independiente en `game/`: Three.js 0.187.0, TypeScript 7.0.2, Vite 8.3.5, lockfile. Entorno usado: Node 22.18.0 y npm 10.9.3.
- Escena exterior construida en 3D: explanada, camino, muralla, torreones, puerta cerrada, torre interior de fondo, ruinas, vegetación y antorchas. Materiales PBR y cielo HDR locales, con procedencia CC0 documentada.
- Figura humana de escala con cuero y placas, provisional. No es un modelo final ni tiene animaciones de combate.
- Cámara de perspectiva: FOV 65°, punto observado a 1,3 m, distancia inicial 8 m; giro por ratón, arrastre alternativo, sensibilidad, invertir vertical, zoom con rueda entre 4 y 12 m y centrado. La rueda actúa sobre el paisaje durante la vista activa; no se intercepta Ctrl/⌘ + rueda.
- Volumen de cámara conservador mediante cajas expandidas; protege las esquinas del plano cercano y el suelo. Acercamiento inmediato ante obstáculo y recuperación exponencial independiente de la frecuencia de renderizado. Atenuación del personaje al acercarse demasiado.
- Tres puntos de observación para comprobar escala y obstrucción sin adelantar el movimiento de 1.4.
- Entrada explícita, carga con progreso, pausa/reanudación y error. Captura solo tras pulsar botón; Esc, pérdida de foco/captura o pestaña oculta pausan. No se reanuda automáticamente al volver.
- Calidad alta/ligera, límite de densidad de píxeles, geometría estática agrupada por material y panel de diagnóstico. Liberación de recursos al salir o recargar mediante HMR.
- Descargas con límite de 15 s por archivo, materiales de reserva y aviso ante fallos. Error de creación/pérdida de WebGL con recuperación por recarga.

## Comprobado

| Comprobación | Resultado |
|---|---|
| TypeScript | Sin errores con `tsc --noEmit` |
| Compilación de producción | Correcta con `npm run build` |
| Pruebas automatizadas | **9/9** correctas |
| Colisión de cámara | Pared frontal, esquina que un rayo central omitiría, paralelas, pared detrás, origen dentro y suelo |
| Recuperación de cámara | Acercamiento instantáneo; equivalencia entre pasos temporales distintos |
| Pantalla ancha | Aumenta el volumen para proteger el plano cercano |
| Estado | Carga y pausa requieren entrada explícita; error no puede reanudarse |
| Construcción del escenario real | Geometría finita, menos de 100 mallas en la prueba con materiales de reserva; sin error de combinación |
| Puntos de observación | 64 rumbos por cada uno de los tres puntos; distancia segura >0,5 m; el punto Muralla fuerza acercamiento |
| Servidor local | Vite escucha en `127.0.0.1:5183`; HTML HTTP 200 |
| Recursos | 13/13 HTTP 200, contenidos idénticos a archivos locales; firmas de 12 JPEG y un HDR Radiance correctas |

El test de construcción se ejecuta en Node, sin contexto WebGL. **No prueba el renderizado, los shaders, la composición ni las interacciones del navegador.**

## Tamaño y rendimiento

- Compilación tras el ajuste de zoom: HTML **4,37 kB**, CSS **4,99 kB**, JavaScript **605,64 kB**; JS comprimido con gzip estimado por Vite: **156,67 kB**. Se repitieron compilación y las nueve pruebas existentes: correctas. Interacción real de la rueda pendiente de acceso al navegador.
- Texturas y HDR: **8.193.797 bytes**; manifiesto: 4.173 bytes. Los recursos no están incluidos en el tamaño del JS.
- Advertencia de Vite: paquete JS superior a 500 kB. No impide compilar. Está pendiente evaluar división/carga del motor en optimización de entrega.
- **FPS, p95 real, tiempo de carga observado y estabilidad sostenida: sin medir** por el bloqueo de acceso al navegador. El panel está implementado, pero no se atribuyen valores no observados.
- Hardware detectado: AMD Radeon integrada y NVIDIA GeForce RTX 3050 Laptop GPU. No se sabe cuál usaría el navegador; no se atribuye un resultado a ninguna.
- No se ha probado un teléfono físico ni se garantiza rendimiento móvil.

## Bloqueo actual

La herramienta de navegador informa: «Local browser use is disabled in Work settings». El usuario indicó que lo habilitaría. Las comprobaciones posteriores, incluida una sesión recién inicializada, siguen mostrando el ajuste desactivado. No se usaron Playwright externo, depuración remota ni otra ruta para eludirlo.

El proyecto puede abrirse manualmente en http://127.0.0.1:5183/ mientras el servidor esté activo. Si se detiene, seguir [game/README.md](game/README.md).

## Comprobaciones técnicas pendientes, sin bloquear el avance autorizado

1. Abrir la escena en navegador con WebGL 2; revisar consola, carga completa, texturas y cielo. Inspeccionar contra la referencia artística, corregir encuadre/materiales y conservar captura real.
2. Entrar, arrastrar horizontal y verticalmente, probar captura del ratón y alternativa si se rechaza. Comprobar Esc, cambio de pestaña, pérdida de foco y reanudación explícita sin salto de cámara.
3. Comparar Explanada, Muralla y Puerta. Girar junto a muralla y esquinas: acercamiento sin atravesar geometría, recuperación suave y personaje legible. Probar límites de inclinación y distancias 4–12 m, rueda en ambas direcciones, sincronización con el ajuste de distancia y ausencia de zoom de cámara al usar menús o pausa.
4. Registrar resolución, navegador, calidad, FPS/p95 y duración de una muestra activa. Medir ambos niveles de calidad; no extrapolar a hordas.
5. Comprobar horizontal pequeño y vertical; paneles, botones, giro de pantalla y redimensionado. Esto no sustituye una prueba móvil física.
6. Inducir un fallo de recurso de forma controlada y reversible y comprobar aviso/material de reserva; comprobar respuesta ante WebGL no disponible. Restaurar condiciones normales.
7. Actualizar este registro con evidencia real cuando se hagan estas comprobaciones. No convertirlas en otra solicitud de aprobación visual: el usuario ya aceptó la escena y pidió avanzar.

## Límites de esta entrega

No hay WASD, joystick de movimiento, enemigos, daño, habilidades, elecciones de mejoras ni progreso persistente. Corresponden a subfases posteriores. Se conserva el objetivo de cuatro clases y cuatro elementos; no se introducen clases o elementos nuevos. El interior del castillo permanece de fondo y la puerta cerrada. El aspecto final requiere personajes con rig, animación y pulido del entorno; esta base no acredita fidelidad al concepto.

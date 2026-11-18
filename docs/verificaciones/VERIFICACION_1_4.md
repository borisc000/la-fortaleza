# Subfase 1.4 — Movimiento y controles

Fecha: **2026-10-31** · Versión **0.1.4** · Estado: **implementada y compilada, 20 pruebas automatizadas correctas**.

El usuario vio la escena de 1.3, aprobó el encuadre ajustado y pidió continuar con 1.4. No se exige otra aprobación de 1.3 ni se confunde esa aceptación con mediciones técnicas que no se han realizado.

## Implementación

- WASD relativo al rumbo horizontal de la cámara; 5 m/s, diagonales normalizadas y sin inercia al soltar. El personaje gira suavemente hacia su desplazamiento real. La cámara conserva su orientación independiente.
- Reglas puras de movimiento en `src/domain/movement.ts`. Simulación a 60 Hz e interpolación visual entre pasos; máximo de 100 ms de recuperación por cuadro para que un tirón no produzca un salto grande.
- Cuerpo circular en XZ de radio 0,4 m y altura 1,86 m. Contactos con cajas estáticas, subdivisión de desplazamiento para no saltar paredes finas, resolución iterativa y deslizamiento tangencial. Si no se puede resolver un contacto múltiple se conserva la última posición segura.
- Sólidos de movimiento derivados de la arquitectura por altura. Ruinas, cajas, troncos, viga caída y vallado incluidos. Troncos y viga usan cajas cortas consecutivas para no bloquear todo el rectángulo de su proyección. Hierba y piedras pequeñas son transitables.
- Área explorable X [-23, 28] y Z [-20, 28], descontando radio del jugador. Vallado visible a los lados y al fondo; frente cerrado por fortaleza y puerta. El personaje no salta ni entra al castillo.
- Joystick flotante en la mitad izquierda con radio de entrada de 44 px y zona muerta de 12 %. Arrastre derecho para cámara. Cada dedo conserva su identificador y rol al cruzar de mitad; liberar o cancelar un dedo no cancela el otro. No se inicia movimiento desde botones o paneles.
- Teclas y punteros se limpian al perder foco, ocultar pestaña, pausar, perder captura del ratón o interactuar con controles de interfaz. Una tecla mantenida no reaparece por eventos repetidos tras una pausa. Reanudación explícita; el foco vuelve al lienzo.
- Cámara sobre posición interpolada, sin balanceo de cabeza. Se conservan distancia inicial 8 m, zoom 4–12 m y colisión. Centrar vuelve detrás del rumbo actual del héroe. Los tres botones de lugar siguen siendo atajos de prueba y no una mecánica de teletransporte del juego final.
- Marcha provisional articulada de piernas y brazos, con espada ligada a mano derecha. La intensidad depende del desplazamiento real, por lo que disminuye al empujar un muro. No sustituye un rig ni animaciones definitivas.

## Comprobaciones realizadas

`npm run build`: correcto, incluido TypeScript. `npm test`: **20/20**.

| Área | Evidencia automatizada |
|---|---|
| Rumbo y velocidad | W sigue a la cámara; D es perpendicular; diagonal limitada; avance de 5 m por segundo y parada sin entrada |
| Contactos | Pared fina ante desplazamiento de 15 m, deslizamiento, rodeo de esquina, esquina cóncava y límite del mapa |
| Giro | Ruta angular corta al cruzar ±π; orientación de cámara independiente |
| Entrada táctil | Dos dedos, liberación de cualquiera, tercer dedo ignorado, cruce de mitades, zona muerta y limpieza completa |
| Cámara | Se mantienen las pruebas de volumen, suelo, esquinas y recuperación de 1.3 |
| Escenario real | 3 puntos × 12 rumbos × 300 pasos = **10.800 pasos simulados**, sin penetración de sólidos ni salida del área y con cámara a distancia segura |
| Geometría | Construcción de toda la escena sin valores no finitos; no se rompe la combinación de mallas al añadir vallado y articulaciones |

Compilación de entrega: HTML 4,63 kB; CSS 5,82 kB; JS 610,98 kB (gzip estimado 158,67 kB). Persiste la advertencia de Vite sobre paquete JS >500 kB; no impide compilar. No se han añadido dependencias.

## Límites de verificación

El navegador de la herramienta sigue indicando uso local desactivado. **No se ha probado interactivamente esta versión con teclado, captura real, pérdida de foco, GPU ni teléfono físico.** Los tests de punteros prueban estado y propiedad independientes, no emulan un teléfono. No se afirma una cifra de FPS ni aprobación del usuario de 1.4 todavía.

Para la siguiente comprobación disponible: recorrer puerta, esquinas de ruinas y vallado; girar mientras se camina; variar zoom; pausar con W mantenida y volver; tocar menú durante desplazamiento; mantener ambos dedos y soltar cada uno por separado; girar de orientación. Registrar resultados reales sin detener el avance autorizado por la revisión pendiente de 1.3.

## Próximo contenido

**1.5: enemigo perseguidor, adquisición de blanco, espadazo automático y daño.** Movimiento, controles y cámara permanecen separados del combate; no se añaden botones de ataque ni habilidades manuales.

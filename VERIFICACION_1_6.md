# Subfase 1.6 — Kit completo del Guerrero

Fecha: **2026-10-31** · Versión **0.1.6** · Estado: **implementada; compilación y 48 pruebas automatizadas correctas**.

## Ímpetu

- Un espadazo que acierta genera **una** acumulación aunque golpee a varios objetivos o alcance a otro más tarde en su ventana activa.
- Máximo **cuatro**, cada una añade **5 %** al daño de los siguientes espadazos: 18 → 18,9 → 19,8 → 20,7 → 21,6. Se conserva precisión interna; se redondean los números mostrados.
- El multiplicador se fija al iniciar el golpe: todos sus objetivos reciben la misma potencia. El golpe que consigue la acumulación no se potencia a sí mismo. Si Ímpetu expira durante la preparación, ese ataque conserva la potencia que tenía al comenzar.
- Cada nuevo espadazo que acierta renueva **3 s** de duración, también con cuatro acumulaciones. Tras ese tiempo se pierden todas.
- Fallar no concede ni renueva acumulaciones. Los pulsos de Torbellino tampoco. Ímpetu aumenta el básico, no el daño de Torbellino.
- HUD con cuatro marcas, bonificación y cuenta atrás; arcos de espadazo potenciado más dorados. Es un efecto físico de clase, sin asignar afinidad Fuego o Aire.

## Torbellino automático

- **Listo al inicio.** Activa al haber al menos un enemigo vivo, a alcance y sin muro interpuesto. Basta un único enemigo. Sin objetivo válido mantiene disponibilidad y no consume recarga.
- Si un espadazo está iniciado, lo deja terminar antes de activarse. Durante el giro sustituye al básico. Esta prioridad evita cancelar golpes ya preparados y no añade control manual.
- Duración **2,4 s**; radio **2,6 m**, incluyendo explícitamente el radio enemigo en la prueba de alcance.
- **Seis pulsos de 12 de daño**, en t = 0 / 0,4 / 0,8 / 1,2 / 1,6 / 2 s. Cada pulso tiene identidad independiente y alcanza como máximo una vez a cada enemigo.
- Cada pulso vuelve a comprobar vivos, distancia y paredes desde la posición actual del Guerrero. Se puede seguir caminando a **5 m/s** y girar cámara/zoom. La animación gira el personaje, no la cámara ni el rumbo usado por WASD.
- La recarga de **20 s comienza al terminar**, no al activar. No se acumulan cargas adicionales. El básico puede volver a usarse durante la recarga.
- Pausa detiene edad, pulsos, recarga, estados y ataques enemigos. Derrota o resultado cancelan lo restante; reiniciar borra estado, efectos y acumulaciones.
- HUD de estado listo/activo/recargando, sin botón de lanzamiento. Arcos circulares y pose de giro provisionales; geometría y materiales se liberan al salir.

## Pruebas y entrega

- **48/48 tests correctos** y `npm run build` correcto, incluido TypeScript.
- Trece pruebas nuevas: una acumulación por cleave; incremento/cap/refresco; fallo y expiración; potencia fijada al inicio; objetivo único y seis pulsos únicos; aislamiento entre pasiva y habilidad; preparación detrás de muro y sin blancos; comprobación de muros/alcance en cada pulso; recarga completa y segunda activación; prioridad de espadazo ya iniciado; movimiento a velocidad completa; pausa; muerte y reinicio.
- Las pruebas unitarias heredadas de espada/enemigo posponen Torbellino para aislar esas reglas. Las pruebas nuevas y la integración sobre el mapa usan su activación automática real.
- Integración del encuentro real sin mover al Guerrero: victoria a los **9,77 s de simulación**, cinco bajas y **28 de vida**. Esto describe un caso determinista de reglas, no FPS ni una evaluación de dificultad por una persona.
- El encuentro de cinco enemigos conserva posiciones y estadísticas. Por su duración corta, no asegura cuatro acumulaciones ni dos Torbellinos en cada intento. Los ciclos largos se comprueban con objetivos resistentes en tests, sin aumentar artificialmente la vida de los enemigos del juego.
- HTML local HTTP 200, versión 0.1.6 e indicadores de ambas habilidades presentes.
- Build: HTML **6,02 kB**, CSS **8,56 kB**, JS **638,14 kB** (gzip estimado **166,72 kB**). Persiste la advertencia de paquete JS >500 kB. Sin dependencias ni descargas nuevas.

## Límites y continuación

El navegador de la herramienta sigue desactivado. No se atribuye revisión visual de los nuevos efectos/indicadores, medición con GPU o prueba en teléfono físico. Esas comprobaciones siguen pendientes y no bloquean el avance autorizado por el usuario.

Siguiente subfase: **1.7, esencia, experiencia y elecciones de mejoras**. Esta entrega no añade aún elementos, experiencia, oleadas ni progreso persistente. La primera elección de afinidad se resolverá dentro del alcance documentado de 1.7, manteniendo Fuego/Agua/Tierra/Aire como elementos del MVP.

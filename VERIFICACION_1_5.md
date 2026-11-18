# Subfase 1.5 — Combate básico

Fecha: **2026-10-31** · Versión **0.1.5** · Estado: **implementada; 35 pruebas automatizadas correctas**.

## Encuentro disponible

Cinco soldados esqueléticos ya situados en la explanada. Se activan solo al entrar explícitamente. Perseguirán al Guerrero, rodearán obstáculos y prepararán ataques. Abatirlos completa este encuentro de prueba; perder toda la vida termina en derrota. Ambos resultados permiten reiniciar, también desde pausa. No es todavía la partida de seis minutos ni el sistema de oleadas.

Los modelos y animaciones son provisionales: soldado estrecho, cráneo y costillas visibles, casco, tela deteriorada y espada. El Guerrero mantiene su equipo medio. Preparación enemiga con arco ámbar; fase activa roja. Espadazo del Guerrero con arco claro, números de daño y destellos. Vida propia, bajas, reloj, estado automático y barras enemigas. Aviso para ataques cercanos preparados fuera de cámara.

## Reglas implementadas

| Sistema | Valores y comportamiento |
|---|---|
| Guerrero | 100 de vida; daño físico 18; armadura inicial 0 |
| Espadazo | Alcance 2 m más radio del objetivo; arco 120°; preparación 0,12 s; ventana 0,12 s; duración visual 0,42 s; 0,75 s entre comienzos |
| Objetivo | Adquisición en 360°, cada 0,1 s o al invalidarse el blanco actual; mantiene blanco salvo alternativa al menos 25 % más cercana; desempate por ID |
| Orientación | Se fija al comenzar cada ataque. El jugador sigue moviéndose; la cámara no gira con el golpe |
| Impacto | Una vez por objetivo e identidad de ataque; un espadazo puede alcanzar varios enemigos; trayectoria bloqueada por muros |
| Soldado | 54 de vida; radio 0,36 m; velocidad 2,15 m/s; daño 12; armadura 0 |
| Golpe enemigo | Alcance 1,1 m más radio del Guerrero; arco 90°; preparación 0,6 s; ventana 0,12 s; recuperación hasta 1,05 s; periodo mínimo 1,55 s |
| Daño recibido | Protección de 0,35 s tras impacto; no hay daño por tocar cuerpos |
| Daño final | Base × 100 / (100 + armadura no negativa); precisión interna sin redondear, vida mínima 0 |
| Resolución | Se reúnen impactos válidos de actores vivos al inicio del paso, se aplica daño y luego muertes. Derrota tiene prioridad sobre victoria simultánea |
| Muerte | Un evento y una baja por enemigo. El encuentro terminado no vuelve a simular ataques, daño ni eventos |

Los valores del Guerrero provienen del contrato 1.1. Las cifras del soldado y las cinco posiciones iniciales son decisiones de implementación para esta prueba, no balance aprobado expresamente por el usuario.

## Movimiento y navegación

Se conserva el movimiento de 1.4. Rejilla de navegación de 0,8 m, conexiones estáticas que respetan el radio enemigo y búsqueda inversa compartida. Actualización de rutas cada 0,3 s, con aproximación directa si el segmento está despejado. Los cuerpos siguen usando colisión física circular; la navegación no permite atravesar sólidos. Separación suave entre enemigos y respecto al Guerrero, sin daño de contacto.

Simulación fija de 60 Hz, ahora limitada a **cinco pasos recuperados por cuadro**, de acuerdo con el contrato 1.1. El panel cuenta cuadros limitados. Pausa y resultados detienen la simulación. Reiniciar crea un estado de combate nuevo y borra efectos transitorios; conserva calidad, sensibilidad y zoom. Se quitaron los botones de teletransporte de prueba del HUD normal.

## Comprobaciones realizadas

- **35/35 tests correctos**, incluidos los 20 anteriores de cámara, movimiento, entrada y escenario.
- Selección estable y desempates; alcance/arco; bloqueo por paredes; golpe múltiple sin repetir daño; no consumir recarga sin blanco; ataque independiente de rumbo de movimiento.
- Preparación enemiga completa, ausencia de daño por contacto, esquivar saliendo del arco, protección ante fuentes simultáneas y posteriores.
- Muertes simultáneas, bajas únicas, victoria del encuentro, estado terminal inmutable y reinicio explícito con valores nuevos.
- Fórmula de armadura y precisión; ruta alrededor de una pared.
- **Integración sobre fortaleza real:** posiciones iniciales sin solapamientos, encuentro de cinco enemigos completo, muertes únicas y cuerpos sin penetrar arquitectura.
- **Caso de simulación de referencia:** Guerrero inmóvil en el inicio; victoria a los **9,95 s**, cinco bajas y **16 de vida**. Es tiempo de simulación y resultado de ese caso determinista, no una medición de FPS ni una afirmación de dificultad para jugadores reales.
- Un perseguidor iniciado detrás de las ruinas llega al jugador rodeándolas, sin atravesar muros.
- Construcción de los modelos de enemigos, HUD 3D, reinicio de sus vistas y liberación de recursos en Node. Los números de daño creados mediante Canvas requieren navegador y no se validan visualmente con esa prueba.
- Entrada HTML del servidor local responde HTTP 200 y muestra versión 0.1.5 con pantalla de resultado.

Compilación de producción y TypeScript comprobados. Sigue la advertencia ya conocida de paquete JS >500 kB. No se añadieron dependencias ni descargas de recursos.

## Límites y siguiente entrega

El acceso local al navegador de la herramienta sigue desactivado. No se ha revisado interactivamente el aspecto de los nuevos enemigos, ataques, números, HUD o reinicio, ni se han medido FPS con GPU o probado un teléfono. Se conserva esa limitación sin bloquear el avance ya autorizado.

Pendiente para la próxima revisión disponible: claridad del arco y alcance, respuesta al moverse durante ataques, legibilidad de amenazas fuera de pantalla, pausa durante preparación, derrota y repetición, costes de renderizado en PC/móvil. Las pruebas automatizadas no sustituyen esa revisión.

No se implementan aún Ímpetu, Torbellino, afinidades, experiencia, recompensas económicas, oleadas ni jefe. Las muertes tienen eventos únicos para conectar la experiencia en 1.7. Próxima subfase: **1.6, kit completo del Guerrero**.

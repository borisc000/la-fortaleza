# Subfase 1.7 — Experiencia y elecciones

Fecha: **2026-10-31** · Versión **0.1.7** · Estado: **implementada; TypeScript, compilación y 61 pruebas automatizadas correctas**.

## Comportamiento implementado

- Cada muerte enemiga genera un cristal verde pálido con **1 esencia**. Identidad única por enemigo; repetir un evento de muerte o recoger de nuevo no concede recompensas adicionales.
- Absorción a **1,5 m**, atracción desde **3 m** a **8 m/s**. La línea de recogida se comprueba contra sólidos: ni atracción ni absorción atraviesan paredes. Los cristales flotan visualmente sin modificar la regla física.
- Umbral del siguiente nivel: **4 + 2 × (nivel actual − 1)**. Se conserva el exceso y se encolan todos los niveles obtenidos. Veinte esencias producen nivel 4 y 2/10 hacia el siguiente.
- Al subir, se detienen movimiento, enemigos, ataques, recargas, temporizadores, atracción y reloj. Se liberan teclas y punteros. La cámara y los controles de fondo quedan inactivos durante la elección.
- Tres tarjetas distintas del catálogo elegible, con descripción y rango actual/siguiente. Ofertas rotadas de manera determinista para esta prueba, sin azar global. Las maximizadas no aparecen; si quedan una o dos válidas, se muestran esas opciones.
- Cada tarjeta valida la identidad de la elección. Repetir su activación no vuelve a aplicar la mejora ni consume la siguiente elección. Después se muestra la mejora obtenida y un botón explícito **Continuar** o **Siguiente mejora**. No se reanuda entre niveles pendientes.
- Si todas las mejoras están al máximo, cada elección pendiente recupera **25 % de vida máxima**, limitada por la vida máxima; nunca deja un selector vacío que bloquee el juego.
- Perder foco, Esc o liberar el ratón mientras se elige conserva la elección y mantiene el mundo detenido. Reanudar requiere acción explícita. Rotar a vertical no inicia la simulación.
- Daño y muerte se resuelven antes de experiencia: un golpe letal cancela botín y elecciones restantes. Aumentar vida no puede resucitar al jugador.

## Mejoras generales

Cada mejora tiene **tres rangos**. Valores editables en `game/src/content/progression.ts`.

| Mejora | Efecto por rango | Máximo |
|---|---|---|
| Filo templado | +10 % del daño base de espada y Torbellino | +30 %; multiplica el bono de Ímpetu en espada |
| Vigor de hierro | +20 vida máxima y +20 vida actual | 160 de vida máxima |
| Paso firme | +0,5 m/s de movimiento | 6,5 m/s |
| Llamada de esencia | +0,5 m de absorción y atracción | 3 m / 4,5 m |

La potencia de la espada se fija al iniciar el golpe, conservando la regla de 1.6. Las mejoras no cambian retroactivamente ese golpe. Los siguientes golpes y pulsos usan los nuevos valores.

## Encuentro de prueba

- Se amplía la prueba a **tres grupos de 5, 7 y 8 soldados**, veinte enemigos en total, para poder usar las mejoras durante el combate.
- El siguiente grupo espera a que se elimine el anterior, se recoja su esencia y se resuelvan las elecciones. La victoria final también espera estos pasos.
- Los refuerzos aparecen en posiciones transitables con ruta hacia el jugador, separadas entre sí y a una distancia mínima de 10 m en este generador. Durante **1,2 s** muestran un anillo y cuerpo tenue; no se mueven, atacan ni reciben daño. Después comienza su persecución normal.
- Los tamaños de grupo son fijos; sus posiciones se adaptan a la ubicación del héroe. Esto es una prueba finita de progresión, no el director de oleadas de seis minutos previsto para 1.9.
- HUD con nivel, barra de esencia, grupo, bajas y vida máxima actualizada. Resultado con nivel, esencia recogida y mejoras elegidas.
- Reiniciar limpia experiencia, rangos, elecciones, cristales, grupos, enemigos, efectos y temporizadores. Conserva los ajustes de cámara/calidad. No hay guardado persistente.

## Secuenciación de afinidades

El contrato de 1.1 prevé elegir Fuego o Agua al alcanzar nivel 2. **Durante 1.7 se ofrecen mejoras generales también en nivel 2**. La excepción elemental se incorpora en **1.8 junto con afinidades y efectos funcionales**. Esta secuenciación se explicitó al implementar; no se atribuye al usuario una aprobación de un cambio de diseño. Se mantienen Fuego/Agua/Tierra/Aire como los cuatro elementos del MVP.

## Verificación realizada

- **61/61 pruebas correctas**: 48 heredadas y 13 nuevas. Cobertura nueva de esencia única, alcance y paredes, exceso/cola de niveles, opciones válidas y agotadas, aplicación real de estadísticas, daño de espada/Torbellino, pausa, derrota simultánea, transición entre grupos, anticipación de aparición, reinicio y liberación de recursos de cristales.
- Prueba del escenario real: **48 posiciones del jugador** con ocho lugares seguros y alcanzables para refuerzos. Ningún soldado aparece dentro de sólidos.
- Integración de los tres grupos sobre el mapa real: **48,37 s de simulación, 20 muertes únicas, 20 esencias, nivel 4, 2 de exceso, tres elecciones y victoria**. Usa vida ampliada solo en la prueba para aislar progresión y navegación; no prueba balance, dificultad humana ni FPS. La vida normal del juego sigue siendo 100 antes de mejoras.
- El encuentro histórico de cinco soldados con estadísticas normales sigue pasando, además de movimiento, cámara, colisiones, selección de objetivos, Ímpetu y Torbellino.
- `npm run build` correcto, incluido `tsc --noEmit`. HTML **6,79 kB**, CSS **10,35 kB**, JS **647,53 kB**, gzip estimado de JS **169,71 kB**. Persiste la advertencia de paquete >500 kB. Sin dependencias ni recursos externos nuevos.
- Servidor de desarrollo local HTTP **200**, HTML versión 0.1.7 y controles de experiencia/elección presentes, en `http://127.0.0.1:5183/`. Sin publicación.

## Pendiente de revisión interactiva

No se realizó revisión visual interactiva del nuevo selector, cristales o refuerzos por el agente; el acceso local al navegador figuraba desactivado en la sesión. No se eludió ese ajuste. También quedan pendientes uso real de teclado/ratón/táctil, legibilidad en celular horizontal, mediciones GPU y balance jugado por una persona. Las pruebas de reglas y construcción de escena no sustituyen esas observaciones ni bloquean el avance autorizado.

Siguiente subfase: **1.8 · Fuego, Agua y primeras maestrías**.

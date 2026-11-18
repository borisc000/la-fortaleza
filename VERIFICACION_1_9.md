# Subfase 1.9 — El asedio completo

Fecha: **2026-10-31** · Versión **0.1.9** · Estado: **implementada; 101 pruebas automatizadas, TypeScript y build correctos**.

## Partida y oleadas

La prueba de cuatro grupos de 1.8 se sustituye por **seis minutos de combate activo más jefe**. Pausas, elecciones y carga no avanzan ese reloj. Se conserva la guardia inicial de cinco soldados, la explanada, movimiento, cámara sin arrastrar, Fuego/Agua y maestrías.

| Tiempo | Composición de nuevos refuerzos | Intervalo orientativo |
|---|---|---|
| Inicio–1:00 | Tres soldados | 14 s |
| 1:00–2:30 | Un ballestero y tres soldados | 12 s |
| 2:30–4:00 | Un ballestero, un cargador y tres soldados | 12 s |
| 4:00–6:00 | Dos ballesteros, dos cargadores y dos soldados | 10 s |

- En los últimos **doce segundos de cada minuto** se suspenden nuevos refuerzos normales. Los enemigos y proyectiles presentes continúan activos; no es una pausa ni una zona invulnerable.
- Máximo **40 enemigos vivos**, con espacio reservado para el élite. La saturación difiere el siguiente intento dos segundos; no conserva una cola creciente de oleadas omitidas ni genera una ráfaga de compensación al despejar.
- Lugares de aparición a partir de 10 m del héroe, dentro de límites, fuera de sólidos, separados de enemigos presentes y con ruta alcanzable. La población normal se anuncia **1,5 s** con anillos y cuerpos tenues; no ataca ni recibe daño durante ese aviso.
- Posiciones reproducibles mediante semilla del dominio. Cada inicio/reinicio desde interfaz obtiene una semilla nueva; diagnóstico en `canvas.dataset.seed`. No se guarda progreso permanente.
- Cuerpos grandes usan navegación con su propio radio. Si el héroe se pega a una pared, pueden aproximarse a una celda segura y visible cercana sin necesitar caber en el centro exacto del jugador.
- Los cadáveres normales salen de simulación después de dos segundos. Identificadores monotónicos, nunca reutilizados en la partida; la representación también libera los modelos retirados.

## Enemigos

Valores iniciales de balance editables en `game/src/content/enemies.ts`; no son cifras aprobadas ni resultados de una prueba humana de dificultad.

| Enemigo | Vida / armadura | Comportamiento |
|---|---|---|
| Soldado reanimado | 54 / 0 | Conserva persecución y espadazo de 12 con preparación de 0,6 s |
| Ballestero hueco | 40 / 0 | Busca distancia aproximada de 7 m, retrocede dentro de 4 m, prepara el disparo 0,9 s y lanza un virote de 10 de daño |
| Devastador | 78 / 0 | Prepara 1,05 s una carga con rumbo fijo, avanza hasta 6,5 m a 10 m/s y causa 18 una sola vez por embestida; luego se recupera |
| Portador del núcleo | 320 / 15 | Élite con barrido de 20 y golpe circular de 22; preparación de 1 / 1,35 s y recuperaciones amplias |
| Castellano Vacío | 1600 / 20 | Jefe con barrido de 24, golpe circular de 28 y andanada de virotes de 14 |

- Siluetas provisionales: ballesta y ropa azulada; cargador con hombros anchos y hoja mayor; élite con armadura/capa; jefe más grande con corona. Sin modelos finales ni nuevas descargas.
- Ballestero: la línea azul y el rumbo del disparo quedan fijados al comenzar la preparación. El virote no persigue al héroe. Se puede esquivar lateralmente o cubrirse tras una pared. Tocar al ballestero no inflige daño por sí solo.
- Cargador: franja ámbar antes de avanzar. No gira durante la carga; se detiene ante un obstáculo. Su colisión recorre el segmento del movimiento para no saltarse al objetivo. Cada carga puede golpear una sola vez.
- Virotes: velocidad 7,5 m/s, radio 0,13 m, vida máxima 3,5 s, máximo 100 activos. Barrido en segmentos pequeños contra paredes y héroe; un virote consumido no repite daño. Los ya disparados pueden continuar aunque muera el tirador.
- Proyectiles y ataques de cuerpo a cuerpo comparten la protección del héroe de 0,35 s. No hay daño de contacto añadido.
- Agua conserva ralentización de 15 % en normales/élite. El élite recibe 40 % del empuje normal; el jefe no recibe empuje y solo 25 % de la intensidad de ralentización, equivalente a 3,75 %. Quemadura continúa funcionando, con la armadura del objetivo aplicada al daño.

## Núcleo real y maestría

- El Portador aparece **hacia 2:30**, una sola vez, anunciado durante tres segundos. Su barra y el objetivo lo identifican.
- Al morir deja **un cristal dorado mayor**, con **ocho esencias y un núcleo**. Hay que recogerlo usando las mismas reglas de alcance y obstáculos; matar no acredita el núcleo automáticamente.
- La recompensa es única por identificador. La retirada de normales, cadáveres eliminados de memoria o repetición de eventos no concede esencia adicional.
- Afinidad III + núcleo continúa abriendo la elección extra de maestría, en cualquier orden de obtención. Núcleo y experiencia se conservan si aún falta el otro requisito.
- Se eliminó el disparador provisional del segundo grupo de 1.8.

## Transición y jefe

- Al alcanzar **6:00**, cesan definitivamente los refuerzos normales. Los normales vivos se retiran con su animación de caída **sin bajas contabilizadas, experiencia ni núcleo**, y se eliminan los proyectiles hostiles residuales.
- Si el Portador sigue vivo, aparece el objetivo de derrotarlo; no se inicia otro enemigo principal a la vez. El reloj sigue contando combate activo durante esta resolución.
- Tras resolver el élite, el Castellano aparece en suelo alcanzable de la misma explanada. **Seis segundos de anuncio**, sin vulnerabilidad ni ataques durante ese aviso. No hay teletransporte ni cierre nuevo de la cámara.
- Patrón: **barrido → golpe al suelo → andanada**, con preparación, impacto y recuperación separados. Arco ámbar, círculo ámbar/rojo y abanico azul muestran la zona correspondiente.
- Golpe al suelo: radio 4 m, preparación 1,6 s. Andanada: preparación 1,2 s y tres virotes con direcciones fijas. Las paredes bloquean ataques y proyectiles.
- A media vida entra en **Furia**: cinco virotes por andanada y periodo de inicio de ataques reducido al 85 %. Las preparaciones siguen siendo las mismas; el HUD muestra la fase.
- **Victoria solo al matar al jefe con el héroe vivo.** Llegar a seis minutos o limpiar una oleada no gana. Si ambos mueren en el mismo paso, se registra derrota y se cancelan recompensas/elecciones pendientes.
- Resultado con bajas reales, oleada alcanzada, duración, nivel, esencia recogida, vida y configuración. Reiniciar crea un estado nuevo y elimina proyectiles, estados, núcleo, maestría, temporizadores, enemigos y efectos, conservando ajustes.

## Interfaz y recursos

- Objetivo persistente y contador hasta la transición, contador de oleadas y bajas sin un total ficticio fijo.
- Barra de vida de élite/jefe, nombre, fase de furia y tipo de ataque. Señales de aparición, virotes visibles y avisos de ataques/proyectiles cercanos fuera de vista.
- Las barras de los enemigos usan su vida máxima propia, y los alcances incorporan el radio físico del objetivo.
- Nuevo material dorado del núcleo, geometría de ballesta/corona/armadura y anticipaciones creadas en código; procedencia añadida a `game/CREDITOS.md`. No se añadieron dependencias, imágenes ni audio.
- La cámara, captura al entrar/continuar, alternativa de mouse sin botones y controles táctiles de 1.8 se conservan.

## Verificación

- **101/101 pruebas correctas.** Diecinueve casos nuevos de campaña, proyectiles, enemigos y navegación; pruebas anteriores de progresión adaptadas al ciclo real, conservando regresiones de combate, cámara, movimiento, elementos, entrada y limpieza.
- Nuevos casos: puntería fijada, esquiva de virotes, ausencia de daño de contacto del tirador, barrido contra pared fina y héroe, vida/cap de proyectiles, pausa, carga fijada/única y bloqueada por muro, recompensa real del élite, resistencias de control, patrón y recuperación del jefe, esquiva del golpe circular, furia, calendario/respiros/cap del director, transición sin recompensas, espera del élite, anuncio invulnerable, victoria/derrota simultánea, limpieza de actores/representación y reproducción por semilla.
- Se mantienen 48 posiciones del mapa verificadas para apariciones normales y recorridos con colisión/cámara. Prueba añadida de aproximación de enemigo grande a un héroe junto a pared.
- **Integración completa sobre mapa real, semilla 19, paso 1/60 s:** Fuego termina a **414,57 s**, 129 bajas, nivel 11, 11 elecciones incluyendo maestría y pico de 10 vivos. Agua termina a **417,25 s**, 129 bajas, nivel 11, 11 elecciones y pico de 9 vivos. Ambas incluyen los cinco tipos de enemigo, recogida del núcleo, maestría, jefe y victoria.
- Esas dos simulaciones usan **vida ampliada únicamente en el test** para aislar reglas y navegación; el juego conserva 100 de vida base. No demuestran que una persona pueda completar esas rutas ni validan balance. Los tiempos son de simulación, no rendimiento de GPU.
- `npm run build` correcto, incluido `tsc --noEmit`: HTML **7,33 kB**, CSS **12,81 kB**, JS **670,16 kB**, gzip estimado JS **177,25 kB**. Persiste la advertencia de paquete JS >500 kB.
- Servidor local HTTP **200**, versión 0.1.9, objetivo y barra de jefe presentes en el HTML. `http://127.0.0.1:5183/`, sin publicación.

## Límites y continuación

El acceso local al navegador figura desactivado en esta sesión; no se eludió ese ajuste. Revisión visual interactiva del nuevo contenido, legibilidad en móvil horizontal, ratón físico, rendimiento GPU y dificultad humana siguen pendientes. Las pruebas de representación construyen/liberan geometría y no sustituyen una observación del juego renderizado.

La siguiente entrega es **1.10 · Pulido y revisión del núcleo**: balance jugado, claridad de amenazas, HUD, audio esencial, controles y rendimiento antes de ampliar las clases.

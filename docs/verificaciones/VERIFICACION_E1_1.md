# E1.1 — Límites, terreno base y llegada sur

11 de noviembre de 2026 · Aplicación 0.2.13.

## Cambio realizado

- Área jugable de **280 × 260 m**: X −138 a 142, Z −20 a 240. Son 10 m adicionales por costado y 20 m al sur respecto de E0; superficie +16,7 %.
- Llegada en **(20, 205)**, orientada hacia la puerta (4, −18), a unos 224 m. Selección, reinicio, cuerpo del jugador, guardia inicial y exploración comparten `game/src/content/expedition.ts`.
- Los cinco soldados iniciales conservan sus distancias relativas al héroe. Cofre (25, 195), suministro (12, 199), monedas (20, 194) y mercader (35, 180), con las variaciones y validaciones de colocación existentes. Presupuesto inicial conservado: 33 objetos en las semillas comprobadas.
- Captura en torno a **(−20, 102)**: ajuste local de 8 m al norte de la propuesta E0, porque (−20, 110) dejaba su círculo superpuesto con recompensas de la abadía y podía impedir colocarla. Mantiene radio, recompensa y reglas actuales.
- Terreno visible dimensionado desde los límites, con 160 m de margen por lado y escala de textura conservada. Suelo caminable plano. Las colinas completas quedan fuera de la superficie jugable; las vallas y extremos de la muralla cubren la extensión. Puerta, torres principales y silueta de la fortaleza conservan su posición.
- El rótulo identifica la llegada. Los quince hitos y caminos previos siguen vigentes; la reorganización completa de seis sectores y circuitos pertenece a E1.2. La integración fina de esas rutas con actividades corresponde a E1.3.

No cambia la cámara de 12 m/rueda 4–18, escala de personajes, velocidad, población máxima de cien, habilidades, economía ni condiciones de victoria. No se incorporan recursos artísticos externos: se reutilizan las geometrías y materiales existentes, con su procedencia ya registrada.

## Verificación automatizada

- 308 pruebas de regresión correctas: combate, clases, habilidades, actividades, expansión, navegación, recursos y laboratorio. Se ejecutaron todos los archivos excepto `world`, `balance`, `arrival` y `exploration`, comprobados por separado según se detalla abajo.
- Dentro de esa regresión: recorrido físico de los quince destinos (tramo más largo de 45,6 s a velocidad base), 342 apariciones seguras para tres tamaños de enemigo y una expedición que captura el puesto y llega caminando al mercader para comprar. El circuito histórico no equivale a las rutas nuevas pendientes de E1.2.
- 10 pruebas de exploración y 3 de llegada correctas. Las de llegada comprueban las tres clases, semillas 1/19/9173, cinco guardias iniciales seguros, quince hitos accesibles, 33 objetos alcanzables, primeras recompensas próximas, captura alejada del inicio, cámara libre y ocho apariciones válidas en seis posiciones (inicio y franjas/bordes nuevos). Rayos verticales comprueban suelo visible bajo esos puntos. Límites de movimiento también comprobados.
- 3 pruebas de curva de experiencia, monedas/suministros y etiquetas de daño correctas. Las arenas pequeñas de pruebas usan ahora una configuración explícita conservada en `tests/support/training-expedition.ts`; no dependen de las coordenadas del escenario real ni cambian sus expectativas para aceptar el traslado.
- 8 pruebas seleccionadas del mundo correctas: geometría, cámara, desplazamiento, persecución, refuerzos y tres campañas completas desde la llegada sur (Guerrero, Mago y Arquero con Fuego). Las tres completaron captura, compra, cuatro habilidades y victoria contra el jefe. Resultado final: **332 pruebas seleccionadas correctas**, sin contar repeticiones de geometría y llegada. [Registro de mundo y campañas](evidencias/e1-1/world.txt).
- TypeScript y compilación de juego y laboratorio correctos. Se mantiene el aviso conocido del paquete de más de 500 kB; no representa una medición de rendimiento.

Las campañas de integración usan vida ampliada únicamente en la prueba para aislar el ciclo de juego. No se presentan como balance de supervivencia humana. Una primera ejecución general se interrumpió para separar las arenas de reglas del inicio real; una selección de pruebas con expresión negativa también se sustituyó por selección positiva explícita. Solo se contabilizan ejecuciones completas correctas.

Resultados conservados: [regresión](evidencias/e1-1/regression.txt), [exploración y llegada](evidencias/e1-1/exploration-arrival.txt), [geometría final](evidencias/e1-1/final-geometry.txt), [economía](evidencias/e1-1/economy.txt) y [compilación](evidencias/e1-1/build.txt).

Para repetir las comprobaciones específicas desde `game`:

```powershell
npm.cmd run build
node --experimental-strip-types --test tests/arrival.test.ts tests/exploration.test.ts
node --experimental-strip-types --test --test-name-pattern 'the actual fortress|walking from every spawn|five-soldier encounter|a pursuer|reinforcements have|actual-map (warrior|mage|archer) run reaches fire four-skill' tests/world.test.ts
node --experimental-strip-types --test --test-name-pattern 'dense XP|eight unique|damage labels' tests/balance.test.ts
```

## Revisión visual y de controles

Chrome local, 1440 × 900. Inicio de Guerrero, Mago Fuego y Arquero, cámara a 12 m sin obstrucción; fortaleza visible al frente. Guerrero recorrió aproximadamente 18,5 m hacia el norte con WASD, derrotó un enemigo y recogió tres monedas. El reinicio restauró (20, 205), vida, nivel y saldo con una semilla nueva. Cambio de clase y regreso al selector correctos. Mago y Arquero ejecutaron ataques automáticos y registraron una baja cada uno durante las observaciones breves. Consola sin errores en la sesión revisada.

Capturas inspeccionadas:

- [Llegada del Guerrero](../../game/output/playwright/e11-arrival.png).
- [Mago en combate](../../game/output/playwright/e11-mage.png).
- [Arquero en combate](../../game/output/playwright/e11-archer.png).
- [Borde suroeste](../../game/output/playwright/e11-southwest.png) y [sureste](../../game/output/playwright/e11-southeast.png), mirando hacia fuera desde la herramienta de auditoría. Suelo continuo, perímetro visible y colinas fuera de la zona caminable. Herramienta con cero fallos de recursos de escena; conserva el 404 conocido de `favicon.ico`.

Esta revisión breve no sustituye partidas completas manuales, teléfono físico ni una comparación de rendimiento bajo carga. E0 sigue siendo la referencia histórica; la comparación homogénea y el recorrido consolidado se completarán en E1.4/E6. No se atribuyen nuevas cifras de FPS a esta entrega.

## Continuación

**E1.2 — Rutas y sectores:** construir el eje sur–fortaleza, circuitos laterales, claros y seis sectores definidos en E0. Ajustar las anclas secundarias conjuntamente con sus construcciones, conservar pasos amplios para hordas y medir los recorridos antes del detalle artístico.

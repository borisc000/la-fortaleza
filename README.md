# La Fortaleza

Juego web de fantasía oscura en 3D (Three.js + TypeScript): un *survivor* en tercera persona con combate automático, hordas y progresión por clases y elementos. Nombre de trabajo; el definitivo está pendiente.

> **Estado** · Aplicación 0.2.15. El selector abre Los dominios exteriores y el [prototipo de El corazón de piedra](docs/diseno/EL_CORAZON_DE_PIEDRA.md). El siguiente trabajo del exterior es E3.3 (vegetación). [Punto de reanudación](ESTADO.md) · [Historial](CHANGELOG.md).

## Ejecutar

Requiere Node.js 22.12 o superior. Desde `game/`:

```powershell
npm ci
npm run dev        # http://127.0.0.1:5183/ (laboratorio de modelos en /model-lab.html)
```

| Orden | Qué hace |
|---|---|
| `npm test` | Suite rápida (unos 30 s) |
| `npm run test:sim` | Partidas completas simuladas (unos 20 min) |
| `npm run lint` / `npm run format` | Comprobar / aplicar formato y lint (Biome) |
| `npm run build` | Typecheck y compilación a `game/dist` |

La CI de GitHub ejecuta lint, typecheck, pruebas rápidas y build en cada push y PR, y las simulaciones en `main`. Controles, arquitectura y límites en [game/README.md](game/README.md); procedencia de recursos en [game/CREDITOS.md](game/CREDITOS.md); reglas para agentes en [game/AGENTS.md](game/AGENTS.md).

## Estructura

| Ruta | Contenido |
|---|---|
| [ESTADO.md](ESTADO.md) | Situación actual y punto de reanudación |
| [PLAN_DESARROLLO.md](PLAN_DESARROLLO.md) | Plan del MVP: 4 fases y 49 subfases, con criterios de cierre |
| [CHANGELOG.md](CHANGELOG.md) | Historial de entregas |
| [docs/diseno/](docs/diseno/) | Diseño por subfase: alcance, clases, habilidades, hordas, escenario, modelos |
| [docs/verificaciones/](docs/verificaciones/) | Registro de verificación de cada entrega y sus evidencias |
| [arte/](arte/) | Conceptos visuales de referencia (no se cargan en el juego) |
| [game/](game/) | Código del juego, pruebas, recursos y fuentes de arte (Blender) |

## Lectura para comenzar

1. [Diseño y alcance del MVP](docs/diseno/DISENO_MVP.md): decisiones del usuario, reglas propuestas y límites.
2. [Plan de desarrollo](PLAN_DESARROLLO.md): trabajo, dependencias y criterios de cierre.
3. [Contrato de la subfase 1.1](docs/diseno/CONTRATO_1_1.md): controles, reglas implementables, arquitectura y objetivos de rendimiento.
4. [Estado y siguiente entrega](ESTADO.md).
5. [Dirección artística 1.2](docs/diseno/DIRECCION_ARTISTICA_1_2.md) y [plan del escenario](docs/diseno/PLAN_DOMINIOS_EXTERIORES.md).
6. [Combate masivo 2.7.1–2.7.6](docs/diseno/COMBATE_MASIVO_2_7.md) y [ritmo 2.7.6](docs/diseno/RITMO_2_7_6.md).

## Decisiones vigentes

- Juego web de fantasía oscura, inspirado en la estructura de un survivor como PokéBonk, con identidad y recursos propios.
- Tres clases iniciales: **Guerrero, Mago y Arquero**. Acorazado queda aplazado, fuera del alcance actual.
- Cuatro elementos iniciales: **Fuego, Agua, Tierra y Aire**.
- Primer escenario: **alrededores de un castillo-fortaleza**, con una posible incursión breve en su interior. El exterior es el centro del mapa.
- La clase conserva su identidad; los elementos modifican sus ataques, habilidades y progresión durante la partida.
- PC primero; celular en horizontal. WASD y ratón para girar una cámara de tercera persona detrás del héroe.
- Ataque básico y todas las habilidades automáticos. En móvil: joystick izquierdo y arrastre derecho para mirar. No hay botón de definitiva.

Las propuestas antiguas de Hielo, Tormenta y Sombra como elementos iniciales quedan sustituidas. El Acorazado (antes llamado «Guardián») queda conservado como idea futura, sin reincorporación automática. No usar documentos o mensajes anteriores para reintroducir esos nombres o elementos como parte del MVP.

Balance humano prolongado, medición de GPU y prueba en teléfono físico siguen pendientes.

## Forma de trabajo

- Desarrollar de forma acumulativa: conservar lo que funciona y añadir una subfase comprobable cada vez.
- Distinguir entre implementado, verificado y revisado por el usuario.
- Al cerrar una entrega: actualizar [ESTADO.md](ESTADO.md), añadir una entrada en [CHANGELOG.md](CHANGELOG.md) y, si corresponde, un registro en [docs/verificaciones/](docs/verificaciones/).
- Commits pequeños y descriptivos; la CI debe quedar en verde.
- Los criterios de cierre describen resultados que hay que demostrar; no son afirmaciones de que ya se cumplan.
- Este plan no exige pedir aprobación por cada tarea técnica. Las decisiones de producto aún abiertas se resuelven en su subfase correspondiente; los cambios materiales de alcance se hacen explícitos.
- Antes de reutilizar código de otros prototipos, revisar sus instrucciones y dependencias. Trabajar en un proyecto independiente, conservando los anteriores.

## Idea narrativa para después

[Campaña por eras y etapas](docs/diseno/IDEA_CAMPANA_ERAS.md), registrada el 2026-11-02: cada era reúne tres a cinco etapas. Era I: establecer el reino recuperando exterior, interior y defendiendo la fortaleza. El escenario actual puede representar su primera etapa. Es una propuesta futura; no añade implementación ni cambia los recuentos del plan.

## Multijugador archivado para después

[Propuesta de multijugador](docs/diseno/PROPUESTA_MULTIJUGADOR.md), archivada el 2026-11-17 con aprobación general del usuario: cooperativo de 2–4 jugadores y VS «Dominio de los Osarios» en mapas propios. En cooperativo, elegir mejoras vuelve al héroe invencible durante un tiempo máximo. No cambia el alcance del MVP ni los recuentos del plan.

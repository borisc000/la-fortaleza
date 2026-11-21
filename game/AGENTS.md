# Fortaleza — reglas de desarrollo

- Fuente vigente (carpeta superior): ESTADO.md, PLAN_DESARROLLO.md y CHANGELOG.md; diseño en docs/diseno/ (HABILIDADES_2_7_1.md, BASE_HABILIDADES_2_7_3A.md); verificaciones y evidencias en docs/verificaciones/.
- Español, PC primero, tercera persona, WASD, ratón sin arrastrar, rueda y combate automático. R manual pendiente; Acorazado aplazado.
- Juego 0.2.15, mapa 280 × 260 m, cámara 12 m/rueda 4–18. 2.7.4 integrada: las tres clases con ocho habilidades, cuatro espacios y básico aparte hasta nivel 10; siguiente 2.8. Leer docs/diseno/MAGO_ARQUERO_2_7_4.md. No ofrecer habilidades sin ejecutor ni duplicar técnicas antiguas y ramas nuevas.
- Plan 49 subfases, 22 futuras; fase 2 en 14/16 (13 implementaciones + 1 definición). 2.7.5 integrada: objetivos 20/40/60/90, máximo provisional 100 vivos. Leer docs/diseno/HORDAS_2_7_5.md y docs/verificaciones/VERIFICACION_2_7_5.md. Revisión visual inicial PC de 0.2.12 realizada; registrar efectos, balance/GPU y móvil pendientes sin bloquear avance autorizado.
- No presentar la figura de escala provisional como el Guerrero final ni el entorno modular inicial como acabado final del concepto.
- Separar reglas, contenido, representación, entrada y coordinación. No simular daño en el renderizado.
- Versiones exactas y lockfile. No actualizar dependencias globales.
- Ejecutar typecheck, pruebas relevantes y build tras cambios; revisar visualmente la escena y cámara en navegador.
- Documentar procedencia de recursos; no afirmar prueba física móvil a partir de redimensionar navegador.
- Actualizar el estado, el CHANGELOG y el registro de verificación de cada entrega.

- 2.7.6 integrada: leer docs/diseno/RITMO_2_7_6.md y docs/verificaciones/VERIFICACION_2_7_6.md. Balance inicial, no declarar todas las configuraciones equilibradas.

- Laboratorio independiente `/model-lab.html`; catálogo en src/model-catalog.ts. Reutilizar las fábricas del juego al añadir modelos. Leer docs/diseno/LABORATORIO_MODELOS.md. Vite debe compilar ambas entradas. No altera el orden de fases.

- Mago GLB: leer docs/diseno/MAGO_MALLA.md. Precargar loadMageAsset antes de usar la fábrica en el navegador. Conservar approved-mage.ts y previous-mage.ts. Cambios del recurso se hacen en art/mage-slim.blend o art/build_mage.py y se exportan al GLB; verificar skinning real, no solo reglas del kit.

- Escenario: E0, E1, E2, E3.1 y E3.2 completadas; sigue E3.3 (vegetación) antes de 2.8. Leer docs/diseno/PLAN_DOMINIOS_EXTERIORES.md, docs/diseno/ACABADO_EXTERIOR_E2.md y docs/verificaciones/VERIFICACION_E2_1.md a VERIFICACION_E3_2.md. El claro es plano (y = 0); fuera de las vallas, rise() de world.ts levanta taludes y colinas (expuesto como world.terrainHeight). La cámara no choca con el terreno: las cajas del set cameraOnly la frenan en los taludes y nunca entran en movementSolids; cualquier relieve nuevo junto al claro necesita lo mismo. Los afloramientos (world.outcrops) usan su propia serie aleatoria y guardan 9 m a rutas y claros y 5 m a otros sólidos. El suelo gastado cubre todo el mapa; el carácter de cada sector (humedad, musgo, luz, roderas) está en SECTOR_SURFACES de src/content/terrain-layout.ts y se calcula por vértice en wearGround. La puerta y los restos del asedio se construyen en src/rendering/exterior-pieces.ts (mismas piezas para el mundo y el laboratorio; GATE tiene las medidas); world.ts los coloca. El desgaste (weather) y el suelo gastado (wearGround) están en src/rendering/weathering.ts: el ruido por píxel va tras condiciones que lo hagan visible y todo efecto nuevo se mide como en E2.4. Las cintas de camino llevan un atributo `edge`. Las colisiones de objetos bajos no superan 0,7 m para que la cámara pase por encima. Conservar libres el pie de la muralla, el camino, la ronda, la explanada y el primer encuentro (pruebas E2.1 y E2.3 de tests/world.test.ts). Auditoría de la zona: audits/e24-gate-zone.ts. Rutas y sectores en src/content/terrain-layout.ts; llegada y primeras actividades en src/content/expedition.ts.

## Repositorio, pruebas y estilo

- Git en la carpeta superior (repo privado borisc000/la-fortaleza). Commits pequeños y descriptivos en español. Los binarios de arte (.blend, .png, GLB de art/) van por Git LFS; game/public queda en git normal.
- `npm test`: suite rápida (~30 s). `npm run test:sim`: partidas completas simuladas en tests/simulation/ (~20 min); ejecutarla al tocar combate, progresión, director o mapa.
- `npm run lint` (Biome) debe pasar; `npm run format` formatea y aplica correcciones seguras. La CI de GitHub ejecuta lint, typecheck, pruebas y build en cada push.
- Interfaz DOM en src/ui/ (HUD, menús, tienda, resultados, ajustes); main.ts solo coordina. Los módulos de ui leen la partida mediante UiContext y no deciden reglas.

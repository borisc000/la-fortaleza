# Fortaleza — reglas de desarrollo

- Fuente vigente: ESTADO.md, PLAN_DESARROLLO.md, HABILIDADES_2_7_1.md y BASE_HABILIDADES_2_7_3A.md en carpeta superior.
- Español, PC primero, tercera persona, WASD, ratón sin arrastrar, rueda y combate automático. R manual pendiente; Acorazado aplazado.
- Juego 0.2.15, mapa 280 × 260 m, cámara 12 m/rueda 4–18. 2.7.4 integrada: las tres clases con ocho habilidades, cuatro espacios y básico aparte hasta nivel 10; siguiente 2.8. Leer MAGO_ARQUERO_2_7_4.md. No ofrecer habilidades sin ejecutor ni duplicar técnicas antiguas y ramas nuevas.
- Plan 49 subfases, 22 futuras; fase 2 en 14/16 (13 implementaciones + 1 definición). 2.7.5 integrada: objetivos 20/40/60/90, máximo provisional 100 vivos. Leer HORDAS_2_7_5.md y VERIFICACION_2_7_5.md. Revisión visual inicial PC de 0.2.12 realizada; registrar efectos, balance/GPU y móvil pendientes sin bloquear avance autorizado.
- No presentar la figura de escala provisional como el Guerrero final ni el entorno modular inicial como acabado final del concepto.
- Separar reglas, contenido, representación, entrada y coordinación. No simular daño en el renderizado.
- Versiones exactas y lockfile. No actualizar dependencias globales.
- Ejecutar typecheck, pruebas relevantes y build tras cambios; revisar visualmente la escena y cámara en navegador.
- Documentar procedencia de recursos; no afirmar prueba física móvil a partir de redimensionar navegador.
- Actualizar el estado y registro de verificación de cada entrega.

- 2.7.6 integrada: leer RITMO_2_7_6.md y VERIFICACION_2_7_6.md. Balance inicial, no declarar todas las configuraciones equilibradas.

- Laboratorio independiente `/model-lab.html`; catálogo en src/model-catalog.ts. Reutilizar las fábricas del juego al añadir modelos. Leer LABORATORIO_MODELOS.md. Vite debe compilar ambas entradas. No altera el orden de fases.

- Mago GLB: leer MAGO_MALLA.md. Precargar loadMageAsset antes de usar la fábrica en el navegador. Conservar approved-mage.ts y previous-mage.ts. Cambios del recurso se hacen en art/mage-slim.blend o art/build_mage.py y se exportan al GLB; verificar skinning real, no solo reglas del kit.

- Escenario: E0 y E1 completadas. Sigue E2.1 (puerta y dos torres) antes de 2.8. Leer PLAN_DOMINIOS_EXTERIORES.md y VERIFICACION_E1_4.md. Rutas y sectores en src/content/terrain-layout.ts; conservar pasos y claros libres. Llegada y primeras actividades centralizadas en src/content/expedition.ts; conservar coherencia de inicio/reinicio y guardias.

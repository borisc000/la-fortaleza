# Verificación 2.7.4

Fecha: 2026-11-03. Aplicación 0.2.10.

## Comprobaciones automáticas

- 274/274 pruebas fuera de world.test.ts correctas en la ejecución final, incluidas 27 del nuevo arsenal. Registro: work/tests-2-7-4-unit-final.log.
- Tipado y compilación de producción correctos: work/build-2-7-4-final.log. 80 módulos, JavaScript 812,60 kB (221,34 kB gzip). Vite avisa del tamaño del bloque; no es un error de compilación ni una medición de rendimiento.
- Dos campañas seleccionadas sobre el mapa real correctas: Mago/Fuego y Arquero/Fuego, captura, compra, cuatro habilidades, cuatro reliquias, maestría y victoria contra el jefe. Registro: work/tests-2-7-4-campaign.log. No se ejecutó toda la matriz de campañas en esta entrega.
- Campañas con vida ampliada para verificar el ciclo completo: no acreditan balance. Encuentros pequeños con vida normal cubren ambas clases y los cuatro elementos.
- Pruebas del repertorio: progresión, ramas/hitos, límites, daño/protección, paredes, básico concurrente, cancelación, ecos sin cargas, Precisión, retorno, marcas, ralentización separada y liberación del renderizador. No equivalen a explorar todas las combinaciones posibles.

## Revisión visual

Revisión inicial en navegador durante la implementación: combate inicial de ambas clases, habilidad inicial y básico simultáneos, catálogos, elección elemental del Arquero y compra de Celeridad del Mago. Captura disponible: work/arquero-2-7-4.png. Al retomar el cierre, el navegador anterior dejó de estar disponible para la herramienta; no se afirma una segunda revisión visual final.

Pendientes: inspección visual de todas las mutaciones y combinaciones, balance humano prolongado, métricas CPU/GPU con hordas, teléfono físico y definitiva R. Los efectos son procedurales provisionales. Siguiente subfase 2.7.5.

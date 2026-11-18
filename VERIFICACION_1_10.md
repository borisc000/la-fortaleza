# Verificación 1.10 — Pulido inicial del núcleo

Fecha: **2026-10-31** · Aplicación **0.1.16**.

## Cambios aplicados

- **Audio esencial:** sonidos procedurales de impacto, daño, Torbellino, monedas, curación, elección, compra, captura, élite/jefe, vida baja y resultado. Volumen inicial 25 %, ajuste 0–100 % y silencio. No se crea AudioContext antes de una acción del usuario; fallar la activación no detiene el juego. Límite de ocho voces y separación mínima por sonido. Pausa, pérdida de foco, menús, reinicio y cierre cancelan voces pendientes; los menús solo reproducen sus propias confirmaciones. Ajustes conservados entre reinicios, no entre recargas de página.
- **HUD:** pantalla inicial dividida en cuatro instrucciones; todos los paneles tienen altura máxima y desplazamiento. Distribución compacta en horizontal con poca altura: vida, experiencia, afinidad y habilidades permanecen; instrucciones repetidas, detalles secundarios y destinos adicionales se ocultan. El progreso de captura deja de ocupar espacio al alejarse más de 16 m del puesto. El destino superior apunta al puesto mientras se disputa si no hay un núcleo o enemigo principal prioritario.
- **Peligro:** aviso de vida baja al 30 %, sin destellos adicionales. Las amenazas desplazan al objetivo y a la recompensa temporal para evitar avisos superpuestos. Un proyectil fuera de vista debe pasar cerca del héroe en los siguientes 1,25 s y tener trayectoria libre; disparos que se alejan, fallan de lado o encuentran un muro no generan ese aviso.
- **Ritmo de captura:** corregido un error por el que la petición de tres refuerzos sustituía una oleada avanzada de seis. Se toma la mayor petición, sin sumarlas, manteniendo el director, los avisos, la cadencia y el máximo global de 40. La transición final se resuelve antes de abrir la tienda, incluso si se pulsa E exactamente a 6:00.
- **Pausa y trabajo de interfaz:** abrir Ajustes pausa la partida; Continuar cierra el panel. Se limpian avisos de peligro y muestras de tiempos al pausar. HUD y atributos de diagnóstico se actualizan a 10 Hz, sin reducir los 60 pasos/s de simulación ni la frecuencia de render/cámara. Referencias DOM y vector de cámara reutilizados. Esto reduce operaciones por fotograma; no constituye una medición de FPS.

## Economía revisada

Se conservan los precios: curación 8 × 2, daño 18, vitalidad 18 y velocidad 16. Comprar todo cuesta **68 monedas**, siempre que las ofertas sean útiles y no se hayan alcanzado los rangos máximos. La captura de 25 monedas permite una mejora, y un cofre de 8–14 más la captura permite añadir una curación. Los precios no se cambian sin evidencia jugando.

Ocho cofres aportan 64–112 monedas y siete grupos iniciales aportan 21; las bajas normales y captura añaden más. Por tanto, puede sobrar moneda si se explora mucho: el catálogo provisional es pequeño y no pretende absorber todos los ingresos. No se introduce inflación artificial ni recompensas permanentes. Catálogo y economía definitiva se amplían en 2.8 y 3.6–3.7.

## Comprobaciones realizadas

- Batería completa `npm test`: **137/137 pruebas correctas**, ninguna omitida; duración aproximada 197 s. Cuatro campañas sobre la geometría real alcanzaron maestría y victoria: Fuego/Agua por ruta de combate y Fuego/Agua pasando primero por captura y compra. Las rutas de combate no compran; las rutas opcionales aseguran el puesto y gastan 18 monedas en vitalidad.
- TypeScript y compilación correctos. HTML 9,27 kB; CSS 19,74 kB; JavaScript 698,81 kB (186,50 kB gzip). Persiste el aviso conocido de paquete JS mayor de 500 kB.
- Pruebas focalizadas iniciales: 18/18 correctas, incluyendo las once de actividades y siete nuevas de pulido.
- Audio comprobado mediante contexto simulado: activación diferida, rechazo no fatal, pausa, silenciamiento, límite de voces, repetición de golpes, volumen, reinicio y liberación. No equivale a escucha real ni a verificar políticas de audio de cada navegador.
- Avisos de proyectiles comprobados con trayectorias cercanas, lejanas, salientes, laterales y bloqueadas por muro. Cadencia de HUD comprobada durante 600 fotogramas; menús actualizan inmediatamente.
- Captura avanzada y apertura del mercader exactamente a 6:00 cubiertas por regresiones específicas.
- Servidor local con **HTTP 200**, versión 0.1.16 y controles de sonido/volumen presentes. Ocho documentos sin enlaces locales rotos; 91 IDs HTML únicos y referencias DOM correctas. Package y lockfile coinciden. No se ha publicado.

## Revisión manual pendiente

Se consultó de nuevo la herramienta de navegador y respondió **“Local browser use is disabled in Work settings”**. No se elude el ajuste. La implementación del pulido está disponible; el cierre de su revisión manual no se declara realizado.

- [ ] PC: legibilidad del HUD/menús a 1366 × 768 y 1920 × 1080, en combate y junto a obstáculos.
- [ ] Horizontal compacto: sin solapes a 844 × 390; comprobar después en un teléfono físico.
- [ ] Escuchar mezcla, volumen y timbre; entrar, silenciar, pausar, comprar, cambiar de pestaña y reiniciar sin sonido residual.
- [ ] Jugar Fuego y Agua con 100 de vida inicial, explorando y omitiendo objetivos; anotar causa de muerte, tiempo hasta maestría y percepción de presión.
- [ ] Medir FPS/p95 y coste gráfico en los equipos previstos, con hordas y efectos. Los ensayos de dominio no validan GPU.

Estos pendientes no se transforman en resultados supuestos. Las simulaciones de campaña usan vida ampliada para verificar el ciclo completo, no para afirmar equilibrio o diversión. Los modelos siguen siendo provisionales.

## Continuación

Siguiente contenido: **2.1 — Estructura compartida de clases**. Guerrero debe conservar su comportamiento antes de incorporar Mago en 2.2. Quedan 30 subfases de implementación futuras; la revisión manual de 1.10 permanece en este registro.

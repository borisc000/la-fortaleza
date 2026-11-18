# 2.7.5 — Hordas densas y rendimiento inicial

2026-11-03 · aplicación 0.2.11.

## Comportamiento

| Desde | Objetivo local | Grupo máximo | Intervalo programado |
|---|---:|---:|---:|
| Inicio | 20 | 6 | 4 s |
| 1:00 | 40 | 9 | 3,5 s |
| 2:30 | 60 | 12 | 3 s |
| 4:00 | 90 | 15 | 2,5 s |

Primer refuerzo desde 3 s. Reposición local revisada cada segundo, con al menos 2,5 s entre reposiciones; no se genera una oleada por fotograma. Los objetivos son límites de población cercana, no promesas de mantener una cifra mientras el jugador mata enemigos. Máximo global provisional: 100 vivos, con reserva para el élite. Cada captura comparte presupuesto y director. Respiro: últimos cuatro segundos de cada minuto, excepto captura activa.

La mayoría son **despojos reanimados**: variante del perseguidor con 18 de vida, daño 6 y velocidad 2 m/s, mismo radio físico de 0,36 m. Caen con un espadazo básico. Soldados resistentes se intercalan aproximadamente cada ocho incorporaciones; ballesteros limitados al 8 % y cargadores al 6 % del objetivo local, según tramo. Conservan los cinco comportamientos existentes: no se agrega una nueva IA.

Aparición a 11–23 m, aviso de 1,5 s, puntos alcanzables y libres de obstáculos; prioridad fuera de pantalla. Cada grupo deja un sector angular de 45 grados sin nuevas apariciones. Esto ayuda a abrir rutas, pero no garantiza que enemigos anteriores no ocupen ese sector. Separación suave y velocidad inferior a la del héroe; no se convierten en una barrera rígida. Retirada lejana sin recompensas; muertes, esencia y monedas únicas. Economía y frecuencia de elecciones se balancean en 2.7.6.

## Optimización

- Índice espacial mutable para consultar vecinos durante la separación; conserva comprobación exacta de distancia y orden por identificador. Se actualiza al mover cada cuerpo.
- Selección de posiciones por búsqueda del mejor candidato, evitando ordenar repetidamente toda la lista.
- Despojos con geometría y materiales compartidos mediante instancias: hasta tres llamadas para cuerpos, avisos de ataque y apariciones. Sin sombras individuales de estos cuerpos; reciben sombras del entorno. Los enemigos resistentes conservan sus modelos y avisos existentes.
- Silueta ósea provisional, estados de fuego/agua y heridas mediante color. Los despojos muertos dejan de dibujarse inmediatamente; su registro se elimina después según el límite de cadáveres existente.
- Diagnóstico del juego muestra población viva y objetivo local. Se usa PCFShadowMap, eliminando el aviso por la opción obsoleta que ya tenía el mismo reemplazo en ejecución.

## Laboratorio reproducible

Con `npm run dev`, abrir `/horde-lab.html`. Selector 20/60/100, mapa y recursos reales, 600 fotogramas con 60 de calentamiento; informa intervalos de fotograma, CPU de simulación y llamadas de dibujo. Entrada exclusiva de desarrollo, separada de la expedición, sin recompensas ni ataques del héroe. No representa cuatro habilidades simultáneas, mezcla de élites o balance humano; no dispone de temporizador GPU.

Ver VERIFICACION_2_7_5.md. Siguiente: **2.7.6 — ritmo y claridad del combate masivo**, experiencia, elecciones, economía, daño y legibilidad con configuraciones reales.

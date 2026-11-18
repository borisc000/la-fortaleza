# Subfase 2.5 — Afinidades de las tres clases

Fecha: 2026-11-01 · Aplicación 0.2.5.

Implementación de las cuatro combinaciones que faltaban: Mago/Tierra, Mago/Aire, Arquero/Tierra y Arquero/Aire. Las tres clases ofrecen ahora los cuatro elementos, doce combinaciones. El Mago elige antes de entrar; Guerrero y Arquero eligen al nivel 2. Acorazado sigue aplazado.

Los valores siguientes son decisiones de implementación para probar, no cifras aprobadas ni balance humano validado. No se modifican mapa, cámara, controles o duración de expedición.

## Tierra

Todos los ataques de Tierra aplican Quebranto durante tres segundos. Aumenta un 15 % el daño posterior; el golpe que lo inicia no recibe su propia bonificación. Se renueva la duración sin acumular intensidad. No ralentiza ni aturde.

### Mago — roca y protección

- Proyectil pétreo de 12 m/s, radio de colisión 0,24 m y alcance de adquisición de 10 m. Se detiene ante obstáculos. Daño elemental base 24, +10/20 % en rangos II/III.
- Conserva Acumulación arcana: cada cuarto lanzamiento gana +60 % de daño y explosión de radio 1,7 m, con impacto único por enemigo.
- El cuarto lanzamiento crea una coraza de 12/16/20 puntos según rango, hasta cuatro segundos. Recarga de seis segundos desde su creación; no se suma ni se renueva antes. Se obtiene al lanzar, incluso si el proyectil falla.
- La coraza absorbe daño ya mitigado, puede agotarse y deja pasar el excedente. No cura. Se congela con la simulación y se limpia al terminar o reiniciar.
- Cataclismo permanece en el punto anunciado: tres pulsos de 18 de daño base, radio 3,2 m. **Falla tectónica** duplica solamente el último pulso. Rango y multiplicador se fijan al iniciar la acción.

### Arquero — pedernal y ruptura de armadura

- Flechas y lluvia ignoran el 15/25/35 % de la armadura del blanco, según rango. La proporción elemental conserva 30/40/50 %; ambos componentes usan la armadura efectiva. La penetración no se aplica a daños posteriores ajenos a esos ataques.
- Conserva velocidad de flecha 24 m/s, alcance 12 m y Precisión: una acumulación por flecha acertada, aunque atraviese varios blancos.
- **Lluvia de pedernal** hace que las cuatro descargas ignoren un 75 % de armadura y que únicamente la última duplique su daño base de 14 a 28. El básico conserva su penetración normal.

## Aire

Aire no aplica Empapado ni quemadura. Se distingue de Agua por trayectoria rápida, mayor alcance, atracción y penetración; su representación usa arcos de viento y flechas con plumas alargadas.

### Mago — alcance y vórtice

- Proyectiles de 22 m/s; alcance 11/11,5/12 m según rango. Daño elemental base 24 y +10/20 % en rangos II/III.
- Los impactos de proyectil empujan 0,2/0,3/0,4 m desde la posición previa del proyectil. El cuarto conserva daño potenciado y área.
- Cataclismo atrae 0,3/0,4/0,5 m por pulso hacia su centro fijo, con tres pulsos. No sigue al personaje.
- **Vórtice creciente** aumenta un 30 % el radio, hasta 4,16 m, y un 50 % la atracción.
- Protección de 0,35 s entre desplazamientos; normales reciben el efecto completo, élite un 40 % y jefe ninguno. El movimiento respeta límites y sólidos, evita cruzar el centro y al héroe, y no cancela ataques preparados.

### Arquero — velocidad y blancos alineados

- Flechas de 30/33/36 m/s y alcance 14/15/16 m según rango.
- Una penetración adicional desde el primer rango: con 0/1/2/3 acumulaciones de Precisión atraviesan hasta 2/2/3/4 blancos alineados.
- **Cazador del vendaval** añade otro blanco: 3/3/4/5 según Precisión. También amplía un 25 % el radio de lluvia, hasta 4,375 m, conservando cuatro descargas.
- No selecciona blancos secundarios fuera de trayectoria. Las paredes detienen la flecha y fallar sigue rompiendo Precisión. Una flecha que acierta varios blancos aporta una sola acumulación.

## Integración y límites

Selector del Mago con cuatro opciones y elecciones de nivel por clase; mejoras y maestrías usan sus descripciones. HUD muestra alcance vigente, penetración del Arquero de Aire y coraza o penetración de armadura según clase. Rocas, viento, puntas de pedernal y plumaje de Aire usan geometrías procedurales propias; no se añadieron recursos externos. Los sonidos reutilizan señales de piedra/viento y los sonidos existentes del arma.

Daño, armadura, estados, colisiones y recompensas se resuelven en el dominio. El render solo consume estados/eventos. Se conservan topes de proyectiles, avisos de aparición, pausa, muerte única, monedas, núcleo, captura y tienda. El vórtice del Mago se dibuja en su zona fija; el Torbellino del Guerrero permanece unido al personaje.

Las doce combinaciones tienen una primera maestría. **2.8 sigue pendiente** para revisar el catálogo con las técnicas de 2.6 y la doble afinidad de 2.7, completar presentación y probar sus interacciones. No se implementan aquí técnicas equipables ni un segundo elemento.

Ver [verificación](../verificaciones/VERIFICACION_2_5.md). Próxima subfase: **2.6 · Técnicas y espacios de configuración**.

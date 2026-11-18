# Subfase 1.2 — Dirección artística

Fecha: **2026-10-31** · Estado: **definición artística completada; dirección general aceptada; implementación por verificar**.

## Decisiones expresas del usuario

El usuario observó que las tres propuestas se parecían y respondió: «Se ven como iguales... Pero está bien asi». Se registra aceptación del estilo común, no una elección expresa de un número. Como decisión de trabajo del asistente, se adopta la **Explanada del bastión (imagen 3)** por su superficie abierta para hordas; las otras imágenes quedan como referencias secundarias.

- **Estilo:** semirrealista, proporciones naturales, armaduras y piedra creíbles.
- **Atmósfera:** medieval sombría pero legible; cielo nublado, piedra húmeda, vegetación y antorchas.
- **Guerrero:** luchador con armadura media de cuero, cota de malla y algunas placas. Se diferencia del Acorazado pesado con escudo.
- **Primeros enemigos:** no muertos medievales; esqueletos y soldados reanimados con equipo deteriorado.

Se conservan las decisiones de [CONTRATO_1_1.md](CONTRATO_1_1.md): tercera persona detrás del héroe, PC primero, cámara con ratón y combate automático. No usar una vista cenital o isométrica para aprobar la referencia.

## Brief de las alternativas

- Tres imágenes independientes, en horizontal 16:9, como conceptos de una vista de juego.
- Guerrero visible de cuerpo entero desde atrás, con espacio para leer suelo, enemigos y murallas.
- Mismo estilo, personaje y familia de enemigos; variar arquitectura, recorrido y composición de la zona exterior.
- Plano transitable amplio con obstáculos reconocibles. La fortaleza domina el horizonte sin ocupar todo el espacio de combate.
- Fuego localizado en el arma y enemigos repartidos con separación suficiente para ver sus siluetas.
- Los conceptos no son capturas de un juego implementado, modelos 3D ni pruebas de rendimiento. La fidelidad alcanzable se verifica durante la implementación.

## Reglas artísticas propuestas

### Guerrero

Proporciones humanas, hombros y arma reconocibles desde atrás. Cuero marrón oscuro, malla visible y placas de acero gastado en hombros, antebrazos y espinillas. Evitar silueta de tanque, escudo grande, adornos excesivos y armas desproporcionadas. Referencia operativa: espada de mano y media, faldones cortos que dejan leer las piernas y cabeza descubierta como en imagen 3. El cabello y rostro concretos no constituyen un sistema de personalización prometido.

### No muertos

El perseguidor inicial será un soldado esquelético con casco sencillo y restos de una librea apagada, tomando como referencia las figuras cercanas de imagen 3. Cráneo y parte de costillas visibles, hombros más estrechos y postura encorvada; altura próxima a la del héroe, espada de una mano corroída y sin escudo en la primera variante. Malla incompleta, cuero roto, tela parda y hueso marfil desaturado. Evitar ojos brillantes tan intensos que compitan con ataques elementales.

La amenaza se comunica por postura, arma, preparación del ataque y sonido: caminar arrastrado legible, elevar brazo antes del golpe y recuperación visible. Se necesitan reposo, desplazamiento, preparación/ataque, reacción y muerte; estas animaciones todavía no están producidas. No se requiere gore explícito. El héroe tiene postura erguida y equipo mejor conservado. Las variantes posteriores reutilizan una familia de materiales, pero distinguen armas y siluetas.

### Fortaleza y terreno

Piedra gris húmeda, juntas y desgaste concentrados en superficies cercanas; hierro oscurecido, madera y vegetación irregular. Senderos legibles y claros para combate. Materiales con rugosidad, evitando que todo parezca plástico brillante. No mostrar varias plantas transitables o un interior extenso como promesa de alcance.

### Iluminación y color

Luz nublada difusa con contraste suficiente entre suelo, personaje y enemigos. Antorchas cálidas como acentos, sin depender de ellas para ver el campo de juego. Niebla suave principalmente en profundidad; no cubrir avisos o enemigos cercanos. El semirrealismo se apoya en materiales y proporciones, no en exigir una densidad extrema de geometría o efectos.

### Elementos

- **Fuego:** naranja/ámbar, núcleo luminoso pequeño, brasas breves y dirección de movimiento reconocible.
- **Agua:** azul verdoso, cuerpo de agua visible, espuma y gotas; no copiar hielo ni usar nubes de partículas indistinguibles del viento.
- **Tierra, para fase 2:** fragmentos de roca y polvo breve; distinguir las rocas ofensivas del suelo.
- **Aire, para fase 2:** trazos pálidos, deformación y movimiento de hojas/polvo; sin rayos eléctricos como identidad principal.

Fuego se referencia en imagen 3; Agua en [04-explanada-agua.png](arte/04-explanada-agua.png). Inspección estática: la segunda conserva el encuadre, el Guerrero, los enemigos y el ambiente; reemplaza el fuego del arma por líquido azulado y gotas, conservando las antorchas cálidas. El brillo del borde resulta intenso: al implementar, priorizar volumen líquido y espuma sobre trazos finos para que no se lea como electricidad. La legibilidad en movimiento y en pantalla pequeña sigue pendiente de prueba real.

### Paleta de trabajo y encuadre

Colores orientativos elegidos para implementación, no muestreados exactamente del concepto: piedra `#626760`, hierro `#626A70`, cuero `#49382C`, tela `#30312F`, vegetación `#535B38`, hueso `#BDB39A`, fuego `#F99532`, agua `#398C9C` y espuma `#D8EBE7`. Ajustar bajo la iluminación real.

Mantener el héroe completo y un corredor visual hacia delante. Como objetivo inicial de implementación, probar altura de héroe entre 25–35 % del encuadre, más pequeño que en la imagen conceptual, para ver amenazas y suelo. Conservar la tercera persona y los parámetros iniciales de 1.1 como punto de partida, ajustando distancia antes de alterar drásticamente el campo de visión. Fondos y torreones lejanos son ambientación; no requieren toda la geometría ni accesibilidad insinuada en el concepto.

## Recursos para implementación

| Recurso | Disponible ahora | Pendiente |
|---|---|---|
| Conceptos del entorno y personajes | Tres PNG y prompts | Convertir dirección en escena real |
| Muestra de Agua | PNG editado y prompt | Efecto animado con límites de rendimiento |
| Guerrero y soldado esquelético | Especificación y referencia en escena | Modelos, materiales, rig y animaciones |
| Fortaleza y ruinas | Referencia de composición | Kit modular 3D y colisiones |
| Suelo, vegetación y cielo | Dirección y paleta | Recursos con procedencia revisada e integración |

No se han adquirido ni verificado modelos 3D de terceros. En 1.3 se comprueba la base gráfica y el espacio; el parecido completo se construye acumulativamente con los recursos necesarios.

- Personajes y entorno requieren modelos 3D, materiales y animaciones; una imagen generada es una referencia visual, no los sustituye.
- Priorizar un conjunto artístico coherente y recursos de procedencia documentada. No dar por comprados, licenciados o disponibles modelos aún no revisados.
- Reutilizar piezas modulares de muralla, torre, puerta y ruinas. Reducir detalle en objetos lejanos.
- Registrar por recurso su origen, condiciones de uso, animaciones, dimensiones y presupuesto técnico antes de integrarlo.
- Usar Fuego y Agua para comprobar contraste sobre el mismo terreno e iluminación.

## Criterios de cierre

1. Una dirección visual aceptada por el usuario. Cumplido para el estilo común; imagen 3 adoptada como referencia operativa por el asistente, sin atribuir esa selección numérica al usuario.
2. Referencia guardada en el proyecto y vinculada a su prompt.
3. Guerrero, enemigo inicial, materiales y paleta definidos de forma consistente.
4. Muestras de Fuego y Agua diferenciables y legibles desde tercera persona.
5. Recursos existentes y recursos por producir separados, sin prometer fidelidad todavía no probada.
6. ESTADO.md actualizado, sin confundir elección de imagen con una implementación verificada.

## Registro de generación

Se utilizó la herramienta integrada de generación de imágenes. Se generaron tres conceptos independientes y se inspeccionaron visualmente. Los prompts exactos están en [PROMPTS_ARTE_1_2.md](PROMPTS_ARTE_1_2.md). La imagen 3 se usa como referencia operativa tras la aceptación del estilo común.

Orden real en que aparecieron en el chat:

| Opción visible | Dirección | Archivo |
|---|---|---|
| 1 | Puerta de hierro | [01-puerta-de-hierro.png](arte/01-puerta-de-hierro.png) |
| 2 | Muralla entre árboles | [02-muralla-entre-arboles.png](arte/02-muralla-entre-arboles.png) |
| 3 | Explanada del bastión | [03-explanada-del-bastion.png](arte/03-explanada-del-bastion.png) |

Las tres propuestas mantienen tercera persona, armadura media, cielo nublado y no muertos medievales. Los resultados representan un acabado artístico aspiracional. El tamaño del héroe en cuadro es mayor que la proporción solicitada en los prompts; distancia/FOV se ajustarán con la dirección elegida, sin presentar estas imágenes como mediciones exactas de cámara. La complejidad de vegetación, geometría distante y reflejos se adaptará al presupuesto real del juego.

La edición complementaria de Agua falló primero por revocación del permiso de red. Al volver a estar disponible la herramienta integrada, se repitió y se obtuvo [04-explanada-agua.png](arte/04-explanada-agua.png), conservada en el proyecto. No se utilizó otro servicio.

Se cierra el entregable de definición de 1.2: estilo aceptado, referencia operativa, muestras elementales, especificación de enemigo, paleta y recursos por producir. La muestra adicional no tiene todavía valoración expresa del usuario; no se atribuye aprobación específica. No se ha iniciado 1.3 ni verificado arte dentro de un juego. Siguiente subfase: base web, escena y cámara.

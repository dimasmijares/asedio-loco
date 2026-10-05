---
id: FEAT-INTERFAZ-001
type: spec
layer: feature
status: active
confidence: medium
version: 1.25.0
created: 2026-09-26
updated: 2026-10-05
owner: dimas
dependencies:
  - id: PROD-JUGAR-001
    relation: implements
  - id: DOM-JUEGO-001
    relation: uses-data-from
  - id: ARCH-005
    relation: constrained-by
  - id: FEAT-CONTROL-001
    relation: uses-data-from
supersedes: null
tags:
  - interfaz
  - hud
  - accesibilidad
  - tutorial
  - ajustes
---

# FEAT-INTERFAZ-001 — HUD, portada, tutorial y ajustes

## Intent

Quien llega por un enlace tiene que entender el juego en segundos y, en partida, ver de un vistazo el tiempo, su munición y cómo van los castillos. Esta especificación fija la interfaz en DOM (sin frameworks) que rodea al 3D.

## Definition

### Purpose

Portada, «Cómo se juega», tutorial de la primera partida, HUD de la partida y ajustes guardados en el navegador.

### Inputs

| Input | Type | Required | Notes |
|---|---|---|---|
| `MatchState` | Estado | Sí | Fase, tiempo, jugadores, objetivo, resultados |
| Teclas H y M | Teclado | No | Ayuda de controles y silencio |
| `localStorage` | `asedio.settings`, `asedio.quality`, `asedio.controles`, `asedio.tutorial`, `asedio.name`, `asedio.mute` | No | Si falla, valores por defecto |
| `?tutorial=1`, `?backdrop=1`, `?quality=` | URL | No | Fuerzan tutorial, fondo o calidad (pruebas) |

### Behavior

1. **Portada** (R-10 U9, WRK-TASK-081; maquetas «Móvil · Portada» y «PC · Portada»): título «ASEDIO / LOCO» en dos líneas (crema, contorno noche y sombra dura) y, en móvil, «Castillos, catapultas y vacas explosivas»; la píldora «Juegas como <nombre>» con el dado (otro al azar) y el lápiz (se edita en el sitio); los tablones JUGAR SOLO (naranja), CREAR SALA y UNIRSE CON CÓDIGO (crema), y los botones redondos de ayuda y ajustes.
   - **Nombre:** la primera vez, uno al azar (`randomName`, «Duque Pepino»), guardado en `asedio.name`; no hace falta escribirlo para empezar. Vacío al editarlo, otro al azar.
   - **Unirse con código:** en PC, el campo y UNIRSE en una fila; en móvil, el tablón se abre en esa fila. Se comprueba con `GET /api/rooms/:code` y avisa si el código está mal o la sala no existe. Con un enlace de invitación (`#ABCD`), «Te invitan a la sala ABCD» y ENTRAR como tablón principal.
   - **Disposición:** en vertical, el título sobre el cielo y el menú abajo, sobre noche al 55 %; en horizontal, una columna de 520 px sobre noche al 88 % con la escena a la derecha. Se aprieta en ventanas bajas.
   - Fondo animado: la isla con los 4 castillos y la cámara girando, sin física (D-043) y sin descargar Rapier: la vista recibe los fragmentos desde fuera (`DebrisLike`) y el fondo usa `NoDebris` (WRK-TASK-016). La cámara va baja, con el cielo detrás del título, y la isla se encuadra en lo que deja libre el menú. No se crea en navegadores automatizados salvo con `?backdrop=1`. Se desmonta al empezar la partida y vuelve con la revancha.
   - **Jugar solo** (R-10 U10, WRK-TASK-082; maqueta «Móvil · Jugar solo»): hoja crema abajo en móvil y tarjeta centrada de 420 px en PC (en un móvil tumbado, en dos columnas). Volver, «Rivales» (1/2/3) y «Dificultad» (Fácil/Normal/Difícil) en selectores segmentados de 48 px; bajo los rivales, sus emblemas y sus nombres, que son exactamente los de la partida: una sola fuente en `shared/players.ts` (`soloSlots` y `botName`, el bot de cada hueco se llama siempre igual), que también usa la sala (WRK-TASK-087); EMPEZAR como tablón naranja y «Campo de pruebas · munición sin límite» como enlace.
2. **Cómo se juega:** una ventana con 6 puntos, cada uno con su icono SVG y sin emoji (rey, apuntado de 20 s según el formato, 3 municiones, objetivo, escudo real y lava; sin viento desde ADR-018).
3. **Tutorial** (D-044), en la primera partida y solo mientras se puede apuntar:
   - Pasos: «Apunta» (avanza al apuntar con el clic derecho), «Elige munición» (con 1/2/3 o Q/E; avanza solo a los 7 s) y «¡Fuego!» (al soltar Espacio; en PC resalta la barra de potencia, R-10 U11).
   - Se puede saltar. Al terminar se guarda y no vuelve. En solitario da 10 s más de apuntado en la ronda 1.
   - **Dónde está y qué señala** (WRK-TASK-048): arriba, sobre el cielo, para no tapar el castillo ni los controles. En PC va bajo la fase (92 px); en vertical, bajo el marcador (148 px) y a todo el ancho; en horizontal compacto, a 58 px y más estrecho. En el paso 1, una mano (un ratón en PC), en SVG, se desliza sobre la escena. En el 2, un anillo noche con pulso naranja resalta las tarjetas. En el 3, resalta el botón de disparo. Sin animación con `prefers-reduced-motion`.
4. **HUD de partida** (en PC, R-10 U11, WRK-TASK-083, maqueta «PC · Apuntando»; en móvil vertical, el punto 9):
   - Arriba al centro, la píldora `#hud-round` con «Ronda N» y los segundos del apuntado en un círculo naranja (grana con pulso por debajo de 4 s); sin «Fase de apuntado», que queda en el `title`. En los resultados dice «Ronda N · resultados», sin los segundos (WRK-TASK-084).
   - **Cuenta atrás** (fase `countdown`): 3-2-1 enorme en el centro, cada número con una animación de entrada y un pitido (más agudo en el 1), y un cuarto tiempo, «¡FUEGO!», de 1 s y con su propio sonido (`sfx.fuego`), que coincide con la salida de los disparos (`Hud.setCountdown`). Son 3, 2, 1, ¡FUEGO!: cuatro tiempos, aunque los disparos salgan a los 3 s. Sin animación con `prefers-reduced-motion`.
   - Arriba a la izquierda, el marcador (componente Marcador): una columna de chips de 190 px con emblema, nombre corto, barra de castillo en pie y, con iconos SVG, la marca de listo, el icono de desconexión (en red) o la cruz si ha caído, a la derecha del nombre; el tuyo con borde crema. El nombre completo (con «(tú)» y «bot») va en `title` y `aria-label`. Solo se rehace si cambia algo.
   - Abajo al centro, 3 cartas de munición de 92×92 con color de rareza y tecla (la elegida sube 6 px con anillo naranja). Se rehacen solo cuando cambia la mano (al elegir solo se mueve la marca) y se eligen en `pointerdown` (WRK-TASK-024: antes se rehacían en cada fotograma y el clic se perdía a menudo). Sin tarjeta fija con la descripción: sale al pasar el ratón (punto 9, U2). Debajo, la barra de potencia `#hud-power` de 300 px, que se llena de naranja al cargar, y la pista «Mantén Espacio o clic para cargar» («Suelta para disparar»; con el disparo listo, a quién se espera). Con ratón no hay botón de disparo; con el dedo, el botón redondo.
   - Abajo a la izquierda, el chip «Controles · H»: H o un clic abren encima el panel con las teclas dibujadas (D-054). Plegado por defecto; recuerda si se abrió (`asedio.controles`). Solo se ve mientras se puede apuntar. Abajo a la derecha, la elevación en grande.
   - Arriba a la derecha, el chip del objetivo (borde naranja), el engranaje y, si se activan, los fps. Sin botón de silencio: el sonido va en Ajustes y la tecla M sigue valiendo.
   - **Objetivo secundario** (WRK-TASK-043, ADR-015): el rótulo de la ronda lo anuncia (icono de la bandera y «Objetivo: …») y, a quien tiene premio, se lo dice (icono de regalo). Durante el apuntado, un chip con borde naranja (bandera y «Jaula de cristal», con el texto completo en el `title`; U5 y U11) y, sobre cada castillo rival, una chincheta (R-14, WRK-TASK-088; componente Marcador, «Marca de objetivo en la escena»): una gota con cuerpo noche, borde crema de 2 px y la misma bandera del chip en naranja, con la punta hacia la pieza objetivo, siempre de cara a la cámara y visible a través de los muros (`WorldView.setGoalMarks`). Sin anillos ni dianas: los anillos son el lenguaje de la puntería (el anillo de impacto, del color del jugador). Antes era una diana plana blanca y roja sobre el muro y se tomaba por la marca de puntería (WRK-TASK-085). En los resultados, «… cumple el objetivo» con el icono de la bandera, y en la pantalla final, la estadística «Objetivos cumplidos». «Cómo se juega» lo explica.
   - **Escudo real** (WRK-TASK-041, ADR-014): en las rondas 1 y 2 cada rey vivo lleva un halo dorado que gira sobre la cabeza y una columna de luz blanca dorada translúcida (8 m) que late (`WorldView.setKingGuard`). La columna no se dibuja si el rey está a menos de 16 m de la cámara, para que la de tu propio rey no tape la vista al apuntar (WRK-TASK-050). El rótulo de la ronda 1 lo anuncia; el de la 2 avisa de que es la última con escudo, y el de la 3, de que se acaba (el subtítulo admite varias líneas y dura 2,6 s). Cuando el escudo salva a un rey, chispas doradas y el rótulo «ESCUDO REAL». Al volver al pedestal, polvo y chispas. «Cómo se juega» lo explica.
   - **Quién ataca a quién** (WRK-TASK-045): durante la cuenta atrás, un arco de guiones del color de cada jugador vivo va de su catapulta al castillo al que apunta (`AttackArcs`, `render/arcs.ts`). Los guiones avanzan hacia el objetivo y el arco acaba en una punta. Se curva hacia la derecha de la marcha, así que dos jugadores que se atacan entre sí no se tapan. Aparece en 0,35 s y se desvanece en 0,3 s al empezar el impacto. Sale del `MatchState` (`target`), así que un invitado ve los mismos arcos que el anfitrión sin mensajes nuevos. Dos InstancedMesh: dos llamadas de dibujo.
   - Al empezar la cuenta atrás se retira el rótulo que hubiera en pantalla (WRK-TASK-038). Los bloques `@media` de pantallas pequeñas van al final de `style.css` para prevalecer sobre las reglas base.
   - Rótulos: «RONDA N», «LA LAVA SUBE», «REY ELIMINADO» / «TU REY HA CAÍDO», «REPETICIÓN».
   - **Pantalla final** (`#game-over`, WRK-TASK-089; R-15, WRK-TASK-090): la misma hoja para todos y a la misma altura; solo cambian los botones, en una zona que mide siempre lo mismo. En móvil vertical, hoja crema desde y = 300 (en 390×844) hasta abajo, sin velo y nunca por encima de los chips; en PC, panel de 560 px a la derecha, bajo la píldora, que dice «Fin de la partida» sin el círculo de segundos. Arriba, el castillo ganador en el hueco libre con una corona encima y confeti (FEAT-CAMARA-001). Chapa con la corona (naranja si ganas, crema si no) y el titular desde tu punto de vista: «¡Has ganado!» con «Tu rey es el último en pie · N rondas», o «Gana <nombre>» con «Quedas N.º · tu rey cayó en la ronda R» («Empate» si no queda nadie). Estadísticas en filas con iconos SVG (sin emoji): mayor destrozo, mejor disparo, disparo más desviado, daño propio, castillo más entero y objetivos cumplidos, cada una con el valor y quién (nombre completo con «(tú)» y su emblema). Botones: en red, el anfitrión REVANCHA y debajo VOLVER A LA SALA | SALIR, y los demás «Esperando a que <anfitrión> pida la revancha» y SALIR; en solitario, OTRA PARTIDA y CAMBIAR RIVALES | SALIR. En PC, en una fila (FEAT-SALAS-001, PROD-JUGAR-001).
   - Resultados (en PC y en horizontal; en vertical, la hoja del punto 9): frase de la ronda y bloques perdidos y rotos por jugador. Sobre cada castillo, «−N» en el color del jugador o «Sin daños», ancladas al borde si el castillo queda fuera de pantalla y sin tapar la lista (WRK-TASK-036). Un castillo sin daños pone «sin daños» (D-055).
   - **Registro de los textos** (27-09-2026, a petición del usuario): claro, preciso y neutro. Sin coloquialismos ni chistes en rótulos, resultados, estadísticas, avisos y descripciones; los nombres propios (municiones, bots) y la cuenta atrás «3, 2, 1, ¡FUEGO!» se mantienen. Las descripciones de munición caben en dos líneas del HUD en vertical (la prueba `hud-compact` usa la más larga).
5. **Ajustes** (en portada y HUD):
   - Calidad baja / media / alta, que se aplica al momento, también a los topes de fragmentos y partículas (D-046, WRK-TASK-013).
   - Sonido, texto grande, temblor de cámara (activado salvo con `prefers-reduced-motion`, WRK-TASK-032) y mostrar fps (ocultos por defecto, D-055).
   - Sensibilidad del ratón de ×0,4 a ×1,8 (pasos de 0,1).
   - Modo zurdo (R-10 U8, WRK-TASK-077): en la bandeja del móvil vertical, pad a la izquierda y disparo a la derecha. Se guarda en `asedio.settings`.
   - El panel cierra al tocar fuera; un clic dentro ya no se cancela (antes ninguna casilla cambiaba, WRK-TASK-077).
6. **Accesibilidad** (D-045): colores Okabe-Ito más un emblema por jugador (☀ ☾ ★ ϟ), con tinta oscura sobre amarillo y rosa. Hay texto grande y silencio.
7. **Pantallas estrechas** (≤ 700 px): el chip de controles no se ve.
8. **Estilo «Atardecer»** (R-10, WRK-TASK-074): la fuente de verdad es el design system «Asedio Loco · estilo» (https://claude.ai/artifact/D3UZsBmqS3PPWLsKYptLj3).
   - Colores solo de sus tokens, como variables `--al-<token>` en `style.css`: noche, ciruela, vino, grana, naranja, crema y derivados. Grana solo para disparo, daño y peligro; naranja solo para lo que se toca o está elegido. Los jugadores mantienen los Okabe-Ito (D1).
   - Letra: Lilita One en títulos, botones y cifras; Nunito 600-900 en el texto. Las dos en woff2 desde `client/src/ui/fonts/`.
   - Menús: tarjetas crema con contorno noche y sombra dura; los botones grandes son tablones de madera (veta, clavos, sombra dura e inclinación que alterna −1,2° y +0,9°, solo dentro de un panel de menú). El HUD de partida va sobre paneles noche al 86 % y no se inclina.
   - Rarezas: común #A8949C, rara #4FA8E8 y épica #9E2E8A (texto noche, noche y crema); defensiva usa `listo` (#9ED36A) con texto noche.
   - Munición ilustrada (WRK-TASK-075): cada munición tiene un SVG propio de 48×48 con contorno noche (`client/src/ui/ammoArt.ts`), sin emoji; mide 1,2 em del contenedor.
9. **Partida en móvil vertical** (R-10 fase 2, U1-U8; sección «Partida en móvil: zonas» del design system y maquetas de «Nueva versión» a 390×844). Rige con `(orientation: portrait) and (max-width: 600px)` (`TRAY_QUERY`); el HUD pone la clase `tray-mode` y cambia de disposición si se gira el móvil. Sin emoji: iconos SVG de trazo 2,5 px con extremos redondos en `currentColor` (`client/src/ui/icons.ts`).
   - **Bandeja del pulgar** (U1, U3 y U8, WRK-TASK-077): franja ciruela abajo, como mucho el 30 % del alto (253 px a 844), con `radius-lg` arriba y la zona segura del sistema. Botón de disparo a la izquierda (grana, 82 px y 96 con el anillo) y pad de puntería a la derecha (252×128), espejados en modo zurdo (R-12, WRK-TASK-086); debajo, las cartas en fila (108×62, tecla en la esquina; con más de tres, la fila se desliza). La variable `--k` la reduce en pantallas más bajas o estrechas. Solo se ve mientras se puede apuntar. El tutorial resalta el pad en el paso 1, sin la mano.
   - **Descripción al mantener la carta** (U2, WRK-TASK-078, también en PC): un toque elige la carta; mantener el dedo 350 ms enseña encima la tarjeta `#ammo-tip` (crema, nombre en Lilita 18 con la chapa de rareza, descripción en Nunito 13 vino en dos líneas como mucho y una flecha hacia la carta). Al soltar desaparece y la carta queda elegida. En la bandeja va a todo el ancho, 10 px por encima; en PC sale al pasar el ratón, centrada sobre la carta y por encima de la fila. Las cartas no llevan `title`; nombre, rareza y descripción van en `aria-label`.
   - **Parte superior** (U4 y U5, WRK-TASK-079): solo lectura salvo el engranaje (44 px, crema). La píldora `#hud-round` junta «Ronda N» y los segundos en un círculo naranja (grana con pulso en los últimos 4 s); sin «Fase de apuntado». Debajo, `#hud-players` en una fila de chips de hasta 86 px con cuatro jugadores y de hasta 112 px con tres o menos (R-15; así «Tortilla ×» cabe entero, WRK-TASK-091): emblema, nombre corto y barra; el tuyo con borde crema; eliminado al 50 %; la marca de listo, la cruz o la desconexión, de 11 px a la derecha del nombre, como en PC (WRK-TASK-084, a petición del usuario; con la marca, un nombre corto largo se abrevia con «…»). En los resultados, la píldora dice «Ronda N · resultados», sin los segundos. Después, el chip del objetivo (borde naranja); el del viento se quitó con el viento (ADR-018). El silencio no está arriba: el sonido va en Ajustes.
   - **Después de disparar** (U6 y U7, WRK-TASK-080): la bandeja se recoge en la barra `#hud-wait` («Disparo listo · Esperando a … · N de M listos», con la carta disparada y los emblemas; un hueco por cada uno que falta) y la escena ocupa toda la pantalla. Los resultados van en la hoja crema `#results-sheet`: «Fin de la ronda N», el objetivo cumplido destacado, la tabla jugador / pierde / derriba (tú resaltado) y una barra que se vacía hasta la ronda siguiente; sin la frase de la ronda. Las cifras de daño siguen sobre los castillos, por encima de la hoja, con un plano general de la isla (FEAT-CAMARA-001).

### Outputs

| Output | Type | Notes |
|---|---|---|
| DOM `#hud`, `#home`, `#howto`, `#tutorial`, `#settings`, `#game-over` | Elementos | Ids estables que usan las pruebas |
| Preferencias | `localStorage` | Sobreviven a recargas |

### Known Limitations

- **Táctil** (WRK-TASK-006, clase `body.touch`):
  - el botón de disparo es redondo (96 px), abajo a la derecha, y se llena como un reloj con la fuerza;
  - la ayuda empieza plegada (chip «Controles» de 44 px) y tiene sus propias filas; sin barra de potencia ni elevación;
  - tutorial, «Cómo se juega» y rótulos con textos táctiles;
  - **se puede instalar** (PWA, WRK-TASK-009): manifiesto con `display: fullscreen` y `orientation: any`, iconos dibujados por código (`tests/tools/make-icons.mjs`) y metas de Apple para «Añadir a pantalla de inicio». Sin service worker: el juego necesita la red. La instalación en un teléfono real está pendiente del usuario (A7 y A8 de WRK-TASK-040);
  - pantalla completa al entrar (Android), sin bloquear la orientación. **El vertical es la forma de jugar por defecto en móvil** (se diseña y se prueba primero en vertical); el horizontal funciona pero es secundario. En vertical, la partida tiene su propia disposición (punto 9 de Behavior) y la cámara abre el campo de visión para no bajar de 40° de ancho.
- La portada carga Rapier (1,1 MB comprimido) solo para el fondo animado.
- **HUD compacto** (altura ≤ 500 px, WRK-TASK-007):
  - los chips del marcador miden 124 px. El nombre corto (`shortName`, WRK-TASK-046) es «Tú» en tu fila, la última palabra en los bots («Lady Pixel» → «Pixel») y en los nombres con título («Duque Pepino» → «Pepino»), y la primera en los demás humanos; el nombre completo queda en el `title`;
  - la píldora de la ronda (40 px), los chips, la elevación y las cartas (64 px) se encogen;
  - el botón de disparo táctil es redondo de 84 px, en la esquina inferior derecha;
  - la cuenta atrás y los rótulos se miden en `vh`;
  - la pantalla final va sin la chapa, más apretada, y se desplaza si no cabe.

  Por encima de 500 px no cambia nada. En vertical hay una disposición propia (`@media (orientation: portrait) and (max-width: 600px)`).

## Acceptance Criteria

- [x] La portada carga sin errores y enseña el título y el panel `#home`.
- [x] En partida, el botón de disparo no aparece para un espectador.
- [x] Al final aparece `#game-over` con el ganador y el número de rondas.
- [x] El panel de controles se abre y se pliega con H (`tests/e2e/hud-compact.spec.ts`, «HUD de PC»); que recuerde el estado tras recargar no tiene prueba.
- [ ] Con texto grande, el marcador y la ayuda crecen (sin prueba).
- [ ] El tutorial no vuelve tras terminarlo (sin prueba automática; se fuerza con `?tutorial=1`). Que avanza con cada paso, resalta el control que toca y no tapa ningún control lo comprueba `tests/e2e/tutorial.spec.ts` (WRK-TASK-048).

## Evidence

| Type | Reference | Date | Confidence impact |
|------|-----------|------|-------------------|
| Testing | `tests/e2e/smoke.spec.ts`, `tests/e2e/solo.spec.ts`, `tests/e2e/multiplayer.spec.ts` | 2026-09-26 | low → medium |
| Expert review | Capturas de `tests/tools/review.mjs` | 2026-09-25 | — |
| Testing | `tests/e2e/solo.spec.ts` y `multiplayer.spec.ts` (revancha): arcos en la cuenta atrás, iguales en el anfitrión y el invitado, WRK-TASK-045 | 2026-09-27 | — |
| Testing | `tests/e2e/hud-compact.spec.ts` (nombres cortos visibles, sin recortar ni solapes en 6 tamaños) y `tests/unit/players.test.ts`, WRK-TASK-046 | 2026-09-27 | — |

## Traceability

| Relation | Target | Description |
|----------|--------|-------------|
| Implemented in | `client/src/ui/hud.ts` | HUD, panel de controles, carga, rótulos, cuenta atrás |
| Implemented in | `client/src/ui/lobby.ts` | Portada, «Cómo se juega» (con el escudo real), «Jugar solo», lobby |
| Implemented in | `client/src/game/view.ts` | Halo y columna del escudo real (`setKingGuard`) |
| Implemented in | `client/src/ui/tutorial.ts` | Tutorial de 3 pasos y resaltado de controles (`FOCUS`) |
| Implemented in | `client/src/ui/settings.ts` | Ajustes y texto grande |
| Implemented in | `client/src/ui/backdrop.ts` | Fondo animado |
| Implemented in | `client/src/game/match/ui.ts` | `AIM_HELP`, resultados, arcos de la cuenta atrás (`showArcs`) y pantalla final |
| Implemented in | `client/src/game/render/arcs.ts` | `AttackArcs`: quién ataca a quién |
| Implemented in | `client/src/ui/style.css` | `@media (max-width: 700px)`, `.big-text`, `.replaying`; tokens `--al-*` y tablones (R-10) |
| Implemented in | `client/src/ui/ammoArt.ts` | Ilustraciones SVG de la munición |
| Implemented in | `client/src/ui/icons.ts` | Iconos SVG del HUD (R-10 fase 2) |
| Implemented in | `client/src/device.ts` | `TRAY_QUERY`: cuándo rige la partida en móvil vertical |
| Implemented in | `client/src/ui/fonts/` | Lilita One y Nunito en woff2, con sus licencias OFL |
| Implemented in | `shared/players.ts` | `PLAYER_STYLES` (Okabe-Ito y emblemas), `shortName`, `randomName` |
| Tested by | `tests/e2e/smoke.spec.ts` | Portada sin errores |
| Tested by | `tests/e2e/portada.spec.ts` | Portada y «Jugar solo» en PC y en vertical: nombre al azar, unirse con código, invitación, tamaños y solapes |
| Tested by | `tests/e2e/pwa.spec.ts` | Manifiesto válido e instalable |
| Tested by | `tests/e2e/tutorial.spec.ts` | Tutorial en PC y en vertical: pasos, resaltado, sin solapes |
| Tested by | `tests/e2e/touch.spec.ts`, `tests/e2e/hud-compact.spec.ts` | Bandeja del pulgar, modo zurdo, descripción al mantener, parte superior, barra «Disparo listo» y hoja de resultados en vertical; HUD de PC (posiciones, cartas, potencia, controles con H) |
| Tested by | `tests/tools/review.mjs` | Capturas para revisión a ojo |
| Decided in | D-043, D-044, D-045, D-046, D-054, D-055 | Portada, tutorial, accesibilidad, calidad, ayuda, fps |

## Open Questions

- Ajustes dice «Sensibilidad del tirachinas», pero el tirachinas ya no existe (D-059). ¿Se cambia a «Sensibilidad del ratón»? — dimas
- D-044 describe el paso 2 del tutorial con la rueda y 1/2; el código ya habla de 1/2/3 y Q/E. `DECISIONES.md` es histórico y no se toca. — dimas

---
id: FEAT-SALAS-001
type: spec
layer: feature
status: active
confidence: medium
version: 1.6.0
created: 2026-09-26
updated: 2026-10-03
owner: dimas
dependencies:
  - id: PROD-JUGAR-001
    relation: implements
  - id: ARCH-001
    relation: constrained-by
  - id: ARCH-003
    relation: constrained-by
  - id: RULE-002
    relation: constrained-by
supersedes: null
tags:
  - multijugador
  - salas
  - lobby
  - reconexion
  - anfitrion
---

# FEAT-SALAS-001 — Salas, espectadores y reconexión

## Intent

Jugar con amigos sin cuentas: una sala con un código, un enlace que se comparte y una partida que aguanta recargas, cortes y que el anfitrión se vaya. Esta especificación fija el ciclo de vida de una sala desde el punto de vista del jugador.

## Definition

### Purpose

Crear y unirse a salas de hasta 4 jugadores, configurar la partida en el lobby, admitir espectadores, recuperar el hueco al volver y mantener viva la partida cuando cambia el anfitrión.

### Inputs

| Input | Type | Required | Notes |
|---|---|---|---|
| «Crear sala» | Botón de la portada | — | `POST /api/rooms` → código de 4 letras sin I ni O |
| Enlace `/#ABCD` | URL | — | Abre la portada con «Entrar en la sala ABCD» |
| Nombre | Texto | No | Saneado a 16 caracteres; vacío → «Jugador N» |
| Token | `localStorage asedio.token.<código>` | No | Se guarda al recibir `welcome` |
| `config {difficulty, fast}` | Mensaje | Solo anfitrión, en la sala | Dificultad de los bots; `fast` solo por `?fast=1` |
| `seat {slot, bot}` | Mensaje | Solo anfitrión, en la sala | Tocar una plaza (R-11 S2, WRK-TASK-070): libre → bot; bot o desconectado → libre. Las plazas con bot van en `config.botSlots` |
| `start`, `rematch`, `lobby`, `yield` | Mensajes | Solo anfitrión | Empezar, revancha en un paso, volver a la sala, ceder |
| `leave` | Mensaje | Cualquiera | Salir de la sala o de la partida: la plaza queda libre al momento (R-07 F1 y F3, WRK-TASK-067) |
| `mobile` en `hello` | booleano | No | `pointer: coarse` sin puntero fino; `?mobile=1/0` lo fuerza |

### Behavior

1. **Crear y entrar:** quien crea la sala es el anfitrión. Si al recargar hay token de esa sala, se entra directo sin pasar por la portada.
2. **Sala** (R-11, maquetas «Móvil · Sala» y «PC · Sala» del lienzo): en vertical, «Salir de la sala» y el engranaje arriba, la tarjeta del código y, debajo, la hoja crema con las plazas; en horizontal, una columna noche de 520 px a la izquierda («Salir de la sala», «Sala de <anfitrión>», el código, la ayuda y los ajustes) y la tarjeta de las plazas, de 600 px, a la derecha. Es el mismo DOM (`#room`); lo coloca `client/src/ui/flujo.css`.
   - **Código e invitación** (R-11 S1, WRK-TASK-069): el código en cuatro letras grandes (`#room-code`, 56×68 en móvil y 64×76 en PC) con «Tus amigos lo escriben en «Unirse con código»». En móvil, COMPARTIR abre la hoja del sistema (`navigator.share`, con el enlace y un texto con el código; si no existe o falla, copia el enlace) y el botón redondo copia el código; en PC, COPIAR ENLACE y CÓDIGO. Cada copia lo confirma con un aviso.
   - **Plazas** (R-11 S2 y S6, WRK-TASK-070): «Jugadores · N de 4» y cuatro filas de 58 px (68 en PC). El color y el emblema van con la plaza (1 ☀ rojo, 2 ☾ azul, 3 ★ amarillo, 4 ϟ rosa), no con quien entra. Tu fila, con borde y sombra, lleva TÚ (y ANFITRIÓN si lo eres); los demás, ANFITRIÓN, CONECTADO o DESCONECTADO; los bots, BOT. Solo el anfitrión toca las plazas: una libre (borde discontinuo y el emblema del color de la plaza en discontinuo) añade un bot; un bot o un jugador desconectado muestran «Quitar» y al tocarlos la plaza queda libre. Los invitados ven «Plaza libre».
   - **Bots por plaza** (D2): cada bot va en su plaza y se llama siempre igual (plaza 2 Conde Clic, 3 Reina Rúter, 4 Sir Bot; la 1, Lady Pixel, si queda libre). Un humano que entra con la sala llena de humanos y bots ocupa la plaza del primer bot: los humanos van antes que los bots.
   - **Dificultad** (D1): bajo las plazas y solo si hay algún bot, el selector Fácil / Normal / Difícil (Normal por defecto); los invitados la leen como texto («Bots en dificultad Normal»).
   - **Nombre** (R-11 S3): en tu fila, el dado (otro al azar) y el lápiz, que abre el nombre en un campo que ocupa la fila; Intro o ✓ lo guardan (y en el dispositivo, como en la portada); vacío, otro al azar; Escape lo deja. Mientras se edita, en vertical la tarjeta del código se recoge y la hoja sube por encima del teclado.
   - **Empezar** (S5): EMPEZAR solo lo ve el anfitrión, desactivado con menos de 2 castillos («Hace falta al menos otro jugador o un bot»). Los invitados ven «Esperando a que <anfitrión> empiece» y «Solo el anfitrión cambia las plazas y empieza la partida».
   - En la sala, un jugador desconectado cede su plaza a uno nuevo si la sala está llena.
3. **Empezar:** se quitan los desconectados. Si el anfitrión es un móvil y hay un ordenador, el ordenador pasa a ser el anfitrión antes de la primera ronda (D-065).
4. **Espectadores** (D-033): quien entra con la partida empezada o con la sala llena es espectador. Pide `hi` y recibe un `full`. El servidor rechaza sus `relay` («Los espectadores no pueden jugar»).
5. **Reconexión:**
   - El cliente reintenta con espera `min(5 s, 0,4 s·2^n)` y manda `ping` cada 5 s.
   - Con el token recupera su hueco (y cierra otra pestaña suya) y pide el estado completo.
   - Si la versión del protocolo no coincide, deja de reintentar y pide recargar.
6. **Migración de anfitrión** (D-031): si el anfitrión se desconecta en partida, el servidor elige a otro jugador conectado, primero los ordenadores y luego por hueco. Ese cliente reconstruye la física con lo que ve y sigue. Si hereda la partida en pleno impacto, la da por terminada y saca las cuentas de la ronda de `MatchState.impact` (WRK-TASK-012). Los bloques perdidos de cada castillo son los que había en pie al empezar el impacto menos los que siguen en pie en su mundo. Los rotos de cada castillo se reparten a partes iguales entre quienes le apuntaban: es una aproximación, porque su simulación no vio quién rompió qué. Los disparos que aún no habían salido se pierden.
   - Si se estaba resolviendo un impacto, se da por terminado. Si se apuntaba, los bots vuelven a decidir y quedan al menos 3 s.
   - En el lobby, el anfitrión tiene 8 s de gracia para recargar sin perder el papel.
6b. **Desconectado → bot** (WRK-TASK-010): al empezar cada ronda, el anfitrión marca `auto` en los humanos vivos que no están conectados. Su castillo lo lleva un bot con la dificultad de la sala (`decideBots`), su puntería se reenvía a todos como la de un bot y el marcador enseña 🤖 junto a 📡. Si vuelve con su token, sus entradas se ignoran hasta el siguiente apuntado, en el que recupera el control. El resto de la ronda en que se fue hace de margen para reconectar.
6c. **Salir** (R-07 F1 y F3, R-11 S4, WRK-TASK-067): en la sala, la píldora «Salir de la sala» (arriba a la izquierda) y, en partida, «Salir de la partida» al final del menú del engranaje, las dos con una hoja de confirmación (SALIR en grana y QUEDARME; tocar fuera es quedarse).
   - El cliente manda `leave`, olvida el token de la sala (recargar ya no vuelve a meterle) y vuelve a la portada. El servidor lo quita de la sala al momento: su plaza queda libre y nadie lo ve como «Desconectado».
   - Si era el anfitrión, hereda otro jugador conectado: en la sala, el siguiente por orden de plaza, y la confirmación dice quién («Como eres el anfitrión, Beto pasará a serlo»); en partida, como en la migración (primero los ordenadores).
   - En partida, su castillo sigue: al no estar conectado, desde la ronda siguiente lo lleva un bot (punto 6b). La confirmación lo explica; si ya había caído o es espectador, solo dice que vuelve a la portada. En solitario, la partida se acaba y se vuelve a la portada.
   - «Salir» en la pantalla final también manda `leave` (antes recargaba sin avisar y el jugador quedaba como «Desconectado»).
7. **Cesión en segundo plano** (D-065): a los 2 s con la pestaña oculta, el anfitrión manda `yield` y pasa a cliente sin desconectarse. Al volver pide un `full`. Si no hay otro humano conectado, la partida espera. No se cede en `over`.
8. **Revancha en un paso** (R-07 F2, WRK-TASK-068): en la pantalla final, el anfitrión ve REVANCHA y VOLVER A LA SALA; los demás, «Esperando a que <anfitrión> pida la revancha» (si el anfitrión cambia, cambian los botones).
   - REVANCHA (`rematch`) empieza otra partida al momento con los mismos jugadores, bots y ajustes, sin pasar por la sala: quita a los desconectados, convierte espectadores en jugadores si hay plaza (la de un bot cuenta), conservando si son móvil (WRK-TASK-019), y sube `RoomState.game`. Cada cliente, al ver otra partida en `game`, desmonta la anterior y monta la nueva (`main.ts`).
   - VOLVER A LA SALA (`lobby`) lleva a todos a la sala con las mismas plazas, para cambiar bots o dificultad o esperar a más gente; también quita a los desconectados y sienta a los espectadores.
9. **Sala vacía:** se borra a los 60 s sin conexiones.

### Outputs

| Output | Type | Notes |
|---|---|---|
| `welcome {you:{id, token, role}, room}` y `room {room}` | Mensajes | `RoomState`: jugadores, `hostId`, espectadores, config, `inGame` |
| Avisos | Toast | «El anfitrión se ha ido: ahora la partida la llevas tú», «Otro jugador lleva ahora la partida mientras no estás» |

### Known Limitations

- Un jugador que se desconecta en plena partida dispara con su última puntería hasta que acaba la ronda en curso. Desde la siguiente, su castillo lo lleva un bot (WRK-TASK-010, punto 6b).
- Si el anfitrión se va en plena fase de impacto, las estadísticas de esa ronda quedan incompletas.
- Un espectador que entra tarde no ve las repeticiones anteriores (FEAT-REPLAY-001).
- Cualquiera con el enlace puede entrar: no hay salas privadas ni expulsión.

## Acceptance Criteria

- [x] Se crea una sala, otro jugador entra por el enlace y ambos ven la lista de conectados.
- [x] Un espectador que entra en la ronda 2 recibe el estado completo, no ve el botón de disparo y el servidor rechaza su `relay`.
- [x] Un jugador que recarga recupera su hueco y no pasa a espectador.
- [x] Si el anfitrión se va a mitad de partida, otro la hereda y todos acaban con el mismo ganador y rondas.
- [x] Con el anfitrión en segundo plano, otro jugador sigue llevando la partida.
- [x] Un móvil que crea la sala cede el papel a un ordenador desde el principio, sin migración.
- [x] La revancha empieza otra partida en un paso con los mismos jugadores y bots, y solo el anfitrión ve REVANCHA y VOLVER A LA SALA; los demás esperan por su nombre (`tests/e2e/sala.spec.ts`, `multiplayer.spec.ts`).
- [x] Los nombres se sanean a 16 caracteres y los códigos tienen 4 letras sin I ni O.
- [x] Con dos dispositivos, añadir y quitar bots, cambiar la dificultad y cambiar el nombre se ve en los dos; el anfitrión quita a un jugador desconectado tocando su plaza (`tests/e2e/sala.spec.ts`).
- [x] Quien sale de la sala deja su plaza libre al momento en los demás dispositivos; si era el anfitrión, lo hereda otro, y la confirmación dice quién (`tests/e2e/sala.spec.ts`, PC y móvil vertical).
- [x] Quien sale de una partida en red vuelve a la portada y su castillo lo lleva un bot desde la ronda siguiente; en solitario, se vuelve a la portada (`tests/e2e/sala.spec.ts`).

## Evidence

| Type | Reference | Date | Confidence impact |
|------|-----------|------|-------------------|
| Testing | `tests/e2e/lobby.spec.ts`, `tests/e2e/multiplayer.spec.ts` en CI contra producción | 2026-09-26 | low → medium |
| Testing | `tests/e2e/sala.spec.ts`: salir de la sala y de la partida con dos y tres dispositivos, en PC y móvil vertical | 2026-10-03 | — |

## Traceability

| Relation | Target | Description |
|----------|--------|-------------|
| Implemented in | `server/index.ts` | `Room`: hello, config, seat, start, rematch, lobby, yield, leave, relay, `begin`, `seatSpectators`, `pickNewHost`, `freeSlot`, alarmas |
| Implemented in | `client/src/ui/sheet.ts` | Hoja de confirmación y aviso (salir, eliminado) |
| Implemented in | `client/src/net/connection.ts` | Reconexión, token, ping, `isMobileDevice` |
| Implemented in | `client/src/ui/lobby.ts` | Portada, lobby y configuración |
| Implemented in | `client/src/game/modes/online.ts` | `migrate`, `demote`, `onVisibility` |
| Implemented in | `client/src/main.ts` | Entrada directa con token, montaje del juego |
| Tested by | `tests/e2e/lobby.spec.ts` | Crear sala y unirse |
| Tested by | `tests/e2e/sala.spec.ts` | Sala con varios dispositivos y salidas |
| Tested by | `tests/e2e/multiplayer.spec.ts` | 4 jugadores, espectador, reconexión, migración, segundo plano, móvil, revancha |
| Tested by | `tests/unit/protocol.test.ts` | `sanitizeName`, `parseClientMsg`, `randomRoomCode` |
| Decided in | D-031, D-033, D-065 | Migración, espectadores y reconexión, cesión en segundo plano |


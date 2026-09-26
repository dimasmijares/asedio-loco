---
id: FEAT-SALAS-001
type: spec
layer: feature
status: active
confidence: medium
version: 1.1.0
created: 2026-09-26
updated: 2026-09-26
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
| `config {bots, difficulty, fast}` | Mensaje | Solo anfitrión, en lobby | Bots de relleno 0 a huecos libres; `fast` solo por `?fast=1` |
| `start`, `lobby`, `yield` | Mensajes | Solo anfitrión | Empezar, revancha, ceder |
| `mobile` en `hello` | booleano | No | `pointer: coarse` sin puntero fino; `?mobile=1/0` lo fuerza |

### Behavior

1. **Crear y entrar:** quien crea la sala es el anfitrión. Si al recargar hay token de esa sala, se entra directo sin pasar por la portada.
2. **Lobby:** lista de 4 huecos con color y emblema, «Anfitrión», «Tú», «Desconectado» y huecos de bot. Botón «Copiar enlace».
   - El anfitrión elige bots y dificultad. «¡A la batalla!» exige al menos 2 castillos (jugadores conectados + bots).
   - En el lobby, un jugador desconectado cede su hueco a uno nuevo si la sala está llena.
3. **Empezar:** se quitan los desconectados. Si el anfitrión es un móvil y hay un ordenador, el ordenador pasa a ser el anfitrión antes de la primera ronda (D-065).
4. **Espectadores** (D-033): quien entra con la partida empezada o con la sala llena es espectador. Pide `hi` y recibe un `full`. El servidor rechaza sus `relay` («Los espectadores no pueden jugar»).
5. **Reconexión:**
   - El cliente reintenta con espera `min(5 s, 0,4 s·2^n)` y manda `ping` cada 5 s.
   - Con el token recupera su hueco (y cierra otra pestaña suya) y pide el estado completo.
   - Si la versión del protocolo no coincide, deja de reintentar y pide recargar.
6. **Migración de anfitrión** (D-031): si el anfitrión se desconecta en partida, el servidor elige a otro jugador conectado, primero los ordenadores y luego por hueco. Ese cliente reconstruye la física con lo que ve y sigue.
   - Si se estaba resolviendo un impacto, se da por terminado. Si se apuntaba, los bots vuelven a decidir y quedan al menos 3 s.
   - En el lobby, el anfitrión tiene 8 s de gracia para recargar sin perder el papel.
7. **Cesión en segundo plano** (D-065): a los 2 s con la pestaña oculta, el anfitrión manda `yield` y pasa a cliente sin desconectarse. Al volver pide un `full`. Si no hay otro humano conectado, la partida espera. No se cede en `over`.
8. **Revancha:** solo el anfitrión ve «¡Revancha!». Vuelve al lobby con la misma sala, quita a los desconectados y convierte espectadores en jugadores si hay hueco, conservando si son móvil (WRK-TASK-019).
9. **Sala vacía:** se borra a los 60 s sin conexiones.

### Outputs

| Output | Type | Notes |
|---|---|---|
| `welcome {you:{id, token, role}, room}` y `room {room}` | Mensajes | `RoomState`: jugadores, `hostId`, espectadores, config, `inGame` |
| Avisos | Toast | «El anfitrión se ha ido: ahora la partida la llevas tú», «Otro jugador lleva ahora la partida mientras no estás» |

### Known Limitations

- Un jugador que se desconecta en plena partida no pasa a ser un bot: su catapulta dispara con la última puntería cuando se acaba el tiempo.
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
- [x] La revancha vuelve al lobby con la misma sala y los mismos jugadores, y solo el anfitrión ve el botón.
- [x] Los nombres se sanean a 16 caracteres y los códigos tienen 4 letras sin I ni O.

## Evidence

| Type | Reference | Date | Confidence impact |
|------|-----------|------|-------------------|
| Testing | `tests/e2e/lobby.spec.ts`, `tests/e2e/multiplayer.spec.ts` en CI contra producción | 2026-09-26 | low → medium |

## Traceability

| Relation | Target | Description |
|----------|--------|-------------|
| Implemented in | `server/index.ts` | `Room`: hello, config, start, lobby, yield, relay, `pickNewHost`, alarmas |
| Implemented in | `client/src/net/connection.ts` | Reconexión, token, ping, `isMobileDevice` |
| Implemented in | `client/src/ui/lobby.ts` | Portada, lobby y configuración |
| Implemented in | `client/src/game/modes/online.ts` | `migrate`, `demote`, `onVisibility` |
| Implemented in | `client/src/main.ts` | Entrada directa con token, montaje del juego |
| Tested by | `tests/e2e/lobby.spec.ts` | Crear sala y unirse |
| Tested by | `tests/e2e/multiplayer.spec.ts` | 4 jugadores, espectador, reconexión, migración, segundo plano, móvil, revancha |
| Tested by | `tests/unit/protocol.test.ts` | `sanitizeName`, `parseClientMsg`, `randomRoomCode` |
| Decided in | D-031, D-033, D-065 | Migración, espectadores y reconexión, cesión en segundo plano |


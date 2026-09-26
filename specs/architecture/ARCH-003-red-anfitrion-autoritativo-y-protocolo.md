---
id: ARCH-003
type: spec
layer: architecture
status: active
confidence: medium
version: 1.0.0
created: 2026-09-26
updated: 2026-09-26
owner: dimas
dependencies:
  - id: RULE-002
    relation: constrained-by
  - id: ARCH-001
    relation: constrained-by
  - id: ARCH-002
    relation: extends
supersedes: null
tags:
  - red
  - protocolo
  - anfitrion
---

# ARCH-003 — Red: anfitrión autoritativo y protocolo

## Intent

Hasta 4 jugadores y varios espectadores tienen que ver la misma partida, aunque la física solo pueda correr en un sitio. Esta especificación fija quién manda, qué mensajes viajan y qué pasa cuando alguien se va o pierde la conexión.

## Definition

### Context

- El servidor (ARCH-001) no ejecuta física: solo guarda el lobby y retransmite.
- La física de Rapier no es determinista entre navegadores (D-030), así que no se puede simular en todos.
- Un navegador en segundo plano deja de ejecutar `requestAnimationFrame` y, con ello, la simulación (D-065).

### Decision

**Anfitrión autoritativo.** Un jugador (el anfitrión) ejecuta `Sim` y `MatchHost` (ARCH-002). Los demás reproducen lo que manda.

**Protocolo con el servidor** (`shared/protocol.ts`, JSON sobre WebSocket en `/ws/ABCD`). `PROTOCOL_VERSION = 5`.

- Cliente → servidor: `hello {v, name, token?, mobile?}`, `name`, `config {bots, difficulty, fast}`, `start`, `lobby` (revancha), `yield`, `relay {to, d}`, `ping`.
- Servidor → cliente: `welcome {you:{id, token, role}, room}`, `room {room}`, `relay {from, d}`, `pong`, `error {code, msg}`.
- Límites que aplica el servidor:
  - Mensajes de 64 KB como mucho (`MAX_MSG_BYTES`) y validados campo a campo (`parseClientMsg`).
  - Cubo de fichas por conexión: 30/s (ráfaga 60) o 80/s (ráfaga 160) si es el anfitrión. Tras 300 descartes, cierre 1008.
  - Nombres saneados a 16 caracteres (`sanitizeName`).
  - Un `hello` con otra versión recibe `error {code: 'version'}`.
  - `config`, `start` y `lobby` solo del anfitrión. Los espectadores no pueden mandar `relay`. Quien no es anfitrión solo manda a `all` o `host`.

**Mensajes de partida** (dentro de `relay.d`, `client/src/game/net/messages.ts`):

| k | de → a | contenido |
|---|---|---|
| `st` | anfitrión → todos | `MatchState` cuando cambia |
| `tk` | anfitrión → todos | 15 Hz: hora del anfitrión, poses cuantizadas (cm y 1e-4), eventos, punterías de bots |
| `full` | anfitrión → uno/todos | Todo el estado. Al empezar, al pasar a resultados o fin, y en respuesta a `hi` |
| `aim` | jugador → todos | Puntería propia a ~10 Hz, sin pasar por el anfitrión |
| `in` | jugador → anfitrión | Puntería, munición, objetivo, ¡listo! |
| `hi` | cliente → anfitrión | "Acabo de llegar": pide un `full` |

- Los clientes solo aceptan `st`, `tk` y `full` del `hostId` actual.
- **Estado con versión (D-064):** `MatchState.v` sube en cada cambio. Un cliente descarta un `MatchState` con la misma `seed` y menor `v`.
- **Interpolación:** los clientes dibujan 120 ms por detrás del reloj estimado del anfitrión (`INTERP_DELAY`). Los eventos van en la misma línea temporal que las poses (D-029).

**Elección y migración de anfitrión** (`server/index.ts`):

- Al principio, el creador de la sala.
- Al `start`, si el anfitrión es un móvil (`mobile`) y hay un ordenador, el papel pasa al ordenador.
- En partida, si el anfitrión se desconecta o manda `yield`, hereda el siguiente jugador conectado: primero los ordenadores y luego por hueco.
- En el lobby, el anfitrión caído tiene 8 s de gracia antes de perder el papel.
- El cliente anfitrión que pasa 2 s en segundo plano manda `yield` y se convierte en cliente sin desconectarse. Al volver, pide un `full`.
- El heredero reconstruye la física con lo que ve (`Sim.restore`) y retoma el reloj de fase (D-031).

**Reconexión:** el `token` se guarda en `localStorage` (`asedio.token.<código>`). Con él, un `hello` recupera el mismo hueco y cierra la conexión anterior. El cliente reintenta con espera exponencial (400 ms × 2ⁿ, hasta 5 s). Quien llega a una partida empezada, o es el 5.º, entra como espectador. En la revancha, los espectadores pasan a jugar si hay hueco.

### Rationale

- Anfitrión en un navegador: el servidor gratuito no tiene CPU para Rapier y así no hay coste por partida (D-003, D-030).
- Un único tic a 15 Hz con todo agrupado: unos 17 mensajes por segundo (D-027).
- `full` al final de cada ronda corrige cualquier deriva (D-028).
- La puntería va directa entre jugadores para que se vea sin retraso (D-032).

### Consequences

- El anfitrión puede hacer trampas y su conexión limita a todos.
- Toda migración pierde lo que el anfitrión no había mandado. Las estadísticas de la ronda en curso quedan incompletas.
- Cambiar un mensaje o `MatchState` obliga a subir `PROTOCOL_VERSION` (RULE-002); los clientes viejos reciben el error `version`.
- Un jugador que se desconecta no pasa a ser un bot: su catapulta dispara con la última puntería.

## Acceptance Criteria

- [x] El servidor rechaza mensajes de más de 64 KB, JSON roto y tipos desconocidos.
- [x] El cubo de fichas limita la ráfaga y se recarga con el tiempo.
- [x] Los nombres quedan en 16 caracteres como mucho, sin HTML.
- [x] Un espectador que manda `relay` recibe un error y no juega.
- [x] Quien recarga con su token recupera su hueco.
- [x] Si el anfitrión se va en plena partida, otro jugador la hereda y la partida acaba.
- [x] Un anfitrión en segundo plano cede el papel y la partida sigue.
- [x] Un móvil que crea la sala cede el papel a un ordenador al empezar.
- [x] Con 250 ms de latencia, variación y pérdida, los clientes convergen al final de cada ronda.
- [ ] Un `st` con menor `v` se descarta (sin prueba automática; solo en código).

## Evidence

| Type | Reference | Date | Confidence impact |
|------|-----------|------|-------------------|
| Testing | `tests/unit/protocol.test.ts` y `tests/e2e/multiplayer.spec.ts` en CI contra producción | 2026-09-26 | low → medium |

## Traceability

| Relation | Target | Description |
|----------|--------|-------------|
| Implemented in | `shared/protocol.ts` | `PROTOCOL_VERSION`, límites, validación, `TokenBucket` |
| Implemented in | `server/index.ts` | Roles, límites, elección y migración de anfitrión, `yield` |
| Implemented in | `client/src/net/connection.ts` | Reconexión, token, red simulada (`?lag=&jitter=&loss=`) |
| Implemented in | `client/src/game/net/` | `messages.ts`, `netHost.ts`, `netClient.ts`, `interp.ts` |
| Implemented in | `client/src/game/modes/online.ts` | `migrate`, `demote`, cesión en segundo plano |
| Implemented in | `shared/match.ts` | `MatchState.v` |
| Tested by | `tests/unit/protocol.test.ts` | Nombres, mensajes, configuración, cubo de fichas, códigos |
| Tested by | `tests/e2e/multiplayer.spec.ts` | 4 jugadores, espectador, reconexión, migración, segundo plano, móvil, revancha, red mala |
| Decided in | D-027 a D-033, D-039, D-040, D-057, D-064, D-065 | Tic, `full`, interpolación, migración, puntería, espectadores, compresión, red mala |

## Open Questions

- D-064 dice que se descarta un `st` o `full` viejo, pero `applyFull` aplica igualmente los bloques y poses de un `full` viejo; solo se ignora su `MatchState`. ¿Es lo que se quiere? — dimas

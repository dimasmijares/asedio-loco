---
id: FEAT-REPLAY-001
type: spec
layer: feature
status: active
confidence: medium
version: 1.1.0
created: 2026-09-26
updated: 2026-09-28
owner: dimas
dependencies:
  - id: FEAT-CAMARA-001
    relation: extends
  - id: DOM-JUEGO-001
    relation: constrained-by
  - id: ARCH-002
    relation: constrained-by
  - id: ARCH-003
    relation: constrained-by
  - id: RULE-002
    relation: constrained-by
supersedes: null
tags:
  - repeticion
  - camara-lenta
  - replay
---

# FEAT-REPLAY-001 — Repetición de la caída de un rey

## Intent

La caída de un rey es el momento más importante de la partida, y en directo pasa en medio de otros disparos. Esta especificación fija cómo se repite a cámara lenta y desde cerca, igual para todos, sin volver a simular la física.

## Definition

### Purpose

Grabar en cada cliente lo que llega a su vista y, cuando cae un rey, reproducir ese tramo en una fase propia de la partida (`replay`), entre el impacto y los resultados.

### Inputs

| Input | Type | Required | Notes |
|---|---|---|---|
| Poses en directo | `WorldView.setBody` | Sí | De la simulación local o de la red interpolada |
| Eventos en directo | `SimEvent` vía `WorldView.apply` | Sí | Incluye `king {slot}` con la hora de la caída |
| `MatchState.phase = 'replay'` y `replay: number[]` | Estado del anfitrión | Sí | Reyes a repetir, en orden de caída |
| `replayDuration` | número | Sí | 5 s por rey (1,5 s con `?fast=1`) |

### Behavior

1. **Grabación** (`ReplayRecorder`), en todos los clientes y siempre:
   - Poses en un búfer circular de 120.000 entradas (unos 4 MB). Cada cuerpo se graba como mucho a 30 Hz, con un 10 % de margen.
   - Eventos de los últimos 15 s (tope de 4000).
   - Los tiempos se guardan relativos a `base` (Float32). Al empezar una ronda, si han pasado más de 600 s desde `base`, se reinicia el origen y se pierde lo grabado.
2. **Fase `replay`** (anfitrión, `MatchHost.endImpact`): si en la ronda cayó algún rey, entra en `replay` con los 2 primeros como mucho (`REPLAY_MAX`). La fase dura `5 s × reyes` y la física se pausa (`simPaused`).
3. **Reproducción** (cada cliente, `MatchUI.nextReplay`), por cada rey de la cola:
   - Ventana: de 2,6 s antes de su caída a 0,8 s después. Se estira para llenar su parte de la fase menos 0,4 s. Con 5 s va a ×0,74; con `?fast=1` va más rápida que el directo.
   - Antes de empezar se reponen los bloques rotos desde el inicio de la ventana y los proyectiles que volaban en ese momento. El rey vuelve a estar vivo y con corona.
   - Los eventos de la ventana se reemiten, con sus efectos y sonidos, salvo `dmg` y `shield`, que son estado.
   - Cámara: a 9 m del rey, girando despacio (0,35 rad/s) y a una altura que ve por encima de las murallas. Rótulo «REPETICIÓN · ¡Cae el rey de …!» y bandas de cine.
   - Si no hay nada grabado de ese rey, se salta.
4. **Vuelta al directo:** lo que llega durante la repetición se aparta. Al terminar se deshace lo repuesto y se aplica lo apartado. Un estado completo (`full`) corta la repetición en el acto.
5. **Migración:** si el nuevo anfitrión hereda la partida en `replay`, pasa directamente a resultados.
6. **Mejor disparo al final** (WRK-TASK-047), en cada cliente y sin mensajes nuevos:
   - Al empezar cada impacto, `WorldView.snapshot` guarda los bloques y los reyes tal como están.
   - Al acabar el impacto, si el jugador que más bloques ha roto en la ronda supera el mejor de la partida, se guarda su tramo: desde 0,2 s antes de su disparo hasta 7 s después (4 s en modo rápido), copiado del búfer a un `ReplayClip` (poses empaquetadas en un `Float32Array` y eventos; como mucho 60 000 poses, unos 2,2 MB). También se guardan la foto y el nivel de la lava. Es la misma cifra que la estadística «Mejor disparo».
   - En la fase `over`, antes de la pantalla final: se vacían los resultados, las cifras de daño y el humo; se pone la foto y la lava de entonces, y se reproduce el tramo a cámara lenta (hasta 9 s; 3 s en modo rápido). La cámara gira a 16 m del punto donde acabó su proyectil (`shotCamera`), con el rótulo «MEJOR DISPARO · nombre · bloques en la ronda N» y las bandas de cine.
   - Se salta con el botón, con cualquier tecla o tocando la pantalla. Al terminar o saltarla vuelve la foto del final y aparece la pantalla final.

### Outputs

| Output | Type | Notes |
|---|---|---|
| Vista reproducida | `WorldView` | Poses y efectos grabados; la física no se toca |
| Clase `.replaying` en el HUD | DOM | Bandas de cine |
| `MatchUI.replaysSeen` | número | Fases de repetición vistas (para las pruebas) |

### Known Limitations

- Solo se repiten los reyes que caen durante la fase de impacto. Los que se lleva la lava al empezar la ronda no tienen repetición.
- Un espectador que entra tarde no ve las repeticiones anteriores a su llegada. Si entra durante una, no tiene nada grabado y ve el plano general.
- Como cada cliente graba lo que le llega, con red mala su repetición puede diferir un poco de la del anfitrión.

## Acceptance Criteria

- [x] El búfer graba cada cuerpo a 30 Hz como mucho y encuentra la hora de la caída de un rey.
- [x] La reproducción aplica poses y eventos en orden y a la velocidad pedida.
- [x] En una partida en red de 4 jugadores, todos ven el mismo número de repeticiones.
- [ ] Con 3 reyes caídos en una ronda, la fase dura 10 s y solo se repiten los 2 primeros (sin prueba).
- [ ] Al terminar la repetición, los bloques en pie coinciden con los del directo (sin prueba específica; lo cubre en parte la consistencia de resultados).

## Evidence

| Type | Reference | Date | Confidence impact |
|------|-----------|------|-------------------|
| Testing | `tests/unit/replay.test.ts`, `tests/e2e/multiplayer.spec.ts` | 2026-09-26 | low → medium |
| Expert review | Capturas de `tests/tools/replay-shots.mjs` | 2026-09-25 | — |
| Testing | WRK-TASK-047: `replay.test.ts` (tramo guardado), `solo.spec.ts` (repetición final y salto), capturas en 1280×720 y 390×844; tramos medidos de 0,9-1,3 MB | 2026-09-28 | — |

## Traceability

| Relation | Target | Description |
|----------|--------|-------------|
| Implemented in | `client/src/game/replay.ts` | `ReplayRecorder`, `ReplayPlayer`, `ReplayClip`, `replayCamera`, `shotCamera` |
| Implemented in | `client/src/game/view.ts` | `startReplay`, `stepReplay`, `endReplay`, `snapshot`, `restoreSnapshot`, `startClip` |
| Implemented in | `client/src/game/match/ui.ts` | Cola de reyes, ventana 2,6 s / 0,8 s, cámara; mejor disparo (`keepBest`, `startFinal`, `endFinal`) |
| Implemented in | `client/src/game/match/host.ts` | Fase `replay`, pausa de la física |
| Implemented in | `shared/match.ts` | `REPLAY_MAX`, `replayDuration` |
| Implemented in | `client/src/game/net/netClient.ts` | `applyFull` corta la repetición |
| Tested by | `tests/unit/replay.test.ts` | Búfer y reproducción |
| Tested by | `tests/e2e/multiplayer.spec.ts` | «4 jugadores hasta el final»: mismas repeticiones en todos |
| Decided in | D-061 | Repetición grabada, no simulada (protocolo v3) |
| External ref | `PLAN.md` etapa 4, decisión D4 del usuario | Petición |

## Open Questions

- `PLAN.md` pedía repetir «los últimos 3-4 s»; la ventana real es de 3,4 s. ¿Se da por buena? — dimas
- ¿Lo ha validado el usuario jugando tras la etapa 4? No consta. — dimas

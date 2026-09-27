---
id: WRK-TASK-047
type: spec
layer: work-task
scope: ephemeral
status: completed
confidence: medium
version: 0.1.0
created: 2026-09-27
updated: 2026-09-27
owner: dimas
parent: WRK-PLAN-010
activates: [FEAT-REPLAY-001, FEAT-SENSACION-001, FEAT-INTERFAZ-001]
tags: [replay, sensacion]
---

# WRK-TASK-047 — Repetición del mejor disparo al final de la partida

## Objective

Cerrar la partida con la repetición del disparo que más bloques rompió, antes de la pantalla final, para que el final tenga un momento memorable.

## File Scope

- `client/src/game/replay.ts` (grabación de más de una ronda o marca del mejor disparo)
- `client/src/game/match/ui.ts` y `host.ts` (fase o secuencia final)
- `shared/match.ts` y `shared/protocol.ts` si cambia la fase `over` (no hizo falta)
- `client/src/game/view.ts` (foto del escenario y reproducción de un tramo), `client/src/ui/style.css` (botón de saltar)
- `tests/unit/replay.test.ts`, `tests/e2e/solo.spec.ts`

## Implementation Notes

Hoy la grabación se reinicia cada ronda (`recorder.rebase`). Hay que conservar el tramo del mejor disparo (ronda, momento y proyectil), que ya se calcula para la estadística «Mejor disparo». Se puede saltar tocando la pantalla o pulsando una tecla. Relacionada con WRK-TASK-011.

## Acceptance Criteria

- [x] Al acabar la partida se ve la repetición del mejor disparo con el rótulo del jugador, en PC y en móvil vertical.
- [x] Se puede saltar.
- [x] Memoria de la grabación acotada (medida).

## Test Plan

| Level | What it covers |
|-------|----------------|
| E2E | `solo` hasta el final con repetición |

## Evidence

2026-09-28. Se hace en cada cliente, con lo que él mismo grabó: no cambian ni la fase `over` ni el protocolo. Detalle en FEAT-REPLAY-001 (punto 6).

- Capturas con GPU (`seed=21`, difícil, modo rápido) en 1280×720 y 390×844: la repetición con su rótulo y las bandas de cine, el botón «Saltar (cualquier tecla)» o «Toca para saltar», y la pantalla final después. En la primera versión seguían a la vista la caja de resultados y el humo de la última ronda, y la lava estaba al nivel final. Ahora se vacían y la lava vuelve al nivel de la ronda del disparo.
- Memoria: un tramo de 4,2 s ocupó entre 0,9 y 1,3 MB (26 000-37 000 poses y 270-411 eventos). El tope es de 60 000 poses (unos 2,2 MB) y solo se guarda un tramo por partida, además de la foto de 560 bloques como mucho. `solo.spec.ts` lo comprueba: 1,3 MB en la última pasada.
- `replay.test.ts`: el tramo reproduce lo mismo que el búfer, sobrevive a `rebase` y respeta el tope. `solo.spec.ts`: la repetición aparece con «MEJOR DISPARO», se salta con una tecla y después sale `#game-over`. La revancha de `multiplayer.spec.ts` también pasa. `npm run verify` en verde (43 unitarios).


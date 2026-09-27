---
id: WRK-TASK-047
type: spec
layer: work-task
scope: ephemeral
status: draft
confidence: low
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
- `shared/match.ts` y `shared/protocol.ts` si cambia la fase `over`

## Implementation Notes

Hoy la grabación se reinicia cada ronda (`recorder.rebase`). Hay que conservar el tramo del mejor disparo (ronda, momento y proyectil), que ya se calcula para la estadística «Mejor disparo». Se puede saltar tocando la pantalla o pulsando una tecla. Relacionada con WRK-TASK-011.

## Acceptance Criteria

- [ ] Al acabar la partida se ve la repetición del mejor disparo con el rótulo del jugador, en PC y en móvil vertical.
- [ ] Se puede saltar.
- [ ] Memoria de la grabación acotada (medida).

## Test Plan

| Level | What it covers |
|-------|----------------|
| E2E | `solo` hasta el final con repetición |

## Evidence

Pendiente.

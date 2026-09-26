---
id: WRK-TASK-011
type: spec
layer: work-task
scope: ephemeral
status: draft
confidence: low
version: 0.1.0
created: 2026-09-26
updated: 2026-09-26
owner: dimas
parent: WRK-PLAN-005
activates:
  - FEAT-REPLAY-001
  - DOM-JUEGO-002
  - RULE-002
tags:
  - repeticion
  - lava
---

# WRK-TASK-011 — Repetición de los reyes que se lleva la lava

## Objective

Que un rey que cae porque la lava sube al empezar la ronda tenga también su repetición, como los que caen en la fase de impacto.

## File Scope

Propuesto:

- `client/src/game/match/host.ts` (hoy solo las eliminaciones del impacto, `roundElims`, abren la fase `replay`)
- `shared/match.ts` (duración de la fase)
- `client/src/game/replay.ts`, `client/src/game/match/ui.ts` (tramo que se reproduce y rótulo)
- `tests/unit/replay.test.ts`, `tests/e2e/multiplayer.spec.ts`

Fuera: la lava en sí (`client/src/game/sim/`).

## Implementation Notes

| Activated spec | What it requires of this task |
|----------------|-------------------------------|
| FEAT-REPLAY-001 | Repetición grabada, no simulada; el anfitrión marca la fase y todos la ven a la vez (D-061) |
| DOM-JUEGO-002 | La lava hunde los bloques a 0,6 m/s (D-020): la caída es lenta y puede pedir un tramo más largo |
| RULE-002 | Si cambia `MatchState`, subir `PROTOCOL_VERSION` |

- Hay que decidir cuándo se ve: justo tras subir la lava o al final de la ronda junto a las demás. Lo segundo encaja con lo que ya existe (como mucho 2 reyes, `REPLAY_MAX`).

## Acceptance Criteria

- [ ] Con `?fast=1` (lava cada ronda), un rey que cae por la lava tiene su repetición con rótulo.
- [ ] Todos los clientes entran y salen de `replay` en la misma ronda.
- [ ] Si en la ronda caen más de 2 reyes, se respeta el tope de 2 repeticiones.

## Test Plan

| Level | What it covers |
|-------|----------------|
| Unit | Elección del tramo del búfer para una caída lenta |
| Integration | La E2E de 4 jugadores cuenta también las repeticiones por lava |
| Manual | Revisión con `node tests/tools/replay-shots.mjs` |

## Evidence

Pendiente.

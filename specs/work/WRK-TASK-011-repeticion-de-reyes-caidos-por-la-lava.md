---
id: WRK-TASK-011
type: spec
layer: work-task
scope: ephemeral
status: completed
confidence: medium
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

- `tests/e2e/repeticion-lava.spec.ts` (nueva, en el grupo `basicas` de CI)

Fuera: la lava en sí (`client/src/game/sim/`).

## Implementation Notes

| Activated spec | What it requires of this task |
|----------------|-------------------------------|
| FEAT-REPLAY-001 | Repetición grabada, no simulada; el anfitrión marca la fase y todos la ven a la vez (D-061) |
| DOM-JUEGO-002 | La lava hunde los bloques a 0,6 m/s (D-020): la caída es lenta y puede pedir un tramo más largo |
| RULE-002 | Si cambia `MatchState`, subir `PROTOCOL_VERSION` |

- Hay que decidir cuándo se ve: justo tras subir la lava o al final de la ronda junto a las demás. Lo segundo encaja con lo que ya existe (como mucho 2 reyes, `REPLAY_MAX`).

## Acceptance Criteria

- [x] Con `?fast=1` (lava cada ronda), un rey que cae por la lava tiene su repetición con rótulo.
- [x] Todos los clientes entran y salen de `replay` en la misma ronda.
- [x] Si en la ronda caen más de 2 reyes, se respeta el tope de 2 repeticiones.

## Test Plan

| Level | What it covers |
|-------|----------------|
| Unit | Elección del tramo del búfer para una caída lenta |
| Integration | La E2E de 4 jugadores cuenta también las repeticiones por lava |
| Manual | Revisión con `node tests/tools/replay-shots.mjs` |

## Evidence

2026-09-28. Se ve al final de la ronda, junto a las demás, como proponía la tarea: encaja con la fase `replay` que ya existe y con su tope de 2 reyes (`REPLAY_MAX`).

- `MatchHost`: `roundElims` se vacía en `beginRound` y no en `beginImpact`, así que cuenta también a los reyes que caen en el apuntado o en la cuenta atrás. Todos los clientes entran en `replay` por el `st` del anfitrión, como con las demás caídas.
- `ReplayRecorder`: eventos de 45 s (antes 15), porque la caída pasó al empezar la ronda y la repetición llega al acabar el impacto, unos 30 s después. Tope de 12 000 eventos. El anterior (`length > 4000`) no quitaba nada si todos eran recientes. Durante el apuntado casi nada se mueve, así que las poses del tramo siguen en el búfer.
- Rótulo «La lava se lleva al rey de …» cuando la causa es la lava.
- `replay.test.ts`: una caída de hace 30 s sigue en el búfer con sus poses y desaparece pasados 45 s. `repeticion-lava.spec.ts` (modo rápido): en la ronda 3 lleva a un rey a la lava en pleno apuntado (la causa la pone la simulación, `lava`) y comprueba que al acabar el impacto entra en `replay` con ese rey, el rótulo de la lava y como mucho 2 repeticiones. 2 de 2. La prueba de 4 jugadores, que compara las repeticiones de todos los clientes, pasa 2 de 2.
- Hallazgo de WRK-TASK-047: en la prueba de 4 jugadores, un invitado esperaba `#game-over` con el plazo por defecto de 5 s, y la repetición del mejor disparo que va antes lo dejaba justo; falló una vez. Ahora espera 20 s.


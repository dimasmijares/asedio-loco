---
id: WRK-TASK-087
type: spec
layer: work-task
scope: ephemeral
status: completed
confidence: medium
version: 0.1.0
created: 2026-10-03
updated: 2026-10-03
owner: dimas
parent: WRK-PLAN-011
activates: [FEAT-INTERFAZ-001, FEAT-BOTS-001]
dependencies:
  - id: WRK-TASK-086
    relation: depends-on
tags: [interfaz, bots, menus]
---

# WRK-TASK-087 — Los rivales de «Jugar solo» son los de la partida (R-10)

## Objective

Retoque de R-10 del usuario (03-10-2026): «Jugar solo» anunciaba unos rivales (por ejemplo «Reina Rúter, Sir Bot y Lady Pixel» con ☾ ★ ϟ) y en la partida salían otros (Conde Clic, Reina Rúter y Sir Bot). Una sola fuente para la pantalla y la partida, que use también la sala (R-11).

## Diagnosis

La pantalla sorteaba los nombres desde un punto al azar y se los pasaba a la partida, pero una partida que empezaba sin pasar por esa pantalla (recargar en `#solo`, las capturas, las pruebas) volvía a sortearlos con la semilla, y la sala usaba una tercera regla (`BOT_NAMES[hueco]`).

## File Scope

- `shared/players.ts` (`BOT_NAMES`, `botName`, `soloSlots`), `shared/match.ts` (bots de la sala), `client/src/game/modes/solo.ts`, `client/src/ui/lobby.ts`, `client/src/main.ts`
- `tests/unit/players.test.ts`, `tests/e2e/portada.spec.ts`

## Implementation Notes

| Activated spec | What it requires of this task |
|----------------|-------------------------------|
| FEAT-INTERFAZ-001 | «Jugar solo»: emblemas y nombres de los rivales |
| FEAT-BOTS-001 | Nombres de los bots |

- El bot de cada hueco se llama siempre igual: 1 Conde Clic, 2 Reina Rúter, 3 Sir Bot (0 Lady Pixel, solo en una sala si el hueco 0 queda libre). `soloSlots(bots)` da los huecos de una partida en solitario (tú en el 0; con un rival, el de enfrente).
- «Jugar solo», `SoloMode` y la sala (`matchPlayersFromRoom`) usan las dos funciones; ya no se pasan nombres de la pantalla a la partida.

## Acceptance Criteria

- [x] Con 1, 2 y 3 rivales, los emblemas y nombres de «Jugar solo» son los de la partida, entre o no por esa pantalla.
- [x] La sala rellena con los mismos bots.

## Test Plan

| Level | What it covers |
|-------|----------------|
| Unit | `tests/unit/players.test.ts` (huecos, nombres y sala) |
| E2E | `tests/e2e/portada.spec.ts` («jugar solo»: los rivales anunciados son los de la partida) |

## Evidence

2026-10-03. Unitarios y `portada.spec.ts` en verde.

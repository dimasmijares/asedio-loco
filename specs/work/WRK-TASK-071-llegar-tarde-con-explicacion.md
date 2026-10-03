---
id: WRK-TASK-071
type: spec
layer: work-task
scope: ephemeral
status: completed
confidence: medium
version: 0.1.0
created: 2026-09-28
updated: 2026-10-03
owner: dimas
parent: WRK-PLAN-011
activates: [FEAT-SALAS-001, FEAT-INTERFAZ-001]
dependencies:
  - id: WRK-TASK-064
    relation: depends-on
tags: [flujo, salas]
---

# WRK-TASK-071 — Llegar tarde con explicación

## Objective

F7: quien entra con la partida empezada ve «Partida en curso: entrarás a jugar en la próxima» y el marcador. Aprobado por el usuario en R-07 (28-09-2026); detalle en WRK-TASK-064.

## File Scope

- `client/src/ui/`, `client/src/main.ts`, `client/src/game/match/ui.ts`, `client/src/game/modes/`, `server/index.ts` y `shared/protocol.ts` según la mejora
- `tests/e2e/`

## Implementation Notes

- Sin maqueta propia: la hoja usa la de «Te han eliminado» (R-13 V5, `showSheet` centrada con icono) y la píldora, la de «Eliminado · estás mirando» (`Hud.setSpectTag`), que comparte con el espectador (WRK-TASK-073).
- `OnlineMode` la muestra si entras como espectador; hay plaza en la próxima si la sala no tiene cuatro humanos (la plaza de un bot cuenta, WRK-TASK-070).

## Acceptance Criteria

- [x] La mejora funciona en PC (1280×720) y en móvil vertical (390×844), con una E2E que la recorre (`tests/e2e/sala.spec.ts`, «llegar tarde»).
- [x] Si cambia el protocolo, sube `PROTOCOL_VERSION` (RULE-002): no cambia.

## Test Plan

| Level | What it covers |
|-------|----------------|
| E2E | `tests/e2e/sala.spec.ts`: hoja «Partida en curso», píldora, marcador sin botón de disparo y, en la revancha, a jugar |

## Evidence

2026-10-03. `sala.spec.ts` en verde en local.

---
id: WRK-TASK-068
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
activates: [FEAT-SALAS-001, RULE-002]
dependencies:
  - id: WRK-TASK-064
    relation: depends-on
tags: [flujo, salas]
---

# WRK-TASK-068 — Revancha en un paso

## Objective

F2: «Revancha» empieza otra partida con los mismos jugadores y ajustes sin pasar por la sala; botón secundario «Volver a la sala». Aprobado por el usuario en R-07 (28-09-2026); detalle en WRK-TASK-064.

## File Scope

- `client/src/ui/`, `client/src/main.ts`, `client/src/game/match/ui.ts`, `client/src/game/modes/`, `server/index.ts` y `shared/protocol.ts` según la mejora
- `tests/e2e/`

## Implementation Notes

- Protocolo 15: mensaje `rematch` y `RoomState.game` (partidas empezadas en la sala). `Room.begin` reúne lo común de EMPEZAR y la revancha (fuera desconectados, al menos 2 castillos, la física a un ordenador si el anfitrión es un móvil) y `seatSpectators` sienta a los espectadores en la revancha y al volver a la sala.
- `main.ts` remonta la partida cuando cambia `room.game` sin salir de `inGame`.
- Pantalla final en red: REVANCHA y VOLVER A LA SALA para el anfitrión, «Esperando a que <anfitrión> pida la revancha» para los demás, y SALIR (`MatchUI.renderOverActions`, se rehace si cambia el anfitrión). El estilo «Atardecer» de la pantalla final va aparte.
- Gancho de pruebas `MatchHost.endNow()`: acaba la partida al momento (gana quien tiene más bloques en pie).

## Acceptance Criteria

- [x] La mejora funciona en PC (1280×720) y en móvil vertical (390×844), con una E2E que la recorre (`tests/e2e/sala.spec.ts`, «revancha en un paso y volver a la sala»).
- [x] Si cambia el protocolo, sube `PROTOCOL_VERSION` (RULE-002): 15.

## Test Plan

| Level | What it covers |
|-------|----------------|
| E2E | `tests/e2e/sala.spec.ts`: botones del anfitrión y del invitado, revancha sin pasar por la sala con los mismos jugadores y el bot, volver a la sala con las mismas plazas; `multiplayer.spec.ts` («revancha»), tras una partida entera |

## Evidence

2026-10-03. `sala.spec.ts` (12 pruebas) y `multiplayer.spec.ts -g revancha` en verde en local.

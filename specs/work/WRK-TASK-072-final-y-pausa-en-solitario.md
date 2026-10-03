---
id: WRK-TASK-072
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
activates: [FEAT-INTERFAZ-001, PROD-JUGAR-001]
dependencies:
  - id: WRK-TASK-064
    relation: depends-on
tags: [flujo, salas]
---

# WRK-TASK-072 — Final y pausa en solitario

## Objective

F8 y F9: al final, «Otra partida», «Cambiar rivales» y «Salir»; abrir el engranaje pausa la partida en solitario. Aprobado por el usuario en R-07 (28-09-2026); detalle en WRK-TASK-064.

## File Scope

- `client/src/ui/`, `client/src/main.ts`, `client/src/game/match/ui.ts`, `client/src/game/modes/`, `server/index.ts` y `shared/protocol.ts` según la mejora
- `tests/e2e/`

## Implementation Notes

- Final en solitario: OTRA PARTIDA (`rematchLabel`), CAMBIAR RIVALES (`onChangeRivals`: `main.ts` desmonta el juego y abre «Jugar solo» con los rivales y la dificultad de la partida, `openSoloSetup`) y SALIR.
- Pausa: el engranaje avisa al abrirse y cerrarse (`SettingsExtra.onOpen/onClose`, WRK-TASK-067); `SoloMode.pause` deja de avanzar el anfitrión y para la física, y recuerda si ya estaba parada (repeticiones). La confirmación de salir también pausa. El panel dice «Partida en pausa».

## Acceptance Criteria

- [x] La mejora funciona en PC (1280×720) y en móvil vertical (390×844), con una E2E que la recorre (`tests/e2e/sala.spec.ts`, «pausa y final en solitario»).
- [x] Si cambia el protocolo, sube `PROTOCOL_VERSION` (RULE-002): no cambia.

## Test Plan

| Level | What it covers |
|-------|----------------|
| E2E | `tests/e2e/sala.spec.ts`: el reloj no corre con el engranaje abierto; OTRA PARTIDA, CAMBIAR RIVALES con lo elegido y empezar con otros |

## Evidence

2026-10-03. `sala.spec.ts` en verde en local.

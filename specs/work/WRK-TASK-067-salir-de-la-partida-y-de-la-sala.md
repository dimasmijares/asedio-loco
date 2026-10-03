---
id: WRK-TASK-067
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
activates: [FEAT-SALAS-001, FEAT-INTERFAZ-001, RULE-002]
dependencies:
  - id: WRK-TASK-064
    relation: depends-on
tags: [flujo, salas]
---

# WRK-TASK-067 — Salir de la partida y de la sala

## Objective

F1 y F3: «Salir de la partida» en el engranaje con confirmación (online, tu castillo pasa a bot desde la ronda siguiente; en solitario, a la portada) y «Salir de la sala» en el lobby con mensaje `leave` que libera la plaza al momento; si sale el anfitrión, hereda otro. Aprobado por el usuario en R-07 (28-09-2026); detalle en WRK-TASK-064.

## File Scope

- `client/src/ui/`, `client/src/main.ts`, `client/src/game/match/ui.ts`, `client/src/game/modes/`, `server/index.ts` y `shared/protocol.ts` según la mejora
- `tests/e2e/`

## Implementation Notes

- Mensaje `leave` (protocolo 13): el servidor quita al jugador de la sala, libera la plaza y, si era el anfitrión, elige otro (en la sala, por orden de plaza, para que la confirmación pueda decir quién; en partida, primero los ordenadores). `Connection.leave()` olvida el token.
- Hoja de confirmación común (`client/src/ui/sheet.ts`): abajo en vertical y centrada en horizontal; SALIR en grana, QUEDARME en crema; el foco va a QUEDARME.
- Engranaje en partida: `openSettings` acepta «Salir de la partida» y avisos al abrirse y cerrarse (la pausa en solitario, WRK-TASK-072, se engancha ahí).
- Sala: píldora «Salir de la sala» y engranaje arriba (R-11 S4); el resto de la sala nueva llega con WRK-TASK-069 y 070.

## Acceptance Criteria

- [x] La mejora funciona en PC (1280×720) y en móvil vertical (390×844), con una E2E que la recorre (`tests/e2e/sala.spec.ts`).
- [x] Si cambia el protocolo, sube `PROTOCOL_VERSION` (RULE-002): 13.

## Test Plan

| Level | What it covers |
|-------|----------------|
| E2E | `tests/e2e/sala.spec.ts`: salir de la sala (plaza libre al momento, herencia del anfitrión), de una partida en red y de una en solitario, en PC y móvil vertical |

## Evidence

2026-10-03. `sala.spec.ts` en verde en local (6 pruebas, tres dispositivos a la vez).

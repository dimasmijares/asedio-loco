---
id: WRK-TASK-070
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

# WRK-TASK-070 — Sala gestionada tocando las plazas y nombre editable

## Objective

F5 y F6: el anfitrión toca «Plaza libre» para añadir un bot, un bot para quitarlo y un desconectado para quitarlo; nombre editable en la sala y, si se deja vacío, uno divertido al azar. Aprobado por el usuario en R-07 (28-09-2026); detalle en WRK-TASK-064.

## File Scope

- `client/src/ui/`, `client/src/main.ts`, `client/src/game/match/ui.ts`, `client/src/game/modes/`, `server/index.ts` y `shared/protocol.ts` según la mejora
- `tests/e2e/`

## Implementation Notes

- R-11 S2, S3, S5, S6, D1 y D2 (maquetas «Móvil · Sala», «Sala (invitado)», «Sala, cambiando el nombre» y «PC · Sala»).
- Protocolo 14: `config.bots` (un número) pasa a `config.botSlots` (las plazas con bot) y el mensaje `seat {slot, bot}` las cambia; `config` ya no las acepta. El servidor da a un humano nuevo la primera plaza libre y, si no hay, la del primer bot (`freeSlot`). `matchPlayersFromRoom` pone cada bot en su plaza con `botName(slot)`.
- `?bots=N` (pruebas) pone los bots en las plazas libres desde la última, para que los invitados que entren después ocupen las primeras, como antes.
- Nombre en la sala: mensaje `name` (ya existía) y `asedio.name`; el campo se conserva (foco y selección) cuando la sala se redibuja.
- Las pruebas locales comprueban también la versión del protocolo del servidor del 8787 (`global-setup.ts`): un `wrangler dev` viejo dejaba las pruebas esperando.

## Acceptance Criteria

- [x] La mejora funciona en PC (1280×720) y en móvil vertical (390×844), con una E2E que la recorre (`tests/e2e/sala.spec.ts`, «plazas, dificultad y nombre se ven en los dos dispositivos»).
- [x] Si cambia el protocolo, sube `PROTOCOL_VERSION` (RULE-002): 14.

## Test Plan

| Level | What it covers |
|-------|----------------|
| Unit | `tests/unit/protocol.test.ts` (`seat`, `config` sin plazas) y `tests/unit/players.test.ts` (cada bot en su plaza) |
| E2E | `tests/e2e/sala.spec.ts`: EMPEZAR desactivado solo, invitado sin controles y esperando por nombre, bots por plaza con su nombre, dificultad, quitar bots y desconectados, nombre con lápiz, dado y vacío, todo visto en los dos dispositivos; dentro de la pantalla, sin cruces y de 44 px o más |

## Evidence

2026-10-03. En la portada, el nombre ya es al azar desde la primera vez y se edita con el lápiz (vacío, otro al azar), con la portada de R-10 (WRK-TASK-081); falta editarlo dentro de la sala y gestionar las plazas.

2026-10-03. Hecho; `sala.spec.ts` (11 pruebas con `lobby.spec.ts`) y unitarios en verde en local.

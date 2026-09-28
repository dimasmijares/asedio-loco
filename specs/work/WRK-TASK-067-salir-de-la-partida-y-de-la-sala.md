---
id: WRK-TASK-067
type: spec
layer: work-task
scope: ephemeral
status: draft
confidence: low
version: 0.1.0
created: 2026-09-28
updated: 2026-09-28
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

## Acceptance Criteria

- [ ] La mejora funciona en PC (1280×720) y en móvil vertical (390×844), con una E2E que la recorre.
- [ ] Si cambia el protocolo, sube `PROTOCOL_VERSION` (RULE-002).

## Test Plan

| Level | What it covers |
|-------|----------------|
| E2E | El recorrido de la mejora |

## Evidence

Pendiente.

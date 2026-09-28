---
id: WRK-TASK-068
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

## Acceptance Criteria

- [ ] La mejora funciona en PC (1280×720) y en móvil vertical (390×844), con una E2E que la recorre.
- [ ] Si cambia el protocolo, sube `PROTOCOL_VERSION` (RULE-002).

## Test Plan

| Level | What it covers |
|-------|----------------|
| E2E | El recorrido de la mejora |

## Evidence

Pendiente.

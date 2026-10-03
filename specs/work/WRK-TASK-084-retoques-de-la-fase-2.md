---
id: WRK-TASK-084
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
activates: [FEAT-INTERFAZ-001]
dependencies:
  - id: WRK-TASK-083
    relation: depends-on
tags: [interfaz, hud, movil, resultados]
---

# WRK-TASK-084 — Retoques de la fase 2 (R-10 fase 3)

## Objective

Dos retoques que pidió el usuario al revisar la fase 2 de R-10: la píldora de la ronda en los resultados y el sitio de la marca de «listo» en los chips de jugador.

## File Scope

- `client/src/game/match/ui.ts` (píldora de los resultados), `client/src/ui/style.css` (chips del móvil vertical)
- `tests/e2e/touch.spec.ts`, `tests/e2e/hud-compact.spec.ts`

## Implementation Notes

| Activated spec | What it requires of this task |
|----------------|-------------------------------|
| FEAT-INTERFAZ-001 | Píldora `#hud-round` y chips de `#hud-players` (puntos 4 y 9) |

- **Resultados:** la píldora dice «Ronda N · resultados» y pierde el círculo de los segundos (`Hud.setPhase` con el texto de la píldora), en PC y en móvil.
- **Chips de jugador:** la marca de listo, la cruz o la desconexión van a la derecha del nombre, como en PC, y no sobre el emblema (deshace la decisión del 03-10-2026 de la fase 2). En móvil vertical la marca mide 11 px para dejarle sitio al nombre; con la marca, un nombre corto largo se abrevia con «…» (con 86 px de chip no hay sitio para más: la maqueta tiene el mismo límite).

## Acceptance Criteria

- [x] En los resultados, la píldora dice «Ronda N · resultados» y no lleva segundos.
- [x] En móvil vertical, la marca de listo queda a la derecha del nombre, fuera del emblema y dentro del chip.

## Test Plan

| Level | What it covers |
|-------|----------------|
| E2E | `tests/e2e/touch.spec.ts` («tras disparar»: marca y píldora de resultados), `hud-compact.spec.ts` (nombres sin recortar cuando no hay marca) |

## Evidence

2026-10-03. `touch.spec.ts` y `hud-compact.spec.ts` en verde en local; capturas con GPU de los resultados en móvil.

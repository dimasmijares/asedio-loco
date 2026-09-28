---
id: WRK-TASK-073
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
activates: [FEAT-CAMARA-001, FEAT-INTERFAZ-001]
dependencies:
  - id: WRK-TASK-061
    relation: depends-on
tags: [interfaz, espectador]
---

# WRK-TASK-073 — Selector de castillos del espectador

## Objective

Decisión del usuario (28-09-2026, WRK-TASK-061): cuando te eliminan, a la derecha y en pequeño, un castillo por jugador con su nombre y cuánto le queda; al tocarlo, la cámara va a ese castillo. Sustituye a las flechas ◀ ▶ del espectador. Propuesta en el lienzo: R-05.

## File Scope

- `client/src/ui/hud.ts`, `client/src/ui/style.css`, `client/src/game/match/ui.ts` (`cycleWatch`)
- `tests/e2e/espectador.spec.ts`
- `specs/feature/FEAT-CAMARA-001-camara-y-director.md`

## Acceptance Criteria

- [x] R-05 aprobado (28-09-2026).
- [ ] Selector visible solo para el espectador, en PC y móvil vertical, sin solapes (`hud-compact`); tocar un castillo mueve la cámara; «Todos», al plano general.
- [ ] Sin flechas ◀ ▶ en ningún caso.

## Test Plan

| Level | What it covers |
|-------|----------------|
| E2E | `espectador.spec.ts` con el selector |

## Evidence

Pendiente.

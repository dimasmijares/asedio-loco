---
id: WRK-TASK-053
type: spec
layer: work-task
scope: ephemeral
status: draft
confidence: low
version: 0.1.0
created: 2026-09-28
updated: 2026-09-28
owner: dimas
parent: WRK-PLAN-010
activates: [FEAT-SENSACION-001]
dependencies:
  - id: WRK-TASK-050
    relation: depends-on
tags: [graficos, revision]
---

# WRK-TASK-053 — Revisión de la iluminación por el usuario

## Objective

Que el usuario apruebe, o pida ajustar, la iluminación de WRK-TASK-050, que ya está en producción. Las capturas antes y después, en PC y en móvil vertical, están en la página «Luz del atardecer» (https://claude.ai/artifact/JM86XSLBDrPBxPsUvzoFYB).

## File Scope

- `client/src/game/render/materials.ts` (`AO_APPLY`) y `client/src/game/render/stage.ts` (luces), solo si el usuario pide un ajuste

## Implementation Notes

Sale de WRK-TASK-050: su criterio pedía la aprobación del usuario, y el usuario no estaba cuando se terminó (28-09-2026). Si pide más o menos intensidad, las palancas son los mínimos de `aoBlock` (0,8) y `aoGround` (0,78) y la luz ambiente (1,2) frente al sol (2,65).

## Acceptance Criteria

- [ ] El usuario aprueba las capturas o pide un ajuste, que se aplica con capturas nuevas en PC y en móvil vertical.

## Test Plan

| Level | What it covers |
|-------|----------------|
| Capturas | Las mismas vistas que en WRK-TASK-050 |

## Evidence

Pendiente.

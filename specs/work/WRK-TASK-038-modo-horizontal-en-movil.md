---
id: WRK-TASK-038
type: spec
layer: work-task
scope: ephemeral
status: active
confidence: low
version: 0.1.0
created: 2026-09-27
updated: 2026-09-27
owner: dimas
parent: WRK-PLAN-009
activates: [FEAT-INTERFAZ-001, FEAT-CAMARA-001]
tags: [movil, interfaz]
---

# WRK-TASK-038 — Modo horizontal en móvil

## Objective

Que jugar con el móvil en horizontal sea cómodo y claro, sin empeorar el vertical ni el PC.

## File Scope

- `client/src/ui/style.css` (HUD compacto de poca altura)
- `client/src/game/camera.ts` si hace falta

## Implementation Notes

Se revisa con capturas en 740×360, 863×360 y 915×412 qué estorba en cada fase: apuntado, cuenta atrás, impacto, resultados y final.

## Acceptance Criteria

- [ ] Capturas antes y después en los 3 tamaños.
- [ ] `hud-compact.spec.ts` sin solapes.

## Test Plan

| Level | What it covers |
|-------|----------------|
| E2E | `hud-compact`, `touch` |

## Evidence

Pendiente.

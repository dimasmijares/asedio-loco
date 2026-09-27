---
id: WRK-TASK-049
type: spec
layer: work-task
scope: ephemeral
status: draft
confidence: low
version: 0.1.0
created: 2026-09-27
updated: 2026-09-27
owner: dimas
parent: WRK-PLAN-010
activates: [FEAT-SENSACION-001, ARCH-005, RULE-004]
tags: [graficos]
---

# WRK-TASK-049 — Polvo y humo persistentes tras un derrumbe

## Objective

Que tras un derrumbe quede una columna de polvo y humo que se disipa despacio (8-12 s), para que el destrozo se vea durante los resultados y la ronda siguiente.

## File Scope

- `client/src/game/render/fx.ts` (partículas de larga vida o nube con sombreador)
- `client/src/game/view.ts` (disparo del efecto según el destrozo)

## Implementation Notes

Mejor una nube de pocas partículas grandes y translúcidas, o un sombreador sobre un plano, que cientos de partículas. Topes según la calidad (`FX_CAP`) y menos densidad en calidad baja.

## Acceptance Criteria

- [ ] El humo se ve en los resultados en PC y en móvil vertical (capturas).
- [ ] `perf.spec.ts` y el banco `cpu=4 movil` dentro del presupuesto.

## Test Plan

| Level | What it covers |
|-------|----------------|
| E2E | `perf` |
| Capturas | Resultados de una ronda con derrumbe |

## Evidence

Pendiente.

---
id: WRK-TASK-031
type: spec
layer: work-task
scope: ephemeral
status: active
confidence: low
version: 0.1.0
created: 2026-09-26
updated: 2026-09-26
owner: dimas
parent: WRK-PLAN-007
activates: [DOM-JUEGO-003, RULE-001, RULE-004]
tags: [municion, equilibrio]
---

# WRK-TASK-031 — Épicas: agujero negro, imán con retroceso y alud

## Objective

Que las tres épicas sean las más destructivas (18-26 bloques), cada una con una firma inconfundible.

## File Scope

- `client/src/game/sim/sim.ts` (campos de fuerza)
- `client/src/game/sim/projectiles.ts` (agujero negro, imán, bola de nieve)

## Implementation Notes

- Agujero negro: núcleo algo mayor y más fuerza cerca; al cerrarse escupe lo que no se ha tragado, en una implosión que empuja hacia fuera.
- Imán: sigue arrancando el hierro; al acabar el campo **lanza el hierro acumulado** contra el castillo apuntado como segunda oleada. Así destroza aunque el castillo tenga poco hierro.
- Bola de nieve: crece más rápido y hasta ~2 m, rueda hacia el castillo apuntado y rompe al aplastar (fractura por peso).

## Acceptance Criteria

- [ ] Las tres en 18-26 bloques.
- [ ] Firmas distintas en la prueba: agujero negro con la menor dispersión, bola de nieve con la mayor y el imán con más hierro roto.
- [ ] Como mucho 4 de 12 reyes cada una.
- [ ] Banco sin bajar del presupuesto (RULE-004).

## Test Plan

| Level | What it covers |
|-------|----------------|
| Medición | `destrozo` (12 disparos) y `balance` normal y difícil con `GAMES=8`, antes y después |
| E2E | Grupos `fisica` y `solitario` |

## Evidence

Pendiente.

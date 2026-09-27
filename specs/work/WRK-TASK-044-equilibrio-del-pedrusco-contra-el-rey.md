---
id: WRK-TASK-044
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
activates: [DOM-JUEGO-003, RULE-001]
tags: [equilibrio, municion]
---

# WRK-TASK-044 — Equilibrio del pedrusco contra el rey

## Objective

El pedrusco, que es común, mata al rey en 5 de 12 impactos directos en la prueba de destrozo, más que cualquier rara o épica (todas por aplastamiento). Llevarlo a como mucho 3 de 12 sin sacarlo de su franja de 9-11 bloques.

## File Scope

- `client/src/game/sim/projectiles.ts` o `shared/ammo.ts` (pedrusco)
- `client/src/game/sim/sim.ts` si hace falta un factor por munición en el aplastamiento
- `tests/balance/`

## Implementation Notes

Posibles palancas: menor densidad o radio, `plowKeep` más bajo al atravesar la jaula de cristal, o un factor de aplastamiento del rey por munición. La prueba de destrozo ya informa de la causa de cada muerte del rey.

## Acceptance Criteria

- [ ] Pedrusco en 9-11 bloques y como mucho 3 de 12 reyes (12 disparos).
- [ ] Equilibrio de difícil medido antes y después (12 partidas).

## Test Plan

| Level | What it covers |
|-------|----------------|
| Medición | Destrozo y equilibrio |

## Evidence

Pendiente.

---
id: WRK-TASK-030
type: spec
layer: work-task
scope: ephemeral
status: draft
confidence: low
version: 0.1.0
created: 2026-09-26
updated: 2026-09-26
owner: dimas
parent: WRK-PLAN-007
activates: [DOM-JUEGO-003, RULE-001]
tags: [municion, equilibrio]
---

# WRK-TASK-030 — Piano perforador

## Objective

Que el piano hunda una columna de arriba abajo: 15-20 bloques, el mejor contra torres y contra el rey si se acierta encima.

## File Scope

- `client/src/game/sim/projectiles.ts` (piano)
- `shared/ammo.ts` (densidad)

## Implementation Notes

- Más pesado (densidad de 3 a ~6), y solo él conserva más velocidad al romper un bloque (hoy el 60 %, D-013) para atravesar pisos.
- Al tocar el suelo o quedarse parado, «acorde final»: onda corta de ~2,5 m que remata la base de la columna.

## Acceptance Criteria

- [ ] Piano en 15-20 bloques, con la altura mínima de daño más baja de todas (llega al suelo).
- [ ] Como mucho 3 de 12 reyes.

## Test Plan

| Level | What it covers |
|-------|----------------|
| Medición | `destrozo` (12 disparos) y `balance` normal y difícil con `GAMES=8`, antes y después |
| E2E | Grupos `fisica` y `solitario` |

## Evidence

Pendiente.

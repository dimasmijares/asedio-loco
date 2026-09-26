---
id: WRK-TASK-021
type: spec
layer: work-task
scope: ephemeral
status: draft
confidence: medium
version: 0.1.0
created: 2026-09-26
updated: 2026-09-26
owner: dimas
parent: WRK-PLAN-005
activates: [DOM-JUEGO-003, RULE-001, FEAT-BOTS-001]
tags: [equilibrio, municion]
---

# WRK-TASK-021 — Equilibrio del imán, el tronco y la gallina

## Objective

Según `tests/balance/destrozo.txt`, con los castillos de 140 bloques el imán rompe 24,2 bloques por disparo y mata al rey en 4 de 6, mientras que el tronco (1,7) y la gallina (2,5) siguen flojos, frente a una media de 8,8. Hay que decidir con el usuario si se ajusta y cuánto.

## File Scope

- `client/src/game/sim/projectiles.ts` y `shared/ammo.ts` (parámetros de las tres municiones)
- `tests/balance/` (resultados nuevos)

Fuera: las demás municiones y los reyes (D-053, ADR-010).

## Implementation Notes

Decisión previa del usuario: ¿el imán debe ser la épica que más destroza, o igualarse a las demás? ¿Importa que el tronco y la gallina sean flojos, si son comunes o raras?

## Acceptance Criteria

- [ ] Destrozo, equilibrio (normal y difícil) medidos antes y después, con las cifras en Evidence (RULE-001).
- [ ] Ninguna munición rompe más del doble de la media salvo decisión explícita del usuario.
- [ ] `DOM-JUEGO-003` actualizada con la tabla nueva.

## Test Plan

| Level | What it covers |
|-------|----------------|
| Medición | `destrozo` y `balance` con `GAMES=8` |

## Evidence

Pendiente.

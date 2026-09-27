---
id: WRK-TASK-044
type: spec
layer: work-task
scope: ephemeral
status: completed
confidence: medium
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

- [x] Pedrusco en 9-11 bloques y como mucho 3 de 12 reyes (12 disparos): 9,4 bloques y 2 de 12.
- [x] Equilibrio de difícil medido antes y después (12 partidas): 5,5 → 5,0 rondas, 111 → 102 s.

## Test Plan

| Level | What it covers |
|-------|----------------|
| Medición | Destrozo y equilibrio |

## Evidence

2026-09-27. Palanca elegida: un factor de aplastamiento del rey por munición (`kingCrush` en `ProjectileBehavior`, `ROCK_KING = 0,5`), que se aplica en `Sim.onForce` solo cuando el proyectil toca al rey. Los bloques los sigue rompiendo igual.

| Medida | Antes | Después |
|---|---|---|
| Destrozo, pedrusco (12 disparos) | 9,4 rotos, reyes 5/12 (aplastado 5) | 9,4 rotos, reyes 2/12 (aplastado 2) |
| Destrozo, media de todas | 16,0 rotos, reyes 13/120 | 16,3 rotos, reyes 12/120 |
| Equilibrio difícil (12 partidas) | 5,5 rondas, 111,1 s; causas 26 aplastado, 12 fuera, 1 caída | 5,0 rondas, 102,3 s; 25 aplastado, 12 fuera, 2 lava |

La primera eliminación sigue llegando en la ronda 1 en 9 de 12 partidas: es lo que aborda WRK-TASK-041. `npm run verify` en verde. Resultados en `tests/balance/destrozo.txt` y `ultimo-dificil.txt`.

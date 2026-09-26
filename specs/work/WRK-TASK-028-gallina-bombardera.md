---
id: WRK-TASK-028
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
activates: [DOM-JUEGO-003, RULE-001, RULE-004]
tags: [municion, equilibrio]
---

# WRK-TASK-028 — Gallina bombardera

## Objective

Que la gallina rebote **por el castillo** y rompa en cada bote: 12-16 bloques repartidos en 3-4 cráteres pequeños.

## File Scope

- `client/src/game/sim/projectiles.ts` (gallina)
- Efectos y sonido del huevo (`render/`, `audio.ts`)

## Implementation Notes

Propuesta (a confirmar con el usuario): en cada bote pone un **huevo** que explota a los 0,4 s (onda pequeña que rompe madera y cristal y astilla piedra), y el siguiente salto se dirige al bloque rival más cercano, más corto y más alto, en vez de salir despedida. Tope de 4 huevos. Alternativas: un picotazo que rompe seguro el bloque que toca, o una explosión grande en el último bote.

## Acceptance Criteria

- [ ] Gallina en 12-16 bloques, con más dispersión que la vaca.
- [ ] Los botes se quedan sobre el castillo rival en al menos 9 de 12 disparos.
- [ ] Banco sin bajar del presupuesto (RULE-004).

## Test Plan

| Level | What it covers |
|-------|----------------|
| Medición | `destrozo` (12 disparos) y `balance` normal y difícil con `GAMES=8`, antes y después |
| E2E | Grupos `fisica` y `solitario` |

## Evidence

Pendiente.

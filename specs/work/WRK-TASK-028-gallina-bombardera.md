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

Decisión del usuario: huevos bomba **a lo bomba de racimo**, con **poco rebote** para que haga daño. Al tocar el castillo suelta un racimo de huevos que se reparten alrededor y explotan casi a la vez (ondas pequeñas que rompen madera y cristal y astillan piedra). Los botes son cortos y bajos, así que la gallina se queda encima del castillo y suelta otro racimo más pequeño en cada uno.

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

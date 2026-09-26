---
id: WRK-TASK-029
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

# WRK-TASK-029 — Comunes: tronco apisonadora y cocos metralla

## Objective

Subir las dos comunes flojas a 10-13 bloques con firmas propias: el tronco barre la fila baja y descalza el castillo, y los cocos reparten golpes por toda la fachada. El pedrusco se queda como referencia (9-11).

## File Scope

- `client/src/game/sim/projectiles.ts` (tronco y cocos)
- `shared/ammo.ts` (tamaños y densidades)

## Implementation Notes

- Tronco: al primer contacto se orienta atravesado a su avance y rueda recto hacia el castillo apuntado. Algo más largo (de 1,9 a ~2,4 m). Mantiene la velocidad al atravesar madera y cristal.
- Cocos: de 4 a 6, que se abren más tarde (más cerca del castillo) para que caigan todos encima, y más densos para que cada uno rompa de 1 a 3 bloques.

## Acceptance Criteria

- [ ] Tronco y cocos en 10-13 bloques; el tronco con más bloques de la fila baja que ninguna otra y los cocos con la mayor dispersión de las comunes.
- [ ] Ningún rey de un golpe con las comunes salvo impacto directo del pedrusco.
- [ ] Banco con 6 cocos sin bajar del presupuesto (RULE-004).

## Test Plan

| Level | What it covers |
|-------|----------------|
| Medición | `destrozo` (12 disparos) y `balance` normal y difícil con `GAMES=8`, antes y después |
| E2E | Grupos `fisica` y `solitario` |

## Evidence

Pendiente.

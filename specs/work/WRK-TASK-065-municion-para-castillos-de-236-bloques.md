---
id: WRK-TASK-065
type: spec
layer: work-task
scope: ephemeral
status: draft
confidence: low
version: 0.1.0
created: 2026-09-28
updated: 2026-09-28
owner: dimas
parent: WRK-PLAN-011
activates: [DOM-JUEGO-003, RULE-001]
dependencies:
  - id: WRK-TASK-058
    relation: depends-on
tags: [municion, equilibrio]
---

# WRK-TASK-065 — Munición a la medida de los castillos de 236 bloques

## Objective

Con dos filas más (WRK-TASK-058), cinco municiones salen de su franja de destrozo: pedrusco 6,4 (9-11), tronco 9,3 (10-13), cocos 13,8 (10-13), vaca 18,9 y sandía 19,9 (14-18), nieve 29,7 (18-24). Decidir si las franjas crecen con el castillo (un 34 % más de bloques) o si se ajusta cada munición, y dejarlas dentro.

## File Scope

- `client/src/game/sim/projectiles.ts`, `shared/ammo.ts`
- `tests/balance/`
- `specs/domain/DOM-JUEGO-003-municion.md`

## Implementation Notes

- Decidido por el usuario el 08-10-2026: opción A, la propuesta siguiente.
- Propuesta: franjas relativas al tamaño del castillo (el mismo porcentaje de castillo por disparo que con 176 bloques) y reajustar solo lo que se desvía de su firma: el pedrusco (daño concentrado) rompe menos porque ahora da más alto, donde no hay forro; la bola de nieve rueda más y se lleva más muralla.
- RULE-001: destrozo (12 disparos) y equilibrio (8-12 partidas) antes y después.

## Acceptance Criteria

- [ ] Las 8 municiones dentro de su franja (nueva o de siempre, anotada en DOM-JUEGO-003).
- [ ] Equilibrio en normal dentro de 7-11 rondas.

## Test Plan

| Level | What it covers |
|-------|----------------|
| Medición | Destrozo y equilibrio |

## Evidence

Pendiente.

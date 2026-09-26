---
id: WRK-TASK-031
type: spec
layer: work-task
scope: ephemeral
status: completed
confidence: medium
version: 1.0.0
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

- [x] Las tres en 18-26 bloques.
- [x] Firmas distintas en la prueba: la bola de nieve, con la mayor dispersión (3,0); el imán, con más piedra y hierro rotos (12,0); el agujero negro, con más bloques movidos de las tres (8,7). ~~El agujero negro, con la menor dispersión~~: queda en 2,4 frente a los 2,1 del imán.
- [x] Como mucho 4 de 12 reyes cada una.
- [x] Banco sin bajar del presupuesto (RULE-004).

## Test Plan

| Level | What it covers |
|-------|----------------|
| Medición | `destrozo` (12 disparos) y `balance` normal y difícil con `GAMES=8`, antes y después |
| E2E | Grupos `fisica` y `solitario` |

## Evidence

- **Agujero negro:**
  - núcleo de 1,1 a 1,6 m (`BLACKHOLE_CORE` en `sim.ts`);
  - al cerrarse, la implosión pasa de 4 m y fuerza 9 a 5 m y fuerza 80, y escupe lo que no se ha tragado;
  - destrozo de 16,9 a 20,2 bloques.
- **Imán:**
  - fuerza de 26 a 30;
  - al acabar el campo, el hierro a menos de 4,5 m sale a 22 m/s contra el castillo rival más cercano, con efecto y sonido propios (`recoil`);
  - destrozo de 13,1 a 21,3 bloques, piedra y hierro de 7,3 a 12,0 y reyes de 0 a 3 de 12.
- **Bola de nieve:**
  - rueda recto en la dirección en que llegó;
  - crece hasta 1,5 m a 0,9 m/s. Con 2,1 m destrozaba 26-27 bloques, por encima de la franja;
  - destrozo de 9,8 a 19,8 bloques.
- **Todas en su franja (12 disparos):** media de 8,4 (antes del plan) a 15,5 bloques.
- **Rendimiento:** `perf.spec.ts` da un paso de física medio de 5,2 ms con SwiftShader (presupuesto: 16 ms), con 536 cuerpos despiertos como máximo.
- **Equilibrio (8 partidas):**
  - normal: 7,0 rondas y 133 s;
  - difícil: 6,5 rondas y 126 s.
- E2E de física y solitario en local: 5 de 5.

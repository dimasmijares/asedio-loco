---
id: WRK-TASK-037
type: spec
layer: work-task
scope: ephemeral
status: completed
confidence: medium
version: 1.0.0
created: 2026-09-27
updated: 2026-09-27
owner: dimas
parent: WRK-PLAN-009
activates: [DOM-JUEGO-004, DOM-JUEGO-003, RULE-001, RULE-002, RULE-004]
tags: [castillos, equilibrio]
---

# WRK-TASK-037 — Castillos de 176 bloques con forro interior

## Objective

Que los castillos tengan más bloques y resistan algo más: que cada disparo destroce en proporción menos castillo.

## File Scope

- `shared/castle.ts` (plano)
- `client/src/game/sim/projectiles.ts` y `sim.ts` (reajuste de munición)
- `shared/protocol.ts` (versión)

## Implementation Notes

Forro interior de piedra detrás de cada muralla: 3 hileras de los 3 bloques centrales (36 bloques). Sin cambiar la silueta ni los identificadores (máximo 199 por castillo, `BLOCK_ID_STRIDE`).

## Acceptance Criteria

- [x] Castillo estable en reposo durante 10 s.
- [x] Estado completo por debajo de 64 KB.
- [x] Las 10 municiones en su franja de bloques rotos por disparo.
- [x] Paso de física del banco por debajo de 16 ms.

## Test Plan

| Level | What it covers |
|-------|----------------|
| Medición | Destrozo (12 disparos), equilibrio (8-12 partidas), banco |
| E2E | `perf`, `physics` |

## Evidence

- **Plano:** 36 bloques de forro (`LINING_ROWS = 3`). En reposo, 10 s con los 4 castillos: ningún bloque se mueve más de 2 mm y los 4 reyes siguen vivos.
- **Estado completo:** de 27,5 a 34,1 KB con 704 bloques (límite: 64 KB). `PROTOCOL_VERSION` 7.
- **Destrozo (12 disparos):** sin reajuste, con más piedra en el radio de las explosiones, la media subía a 16,1-17,9 y el imán bajaba a 9,8, porque el forro retiene el hierro interior. Reajuste:
  - vaca: fuerza 108;
  - sandía: 108;
  - huevo: 64;
  - acorde del piano: 60, con `plowKeep` 0,85;
  - tronco: 9 m/s;
  - cocos: densidad 9;
  - imán: fuerza 34 y retroceso de 5 m.

  Media final: 16,0, con las 10 municiones en su franja.
- **Rey:** con el forro, el agujero negro sacaba al rey del castillo en 6 o 7 de 12 impactos, primero por el escupitajo final (el rey pesa poco). Los campos ya no mueven al rey, el escupitajo solo le aplica el 5 % y el núcleo pasa de 1,6 a 1,3 m. Queda en 4 de 12.
- **Equilibrio:**
  - normal (8 partidas): de 6,8 a 7,9 rondas;
  - fácil (8 partidas): de 7,0 a 8,5 rondas;
  - difícil (12 partidas): 4,5 rondas, y 4,8 sin el forro con la misma munición, así que el forro no es la causa; la medida anterior de 6,5 (8 partidas) era ruido.
- **Rendimiento:** `perf.spec.ts` da un paso de física de 8,7 ms (antes, 5,3 ms) y 684 cuerpos despiertos como máximo, dentro del presupuesto de 16 ms.
- **ADR-013:** supera a ADR-008 en el número de bloques.
- E2E de rendimiento y física en local: 5 de 5.

---
id: WRK-TASK-052
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
activates: [ARCH-004, ARCH-005, RULE-001, RULE-004]
tags: [rendimiento, fisica]
---

# WRK-TASK-052 — Física más barata para el anfitrión móvil

## Objective

Reducir el coste del paso de física, que con castillos de 176 bloques y la CPU 4× más lenta llega a 14,5 ms en el banco, cerca del límite de 16 ms, para que un móvil pueda ser anfitrión con holgura.

## File Scope

- `client/src/game/sim/sim.ts` (sueño de cuerpos, iteraciones del solucionador, grupos de colisión)
- `client/src/game/sim/island.ts`
- `tests/tools/bench.mjs`
- `client/src/game/sim/projectiles.ts` (reajuste de huevos e imán para mantener su destrozo, RULE-001)
- `tests/unit/castle-rest.test.ts`, `tests/balance/`

## Implementation Notes

Palancas a medir una a una con `bench.mjs <base> low gpu cpu=4 movil`: que los bloques en reposo duerman antes; que los bloques del forro interior no colisionen entre sí mientras están quietos; menos iteraciones del solucionador en bloques lejos de la acción; fragmentos locales fuera del mundo del anfitrión (ya lo están). Cada cambio con destrozo y equilibrio (RULE-001), porque puede alterar los derrumbes.

## Acceptance Criteria

- [x] Paso de física del banco con `cpu=4 movil` por debajo de 11 ms (hoy 14,5).
- [x] Destrozo y equilibrio sin cambios fuera del ruido.
- [x] Castillo estable en reposo.

## Test Plan

| Level | What it covers |
|-------|----------------|
| Medición | Banco, destrozo y equilibrio |
| E2E | `physics`, `perf` |

## Evidence

2026-09-28.

- Perfil en Node (lluvia de 12 proyectiles del banco): `world.step` de Rapier es el 90 % del paso (4,8 de 5,3 ms) y el JS propio, 0,5 ms. Palancas medidas, en ms por paso en Node: 6 subpasos y 2 cm de predicción, 5,2-5,4; 4 subpasos, 3,8-4,0; 3 subpasos, 3,4; 6 subpasos y 1 cm, 3,5; 4 subpasos y 1 cm, 2,9-3,2; 4 subpasos y 0,5 cm, 2,5. La predicción de contactos es la palanca principal. Se elige 4 subpasos y 1 cm; 0,5 cm no se probó en el destrozo.
- Banco `low gpu cpu=4 movil`, paso de física: 13,9 / 16,1 / 14,3 ms antes; 10,6 / 10,7 / 9,7 / 8,9 ms después (solo con 4 subpasos: 13,4-14,3). fps de 14-17 a 21-26. PC, media: paso de 5,3 a 3,4 ms. `perf.spec.ts` (SwiftShader): paso de 7,9-9,2 a 4,6 ms.
- Destrozo con 12 disparos: media igual (16,1-16,2 → 16,1) y los mismos reyes (9-12 → 12 de 120). El detalle por munición está en DOM-JUEGO-003. Sin retocar la munición, el imán (19,9 → 24,3) y la gallina (≈16,2 → 18,3) se salían de sus franjas: retroceso del imán de 22 a 18 m/s y fuerza de los huevos de 64 a 58. Quedan en 22,7 y 16,7. Con la física caótica, retocar más no converge: con 16 m/s de retroceso el imán rompía 23,3.
- Equilibrio, 12 partidas: fácil 10,0 → 10,3 rondas; normal 9,4 → 8,9. En difícil se hicieron 3 tandas con la física anterior (6,9 / 7,5 / 8,0 rondas, media 7,5) y 4 con la nueva (7,9 / 8,3 / 7,4 / 8,1, media 7,9): +0,4, dentro del ruido. La primera eliminación sigue llegando en la ronda 3 o después en todas las partidas.
- Reposo: `tests/unit/castle-rest.test.ts` despierta los 704 bloques de los 4 castillos, deja correr 6 s y comprueba que no se rompe ninguno, que ninguno se mueve 2 cm y que todos vuelven a dormirse. E2E `physics` (5 escenas) y `perf` en verde.
- Hallazgo: `npx vitest run --config tests/balance/vitest.config.ts balance` ejecuta también el destrozo (el filtro coincide con la carpeta) y deja `destrozo.txt` con 6 disparos. Queda anotado en DOC-OPS-001. `destrozo.txt` queda aquí con la tanda de 12 disparos.


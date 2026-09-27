---
id: WRK-TASK-052
type: spec
layer: work-task
scope: ephemeral
status: draft
confidence: low
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

## Implementation Notes

Palancas a medir una a una con `bench.mjs <base> low gpu cpu=4 movil`: que los bloques en reposo duerman antes; que los bloques del forro interior no colisionen entre sí mientras están quietos; menos iteraciones del solucionador en bloques lejos de la acción; fragmentos locales fuera del mundo del anfitrión (ya lo están). Cada cambio con destrozo y equilibrio (RULE-001), porque puede alterar los derrumbes.

## Acceptance Criteria

- [ ] Paso de física del banco con `cpu=4 movil` por debajo de 11 ms (hoy 14,5).
- [ ] Destrozo y equilibrio sin cambios fuera del ruido.
- [ ] Castillo estable en reposo.

## Test Plan

| Level | What it covers |
|-------|----------------|
| Medición | Banco, destrozo y equilibrio |
| E2E | `physics`, `perf` |

## Evidence

Pendiente.

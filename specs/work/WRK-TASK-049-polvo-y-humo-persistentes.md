---
id: WRK-TASK-049
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
activates: [FEAT-SENSACION-001, ARCH-005, RULE-004]
tags: [graficos]
---

# WRK-TASK-049 — Polvo y humo persistentes tras un derrumbe

## Objective

Que tras un derrumbe quede una columna de polvo y humo que se disipa despacio (8-12 s), para que el destrozo se vea durante los resultados y la ronda siguiente.

## File Scope

- `client/src/game/render/fx.ts` (partículas de larga vida o nube con sombreador)
- `client/src/game/view.ts` (disparo del efecto según el destrozo)
- `tests/e2e/calidad.spec.ts` (topes del humo)

## Implementation Notes

Mejor una nube de pocas partículas grandes y translúcidas, o un sombreador sobre un plano, que cientos de partículas. Topes según la calidad (`FX_CAP`) y menos densidad en calidad baja.

## Acceptance Criteria

- [x] El humo se ve en los resultados en PC y en móvil vertical (capturas).
- [x] `perf.spec.ts` y el banco `cpu=4 movil` dentro del presupuesto.

## Test Plan

| Level | What it covers |
|-------|----------------|
| E2E | `perf` |
| Capturas | Resultados de una ronda con derrumbe |

## Evidence

2026-09-27.

- Focos de humo en `Fx` (`rubble`, `collapse` y `stepSmoke`), con una reserva propia de bocanadas grandes y translúcidas (`Fx.smoke`, un InstancedMesh con icosaedros de 80 caras). La vista llama a `fx.rubble` con cada bloque roto. Los valores y los topes están en FEAT-SENSACION-001 y en ARCH-005.
- Ajuste a ojo en tres pasadas de capturas con GPU (`seed=21`, 1280×720 y 390×844). Con bocanadas de 0,7-1,2 m y celdas de 3 m el humo apenas se veía desde el plano general. Con 1,4-2,2 m, celdas de 5 m y tonos más oscuros se ven 4-5 columnas en los resultados de la ronda 1 y todavía 2-3 al apuntar en la ronda 2, en PC y en móvil vertical.
- Banco `low gpu cpu=4 movil`, 2 pasadas antes y 2 después: 12 fps en todas; física igual (67,7-67,8 → 69,1-69,9 ms, dentro del ruido); dibujo 8,6-8,8 → 9,1-9,2 ms; 238 llamadas de dibujo en todas. `perf.spec.ts` en verde.
- `calidad.spec.ts` llena 10 focos y comprueba los topes en alta (9 focos, 180 bocanadas) y al bajar a baja (3 focos, ≤ 50 bocanadas).
- `npm run verify` en verde.


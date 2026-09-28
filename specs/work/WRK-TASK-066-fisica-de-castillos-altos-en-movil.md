---
id: WRK-TASK-066
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
activates: [ARCH-005, RULE-004]
dependencies:
  - id: WRK-TASK-058
    relation: depends-on
tags: [rendimiento, movil]
---

# WRK-TASK-066 — Física de los castillos altos en un anfitrión móvil

## Objective

Con 236 bloques por castillo, el paso de física del banco en perfil móvil (CPU frenada ×4) pasa de unos 17 a unos 29 ms y los cuerpos despiertos, de unos 610 a 870: las pilas de 7 filas tiemblan unos milímetros y Rapier tarda en dormirlas. Un anfitrión móvil sin ordenador en la sala podría ir a cámara lenta en los impactos grandes. Bajar el coste sin quitar las filas.

## File Scope

- `client/src/game/sim/sim.ts` (sueño, uniones, parámetros del motor)
- `tests/unit/castle-rest.test.ts`, `tests/e2e/perf.spec.ts`
- `specs/architecture/ARCH-005-rendimiento-y-calidad-adaptativa.md`

## Implementation Notes

- Primer intento descartado en WRK-TASK-058: dormir a mano los bloques casi quietos (umbral de velocidad y 0,5-1 s) dormía el castillo en unos 10-16 s, pero rompía la prueba del escudo real y la de la parábola. Revisar por qué antes de repetirlo.
- Otras palancas: uniones entre filas de las torres (una torre de 7 unida vibra menos), fricción o amortiguación de los bloques en reposo, y más margen de predicción de contactos solo para bloques.
- Medir siempre en la misma máquina, antes y después y con dos pasadas: `node tests/tools/bench.mjs <base> low gpu cpu=4 movil` en el PC del usuario (la referencia de ARCH-005, unos 10 ms antes de las filas nuevas) y, si se puede, `/#bench` en su Android. Las cifras de WRK-TASK-058 son de un servidor en la nube con gráfica por software: solo valen como aumento relativo (+70 %).

## Acceptance Criteria

- [ ] Paso de física del banco móvil (CPU ×4) por debajo de 20 ms, sin cambiar el destrozo (RULE-001).
- [ ] Un castillo entero despierto se vuelve a dormir en menos de 8 s (`castle-rest.test.ts`).

## Test Plan

| Level | What it covers |
|-------|----------------|
| Medición | Banco en perfil móvil, destrozo |
| Unit | Reposo del castillo |

## Evidence

Pendiente.

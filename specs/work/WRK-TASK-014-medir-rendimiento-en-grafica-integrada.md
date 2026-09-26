---
id: WRK-TASK-014
type: spec
layer: work-task
scope: ephemeral
status: draft
confidence: low
version: 0.1.0
created: 2026-09-26
updated: 2026-09-26
owner: dimas
parent: WRK-PLAN-005
activates:
  - ARCH-005
  - RULE-004
  - DOC-OPS-001
tags:
  - rendimiento
  - medida
---

# WRK-TASK-014 — Medir el rendimiento en una gráfica integrada

## Objective

Confirmar con una medida real el objetivo de la especificación original: 60 fps en calidad media en un portátil con gráfica integrada de gama media, con los 4 castillos enteros.

## File Scope

Propuesto:

- `CLAUDE.md` (tabla de rendimiento y «Limitaciones conocidas»)
- `tests/tools/bench.mjs` solo si hace falta una opción nueva

Fuera: código del juego. Si la medida no llega, el arreglo es otra tarea.

## Implementation Notes

| Activated spec | What it requires of this task |
|----------------|-------------------------------|
| ARCH-005 | Medir las 3 calidades con `/#bench` (4 castillos, 12 proyectiles, 9 s de simulación) |
| RULE-004 | Cada paso de física tiene que caber en 16 ms |
| DOC-OPS-001 | `node tests/tools/bench.mjs <base> <high\|medium\|low> gpu`; anotar equipo, gráfica, resolución y fecha |

- Hasta ahora solo se ha medido en una RTX 3080 y en SwiftShader. La estimación de `CLAUDE.md` para una integrada es una deducción.
- La medida en un móvil real es parte de WRK-TASK-008, no de esta tarea.

## Acceptance Criteria

- [ ] Tabla de `CLAUDE.md` con una fila por calidad medida en una gráfica integrada (modelo anotado).
- [ ] Si calidad media no llega a 60 fps, queda anotado y se abre una tarea con la causa (física, llamadas o relleno).
- [ ] Se actualiza la limitación de `CLAUDE.md` sobre el rendimiento sin medir.

## Test Plan

| Level | What it covers |
|-------|----------------|
| Unit | — |
| Integration | — |
| Manual | Banco de rendimiento en el portátil con Chromium y GPU; no se puede hacer en CI (sin gráfica real) |

## Evidence

Pendiente.

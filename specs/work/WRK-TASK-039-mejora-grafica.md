---
id: WRK-TASK-039
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
activates: [FEAT-SENSACION-001, ARCH-005, RULE-004]
tags: [graficos]
---

# WRK-TASK-039 — Mejora gráfica: grietas en los bloques dañados

## Objective

Una mejora visual clara, que se note en PC y en móvil, sin salir del presupuesto de rendimiento.

## File Scope

- `client/src/game/render/` según la mejora elegida

## Implementation Notes

Elegida: grietas procedurales en los bloques dañados. Antes, el daño solo oscurecía el bloque. Es una mejora gráfica que además aclara qué bloques están a punto de romperse.

## Acceptance Criteria

- [x] Capturas antes y después en PC y móvil vertical.
- [x] `perf.spec.ts` dentro del presupuesto.

## Test Plan

| Level | What it covers |
|-------|----------------|
| E2E | `perf` y capturas |

## Evidence

- `render/materials.ts` (`withNearFade`, ahora también con grietas): patrón de Voronoi en las coordenadas locales de cada cara. El daño se deduce del color de la instancia, que `Blocks.setDamage` ya oscurecía, y la semilla es `gl_InstanceID`. Aparece a partir de un daño de 0,1 y la grieta se ensancha con él (anchura de 0,035 a 0,185 de celda, 2,6 celdas por cara). Sin texturas, atributos ni geometría nuevos.
- Capturas en el campo de pruebas, en 1280×720 y 390×844 con densidad 3, con daños de 0, 0,3, 0,6 y 0,9 alternos: los bloques intactos quedan limpios y los dañados, agrietados en proporción al daño. Sin errores de compilación del sombreador.
- `perf.spec.ts`: 11 fps de media con SwiftShader (antes, 12; dentro del ruido) y el paso de física en 8,5 ms. Solo pagan el Voronoi los fragmentos de bloques dañados.

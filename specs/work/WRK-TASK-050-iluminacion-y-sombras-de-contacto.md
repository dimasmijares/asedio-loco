---
id: WRK-TASK-050
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
activates: [FEAT-SENSACION-001, ARCH-005, RULE-004]
dependencies:
  - id: WRK-TASK-052
    relation: depends-on
tags: [graficos]
---

# WRK-TASK-050 — Iluminación del atardecer y sombras de contacto

## Objective

Dar más volumen a los castillos: mejor luz de atardecer, sombras de contacto (oclusión ambiental aproximada) en la base de bloques y castillos, y un contraste más claro entre materiales.

## File Scope

- `client/src/game/render/stage.ts` (luces, sombras)
- `client/src/game/render/materials.ts` (sombreador de los bloques)

## Implementation Notes

**Decisión del usuario al empezar** (con capturas de las alternativas): intensidad del cambio y si se aplica también en calidad baja. Opciones técnicas: oclusión aproximada por altura en el sombreador (barata), sombras más suaves, o postproceso SSAO (caro, solo en calidad alta).

**Decisión del usuario (2026-09-27):** oclusión aproximada por altura y luz de atardecer algo más cálida, sutil y en todas las calidades (sin SSAO); las capturas antes y después siguen pendientes de su aprobación.

## Acceptance Criteria

- [ ] Capturas antes y después en PC y en móvil vertical, aprobadas por el usuario.
- [ ] Calidad baja sin coste apreciable; `perf.spec.ts` y el banco dentro del presupuesto.

## Test Plan

| Level | What it covers |
|-------|----------------|
| Capturas | Escena fija con semilla |
| E2E | `perf` |

## Evidence

Pendiente.

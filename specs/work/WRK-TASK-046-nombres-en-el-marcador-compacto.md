---
id: WRK-TASK-046
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
activates: [FEAT-INTERFAZ-001]
tags: [interfaz, movil]
---

# WRK-TASK-046 — Nombres en el marcador compacto del móvil

## Objective

En el marcador compacto (móvil en vertical y en horizontal) solo se ven el estandarte y el porcentaje. Que se pueda identificar a cada rival sin ocupar mucho más espacio.

## File Scope

- `client/src/ui/hud.ts` (marcador)
- `client/src/ui/style.css` (bloques de pantallas pequeñas al final del archivo)
- `tests/e2e/hud-compact.spec.ts`

## Implementation Notes

Opciones: iniciales o nombre abreviado (6-8 caracteres) junto al porcentaje, o el nombre completo al tocar la fila. Mantener el ancho actual en horizontal.

## Acceptance Criteria

- [ ] En 390×844, 412×915 y los 3 tamaños horizontales se identifica a cada jugador.
- [ ] `hud-compact.spec.ts` sin solapes y con nombres visibles.

## Test Plan

| Level | What it covers |
|-------|----------------|
| E2E | `hud-compact` |

## Evidence

Pendiente.

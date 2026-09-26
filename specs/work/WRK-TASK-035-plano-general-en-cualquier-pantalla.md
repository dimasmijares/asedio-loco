---
id: WRK-TASK-035
type: spec
layer: work-task
scope: ephemeral
status: active
confidence: low
version: 0.1.0
created: 2026-09-27
updated: 2026-09-27
owner: dimas
parent: WRK-PLAN-008
activates: [FEAT-CAMARA-001]
tags: [claridad, movil]
---

# WRK-TASK-035 — Plano general que encuadra todos los castillos en cualquier pantalla

## Objective

Que en la cuenta atrás y durante el impacto se vean todos los castillos en juego, también en móvil vertical.

## File Scope

- `client/src/game/director.ts` (`frame`)
- `tests/e2e/` (comprobación de encuadre)

## Implementation Notes

`frame` calcula la distancia necesaria con el semiángulo vertical y con el horizontal (`atan(tan(vfov/2) · aspecto)`) y usa la mayor. En vertical la cámara sube para aprovechar la altura de la pantalla.

## Acceptance Criteria

- [ ] En 1280×720 y en 390×844, al final de la cuenta atrás los 4 castillos proyectan dentro de la pantalla (prueba E2E).
- [ ] En escritorio el encuadre no se aleja más que antes.

## Test Plan

| Level | What it covers |
|-------|----------------|
| E2E | Escritorio 1280×720 y móvil vertical 390×844 |
| Capturas | Antes y después en los dos formatos |

## Evidence

Pendiente.

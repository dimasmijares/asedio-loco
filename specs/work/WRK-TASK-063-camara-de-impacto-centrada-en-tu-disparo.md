---
id: WRK-TASK-063
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
activates: [FEAT-CAMARA-001, ADR-006]
tags: [camara, impacto]
---

# WRK-TASK-063 — Cámara de impacto centrada en tu disparo

## Objective

Comentario del usuario en el lienzo (28-09-2026, «Móvil · Impacto»): durante el impacto, la cámara prioriza tu propio disparo con una panorámica centrada entre tu castillo y el que apuntas. Hoy, con los cambios de cámara, a veces no se ve dónde ha caído tu disparo.

## File Scope

- `client/src/game/director.ts`, `client/src/game/camera.ts`
- `tests/e2e/` (capturas del impacto en PC y móvil vertical)
- `specs/feature/FEAT-CAMARA-001-camara-y-director.md`

## Implementation Notes

- Encuadre por defecto del impacto: el segmento entre tu catapulta y tu castillo objetivo, con margen para la parábola; se sigue tu proyectil hasta que toca algo y se mantiene el plano sobre el punto de impacto hasta que se asienta.
- Los cortes a otros disparos (rivales, reyes que caen) solo después de ver tu impacto, o nunca si coinciden en el tiempo; la repetición ya cubre lo que te pierdas.
- Espectador y bots: sin cambios (no tienen disparo propio).
- Respetar ADR-006 (sin cámara lenta en directo).

## Acceptance Criteria

- [ ] En el impacto, tu proyectil y su punto de impacto están en pantalla desde que sale hasta que se asienta, en 1280×720 y 390×844 (E2E que lo comprueba proyectando la posición a pantalla).
- [ ] Encuadre inicial centrado entre tu castillo y el objetivo.
- [ ] Capturas antes y después aprobadas por el usuario.

## Test Plan

| Level | What it covers |
|-------|----------------|
| E2E | Proyectil propio dentro del encuadre durante el impacto |

## Evidence

Pendiente.

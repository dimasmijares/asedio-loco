---
id: WRK-TASK-048
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
activates: [FEAT-INTERFAZ-001, PROD-JUGAR-001]
tags: [interfaz, movil]
---

# WRK-TASK-048 — Tutorial adaptado al vertical

## Objective

Revisar el tutorial de la primera partida para que en móvil vertical señale los controles reales (arrastrar, botón 🔥, flechas, tarjetas) sin tapar la escena.

## File Scope

- `client/src/ui/tutorial.ts` y `style.css`
- `tests/e2e/` (tutorial en vertical)

## Implementation Notes

Revisar con capturas en 390×844 y 1280×720 cada paso («Apunta», «Elige munición», «¡Fuego!»). En móvil, cada paso puede señalar el elemento que toca: la escena, las tarjetas o el botón 🔥.

## Acceptance Criteria

- [ ] Los 3 pasos se leen y señalan el control correcto en móvil vertical y en PC.
- [ ] El tutorial no tapa el botón de disparo ni las tarjetas.

## Test Plan

| Level | What it covers |
|-------|----------------|
| E2E | Tutorial con `?tutorial=1` en los dos formatos |

## Evidence

Pendiente.

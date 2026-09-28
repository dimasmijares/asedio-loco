---
id: WRK-TASK-062
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
activates: [FEAT-INTERFAZ-001]
dependencies:
  - id: WRK-TASK-060
    relation: depends-on
tags: [interfaz, diseno, portada]
---

# WRK-TASK-062 — Portada: tipografía y maquetación

## Objective

Comentario del usuario en el lienzo (28-09-2026, «Móvil · Portada»): mejorar la tipografía y la maquetación de la portada; en móvil vertical el título «ASEDIO LOCO» no cabe.

## File Scope

- `client/src/ui/lobby.ts`, `client/src/ui/style.css` (portada, logotipo, tarjeta de entrada)
- `client/index.html` (fuentes, si se añade una tipografía propia)
- `tests/e2e/` (capturas y que el título no se recorte)
- `specs/feature/FEAT-INTERFAZ-001-hud-portada-tutorial-ajustes.md`

## Implementation Notes

- El título se ajusta al ancho (p. ej. `clamp()` y, si hace falta, dos líneas «ASEDIO / LOCO» en vertical); nunca se recorta de 360 a 1440 px.
- Una tipografía de título con carácter y otra de texto legible, las mismas en toda la interfaz; se cargan con la PWA para que funcione sin red.
- Primero una propuesta en el lienzo, en PC y móvil vertical, que el usuario aprueba.

## Acceptance Criteria

- [ ] Propuesta aprobada en el lienzo.
- [ ] El título cabe entero de 360 a 1440 px de ancho (E2E que mide que no se sale).
- [ ] Capturas en PC y móvil vertical.

## Test Plan

| Level | What it covers |
|-------|----------------|
| E2E | Título dentro de la pantalla en varios anchos |

## Evidence

Pendiente.

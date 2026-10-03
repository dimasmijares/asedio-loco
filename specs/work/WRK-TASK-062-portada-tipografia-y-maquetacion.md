---
id: WRK-TASK-062
type: spec
layer: work-task
scope: ephemeral
status: completed
confidence: medium
version: 0.2.0
created: 2026-09-28
updated: 2026-10-03
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

- [x] Propuesta aprobada en el lienzo (R-10 U9, que sustituye a R-06, aprobada el 01-10-2026).
- [x] El título cabe entero de 360 a 1440 px de ancho (`tests/e2e/portada.spec.ts`, de 360 a 1280 px, en dos líneas).
- [x] Capturas en PC y móvil vertical (tablero «R-10 fase 3 · en el juego»).

## Test Plan

| Level | What it covers |
|-------|----------------|
| E2E | Título dentro de la pantalla en varios anchos |

## Evidence

2026-10-03. Hecho con la portada de R-10 (WRK-TASK-081): título «ASEDIO / LOCO» en dos líneas con Lilita One, que ya se sirve desde el repositorio (WRK-TASK-074).

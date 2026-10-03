---
id: WRK-TASK-082
type: spec
layer: work-task
scope: ephemeral
status: completed
confidence: medium
version: 0.1.0
created: 2026-10-03
updated: 2026-10-03
owner: dimas
parent: WRK-PLAN-011
activates: [FEAT-INTERFAZ-001]
dependencies:
  - id: WRK-TASK-081
    relation: depends-on
tags: [interfaz, menus, movil, pc]
---

# WRK-TASK-082 — Jugar solo con selectores grandes (R-10 fase 3: U10)

## Objective

Rehacer «Jugar solo» según la maqueta «Móvil · Jugar solo»: hoja crema abajo en móvil y el mismo contenido en una tarjeta centrada de unos 420 px en PC, con rivales y dificultad en selectores segmentados de 48 px en lugar de desplegables.

## File Scope

- `client/src/ui/lobby.ts` (`showSoloSetup`, `segmented`), `client/src/main.ts`, `client/src/game/modes/solo.ts` (`names`), `client/src/ui/style.css`
- `tests/e2e/portada.spec.ts`

## Implementation Notes

| Activated spec | What it requires of this task |
|----------------|-------------------------------|
| FEAT-INTERFAZ-001 | «Jugar solo»: rivales 1-3, dificultad y campo de pruebas |

- **Cabecera:** botón redondo de volver (`#solo-back`, 44 px) y «Jugar solo» en Lilita 32.
- **Rivales** (`#solo-bots`, 1/2/3) y **Dificultad** (`#solo-difficulty`, Fácil/Normal/Difícil): selectores segmentados de 48 px, la opción elegida en naranja con contorno noche sobre una pista crema oscuro (`role="radio"`).
- **Quiénes son:** bajo los rivales, sus emblemas (los huecos que ocupan en la partida) y sus nombres («Conde Clic, Reina Rúter y Sir Bot»). Salen de la lista de bots desde un punto al azar y la partida usa esos mismos (`SoloOptions.names`).
- **Acciones:** EMPEZAR como tablón naranja y «Campo de pruebas · munición sin límite» como enlace vino subrayado de 48 px.
- **Disposición:** en vertical, hoja de 560 px con `radius-lg` arriba sobre la escena con un velo al 45 %; en horizontal, tarjeta de 420 px centrada; en un móvil tumbado, dos columnas para que quepa todo.

## Acceptance Criteria

- [x] Los selectores miden 48 px y cambian los emblemas y los nombres de los rivales.
- [x] Los rivales anunciados son los de la partida.
- [x] En 1280×720, 390×844 y 360×740 nada se sale ni se cruza, y lo táctil mide 44 px o más.

## Test Plan

| Level | What it covers |
|-------|----------------|
| E2E | `tests/e2e/portada.spec.ts` («jugar solo» en PC y en vertical) |

## Evidence

2026-10-03. `portada.spec.ts` en verde en los tres tamaños; capturas locales con GPU en PC, vertical y móvil tumbado.

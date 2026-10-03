---
id: WRK-TASK-088
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
  - id: WRK-TASK-085
    relation: depends-on
tags: [interfaz, objetivo, diseno]
---

# WRK-TASK-088 — Chincheta del objetivo con bandera (R-14)

## Objective

R-14, aprobado por el usuario (03-10-2026; design system, componente Marcador, sección «Marca de objetivo en la escena»): la chincheta que marca la pieza objetivo lleva cuerpo noche, borde crema de 2 px y una bandera naranja, con la punta hacia la pieza; sin anillos ni dianas, que son el lenguaje de la puntería. El chip del objetivo usa la misma bandera.

## File Scope

- `client/src/game/view.ts` (`goalPinTexture`, `setGoalMarks`), `client/src/ui/icons.ts` (`flag`)
- `client/src/ui/hud.ts` (chip del objetivo), `client/src/game/match/ui.ts` (rótulo y resultados), `client/src/ui/lobby.ts` («Cómo se juega»)
- `tests/e2e/solo.spec.ts`

## Implementation Notes

| Activated spec | What it requires of this task |
|----------------|-------------------------------|
| FEAT-INTERFAZ-001 | Objetivo secundario: chip y chincheta con el mismo icono |

- La chincheta es una gota dibujada en un `CanvasTexture` de 128×224 (la escala del sprite no cambia: 3 × 5,25 m): cabeza de radio 56 y punta abajo, cuerpo noche, borde crema de 6 px de textura (unos 2 px en pantalla a su tamaño habitual) y, dentro, la bandera del icono `flag` en naranja.
- El icono `flag` (mástil y paño con muesca, trazo 2,5) sustituye a la diana en todo lo que habla del objetivo: chip, rótulo de la ronda, resultados y «Cómo se juega». La diana (`target`) queda para la puntería.

## Acceptance Criteria

- [x] Sin anillos ni dianas en la chincheta; el chip lleva la misma bandera.
- [x] La chincheta y el anillo de impacto no se confunden (captura «Apuntando» del tablero «R-07, R-11, R-13 y R-14 · en el juego»).

## Test Plan

| Level | What it covers |
|-------|----------------|
| E2E | `tests/e2e/solo.spec.ts`: el chip del objetivo lleva el icono de la bandera y hay chinchetas sobre los rivales |
| Revisión | Capturas en móvil y PC |

## Evidence

2026-10-03. `solo.spec.ts` en verde; capturas en el tablero del lienzo.

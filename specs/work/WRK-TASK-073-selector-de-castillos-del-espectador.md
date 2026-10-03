---
id: WRK-TASK-073
type: spec
layer: work-task
scope: ephemeral
status: completed
confidence: medium
version: 0.1.0
created: 2026-09-28
updated: 2026-10-03
owner: dimas
parent: WRK-PLAN-011
activates: [FEAT-CAMARA-001, FEAT-INTERFAZ-001]
dependencies:
  - id: WRK-TASK-061
    relation: depends-on
tags: [interfaz, espectador]
---

# WRK-TASK-073 — Selector de castillos del espectador

## Objective

Decisión del usuario (28-09-2026, WRK-TASK-061): cuando te eliminan, a la derecha y en pequeño, un castillo por jugador con su nombre y cuánto le queda; al tocarlo, la cámara va a ese castillo. Sustituye a las flechas ◀ ▶ del espectador. Propuesta en el lienzo: R-05, rehecha en estilo «Atardecer» en R-13 (aprobado el 03-10-2026: V1-V6 y D1, solo castillos en pie).

## File Scope

- `client/src/ui/hud.ts` (`setSpectator`, fuera las flechas), `client/src/ui/flujo.css`, `client/src/ui/style.css`, `client/src/game/match/ui.ts` (`cycleWatch`, deslizar, `showFall`), `client/src/ui/tutorial.ts`
- `tests/e2e/espectador.spec.ts`
- `specs/feature/FEAT-CAMARA-001-camara-y-director.md`

## Acceptance Criteria

- [x] R-05 aprobado (28-09-2026); R-13 aprobado (03-10-2026).
- [x] Selector visible solo para el espectador, en PC y móvil vertical; tocar un castillo mueve la cámara; «Todos», al plano general (`espectador.spec.ts`).
- [x] Sin flechas ◀ ▶ en ningún caso (`espectador.spec.ts`, `touch.spec.ts`).
- [x] Al caer tu rey, «¡Tu rey ha caído!» con la causa y el puesto (`espectador.spec.ts`).

## Test Plan

| Level | What it covers |
|-------|----------------|
| E2E | `espectador.spec.ts`: aviso al caer, tarjetas de los castillos en pie, tocar (móvil) y Q/E (PC), «Mirando», deslizar de vuelta al plano general, 44 px o más; `hud-compact`, `tutorial` y `touch` sin las flechas |

## Evidence

2026-10-03. `espectador`, `hud-compact`, `tutorial` y `touch` en verde en local (16 pruebas).

2026-10-03. En CI, la revancha de `multiplayer.spec` se quedó esperando 15 min: el anfitrión había caído y la hoja «¡Tu rey ha caído!» seguía abierta encima de la pantalla final, tapando REVANCHA. Al pasar a `over` se cierran las hojas de mirar; `espectador.spec` lo comprueba. El gesto de deslizar admite hasta 1 s (en CI los toques simulados llegan despacio) y `sala.spec` pasa a su propio grupo de CI con más margen de tiempo (cuatro pruebas «flaky» por tiempo).

---
id: WRK-TASK-025
type: spec
layer: work-task
scope: ephemeral
status: completed
confidence: medium
version: 1.0.0
created: 2026-09-26
updated: 2026-09-26
owner: dimas
parent: WRK-PLAN-006
activates: [FEAT-CONTROL-001, FEAT-INTERFAZ-001, ADR-005]
dependencies:
  - id: WRK-TASK-024
    relation: depends-on
tags: [control, disparo]
---

# WRK-TASK-025 — Disparo manteniendo el clic izquierdo

## Objective

Que el disparo se cargue y se suelte tanto con Espacio como manteniendo el clic izquierdo sobre la escena, igual que con el botón de disparo.

## File Scope

- `client/src/game/aim.ts`: el botón 0 sobre el lienzo inicia y suelta la carga.
- Textos de ayuda:
  - `client/src/game/match/ui.ts`: panel de controles, rótulo de ronda y aviso de «mantén»;
  - `client/src/game/modes/sandbox.ts`;
  - `client/src/ui/tutorial.ts`, `client/src/ui/lobby.ts` («Cómo se juega») y `client/src/ui/hud.ts` (texto del botón);
  - `README.md` (controles).
- `tests/e2e/controls.spec.ts`
- Consolidación: `FEAT-CONTROL-001` y `ADR-005`, que amplía el control decidido en D-059.

## Implementation Notes

- Solo sobre el lienzo: las tarjetas, los botones y los paneles del HUD ya cortan `pointerdown`, así que un clic en la interfaz no dispara.
- Mientras se mantiene el clic derecho (apuntando), el izquierdo también carga; al soltarlo, dispara con la puntería de ese momento.
- Se usa `setPointerCapture` para que soltar fuera del lienzo también cuente.
- Fuera del apuntado, el clic izquierdo sigue sin hacer nada en la escena, como ahora.

## Acceptance Criteria

- [x] Mantener el clic izquierdo sobre la escena sube la fuerza como Espacio, y al soltarlo el disparo queda listo con esa fuerza.
- [x] Una pulsación de menos de 0,12 s no dispara y avisa, como con Espacio.
- [x] Un clic en una tarjeta de munición o en un botón del HUD no carga el disparo.
- [x] Tutorial, panel de controles, «Cómo se juega» y README mencionan el clic izquierdo.
- [x] E2E `controls`: disparo con clic izquierdo.

## Test Plan

| Level | What it covers |
|-------|----------------|
| E2E | `controls.spec.ts`: carga y disparo con el clic izquierdo, y clic en tarjeta sin disparar |

## Evidence

- **Código:** `AimInput`: el botón 0 sobre el lienzo empieza la carga (`startCharge('mouse')`, con captura del puntero) y soltarlo dispara. `chargeBy` hace que solo suelte la carga la entrada que la empezó: soltar un clic en una tarjeta mientras se mantiene Espacio no dispara.
- **Textos:** panel de controles (partida y campo de pruebas), rótulo de ronda, aviso de «mantén pulsado», tutorial, «Cómo se juega», texto del botón y README. «Cómo se juega» y README también explican la cuenta atrás.
- **E2E:** `controls.spec.ts` tiene una prueba nueva, «cargar y disparar manteniendo el clic izquierdo». Mantener pulsado sobre una tarjeta no carga, un toque corto no dispara, y mantener 0,9 s carga por encima del 20 % y deja el disparo listo con esa fuerza. En local, las 2 pruebas de `controls` en verde (2026-09-26).
- **Revisión visual** con `tests/tools/review.mjs`: el panel de controles muestra «Espacio · clic izdo.» sin desbordar.
- **Consolidación:** `FEAT-CONTROL-001` 1.2.0 y `ADR-005` 1.1.0 (ampliación del control decidido en D-059).

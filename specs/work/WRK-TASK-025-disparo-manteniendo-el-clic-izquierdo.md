---
id: WRK-TASK-025
type: spec
layer: work-task
scope: ephemeral
status: draft
confidence: medium
version: 0.1.0
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

- [ ] Mantener el clic izquierdo sobre la escena sube la fuerza como Espacio, y al soltarlo el disparo queda listo con esa fuerza.
- [ ] Una pulsación de menos de 0,12 s no dispara y avisa, como con Espacio.
- [ ] Un clic en una tarjeta de munición o en un botón del HUD no carga el disparo.
- [ ] Tutorial, panel de controles, «Cómo se juega» y README mencionan el clic izquierdo.
- [ ] E2E `controls`: disparo con clic izquierdo.

## Test Plan

| Level | What it covers |
|-------|----------------|
| E2E | `controls.spec.ts`: carga y disparo con el clic izquierdo, y clic en tarjeta sin disparar |

## Evidence

Pendiente.

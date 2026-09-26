---
id: WRK-TASK-024
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
activates: [FEAT-CONTROL-001, FEAT-INTERFAZ-001]
dependencies:
  - id: WRK-TASK-022
    relation: depends-on
tags: [control, hud, municion]
---

# WRK-TASK-024 — Munición con clic y teclado numérico

## Objective

Que la munición se elija siempre bien con un clic en su tarjeta, con 1/2/3 de la fila de números y con 1/2/3 del teclado numérico.

## File Scope

- `client/src/ui/hud.ts` (`setAmmo`)
- `client/src/game/match/ui.ts` (quién llama a `setAmmo` y cuándo)
- `client/src/game/aim.ts` (teclas)
- `client/src/game/modes/sandbox.ts` (usa las mismas tarjetas)
- `tests/e2e/controls.spec.ts`
- Consolidación: `FEAT-CONTROL-001` y `FEAT-INTERFAZ-001`.

## Implementation Notes

- **Causa del clic que falla:** `MatchUI.update` llama a `hud.setAmmo` en cada fotograma y `setAmmo` rehace los botones con `replaceChildren`. Si se pulsa sobre un botón y se suelta sobre el que lo ha sustituido, el navegador no genera `click`. Hay que rehacerlos solo cuando cambian la mano o la selección, y seleccionar en `pointerdown`, que no depende de soltar sobre el mismo elemento.
- **Teclado numérico:** `AimInput` solo escucha `Digit1-3`. Se añaden `Numpad1-3`, y en el campo de pruebas los equivalentes de sus teclas.

## Acceptance Criteria

- [x] Un clic en cualquiera de las 3 tarjetas la selecciona, también si el ratón se mueve un poco entre pulsar y soltar.
- [x] Las teclas 1/2/3 y Numpad 1/2/3 seleccionan la tarjeta correspondiente.
- [x] Las tarjetas no se rehacen si no cambia nada (el nodo DOM es el mismo entre fotogramas).
- [x] E2E `controls`: selección con clic, con Digit y con Numpad.

## Test Plan

| Level | What it covers |
|-------|----------------|
| E2E | `controls.spec.ts`: las tres formas de elegir munición |

## Evidence

- **Código:**
  - `Hud.setAmmo` solo rehace las tarjetas si cambian la mano, la selección o las teclas, y elige en `pointerdown` (botón izquierdo). El `click` queda para Intro con el teclado (`detail === 0`).
  - `AimInput` acepta `Numpad1-3`, y el campo de pruebas `Numpad0-9`, `NumpadSubtract` y `NumpadAdd`.
  - Las tarjetas 11 y 12 del campo de pruebas enseñan − y = (`AMMO_KEYS`), que era un punto de WRK-TASK-017.
- **E2E:** `controls.spec.ts` elige la 2.ª tarjeta con un clic en el que el ratón se mueve entre pulsar y soltar, y después usa Digit3, Numpad1 y Numpad2. Comprueba que elegir munición no dispara. Verde en local el 2026-09-26.
- **Consolidación:** `FEAT-CONTROL-001` 1.1.0, `FEAT-INTERFAZ-001` 1.2.0 y `FEAT-SANDBOX-001` 1.0.1.

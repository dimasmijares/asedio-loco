---
id: WRK-TASK-017
type: spec
layer: work-task
scope: ephemeral
status: completed
confidence: medium
version: 1.0.0
created: 2026-09-26
updated: 2026-09-26
owner: dimas
parent: WRK-PLAN-005
activates: [FEAT-CONTROL-001, FEAT-CAMARA-001, FEAT-INTERFAZ-001]
tags: [limpieza, textos]
---

# WRK-TASK-017 — Restos del control y la cámara antiguos

## Objective

Quitar textos y código que describen el tirachinas o la cámara lenta en directo, que ya no existen (D-059, D-060).

## File Scope

- `client/src/ui/settings.ts`: el ajuste se llama «Sensibilidad del tirachinas» (línea 103) y el comentario de la línea 8 habla del arrastre. Pasa a «Sensibilidad del ratón», como dice el README.
- `client/src/game/camera.ts`: `slowmo` y `CameraRig.follow`, sin uso desde D-060 (comprobar antes de borrar).
- `client/src/game/game.ts`, `client/src/game/match/host.ts`, `client/src/game/modes/solo.ts`: `timeScale`, que siempre vale 1 (comprobar que la repetición no lo usa).
- `shared/ballistics.ts`: `PREVIEW_TIME`, si no se usa.
- `shared/match.ts`: el comentario de `ammo` dice «máx. 2» y `HAND` vale 3.
- `client/src/game/match/autoplay.ts`: el comentario dice «como un bot difícil» y usa `normal`. Se corrige el comentario, no el comportamiento, porque las pruebas dependen de él.

Fuera: cualquier cambio de comportamiento.

## Acceptance Criteria

- [x] Ninguna cadena visible ni comentario menciona el tirachinas.
- [x] No queda código de cámara lenta en directo sin uso, y la repetición sigue a cámara lenta.
- [x] `npm run verify` y las E2E `controls` y `solo` en verde.

## Test Plan

| Level | What it covers |
|-------|----------------|
| Unit | `npm test` sin cambios |
| E2E | `controls`, `solo` y `physics` (el campo de pruebas) |

## Evidence

- **Código muerto quitado:**
  - modo de cámara `follow`, `slowmo` y los campos de seguimiento de `CameraRig`;
  - `Game.timeScale`, `HostEnv.timeScale` y su reinicio en `solo.ts`, y también en los arneses de `tests/balance` y `countdown.test.ts`;
  - `PREVIEW_TIME`.
- **Textos corregidos:**
  - «Sensibilidad al apuntar» en lugar de «del tirachinas»;
  - el comentario de `ammo` (`HAND` = 3);
  - el comentario de `autoplay.ts` (bot normal).
- Las teclas de las tarjetas 11 y 12 del campo de pruebas ya se arreglaron en WRK-TASK-024.
- La repetición sigue a cámara lenta: va por `view.stepReplay`, no por `timeScale`.
- Puertas en local (2026-09-26): tipos, 37 unitarios y lote E2E `multiplayer` (6), `controls` (2), `solo`, `touch` (2) y `hud-compact` (4): 15 en verde contra un servidor recién compilado.

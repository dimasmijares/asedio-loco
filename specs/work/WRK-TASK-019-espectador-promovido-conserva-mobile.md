---
id: WRK-TASK-019
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
activates: [ARCH-003, FEAT-SALAS-001]
tags: [servidor, moviles, fallo]
---

# WRK-TASK-019 — Un espectador que pasa a jugador conserva si es móvil

## Objective

En `server/index.ts` (línea 264), al volver al lobby un espectador pasa a jugador y su adjunto se reescribe sin el campo `mobile`. Un móvil promovido contaría como ordenador al elegir anfitrión (D-065).

## File Scope

- `server/index.ts` (la reescritura del adjunto al pasar a jugador)
- `tests/unit/` (si la lógica se puede probar sin el Durable Object) o `tests/e2e/multiplayer.spec.ts`

## Acceptance Criteria

- [x] Al pasar de espectador a jugador se conservan `mobile` y `name`.
- [x] Un móvil promovido no es elegido anfitrión si hay un ordenador.
- [x] `npm run verify` y `multiplayer -g "anfitrión"` en verde.

## Test Plan

| Level | What it covers |
|-------|----------------|
| E2E | Espectador móvil promovido en la revancha, y quién queda de anfitrión |

## Evidence

- `server/index.ts`: al pasar de espectador a jugador, el adjunto conserva el resto de campos (`{ ...wa, pid, role, name }`), así que `mobile` sigue ahí para elegir anfitrión.
- **Sin prueba automática propia:** el Durable Object no se carga en Vitest, y una E2E necesitaría un móvil que entre como espectador, el final de la partida y la revancha. La revancha y la migración siguen en verde.
- Puertas en local (2026-09-26): tipos, 37 unitarios y lote E2E `multiplayer` (6), `controls` (2), `solo`, `touch` (2) y `hud-compact` (4): 15 en verde contra un servidor recién compilado.

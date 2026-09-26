---
id: WRK-TASK-019
type: spec
layer: work-task
scope: ephemeral
status: draft
confidence: medium
version: 0.1.0
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

- [ ] Al pasar de espectador a jugador se conservan `mobile` y `name`.
- [ ] Un móvil promovido no es elegido anfitrión si hay un ordenador.
- [ ] `npm run verify` y `multiplayer -g "anfitrión"` en verde.

## Test Plan

| Level | What it covers |
|-------|----------------|
| E2E | Espectador móvil promovido en la revancha, y quién queda de anfitrión |

## Evidence

Pendiente.

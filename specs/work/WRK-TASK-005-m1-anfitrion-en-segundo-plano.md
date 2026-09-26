---
id: WRK-TASK-005
type: spec
layer: work-task
scope: ephemeral
status: completed
confidence: high
version: 1.0.0
created: 2026-09-25
updated: 2026-09-26
owner: dimas
parent: WRK-PLAN-004
activates:
  - ARCH-003
  - FEAT-SALAS-001
  - RULE-002
  - RULE-003
tags:
  - moviles
  - red
---

# WRK-TASK-005 — M1: anfitrión en segundo plano

## Objective

Que la partida no se congele cuando el anfitrión pasa a segundo plano: cede su papel a otro jugador conectado. Y que, si el creador de la sala es un móvil y hay un ordenador, el ordenador sea el anfitrión desde el principio.

## File Scope

- `client/src/game/modes/online.ts` (cesión con `visibilitychange`, paso a cliente y puesta al día)
- `client/src/net/connection.ts` (detección de móvil y `mobile` en el saludo)
- `server/index.ts` (mensaje `yield` y preferencia por ordenadores)
- `shared/protocol.ts` (`yield`, `mobile`, `PROTOCOL_VERSION` 5)
- `tests/e2e/multiplayer.spec.ts`, `tests/unit/protocol.test.ts`
- `.github/workflows/deploy.yml`, `CLAUDE.md`, `DECISIONES.md`, `docs/MOVILES.md`

## Implementation Notes

| Activated spec | What it requires of this task |
|----------------|-------------------------------|
| ARCH-003 | Reutilizar la migración de anfitrión que ya existe; el servidor solo elige y reparte la sala |
| FEAT-SALAS-001 | Al heredar, primero los ordenadores; el creador móvil cede al empezar |
| RULE-002 | Mensaje nuevo y campo nuevo en el saludo: protocolo v5 |
| RULE-003 | Desplegar sola y con CI verde antes de M2 |

- A los 2 s en segundo plano, el anfitrión manda `yield`. El que se va suelta su simulación y pide `full`; al volver, pide otro `full`.
- Sin otro humano conectado no se cede: la partida espera.
- Móvil = `pointer: coarse` sin `any-pointer: fine`. `?mobile=1/0` lo fuerza en las pruebas.
- Playwright no oculta la pestaña de verdad: la prueba redefine `document.visibilityState` y lanza `visibilitychange`.

## Acceptance Criteria

- [x] El anfitrión oculto 2 s pasa a cliente sin desconectarse y otro jugador hereda la partida con una migración.
- [x] La partida sigue sin él y, al volver, se pone al día y ve el mismo ganador.
- [x] Si no hay otro humano conectado, no se cede.
- [x] Un móvil que crea la sala con un ordenador dentro no es anfitrión: el ordenador simula desde la ronda 1, sin migración.
- [x] El servidor valida `yield` (solo el anfitrión en partida) y `mobile`.
- [x] Protocolo v5.

## Test Plan

| Level | What it covers |
|-------|----------------|
| Unit | `tests/unit/protocol.test.ts`: validación de `hello` con `mobile` y del mensaje `yield` |
| Integration | E2E `el anfitrión pasa a segundo plano y otro jugador sigue llevando la partida` y `un móvil que crea la sala cede el papel de anfitrión a un ordenador` (`tests/e2e/multiplayer.spec.ts`) |
| Manual | Ninguna: el caso real de cambiar de app en un móvil se comprobará con M2 |

## Evidence

- Commit `6e59421` (25-09-2026): «M1: el anfitrión en segundo plano cede la partida; un móvil cede el papel a un ordenador». 10 archivos, +150 −13.
- Pruebas E2E nuevas en `tests/e2e/multiplayer.spec.ts`:
  - `el anfitrión pasa a segundo plano y otro jugador sigue llevando la partida`: comprueba `demotions = 1` en el que se va, `migrations = 1` en el que hereda y el mismo ganador al final.
  - `un móvil que crea la sala cede el papel de anfitrión a un ordenador`: `role` cliente en el móvil y anfitrión en el ordenador, con 0 migraciones.
- Unitarios de protocolo actualizados en `tests/unit/protocol.test.ts`.
- CI: el grupo `migracion` de `deploy.yml` pasa a filtrar por `-g "anfitrión"`, así que ejecuta las dos pruebas nuevas junto a la de migración; batería E2E en verde contra producción.
- Decisión registrada: D-065 en `DECISIONES.md`. `docs/MOVILES.md` marca M1 como hecha.

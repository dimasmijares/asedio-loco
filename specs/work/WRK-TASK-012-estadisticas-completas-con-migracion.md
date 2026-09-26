---
id: WRK-TASK-012
type: spec
layer: work-task
scope: ephemeral
status: draft
confidence: low
version: 0.1.0
created: 2026-09-26
updated: 2026-09-26
owner: dimas
parent: WRK-PLAN-005
activates:
  - ARCH-003
  - FEAT-SENSACION-001
  - RULE-002
tags:
  - red
  - estadisticas
---

# WRK-TASK-012 — Estadísticas completas si el anfitrión se va en el impacto

## Objective

Que las estadísticas de una ronda (bloques perdidos y rotos, mejor disparo, disparo más ridículo, autogoles) no queden incompletas cuando el anfitrión se va en plena fase de impacto.

## File Scope

Propuesto:

- `client/src/game/match/host.ts` (cuentas de la ronda: `before` y `sim.stats`)
- `client/src/game/modes/online.ts` (`migrate`: hoy da por terminado el impacto sin esas cuentas)
- `client/src/game/sim/sim.ts` si `Sim.restore` tiene que recibir contadores
- `shared/match.ts` y `shared/protocol.ts` si las cuentas viajan en `MatchState`
- `tests/e2e/multiplayer.spec.ts`

## Implementation Notes

| Activated spec | What it requires of this task |
|----------------|-------------------------------|
| ARCH-003 | La migración reconstruye la física con lo que ve el heredero (D-031) |
| FEAT-SENSACION-001 | Las estadísticas divertidas (D-035) salen de estas cuentas |
| RULE-002 | Si cambia `MatchState`, subir `PROTOCOL_VERSION` |

- Opción barata: el anfitrión manda en `st` las cuentas de partida al empezar el impacto, y el heredero parte de ellas y cuenta lo que ve desde entonces.
- Los bloques perdidos se pueden recalcular comparando los bloques vivos con el recuento del inicio de la ronda.

## Acceptance Criteria

- [ ] Si el anfitrión se va en el impacto, los bloques perdidos de cada castillo en los resultados de esa ronda coinciden con la diferencia de bloques en pie.
- [ ] Las estadísticas finales incluyen la ronda de la migración.

## Test Plan

| Level | What it covers |
|-------|----------------|
| Unit | Resultados de ronda a partir de un recuento inicial y el estado de bloques |
| Integration | E2E de anfitrión caído que fuerza la salida en la fase de impacto |
| Manual | — |

## Evidence

Pendiente.

---
id: WRK-TASK-012
type: spec
layer: work-task
scope: ephemeral
status: completed
confidence: medium
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
- `tests/unit/inherited.test.ts`

## Implementation Notes

| Activated spec | What it requires of this task |
|----------------|-------------------------------|
| ARCH-003 | La migración reconstruye la física con lo que ve el heredero (D-031) |
| FEAT-SENSACION-001 | Las estadísticas divertidas (D-035) salen de estas cuentas |
| RULE-002 | Si cambia `MatchState`, subir `PROTOCOL_VERSION` |

- Opción barata: el anfitrión manda en `st` las cuentas de partida al empezar el impacto, y el heredero parte de ellas y cuenta lo que ve desde entonces.
- Los bloques perdidos se pueden recalcular comparando los bloques vivos con el recuento del inicio de la ronda.

## Acceptance Criteria

- [x] Si el anfitrión se va en el impacto, los bloques perdidos de cada castillo en los resultados de esa ronda coinciden con la diferencia de bloques en pie.
- [x] Las estadísticas finales incluyen la ronda de la migración.

## Test Plan

| Level | What it covers |
|-------|----------------|
| Unit | Resultados de ronda a partir de un recuento inicial y el estado de bloques |
| Integration | E2E de anfitrión caído que fuerza la salida en la fase de impacto |
| Manual | — |

## Evidence

2026-09-28. Opción barata de la tarea, sin tocar `Sim.restore`.

- `MatchState.impact` (`PROTOCOL_VERSION` 11): al empezar el impacto, el anfitrión guarda los bloques en pie de cada castillo y a qué castillo apunta cada jugador (`aimedAt`), y lo manda en el `st` de esa fase. Si el heredero lo recibe en pleno impacto, `resume` lo da por terminado y `endImpact` usa `inheritedCounts`: perdidos = en pie al empezar − en pie ahora en su mundo; los rotos de cada castillo se reparten entre quienes le apuntaban. Van a los resultados de la ronda y a las estadísticas de la partida (`p.stats.lost` y `dealt`), como en cualquier ronda.
- Limitaciones, anotadas en FEAT-SALAS-001: los rotos son aproximados (la simulación nueva no sabe quién rompió qué) y los disparos que aún no habían salido se pierden, como antes.
- `inherited.test.ts`: perdidos por diferencia y rotos repartidos (27 bloques entre dos atacantes: 14 y 13). La E2E de migración ahora cierra al anfitrión en pleno impacto, cuando ya ha roto al menos 3 bloques, y comprueba en el heredero que los perdidos de cada castillo son la diferencia de bloques en pie. 2 de 2. En una pasada, el castillo 2 pasó de 162 a 161 y los resultados dijeron 1 perdido (antes habría salido 0). En la otra, los bloques rotos no le habían llegado al heredero antes de que el anfitrión se fuera, así que en su mundo seguían en pie y la cuenta, 0, es coherente.


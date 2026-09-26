---
id: WRK-TASK-018
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
activates: [ARCH-003, FEAT-SALAS-001, RULE-002]
tags: [red, fallo]
---

# WRK-TASK-018 — Un estado completo viejo no aplica bloques ni poses

## Objective

D-064 dice que un cliente descarta un `st` o un `full` más viejo que el que ya tiene. En `netClient.applyFull` solo se ignora el `MatchState`: los bloques y las poses de un `full` viejo se aplican igualmente. Hay que decidir si es un fallo real (la red mantiene el orden, así que puede no pasar nunca) y, si lo es, descartar el `full` entero.

## File Scope

- `client/src/game/net/netClient.ts` (`applyFull`, línea 97, y la comprobación de la línea 66)
- `tests/unit/` o `tests/e2e/multiplayer.spec.ts` si hace falta una prueba

Fuera: el formato de los mensajes. Si cambia, se aplica RULE-002.

## Acceptance Criteria

- [x] Un `full` con la misma semilla y menor `v` no toca bloques, poses, reyes ni proyectiles.
- [x] Un `full` de otra partida (otra semilla, por ejemplo tras una revancha) se sigue aplicando.
- [x] La reconexión y la migración siguen en verde (`multiplayer -g "anfitrión"`).

## Test Plan

| Level | What it covers |
|-------|----------------|
| Unit | Orden de `full` y `st` con versiones |
| E2E | `multiplayer` completo |

## Evidence

- `isStale` (`client/src/game/net/messages.ts`) decide para `st` y `full`. Un `full` de la misma semilla con `v` menor no aplica nada: ni estado, ni bloques, ni reyes, ni proyectiles. Uno de otra semilla (revancha) sí se aplica.
- `tests/unit/messages.test.ts` (2 pruebas): viejo, igual, nuevo y otra partida.
- Puertas en local (2026-09-26): tipos, 37 unitarios y lote E2E `multiplayer` (6), `controls` (2), `solo`, `touch` (2) y `hud-compact` (4): 15 en verde contra un servidor recién compilado. Reconexión y migración incluidas.

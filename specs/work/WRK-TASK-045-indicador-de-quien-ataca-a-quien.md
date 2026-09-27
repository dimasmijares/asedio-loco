---
id: WRK-TASK-045
type: spec
layer: work-task
scope: ephemeral
status: completed
confidence: medium
version: 0.1.0
created: 2026-09-27
updated: 2026-09-27
owner: dimas
parent: WRK-PLAN-010
activates: [FEAT-INTERFAZ-001, FEAT-CAMARA-001, ARCH-003]
tags: [interfaz, claridad]
---

# WRK-TASK-045 — Indicador de quién ataca a quién

## Objective

Que durante la cuenta atrás se vea a qué castillo apunta cada jugador, para entender lo que va a pasar y reconocer las venganzas.

## File Scope

- `client/src/game/match/ui.ts` (datos de objetivo de cada jugador)
- `client/src/game/view.ts` o `render/fx.ts` (arcos o flechas en 3D)
- `client/src/game/net/netClient.ts` si falta el objetivo de los demás en los clientes
- `client/src/game/render/arcs.ts` (nuevo), `client/src/game/modes/online.ts` (`summary`)
- `tests/e2e/solo.spec.ts`, `tests/e2e/multiplayer.spec.ts`

## Implementation Notes

Durante la fase `countdown`, un arco discontinuo del color de cada jugador desde su catapulta hasta el castillo objetivo, visible desde el plano general. Se desvanece al empezar el impacto. El objetivo de cada jugador ya viaja en los mensajes de puntería (`tgt`).

## Acceptance Criteria

- [x] En la cuenta atrás se ven los arcos de todos los jugadores vivos, en PC y en móvil vertical (capturas).
- [x] En red, un invitado ve los mismos arcos que el anfitrión.
- [x] `perf.spec.ts` dentro del presupuesto.

## Test Plan

| Level | What it covers |
|-------|----------------|
| E2E | Arcos presentes en la cuenta atrás (solitario y red) |

## Evidence

2026-09-27.

- `AttackArcs` (`client/src/game/render/arcs.ts`): 22 guiones por arco (cilindros de 0,2 m de radio en un InstancedMesh con color por instancia) sobre una curva cuadrática de la catapulta a 5,5 m por encima del castillo objetivo, más una punta cónica. El punto de control sube 4 m + 0,22 × la distancia y se desplaza a la derecha de la marcha (0,12 × la distancia): A→B y B→A no se tapan. Los guiones avanzan hacia el objetivo (0,6 tramos/s). Entra en 0,35 s y sale en 0,3 s. Dos llamadas de dibujo.
- `MatchUI.showArcs` al entrar en `countdown`, con los jugadores vivos cuyo objetivo sigue vivo; `hide` al salir de la cuenta atrás. El objetivo sale de `MatchState.target`, que ya llega a los invitados en `st`: sin cambio de protocolo.
- Capturas con GPU (1280×720 y 390×844, `seed=21`): los 4 arcos se ven en la cuenta atrás en los dos formatos y se desvanecen con «¡FUEGO!». En vertical se leen más finos, pero se distinguen los colores.
- `solo.spec.ts` comprueba los arcos de la primera cuenta atrás; la prueba de revancha de `multiplayer.spec.ts` comprueba que el invitado ve los mismos 4 pares que el anfitrión en la ronda 1. Las dos, en verde en local.
- `perf.spec.ts` en verde (SwiftShader: 11 fps de media, 394 llamadas de dibujo como máximo). `npm run verify` en verde.

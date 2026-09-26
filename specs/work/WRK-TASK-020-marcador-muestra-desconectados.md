---
id: WRK-TASK-020
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
activates: [FEAT-INTERFAZ-001, FEAT-SALAS-001]
tags: [hud, red]
---

# WRK-TASK-020 — El marcador de la partida muestra quién está desconectado

## Objective

El HUD sabe pintar 📡 junto a un jugador desconectado, pero `MatchUI` no le pasa `connected` (`client/src/game/match/ui.ts`, línea 211). En partida nunca se ve quién se ha caído.

## File Scope

- `client/src/game/match/ui.ts`
- `client/src/ui/hud.ts` (solo si hace falta)
- De dónde sale `connected`: la lista de la sala (`room`) en el modo en red, `client/src/game/modes/online.ts`.

## Acceptance Criteria

- [x] Un jugador que cierra la pestaña aparece con 📡 en el marcador de los demás en menos de 3 s, y deja de aparecer al reconectar.
- [x] En solitario no cambia nada.
- [x] La E2E de reconexión lo comprueba.

## Test Plan

| Level | What it covers |
|-------|----------------|
| E2E | `multiplayer`: reconexión, con captura del marcador |

## Evidence

- `MatchSource.connected`: en red sale de `conn.room.players[].connected`; en solitario no se usa.
- `MatchUI` lo pasa al marcador, y la celda de estado enseña 📡 (con `title` «Desconectado») en lugar de ✔. Se ve también en el HUD compacto, que oculta los nombres.
- **E2E de 4 jugadores:** el jugador que se reconecta sale antes a `about:blank`, y el anfitrión ve 📡 en su hueco (log: «reconexión: el anfitrión ve 📡 en el hueco 2»). Después vuelve y recupera su castillo.
- Puertas en local (2026-09-26): tipos, 37 unitarios y lote E2E `multiplayer` (6), `controls` (2), `solo`, `touch` (2) y `hud-compact` (4): 15 en verde contra un servidor recién compilado.

---
id: WRK-TASK-020
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

- [ ] Un jugador que cierra la pestaña aparece con 📡 en el marcador de los demás en menos de 3 s, y deja de aparecer al reconectar.
- [ ] En solitario no cambia nada.
- [ ] La E2E de reconexión lo comprueba.

## Test Plan

| Level | What it covers |
|-------|----------------|
| E2E | `multiplayer`: reconexión, con captura del marcador |

## Evidence

Pendiente.

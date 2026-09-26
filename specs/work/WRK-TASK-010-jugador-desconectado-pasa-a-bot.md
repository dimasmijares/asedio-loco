---
id: WRK-TASK-010
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
  - FEAT-BOTS-001
  - DOM-JUEGO-001
  - RULE-002
tags:
  - red
  - bots
---

# WRK-TASK-010 — Un jugador desconectado pasa a ser un bot

## Objective

Que el castillo de un jugador que se desconecta en plena partida lo lleve un bot, en lugar de disparar siempre con la última puntería cuando se acaba el tiempo.

## File Scope

Propuesto:

- `client/src/game/match/host.ts` (tratar el hueco como bot mientras esté desconectado)
- `client/src/game/modes/online.ts`, `client/src/game/net/netHost.ts` (saber quién está conectado a partir de `room`)
- `shared/match.ts` si `PlayerState` necesita un campo nuevo, y `shared/protocol.ts` (`PROTOCOL_VERSION`)
- `tests/e2e/multiplayer.spec.ts`

Fuera: el servidor (ya informa de quién está conectado en `room`) y la lógica de los bots (`shared/bot.ts`).

## Implementation Notes

| Activated spec | What it requires of this task |
|----------------|-------------------------------|
| ARCH-003 | Solo el anfitrión decide; los clientes lo ven por `st` |
| FEAT-BOTS-001 | Reutilizar `botDecide` con la dificultad de la sala |
| DOM-JUEGO-001 | El jugador sigue siendo el dueño del castillo: al reconectar recupera el control |
| RULE-002 | Si cambia `MatchState`, subir `PROTOCOL_VERSION` |

- La reconexión por token (D-033) no se puede romper.
- Falta decidir si pasa a bot al momento o tras un margen (WRK-SPEC-005, Open Questions).

## Acceptance Criteria

- [ ] Un jugador que cierra la pestaña en plena partida: en la ronda siguiente su catapulta elige objetivo y dispara como un bot.
- [ ] Si vuelve con su token, recupera el control desde la siguiente fase de apuntado.
- [ ] El HUD indica que ese castillo lo lleva un bot mientras tanto.

## Test Plan

| Level | What it covers |
|-------|----------------|
| Unit | — |
| Integration | E2E: un jugador cierra su contexto y su hueco dispara a otro castillo; vuelve y deja de ser bot |
| Manual | — |

## Evidence

Pendiente.

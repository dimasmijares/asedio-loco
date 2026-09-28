---
id: WRK-TASK-010
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
- `shared/bot.ts` (una línea: `decideBots` también decide por los `auto`), `client/src/game/match/ui.ts` (🤖 en el marcador), `.github/workflows/` (grupo `desconexion`)

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

- [x] Un jugador que cierra la pestaña en plena partida: en la ronda siguiente su catapulta elige objetivo y dispara como un bot.
- [x] Si vuelve con su token, recupera el control desde la siguiente fase de apuntado.
- [x] El HUD indica que ese castillo lo lleva un bot mientras tanto.

## Test Plan

| Level | What it covers |
|-------|----------------|
| Unit | — |
| Integration | E2E: un jugador cierra su contexto y su hueco dispara a otro castillo; vuelve y deja de ser bot |
| Manual | — |

## Evidence

2026-09-28.

- Decisión por defecto, pendiente de que el usuario la confirme (WRK-SPEC-005, Open Questions): pasa a bot al empezar la ronda siguiente a la desconexión. Hasta entonces dispara con su última puntería, como antes, y el resto de la ronda hace de margen para reconectar.
- `PlayerState.auto` (`PROTOCOL_VERSION` 10). `MatchHost.beginRound` lo pone con `isConnected` (lo que el servidor dice en `room`) y usa `autoDifficulty`, la dificultad de la sala. `decideBots` decide también por ellos. `NetHost` reenvía su puntería como la de un bot y `setInput` ignora sus entradas hasta el siguiente apuntado. El marcador enseña 🤖 junto a 📡.
- Hallazgo en `shared/bot.ts`, fuera del alcance propuesto: sin tocar la línea de `decideBots` que elige a quién decide, no había forma de reutilizar los bots.
- E2E nueva en `multiplayer.spec.ts` («un jugador desconectado pasa a ser un bot…»): el invitado se va en la ronda 1. En la ronda 2 (con escudo real, así que su rey sigue vivo) su hueco está en `auto`, lo marca 🤖 y fija su disparo contra un rival. Al volver con su token, en el siguiente apuntado deja de estar en `auto`. 3 de 3 con `--repeat-each 3`, y la batería de red local entera, 7 de 7. La primera versión sondeaba cada 400 ms y se saltaba los apuntados cortos: ahora lee el estado en la propia página en cada fotograma. Nuevo grupo de CI: `desconexion`.


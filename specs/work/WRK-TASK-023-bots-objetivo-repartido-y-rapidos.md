---
id: WRK-TASK-023
type: spec
layer: work-task
scope: ephemeral
status: completed
confidence: medium
version: 1.0.0
created: 2026-09-26
updated: 2026-09-26
owner: dimas
parent: WRK-PLAN-006
activates: [FEAT-BOTS-001, DOM-JUEGO-001, RULE-001]
tags: [bots, equilibrio]
---

# WRK-TASK-023 — Bots: objetivo repartido, venganza y ataque en 1-3 s

## Objective

Que los bots no vayan todos a por el mismo jugador (hoy, por los empates, a por el hueco 0) y que fijen su ataque en 1-3 s.

## File Scope

- `shared/bot.ts`: `BOT_SKILL`, `botDecide` y la elección de objetivo.
- `client/src/game/match/host.ts`: `planBots` (reparto entre bots y quién atacó a quién en la ronda anterior).
- `tests/unit/`: pruebas del reparto con semillas.
- `tests/balance/`: resultados nuevos.
- `specs/feature/FEAT-BOTS-001-*`: consolidación.

## Implementation Notes

- **Sorteo ponderado:** cada rival vivo empieza con peso 1 y el sorteo usa el `rng` del bot en la ronda, así que es determinista y los empates se resuelven al azar.
  - Si es el más débil (o empata), el peso se multiplica por `1 + 2·pWeakest`.
  - Si es el más cercano (o empata), por `2 − pWeakest`.
  - Si le atacó en la ronda anterior, por 2,5.
  - Por cada bot que ya lo ha elegido en esta ronda, por 0,4.
- **`lockDelay`:** fácil [2, 3], normal [1,5, 2,5] y difícil [1, 2].
- **Quién atacó a quién:** el castillo más alineado con el rumbo del disparo de cada jugador al empezar el impacto de la ronda anterior (`aimedAt`; el `target` de un humano no sirve, porque apunta con el ratón sin cambiarlo). Lo guarda el anfitrión. Tras una migración se pierde durante una ronda; se acepta.

## Acceptance Criteria

- [x] Con 1 humano y 3 bots, en 200 rondas con semillas distintas, los 3 bots coinciden en el mismo objetivo en menos del 25 % de las rondas.
- [x] Un jugador que atacó a un bot es elegido por ese bot en la ronda siguiente más a menudo que sin venganza.
- [x] `lockDelay` entre 1 y 3 s en todas las dificultades.
- [x] Equilibrio de normal y difícil medido antes y después, con las cifras en Evidence.

## Test Plan

| Level | What it covers |
|-------|----------------|
| Unit | Reparto, venganza y retraso con semillas fijas |
| Balance | `GAMES=8`, normal y difícil |
| E2E | `solo` en verde |

## Evidence

- **Código:** `shared/bot.ts` añade `pickTarget`, `decideBots` y `aimedAt`, con `lockDelay` nuevo; `MatchHost.planBots` usa `decideBots` y guarda en `beginImpact` a quién apuntó cada uno.
- **Causa del fallo:** en la ronda 1 todos tienen 140 bloques y hay rivales a la misma distancia. La ordenación estable dejaba primero al hueco 0, que es el del humano, y luego el humano seguía siendo «el más débil».
- **`tests/unit/bot.test.ts` (7 pruebas):** con 200 semillas, los 3 bots coinciden en el mismo objetivo en menos del 25 % y al humano le toca menos del 45 % de los ataques en las 3 dificultades. Con el humano a 60 bloques, los 3 van a por él en menos del 30 %. La venganza hace que el atacante sea elegido más de 1,5 veces más que sin ella. `lockDelay` está entre 1 y 3 s.
- **Equilibrio (RULE-001), antes → después:** normal, de 9,6 rondas y 307 s a 8,6 rondas y 274 s (8 partidas); difícil, de 6,0 rondas y 202 s (6 partidas) a 7,4 rondas y 244 s (8 partidas).
- **Puertas:** `npm run verify` (33 pruebas) y la E2E `solo` en local, en verde el 2026-09-26.
- `FEAT-BOTS-001` pasa a 1.1.0; `DOM-JUEGO-001` y `RULE-001` con las cifras nuevas.

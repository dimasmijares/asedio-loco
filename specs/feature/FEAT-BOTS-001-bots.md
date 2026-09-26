---
id: FEAT-BOTS-001
type: spec
layer: feature
status: active
confidence: medium
version: 1.1.0
created: 2026-09-26
updated: 2026-09-26
owner: dimas
dependencies:
  - id: PROD-JUGAR-001
    relation: implements
  - id: DOM-JUEGO-001
    relation: constrained-by
  - id: DOM-JUEGO-003
    relation: uses-data-from
  - id: DOM-JUEGO-004
    relation: uses-data-from
  - id: RULE-001
    relation: constrained-by
supersedes: null
tags:
  - bots
  - ia
  - equilibrio
  - pruebas
---

# FEAT-BOTS-001 — Bots

## Intent

Se puede jugar solo o rellenar una sala con rivales que apunten de forma creíble. Los bots también sirven para medir el equilibrio sin personas y para jugar partidas enteras en las pruebas automáticas.

## Definition

### Purpose

Decidir por cada bot, al empezar la ronda, a quién dispara, con qué munición y con qué puntería, con un error que depende de la dificultad.

### Inputs

| Input | Type | Required | Notes |
|---|---|---|---|
| `MatchState` | Estado | Sí | Rivales vivos, bloques en pie, viento, `fast` |
| Posición de los reyes | `Record<slot, Vec3>` | No | De la física (anfitrión) o de la vista (autoplay) |
| Dificultad | `facil` \| `normal` \| `dificil` | Sí | De la sala o de «Jugar solo»; por defecto `normal` |
| Semilla | `rng(seed ^ hash("bot:ronda:hueco"))` | Sí | Decisión reproducible |

### Behavior

1. **Objetivo:** un sorteo ponderado entre los rivales vivos (`pickTarget`). Todos empiezan con peso 1, y el peso se multiplica:
   - por `1 + 2·pWeakest` si es el más débil (±2 bloques);
   - por `2 − pWeakest` si su rey es el más cercano (±1 m);
   - por 2,5 si le atacó en la ronda anterior (venganza);
   - por 0,4 por cada bot que ya lo ha elegido en esta ronda.

   Los bots eligen en un orden al azar (`decideBots`). «Le atacó» es el castillo más alineado con el rumbo de su disparo (`aimedAt`), no el objetivo elegido, porque un humano puede apuntar sin cambiarlo. Los empates se resuelven al azar. Antes ganaba siempre el hueco más bajo, y los 3 bots iban a por el humano (WRK-TASK-023).
2. **Munición** (de las 3 de la mano):
   - Defensiva (andamio o burbuja) si su castillo está por debajo del 80 % y sale un 75 %, o si todas son defensivas. Con una defensiva no cambia la puntería.
   - Si no, la de mayor rareza: épica > rara > común.
3. **Punto de mira:** con probabilidad `pKing` el rey (+0,2 m); si no, uno de 6 puntos de la estructura (murallas, torres, torreón), a escala 1,2.
4. **Puntería:** `solveAim` con el mismo modelo balístico del juego (arrastre de la munición y viento). Elevación al azar: 0,35-0,55 rad para tronco y bola de nieve, que ruedan; 0,55-0,95 rad para el resto. Después, un error gaussiano en el rumbo y en la fuerza.
5. **Ritmo:** la catapulta gira suavemente hacia la solución y confirma tras un retraso al azar (×0,25 con `?fast=1`).

| Dificultad | Error de rumbo | Error de fuerza | `pKing` | `pWeakest` | Confirma a los |
|---|---|---|---|---|---|
| Fácil | 5,5° | 10 % | 0,25 | 0,3 | 2-3 s |
| Normal | 3,3° | 5,5 % | 0,4 | 0,5 | 1,5-2,5 s |
| Difícil | 1,7° | 3 % | 0,6 | 0,7 | 1-2 s |

6. **Migración:** el nuevo anfitrión vuelve a decidir por todos los bots si la ronda está en apuntado.
7. **Autoplay** (`?autoplay=1`, solo pruebas):
   - En solitario, el hueco humano pasa a ser un bot difícil del anfitrión.
   - En red, `AutoPlayer` decide como un bot normal y manda sus entradas por el mismo camino que una persona. Confirma a más tardar 0,8 s antes de acabar el tiempo.

### Outputs

| Output | Type | Notes |
|---|---|---|
| `BotDecision {target, selected, aim, lockDelay}` | Objeto | Aplicado por `MatchHost.updateBots` |
| Puntería de los bots | `tk.a` | Los clientes ven girar sus catapultas |

### Known Limitations

- Las partidas varían mucho de duración: con bots difíciles un rey puede caer en la ronda 1; con fáciles se llega a la inundación (ronda 10) y más allá.
- Los bots no reaccionan a lo que pasa durante la ronda ni aprenden de sus fallos: deciden una vez.
- Un humano que se desconecta no pasa a bot (FEAT-SALAS-001).
- Tras una migración de anfitrión se pierde durante una ronda quién atacó a quién: esa ronda no hay venganza.

## Acceptance Criteria

- [x] Una partida local contra 3 bots llega al final con un ganador.
- [x] Partidas de 4 bots en Node terminan y dejan el resumen de duración (`tests/balance`, a mano).
- [x] Con 1 humano y 3 bots, los 3 coinciden en el mismo objetivo en menos del 25 % de las rondas, y al humano le toca menos del 45 % de los ataques (200 semillas, las 3 dificultades).
- [x] Con el humano muy tocado, los 3 bots van a por él a la vez en menos del 30 % de las rondas.
- [x] Un bot devuelve el golpe a quien le atacó más a menudo que sin venganza.
- [x] Los bots fijan su ataque entre 1 y 3 s.
- [ ] Con la misma semilla, un bot toma la misma decisión (sin prueba unitaria).
- [ ] Un bot con el castillo por debajo del 80 % elige munición defensiva más a menudo (sin prueba).

## Evidence

| Type | Reference | Date | Confidence impact |
|------|-----------|------|-------------------|
| Testing | `tests/e2e/solo.spec.ts`, `tests/balance/balance.test.ts` | 2026-09-26 | low → medium |
| Production data | Equilibrio de D-058 y D-063: normal 9,6 rondas, difícil 6 | 2026-09-25 | — |
| Testing | `tests/unit/bot.test.ts` y equilibrio tras WRK-TASK-023: normal 8,6 rondas y 274 s; difícil 7,4 rondas y 244 s | 2026-09-26 | — |

## Traceability

| Relation | Target | Description |
|----------|--------|-------------|
| Implemented in | `shared/bot.ts` | `BOT_SKILL`, `pickTarget`, `decideBots`, `aimedAt`, `botDecide`, puntos de la estructura |
| Tested by | `tests/unit/bot.test.ts` | Reparto de objetivos, venganza, `aimedAt` y retraso |
| Implemented in | `shared/ballistics.ts` | `solveAim` |
| Implemented in | `client/src/game/match/host.ts` | `planBots`, `updateBots` |
| Implemented in | `client/src/game/match/autoplay.ts` | `AutoPlayer` (red) |
| Implemented in | `client/src/game/modes/solo.ts` | Humano como bot difícil con `autoplay` |
| Tested by | `tests/e2e/solo.spec.ts` | Partida completa con `autoplay=1` |
| Tested by | `tests/balance/balance.test.ts` | `GAMES=8 DIFF=normal`, resumen en `tests/balance/ultimo-<dif>.txt` |
| Decided in | D-022, D-023, D-026, D-058, WRK-SPEC-006 | Herramienta de equilibrio, bots, autoplay, 3 municiones |

## Open Questions

- `autoplay.ts` dice «decide como un bot difícil», pero usa `normal`. En solitario el autoplay es difícil. ¿Cuál vale? — dimas

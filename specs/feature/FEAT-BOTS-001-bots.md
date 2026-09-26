---
id: FEAT-BOTS-001
type: spec
layer: feature
status: active
confidence: medium
version: 1.0.0
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

1. **Objetivo:** con probabilidad `pWeakest` el rival con menos bloques; si no, el rey rival más cercano a su catapulta.
2. **Munición** (de las 3 de la mano):
   - Defensiva (andamio o burbuja) si su castillo está por debajo del 80 % y sale un 75 %, o si todas son defensivas. Con una defensiva no cambia la puntería.
   - Si no, la de mayor rareza: épica > rara > común.
3. **Punto de mira:** con probabilidad `pKing` el rey (+0,2 m); si no, uno de 6 puntos de la estructura (murallas, torres, torreón), a escala 1,2.
4. **Puntería:** `solveAim` con el mismo modelo balístico del juego (arrastre de la munición y viento). Elevación al azar: 0,35-0,55 rad para tronco y bola de nieve, que ruedan; 0,55-0,95 rad para el resto. Después, un error gaussiano en el rumbo y en la fuerza.
5. **Ritmo:** la catapulta gira suavemente hacia la solución y confirma tras un retraso al azar (×0,25 con `?fast=1`).

| Dificultad | Error de rumbo | Error de fuerza | `pKing` | `pWeakest` | Confirma a los |
|---|---|---|---|---|---|
| Fácil | 5,5° | 10 % | 0,25 | 0,3 | 4-8 s |
| Normal | 3,3° | 5,5 % | 0,4 | 0,5 | 2,5-6 s |
| Difícil | 1,7° | 3 % | 0,6 | 0,7 | 1,5-4 s |

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

## Acceptance Criteria

- [x] Una partida local contra 3 bots llega al final con un ganador.
- [x] Partidas de 4 bots en Node terminan y dejan el resumen de duración (`tests/balance`, a mano).
- [ ] Con la misma semilla, un bot toma la misma decisión (sin prueba unitaria).
- [ ] Un bot con el castillo por debajo del 80 % elige munición defensiva más a menudo (sin prueba).

## Evidence

| Type | Reference | Date | Confidence impact |
|------|-----------|------|-------------------|
| Testing | `tests/e2e/solo.spec.ts`, `tests/balance/balance.test.ts` | 2026-09-26 | low → medium |
| Production data | Equilibrio de D-058 y D-063: normal 9,6 rondas, difícil 6 | 2026-09-25 | — |

## Traceability

| Relation | Target | Description |
|----------|--------|-------------|
| Implemented in | `shared/bot.ts` | `BOT_SKILL`, `botDecide`, puntos de la estructura |
| Implemented in | `shared/ballistics.ts` | `solveAim` |
| Implemented in | `client/src/game/match/host.ts` | `planBots`, `updateBots` |
| Implemented in | `client/src/game/match/autoplay.ts` | `AutoPlayer` (red) |
| Implemented in | `client/src/game/modes/solo.ts` | Humano como bot difícil con `autoplay` |
| Tested by | `tests/e2e/solo.spec.ts` | Partida completa con `autoplay=1` |
| Tested by | `tests/balance/balance.test.ts` | `GAMES=8 DIFF=normal`, resumen en `tests/balance/ultimo-<dif>.txt` |
| Decided in | D-022, D-023, D-026, D-058 | Herramienta de equilibrio, bots, autoplay, 3 municiones |

## Open Questions

- `autoplay.ts` dice «decide como un bot difícil», pero usa `normal`. En solitario el autoplay es difícil. ¿Cuál vale? — dimas

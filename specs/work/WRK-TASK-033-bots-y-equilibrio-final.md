---
id: WRK-TASK-033
type: spec
layer: work-task
scope: ephemeral
status: completed
confidence: medium
version: 1.0.0
created: 2026-09-26
updated: 2026-09-26
owner: dimas
parent: WRK-PLAN-007
activates: [DOM-JUEGO-003, RULE-001, FEAT-BOTS-001, DOM-JUEGO-001]
tags: [municion, equilibrio]
---

# WRK-TASK-033 — Bots y equilibrio final

## Objective

Que los bots saquen partido a cada munición y que la partida completa quede equilibrada tras subir el destrozo.

## File Scope

- `shared/bot.ts` (elección de munición y punto de mira)
- `shared/ammo.ts` (pesos, andamio)
- `shared/match.ts` si se compensa la duración

## Implementation Notes

- Bots: sandía y piano al rey o a su torre; tronco y bola de nieve a la base; vaca y cocos al centro de la muralla.
- Andamio: subir de 10 bloques si el destrozo medio sube mucho.
- Duración: según la decisión del usuario (aceptar partidas más cortas o compensar).

## Acceptance Criteria

- [x] Equilibrio normal y difícil medidos y dentro de lo que decida el usuario.
- [x] DOM-JUEGO-003 consolidada con la tabla nueva.
- [x] WRK-PLAN-007 y WRK-SPEC-007 completados.

## Test Plan

| Level | What it covers |
|-------|----------------|
| Medición | `destrozo` (12 disparos) y `balance` normal y difícil con `GAMES=8`, antes y después |
| E2E | Grupos `fisica` y `solitario` |

## Evidence

- **Bots:** punto de mira según la munición (`AIM_POINTS` y `KING_BONUS` en `shared/bot.ts`). La elección de munición no cambia: defensiva si el castillo está tocado; si no, la más rara.
- **Andamio:** de 10 a 15 bloques (`SCAFFOLD_BLOCKS`), porque la media por disparo pasa de 8,4 a 16,1.
- **Agujero negro:** el escupitajo final sube de 80 a 90 de fuerza (22,8 bloques): con 80 se quedaba en el borde de la franja (19,8-20,2).
- **Equilibrio final (8 partidas):**

  | Dificultad | Antes del plan | Solo bots por munición | Con andamio de 15 |
  |---|---|---|---|
  | Fácil | 12,5 rondas, 271 s (6 partidas, antigua) | 8,1 rondas, 155 s | 7,0 rondas, 140 s |
  | Normal | 9,1 rondas, 165 s | 6,5 rondas, 127 s | 6,8 rondas, 132 s |
  | Difícil | 7,3 rondas, 139 s | 6,4 rondas, 124 s | 6,5 rondas, 123 s |

  Dentro de lo decidido por el usuario (partidas más cortas, sin bajar de unas 6 rondas en normal). Las mediciones de 8 partidas bailan ±1 ronda.
- **Destrozo final:** las 10 municiones en su franja; tabla en `DOM-JUEGO-003`.

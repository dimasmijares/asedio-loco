---
id: WRK-TASK-033
type: spec
layer: work-task
scope: ephemeral
status: active
confidence: low
version: 0.1.0
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

- [ ] Equilibrio normal y difícil medidos y dentro de lo que decida el usuario.
- [ ] DOM-JUEGO-003 consolidada con la tabla nueva.
- [ ] WRK-PLAN-007 y WRK-SPEC-007 completados.

## Test Plan

| Level | What it covers |
|-------|----------------|
| Medición | `destrozo` (12 disparos) y `balance` normal y difícil con `GAMES=8`, antes y después |
| E2E | Grupos `fisica` y `solitario` |

## Evidence

Pendiente.

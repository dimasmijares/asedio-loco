---
id: WRK-TASK-055
type: spec
layer: work-task
scope: ephemeral
status: draft
confidence: low
version: 0.1.0
created: 2026-09-28
updated: 2026-09-28
owner: dimas
parent: WRK-PLAN-011
activates: [DOM-JUEGO-003, FEAT-BOTS-001, FEAT-INTERFAZ-001, RULE-001]
tags: [municion, equilibrio]
---

# WRK-TASK-055 — Solo munición que vuela en parábola

## Objective

Sacar del reparto, por ahora, la munición que no vuela en parábola desde la catapulta: piano, burbuja, andamio y gallina. El código se queda, desactivado.

## File Scope

- `shared/ammo.ts` (una marca por munición, p. ej. `enabled: false`, que `drawAmmo` respeta; pesos)
- `shared/match.ts` (carta de premio y objetivos, si nombran munición retirada)
- `shared/bot.ts` (preferencias de munición)
- `client/src/ui/` y tutorial (textos que las nombran)
- `client/src/game/modes/sandbox.ts` (el campo de pruebas puede seguir ofreciéndolas o no: decidir y anotar)
- `tests/unit/`, `tests/balance/`
- `specs/domain/DOM-JUEGO-003-municion.md`

## Implementation Notes

| Activated spec | What it requires of this task |
|----------------|-------------------------------|
| DOM-JUEGO-003 | Tabla de munición y reglas 4-5 (rarezas por sorteo) con 8 municiones y sin defensivas |
| FEAT-BOTS-001 | `KING_BONUS` y los puntos de mira por munición no deben elegir una retirada |
| FEAT-INTERFAZ-001 | Tutorial y «Cómo se juega» sin la munición retirada |
| RULE-001 | Destrozo y equilibrio antes y después |

- Quedan: pedrusco, tronco, cocos (comunes); vaca, sandía (raras); agujero negro, imán, bola de nieve (épicas). Sin defensivas: `DUEL_BOOST` y los porcentajes por rareza cambian; recalcularlos y anotarlos.
- La mano sigue siendo de 3 distintas (`HAND`): con 8 hay de sobra.
- Cambia el reparto con la misma semilla: las pruebas que fijan una mano concreta se actualizan.

## Acceptance Criteria

- [ ] En 10 000 manos sorteadas no sale ninguna munición retirada (unitaria).
- [ ] El tutorial, «Cómo se juega» y el HUD no nombran munición retirada.
- [ ] Destrozo y equilibrio (normal y difícil) antes y después, en `tests/balance/`.
- [ ] DOM-JUEGO-003 al día (tabla, porcentajes por rareza) y ADR nueva «munición solo en parábola».

## Test Plan

| Level | What it covers |
|-------|----------------|
| Unit | Reparto sin munición retirada; semilla estable |
| Medición | Destrozo y equilibrio |

## Evidence

Pendiente.

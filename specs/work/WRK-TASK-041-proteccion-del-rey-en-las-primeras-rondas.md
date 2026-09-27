---
id: WRK-TASK-041
type: spec
layer: work-task
scope: ephemeral
status: draft
confidence: low
version: 0.1.0
created: 2026-09-27
updated: 2026-09-27
owner: dimas
parent: WRK-PLAN-010
activates: [DOM-JUEGO-001, DOM-JUEGO-003, FEAT-INTERFAZ-001, RULE-001, RULE-002]
dependencies:
  - id: WRK-TASK-044
    relation: depends-on
tags: [jugabilidad, reyes]
---

# WRK-TASK-041 — Protección del rey en las primeras rondas

## Objective

Evitar que un jugador quede eliminado en la primera ronda. Hoy, en difícil, la primera eliminación llega en la ronda 1 en 10 de 12 partidas (`ultimo-dificil.txt`), y un humano eliminado tan pronto pasa toda la partida mirando.

## File Scope

- `shared/match.ts` (qué rondas protegen y estado visible)
- `client/src/game/sim/sim.ts` (`killKing`, daño al rey)
- `client/src/game/match/host.ts`
- `client/src/game/view.ts` y `render/` (indicador visual)
- `client/src/game/match/ui.ts` y `ui/hud.ts` (aviso)
- `shared/protocol.ts` si cambia el estado

## Implementation Notes

**Decisión del usuario al empezar** (dar opciones, con una recomendada):

- a) **Escudo real en las rondas 1-2** (recomendada): el rey no puede morir durante esas rondas. Si al final de la ronda protegida está fuera del castillo, vuelve a su pedestal. Se ve como un halo sobre el rey y un aviso en el rótulo de la ronda.
- b) **Vida extra**: la primera vez que el rey caería, sobrevive con el castillo tal cual; se ve en el marcador.
- c) **Primera ronda sin disparos al rey**: los bots no apuntan al rey en la ronda 1 y el daño al rey se reduce.

ADR-010 impide rebajar la resistencia de los reyes de forma general; esta es una protección temporal y debe quedar en una ADR nueva.

## Acceptance Criteria

- [ ] Decisión del usuario anotada.
- [ ] Equilibrio (12 partidas por dificultad): la primera eliminación no llega antes de la primera ronda sin protección.
- [ ] La protección se ve en PC y en móvil vertical (capturas) y se explica en «Cómo se juega».
- [ ] ADR nueva y DOM-JUEGO-001 actualizados.

## Test Plan

| Level | What it covers |
|-------|----------------|
| Unitaria | El rey no muere en las rondas protegidas |
| Medición | Equilibrio en las 3 dificultades |
| E2E | `solo` y `multiplayer` |

## Evidence

Pendiente.

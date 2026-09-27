---
id: WRK-TASK-041
type: spec
layer: work-task
scope: ephemeral
status: completed
confidence: medium
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
- `shared/protocol.ts` si cambia el estado (`PROTOCOL_VERSION` 8)
- `client/src/ui/lobby.ts` («Cómo se juega») y `client/src/ui/style.css` (rótulos)
- `tests/unit/guard.test.ts`, `tests/e2e/solo.spec.ts`, `tests/balance/`

## Implementation Notes

**Decisión del usuario al empezar** (dar opciones, con una recomendada):

- a) **Escudo real en las rondas 1-2** (recomendada): el rey no puede morir durante esas rondas. Si al final de la ronda protegida está fuera del castillo, vuelve a su pedestal. Se ve como un halo sobre el rey y un aviso en el rótulo de la ronda.
- b) **Vida extra**: la primera vez que el rey caería, sobrevive con el castillo tal cual; se ve en el marcador.
- c) **Primera ronda sin disparos al rey**: los bots no apuntan al rey en la ronda 1 y el daño al rey se reduce.

ADR-010 impide rebajar la resistencia de los reyes de forma general; esta es una protección temporal y debe quedar en una ADR nueva.

**Decisión del usuario (2026-09-27):** a) escudo real en las rondas 1-2.

## Acceptance Criteria

- [x] Decisión del usuario anotada.
- [x] Equilibrio (12 partidas por dificultad): la primera eliminación no llega antes de la primera ronda sin protección.
- [x] La protección se ve en PC y en móvil vertical (capturas) y se explica en «Cómo se juega».
- [x] ADR nueva y DOM-JUEGO-001 actualizados.

## Test Plan

| Level | What it covers |
|-------|----------------|
| Unitaria | El rey no muere en las rondas protegidas |
| Medición | Equilibrio en las 3 dificultades |
| E2E | `solo` y `multiplayer` |

## Evidence

2026-09-28. Decisión del usuario: a) escudo real en las rondas 1-2. Reglas en DOM-JUEGO-001 (10b) y decisión en ADR-014.

- Simulación: `Sim.kingGuard` hace que `killKing` salve al rey (daño a 0 y `fx: kingGuard` una vez por ronda). `restoreKings` devuelve al pedestal a los que están fuera del castillo (`fx: kingHome`). El que cae al vacío vuelve en el acto. El anfitrión activa el escudo con `kingGuarded(state)` al empezar cada ronda y recoloca a los reyes al empezar los resultados y al empezar la ronda siguiente. Sin campos nuevos en `MatchState`; `PROTOCOL_VERSION` 8.
- Equilibrio, 12 partidas por dificultad, sin escudo (`KING_GUARD_ROUNDS = 0`) → con escudo:

  | Dificultad | Primera eliminación en la ronda 1 | Primera eliminación más temprana | Rondas | s simulados |
  |---|---|---|---|---|
  | Fácil | 3 de 12 → 0 | 1 → 3 | 9,4 → 10,0 | 174 → 181 |
  | Normal | 2 de 12 → 0 | 1 → 3 | 7,6 → 9,4 | 142 → 168 |
  | Difícil | 8 de 12 → 0 | 1 → 3 | 5,4 → 6,9 | 108 → 128 |

  La lava remata a más reyes: normal, 14 → 20 eliminaciones; fácil, 16 → 23.
- Visual: halo dorado y columna de luz sobre cada rey en las rondas 1-2; rótulos de las rondas 1, 2 y 3; «ESCUDO REAL» cuando salva a un rey; «Cómo se juega». Capturas con GPU en 1280×720 y 390×844. La columna se ve desde el plano general de la cuenta atrás en los dos formatos. La primera versión (aditiva y amarilla) se perdía sobre la lava y se cambió a blanco dorado con mezcla normal.
- Pruebas: `tests/unit/guard.test.ts` (3 casos: rondas con escudo, el rey no cae y vuelve al pedestal, y sin escudo sí cae). `solo.spec.ts` comprueba los 4 escudos en la ronda 1 y que la partida llega al menos a la ronda 3. `npm run verify` (42 unitarios) y la batería E2E local completa: 31 de 31.
- Hallazgo: RULE-002 decía que `PROTOCOL_VERSION` valía 6 cuando el código ya iba por 7; queda en 8.


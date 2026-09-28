---
id: ADR-015
type: adr
layer: governance
status: accepted
confidence: medium
version: 1.0.0
created: 2026-09-28
updated: 2026-09-28
owner: dimas
deciders:
  - dimas
dependencies:
  - id: DOM-JUEGO-001
    relation: implements
  - id: DOM-JUEGO-003
    relation: implements
supersedes: null
tags:
  - equilibrio
  - municion
  - rondas
---

# ADR-015 — Objetivos secundarios con carta de premio

## Context

Casi todos los disparos van al rey o al centro del castillo rival. Se quería más variedad en las decisiones de puntería. El usuario eligió (27-09-2026, WRK-TASK-043) como recompensa una munición mejor en la ronda siguiente, frente a reparar el castillo propio o dar solo un reconocimiento en las estadísticas.

## Decision

- Cada ronda tiene un objetivo secundario para todos, sorteado con la semilla y la ronda (`goalFor`). Hay tres tipos:
  - 2 cristales de la misma jaula rival;
  - una pieza de hierro rival (portón, refuerzo o placa del torreón);
  - 4 bloques de la misma torre rival.
- Cuenta lo que rompe cada jugador en el impacto de esa ronda, atribuido como el destrozo (`lastHitBy`), por pieza y agrupado por torre y por jaula (`Stats.broken`). Quien llega a la cifra y sigue vivo está en `goalDone`.
- Premio: en la ronda siguiente, la primera carta de su mano es rara o épica (`drawAmmo` restringido a esas rarezas y con su propia semilla). Las otras dos salen como siempre, sin repetir.
- Los bots van a por el objetivo con probabilidad 0,2 / 0,35 / 0,5 según la dificultad (`pGoal`), apuntando a la jaula, a una pieza de hierro o a una torre (`goalPoint`).
- `MatchState` gana `goal`, `goalDone` y `bonus`: `PROTOCOL_VERSION` 9.

## Consequences

**Positive:**

- Alguien cumple el objetivo en un 30 % de las rondas: fácil 32 de 123, normal 34-36 de 114-117, difícil 36 de 104. Casi siempre lo cumple un solo jugador (1,2-1,4 de media). Por tipo, en normal: torre 10 rondas, hierro 14 y jaula 10.
- Da una razón para apuntar a otro sitio que no sea el rey, y una ventaja visible en la ronda siguiente.

**Negative:**

- Partidas algo más largas, porque a veces los bots apuntan al objetivo en vez de al rey: normal de 8,9 a 9,5-9,9 rondas; difícil de 7,9 a 8,0-8,7; fácil, 10,3-10,4, sin cambios.
- En la primera versión, con «4 bloques de torre» sin agrupar, lo cumplían los cuatro jugadores en la ronda 1 sin buscarlo. Por eso se cuenta por torre y por jaula.

**Neutral:**

- Las cifras (`GOALS[...].need`) y las probabilidades de los bots son las palancas; cualquier cambio se mide con RULE-001.

## Alternatives Considered

| Alternativa | Por qué no |
|---|---|
| Reparar el castillo propio | Alarga más las partidas y se nota menos que una carta |
| Solo reconocimiento en las estadísticas | No cambia ninguna decisión durante la partida |
| Un objetivo distinto por jugador | Más texto en el HUD y no se puede anunciar en un solo rótulo |

## References

- WRK-TASK-043 (medidas en `tests/balance/ultimo-*.txt`).

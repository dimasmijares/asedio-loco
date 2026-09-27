---
id: ADR-014
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
  - id: ADR-010
    relation: extends
supersedes: null
tags:
  - equilibrio
  - reyes
---

# ADR-014 — Escudo real: ningún rey cae en las rondas 1 y 2

## Context

En difícil, la primera eliminación llegaba en la ronda 1 en 9 de 12 partidas (WRK-TASK-044), y en normal y fácil en 2 o 3 de 12. Un humano eliminado tan pronto pasa toda la partida mirando. ADR-010 impide rebajar la resistencia de los reyes de forma general. El usuario eligió (27-09-2026, WRK-TASK-041) un escudo real temporal entre tres opciones: escudo real en las rondas 1-2, una vida extra, o una ronda 1 sin disparos al rey.

## Decision

- En las rondas 1 y 2 (`KING_GUARD_ROUNDS`), en todas sus fases, ningún rey puede caer: `Sim.killKing` no mata mientras `Sim.kingGuard` está activo. Tampoco acumula daño: se pone a 0.
- La primera vez que el escudo salva a un rey en una ronda, la simulación emite `fx: kingGuard` y los clientes lo anuncian con el rótulo «ESCUDO REAL».
- Al empezar los resultados de una ronda con escudo, y otra vez al empezar la ronda siguiente, cada rey que está fuera de su castillo vuelve a su pedestal (`restoreKings`, `fx: kingHome`), y todos pierden el daño acumulado. Un rey que cae al vacío vuelve en el acto.
- El escudo se deduce de la ronda (`kingGuarded`), así que no añade campos a `MatchState`. Aun así cambia el significado de las rondas 1-2 para anfitrión e invitados: `PROTOCOL_VERSION` 8.
- Se ve como un halo dorado sobre la cabeza del rey y una columna de luz translúcida sobre él, y se anuncia en el rótulo de las rondas 1, 2 y 3 y en «Cómo se juega».

## Consequences

**Positive:**

- En 36 partidas de bots (12 por dificultad), la primera eliminación llega siempre en la ronda 3 o más tarde. Antes llegaba en la ronda 1 en 13 de las 36.
- Las rondas 1 y 2 sirven para tantear viento, munición y puntería sin miedo.

**Negative:**

- Partidas más largas: difícil de 5,4 a 6,9 rondas (108 → 128 s simulados), normal de 7,6 a 9,4 (142 → 168 s), fácil de 9,4 a 10,0 (174 → 181 s).
- La lava remata a más reyes: en normal, de 14 a 20 de las eliminaciones; en fácil, de 16 a 23.
- Un disparo perfecto en las rondas 1-2 no elimina: solo destroza.

**Neutral:**

- Si las partidas se hacen largas, la palanca es `KING_GUARD_ROUNDS` (1 en vez de 2), medida con RULE-001.

## Alternatives Considered

| Alternativa | Por qué no |
|---|---|
| Vida extra la primera vez que el rey caería | Protege a un solo rey una vez y no explica bien qué ha pasado; más estado en `MatchState` |
| Ronda 1 sin disparos al rey | Solo cambia los bots; un humano puede seguir eliminando a otro en la ronda 1 |
| Reyes más resistentes | Descartado en ADR-010: con bots difíciles la partida no cambiaba y acortaba las demás |

## References

- WRK-TASK-041 (medidas antes y después en `tests/balance/ultimo-*.txt`).
- ADR-010: la resistencia de los reyes sigue igual; esto es una protección temporal.

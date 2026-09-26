---
id: ADR-010
type: adr
layer: governance
status: accepted
confidence: medium
version: 1.0.0
created: 2026-09-25
updated: 2026-09-26
owner: dimas
deciders:
  - dimas
dependencies:
  - id: DOM-JUEGO-002
    relation: implements
  - id: DOM-JUEGO-001
    relation: implements
supersedes: null
tags:
  - equilibrio
  - reyes
  - lava
---

# ADR-010 — Los reyes mantienen su resistencia y la lava hace de zona que se cierra

## Context

Un rey cae si lo aplastan, sale de la isla, toca el suelo fuera de su castillo o toca la lava. La lava sube cada 3 rondas y, desde la ronda 10, inunda el patio. Se quiso que decidieran más los disparos y menos la lava, y se probó a hacer los reyes más frágiles. La partida debe durar unos 4-6 minutos.

## Decision

- La resistencia de los reyes no se rebaja. Para que decidan más los disparos se tocan las municiones (D-052) o la mano (ADR-004), no los reyes.
- La lava sube de nivel cada 3 rondas. Los niveles 1 y 2 (rondas 4 y 7) son avisos por debajo de la isla y, desde la ronda 10, se come una hilera por nivel.
- Los bloques bajo la lava se hunden como cinemáticos a 0,6 m/s y se funden al quedar a ras, para no provocar derrumbes en cadena.

## Consequences

**Positive:**

- Duración estable: normal 9,6 rondas (307 s simulados), difícil unas 6.
- La lava garantiza que la partida termina.

**Negative:**

- La lava remata una parte importante de las partidas (12 de 26 eliminaciones en la última medida en normal).
- Con bots difíciles o buena puntería un rey puede caer en la ronda 1.

**Neutral:**

- Cualquier cambio de resistencia o de lava se mide con RULE-001.

## Alternatives Considered

| Alternative | Why it was rejected |
|-------------|---------------------|
| Reyes más frágiles | Con bots difíciles la partida bajaba a 2,6 minutos |
| Lava que borra de golpe la base | Todo caía 1 m, se rompía en cadena y los reyes morían a la vez |

## Knowledge Impact

- [ ] DOM-JUEGO-002 — calendario de la lava y hundimiento de bloques.
- [ ] DOM-JUEGO-001 — condiciones de eliminación y duración esperada.

## Traceability

- Decisiones: D-020, D-021, D-024, D-053.
- Código y medidas: `shared/match.ts`, `tests/balance/ultimo-normal.txt`, `tests/balance/ultimo-dificil.txt`.

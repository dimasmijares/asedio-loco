---
id: ADR-013
type: adr
layer: governance
status: accepted
confidence: medium
version: 1.0.0
created: 2026-09-27
updated: 2026-09-27
owner: dimas
deciders:
  - dimas
dependencies:
  - id: DOM-JUEGO-004
    relation: implements
supersedes: ADR-008
tags:
  - castillos
  - equilibrio
---

# ADR-013 — Castillos de 176 bloques con forro interior

## Context

Con la munición de WRK-PLAN-007, cada disparo rompe unos 16 bloques de media: el 11,5 % de un castillo de 140 (ADR-008). El usuario pidió (27-09-2026) castillos con más bloques para que resistan algo más.

## Decision

- Forro interior de piedra detrás de cada muralla: 3 hileras de los 3 bloques centrales, 36 bloques en total. El castillo pasa de 140 a 176 bloques, con la misma silueta y la misma escala (1,2) que en ADR-008.
- La munición se reajusta para que cada disparo destroce lo mismo que antes (unos 16 bloques): así el castillo resiste más en proporción, un 9 % por disparo.
- Los campos de fuerza (agujero negro e imán) no mueven al rey, y el escupitajo del agujero negro apenas lo empuja: con el forro, en los impactos directos lo sacaban del castillo en 6 o 7 de cada 12 disparos.
- `PROTOCOL_VERSION` 7.

## Consequences

**Positive:**

- Partidas algo más largas: normal de 6,8 a 7,9 rondas; fácil de 7,0 a 8,5.
- Un disparo que atraviesa la muralla ya no llega directo al torreón.

**Negative:**

- El paso de física del banco sube de 5,3 a 8,7 ms con SwiftShader (presupuesto: 16 ms).
- El estado completo pasa de 27,5 a 34,1 KB (límite: 64 KB).
- En difícil no cambia (unas 5 rondas): los bots precisos eliminan pronto a un rey con impactos directos, con o sin forro.

## Alternatives Considered

| Alternativa | Por qué no |
|---|---|
| Murallas de 5 hileras | Cambia la silueta, la cámara y los puntos de mira de los bots |
| Forro de 5 bloques por hilera | Choca con los forros vecinos en las esquinas |
| Más de 199 bloques | Obliga a cambiar `BLOCK_ID_STRIDE` y los identificadores de los reyes |

## References

- Supera en el número de bloques a ADR-008, que sigue vigente en escala e isla.
- WRK-TASK-037.

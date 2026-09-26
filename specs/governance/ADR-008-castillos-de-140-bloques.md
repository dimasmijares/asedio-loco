---
id: ADR-008
type: adr
layer: governance
status: accepted
confidence: high
version: 1.0.0
created: 2026-09-25
updated: 2026-09-26
owner: dimas
deciders:
  - dimas
dependencies:
  - id: DOM-JUEGO-004
    relation: implements
  - id: ARCH-005
    relation: implements
supersedes: null
tags:
  - castillos
  - isla
  - rendimiento
---

# ADR-008 — Castillos de 140 bloques a escala 1,2 en una isla de 68 × 68 m

## Context

Los castillos originales tenían 106 bloques, dentro de la referencia de 80-120 del objetivo de 60 fps. El usuario pidió castillos más grandes. Más bloques cuestan física en el anfitrión y bytes en el estado completo, y cambian el equilibrio.

## Decision

- Término medio: todo el castillo a escala 1,2 y **140 bloques**. Torres de 5 bloques, murallas de 4 hileras y dos contrafuertes laterales, con el rey en su jaula de cristal.
- La isla pasa a 68 × 68 m, con los castillos a ±22 m. La lava sube por hileras de 1,2 m.
- Ids: bloques `slot*200 + 1 + i`.

## Consequences

**Positive:**

- Castillos más vistosos; en proporción, cada disparo destroza menos (de 7,9 a 8,8 bloques por disparo).

**Negative:**

- El paso de física en la escena más cargada sube de 3,3 a unos 5 ms. Queda margen en los 16 ms (RULE-004), pero menos para móviles.
- Partidas más largas: normal 9,6 rondas (unos 5 minutos con personas); difícil, 6.
- Cambió el plano: protocolo v4 (RULE-002).

**Neutral:**

- Se reajustaron catapultas, puntos de mira de los bots, niveles de lava y cámara.

## Alternatives Considered

| Alternative | Why it was rejected |
|-------------|---------------------|
| Mantener 106 bloques (D-016) | El usuario pidió castillos más grandes |
| Castillos mucho mayores (~200 bloques) | Más coste de física y partidas más largas; el usuario eligió término medio (D6) |
| Solo escalar sin añadir bloques | No da la sensación de castillo más grande y alto |

## Knowledge Impact

- [ ] DOM-JUEGO-004 — plano de 140 bloques, isla de 68 m, hileras de lava de 1,2 m.
- [ ] ARCH-005 — cifras de rendimiento con 560 bloques.

## Traceability

- Decisiones: D-063 (sustituye a D-016).
- `PLAN.md`, etapa 5 y decisión D6 del usuario.
- Código: `shared/castle.ts`, `shared/map.ts`, `tests/balance/destrozo.txt`.

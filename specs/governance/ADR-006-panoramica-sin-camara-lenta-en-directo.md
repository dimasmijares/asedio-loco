---
id: ADR-006
type: adr
layer: governance
status: accepted
confidence: high
version: 1.0.1
created: 2026-09-25
updated: 2026-09-26
owner: dimas
deciders:
  - dimas
dependencies:
  - id: FEAT-CAMARA-001
    relation: implements
supersedes: null
tags:
  - camara
  - impacto
---

# ADR-006 — Plano panorámico durante los disparos, sin perseguir proyectiles ni cámara lenta en directo

## Context

La especificación original pedía una cámara que siguiera al proyectil más interesante, y el anfitrión aplicaba cámara lenta (×0,3 durante 1,4 s) al caer un rey. Con 4 disparos a la vez, la cámara saltaba de uno a otro y el usuario lo describió como «cosas raras». La cámara lenta del anfitrión, además, frenaba la física de toda la sala.

## Decision

- Durante el impacto, el director encuadra a la vez todo lo que vuela y los puntos de impacto de los últimos 2,2 s.
- El radio va de 9 a 24 m: se abre deprisa y se cierra despacio. Se mira desde el lado donde estaba la cámara al empezar el impacto (la dirección se fija en la primera actualización del director en la fase de impacto y se mantiene hasta la ronda siguiente).
- Lo que sale volando fuera de la isla no aleja la cámara.
- No hay cámara lenta en directo. La cámara lenta y el primer plano del rey quedan para la repetición (ADR-007).

## Consequences

**Positive:**

- Sin saltos: se entiende lo que pasa en toda la isla.
- La física del anfitrión no se ralentiza por efectos de cámara.

**Negative:**

- Se pierde el detalle de cada disparo en directo; se compensa solo cuando cae un rey.
- Se aparta de la especificación original (cámara que sigue al proyectil).

**Neutral:**

- El director es más simple: solo encuadra.

## Alternatives Considered

| Alternative | Why it was rejected |
|-------------|---------------------|
| Seguir al proyectil más interesante | Saltos entre disparos; confunde |
| Cámara lenta en directo al caer un rey (D-025) | Frena la física para todos y compite con la repetición |
## Knowledge Impact

- [ ] FEAT-CAMARA-001 — comportamiento del director en impacto y límites del encuadre.
- [ ] FEAT-SENSACION-001 — la cámara lenta ya no está en directo.

## Traceability

- Decisiones: D-060 (sustituye a D-025).
- `PLAN.md`, etapa 3.
- Código: `client/src/game/director.ts`, `tests/tools/impact-shots.mjs`.

---
id: ADR-007
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
  - id: FEAT-REPLAY-001
    relation: implements
  - id: DOM-JUEGO-001
    relation: implements
supersedes: null
tags:
  - repeticion
  - red
---

# ADR-007 — La repetición de la caída de un rey reproduce lo grabado, no vuelve a simular

## Context

El usuario quería ver con detalle la muerte de un jugador, a cámara lenta y de cerca, pero sin perder la panorámica en directo (ADR-006). La física no es determinista entre clientes (ADR-002), así que volver a simular daría resultados distintos en cada uno. Además, la repetición tiene que empezar a la vez para todos.

## Decision

- Cada cliente graba lo que llega a su vista: poses a 30 Hz en un búfer circular de unos 4 MB y los eventos de los últimos 15 s.
- Si cae un rey durante el impacto, el anfitrión abre la fase `replay` entre el impacto y los resultados: 5 s por rey, como mucho 2. La física se pausa.
- Cada cliente repone los bloques rotos desde entonces y reproduce los 2,6 s anteriores a la caída y los 0,8 s posteriores, estirados, con cámara cerca del rey y bandas de cine.
- Lo que llega durante la repetición se aparta y se aplica al terminar. Un `full` corta la repetición.

## Consequences

**Positive:**

- Barata y sin riesgo de divergencia: se reproduce lo que cada uno vio.
- Todos la ven a la vez porque la fase la marca el anfitrión.

**Negative:**

- Un espectador que entra tarde no tiene grabación y ve el plano general.
- Los reyes que se lleva la lava al empezar la ronda no tienen repetición.
- Añade una fase a `MatchState` (protocolo v3, RULE-002).

**Neutral:**

- Unos 4 MB de memoria por cliente.

## Alternatives Considered

| Alternative | Why it was rejected |
|-------------|---------------------|
| Volver a simular desde una instantánea | La física no es determinista entre navegadores |
| Grabar solo en el anfitrión y enviarlo | Mucho tráfico y retraso añadido |
| Repetición al final de la partida | El usuario la quiso al acabar la ronda (D4) |

## Knowledge Impact

- [ ] FEAT-REPLAY-001 — búfer, ventana de tiempo, cámara y casos sin grabación.
- [ ] DOM-JUEGO-001 — fase `replay` entre impacto y resultados.

## Traceability

- Decisiones: D-061.
- `PLAN.md`, etapa 4 y decisión D4 del usuario.
- Código: `client/src/game/replay.ts`, `tests/tools/replay-shots.mjs`.

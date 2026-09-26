---
id: ADR-002
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
  - id: ARCH-003
    relation: implements
  - id: ARCH-002
    relation: implements
supersedes: null
tags:
  - red
  - anfitrion
  - fisica
---

# ADR-002 — La física oficial la ejecuta el navegador de un jugador (anfitrión autoritativo); los demás interpolan

## Context

El servidor de salas (ADR-001) no puede ejecutar Rapier ni un bucle de física de 60 Hz dentro del plan gratuito. La física determinista en todos los clientes no es fiable entre navegadores: `Math.sin` y compañía difieren y Rapier solo garantiza determinismo con su compilación especial. Hacía falta una fuente de verdad única.

## Decision

- Un cliente, el **anfitrión**, ejecuta la simulación completa (`MatchHost` + `Sim`) y es la única fuente de verdad.
- Manda un único tic `tk` a 15 Hz con las poses cuantizadas de lo que se ha movido, los eventos `SimEvent` y la puntería de los bots. Aparte, `st` cuando cambia el estado y `full` (estado completo) al final de cada ronda y a quien llega.
- Los clientes interpolan con 120 ms de retraso y aplican los eventos en la misma línea temporal. No simulan física oficial; solo los fragmentos decorativos, en local.
- El servidor solo retransmite (`relay`) y guarda el lobby.

## Consequences

**Positive:**

- Cero coste de CPU en el servidor. Todos los clientes coinciden exactamente al final de cada ronda (`full`).
- Los mismos `SimEvent` alimentan la vista en solitario y en red.

**Negative:**

- La partida depende del equipo del anfitrión: si va lento, la física va lenta para todos (RULE-004). Si se oculta la pestaña, se congela; eso obliga a ceder el papel (ADR-009).
- Hace falta migración de anfitrión y reconstrucción del mundo a partir de lo que ve un cliente.
- Un anfitrión malicioso podría hacer trampas; se acepta (partidas entre amigos).

**Neutral:**

- ~17 mensajes por segundo del anfitrión, dentro del límite de 80/s del servidor.

## Alternatives Considered

| Alternative | Why it was rejected |
|-------------|---------------------|
| Física en el servidor | No cabe en el plan gratuito de Workers |
| Física determinista en todos los clientes a partir del disparo | No es fiable entre navegadores |
| Mensajes separados para poses, eventos y bots | Más mensajes, cada uno cuenta como petición |

## Knowledge Impact

- [ ] ARCH-003 — anfitrión, tic de 15 Hz, `full`, interpolación y validación de origen (`hostId`).
- [ ] ARCH-002 — la vista solo consume `SimEvent` y poses, venga la simulación de local o de red.

## Traceability

- Decisiones: D-027, D-028, D-029, D-030, D-032, D-039, D-064.
- Código: `client/src/game/match/host.ts`, `client/src/game/net/`, `server/index.ts`.

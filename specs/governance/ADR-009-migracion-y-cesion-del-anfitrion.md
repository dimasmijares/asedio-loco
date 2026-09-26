---
id: ADR-009
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
  - id: FEAT-SALAS-001
    relation: implements
supersedes: null
tags:
  - red
  - anfitrion
  - migracion
  - moviles
---

# ADR-009 — El anfitrión migra de verdad, cede el papel en segundo plano y se prefiere un ordenador

## Context

Con el anfitrión en un navegador (ADR-002), la partida depende de ese cliente. Si se desconecta, la sala se queda sin física. Si oculta la pestaña o cambia de app, el navegador deja de ejecutar `requestAnimationFrame` y la partida se congela para todos sin que nadie se desconecte. En un móvil pasa enseguida, y un móvil tiene menos CPU para simular (`docs/MOVILES.md`).

## Decision

- **Migración real:** si el anfitrión se va en plena partida, el servidor elige al siguiente jugador conectado. Ese cliente reconstruye la física con lo que ve (bloques en su sitio, uniones intactas del plano, reyes vivos) y sigue. Un impacto a medias se da por terminado; si se apuntaba, los bots vuelven a decidir. En el lobby, el anfitrión tiene 8 s para recargar sin perder el papel.
- **Cesión en segundo plano:** a los 2 s oculto, el anfitrión manda `yield`. Pasa a cliente sin desconectarse y pide un `full` al volver.
- **Preferencia por ordenadores:** el `hello` dice si el dispositivo es móvil. Al heredar, primero los ordenadores. Si el creador es un móvil y hay un ordenador, el ordenador es anfitrión desde el principio.
- Sin otro humano conectado, no se cede: la partida espera.

## Consequences

**Positive:**

- La partida sobrevive a cierres, recargas y cambios de pestaña del anfitrión.
- Un móvil casi nunca carga con la física de una partida en red.

**Negative:**

- Si el anfitrión se va en pleno impacto, las estadísticas de esa ronda quedan incompletas.
- Un jugador desconectado no pasa a ser un bot: su catapulta dispara con la última puntería.
- La reconstrucción no es idéntica al mundo del anfitrión anterior (velocidades y daño acumulado se pierden).

**Neutral:**

- Protocolo v5 (`mobile`, `yield`), según RULE-002.

## Alternatives Considered

| Alternative | Why it was rejected |
|-------------|---------------------|
| Pausar y esperar 30 s a que vuelva | La especificación lo daba como mínimo; la migración real es mejor experiencia |
| Seguir simulando en segundo plano | El navegador para `requestAnimationFrame` en pestañas ocultas |
| El creador siempre es el anfitrión | Un móvil anfitrión es lento y se va a segundo plano a menudo |

## Knowledge Impact

- [ ] ARCH-003 — elección del anfitrión, migración, `yield` y reconstrucción.
- [ ] FEAT-SALAS-001 — detección de móvil y papel de anfitrión en el lobby.

## Traceability

- Decisiones: D-031, D-033, D-065.
- `docs/MOVILES.md`, etapa M1.
- Código: `server/index.ts`, `client/src/game/modes/online.ts`, `tests/e2e/multiplayer.spec.ts` (grupo `migracion`).

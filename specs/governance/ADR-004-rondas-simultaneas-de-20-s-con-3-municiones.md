---
id: ADR-004
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
  - id: DOM-JUEGO-001
    relation: implements
  - id: DOM-JUEGO-003
    relation: implements
supersedes: null
tags:
  - rondas
  - ritmo
  - municion
---

# ADR-004 — Rondas simultáneas de 20 s con 3 municiones nuevas por ronda

## Context

La especificación original proponía rondas simultáneas (apuntado de ~12 s, impacto y resultados) y una mano de 2 municiones que se reponía. Tras la primera prueba, el usuario pidió más tiempo para apuntar y más variedad. Las rondas simultáneas mantienen a todos jugando a la vez y encajan con un anfitrión que resuelve todos los disparos de una sola vez.

## Decision

- Todos apuntan a la vez **20 s**, en todas las rondas, también en el duelo. Si todos confirman antes, la ronda arranca antes. `?fast=1` deja 3 s.
- Todos los disparos salen juntos (con un pequeño escalonado) y la física se resuelve hasta asentarse. Luego, repetición si cae un rey (ADR-007) y resultados.
- Cada ronda trae **3 municiones distintas** al azar, con la semilla de partida, ronda y hueco. Las que no se usan se pierden.

## Consequences

**Positive:**

- Más tiempo para usar el control de carga (ADR-005) y más elección.
- Los bots usan más las raras: en normal la partida bajó de 10,5 a 7,5 rondas, con más eliminaciones por disparos que por lava (luego 9,6 con los castillos de ADR-008).

**Negative:**

- Cada ronda dura más: una partida con personas ronda los 5 minutos, en el límite alto del objetivo de 4-6.
- Se aparta de la especificación original: el duelo ya no acorta las rondas.

**Neutral:**

- Cambiar la duración o la mano altera el equilibrio y el protocolo (RULE-001, RULE-002).

## Alternatives Considered

| Alternative | Why it was rejected |
|-------------|---------------------|
| Turnos por jugador | Espera larga con 4 jugadores; la especificación pedía simultáneas |
| 12 s y mano de 2 que se repone (D-019) | Poco tiempo y poca variedad según el usuario |
| Acortar las rondas en el duelo | El usuario lo prefirió sin acortar |

## Knowledge Impact

- [ ] DOM-JUEGO-001 — fases, 20 s, arranque anticipado y cierre de la ronda.
- [ ] DOM-JUEGO-003 — mano de 3 distintas por ronda, sin guardar.

## Traceability

- Decisiones: D-058 (sustituye a D-019 y a los 12/9 s de la especificación), D-024, D-026.
- `PLAN.md`, etapa 1 y decisión D5 del usuario.
- Código: `shared/match.ts` (`aimDuration`, `HAND`), `shared/ammo.ts`.

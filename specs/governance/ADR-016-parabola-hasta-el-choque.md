---
id: ADR-016
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
  - id: FEAT-CONTROL-001
    relation: implements
  - id: ADR-005
    relation: extends
supersedes: null
tags:
  - control
  - punteria
---

# ADR-016 — Parábola hasta el choque, con marca de impacto

## Context

En la tercera prueba (28-09-2026) el usuario notó que la bala caía siempre mucho más corta de lo que parecía. La física coincidía con la vista previa, pero esta solo pintaba el primer 60 % del vuelo: el arrastre hace la caída más empinada que la subida y el muro rival para la bala antes del punto de caída, así que el ojo alargaba mal el arco. Opciones: parábola hasta el choque, arco entero con la estela del disparo anterior, tirachinas o barra de fuerza con memoria.

## Decision

- Al cargar, la vista previa pinta la trayectoria entera hasta el primer bloque o suelo que toca (`firstHit` en `shared/ballistics.ts`, contra los bloques tal como se ven y el suelo de la isla o la lava) y pone ahí un anillo del color del jugador con borde blanco (R-01), que se ve aunque quede detrás de un muro.
- Sin cargar sigue el tramo corto y tenue de antes.
- Sustituye a la parte de ADR-005 que decía que la vista previa crece hasta el 60 % del vuelo; el resto del control no cambia.

## Consequences

- Apuntar es mucho más fácil: la dificultad queda en el viento (la marca ya lo incluye), en elegir dónde dar y en el tiempo. Hay que vigilar el equilibrio contra bots.
- La marca no conoce la rotura: si el disparo rompe el primer bloque, sigue más allá de la marca.

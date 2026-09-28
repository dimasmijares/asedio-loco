---
id: ADR-017
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
  - id: DOM-JUEGO-004
    relation: implements
  - id: ADR-013
    relation: extends
supersedes: null
tags:
  - castillos
  - rendimiento
---

# ADR-017 — Castillos de 236 bloques: dos filas más y torreón más alto

## Context

En la tercera prueba (28-09-2026) el usuario echó en falta dos filas más de altura en todos los castillos. Con el torreón a la altura de antes, el rey quedaría escondido tras murallas más altas; el usuario eligió subirlo también (WRK-SPEC-011).

## Decision

- Torres de 7 bloques, murallas de 6 hileras, contrafuertes de 6 y pedestal del torreón de 4 filas: 236 bloques por castillo (176 antes). El forro interior de ADR-013 sigue con 3 hileras.
- Identificadores: 300 por castillo y reyes desde 1500 (antes 200 y 1000): 4 castillos ocupan 1-1200 y los proyectiles empiezan en 2000. `PROTOCOL_VERSION` 12.
- La lava tiene su tope en 7,6 m (antes 5,2), para que pueda llegar al rey sobre el pedestal más alto.

## Consequences

- El paso de física en `/#bench` sube: 7,4 ms sin frenar la CPU (dentro de los 16 de RULE-004) y de 17 a 28,5 ms en el perfil móvil con la CPU frenada ×4 (unos 870 cuerpos despiertos frente a 610). Ojo: medido en un servidor en la nube (Xeon a 2,1 GHz, gráfica por software), no en un móvil concreto ni en el PC de las mediciones anteriores; vale el aumento relativo (+70 %), no la cifra absoluta. Un anfitrión móvil sin ordenador en la sala puede ir a cámara lenta en los impactos grandes: WRK-TASK-066.
- El estado completo con 4 castillos pasa de 36 a 49 KB, dentro de los 64 KB.
- Las municiones rompen proporcionalmente menos y varias salen de su franja de destrozo: WRK-TASK-065.

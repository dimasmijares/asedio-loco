---
id: ADR-018
type: adr
layer: governance
status: accepted
confidence: medium
version: 1.0.0
created: 2026-10-03
updated: 2026-10-03
owner: dimas
deciders:
  - dimas
dependencies:
  - id: DOM-JUEGO-002
    relation: implements
  - id: ADR-016
    relation: extends
supersedes: null
tags:
  - viento
  - punteria
---

# ADR-018 — Sin viento

## Context

El 03-10-2026 el usuario vio que, al apuntar, «la marca» señalaba un sitio y, al cargar, la parábola se iba a otro lado. Pidió comprobar si era el viento y dijo que, si lo era, prefería quitarlo porque «ahora mismo no aporta tanto». La causa no era el viento: con el viento más fuerte del juego (7,5 m/s) la parábola se desvía menos de un metro a 60 m y ya lo incluía, igual que la física. Lo que se veía al apuntar era la diana del objetivo secundario, que no marca la puntería (WRK-TASK-085). Aun así, el usuario eligió quitar el viento.

## Decision

- No sopla el viento en ninguna ronda: `MatchState.wind` queda a `[0, 0, 0]` (sin `windForRound` ni `WIND_FROM_ROUND`).
- El campo `wind` se queda en el estado, la física y la parábola (sin cambio de protocolo); a cero no hace nada y el campo de pruebas o las pruebas pueden ponerlo a mano.
- Fuera de la interfaz: el chip del viento, el aviso «Empieza a soplar el viento» y la mención en «Cómo se juega».

## Consequences

- La dificultad de apuntar queda en elegir dónde dar, en la fuerza y en el tiempo (ADR-016 ya hacía visible el punto de impacto).
- La escalada de la partida queda en la lava y en la munición del duelo (DOM-JUEGO-002).
- Hay que vigilar el equilibrio contra bots: con la parábola y sin viento, apuntar es aún más fácil.

---
id: WRK-SPEC-008
type: spec
layer: work-spec
scope: ephemeral
status: active
confidence: low
version: 0.1.0
created: 2026-09-27
updated: 2026-09-27
owner: dimas
activates:
  - FEAT-CAMARA-001
  - FEAT-INTERFAZ-001
  - FEAT-SENSACION-001
  - ARCH-005
  - RULE-004
dependencies:
  - id: WRK-SPEC-007
    relation: extends
tags: [claridad, camara, graficos, movil]
---

# WRK-SPEC-008 — Claridad del apuntado y del impacto, en PC y en móvil

## Problem Statement

El usuario pide (27-09-2026) la siguiente iteración completa, priorizando la calidad jugable, la claridad de la interfaz y los gráficos, con la versión de PC y la móvil siempre a la par. Capturas de una partida con 3 bots en 1280×720 y en 390×844 muestran tres problemas comunes a las dos:

1. **Al apuntar, el castillo propio tapa la vista.** La cámara está 12 m detrás y 8 m por encima de la catapulta, y los muros más cercanos ocupan buena parte de la pantalla, sobre todo en vertical.
2. **El plano general no encuadra todos los castillos en vertical.** `Director.frame` calcula la distancia con el campo de visión vertical y supone una pantalla apaisada. Desde WRK-TASK-006, en vertical el campo horizontal es de 40°, así que los castillos laterales quedan fuera durante la cuenta atrás y el impacto.
3. **El daño de cada ronda solo se lee en la lista de resultados.** En la escena no se ve cuánto ha perdido cada castillo.

## Proposed Change

**In scope:**

- Desvanecido por tramado de los bloques cercanos a la cámara mientras se apunta, para que el castillo propio no tape la vista (WRK-TASK-034).
- Encuadre del plano general según los dos ejes del campo de visión, en cualquier proporción de pantalla (WRK-TASK-035).
- Número flotante con los bloques perdidos sobre cada castillo al terminar el impacto, en el color del jugador (WRK-TASK-036).

**Out of scope:**

- Cambios de reglas o de equilibrio.
- El modo horizontal en móvil más allá de no romperlo.

## Constraints

- Cada tarea se comprueba en escritorio (1280×720) y en móvil vertical (390×844), con capturas y pruebas.
- RULE-004: el paso de física y el dibujado siguen dentro del presupuesto.

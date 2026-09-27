---
id: WRK-SPEC-009
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
  - DOM-JUEGO-004
  - FEAT-INTERFAZ-001
  - FEAT-SENSACION-001
  - ARCH-005
  - RULE-001
  - RULE-004
dependencies:
  - id: WRK-SPEC-008
    relation: extends
tags: [castillos, movil, graficos, rendimiento]
---

# WRK-SPEC-009 — Castillos más resistentes, horizontal en móvil, gráficos y rendimiento

## Problem Statement

El usuario pide (27-09-2026):

1. Castillos con más bloques, para que sean algo más resistentes.
2. Mejoras del modo horizontal en móvil, aunque el vertical sigue siendo el modo de juego por defecto.
3. Una mejora gráfica.
4. Las tareas de rendimiento pendientes.

## Proposed Change

**In scope:**

- WRK-TASK-037: forro interior de piedra en las murallas (de 140 a 176 bloques) y reajuste de la munición para que cada disparo destroce lo mismo que antes.
- WRK-TASK-038: modo horizontal en móvil.
- WRK-TASK-039: una mejora gráfica, comprobada en PC y en móvil.
- Tareas de rendimiento ya planificadas en otros planes: WRK-TASK-013 (topes al cambiar la calidad), WRK-TASK-008 (perfil móvil) y WRK-TASK-016 (portada sin Rapier). WRK-TASK-014 necesita una gráfica integrada real, que este equipo no tiene: queda pendiente.

**Out of scope:**

- Protección del rey en las primeras rondas (propuesta para otra iteración).

## Constraints

- PC y móvil vertical a la par; el horizontal se comprueba en 3 tamaños de móvil.
- RULE-001 y RULE-004: destrozo, equilibrio y banco antes y después.
- RULE-002: `PROTOCOL_VERSION` sube si cambia la disposición de los bloques.

---
id: WRK-SPEC-009
type: spec
layer: work-spec
scope: ephemeral
status: completed
confidence: medium
version: 1.0.0
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

## Evidence

Hecho el 27-09-2026:

- **Castillos (WRK-TASK-037, ADR-013):** 176 bloques; cada disparo destroza lo mismo que antes, y las partidas en normal pasan de 6,8 a 7,9 rondas.
- **Horizontal (WRK-TASK-038):** resultados compactos, cuenta atrás sin rótulos encima, descripción de munición visible, y corregido el orden de los `@media`.
- **Gráficos (WRK-TASK-039):** grietas procedurales en los bloques dañados.
- **Rendimiento:**
  - topes de fragmentos y partículas en caliente (WRK-TASK-013);
  - perfil móvil, con calidad baja y 30 fps fuera de la acción (WRK-TASK-008);
  - portada sin Rapier (WRK-TASK-016).
- **Pendientes:** la medida en un Android real (WRK-TASK-040) y en una gráfica integrada (WRK-TASK-014).

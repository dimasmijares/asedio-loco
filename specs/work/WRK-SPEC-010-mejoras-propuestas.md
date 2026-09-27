---
id: WRK-SPEC-010
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
  - DOM-JUEGO-001
  - DOM-JUEGO-003
  - FEAT-INTERFAZ-001
  - FEAT-SENSACION-001
  - FEAT-REPLAY-001
  - FEAT-CAMARA-001
  - ARCH-005
  - RULE-001
  - RULE-004
dependencies:
  - id: WRK-SPEC-009
    relation: extends
tags: [jugabilidad, interfaz, graficos, rendimiento]
---

# WRK-SPEC-010 — Mejoras propuestas tras WRK-PLAN-009

## Problem Statement

Tras cerrar WRK-PLAN-009 se propusieron 16 mejoras en cuatro grupos (jugabilidad, claridad de la interfaz, gráficos y rendimiento). El usuario las aprobó todas (27-09-2026) y pidió dejarlas planteadas para empezar el desarrollo en una sesión nueva. También pidió listar las pruebas que solo puede hacer él en un Android, que son opcionales.

## Proposed Change

**In scope:** las 16 mejoras. Doce son tareas nuevas de WRK-PLAN-010 (WRK-TASK-041 a 052). Cuatro ya existían en otros planes y se reutilizan:

| N.º | Mejora | Tarea |
|---:|---|---|
| 1 | Protección del rey en las primeras rondas | WRK-TASK-041 |
| 2 | El jugador desconectado pasa a ser un bot | WRK-TASK-010 (WRK-PLAN-005) |
| 3 | Espectador activo tras la eliminación | WRK-TASK-042 |
| 4 | Objetivos secundarios por ronda | WRK-TASK-043 |
| 5 | Equilibrio del pedrusco contra el rey | WRK-TASK-044 |
| 6 | Indicador de quién ataca a quién | WRK-TASK-045 |
| 7 | Nombres en el marcador compacto del móvil | WRK-TASK-046 |
| 8 | Repetición del mejor disparo al final de la partida | WRK-TASK-047 |
| 9 | Tutorial adaptado al vertical | WRK-TASK-048 |
| 10 | Polvo y humo persistentes tras un derrumbe | WRK-TASK-049 |
| 11 | Repetición de los reyes que se lleva la lava | WRK-TASK-011 (WRK-PLAN-005) |
| 12 | Iluminación del atardecer y sombras de contacto | WRK-TASK-050 |
| 13 | Animación del rey | WRK-TASK-051 |
| 14 | Física más barata para el anfitrión móvil | WRK-TASK-052 |
| 15 | Estadísticas completas si el anfitrión se va en el impacto | WRK-TASK-012 (WRK-PLAN-005) |
| 16 | PWA instalable | WRK-TASK-009 (WRK-PLAN-004) |

Pruebas en Android (opcionales): ampliadas en WRK-TASK-040 (A1-A6).

**Out of scope:** WRK-TASK-014 (gráfica integrada), sin hardware disponible.

## Constraints

- PC y móvil vertical a la par: cada tarea se diseña y se prueba en 1280×720 y en 390×844. El horizontal (740-915 × 360-412) no puede empeorar.
- RULE-001 en las tareas que tocan física, munición o reglas: destrozo (12 disparos) y equilibrio (8-12 partidas) antes y después.
- RULE-002: `PROTOCOL_VERSION` sube si cambian los mensajes o el estado de la partida.
- RULE-004: `perf.spec.ts` y el banco dentro del presupuesto.
- Textos del juego en registro claro y neutro.
- Las tareas con decisiones abiertas (041, 042, 043, 050) empiezan dando opciones al usuario, con una recomendada.

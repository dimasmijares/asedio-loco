---
id: WRK-SPEC-005
type: spec
layer: work-spec
scope: ephemeral
status: draft
confidence: medium
version: 0.1.0
created: 2026-09-26
updated: 2026-09-26
owner: dimas
activates:
  - ARCH-003
  - ARCH-005
  - DOM-JUEGO-001
  - FEAT-REPLAY-001
  - FEAT-SENSACION-001
  - FEAT-INTERFAZ-001
  - DOC-OPS-001
  - RULE-004
tags:
  - pendientes
  - limitaciones
---

# WRK-SPEC-005 — Pendientes conocidos

## Problem Statement

`CLAUDE.md` («Limitaciones conocidas») recoge fallos y huecos que no pertenecen a ningún plan. Mientras sigan solo ahí, nadie los prioriza. Algunos afectan a la partida en red (un jugador que se va, un anfitrión que se va en el impacto), otros a la sensación de juego (reyes que cae la lava sin repetición), y otros a la confianza en el rendimiento (nunca medido en una gráfica integrada). Además, el README describe una cámara lenta en directo que ya no existe desde D-060.

## Proposed Change

Convertir cada limitación accionable en una WRK-TASK con alcance y criterios, para poder elegirlas cuando toque.

**In scope** (una tarea por punto):

- Un jugador desconectado en plena partida pasa a ser un bot.
- Repetición también para los reyes que se lleva la lava al empezar la ronda.
- Estadísticas completas aunque el anfitrión se vaya en plena fase de impacto.
- Topes de partículas y fragmentos que cambian al cambiar la calidad en plena partida.
- Medir el rendimiento en una gráfica integrada.
- README al día: sin cámara lenta en directo al caer un rey.
- La portada no descarga Rapier solo para el fondo animado.

**Out of scope** (limitaciones que son decisiones de diseño o no dependen de nosotros):

- Bloques que caen sobre la lava sin fundirse: es a propósito, para evitar derrumbes en cadena.
- Duración variable de las partidas: depende de la dificultad y la puntería; se mide con `tests/balance`.
- Espectador que entra tarde sin repeticiones anteriores: no tiene nada grabado (D-061).
- Runner de CI lento y escena de CCD que pasa sin CCD (D-047): del entorno y de Rapier.
- Control táctil y medida en un móvil real: son WRK-TASK-006 y WRK-TASK-008.

## Knowledge Context

| Spec | Why it applies |
|------|----------------|
| ARCH-003 | Desconexiones, migración de anfitrión y lo que se pierde en ella |
| ARCH-005 | Calidad, topes de fragmentos y partículas, y medidas de rendimiento |
| DOM-JUEGO-001 | Qué pasa con el castillo de un jugador que se va y las estadísticas de ronda |
| FEAT-REPLAY-001 | Qué caídas de rey tienen repetición |
| FEAT-SENSACION-001 | Cómo se ve la caída de un rey (cámara lenta solo en la repetición) |
| FEAT-INTERFAZ-001 | Ajustes de calidad y portada |
| DOC-OPS-001 | Banco de rendimiento y herramientas de medida |
| RULE-004 | Presupuesto de rendimiento que hay que confirmar fuera de la RTX 3080 |

## Constraints

- Cambios en `MatchState` o en los mensajes de partida suben `PROTOCOL_VERSION` — RULE-002.
- Cada tarea se despliega sola con CI verde — RULE-003.
- No empeorar el presupuesto de rendimiento — RULE-004.

## Acceptance Criteria

- [ ] Cada tarea de WRK-PLAN-005 está cerrada o descartada con motivo.
- [ ] La sección «Limitaciones conocidas» de `CLAUDE.md` ya no recoge los puntos resueltos.

## Open Questions

- [ ] ¿Un jugador que se va debe pasar a bot al momento o tras un margen para reconectar? — dimas, antes de WRK-TASK-010.
- [ ] ¿Hay acceso a un portátil con gráfica integrada para medir? — dimas, antes de WRK-TASK-014.

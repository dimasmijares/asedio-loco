---
id: WRK-TASK-058
type: spec
layer: work-task
scope: ephemeral
status: draft
confidence: low
version: 0.1.0
created: 2026-09-28
updated: 2026-09-28
owner: dimas
parent: WRK-PLAN-011
activates: [DOM-JUEGO-004, ARCH-005, RULE-001, RULE-002, RULE-004]
dependencies:
  - id: WRK-TASK-057
    relation: depends-on
tags: [castillos, rendimiento, equilibrio]
---

# WRK-TASK-058 — Castillos con dos filas más

## Objective

Dar a todos los castillos dos filas más de altura (torres, murallas y contrafuertes) sin salirse del presupuesto de rendimiento.

## File Scope

- `shared/castle.ts` (plano local, `BLOCK_ID_STRIDE`, `KING_ID_BASE`, `PEDESTAL_TOP` si sube el torreón)
- `shared/protocol.ts` (`PROTOCOL_VERSION`)
- `shared/bot.ts` (puntos de mira por altura)
- `client/src/game/camera.ts`, `client/src/game/director.ts` (encuadres, si el castillo más alto tapa la vista)
- `tests/unit/`, `tests/balance/`, `tests/e2e/perf.spec.ts`
- `specs/domain/DOM-JUEGO-004-castillos-isla-y-materiales.md`, ADR nueva que sustituye a ADR-013 en el número de bloques

## Implementation Notes

| Activated spec | What it requires of this task |
|----------------|-------------------------------|
| DOM-JUEGO-004 | Plano del castillo, materiales por fila, uniones |
| ARCH-005 | Topes de bloques y fragmentos con más bloques |
| RULE-001 | Destrozo y equilibrio antes y después |
| RULE-002 | Cambian los identificadores de bloque: sube `PROTOCOL_VERSION` |
| RULE-004 | `perf.spec.ts` y banco `cpu=4 movil` dentro del presupuesto |

- Hoy: torres de 5 filas, murallas de 4, contrafuertes de 4, forro de 3; 176 bloques. Con dos filas más en torres (+8), murallas (+40) y contrafuertes (+4) salen 228; con el forro también, 252. Pasa de `BLOCK_ID_STRIDE = 200`, y con 4 castillos choca con `KING_ID_BASE = 1000`: subir los dos (p. ej. 300 y 2000).
- Materiales: las filas nuevas siguen el patrón (piedra abajo, madera arriba). La ventana y los refuerzos de hierro se reparten para que las murallas altas no sean solo piedra.
- Decidido por el usuario (28-09-2026): el torreón sube dos filas (pedestal de 4 filas, `PEDESTAL_TOP` más alto) para que el rey siga asomando por encima de las murallas. Medir si la caída desde más alto mata más reyes.
- La altura de lava de WRK-TASK-057 y su tope se revisan con la altura nueva.

## Acceptance Criteria

- [ ] Todos los castillos tienen dos filas más; `BLOCKS_PER_CASTLE` anotado.
- [ ] Destrozo y equilibrio antes y después: la partida en normal sigue en 7-11 rondas (si no, ajustar lava o munición en una tarea nueva).
- [ ] `perf.spec.ts` en verde y banco `cpu=4 movil` anotado antes y después.
- [ ] `PROTOCOL_VERSION` sube; DOM-JUEGO-004 y la ADR nueva al día.
- [ ] Capturas en PC y móvil vertical del castillo nuevo y del plano general.

## Test Plan

| Level | What it covers |
|-------|----------------|
| Unit | Número de bloques, identificadores sin solapes con 4 castillos |
| Medición | Destrozo, equilibrio, banco |
| E2E | `perf.spec.ts` |

## Evidence

Pendiente.

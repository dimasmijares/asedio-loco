---
id: WRK-TASK-093
type: spec
layer: work-task
scope: ephemeral
status: completed
confidence: high
version: 0.1.0
created: 2026-10-06
updated: 2026-10-06
owner: dimas
parent: WRK-PLAN-011
activates: [FEAT-SALAS-001]
dependencies:
  - id: WRK-TASK-071
    relation: depends-on
tags: [sala, interfaz, color]
---

# WRK-TASK-093 — «Partida en curso» en ciruela

## Objective

Corrección del usuario (05-10-2026): en la hoja «Partida en curso» (llegar tarde), el recuadro del icono pasa de grana a ciruela. Grana es solo para peligro.

## File Scope

- `client/src/ui/sheet.ts` (`badgeTone`), `client/src/ui/flujo.css`, `client/src/game/match/ui.ts` (`showLate`)
- `tests/e2e/sala.spec.ts`

## Implementation Notes

| Activated spec | What it requires of this task |
|----------------|-------------------------------|
| FEAT-SALAS-001 | Llegar tarde |

- `showSheet` acepta `badgeTone: 'ciruela'`; sin él, el recuadro sigue en grana («¡Tu rey ha caído!»).

## Acceptance Criteria

- [x] El recuadro del icono de «Partida en curso» es ciruela (`sala.spec.ts`, «llegar tarde»).

## Test Plan

| Level | What it covers |
|-------|----------------|
| E2E | `sala.spec.ts`: color del recuadro |

## Evidence

2026-10-06. `sala.spec.ts` (llegar tarde) en verde en local.

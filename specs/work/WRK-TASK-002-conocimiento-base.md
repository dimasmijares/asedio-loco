---
id: WRK-TASK-002
type: spec
layer: work-task
scope: ephemeral
status: completed
confidence: medium
version: 1.0.0
created: 2026-09-26
updated: 2026-09-26
owner: dimas
parent: WRK-PLAN-003
activates: [ARCH-001, DOM-JUEGO-001, PROD-JUGAR-001]
dependencies: [{id: WRK-TASK-001, relation: depends-on}]
tags: [kdd]
---

# WRK-TASK-002 — Conocimiento base

## Objective

Especificar lo que ya está construido, con valores del código y pruebas que lo respaldan.

## File Scope

`specs/architecture/`, `specs/domain/`, `specs/product/`, `specs/feature/`, `specs/documentation/DOC-OPS-001-*`.

## Acceptance Criteria

- [x] Cada apartado de arquitectura, protocolo, pruebas y limitaciones de `CLAUDE.md` tiene su especificación.
- [x] Criterios marcados solo cuando una prueba los cubre, nombrada en Traceability.
- [x] Las incoherencias entre documentación y código quedan como tareas o preguntas abiertas.

## Evidence

- Commit «KDD: especificaciones como fuente de verdad» (2026-09-26).
- `npm run kdd:check` y `npm run verify` en verde; CI de despliegue en verde.

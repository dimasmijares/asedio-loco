---
id: WRK-TASK-004
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
activates: [DOC-OPS-002, RULE-003]
dependencies: [{id: WRK-TASK-002, relation: depends-on}, {id: WRK-TASK-003, relation: depends-on}]
tags: [kdd]
---

# WRK-TASK-004 — Trabajo, AGENTS.md y CLAUDE.md

## Objective

Que lo hecho y lo pendiente se lea en `specs/work/`, y que las guías del agente remitan a `specs/`.

## File Scope

`specs/work/`, `AGENTS.md`, `CLAUDE.md`, `PLAN.md`, `DECISIONES.md`, `docs/MOVILES.md` (solo una nota de histórico).

## Acceptance Criteria

- [x] Fases 0-6 y el plan tras la primera prueba, archivados con sus commits.
- [x] Móviles como entrega activa: M1 completada y M2-M5 en draft.
- [x] Limitaciones y hallazgos de la revisión como tareas de WRK-PLAN-005.
- [x] `CLAUDE.md` reducido a entorno, comandos y mapa; `AGENTS.md` con el protocolo resumido.
- [x] Los documentos anteriores llevan una nota que remite a `specs/`.

## Evidence

- Commit «KDD: especificaciones como fuente de verdad» (2026-09-26).
- `npm run kdd:check` y `npm run verify` en verde; CI de despliegue en verde.

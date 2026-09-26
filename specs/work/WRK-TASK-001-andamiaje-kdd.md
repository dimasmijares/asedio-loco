---
id: WRK-TASK-001
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
activates: [DOC-OPS-001, DOC-OPS-002]
dependencies: []
tags: [kdd]
---

# WRK-TASK-001 — Andamiaje KDD

## Objective

Herramientas y puertas para trabajar con especificaciones.

## File Scope

`tools/spec-graph/`, `templates/`, `scripts/kdd.mjs`, `scripts/budget.mjs`, `package.json`, `.gitignore`, `.github/workflows/deploy.yml`, `.claude/`, `specs/README.md`, `DOC-OPS-002`.

## Acceptance Criteria

- [x] `npm run kdd`, `kdd:check`, `kdd:pendientes`, `verify` y `budget` funcionan.
- [x] CI ejecuta `kdd:check` antes de desplegar.
- [x] Agentes `spec-writer` y `spec-validator`, comandos `/spec-*` y `/release-loop` adaptados al proyecto.
- [x] `budget.mjs` da las mismas cifras que el original de `rag-docs`.

## Evidence

- Commit «KDD: especificaciones como fuente de verdad» (2026-09-26).
- `npm run kdd:check` y `npm run verify` en verde; CI de despliegue en verde.

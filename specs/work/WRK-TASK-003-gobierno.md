---
id: WRK-TASK-003
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
activates: [DOC-OPS-002, ARCH-003]
dependencies: [{id: WRK-TASK-001, relation: depends-on}]
tags: [kdd]
---

# WRK-TASK-003 — ADR y reglas

## Objective

Decisiones vigentes como ADR y reglas de trabajo como RULE.

## File Scope

`specs/governance/`.

## Acceptance Criteria

- [x] ADR-001 a ADR-011 cubren las decisiones de `DECISIONES.md` que siguen vigentes, con sus D-0NN de origen.
- [x] ADR-012 recoge la adopción de KDD.
- [x] RULE-001 a RULE-004 con su enforcement, y las especificaciones afectadas dependen de ellas (`constrained-by`), sin ciclos.

## Evidence

- Commit «KDD: especificaciones como fuente de verdad» (2026-09-26).
- `npm run kdd:check` y `npm run verify` en verde; CI de despliegue en verde.

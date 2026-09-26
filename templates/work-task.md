---
id: WRK-TASK-{NNN}
type: spec
layer: work-task
scope: ephemeral
status: draft                # draft → active → completed → archived
confidence: medium
version: 0.1.0
created: {YYYY-MM-DD}
updated: {YYYY-MM-DD}
owner: {team-or-person}
parent: WRK-PLAN-{NNN}       # or WRK-SPEC-NNN when there is no plan
activates:                   # budget: 2–5
  - {SPEC-ID}
dependencies:                # optional — sequencing between tasks
  - id: WRK-TASK-{OTHER-NNN}  # another task, not this one
    relation: depends-on
tags:
  - {tag}
---

# WRK-TASK-{NNN} — {Title}

## Objective

{One unit of implementable work, in one or two sentences. If it needs "and",
it is probably two tasks.}

## File Scope

{Qué archivos o carpetas puede tocar esta tarea y cuáles quedan fuera. Obligatorio antes de pasarla a `active`.}

## Implementation Notes

{What the implementer needs to know: which modules, which patterns to follow,
which rules from the activated specs apply here specifically.}

| Activated spec | What it requires of this task |
|----------------|-------------------------------|
| {SPEC-ID} | {the specific rule or constraint that lands here} |

{Anything else: known pitfalls, existing code to reuse, data shapes.}

## Acceptance Criteria

{Task-level and testable. Someone else must be able to verify these without
asking you.}

- [ ] {Criterion}
- [ ] {Criterion}

## Test Plan

| Level | What it covers |
|-------|----------------|
| Unit | {what} |
| Integration | {what} |
| Manual | {what, and why it cannot be automated} |

## Evidence

{Se rellena al cerrar: commits, pruebas ejecutadas y su resultado, ejecución de CI y fecha. Una tarea `completed` sin Evidence no pasa `npm run kdd:check`.}

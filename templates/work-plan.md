---
id: WRK-PLAN-{NNN}
type: spec
layer: work-plan
scope: ephemeral
status: draft                # draft → active → completed → archived
confidence: medium
version: 0.1.0
created: {YYYY-MM-DD}
updated: {YYYY-MM-DD}
owner: {team-or-person}
parent: WRK-SPEC-{NNN}
activates:                   # budget: 3–7
  - {SPEC-ID}
tags:
  - {tag}
---

# WRK-PLAN-{NNN} — {Title}

## Approach

{How the change will be built. The shape of the solution: components touched,
new pieces introduced, the order things have to happen in and why.}

## Task Breakdown

| Task | Objective | Depends on | Size |
|------|-----------|------------|------|
| WRK-TASK-{NNN} | {one sentence} | — | {S/M/L} |
| WRK-TASK-{NNN} | {one sentence} | WRK-TASK-{NNN} | {S/M/L} |

## Architecture Impact

{What this changes about the system's structure. If it contradicts an existing
ARCH spec, say so here — that contradiction needs an ADR, not a workaround.}

| Area | Impact | Spec affected |
|------|--------|---------------|
| {area} | {what changes} | {ARCH-NNN, or none} |

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| {risk} | {low/medium/high} | {low/medium/high} | {what you will do} |

## Dependencies

{External to this plan: other teams, upstream services, data availability,
decisions still pending.}

- {dependency} — {owner} — {needed by}

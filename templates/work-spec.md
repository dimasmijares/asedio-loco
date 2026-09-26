---
id: WRK-SPEC-{NNN}
type: spec
layer: work-spec
scope: ephemeral
status: draft                # draft → active → completed → archived
confidence: medium
version: 0.1.0
created: {YYYY-MM-DD}
updated: {YYYY-MM-DD}
owner: {team-or-person}
activates:                   # knowledge specs that constrain this work — budget: 5–10
  - {SPEC-ID}
dependencies:                # optional
  - id: {SPEC-ID}
    relation: {relation}
tags:
  - {tag}
---

# WRK-SPEC-{NNN} — {Title}

## Problem Statement

{What is wrong or missing today, and what it costs. Describe the problem, not
the solution you already have in mind. Include how you know it is a problem.}

## Proposed Change

{What will be different once this is done. Scope it explicitly.}

**In scope:**

- {item}

**Out of scope:**

- {item, and why it is deferred}

## Knowledge Context

{Why each activated spec matters here — one line each. If you cannot justify a
spec's presence, remove it from `activates`.}

| Spec | Why it applies |
|------|----------------|
| {SPEC-ID} | {what it constrains or informs in this work} |

{If a needed knowledge spec does not exist yet, say so — and write it before
proceeding.}

## Constraints

{Inherited from the activated specs, plus anything specific to this work:
deadlines, compatibility, data migration, operational limits.}

- {Constraint} — {source: SPEC-ID or other}

## Acceptance Criteria

{The definition of done for the whole change. Testable.}

- [ ] {Criterion}
- [ ] {Criterion}

## Open Questions

- [ ] {Question} — {who decides, by when}

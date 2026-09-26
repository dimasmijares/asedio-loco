---
id: RULE-{NNN}
type: rule
layer: governance
status: active               # active → deprecated
confidence: high
version: 1.0.0
created: {YYYY-MM-DD}
updated: {YYYY-MM-DD}
owner: {team-or-person}
dependencies:                # optional — specs or ADRs this rule enforces
  - id: {SPEC-ID}
    relation: {relation}
tags:
  - {tag}
---

# RULE-{NNN} — {Rule, stated as a title}

## Rule

{The constraint, stated so that compliance is unambiguous. One rule per file.
Use "must" and "must not" — not "should".}

## Scope

{Where this applies and where it does not. Be specific about the boundary:
which repositories, which layers, which kinds of change.}

## Rationale

{Why this rule exists. Link the ADR or spec it comes from. A rule with no
rationale gets ignored the first time it is inconvenient.}

## Enforcement

| Mechanism | Where | Blocking |
|-----------|-------|----------|
| {CI check / review checklist / linter / spec-graph validate} | {where it runs} | {yes/no} |

## Exceptions

{How an exception is granted, by whom, and how it is recorded. If there are no
exceptions, say so explicitly.}

| Exception | Granted by | Recorded in |
|-----------|------------|-------------|
| {case} | {who} | {where} |

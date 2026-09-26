---
id: {TYPE-AREA-NNN}          # ARCH-001 | DOM-BILLING-001 | PROD-SIGNUP-001 | FEAT-AUTH-001 | DOC-API-001
type: spec
layer: {layer}               # architecture | domain | product | feature | documentation
domain: {domain}             # optional — functional domain from your taxonomy
subdomain: {subdomain}       # optional
status: draft                # draft → active → deprecated
confidence: low              # low | medium | high
version: 0.1.0               # semver
created: {YYYY-MM-DD}
updated: {YYYY-MM-DD}
owner: {team-or-person}
reviewers:                   # optional — required reviewers for changes
  - {reviewer}
dependencies:                # optional — spec IDs only; these edges are the graph
  - id: {SPEC-ID}
    relation: {relation}     # implements | constrained-by | extends | uses-data-from
supersedes: null             # optional — ID of the spec this replaces
tags:
  - {tag}
---

# {ID} — {Title}

## Intent

{What this spec defines and why it exists, in 2–3 sentences. A non-technical
stakeholder should understand it. State the need it addresses, not the solution.}

## Definition

<!--
Keep ONLY the subsection block matching this spec's layer; delete the rest.

  Architecture   → Context · Decision · Rationale · Consequences
  Domain         → Concept · Rules · Constraints · Examples
  Product        → Purpose · Actors · Flow · Acceptance Criteria
  Feature        → Purpose · Inputs · Behavior · Outputs
  Documentation  → Purpose · Audience · Content outline
-->

### Context

{What forces, constraints, or facts make this decision necessary.}

### Decision

{The decision taken. State it as a fact, in the present tense.}

### Rationale

{Why this option and not the alternatives. Name the alternatives rejected.}

### Consequences

{What this makes easy, what it makes hard, what it rules out. Include the costs.}

<!-- ===== Domain layer =====
### Concept
{The business concept being formalized, defined precisely.}

### Rules
1. {Rule, stated so it can be checked against an implementation.}

### Constraints
{External constraints: regulations, contracts, SLAs, legacy interfaces.}

### Examples
{Concrete cases, including at least one edge case and one counter-example.}
===== -->

<!-- ===== Product layer =====
### Purpose
### Actors
### Flow
### Acceptance Criteria
===== -->

<!-- ===== Feature layer =====
### Purpose

### Inputs
| Input | Type | Required | Notes |
|---|---|---|---|

### Behavior
{Including error paths and edge cases.}

### Outputs
| Output | Type | Notes |
|---|---|---|
===== -->

<!-- ===== Documentation layer =====
### Purpose
### Audience
### Content outline
===== -->

## Acceptance Criteria

{Testable conditions that determine whether an implementation conforms to this
spec. Each one must be verifiable by a person or a test — not an aspiration.}

- [ ] {Criterion}
- [ ] {Criterion}

## Evidence

{What validates this knowledge, and how it moved the confidence level.}

| Type | Reference | Date | Confidence impact |
|------|-----------|------|-------------------|
| {Expert review / Testing / Production data / External source} | {reference} | {YYYY-MM-DD} | {low → medium} |

## Traceability

{Links to everything that is NOT a spec. Spec-to-spec links belong in the
frontmatter `dependencies` field, not here.}

| Relation | Target | Description |
|----------|--------|-------------|
| Implemented in | `{path/to/module}` | {what} |
| Tested by | `{path/to/tests}` | {what} |
| Decided in | {ADR-NNN} | {which decision} |
| RFC origin | {RFC-NNN} | {which proposal} |
| External ref | {document} | {what it establishes} |

## Open Questions

{Anything unresolved. Better here than guessed at above. Delete if empty.}

- {Question} — {who can answer it}

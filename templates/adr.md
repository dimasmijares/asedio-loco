---
id: ADR-{NNN}
type: adr
layer: governance
status: proposed             # proposed → accepted → deprecated | superseded
confidence: high
version: 1.0.0
created: {YYYY-MM-DD}
updated: {YYYY-MM-DD}
owner: {team-or-person}
deciders:
  - {who}
dependencies:                # optional — specs this decision affects
  - id: {SPEC-ID}
    relation: {relation}
supersedes: null             # ADR-NNN this replaces, if any
tags:
  - {tag}
---

# ADR-{NNN} — {Decision, stated as a title}

## Context

{The situation that forced a decision. The constraints in play, what was
already true, and what was at stake. Write it so it still makes sense to
someone reading it in two years with none of today's context.}

## Decision

{The decision, in the present tense and as a fact: "We use X for Y."}

## Consequences

**Positive:**

- {what this makes possible or easier}

**Negative:**

- {what this costs, makes harder, or rules out — be honest here; an ADR with no
  negative consequences is an ADR that has not been thought through}

**Neutral:**

- {what changes without being better or worse}

## Alternatives Considered

| Alternative | Why it was rejected |
|-------------|---------------------|
| {option} | {the specific reason, not "worse"} |

## Knowledge Impact

{Which knowledge specs must change as a result of this decision. Each of these
is a follow-up, not an intention.}

- [ ] {SPEC-ID} — {what needs updating}

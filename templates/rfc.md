---
id: RFC-{NNN}
type: rfc
layer: governance
status: draft                # draft → discussion → accepted | rejected | withdrawn
confidence: low
version: 0.1.0
created: {YYYY-MM-DD}
updated: {YYYY-MM-DD}
owner: {team-or-person}
reviewers:
  - {who}
dependencies:                # optional — specs this would change
  - id: {SPEC-ID}
    relation: {relation}
tags:
  - {tag}
---

# RFC-{NNN} — {Proposal}

## Motivation

{What problem this proposal solves, and why the current approach is not enough.
Evidence beats assertion: numbers, incidents, concrete friction.}

## Proposal

{What you are proposing, in enough detail that someone could disagree with the
specifics rather than the general direction.}

## Trade-offs

| Gain | Cost |
|------|------|
| {what improves} | {what it costs, in effort, risk, or capability lost} |

## Alternatives

| Alternative | Assessment |
|-------------|------------|
| Do nothing | {what happens if this is not done} |
| {option} | {why it is weaker, or under what conditions it would be better} |

## Impact

{Which specs, systems, and teams this touches if accepted.}

- **Specs affected**: {SPEC-IDs}
- **Systems affected**: {what}
- **Migration**: {what it takes to get from here to there, or "none"}

## Open Questions

- [ ] {Question} — {who can resolve it}

## Resolution

{Filled in when the RFC closes: the outcome, the date, and the ADR that records
the decision. Leave empty while in discussion.}

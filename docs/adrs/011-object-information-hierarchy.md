# 011: Present object information in a fixed priority order

## Status

Accepted

## Context

Readers need an object's origin, current location, documents and movement history
before administrative detail. The explorer buried documents in individual claims,
omitted some empty states and gave record metadata competing prominence.

## Decision

Object-facing projections — starting with the Explorer item page — present information in this order:

1. **Origin** — where the object is from (`made_at`, `made_during`, `found_at`), kept distinct as predicates but grouped as one answer.
2. **Current location** — where it is now (`held_by`, `located_at`). Custody does not imply ownership.
3. **Documents** — sources that describe, depict, evidence, or administratively document the object.
4. **Provenance** — how it got there (`provenance.event` and related claims).
5. **Everything else** — remaining claims, restitution case summaries, identifiers, and record metadata.

Therefore:

- do not invent schema columns for “origin”, “documents”, or similar rollups;
- derive the hierarchy as a presentation projection from existing claims, sources, evidence, provenance events, and restitution document links;
- always surface tiers 1–4 for items, including empty states when nothing is recorded;
- keep restitution cases below provenance; surface restitution *documents* under documents;
- keep predicate distinctions (production ≠ findspot ≠ movement origin ≠ current location).

## Consequences

Missing research stays visible without adding canonical columns. Read projections
must aggregate and deduplicate documents from evidence, direct links and restitution.
Sparse items will display several empty sections.

## Alternatives considered

| Alternative | Reason rejected |
| --- | --- |
| Add origin/location/document columns on `entities.item` | Duplicates attributed claims and hides source disagreement. |
| Keep documents only as claim evidence | Forces readers to discover sources by scanning every claim. |
| Treat restitution as tier 4 alongside provenance | Restitution is operational case management; movement history remains provenance. |
| Hide empty tiers | Conceals what the research record does not yet know. |

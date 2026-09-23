# 010: Do not store generic descriptive prose on entities

## Status

Accepted

## Context

`entities.entity.working_label` and `notes` began as operational conveniences but
came to drive search, headings, sorting, fixture lookup and event descriptions.
They became an unsourced description layer that concealed missing structured claims.

## Decision

Entity rows will store identity and subtype structure, not generic descriptive prose.

Therefore:

- remove `working_label` from `entities.entity`;
- remove `notes` from `entities.entity`;
- do not introduce replacement generic label or description columns;
- represent names, descriptions, classifications, relationships, and historical information through attributed claims;
- derive event titles from structured event claims;
- derive other display labels from name claims, identifiers, source references, or explicit generic UUID-based fallbacks;
- do not derive labels or summaries from notes, evidence excerpts, or descriptive prose used as a silent fallback.

Display labels and summaries are presentation projections. They are not entity identity, preferred names, or historical assertions.

`knowledge.claim.notes` and `knowledge.claim_evidence.notes` remain available as editorial metadata. They may document encoding decisions, transcription issues, data-quality concerns, or evidence-locator limitations, but must not supply domain meaning.

## Consequences

Missing structure remains visible and display values remain reproducible, at the
cost of more complex read projections and deterministic selection among name claims.
Unnamed entities need generic fallbacks; event titles change with their claims.
Fixtures must use stable IDs rather than labels.

## Alternatives considered

| Alternative                                                          | Reason rejected                                                                       |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Retain `working_label` with stricter documentation                   | Convenience fields had already become semantically significant despite documentation. |
| Rename it to `operational_label`                                     | Preserves the same escape hatch under a different name.                               |
| Make labels or notes nullable                                        | Still encourages prose whenever structured data is inconvenient.                      |
| Store generated event titles                                         | Turns a disposable projection into canonical entity data.                             |
| Use notes, `described_as`, or evidence excerpts as display fallbacks | Allows unsourced or context-specific prose to silently define entity meaning.         |
| Automatically convert existing prose into claims                     | Would create assertions without establishing attribution or evidence.                 |

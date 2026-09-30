# 025: Retain earlier competencies in the Git collection

## Status

Accepted. Extends [ADR 020](020-use-a-git-backed-public-collection.md) and adapts
[ADR 011](011-object-information-hierarchy.md). Page hierarchy and source locators
are implemented; structured person/remains relations remain deferred.

## Context

The earlier decisions prioritised discoverable evidence and distinct, attributed
accounts. The Git-backed website can retain these benefits without restoring the
former database model or its maintenance burden.

## Decision

Keep the earlier ADRs' useful intent within the static, Git-backed application:

- After foregrounded perspectives and images, show origin/findspot, reported
  holding/location, full source accounts, then authored editorials. Derive groups
  from existing claims, keep predicate distinctions and omit empty groups.
  Unsupported provenance and restitution sections remain absent. This adapts
  ADR 011's ordering and requirement to show empty tiers.
- Link grouped claims to their source accounts. Preserve competing accounts,
  source wording and uncertainty; a reported location may be historical.
- Allow an optional plain-text claim `locator` for a page, row or passage;
  existing records remain valid and need no backfilling.
- Use competency cases as references for behavioural tests, adapting their
  requirements to the current model. [Projection tests](../../src/data/collection-record.test.ts)
  reference cases 01–03 and 06–07; [rendering tests](../../src/components/AttributedClaims.test.ts)
  check attribution, source links and locators in both interfaces.
- Keep [ancestral people distinct from remains](009-human-remains.md) in wording;
  structured person records remain deferred.

## Consequences

The website keeps one static build and a small file contract. Missing groups do
not appear as research prompts. Competency cases remain references, not a backlog
to reproduce the former model. Agents can work on public museum material without
a separate publication approval process.

# Roadmap

## Immediate editorial work

- Review the three migrated records marked as former drafts in the
  [migration report](../collection/migration-report.md).
- Confirm authorship for the Hoa Haka Nana Ia and Mamari articles.
- Add authorised object images with credit, rights, alt text and source records.
- Choose foregrounded claims with Rapa Nui collaborators rather than treating
  prominence as an automatic museum-data rule.
- Review canonical navigation names against source-attributed names.
- Write a critical article examining when creative “returns” redistribute
  authority and restore relationships, and when digital surrogates, artistic
  interventions and institutional programmes merely circulate representations
  or defer physical restitution. Use the creative restitution sources as case
  studies.

## Exhibition: A Short History of Taking Things and Keeping Them

Develop an exhibition that turns museums themselves into subjects of scrutiny:
use their catalogues, declarations, refusals and policies to examine how they
justify authority and make possession appear ordinary. Let institutional wording
carry the provocative humour, with accurate attribution and context clearly
separated from MoSA's commentary.

Proposed placement: an **Exhibitions** navigation entry and a homepage **Now
showing** feature, leading to one continuous page with shareable sections on
acquisition, expertise, universality, care, delay and return. Placement and
presentation remain to be decided.

Reuse the documentary source records as evidence and the existing article model
for authored interpretation linked to those sources. Add a dedicated exhibition
layout with paired English and Spanish routes; documents can be exhibits without
becoming displaced-object records. Avoid a general exhibition system until a
concrete need emerges. Next step: draft the entrance and two complete exhibits
to test the voice, sequence and visual treatment before implementing the whole
exhibition.

## Shared research programme

The [programme index](../research/README.md) owns research priorities.
[research guidance](research.md) owns strategy and campaign coordination, and
the [incorporate source skill](../.agents/skills/incorporate-source/SKILL.md)
owns the end-to-end procedure. Systematic discovery of Rapa Nui material abroad
should cover relevant institutional departments and catalogue routes, document
search terms and pagination coverage, inspect and preserve evidence, reconcile
objects, extract attributed claims and clear any images for publication. A
narrower pass must state what integration remains.

Campaigns retain rationale, planned and dated coverage, concise candidate
outcomes and next actions. They link to collection sources and objects rather
than copying their contents. Keep research evidence in ignored local staging by
default; retain an ordinary file under `research/evidence/` only when it
supports an unresolved candidate or consequential decision, is hard to recover or prevents substantial
repeat work.

The [collection authoring guide](collection-publication.md) defines record and
publication rules. The shared IndiGen history remains a separate existing
follow-up: its Bishop paper has one collection source and a shared identifier
transcription, with its PDF kept private. Continue its bounded identity work
without treating the register as the default campaign format.

## Accepted work awaiting implementation

- Implement [ADR 029: short opaque object identifiers](adrs/029-use-short-opaque-object-identifiers.md).
  Add allocation, permanent reservations, integration checks and contributor
  lookup before migrating existing object handles and references. Preserve
  published URLs and update authoring guidance with the implementation.

## Implemented model and deferred work

The distinction between displaced objects and documentary sources is
implemented as recorded in [ADR 027](adrs/027-distinguish-displaced-objects-and-documentary-sources.md).
Sources have public pages and typed relationships; independently identifiable
photographs have their own source records. Articles are a separate layer of
authored MoSA publications and can concern objects, sources, both or neither.
Follow the collection authoring guide for the current record, image and
publication workflows.

The reduced model does not implement structured provenance events, custody,
restitution case administration, cultural-authority protocols, claim certainty
or structured evidence relationships. The [competency cases](test-cases/) preserve
the harder requirements. Extend the model only when public material needs one of them.

A future editing interface may be useful when Git becomes a practical barrier
for contributors. Build it against the same small file contract before
introducing another canonical datastore.

## Release checks

Before a production release, run `just verify` and `just image`.
Confirm Coolify has Git LFS enabled and review the affected Spanish and English
pages. Hosted deployment and image delivery can only be confirmed against the
real production application.

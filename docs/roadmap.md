# Roadmap

## Immediate editorial work

- Review the three migrated records marked as former drafts in the
  [migration report](../collection/migration-report.md).
- Confirm authorship for the Hoa Haka Nana Ia and Mamari editorials.
- Add authorised object images with credit, rights, alt text and source records.
- Choose foregrounded claims with Rapa Nui collaborators rather than treating
  prominence as an automatic museum-data rule.
- Review canonical navigation names against source-attributed names.

## Shared research programme

The [research guide](research.md), [programme overview](../research/README.md)
and [ADR 026](adrs/026-share-research-plans-and-evidence.md) define the minimal
shared workflow.

- [x] Simplify the proposal to campaign documents and existing registers.
- [x] Adapt the research commands for shared storage and evidence limitations.
- [x] Share IndiGen progress and selected evidence; check historical parity and
  resumption from a clean checkout.
- [x] Run the bounded Bishop mata‘a publication pilot.
- [x] Update contributor instructions to the tested workflow.

Migrate other useful history and run wider institutional campaigns incrementally.
Leave legacy scratch files alone; extend tooling only for problems found in use.

## Deliberately deferred model work

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

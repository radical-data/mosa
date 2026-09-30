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

The [programme index](../research/README.md) owns research priorities.
[Collection authoring](collection-publication.md) is the default workflow;
[research guidance](research.md) covers optional campaigns and registers.

The shared IndiGen history is portable. The Bishop paper has one collection
source and a shared identifier transcription, with its PDF kept private.
Next work is a bounded identity-reconciliation batch, not another research
infrastructure phase. Extend tooling only when an actual task demonstrates the
need; do not migrate or classify every legacy scratch file.

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

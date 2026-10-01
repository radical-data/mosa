# 020: Use a Git-backed public collection

## Status

Accepted.

Extended by [ADR 021](021-use-a-single-package-static-website.md), which moves
the sole website to the repository root and changes its runtime to static
output.

## Context

The PostgreSQL ontology and research application require a database, private
Storage, an authenticated review interface, import contracts and a second
deployed application. That operating surface is disproportionate to the current
collection and does not make the richer ontology directly useful to the public.

The public collection currently contains 12 reviewed records. The final export
also contains 5 canonical objects without visible publication records and 3
unaccepted drafts. The exported source files are PDFs and HTML captures rather
than object photographs. MoSA has no authored articles yet.

## Decision

- Store publishable collection records in Git and include them in the public
  website build.
- Give each object one JSON file with a MoSA display name and an ordered list of
  foregrounded claim identifiers.
- Give each source one JSON file containing its authorship, reference, language,
  attributed claims and image records.
- Store future articles as Markdown with YAML front matter. Article prose is
  not automatically a structured claim.
- Keep claim values as source wording in plain text. Keep source attribution and
  conflicting accounts visible.
- Treat foregrounding as editorial salience rather than truth ranking,
  ownership, consent or publication permission.
- Store collection images in Git LFS. Museum image URLs remain source metadata;
  a website build does not depend on those URLs.
- Publish collection changes through the existing manual website deployment.
- Retire the explorer, Supabase database workflow, packet importer and live-feed
  publication system after the reviewed records have been reconciled.

The initial migration includes the 17 canonical objects and the 3 unaccepted
drafts so that the team can review and revise them in the new workflow. Drafts
without canonical identities remain separate objects and are not silently merged.
Omitted claim proposals remain private. A migration report must preserve the
earlier review state and account for every exported object and draft.

## Consequences

The website becomes the only deployed application. Collection additions,
corrections and withdrawals require a Git review and website deployment. The
repository has a smaller ontology and no database-backed research workspace.

The reduced model preserves source plurality, original wording and explicit
foregrounding, but it does not model provenance events, restitution case
administration or claim-evidence relationships as separate public entities.
Those capabilities can be added only when concrete collection work requires
them.

An older website image also contains older collection content. Operational
rollback must not restore withdrawn material; use a forward correction instead.

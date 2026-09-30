# Architecture

## System

MoSA has one deployed application and one versioned public collection.
Git is the canonical collection store. Supabase is no longer part of the
application, and there is no database synchronisation or separate content release.

```text
source JSON ──► direct object links ─────┐
      ├──► attributed claims ──► object page
      │                                  ▲
      └──► image metadata ─► LFS image ──┤
object JSON ─► name + foreground choices ┤
editorial Markdown ──────────────────────┘
```

The root Astro project validates and loads `collection/` during its build. It
generates every language and object page as static HTML. Docker packages those
files and processed images in an unprivileged Nginx image. The running container
has no Node.js application, database credentials or collection-service request.

[ADR 020](adrs/020-use-a-git-backed-public-collection.md) supersedes the former
PostgreSQL, explorer, dossier-import and live-feed architecture. [ADR
021](adrs/021-use-a-single-package-static-website.md) records the root
single-package layout and static runtime.

The repository remains a pnpm project, but it is not a multi-package monorepo.
`pnpm-workspace.yaml` holds engine and supply-chain settings for the root
package; it does not declare application packages.

## Reduced collection model

An **object** has a stable, readable file handle, a concise canonical navigation
name and a list of qualified claim references selected for foregrounding. The
file handle is also the public URL identity.

A **source** records who authored or asserted it when known, its exact reference,
its language, and the claims and image records derived from it. It can link
directly to an object before claims or images are extracted. An examined
publication can also have a source record with no object links or claims yet;
registering it does not assert an object identity. Claims and images
already provide their own object links, so direct links are used only where that
association would otherwise be absent. Sources and objects have different
identities. A shared URL does not prove that two objects are the same.

A source can also record `captures`: preservation metadata pointing to original
files in the repository-only `source-files/` tree or an exact archive URL. Capture
bytes use Git LFS. Neither captures nor their metadata are rendered by the site;
website builds do not require those bytes. [ADR 024](adrs/024-preserve-source-captures.md)
records this boundary.

Systematic research is coordinated in optional Markdown campaigns. Campaigns
hold rationale, scope, planned and dated search coverage, concise candidate
outcomes, links and remaining integration; they do not duplicate claims or
collection inventories. Useful retained research files may live under
`research/evidence/<campaign-id>/` under the
[research retention rule](research.md#retaining-research-evidence). Source capture
staging remains local until reviewed, while a registered source capture is
durable verification evidence under `source-files/`.

A **claim** has an ID local to its source, an object ID, a controlled predicate
and a textual value. References outside the source qualify the local ID with the
source handle, such as `wikipedia-mamari/name-mamari`. Claims stay inside sources
so attribution is structural rather than an optional afterthought. Conflicting
names and classifications can coexist.

An optional claim `locator` identifies a passage within the source; see
[collection authoring](collection-publication.md).

An **image record** also stays inside a source. It links an object to a local,
publishable image and records alt text, credit, rights, caption and original URL
where available. The binary image lives in Git LFS.

An **editorial** is authored Markdown linked to an object. It is a publication
layer with its own author and language. Editorial prose does not become an
unattributed claim.

## Politics of presentation

The model does not pretend that a collection interface can be neutral.
Foregrounding a Rapa Nui claim is an explicit editorial act by MoSA. The source
and wording remain visible so prominence does not become an invisible claim of
universal truth.

The canonical object name is necessary for navigation and URLs, but it is
deliberately thin. Source-attributed names and classifications remain available
on the page. Rich MoSA interpretation has named authorship in editorials rather
than being smuggled into supposedly objective database fields.

This preserves a practical form of plurality while accepting the limits of the
reduced phase. It does not yet model full provenance events, custody histories,
restitution cases, cultural authority, access protocols or competing event
chronologies. The retained [competency cases](test-cases/) document those needs
without making the current publishing job depend on implementing all of them.

## Publication

The static build includes `collection/`. Agents can update public museum material
without a separate publication approval step. Website and collection changes
are deployed together. Private material stays in ignored `research-local/`.

The initial migration intentionally included 17 canonical records and three
previously unaccepted drafts at the owner's direction. Later evidence reconciled
two duplicate drafts with established objects; the Ua draft remains unresolved.
The [migration report](../collection/migration-report.md) preserves both the
historical migration and the subsequent identity decisions.

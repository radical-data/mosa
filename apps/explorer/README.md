# MoSA research explorer

A local, read-only Astro interface for visually inspecting the synthetic Phase 1 and Phase 2 database fixtures while the model is being developed.

It is intentionally not an authoring interface. It does not provide authentication, entity creation, claim creation, evidence entry, editing, deletion, import, restitution, publication, or workflow controls. It can inspect Phase 2 provenance events but cannot create or edit them.

## Run locally

From the repository root:

```sh
just db-start
just db-fixtures
just explorer-dev
```

Open <http://localhost:4321>.

The app defaults to the standard local Supabase PostgreSQL URL. Override it by copying `.env.example` to `.env` and setting `DATABASE_URL` (or the deprecated `LOCAL_DATABASE_URL` alias). Outside production, only loopback hosts are accepted. Production requires `DATABASE_URL` and `DATABASE_SSL_CA`. Every connection opens with PostgreSQL's read-only transaction setting.

## Views

- `/` searches entities by derived display label, `has_name` values, external identifiers, or source references.
- `/entities/:id` shows subtype data, identifiers, outgoing claims, incoming claims, and evidence summaries.
- `/claims/:id` shows one claim and all attached evidence.
- `/events/:id` shows one provenance event and its attributed statements.
- Item pages show sourced provenance events ordered by reported date.

## Source capture and review

The private `/research` workspace adds invited email-code sign-in, source drafts, identity confirmation and reviewed promotion through the shared `@mosa/object-dossier` importer. Reader routes remain available. See [source capture](../../docs/source-capture.md) for permissions, runtime configuration and publication.

# MoSA

The Museum of Stolen Artefacts: a public Astro website, a research explorer and
a Supabase database for entities, attributed claims, evidence, provenance and
restitution case management.

Researchers prepare sources locally or in the authenticated workspace, confirm
identity and accept reviewed proposals through the shared dossier importer.
A maintainer separately authorises a public snapshot. The static website reads
that snapshot without database access. Hosted discovery and preparation have
been retired; local research bundles are the current contribution workflow.

Public website: [museumofstolenartefacts.org](https://museumofstolenartefacts.org/).
Research: [research.museumofstolenartefacts.org](https://research.museumofstolenartefacts.org/).
These are the configured project addresses, not a live health report.

## Start development

Install [mise](https://mise.jdx.dev/) and Git. Tool versions come from `mise.toml`.

```sh
mise trust
mise install
mise exec -- just install
mise exec -- just website-dev
```

Open <http://localhost:4322/es/> or <http://localhost:4322/en/>. The website needs
no database, Docker or credentials. With mise active, use `just` directly;
otherwise prefix commands with `mise exec --`.

## Research explorer

Docker is required for local Supabase. Load synthetic fixtures only into a
development store: fixture loaders replace their reserved test records.

```sh
just db-start
just db-fixtures
just explorer-dev
```

Explorer: <http://localhost:4321>. Supabase Studio: <http://localhost:54323>.
Private researcher sign-in and source storage need the separate configuration in
[operations](docs/operations.md#research-access-and-storage).

`just db-reset` resets local data and applies migrations without seed data.
`just test-db` and `just verify` create and remove a separate disposable test stack,
including checks for generated database types. Never load fixture SQL into production.

Run `just` to list commands. `just install` also installs Git hooks.

## Documentation

- [Agent instructions](AGENTS.md): task routing, implementation rules and verification.
- [Architecture](docs/architecture.md): current system and domain boundaries.
- [Predicates](docs/predicates.md): claim vocabulary and evidence semantics.
- [Research](docs/local-research.md): capture, local bundles, review and acceptance.
- [Publication](docs/collection-publication.md): approval, export, withdrawal and deployment.
- [Operations](docs/operations.md): environment configuration and recovery.
- [Website content](docs/website-content.md): copy, events and languages.
- [Roadmap](docs/roadmap.md): open work and live checks requiring evidence.
- [ADRs](docs/adrs/) and [competency cases](docs/test-cases/): decisions and domain requirements.

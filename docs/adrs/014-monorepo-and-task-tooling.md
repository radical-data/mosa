# 014: Keep MoSA applications and database tooling in one monorepo

## Status

Accepted.

## Context

At the time of the decision, the database repository already contained the Astro research explorer in a pnpm workspace. The public website was also planned in Astro, with public presentation and the model expected to evolve together.

## Decision

- Rename the project to `mosa` and add the public application at `apps/website`.
- Keep the research explorer at `apps/explorer` and database migrations at `supabase/migrations`.
- Use mise for pinned development tools and just for repository tasks. Keep app-local package scripts for Astro and pnpm for dependency/workspace management.
- Build and deploy the applications separately. Preserve the root explorer Dockerfile for compatibility; give the website its own Dockerfile with the repository root as build context.
- Start the public website as a static app with no database dependency. Introduce a publication-aware read interface before exposing collection data.
- Extract shared workspace packages only when a concrete shared interface is needed. Application internals are not shared packages.

## Consequences

A single change can include migrations, read interfaces and UI updates with common verification. A shared commit does not make deployments atomic; migrations must remain compatible with old and new application versions.

The local Supabase project ID changes the development container namespace. Existing local volumes are retained, not automatically migrated. The hosted project identity is unchanged.

The website can be developed and built without a database. Its static container
remains database-free. The later publication workflow uses a private ledger and
manual deployment gate; see [publication](../collection-publication.md).

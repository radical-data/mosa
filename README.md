# MoSA

The Museum of Stolen Artefacts monorepo: a public Astro website, a research explorer, and the Supabase entities, claims and evidence database.

## Repository layout

| Path | Responsibility |
| --- | --- |
| `apps/website/` | Public Astro website; independently built static site |
| `apps/explorer/` | Astro research interface; server-rendered with database access |
| `supabase/` | Database migrations, local configuration, fixtures and SQL tests |
| `scripts/` | Imports, fixture loading and database verification |
| `schemas/` and `packets/` | Import contracts and source packets |
| `src/lib/database.types.ts` | Generated database types |
| `docs/` | Architecture decisions and operational documentation |

Each app owns its dependencies, routes, components and build output. Do not import another app's internals. Add a workspace package under `packages/` only when there is concrete shared code, and add `packages/*` to the workspace configuration then.

## Tools and setup

Install [mise](https://mise.jdx.dev/) and Git. mise pins Node.js, pnpm and [just](https://just.systems/). just is the command interface; pnpm manages JavaScript dependencies and app-local scripts. Docker is needed only for the local database and container builds.

```sh
mise trust
mise install
mise exec -- just install
mise exec -- just website-dev
```

With mise activated in your shell, use `just` directly. Otherwise prefix commands with `mise exec --`. Recipes also run their commands through mise so they use the pinned tools when invoked from a GUI or an unactivated shell.

Public website: <http://localhost:4322>. It starts without Supabase, credentials or fixtures.

## Research explorer and local database

```sh
just db-start
just db-reset
just db-fixtures
just explorer-dev
```

Explorer: <http://localhost:4321>. Supabase Studio: <http://localhost:54323>.

`db-reset` resets the local database and applies migrations without seed data. `db-fixtures` loads all three phases of synthetic test cases. Both are local development operations; never load fixtures into production.

```sh
just db-status
just db-migration describe_the_change
just db-types
just db-stop
```

### Existing checkouts renamed from mosa-db

The repository and local Supabase project identifier are now `mosa`. This creates a separate local container/volume namespace; it does not rename or migrate existing local database volumes. If the old stack is running, stop it before starting the new one:

```sh
just supabase stop --project-id mosa-db
```

This retains the old stack's data. Export any local data you need before moving to the new stack. `just db-start`, `just db-reset` and `just db-fixtures` initialise the new development database. The hosted Supabase project and its link are unchanged by this local identifier.

## Everyday commands

Run `just` to list recipes.

| Command | Purpose |
| --- | --- |
| `just dev` / `just website-dev` | Run the public website |
| `just explorer-dev` | Run the research explorer |
| `just website-build` / `just explorer-build` | Build one application |
| `just build` | Build both applications |
| `just website-preview` | Preview the website's existing production build |
| `just check` | Check formatting and lint rules |
| `just check-fix` | Apply formatting and lint fixes |
| `just typecheck` | Check scripts and both applications |
| `just test-unit` | Run unit tests |
| `just verify-static` | All checks and app builds without Docker |
| `just verify` | Full verification, including a local database reset and generated-type checks |
| `just docker-build` | Build both production images |

App and import recipes accept extra arguments, preserving quoting. For example, `just website-dev --host 127.0.0.1` or `just db-import-dossier-check "path with spaces/dossier.json"`. Use `just supabase ...` for other Supabase CLI operations.

Git hooks run through mise and just. `just install` reinstalls them after a clone, folder rename or hook update. Root package scripts contain only the dependency installation lifecycle hook; repository workflows live in `justfile`.

## Application and publication boundaries

The public website is deployed at [museumofstolenartefacts.org](https://museumofstolenartefacts.org/). It contains seven Spanish-language pages with curated design reference records. It has no database connection and does not reuse the explorer's broad reader role. Before displaying research database content, define a publication-aware read interface with permissions for approved records and fields. Keep any database credentials in server/build environments. Research access and public publication are separate concerns.

Database changes use committed migrations. Real or sensitive project data must not be committed as seed data.

## Collection product direction

- [Source-to-publication workflow](docs/collection-workflow.md): the agreed experience for source capture, research dossiers, review and public collection pages.
- [Implementation plan](docs/collection-workflow-implementation-plan.md): ordered delivery steps, dependencies and acceptance criteria, starting with one complete manual journey.
- [Data-entry discussion brief](docs/data-entry-efficiency-discussion.md): the original ontology and input-efficiency questions.

## Deployment

The applications have separate images and Coolify applications. The root `Dockerfile` remains the explorer image to preserve the existing deployment configuration. `apps/website/Dockerfile` builds the static website and serves it on port 8080 without database credentials.

CI checks both apps. Explorer deployment follows database migration success; website deployment has its own workflow and can run without database checks or migrations. The website workflow supports manual deployment to its separately configured hosting target.

See [deployment](docs/deployment.md), [operations](docs/operations.md) and the [monorepo decision](docs/adrs/014-monorepo-and-task-tooling.md).

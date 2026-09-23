# MoSA research explorer

Server-rendered Astro application with research reader routes and an invited,
authenticated workspace for private sources, drafts, catalogue administration
and explicit acceptance through `@mosa/object-dossier`.

The reader connection is read-only. The private workspace uses a separate
`capture_writer` connection. Reader routes are not all protected by researcher
sign-in; private drafts and original source files are. General editing of
accepted claims, provenance and restitution is not implemented.

## Develop and verify

Follow [root setup](../../README.md#research-explorer). Copy `.env.example` to
`.env` for local overrides. Outside production, database connections accept only
loopback hosts. Use the separate [research access configuration](../../docs/operations.md#research-access-and-storage)
for sign-in and private Storage.

```sh
mise exec -- just explorer-dev
mise exec -- just explorer-check
mise exec -- just explorer-build
```

Development uses port 4321. Production uses the root `Dockerfile`.

## Code entry points

| Path under `src/` | Purpose |
| --- | --- |
| `pages/index.astro`, `pages/entities/`, `pages/claims/`, `pages/events/` | Entity, evidence and provenance reading |
| `pages/restitution/` | Read-only restitution case exploration |
| `pages/research/` | Sign-in, drafts and catalogue administration |
| `pages/research/sources/`, `pages/research/bundles/` | Private PDFs and imported local research bundles |
| `lib/capture/` | Access checks, proposal model, identity review and acceptance |
| `lib/sources/` | Preserved sources, Storage, constrained fetch and bundle validation/import |
| `lib/database-config.ts`, `lib/database.ts` | Reader connection configuration and queries |

Local discovery replaces hosted search/model jobs; there is no active background
runner to provision. [Research](../../docs/local-research.md) describes the user
workflow, [architecture](../../docs/architecture.md) the boundaries, and
[operations](../../docs/operations.md) deployment and recovery.

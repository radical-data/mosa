# Deployment

Deployment configuration for the MoSA monorepo. Each application has its own Coolify target and can be rolled back independently. The explorer uses managed Supabase; the initial website is static.

Do not put passwords, tokens, certificates, or live connection strings in this repository.

## Required GitHub secrets (`production` environment)

| Secret | Purpose |
|--------|---------|
| `SUPABASE_ACCESS_TOKEN` | Supabase CLI authentication for `db push` |
| `SUPABASE_PROJECT_ID` | Production project ref |
| `SUPABASE_DB_PASSWORD` | Database password for migration apply |
| `COOLIFY_DEPLOY_WEBHOOK` | Triggers a Coolify deploy for the app |
| `COOLIFY_API_TOKEN` | Bearer token with deploy permission for the research application |
| `PRODUCTION_URL` | Public URL used for post-deploy smoke tests |

Create `SUPABASE_ACCESS_TOKEN` in [Supabase account access tokens](https://supabase.com/dashboard/account/tokens), with a recognisable name such as `mosa-production`. This is a personal access token, separate from the project's publishable key. Use the saved project database password for `SUPABASE_DB_PASSWORD`; if unavailable, reset it under **Database → Settings** and update any connections using that password. Set `SUPABASE_PROJECT_ID` to the project reference. Enter credentials directly as GitHub environment secrets, not in repository files or chat. See Supabase's [token documentation](https://supabase.com/docs/guides/platform/personal-access-tokens) and [password reset instructions](https://supabase.com/docs/guides/troubleshooting/how-do-i-reset-my-supabase-database-password-oTs5sB).

For the pinned CLI's `link` followed by `db push`, scope the token to MoSA. Start with no access and grant **Read** for **Project Settings**, **Connection Pooling**, **API Keys** and **API Key Secrets**. Linking retrieves connection information and API keys; migrations use the separate database password. Other service-configuration reads during linking are optional. Leave other token permissions disabled. Record the token's expiry outside Git and replace the GitHub secret before it expires. Verify this permission set again when changing the CLI's linking behaviour.

These three Supabase secrets belong to `production`. The separate `website-production` environment does not make its secrets available to research migration jobs.

## Required Coolify runtime secrets

| Variable | Notes |
|----------|-------|
| `DATABASE_URL` | Runtime login URL (literal if the password contains `$`) |
| `DATABASE_SSL_CA` | Supabase CA certificate (multiline) |
| `HEALTHCHECK_TOKEN` | Shared with Docker/`X-Health-Token` health checks |
| `NODE_ENV` | `production` |
| `DATABASE_POOL_SIZE` | Optional; default `5` |
| `DATABASE_STATEMENT_TIMEOUT_MS` | Optional; default `5000` |

`HOST` defaults to `0.0.0.0` and `PORT` to `4321` in the image.

## Explorer environment variables

| Variable | Required in production | Notes |
|----------|------------------------|-------|
| `DATABASE_URL` | yes | Prefer over deprecated `LOCAL_DATABASE_URL` |
| `DATABASE_SSL_CA` | yes | Verified TLS |
| `HEALTHCHECK_TOKEN` | yes | Authorizes `/livez` and `/readyz` |
| `DATABASE_POOL_SIZE` | no | Default `5` |
| `DATABASE_STATEMENT_TIMEOUT_MS` | no | Default `5000` |
| `LOCAL_DATABASE_URL` | no | Dev-only deprecated alias; ignored as production source |

Unauthorized health requests return `404` and do not query PostgreSQL. External uptime checks should hit a normal page (for example `/`), not `/readyz`.

## Managed Supabase provisioning checklist

1. Create one production project on PostgreSQL 17 in a region near the Coolify server.
2. Confirm required extensions match local development (including `unaccent` in `extensions`).
3. Apply migrations (`supabase db push` / CI deploy job). Do not load fixtures or `seed.sql`.
4. Create login `explorer_runtime_production` outside Git:
   - generated password
   - `grant explorer_reader to explorer_runtime_production`
   - `alter role ... set default_transaction_read_only = on`
   - short `statement_timeout` and a small connection limit
5. Build `DATABASE_URL` from that login.
6. Keep the Data API disabled. Enable email OTP in Auth for invited researchers; keep public sign-ups disabled. Storage, Realtime and Functions remain unused. See [source capture](source-capture.md) for the separate writer login and researcher allowlist.
7. Download the database CA certificate for `DATABASE_SSL_CA`.
8. From the Coolify host, test connectivity:
   - prefer the direct PostgreSQL endpoint if outbound IPv6 works
   - otherwise Supavisor **session** mode on port `5432` (not transaction mode)
9. Enable SSL enforcement after the verified-TLS test succeeds.
10. Restrict network access to the Coolify egress address where practical.
11. Confirm managed daily backups are active.

A staging project and PITR can wait until there is a demonstrated need.

## Coolify application checklist

1. Connect the private GitHub repository through the Coolify GitHub App.
2. Create a Dockerfile application:
   - branch `main`
   - build pack Dockerfile
   - base directory `/`
   - Dockerfile `/Dockerfile`
   - internal port `4321`
   - no host port mapping
   - no persistent volume
   - rolling updates enabled
   - default container naming
3. Configure the production domain and DNS.
4. Set the runtime-only secrets listed above (not build variables).
5. Point Coolify health checks at `/readyz` with header `X-Health-Token: <HEALTHCHECK_TOKEN>`.
6. **Disable auto-deploy on push** so migrations always run before the new container ships.
7. Perform the first deployment manually and verify it before relying on the GitHub deploy job.

## Initial deployment checklist

1. Apply all migrations to production and confirm with `supabase migration list`.
2. Verify `explorer_runtime_production` can `SELECT` expected objects and cannot write or run DDL.
3. Trigger the first Coolify deployment for the image built from this repository.
4. Confirm:
   - container health passes
   - TLS certificate is issued for the domain
   - authorized `/livez` and `/readyz` succeed
   - representative explorer pages render
   - no secrets appear in build or application logs
5. Point production DNS only after those checks pass.
6. Enable or rely on the GitHub Actions `migrate` and `deploy-explorer` jobs on `main` (CI must pass `static`, `database`, and `docker` first).

## Public website

The public website is deployed at [museumofstolenartefacts.org](https://museumofstolenartefacts.org/). The `Website` workflow checks the website and builds its image on relevant changes. It does not need Supabase, database tests or database credentials. Publishing through this workflow is a separate, manual action gated by the private publication ledger. Follow the [collection publication runbook](collection-publication.md) for the required publisher connection, commit pinning and withdrawal.

1. Create a separate Coolify application connected to `radical-data/mosa`, branch `main`.
2. Use Dockerfile build pack, repository/base directory `/`, Dockerfile `/apps/website/Dockerfile`, and internal port `8080`.
3. Set the website domain to `https://museumofstolenartefacts.org` and use `/` for the HTTP health check. Configure permanent redirects from HTTP to HTTPS and from `www.museumofstolenartefacts.org` to the canonical hostname, preserving paths and query strings. No application secrets, persistent volumes or database connection are required.
4. Disable automatic Git deployments. The workflow will trigger deployments explicitly.
5. Create the GitHub environment `website-production` and restrict it to `main`. Under **Environment secrets**, add `COOLIFY_DEPLOY_WEBHOOK`, copied from the website application's **Configuration → Webhooks → Deploy Webhook (auth required)**, and `COOLIFY_API_TOKEN`, created under Coolify's **Keys & Tokens → API Tokens** with `read` and `deploy` permissions. Enable API Access in the self-hosted Coolify instance settings if needed. The webhook identifies the application; the token authorises the request. Under **Environment variables**, add `PRODUCTION_URL` with the value `https://museumofstolenartefacts.org/`. The URL is public configuration; the workflow reads it through `vars.PRODUCTION_URL`. The explorer's existing `production` environment is configured separately.
6. Add the publication connection secrets described in the [publication runbook](collection-publication.md). Disable preview deployments and pin the application to the full reviewed Git commit. Deploy through the `Website` workflow on `main` with its `deploy` input enabled; do not bypass its publication gate through a direct dashboard deployment or image rollback.

The existing `production` environment and its explorer secrets remain valid. Keep the root Dockerfile selected for that application. After the repository rename, confirm Coolify's GitHub integration still points at the renamed repository.

CI runs broad repository checks on all changes while the monorepo is small. The website workflow also builds its own container independently. Path-based CI optimisation and automatic public releases can be added when needed.

The publication gate verifies the hosting job, reviewed commit, served snapshot and both language listings before recording the release as live. An interrupted or uncertain deployment remains pending and requires the recovery procedure in the publication runbook.

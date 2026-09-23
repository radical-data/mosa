# Operations

Inspect existing Coolify and Supabase configuration before provisioning resources.
Store credentials and certificates in the relevant runtime or GitHub environment.

## Deployment boundaries

| Target | Build/runtime | Release path |
| --- | --- | --- |
| Research explorer | Root `Dockerfile`, port 4321; database/Auth/Storage runtime secrets | `CI`: static, database and image checks → production migrations → explorer deployment |
| Public website | `apps/website/Dockerfile`, port 8080; no runtime database or secrets | Manual `Website` workflow on `main`, with private publication-ledger gate |

Keep Coolify auto-deploy disabled. Migrations precede explorer deployment and
remain compatible with old and new app versions. Website checks/builds do not
need Supabase; the website **deployment job** does need publisher credentials.

## Research configuration

The GitHub `production` environment is restricted to `main` and uses these secrets:

| Secret | Purpose |
| --- | --- |
| `SUPABASE_ACCESS_TOKEN` | CLI project access for link/migration operations |
| `SUPABASE_PROJECT_ID` | Hosted project reference |
| `SUPABASE_DB_PASSWORD` | Migration connection password |
| `COOLIFY_DEPLOY_WEBHOOK` | Research application deployment webhook |
| `COOLIFY_API_TOKEN` | Token authorised to deploy that application |
| `PRODUCTION_URL` | Research origin used by the deployment smoke test |

These secrets are separate from `website-production`. A Supabase account access
token is not a project publishable key. Enter secrets directly in the hosting
and GitHub interfaces. Record token expiry outside Git.

The previous deployment setup recorded project-scoped Read access for Project
Settings, Connection Pooling, API Keys and API Key Secrets for CLI linking.
Recheck those requirements when the pinned CLI or platform permissions change;
do not broaden permissions solely to silence optional service-read warnings.
Migrations use the separate database password.

Configure these explorer runtime variables, not Docker build arguments:

| Variable | Requirement |
| --- | --- |
| `DATABASE_URL` | Production reader connection; literal value if password contains `$` |
| `DATABASE_SSL_CA` | Database CA certificate; verified TLS in production |
| `HEALTHCHECK_TOKEN` | Protects `/livez` and `/readyz` through `X-Health-Token` |
| `NODE_ENV` | `production` |
| `DATABASE_POOL_SIZE` | Optional reader pool override; default 5 |
| `DATABASE_STATEMENT_TIMEOUT_MS` | Optional reader timeout override; default 5000 ms |
| `CAPTURE_DATABASE_URL` | Separate login with `capture_writer` for private research |
| `SUPABASE_URL` | Same project's Auth/Storage origin |
| `SUPABASE_PUBLISHABLE_KEY` | Research sign-in and Auth requests |
| `RESEARCH_ORIGIN` | Exact research HTTPS origin, without trailing slash |
| `SOURCE_STORAGE_KEY` | Backend secret or legacy `service_role` key for private uploads |
| `SOURCE_STORAGE_URL` | Optional Storage origin override; defaults to `SUPABASE_URL` |

The image defaults to `HOST=0.0.0.0`, `PORT=4321`. Local reader connections default
to local Supabase; `LOCAL_DATABASE_URL` is a deprecated development alias.
Outside production, database configuration permits only loopback hosts.
See [the environment example](../apps/explorer/.env.example) and
[connection configuration](../apps/explorer/src/lib/database-config.ts).

## Research access and storage

Preconditions: the intended Supabase project and Coolify app exist, migrations
can be applied, and an operator has administrative access outside the application.
Do not create a second project simply because local verification is incomplete.

1. Apply all committed migrations through the normal migration process. Do not
   reset the hosted database or load fixtures. Confirm migration history before
   deploying consumers. The local bundle and hosted-retirement migrations are
   both required; retained historical job tables do not imply an active worker.
2. Create or inspect a dedicated reader login, conventionally
   `explorer_runtime_production`, granted `explorer_reader`. Set
   `default_transaction_read_only=on`, a short statement timeout and a small
   connection limit. Verify SELECT works and writes/DDL fail.
3. Create or inspect a separate login granted `capture_writer`, also with bounded
   connections and timeout. This role maintains private research and importer
   bookkeeping. It cannot administer researchers, update existing canonical
   claims or manage publication. Do not give its credentials to researchers.
4. Configure the runtime variables above. Use direct PostgreSQL if the host has
   outbound IPv6, otherwise Supavisor session mode on port 5432. Use the database
   CA and verify TLS before enabling server SSL enforcement. Keep the Data API
   disabled; application queries use PostgreSQL directly.
5. Enable email OTP, disable public sign-ups and configure SMTP. Include
   `{{ .Token }}` in the Magic Link email template: the app uses email codes,
   not a magic-link callback. Create the invited Auth user and add its ID to
   `capture.researcher` using administrative access.
6. Confirm `research-sources` is private and `SOURCE_STORAGE_KEY` belongs to the
   same project. Modern `sb_secret_…` keys and legacy `service_role` keys are
   supported by the Storage adapter. Keep the key server-side. No search/model
   API keys, hosted worker or Cron schedule are needed.
7. Keep reverse-proxy upload limits above 20 MB plus multipart overhead. The app
   itself bounds requests; a PDF request has a 20,000,000-byte ceiling including
   its form overhead, so the usable file size is slightly smaller. Bundle JSON
   is also limited to 20,000,000 bytes; its upload route allows form overhead.
8. Verify email-code sign-in, draft save/reopen, a small PDF upload/download and a
   small real bundle import on the hosted app. Confirm another researcher cannot
   retrieve the private file. Check that retry preserves drafts and edits before
   attempting larger imports. Use [the research guide](local-research.md).

Private requests verify Auth and the enabled researcher record; sessions last at
most one hour, without stored refresh tokens. Set `capture.researcher.enabled`
to false to revoke application access. Private responses use `private, no-store`,
and forms check origin. Reader routes retain their existing visibility; accepted
research is not equivalent to private draft storage.

## Explorer hosting and verification

Use the private repository's Coolify GitHub App integration, branch `main`,
Dockerfile build pack, root build context and `/Dockerfile`. Use internal port
4321, no host port mapping or persistent volume, and rolling updates with default
container naming. Configure the research domain, HTTPS and runtime variables.
Point health checks to `/readyz` with the `X-Health-Token` header. Without the token,
health routes return 404; external uptime checks should use a normal page.

For a new deployment, verify the migration history and reader privileges, deploy
through the configured target, then check container health, HTTPS, authorised
health responses and representative reader pages. Complete the private-workspace
checks above. Check logs without copying credentials or source contents.

The CI smoke test checks reachability; confirm the deployed revision in Coolify.

## Public website

Use a separate Coolify application, root build context,
`/apps/website/Dockerfile` and internal port 8080. The configured canonical domain
is `https://museumofstolenartefacts.org`. Use `/` for HTTP health checks. Redirect
HTTP and `www` to the canonical HTTPS hostname, preserving paths and queries.
The static container needs no database credentials or persistent volume.

Configure GitHub `website-production`, restricted to `main`:

| Setting | Kind | Purpose |
| --- | --- | --- |
| `COOLIFY_DEPLOY_WEBHOOK` | Secret | This website's production webhook |
| `COOLIFY_API_TOKEN` | Secret | Coolify read and deploy permissions |
| `COLLECTION_DATABASE_URL` | Secret | Dedicated publisher login |
| `COLLECTION_DATABASE_SSL_CA` | Secret | Verified TLS to the ledger database |
| `PRODUCTION_URL` | Environment variable | Canonical website URL; workflow reads `vars.PRODUCTION_URL` |

Enable Coolify API access, disable automatic and preview deployments, and use
commit pinning. The publisher connection belongs only to the deployment job,
not the website build or container. Complete the configuration and release steps
in [publication](collection-publication.md#configure-and-deploy).

## Recovery

### Explorer application or migration failure

Keep migrations forward-compatible. For an app-only regression, redeploy a known
compatible explorer image or make a forward fix. Do not roll back database schema.
If migrations fail, inspect which changes applied, add a forward-fix migration
where needed and rerun the release. Do not hand-edit production schema outside
migration history. If only deployment failed, complete deployment or ship a
compatible follow-up. This explorer rollback procedure does not apply to the website.

### Website failure or withdrawal

Follow [publication recovery](collection-publication.md#recover-an-interrupted-deployment).
Do not clear a pending deployment while an older hosting job can still finish.
To revert website code, commit the revert while retaining the current authorised
snapshot, then use the gate. A ledger withdrawal alone does not remove served pages.

### Upload fails with HTTP 503

Sign-in success does not establish Storage configuration. Inspect the research
app's runtime `SOURCE_STORAGE_KEY` and redeploy after correcting it. The sign-in
publishable key cannot upload to private Storage. Check that the backend key is
from the same project; never paste its value in chat, Git or build arguments.
The adapter sends modern secret keys through `apikey` and supports legacy keys.
Logs report the configuration error or Storage response status without source
contents. Retry the same bundle after fixing configuration to preserve saved work.

### Database credential rotation and outages

Rotate the affected login's password outside Git, update the corresponding
Coolify runtime variable or GitHub publisher secret, and restart/redeploy the
consumer. Reader verification uses authorised `/readyz` plus a normal page;
writer verification uses a private draft; publisher verification uses
`just collection status` without changing an approval. Inspect other consumers
before rotating shared credentials.

For outages, inspect container health, normal-page reachability, protected health
responses, Supabase availability, verified TLS and the last migration/deploy logs.
Check recent runtime-secret changes. Use Supabase for database logs/backups,
Coolify for app logs and GitHub Actions for release logs. Confirm managed daily
backups are active and include the private publication ledger; follow the
provider's restore procedure when needed. Restore is a separate operational action.

### Checkouts renamed from mosa-db

The local project ID is `mosa`; old `mosa-db` volumes are not migrated automatically.
Stop an old running stack with `just supabase stop --project-id mosa-db` before
starting the new one. Export local data you need first. Old volumes are retained;
the hosted project link is unaffected. Reset/fixture commands initialise development
stores only and must not be used to migrate research data.

## Mailbox operations

[ADR 015](adrs/015-use-email-for-public-contact.md) selects email-only contact.
The approved public address is `mosa@radicaldata.org`. Assign a primary and backup
steward with individual access and MFA. Track new, assigned, waiting and closed
conversations; include correction/removal requests and check spam. Verify actual
receipt, a reply and backup access before claiming reliable delivery.

The responsible team must establish mailbox ownership, provider arrangements,
privacy notice, retention covering received/sent/provider copies and any staffed
response target. Five working days was an example, not an adopted commitment.
Treat messages as private correspondence: contact does not authorise research
import, publication, partner sharing or external AI processing. Keep correspondence
outside the collection database unless an agreed contribution follows its review
process. Do not promise anonymity or end-to-end confidentiality for ordinary email.
Use [the roadmap](roadmap.md#human-decisions) to track unresolved ownership and policy.

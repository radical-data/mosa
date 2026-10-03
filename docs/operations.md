# Operations

The website and collection deploy together from Git. Images and source captures
use Git LFS; captures stay outside the website image. No Supabase project,
database credentials or collection API is required.

## Local requirements

Use the versions pinned in `mise.toml`. Install Git LFS and run `git lfs
install` once per machine. `just install` installs JavaScript dependencies and
Git hooks.

## Docker

`just image` builds the root `Dockerfile`. Published image Git LFS files must be hydrated
before the Docker build because `.git` is not in the build context. Astro
generates the whole site in the build stage; the runtime image serves the files
with unprivileged Nginx on port 8080. CI runs the non-build repository checks
first, then uses this production image as its single site build. It restores
Astro's image transformation cache between workflow runs. The workflow does not
export a general Docker layer cache because transferring it takes longer than
rebuilding the inexpensive layers.

HTTPS terminates at the reverse proxy. Keep `absolute_redirect off` in
`nginx.conf` so the root and trailing-slash redirects return relative locations
and preserve the browser's public HTTPS origin. Otherwise Nginx exposes its
internal HTTP scheme and port 8080 in redirect URLs. Disabling only
`port_in_redirect` would still downgrade redirects to HTTP.

All ordinary responses, including HTML, redirects and errors, use `no-cache`:
caches may store them but must revalidate before reuse. Fingerprinted `/_astro/`
assets use a one-year immutable cache policy. There are no language-specific
server rules apart from the root redirect to Spanish.

## Website assets

Site-owned images and local fonts belong under `src/assets`. Astro processes
them during the site build and emits fingerprinted files under `/_astro/`;
Nginx serves these with the one-year immutable cache policy. HTML remains
`no-cache`, so it can refer to the current asset fingerprints after deployment.
Collection imagery follows the collection image pipeline under
`collection/images/` and is not website-owned static media.

After deploying asset or layout changes, check the live pages with PageSpeed
Insights or Lighthouse. Review image delivery, font loading and layout shifts
against the change. Keep this as a post-deployment check rather than adding a
heavy, permanent performance job to CI.

Build it directly with:

```sh
docker build --file Dockerfile --tag mosa-website:local .
```

`just preview` is useful for inspecting generated pages, but it does
not apply the production Nginx root redirect, cache headers or custom 404
response. Use the Docker image and `pnpm test:http http://127.0.0.1:8080` for
those. The container tests and post-deployment verification share the same
smoke checks for relative redirects, query strings, both homepages and collection
listings, cache headers and genuine 404s. Container tests additionally check every
object page and a fingerprinted asset discovered from the rendered homepage.

## Coolify

The website application must use:

- branch `main`;
- commit SHA `HEAD`;
- root `Dockerfile` with the repository root as context;
- exposed port 8080;
- automatic deployments disabled;
- preview deployments disabled;
- Git LFS enabled.

The deployment script checks the application settings, triggers one deployment,
verifies Coolify's job commit and runs the shared public HTTP smoke checks. Coolify's
deployment history remains the record of which commit is currently live.

## GitHub environment

The [Website workflow](../.github/workflows/website.yml) uses
[`website-production`](https://github.com/radical-data/mosa/settings/environments).
Allow only branch `main`, with no tags, required reviewers, wait timer or custom
protection rules. Keep these settings in that environment:

| Name | Type | Value or purpose |
| --- | --- | --- |
| `COOLIFY_API_TOKEN` | Secret | Inspect and deploy the Coolify application |
| `COOLIFY_DEPLOY_WEBHOOK` | Secret | Website application's HTTPS production webhook with its `uuid` |
| `PRODUCTION_URL` | Variable | `https://museumofstolenartefacts.org/` |

No repository-level copies, Supabase secrets or separate `production` environment
are needed. GitHub supplies `GITHUB_SHA`.

## Release the website and collection

Merge into `main`, then run **Actions → Website → Run workflow** on `main` with
`deploy` enabled. This is the single CI and release workflow: all pushes to
`main` and all pull requests run repository and container checks without deploying.
The verification job retains the check name **Verify collection and website**.
The workflow verifies the build and current commit, serialises deployments,
and checks Coolify's reported commit and the public HTTP behaviour.
If verification fails, inspect Actions and Coolify before retrying.

## Recovery

Collection and website releases are the same Git commit. Revert the faulty
commit, run `just verify`, merge the revert and follow the
[release procedure](#release-the-website-and-collection).
Do not restore an old Docker image as a durable content rollback because its
Git state will be less clear.

Keep the Coolify API token and webhook out of Git. Do not put private research
or unauthorised media in `collection/`.

## Source capture tooling and backups

`just source doctor` checks SingleFile, Git LFS, staging and a local browser.
SingleFile is pinned through pnpm and runs on the repository's Node version.
Install Chrome or Chromium separately; set `MOSA_CAPTURE_BROWSER` to its executable
if discovery cannot find it. Browser profiles and capture output stay in ignored
research staging. No browser or live museum connection is needed to build the site.

GitHub checkouts pull only `collection/images/**`. Capture files and local research
are excluded from Docker. Coolify's Git LFS setting remains enabled; its checkout
may still download archive bytes even though Docker excludes them.

A Git-only backup does not contain LFS file contents. In a separate backup clone,
run `git lfs fetch --all`, then back up the complete clone (including its Git and
LFS directories) to independent storage. Restore that backup, hydrate the captures
and run `just source check --content` to verify it. Keep private local research in
its own authorised backup; it is not included in the repository archive.

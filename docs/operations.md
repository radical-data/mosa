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
with unprivileged Nginx on port 8080.

Build it directly with:

```sh
docker build --file Dockerfile --tag mosa-website:local .
```

`just preview` is useful for inspecting generated pages, but it does
not apply the production Nginx root redirect, cache headers or custom 404
response. Use the Docker image and `pnpm test:http http://127.0.0.1:8080` for
those.

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
verifies Coolify's job commit and checks both collection routes. Coolify's
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
`deploy` enabled. Pushes and pull requests run checks without deploying.
The workflow verifies the build and current commit, serialises deployments,
and checks Coolify's reported commit and both language collection pages.
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

# 021: Use a single-package static website

## Status

Accepted.

## Context

The repository now has one application. Its collection, article and general
website content all come from files that are available at build time. The
website has no request-time database access, authentication or personalised
state.

Keeping the Astro project under `apps/website/`, maintaining two package
manifests and running a Node server therefore add structure and runtime
responsibility without supporting a current requirement. The deployed image
still needs to preserve the public URLs, root-language redirect, missing-page
behaviour and deployment revision check.

## Decision

- Make the repository root the Astro project root, using the conventional
  `src/` and `public/` directories beside `collection/`, `docs/` and `scripts/`.
- Use one private pnpm package. Retain `pnpm-workspace.yaml` for shared pnpm
  settings, but do not define a multi-package workspace.
- Generate every language, collection object and machine-readable endpoint at
  build time with Astro's static output.
- Serve the generated `dist/` directory from a small unprivileged web-server
  image built by the root `Dockerfile`.
- Implement redirects, cache headers and the custom 404 response in the static
  web-server configuration.
- Continue to copy Git LFS collection images into the build context. The build
  must not require database credentials or a network collection feed.

## Consequences

Content and route changes require a new image build. The production container
does not contain Node.js, pnpm, application source or runtime dependencies.

Redirect and caching behaviour is split between Astro's generated files and
the web-server configuration, so HTTP tests must continue to exercise the
container rather than relying only on Astro's preview server.

The root layout is simpler for maintainers and standard Astro tooling. A future
second application would require an explicit decision to restore a workspace
layout rather than preserving one speculatively.

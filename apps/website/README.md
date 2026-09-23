# MoSA public website

Static Astro website with Chilean Spanish (`/es/`, `es-CL`) and British English
(`/en/`, `en-GB`). Spanish is the default entry. The website reads the approved
public snapshot; it has no database connection or runtime secrets.

## Develop and verify

Run from the repository root after [setup](../../README.md#start-development):

```sh
mise exec -- just website-dev
mise exec -- just website-check
mise exec -- pnpm --filter @mosa/website test
mise exec -- just website-build
mise exec -- just website-preview
```

Development/preview use port 4322; output is `apps/website/dist/`. The build
checks types, bilingual message structure, links, fragments, metadata and sitemap.

## Code entry points

| Path | Purpose |
| --- | --- |
| `src/content/pages/` | Page and shared copy, with both languages in each JSON file |
| `src/content/events/` | One bilingual JSON file per event |
| `src/content/content.ts` | Page-copy selection |
| `src/templates/` | Shared templates for both languages |
| `src/i18n/routes.ts` | Page IDs, paths, locale tags and fragment identifiers |
| `src/i18n/markup.ts` | Allowed inline markup |
| `src/data/event-schema.ts`, `src/data/load-events.ts`, `src/data/events.ts` | Event validation, loading and presentation |
| `public/collection-snapshot.json` | Generated authorised public collection; do not hand-edit |
| `nginx.conf` | Permanent redirects, response headers and real 404 responses |

Use [website content](../../docs/website-content.md) for editing, event examples,
translation review and accessibility. Use [publication](../../docs/collection-publication.md)
for collection changes, and [operations](../../docs/operations.md#public-website)
for hosting. Collection authorisation and deployment checks run outside the static app.

## Production HTTP checks

```sh
mise exec -- just website-image
docker run --rm -p 8080:8080 mosa-website:local
```

With the container running, use another terminal:

```sh
mise exec -- pnpm --filter @mosa/website test:http http://127.0.0.1:8080
```

The image uses unprivileged nginx on port 8080. The root and legacy paths redirect
permanently to Spanish equivalents, preserving query strings. Unknown paths return
404. Astro development/preview does not reproduce all nginx behaviour.

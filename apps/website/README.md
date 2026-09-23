# MoSA public website

Server-rendered Astro website with Chilean Spanish (`/es/`, `es-CL`) and British
English (`/en/`, `en-GB`). Spanish is the default entry. Collection and object
pages read the explorer's validated public feed at request time. The website
has no database credentials; publishing an object needs no website rebuild.

## Develop and verify

Run from the repository root after [setup](../../README.md#start-development):

```sh
mise exec -- just website-dev
mise exec -- just website-check
mise exec -- pnpm --filter @mosa/website test
mise exec -- just website-build
mise exec -- just collection-website-verify
```

The last command starts a built website against a synthetic feed and changes its
records without rebuilding. The production server listens on port 8080.

## Code entry points

| Path | Purpose |
| --- | --- |
| `src/content/pages/` | Page and shared copy, with both languages in each JSON file |
| `src/content/events/` | One bilingual JSON file per event |
| `src/content/content.ts` | Page-copy selection |
| `src/templates/` | Shared templates for both languages |
| `src/i18n/routes.ts` | Page IDs, paths, locale tags and fragment identifiers |
| `src/data/live-collection.ts` | Strict public feed loading |
| `src/pages/collection-snapshot.json.ts` | Public snapshot response used for verification |
| `src/pages/sitemap-index.xml.ts` | Sitemap from current public records |
| `src/middleware.ts` | Legacy redirects and no-store responses |

Use [website content](../../docs/website-content.md) for copy and accessibility,
[publication](../../docs/collection-publication.md) for researcher publishing and
withdrawal, and [operations](../../docs/operations.md#public-website) for hosting.

## Production HTTP checks

```sh
mise exec -- just website-image
```

Run the image with a synthetic feed for local HTTP tests, as in the `Website`
workflow. The root and legacy paths redirect permanently to Spanish equivalents,
preserving query strings. Unknown paths return 404; an unavailable public feed
returns 503 for collection pages rather than old content.

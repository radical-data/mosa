# MoSA public website

The static Astro website provides complete Chilean Spanish (`es-CL`) and British English (`en-GB`) experiences. Spanish is the default entry. The URL determines the language; there are no language cookies, inferred-language redirects or external translation services.

## Development and verification

From the repository root, with the pinned tools installed:

```sh
mise exec -- just website-dev
mise exec -- just website-check
mise exec -- pnpm --filter @mosa/website test
mise exec -- just website-build
mise exec -- just website-preview
```

Development and preview use port 4322. Production output is `apps/website/dist/`. Open `/es/` or `/en/` locally; the root and legacy HTTP redirects are provided by nginx in production.

`build` checks TypeScript and bilingual message structure, generates the static site, then checks native links, fragments, language metadata and the sitemap. Wording changes do not require hashes, approval records or synchronised translations. The Astro build hook checks message keys even when `astro build` is called directly.

Use the normal development server or preview for both languages. Editorial review is tracked in the [translation checklist](../../docs/localisation-editorial-workflow.md), outside the build.

## Routes

| Page ID | Spanish | English |
| --- | --- | --- |
| `home` | `/es/` | `/en/` |
| `about` | `/es/sobre-mosa/` | `/en/about/` |
| `collection` | `/es/coleccion/` | `/en/collection/` |
| `visit` | `/es/visita/` | `/en/visit/` |
| `events` | `/es/eventos/` | `/en/events/` |
| `resources` | `/es/recursos/` | `/en/resources/` |
| `contact` | `/es/contacto/` | `/en/contact/` |

`src/i18n/routes.ts` owns locale tags, formatting locales, search annotations, paths and shared fragment identifiers. Templates live in `src/templates/`; one generated route selects the same template for both languages. Header and footer navigation follow stable page IDs. `Español` and `English` remain visible outside the collapsed mobile menu and are ordinary links that work without JavaScript.

Collection search progressively enhances the complete static public list. Search matches only published names, institutions and identifiers. Unsupported concept/type controls and homepage filter links are absent. The card remains readable and its source links work without JavaScript.

## Editing copy

Each file in `src/content/pages/` contains both languages under `es` and `en`. For example, `home.json` holds the homepage copy; `interface.json` holds navigation and control labels. `src/content/content.ts` selects the copy for the shared template. No content collection loader or editorial metadata is needed.

Edit an existing value and preview it. English can catch up later: add an item to the [translation checklist](../../docs/localisation-editorial-workflow.md). If a template needs a new message key, add it in both languages to keep the page renderable. Build checks catch missing or empty messages, unsupported inline markup, type errors and broken links. They do not judge translation quality or freshness.

The initial website prose comes from the Spanish design copy, with AI-assisted English drafts. Human review remains pending and happens at release milestones. There are no automatic approval or withdrawal states. If material must be removed, remove it from both versions and any shared sections that repeat it. Optional article routing and a formal editorial system can be added when needed.

The app has no database access and needs no secrets. `public/collection-snapshot.json` contains only the reviewed public export, validated through `@mosa/public-collection` before rendering. The current pilot accepts up to two cards with an attributed name, reported holding institution, catalogue identifier and source links. Missing or malformed exports fail; an explicitly empty export renders an empty collection without falling back to design reference records.

The private maintainer workflow, publication permissions and withdrawal process are documented in the [publication runbook](../../docs/collection-publication.md). The committed export contains the approved Hoa Hakananaiʻa pilot. Collection and institution pages expose the same release ID so deployment can verify the actual served snapshot.

Original names remain unchanged across interface languages. Search keeps original-name spelling; accent folding applies only to the institution search representation. Additional Rapa Nui matching rules need collaborator review.

Dates use explicit `Intl` locales and retain year/month/day precision. Event time zones are stored independently from language; an unknown time is not invented. Dates currently shown are calendar dates, not timed events. Metric conventions apply in both languages.

## Production

Canonical hostname: [museumofstolenartefacts.org](https://museumofstolenartefacts.org/).

```sh
mise exec -- just website-image
docker run --rm -p 8080:8080 mosa-website:local
mise exec -- pnpm --filter @mosa/website test:http http://127.0.0.1:8080
```

The production image uses nginx as an unprivileged user. The build context is the repository root. nginx returns real permanent HTTP `301` redirects from `/` and the six existing page paths (with or without trailing slash) to their Spanish equivalents, preserving query strings. Unknown paths return a genuine `404` and the bilingual error page. No static HTML redirect pages are generated.

The `Website` workflow tests localisation, builds the production image and exercises all legacy redirects, query preservation, published routes and unknown URLs against nginx. Deployment remains the separate manual workflow described in [deployment](../../docs/deployment.md).

## Contact and remaining editorial work

Contact follows [ADR 015](../../docs/adrs/015-use-email-for-public-contact.md): `mosa@radicaldata.org`, a selectable address and native email link. Both versions explain correspondence handling without treating contact as permission to publish. Mailbox ownership, delivery verification and the complete privacy notice remain operational work.

Resource files, external reading links, event registration and the institution map remain in preparation. Human Spanish–English review, collaborator approval of orthography and terminology, assistive-technology testing with readers, and review of grant-specific Dutch commitments remain outstanding. There are no complete Dutch or Rapa Nui interface routes. The internal explorer is unchanged.

## Assets and font coverage

Existing imagery, logos and General Sans fonts remain local. Decorative images have empty alternative text. Both languages retain the supplied funding logo and acknowledgement.

General Sans lacks U+014A/U+014B (`Ŋ`, `ŋ`), including the `ŋ` already present in “Haka Nonoŋa”. `public/fonts/noto-sans-eng.woff2` is a small variable-font subset of [Noto Sans from Google Fonts](https://github.com/google/fonts/tree/main/ofl/notosans), served locally only for these code points under the [SIL Open Font License](public/fonts/noto-sans-OFL.txt). The four General Sans weights plus this fallback cover all characters in the current copy; that does not establish coverage for future collaborator-approved orthographies or the availability of a suitable speech voice.

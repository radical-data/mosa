# MoSA public website

The public Museum of Stolen Artefacts website, built with Astro. The Spanish (`es-CL`) site follows the supplied MoSA page layouts and brand guidelines, with responsive navigation, local General Sans fonts, optimised reference artwork and a shared footer.

## Development

From the repository root, after `mise install` and `mise exec -- just install`:

```sh
just website-dev
just website-check
just website-build
just website-preview
```

Use `mise exec -- just ...` if mise is not activated. The development and preview port is 4322, alongside the explorer on 4321. Build output is `apps/website/dist/`.

The app uses static output and requires no database or secrets. It owns its routes and components. Do not import explorer internals or give this app the explorer's database role. A publication-aware data interface must precede public collection features.

## Production

Public URL: [museumofstolenartefacts.org](https://museumofstolenartefacts.org/).

`astro.config.mjs` defines the production URL used for canonical links, Open Graph page URLs and the generated sitemap. `robots.txt` advertises the sitemap. Update this configuration if the public hostname changes.

```sh
just website-image
docker run --rm -p 8080:8080 mosa-website:local
```

The image serves static output through nginx as an unprivileged user. The build context must be the repository root. The website workflow verifies and builds this image independently; its manual deployment requires the hosting configuration described in [deployment](../../docs/deployment.md).


## Site structure

| Route | Content |
| --- | --- |
| `/` | Introduction, collection concepts, resources, events and project overview |
| `/about/` | Manifesto, reconnection and team |
| `/collection/` | Six reference records, image/list views, search and combined concept/type filters |
| `/visit/` | Distribution overview and institution directory |
| `/events/` | Accessible event accordion and retrospective overview |
| `/resources/` | Resource summaries, relationship diagram and reading references |
| `/contact/` | Direct project email, invitation to connect and correspondence guidance |

Individual collection, event and resource detail pages, ontology essays and pop-ups are intentionally outside this implementation. The Visit overview follows the content architecture; no Visit layout was supplied. The directory is a reference overview, not an interactive geographical map.

`src/data/site.ts` holds navigation and curated content transcribed from the supplied PDFs. These records are design examples, not a published catalogue or a query against the research database. The unknown mahute classification remains explicitly undocumented. The original placeholder cards and filler copy were omitted.

The collection filters combine search, concept and record type. Search ignores accents and case. Home concept links preselect the matching collection filter. With JavaScript disabled, all records and navigation remain accessible; event disclosures use native HTML.

## Contact

Following [ADR 015](../../docs/adrs/015-use-email-for-public-contact.md), contact uses
`mosa@radicaldata.org`. The address is defined in `src/data/site.ts` and rendered as
visible, selectable text in a native `mailto:` link. No obfuscation, JavaScript,
clipboard permission, tracking or form service is required to use it. CSS permits
visual wrapping without adding characters to the copied address. Existing contact
links continue to open the contact page, where visitors can read the invitation
and correspondence guidance before writing.

The page identifies the MoSA team as the recipient and distinguishes correspondence
from permission to publish or add material to the collection. It does not promise
a response deadline, anonymity or a specific retention period.

Mailbox provisioning, delivery and reply verification, individual staff access,
inbox ownership and the complete privacy notice remain operational launch work.
Confirm the responsible organisation, processing arrangements and retention policy
before publishing those details. Website checks do not establish mailbox delivery.

## Pending content and integrations

- Contact operations and the complete privacy notice: see the contact section above. A website form is deferred under ADR 015.
- Resource files, external reading links, event registration and the institution map: summaries remain visible, with pending availability clearly labelled and no dead detail-page links.
- Translations and social destinations: Spanish is the only implemented language; no unconfigured language switch or social links are presented.
- Live collection publication requires the separate publication-aware data interface described above.

## Design assets

Images in `public/images/` were extracted from the user-supplied PDF layouts, resized and saved as WebP. The two logo PNGs are the supplied originals. Decorative artefact cut-outs have empty alternative text; collection and editorial images have descriptive alternatives.

General Sans weights 300, 400, 500 and 600 were obtained from Fontshare using `https://api.fontshare.com/v2/css?f[]=general-sans@300,400,500,600&display=swap` and are served locally from `public/fonts/`. No external image, font, analytics or database request is needed to render the site. Brand colours are white, black and coral `#FF6D6D`.

# MoSA localisation strategy

Status: bilingual foundation implemented; development workflow simplified on 2026-09-15 at the project owner's request. Copy is paired by page, English may catch up during development, and human review happens at release milestones using a [manual checklist](localisation-editorial-workflow.md). Builds enforce technical checks, without content hashes or approval gates. Research checked on 2026-09-13.

The formal revision and translation-authorisation model remains relevant to future research publication. It is deferred for the current website's editorial copy. See the [implementation notes](../apps/website/README.md).

## Recommendation

Launch complete public website experiences in Chilean Spanish and British English. Use Spanish as the default. Allow Rapa Nui contributions in their original language immediately, with publication and translation decisions made with the relevant collaborators. Defer a complete Dutch website, subject to checking the project's grant commitments. A short Dutch project summary is a proportionate option for sharing the work with the funder and the Dutch design sector.

Keep the existing static Astro architecture. Give each language version a permanent URL, share page templates, and manage translations as reviewed content. Language choice changes presentation; it does not change entity identity, evidence or cultural authority.

These are recommendations for MoSA, not requirements imposed by a web standard. External research supports the technical and editorial principles below. It does not establish which languages MoSA's audiences prefer.

## Research findings and limits

### Language choice and discoverability

Google recommends separate URLs for language versions and links that allow people to choose another version. It advises against automatically redirecting visitors based on an inferred language. This supports explicit language routes and a visible language switcher. It does not establish whether the default language needs a URL prefix. [Google: multilingual sites](https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites).

W3C guidance favours language names in their own language and discourages flags as language identifiers. WCAG requires the language of passages to be identifiable programmatically, with exceptions including proper names and established loanwords. [W3C: language selection](https://www.w3.org/International/questions/qa-navigation-select), [WCAG: language of parts](https://www.w3.org/WAI/WCAG22/Understanding/language-of-parts.html).

### Indigenous language authority

The CARE Principles centre collective benefit, authority to control, responsibility and ethics. They support community authority over representation and use of knowledge. Local Contexts provides a practical example: communities customise multilingual labels and review them within their community accounts. These frameworks inform the design; neither substitutes for Rapa Nui collaborators' own decisions or authorises MoSA to assign cultural protocols. [CARE Principles, original paper](https://datascience.codata.org/en/articles/dsj-2020-043), [Local Contexts: working with labels](https://localcontexts.org/support/working-with-labels/).

### AI translation: evaluate specific tools and uses

CENIA reported community validation of a Spanish–Rapa Nui translator in June 2025, developed with UC and the Rapa Nui Language Academy. Its report also describes work towards audio transcription. This is a relevant initiative to evaluate with collaborators; the announcement is not independent proof of translation accuracy for MoSA's collection material. [CENIA: community validation](https://cenia.cl/2025/06/13/comunidad-rapa-nui-realiza-exitosas-pruebas-de-su-traductor-basado-en-ia/).

IndigiEval, published in July 2026, found fabricated vocabulary, grammar and cultural information in the models it evaluated across five Indigenous languages. Rapa Nui was not one of those languages. The findings justify evaluating each proposed model and task; they do not provide a Rapa Nui error rate or establish the performance of every current model. [IndigiEval](https://aclanthology.org/2026.americasnlp-6.8/).

### Technical maturity

Astro provides locale routing and URL helpers. A separate application framework is unnecessary for this site. Paraglide is a credible compiler-based message option with an Astro integration, but its documented server setup differs from static generation. Its existence does not establish a need to add it here. [Astro internationalisation](https://docs.astro.build/en/guides/internationalization/), [Paraglide Astro integration](https://paraglidejs.com/astro).

Unicode made MessageFormat 2 stable in CLDR 47. That is a useful direction for dynamic messages, but standard stability does not imply universal browser or translation-tool support. Avoid a dependency on native browser MF2 support. [Unicode CLDR 47](https://cldr.unicode.org/downloads/cldr-47).

### Stimuleringsfonds funding

The project owner confirms that Stimuleringsfonds funds the work. The existing website footer identifies Open Call Fresh Perspectives 2024 and already contains a funding acknowledgement and logo.

The fund's public accountability guidance requires acknowledgement in project outputs and communications, including websites. If an output displays logos, the fund's logo is to be included. The guidance reviewed does not specify that the project website must be in Dutch. [Stimuleringsfonds: accountability and acknowledgement](https://www.stimuleringsfonds.nl/verantwoording).

The 2024 Fresh Perspectives call asks for audience and communication planning and an appropriate final presentation or other knowledge sharing. The phase 2 guidance includes a communication or knowledge-sharing plan and attention to conditions set by the advisory committee. I found no blanket Dutch website requirement in these two documents. The project's award letter and approved plans may contain specific commitments; they were not available in this research. [Fresh Perspectives 2024 call](https://cms.stimuleringsfonds.nl/storage/media/SCI_Open-Call-Fresh-perspectives-2024.pdf), [2024 phase 2 guidance](https://cms.stimuleringsfonds.nl/storage/media/Toelichting-2e-fase-Fresh-Perspectives_DEF.pdf).

Funding therefore creates a concrete acknowledgement requirement and a reason to consider Dutch knowledge sharing. It does not, on the evidence reviewed, establish a need for full Dutch catalogue and interface parity. Preserve the fund's name and approved logo in both core languages. Translate the surrounding acknowledgement. A Dutch summary could explain the project, collaborators, methods, results and funding, with clearly labelled links into the English site. Treat it as targeted editorial content, not an advertised complete Dutch locale.

## Language policy

| Language | Initial role | Content and formatting tag | Public route |
| --- | --- | --- | --- |
| Chilean Spanish | Complete experience; default entry | `es-CL` | `/es/` |
| British English | Complete international experience | `en-GB` | `/en/` |
| Rapa Nui | Original passages, names and contributions | `rap` | No full locale route initially |
| Dutch | Deferred; targeted material when justified | Decide regional convention when introduced | No route initially |

Store route prefixes, content language tags, formatting locales and search annotations separately. An English editorial convention does not mean the audience is restricted to the United Kingdom.

The default website language is not the universal source language. Keep the original language clear in editorial context and language tags; the initial website prose originates in Spanish. A contribution originally written in Rapa Nui remains the original even when Spanish and English translations exist.

Before deciding Dutch scope, check the award letter and approved communication plan for commitments. For additional Dutch content, identify the audience task, pages, reviewer and maintenance capacity. A Dutch event page or partner brief can precede a complete Dutch website. Do not use national English-proficiency statistics as a substitute for testing whether MoSA's intended visitors can use the site.

Before adding a complete Rapa Nui interface, agree its scope, terminology and review arrangements with collaborators. Partial original-language publication can continue without waiting for every navigation label to be translated.

## URLs and language selection

Use a stable page identifier and an explicit map of translated paths:

| Page identifier | Spanish | English |
| --- | --- | --- |
| `home` | `/es/` | `/en/` |
| `about` | `/es/sobre-mosa/` | `/en/about/` |
| `collection` | `/es/coleccion/` | `/en/collection/` |
| `visit` | `/es/visita/` | `/en/visit/` |
| `events` | `/es/eventos/` | `/en/events/` |
| `resources` | `/es/recursos/` | `/en/resources/` |
| `contact` | `/es/contacto/` | `/en/contact/` |

Both prefixes are a deliberate project choice: they make routes explicit and leave room for later languages. Keeping Spanish at the root is also standards-compatible, but mixes prefixed and unprefixed routes.

Resolve navigation, switcher links and search metadata from the same map. Do not translate URLs by replacing words in a pathname. Future collection detail routes use a stable record identifier; translated slugs are presentation and can change with redirects.

Display `Español` and `English` as ordinary links near the top of every page, including mobile layouts. Mark the current language and give each link its language attribute. Switching language opens the equivalent page. Preserve recognised search parameters and stable filter identifiers. Preserve a fragment only if the target page contains the corresponding anchor.

The URL determines the language. Do not override it using IP location, browser settings or a stored preference. The initial implementation needs no language cookie. Navigation and language switching work without JavaScript.

Redirect `/` to `/es/`. Redirect the seven existing unprefixed routes to their explicit Spanish equivalents. Implement permanent HTTP redirects in the hosting configuration; static HTML redirects alone do not provide that response. Preserve query strings and test for redirect loops. Unknown URLs return a genuine 404.

If an optional article has no translation, display a localised availability notice and an explicit link to the original. Do not create an English URL that silently serves the Spanish article. Do not send someone to the homepage while presenting the action as a translation of their current page.

## Three kinds of content

| Kind | Proposed storage | Rule |
| --- | --- | --- |
| Interface messages | Typed, app-local catalogues | Translate complete messages, including parameters and plural forms |
| Editorial pages | Schema-validated content entries grouped by stable page identifier and locale | Share layouts; review each language version |
| Research claims and evidence | Existing attributed research model | Preserve original wording, language, attribution and permissions |

Start with `src/i18n/` for the locale registry, route map, message catalogues and formatting helpers. Move longer page copy into `src/content/` entries. Use existing Astro components as shared templates. Keep images and stable identifiers outside translated prose. Validate message keys and parameter contracts during the build.

Use standard `Intl` formatters with explicit locales for numbers, dates and plural selection. Store event time zones separately from language: changing language must not change the event instant. Preserve historical date precision; a year-only date must not acquire an invented day or month. Keep metric units in both languages.

For the small initial interface, typed messages and standard formatters are sufficient. If dynamic messages become more complex, use a maintained formatter or compiler behind the same message interface. Do not write a custom message grammar. Evaluate MF2 support and translator tooling at that point; Paraglide is an alternative to assess, not a required dependency.

Collection filters use stable IDs, not translated labels. Search indexes approved names and variants across languages while displaying results in the selected interface language. Keep original spelling intact. Apply accent-tolerant matching to search representations only, and review Rapa Nui matching rules with collaborators before generalising the current Spanish normalisation behaviour.

The research database already preserves language in literal claims. Do not add `name_en`, `name_es` or unsourced entity summaries. Any future translation of a claim or evidence excerpt remains linked to the original revision and is identified as a translation, not new testimony. Locale-aware display projections may select an eligible name for presentation without declaring it culturally preferred. This follows [ADR 010](adrs/010-derive-entity-display-labels.md).

Keep the public website's publication-aware data boundary. A translation is publishable only when both the source material and the translation are authorised for publication. Withdrawing a source also withdraws its dependent public translations.

## Editorial workflow

During rapid development, keep Spanish and English copy together in each page or shared-content JSON file. Edit either language directly. Track pending English updates and review work in the [translation checklist](localisation-editorial-workflow.md). Existing wording can change independently; newly introduced interface keys need values in both languages so templates remain renderable.

Review changed passages in both languages at release milestones. Give reviewers whole passages, context and a preview. Pay particular attention to names, uncertainty, attribution and claims about removal, custody, restitution and ancestors. If material must be removed, remove it from both language versions and shared sections that repeat it.

Builds check missing messages, invalid parameter types, content structure, routes and links. They do not enforce editorial approval, translation freshness or named reviewers. There are no website content hashes, source revision references, review state machines, temporary approval manifests or special review builds.

AI-assisted Spanish–English drafts may support material authorised for that use. Initial English copy is a draft awaiting human review. Keep model-generated wording out of the research evidence layer. Rapa Nui collaborators determine terminology, orthography and translation authority; existing design copy does not establish approval. A formal glossary, translation management service or revision-specific publication workflow can be introduced when actual contributors and publication needs justify it.

For Rapa Nui, decide with collaborators whether to trial a community-developed tool. Evaluate representative passages with fluent reviewers, including names, cultural concepts, negation, uncertainty and attribution. The design does not presume approval to send unpublished material to an external service.

## Accessibility and search metadata

Set the page language to `es-CL` or `en-GB`. Mark genuinely different-language passages with their own `lang`, including `rap` for Rapa Nui. Verify font coverage for the approved orthography and test mixed-language text with assistive technology. A language tag does not guarantee that a device has an appropriate speech voice.

Translate page titles, descriptions, navigation, skip links, meaningful alternative text, form labels, validation messages and availability notices. Keep decorative images' alternative text empty. Allow text to wrap and test narrow screens, enlarged text and keyboard navigation in both languages.

Each published translated page has its own canonical URL. Generate reciprocal `hreflang="es"` and `hreflang="en"` annotations for existing equivalents. Use the Spanish equivalent as `x-default`; if an optional item exists only in another language, its actual original is the fallback. Keep drafts, withdrawn pages and redirects out of the sitemap. [Google: localised versions](https://developers.google.com/search/docs/specialty/international/localized-versions).

Google currently documents ISO 639-1 language codes for these annotations. Rapa Nui's `rap` tag remains valid for content language, but do not assume Google supports it as a search annotation. If full Rapa Nui pages are introduced, provide ordinary links, correct HTML language and sitemap entries, then recheck search-engine support. Do not mislabel them as Spanish to fit the search system.

## Implementation sequence and acceptance

1. Introduce the locale registry, route map and shared message contracts. Extract Spanish content without changing its meaning.
2. Add the English versions, language switcher and localised metadata. Obtain editorial review for both languages.
3. Add revision checks, redirect configuration and generated-page validation. Test representative user journeys with Rapa Nui collaborators and international readers.

The initial delivery is ready when:

- All seven core pages exist in both languages, with pending editorial work recorded for release review.
- Every language link opens the equivalent page and works without JavaScript.
- Collection filters retain their meaning across a language switch.
- Old public routes return permanent redirects to the corresponding Spanish pages.
- Missing optional translations are labelled; their nonexistent URLs are not advertised.
- Canonicals and reciprocal language annotations resolve to published pages.
- Editing existing source wording does not block development builds; pending translations are tracked in the checklist.
- Source withdrawals are applied to both public language versions and shared passages during release preparation.
- Names, quotations, source languages and historical date precision survive localisation.
- Both core languages retain the funding acknowledgement and approved fund logo.
- Keyboard access, text enlargement, font coverage and mobile layouts work in both languages.

The current research explorer remains an internal tool. Apply the same source-language and attribution principles there. Full explorer interface translation should follow the needs of its actual users rather than delaying the public bilingual website.

## Decisions requiring project evidence

The publication hostname is `https://museumofstolenartefacts.org/`; use it for absolute canonical and language links. Human editorial review is organised at release milestones and does not gate development builds. Rapa Nui collaborators determine orthographic preferences, translation authority and the scope of any tool evaluation. The award letter and approved communication plan determine project-specific funding commitments. Audience interviews and partner requirements inform Dutch content beyond those commitments.

This research does not include interviews, a usability study, a translation-quality benchmark or verification of a production API for the Rapa Nui translator. It provides a documented architecture and evidence for the proposed choices; implementation and language review remain separate work.

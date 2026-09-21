# Content editing for MoSA

Research checked: 15 September 2026. Status: recommendation for discussion, not an accepted architecture decision or implementation.

## Recommendation

Keep Astro for the public website and Supabase/PostgreSQL for the research collection. Introduce a structured editorial CMS for webpages, events, resources and shared site content. Give collection contributors an item-centred research editor that uses controlled write operations over the existing model.

**My default choice is Sanity for editorial content, with a focused collection editor alongside it.** This assumes a small editorial team, acceptance of hosted editorial storage, and a preference for reducing maintenance. If self-hosting and open-source control are priorities, prefer Payload for the editorial CMS. Directus is worth a pilot where configuring relational forms is more important than defining them in code.

The architectural recommendation is stronger than the product recommendation. The products need a short practical trial with MoSA's editors. No documentation comparison establishes which interface they will find easiest.

## What the project actually needs

The inspected repository has:

- An independently deployed static Astro website and a server-rendered research explorer.
- Seven core public pages, with design reference records used for the collection display.
- A research model containing entities, attributed claims, evidence, provenance events and restitution cases.
- A transactional dossier importer designated as the current write path for real data. The explorer explicitly provides no authoring interface.
- An explicit distinction between research access and permission to publish. The website must not reuse the explorer's broad reader role.
- A localisation strategy covering Chilean Spanish, British English and original-language contributions. Localisation implementation was actively changing in the working tree during this research: JSON entries, revision checks, content collections and shared templates were appearing. These are useful foundations, but are not themselves a contributor-facing editor.

Relevant project evidence: [website overview](../apps/website/README.md), [explorer overview](../apps/explorer/README.md), [dossier ingestion decision](adrs/012-object-dossier-ingestion.md), [foregrounding decision](adrs/013-foreground-claims-and-defer-first-class-concepts.md), and [localisation strategy](localisation-strategy.md). Existing website content and implementation work were left untouched.

### Existing work on `data-entry`

Follow-up inspection confirmed that `data-entry` at `2c6b6f6` is already an ancestor of `website` at `41f9dc1`: the website branch has ten subsequent commits and the data-entry branch has no unique commits. Its work is already available; no merge is needed to obtain it.

Reuse its [packet contract](../schemas/object-dossier-packet.schema.json), [validation](../packages/object-dossier/validate.ts), [identity resolution](../packages/object-dossier/resolve.ts), [import planning and transactional writes](../packages/object-dossier/import.ts), and ingestion bookkeeping. The CLI and source capture interface share these modules. Keep validation and authorisation on the server and map errors to understandable form fields. Import logs provide useful execution history, but do not constitute contributor review or publication approval.

The important limitation is editing existing material: the importer skips claims and evidence whose local keys already have bindings. Changing their wording in a packet and importing again does not update or supersede the existing records. A browser form must not present that operation as a successful correction. Add explicit correction and supersession operations, with conflict detection, before enabling edits to imported accounts.

Its current claim types cover names, manufacture/discovery/current locations and holders; it derives source-to-item links. Richer descriptions, provenance events, restitution records, non-URL sources, media preservation, saved drafts and editorial permissions require further work. The bootstrap packets and existing tests are useful development examples, with publication review remaining separate.

This sharpens the recommendation: build the first collection form around the existing import services, then extend their domain operations. The collection editor has a substantial backend foundation already. Webpage editing still calls for the separate editorial CMS assessment below.

### Two editing experiences, three responsibilities

| Responsibility | Examples | Authoritative home | Editing experience |
| --- | --- | --- | --- |
| Research knowledge | An attributed name, evidence excerpt, custody event, restitution assertion | Existing research database | Item dossier with sources, attribution and history |
| Editorial content | About page, event, resource, introduction, image caption | Editorial CMS | Labelled fields, rich text, translations and actual-page preview |
| Publication and presentation | Eligible material, foregrounded claims, featured item order, public image selection | Explicit decisions with a defined owner | Review controls and public preview |

The collection landing page belongs to the editorial CMS. The items it features belong to the research system. A selection block should hold stable item identifiers and ordering; it should obtain eligible display information from the public collection interface. Any copied display information is a replaceable cache, not another editable catalogue.

Interpretive writing about an item is legitimate editorial content. Its author, sources and relationship to the item should be explicit. It must not silently replace an attributed research claim.

## What current practice supports

### Structured content with constrained composition

Modern editing can combine forms and visual preview. Storyblok's documented model separates content types from reusable blocks; Sanity provides an Astro visual-editing integration. This supports giving editors understandable content units while retaining the site's design in components. It does not establish that every page should become an unrestricted layout builder. [Storyblok blocks](https://www.storyblok.com/docs/concepts/blocks), [Sanity Astro integration](https://www.sanity.io/plugins/sanity-astro).

For MoSA, start with named templates for the seven core pages. Make their content editable. Introduce a small selection of reusable sections only where editors need composition: text, image with caption, quotation with attribution, featured collection items, events and resources. Keep typography, colours, spacing and responsive behaviour in the design system.

Replace numbered fields such as `passage03` with meaningful names such as “Introduction”, “Reconnection heading” and “Team description”. Preserve stable section identifiers across translations. Use a constrained rich-text editor for prose and structured fields for dates, links, references and images. Editors should not need to write HTML or executable MDX.

Events and resources should be independent entries referenced by pages. The home page should select an event, rather than contain a second editable copy of its details. Treat navigation, footer and contact details as shared settings. Keep small interface messages in typed language catalogues unless translators need them in the CMS too.

### Static publication and live editing can coexist

Astro's current content collections support both build-time loading and live loading. Sources can include local files, CMSs and APIs. Content collections provide the website's validated reading interface; they do not supply editorial accounts, review or asset management. [Astro content collections](https://docs.astro.build/en/guides/content-collections/).

Keep production static initially. Run an authenticated preview deployment using the same Astro templates, with server rendering for draft requests. Sanity's current Astro guide requires request-time rendering for its cookie-based draft mode; the existing nginx-only deployment cannot provide that mode by itself. Separating preview from public delivery is our architectural recommendation. [Sanity visual editing with Astro](https://www.sanity.io/docs/astro/astro-visual-editing).

Publishing should trigger a validated build and deployment. Show editors distinct states for “approved”, “deploying”, “live” and “deployment failed”. A CMS save or publish event is not proof that visitors can see the change. Record which content revisions and public collection snapshot each deployment contains.

### Collection authoring needs more than ordinary record editing

Collections Trust describes cataloguing as continuing work that incorporates multiple sources and perspectives. Mukurtu provides a relevant example of independently described community records and culturally governed access. These sources support preserving different accounts and their authority; they do not prescribe MoSA's database or establish MoSA's compliance with a museum standard. [Collections Trust: cataloguing](https://collectionstrust.org.uk/spectrum/procedures/cataloguing-spectrum-5-0/), [Mukurtu: community records](https://docs.mukurtu.org/digital-heritage-items/UnderstandCommunityRecords/).

The collection editor should let someone open an item, add a source, record what a particular speaker says, attach evidence, propose a correction and preview the public account. Distinguish correcting a transcription from adding a conflicting account. Preserve identifiers, attribution and history. Foregrounding and publication approval must remain separate decisions.

Build this narrowly around real tasks, reusing the existing domain logic. The present importer supports only a limited initial dossier contract: it is not a complete correction, provenance or restitution authoring service. Initial registration can use that contract; richer changes need explicit transactional operations and an intentional extension of the current write-path decision. Do not merely expose all tables with generic create/edit/delete buttons.

## Product comparison

The assessments below are project-specific judgements based on current primary documentation, not measured rankings.

| Option | Strength for MoSA | Main trade-off | Recommendation |
| --- | --- | --- | --- |
| **Sanity** | Structured editorial documents, Astro visual editing, flexible linked translations; hosted content backend | Vendor dependency; granular permissions can require Enterprise | Default editorial pilot if managed storage is acceptable |
| **Payload** | Code-defined content, drafts, localisation and programmable permissions; self-hostable open-source core | Adds a Next.js CMS service and its operational work | Preferred alternative for open-source self-hosting |
| **Directus** | Configurable relational editing, content versions and visual editing; can attach to existing SQL data | Existing-database support does not establish compatibility with MoSA's research workflows; current licensing has conditions | Pilot for configured editorial forms; avoid immediate write access to research tables |
| **Storyblok** | Strong page composition and visual editor; official Astro SDK | Higher entry cost for a team; custom and language-specific workflows are premium features | Strong alternative if page composition wins an editor trial |
| **Keystatic** | Browser forms over repository files; close to the current Astro content approach | Git-based storage and a deployed editing service; project-specific review and translation rules still need implementation | Proportionate option for infrequent editing by a small, comfortable team |

### Sanity: best default under the stated assumptions

Sanity supports document-level translations connected by references, as well as field-level localisation. Linked documents fit MoSA's need to track original language and review a particular translation. Shared facts such as an event's time should stay outside duplicated translated prose. Revision-linked approval and stale-translation behaviour remain MoSA features to implement and verify. [Sanity localisation](https://www.sanity.io/docs/studio/localization).

The built-in Contributor role can edit drafts but cannot publish; Editor can publish. That is enough to trial a straightforward author–publisher division. Restricting contributors to particular communities, document types or languages may require custom roles, which are Enterprise-only. Hiding a field or button is not an access-control substitute. Keep research-sensitive material in the research system. [Sanity roles and permissions](https://www.sanity.io/docs/content-lake/roles-concepts).

At the research date, Growth is US$15 per paid seat per month: five paid seats would be US$75/month before extras and taxes. The free plan's Administrator/Viewer roles are a poor basis for separating authors from publishers. Sanity advertises a non-profit programme; eligibility for MoSA was not established. [Sanity pricing](https://www.sanity.io/pricing).

### Payload: strongest alternative for open-source self-hosting

Payload's core repository is MIT-licensed, and it supports drafts, localisation and access-control functions. Its documented installation requires Next.js. It can therefore run as a separate CMS service while Astro remains the public frontend. This is additional software to deploy, patch, back up and restore. [Payload repository](https://github.com/payloadcms/payload), [installation](https://payloadcms.com/docs/getting-started/installation), [drafts](https://payloadcms.com/docs/versions/drafts), [access control](https://payloadcms.com/docs/access-control/overview).

Use separate CMS-owned storage. Payload's Postgres adapter manages its own schema from the content configuration; supporting Postgres is not equivalent to being an editor for MoSA's existing research model. Its live-preview tools support integration with other frontends, but the Astro integration work must be tested. [Payload Postgres](https://payloadcms.com/docs/database/postgres), [server-side live preview](https://payloadcms.com/docs/live-preview/server).

### Directus: useful, but not a shortcut around domain design

Directus documents adding an interface to an existing database, and its versioning supports changes that remain separate from published content. Those are useful capabilities. They do not prove that schema introspection will produce a good dossier editor, preserve importer bookkeeping, or propagate Supabase user identity and research permissions correctly. A prototype would need to establish those properties explicitly. [Existing database support](https://directus.com/features/existing-database), [content versioning](https://directus.com/docs/guides/content/content-versioning).

There is a material 2026 licensing qualification: Directus says its Open Innovation Grant applies to version 12 onward, with eligibility based on the organisations using the Studio. Its FAQ specifies revenue and staff thresholds, required telemetry and no offline operation under the grant. Do not rely on older advice that describes Directus simply as free open-source software. Confirm MoSA's eligibility and the exact deployed version before selecting it. [Directus grant FAQ](https://directus.com/oig/faq).

### Storyblok and Keystatic

Storyblok's official Astro SDK and block editor make it a credible page-editing choice. Its published monthly Growth price is US$99 including five seats and two locales; its pricing page places custom roles and language-specific workflows in premium plans. Judge the complete workflow cost. [Astro SDK](https://www.storyblok.com/docs/libraries/js/astro-sdk), [visual editor](https://www.storyblok.com/docs/manuals/visual-editor), [pricing](https://www.storyblok.com/pricing).

Keystatic can manage local or GitHub-backed content through forms. Its Astro deployment guide requires a server adapter for the editing service. It is not a zero-infrastructure admin page that can simply be added to the current static image. Its documentation is sufficient to shortlist it, but compatibility with this repository's Astro 7 version and the required preview/review workflow was not tested. [Keystatic Astro guide](https://keystatic.com/docs/installation-astro), [GitHub mode](https://keystatic.com/docs/github-mode).

Mukurtu also deserves attention if community-governed access becomes the main product requirement. Its protocol and community-record model is directly relevant. Adopting it would be a broader platform evaluation, rather than a small improvement to webpage editing. [Mukurtu cultural protocols](https://docs.mukurtu.org/communities-cultural-protocols-categories/UnderstandingCommunitiesAndCulturalProtocols/).

## Publication and translation requirements

These requirements follow MoSA's existing research and localisation decisions; they are not features guaranteed by a CMS purchase.

1. **Separate visibility from research status.** An active claim is not automatically approved for public display. Approve eligible claims, evidence excerpts and media explicitly, with an authorised decision-maker.
2. **Approve revisions.** Record the content revision, reviewer and review time. A later edit must not inherit approval merely because a status field still says “approved”. Enforce the rule in the trusted publication process.
3. **Link translations to their source revision.** Show the original alongside the translation. Mark translations stale when that source changes. Preserve Rapa Nui wording and contributor authority. The proposed paired Spanish/English core-page publication policy can be enforced at website release time; it need not depend on buying a CMS release feature.
4. **Protect preview.** Require authenticated access or appropriately scoped, expiring preview authorisation. A query parameter and `noindex` alone do not protect drafts. Keep privileged credentials in the preview/build service.
5. **Treat media as content with permissions.** Track credit, provenance, permitted use and withdrawal. Store contextual alternative text with its placement and language. The CMS image library is not the research source archive.
6. **Make withdrawal effective.** Remove affected pages, excerpts, dependent translations, search entries and public media derivatives through a priority deployment and cache-purge path. Prevent rollback from restoring withdrawn material. Static generation suits the initial site only if its withdrawal latency meets the agreed needs; otherwise add a runtime publication check for affected surfaces. Removal cannot retrieve copies already downloaded by others.
7. **Test portability.** Export editorial documents, references, assets and necessary approval records, then test restoration. JSON export does not eliminate the cost of migrating vendor-specific rich text, schemas and workflows.

CMS content and approved research output meet only in the publication process. Use a restricted public collection API or versioned export with stable identifiers. Start with a batch export if that is sufficient; add live queries when catalogue size, update frequency or withdrawal requirements justify them. Avoid bidirectional catalogue synchronisation.

## A small, decisive pilot

Trial the default candidate with representative content before migrating every page. Include a Spanish-language editor or contributor and the person responsible for publication.

| Task | What success looks like |
| --- | --- |
| Edit About in Spanish and English | Clear section names; accurate page preview; no code or HTML editing |
| Create an event | One event appears consistently on its page, listing and home-page selection |
| Change the original wording | The translation visibly requires renewed review; publication rules use the new revision |
| Feature a collection item | Search and select by stable identity; approved information appears without copying catalogue facts |
| Add a source-backed account | The dossier preserves attribution, evidence and a conflicting existing account |
| Exercise permissions | An author can save a draft but cannot publish or access excluded material, including through direct API requests |
| Publish and withdraw | Editors can distinguish CMS state from actual deployment; dependent public outputs are removed |
| Export and restore | Text, references, assets and required review history survive restoration |

Record task completion, misunderstandings, errors and maintenance work. Choose a second product trial only if the first exposes a real obstacle: Payload for hosting/control constraints, or Storyblok for page-composition usability. Directus is a targeted alternative if relational configuration is decisive.

Then implement in this order:

1. Agree meaningful page structures and repeated content types; preserve the localisation work already under way.
2. Add the editorial CMS, authenticated preview and publication feedback. Migrate existing copy and media without changing their meaning or inventing approval.
3. Define the public collection output and its withdrawal behaviour.
4. Build the first collection authoring task over the existing write contract, then extend it deliberately for richer research actions.

One staff landing page can link “Website content” and “Collection research”. Separate responsibilities do not require contributors to understand the underlying services. A shared login is a later integration choice, not a reason to combine the data models.

## Research limits

This is repository inspection and independent analysis of current primary documentation. No CMS was installed, no editor usability trial was conducted, and no production account, contract, storage-region arrangement or total operating cost was verified. Hosting preference, contributor count and permission scope could change the product choice. The recommendation does not assume that current vendor features, prices or licences will remain unchanged after September 2026.

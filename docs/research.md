# Shared research

## Purpose and delivery

Keep focused research resumable for humans and agents without repeating searches
or maintaining a second collection database. Use campaign documents for questions,
findings and next actions, and the existing progress register for detailed work
on identified objects. Small questions stay in conversation; record useful
answers and decisions in the campaign.

The first delivery makes IndiGen progress portable and runs one bounded Bishop
Museum publication pilot. Older research migrates when it becomes useful. Do not
classify every temporary file or reconstruct every past session.

[ADR 026](adrs/026-share-research-plans-and-evidence.md) records the decision.
The [programme overview](../research/README.md) lists campaigns; the
[roadmap](roadmap.md#shared-research-programme) tracks implementation.

## Discovery strategy

Investigate Rapa Nui cultural material outside Rapa Nui, including mainland Chile.
Keep evidence of historical displacement distinct from present location, return
and unknown whereabouts. Include archaeological and everyday material alongside
carvings and contemporary Rapanui work. Distinguish objects, groups, fragments,
replicas and depictions. Discovery does not decide public access to sensitive
material or ancestors.

Use several routes beyond the original PDF table and IndiGen gallery:

- Inventory institutional catalogues across archaeology, ethnology, art and
  archives, including records without photographs.
- Search underrepresented materials and functions using place-name, language and
  spelling variants. Distinguish Rapa Nui from Rapa Iti and incidental mentions.
- Follow collectors, expeditions, former holders and documented transfers into
  other collections. Neighbouring accession numbers are leads, not proof.
- Inspect publication tables, appendices and illustrations, keeping exact entry
  locators and grouped entries intact.
- Revisit unresolved groups and searches when new evidence becomes available.

The [Bishop mata‘a paper](https://thepolynesiansociety.org/jps/index.php/JPS/article/view/133/0)
reports 332 specimens; the [Australian Museum overview](https://australian.museum/learn/cultures/pasifika-collections/rapa-nui-collections/)
reports approximately 100 objects. These are leads for bounded campaigns, not
counts of new objects to create. The [Pacific-Studies directory](https://www.pacific-studies.net/geodetail.php?id=317)
and [Splendid Isolation](https://www.metmuseum.org/met-publications/splendid-isolation-art-of-easter-island)
provide further starting points. Consulted on 2026-09-30.

## Files and responsibilities

| Location | Purpose |
| --- | --- |
| `research/README.md` | Campaign index and priorities |
| `research/campaigns/` | Plain Markdown questions, scope, findings, unresolved leads and next actions |
| `research/progress/` | Source-based JSON registers with independent identity, capture, claims and image outcomes |
| `research/evidence/` | Selected, reviewed supporting notes and attachments |
| `research-local/` | Ignored downloads, working files, private evidence and unchanged legacy research |

Start a campaign by copying the [template](../research/campaigns/template.md).
A campaign does not need an existing source or object. Keep candidate URLs and
unresolved entries in its document until evidence establishes object identities.
Use [collection authoring](collection-publication.md) for collection changes;
there is no additional publication approval stage for public museum material.

Give each fact one maintained home. Published facts and source-specific editorial
decisions belong in collection records. Reviewed work and remaining object
stages belong in the progress register. Campaigns hold the research question,
scope, unresolved leads and next action. Supporting evidence is retained only
when needed to understand or resume work that those records do not explain.

Do not write a campaign report for every collection import or mirror claim,
image, source or completion counts. Link the relevant source or register instead.
Use `just research status <source-id>` for current counts and queues. A one-off
migration check can retain a dated snapshot; it is not a recurring reporting
requirement. When a candidate enters the collection, replace its duplicated
factual notes with a link and retain only unresolved questions or decision
rationale that is not already recorded there.

A short investigation can use an existing campaign. Update it only when its
question, findings, obstacles or next action change; routine successful imports
need no additional campaign entry. Reuse source IDs, qualified claim IDs,
optional claim locators and registered captures. Do not create a source just
to satisfy a research format. Agent instructions should point to the relevant
campaign and lookup recipes rather than require the original chat.

## Evidence and human assistance

Tracked research is visible to repository readers even though it is excluded
from the website. Share reviewed notes and useful supporting files. Keep private
correspondence, credentials and uncleared media local. Reuse captures already in
`source-files/` rather than copying them into campaign folders.

When a website blocks an agent, record its URL and the evidence needed. A human
can supply HTML or a PDF in ignored local staging and tell the agent its path.
Permission to inspect a supplied file does not mean permission to share it in
the repository. Keep restricted files, their page renders and raw extracted
text local; share our findings and a citation where appropriate. The
agent inspects the file and uses the existing source capture workflow for a
suitable registered source. Preserve retrieval information when known; an
unknown download date stays unknown. No special handover record is required.

The progress register supports optional `evidenceLimitations` notes
to batches when supporting evidence cannot be shared. These notes describe the
limitation, not substitute evidence. Status output shows limitations apart
from recorded outcomes. Missing shared files remain errors.

## First migration and validation

The [IndiGen migration](../research/evidence/indigen/README.md) preserves the
original inventory and batch history while making selected evidence portable.
Its one-off verification note records the parity result. Current collection
counts belong to collection checks; current progress belongs to the register.
The original local register remains unchanged; never update both copies.

Verify that another checkout can read the campaign, inspect progress and find
the next action without local research files. Keep existing drift and revision
checks. Use ordinary Git conflict resolution for concurrent register edits;
re-read status and record the second batch against the resulting revision.
Do not silently choose between conflicting research conclusions.

## Implementation boundary

The research commands retain the existing register structure, use shared
storage, allow legacy read-only inspection, check all shared registers and
report evidence limitations. Run `just research-check` for all shared registers;
`just verify` includes it. The [collection authoring guide](collection-publication.md#research-museum-records)
contains the command and batch reference. No campaign schema, lead database,
activity system, assignment mechanism or handover API is needed.

The implementation is complete when IndiGen is portable, the Bishop pilot has
recorded findings or a concrete blocker, contributor guidance matches the tools,
and repository checks pass. Run larger censuses and migrate further history in
subsequent research work, using problems encountered to guide improvements.

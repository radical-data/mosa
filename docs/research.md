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

Do not copy register totals into continuously maintained campaign tables. Use
`just research status <source-id>` for current counts and filtered queues. Mark
any retained historical totals with their date and scope.

Reuse collection source IDs, qualified claim IDs, optional claim locators and
registered captures. Do not duplicate public claims or create a source just to
satisfy a research format. Agent instructions should point to the campaign and
existing lookup recipes rather than require the original chat.

## Evidence and human assistance

Tracked research is visible to repository readers even though it is excluded
from the website. Share reviewed notes and useful supporting files. Keep private
correspondence, credentials and uncleared media local. Reuse captures already in
`source-files/` rather than copying them into campaign folders.

When a website blocks an agent, record its URL and the evidence needed. A human
can download HTML into ignored local staging and tell the agent its path. The
agent inspects the file and uses the existing source capture workflow for a
suitable registered source. Preserve retrieval information when known; an
unknown download date stays unknown. No special handover record is required.

The portable register implementation adds optional `evidenceLimitations` notes
to batches when supporting evidence cannot be shared. These notes describe the
limitation, not substitute evidence. Status output must show limitations apart
from recorded outcomes. Missing shared files remain errors.

## First migration and validation

The baseline observed on 2026-09-30 at `68a3a2a` contained 565 objects, 254
sources, 6,094 claims, 109 image records and two editorials. Of those object
records, 562 linked to the PDF table, IndiGen or both. These are record counts,
not verified totals of distinct objects currently abroad.

The local IndiGen register had one inventory, revision 45, 44 batches and 417
active entries. Its recorded outcomes were:

| Stage | Outcomes |
| --- | --- |
| Identity | 231 verified; 34 not found within scope; 50 blocked; 102 deferred |
| Capture | 229 complete; one partial; 50 blocked; 137 deferred |
| Claims | 228 complete within scope; three partial; 49 blocked; 137 deferred |
| Images | 69 complete; 97 blocked; 228 deferred; 23 unavailable |

Ninety entries met the existing four-stage completion rule. No pending outcomes
means every entry has a disposition, not that the research is finished.

Copy this register while preserving its original inventory, batches, dates,
outcomes, references and source hashes. Review only the local evidence it uses:
reuse existing captures, share necessary notes, or describe access limitations.
Retain the original local register unchanged. The shared register becomes
canonical after parity and clean-checkout checks; never update both copies.

Verify that another checkout can read the campaign, inspect progress and find
the next action without local research files. Keep existing drift and revision
checks. Use ordinary Git conflict resolution for concurrent register edits;
re-read status and record the second batch against the resulting revision.
Do not silently choose between conflicting research conclusions.

## Implementation boundary

The planned tooling changes retain existing commands and register structure,
use shared storage, allow legacy read-only inspection, check all shared
registers and report evidence limitations. No campaign schema, lead database,
activity system, assignment mechanism or handover API is needed.

The implementation is complete when IndiGen is portable, the Bishop pilot has
recorded findings or a concrete blocker, contributor guidance matches the tools,
and repository checks pass. Run larger censuses and migrate further history in
subsequent research work, using problems encountered to guide improvements.

---
started: "2026-09-30"
---

# Australian Museum: discovery and integration

## Question and scope

Which Rapa Nui objects documented by the Australian Museum are missing from
MoSA, and what source, claim and image material can we integrate for them?
The museum's [Rapa Nui overview](https://australian.museum/learn/cultures/pasifika-collections/rapa-nui-collections/)
offers a route beyond the Arte and IndiGen seeds. Its approximate holding count
is a lead, not a denominator or permission to create individual objects.

The initial highlight pilot added three contemporary works to the one historical
Arte-table entry already in MoSA. The expanded investigation starts from those
four records. The approximate holding total is neither a verified current
inventory nor a target of 96 new objects: holdings, catalogue entries, lots,
components and previously represented objects must be distinguished.

The expanded campaign covers publicly documented Australian Museum Rapa Nui
holdings: historical and contemporary cultural material, archaeological objects,
physical replicas and accessible object-level collection documentation. Search
across cultural collections, exhibitions, museum publications, annual reports,
archives and external catalogues that explicitly document Australian Museum
objects. Historical attribution does not establish present custody. Incidental
mentions, shop products and objects held by other museums are excluded from
this institution pass. Sensitive material requires discussion before publication.

## Ordered plan

1. **Reuse the baseline.** Compare new candidates against all MoSA objects and
   sources, including the four existing Australian Museum records. Reuse the
   inspected local captures and previous search outcomes below.
2. **Complete website discovery.** Review the remaining result pages for
   `Rapa Nui`, `Rapanui` and `Easter Island`; cover relevant material variants
   (`mata‘a`/`mataa`, `toki`/`adze`, `fish hook`) to their visible result boundary.
   Distinguish the keyword index from AI-generated answers. Inspect relevant
   results and explicitly record inaccessible pages and unresolved pagination.
3. **Find the inventory.** Inspect observed collection/database access routes,
   museum research publications and digitised historical catalogues. Follow
   accession numbers, named collectors and transfers only when linked evidence
   makes them relevant. Search historical place-name variants where encountered.
   An aggregate report may expose gaps but does not identify its constituent objects.
4. **Resolve existing leads.** Investigate Vaitiare Pakarati's sensory models
   through exhibition/acquisition evidence; establish holding location and
   component boundaries. Review the fish-hook display's individual labels if
   accessible. Seek evidence for the historical rei miro's current identity.
5. **Integrate supported candidates in coherent batches.** Inspect substantive
   sources, preserve usable shareable files or explain restrictions, reconcile
   identities, extract faithful object-specific claims and review images. Add
   only cleared images. Use the [integration procedure](../../.agents/skills/incorporate-source/SKILL.md).
   Keep every inspected candidate accounted for as new, existing, unresolved or
   excluded; collection records own accepted facts.
6. **Review coverage and continuation.** Compare discovered records with the
   approximate reported holdings, explaining rather than filling gaps. A fresh
   agent must be able to identify the next useful action from this campaign.
   Finish this public-evidence pass when the planned routes have outcomes and
   supported candidates are integrated or their remaining stages are explicit.
   An inaccessible inventory prevents a census-completeness claim; specify the
   exact export, inventory or supplied file needed to continue.

The parent owns shared campaign and collection edits. Cheaper research agents
receive separate routes and return checked evidence and precise limits. A
separate review checks attribution, identity and claim wording. No new register,
schema or recurring tooling is planned. Human help uses ordinary conversation
and locally supplied files. Institution contact, permission requests, pushing
and deployment are outside the authorised work.

## Git commit strategy

- Commit this expanded scope before starting the new research:
  `docs(research): scope the australian museum census`.
- Commit each independently reviewed integration batch with its source records,
  justified objects, claims, authorised captures/images and concise campaign
  outcomes together, for example `feat(collection): add australian museum ...`.
  Do not split a dependent source/object pair across invalid commits.
- If a route produces only consequential unresolved findings, commit its
  campaign update as `docs(research): record australian museum ...`; do not
  manufacture a collection source to record a search.
- Conclude with reconciled coverage and a specific next action. Keep routine
  test and commit history in Git, not a duplicate campaign activity log.
- Stage explicit reviewed paths. Keep restricted originals and disposable work
  in ignored local staging. Run collection validation, relevant model tests and
  the build for data changes; check docs and whitespace for campaign changes.
  Review new object pages on both language routes before the batch commit.

## Coverage and decisions

Reviewed on 30 September 2026:

| Route | Coverage and limit |
| --- | --- |
| [Overview](../../collection/sources/australian-museum-rapa-nui-collections.json) and its three highlights | Read all four articles, expanded transcripts and image alternative text. Captured all four locally; sharing limits below prevent registering them in Git. The overview also describes sensory models; their holding location and item boundaries remain uncertain. |
| [Collections](https://australian.museum/learn/collections/), [Pasifika](https://australian.museum/learn/cultures/pasifika-collections/) and [archaeology](https://australian.museum/learn/collections/natural-science/australian-archaeology/) routes | Found explanatory pages, not a public accession-level cultural catalogue or export. The collections page describes registration-linked database records and ongoing digitisation. The archaeology route concerns Aboriginal archaeology in Australia. This does not establish that no other catalogue access exists. |
| [Museum website search](https://australian.museum/ami/) | First result page only for `Rapa Nui`, `Rapanui`, `Easter Island`, `mata‘a`, `mataa`, `toki`, `adze` and `fish hook`. This is a website keyword/AI index, not the museum database. Remaining result pages were not reviewed. No catalogue-completeness claim follows. |
| [Annual report 2024–25](../../collection/sources/australian-museum-annual-report-2024-25.json) | Inspected the original PDF and case study on printed pp. 72–73. It identifies six contemporary acquisitions: the three existing highlight works and three petroglyphs. The original is retained locally because redistribution rights for its cultural images are unresolved. |
| [Fish-hook gallery](https://australian.museum/learn/cultures/pasifika-collections/fish-hooks/) | Examined the index's 15 nation links and example cards; none is labelled Rapa Nui. Did not individually enumerate the advertised 98 hooks: the zoomed display image was blank in the research viewer. Gallery-wide exclusion remains unproven. |

Web-index reconnaissance combined the museum domain with Rapa Nui/Easter Island,
`Catalogue Number`, `mataa`, `fish hook`, `adze` and `toki`, plus Pasifika
fish-hook and public catalogue/API searches. These searches produced the routes
above, not a complete institutional inventory.

## Candidate outcomes

Comparison against all collection JSON found one existing Australian Museum
entry, [rei-miro-australian-museum](../../collection/objects/rei-miro-australian-museum.json),
from the Arte table. The following contemporary works do not match it or the
existing historical moai and tablet records.

| Candidate | Identity outcome | Integration and remaining work |
| --- | --- | --- |
| Moai replica | New [object](../../collection/objects/moai-hoa-haka-nanaia-replica-australian-museum.json), distinct from [hoa-hakananai-a](../../collection/objects/hoa-hakananai-a.json) | [Article](../../collection/sources/australian-museum-moai-replica.json) and overview inspected and captured locally; object-specific claims extracted; image reuse unresolved. The original's history is outside this replica import. |
| Kōhau Roŋoroŋo replica | New [object](../../collection/objects/kohau-rongorongo-replica-australian-museum.json), not a historical original | [Article](../../collection/sources/australian-museum-kohau-rongorongo-replica.json) and overview inspected and captured locally; object-specific claims extracted; image reuse unresolved. |
| Nua María Aŋata bust | New [object](../../collection/objects/bust-nua-maria-angata-australian-museum.json), distinct from its sitter | [Article](../../collection/sources/australian-museum-nua-maria-angata-bust.json) and overview inspected and captured locally; object-specific claims extracted; image reuse unresolved. The lantern slide is a different work. |
| Three contemporary petroglyphs depicting Tahia Makemake, Manu Tara and Tangata Manu | New [Tahia Makemake](../../collection/objects/petroglyph-tahia-makemake-australian-museum.json), [Manu Tara](../../collection/objects/petroglyph-manu-tara-australian-museum.json) and [Tangata Manu](../../collection/objects/petroglyph-tangata-manu-australian-museum.json) records | The [annual report](../../collection/sources/australian-museum-annual-report-2024-25.json) differentiates three works by their depicted figures. Claims preserve its collective wording; individual materials, makers and accessions are not supplied. These are contemporary commissions, not the original Oroŋo carvings. No cleared individual images found. |
| Vaitiare Pakarati's Tahai sensory representation and accompanying island platform | Unresolved: one work or multiple components, and location outside Rapa Nui not established | Described in the overview's expanded transcript. Use its local capture to investigate public exhibition/acquisition documentation before creating records. |
| Rei miro | Existing object; no new match established | This pass found no accession-level record that establishes whether the Arte entry is among current holdings. Continue with institutional inventory evidence. |
| Fish-hook index examples | Excluded from this pass: cards attribute examples to other nations | The full display remains unreviewed; no claim that all 98 hooks are outside scope. |
| [“Lost and found” stone-tool article](https://australian.museum/learn/news/blog/lost-and-found-a-rapa-nui-stone-tool-finds-its-real-home/) | Excluded from this institution pass: concerns a Bishop Museum specimen reassigned to New Britain | It is not evidence of an Australian Museum object. |

The expanded contemporary batch adds three petroglyph records and seven claims
across all six acquisitions, bringing the institution campaign to seven represented
objects including the historical rei miro. The annual-report original remains in
ignored `research-local/australian-museum/modern/`; source notes explain its
preservation and identity limits. Historical and inventory routes remain in progress.

The initial claim pass covers the works' identification, makers, materials and
stated educational/partnership context. Wider interpretations in oral accounts
remain available in the captures for a separately scoped extraction; no claim
of exhaustive article transcription is made. Foregrounding remains unselected.

Image review found no verified image-specific reuse clearance for the three
works. The museum's [image licensing procedure](https://australian.museum/about/organisation/am-images/)
and [copyright statement](https://australian.museum/copyright/) require further
rights/community clearance for this cultural material. The bust article's
captioned lantern slide has British Museum copyright and depicts the person,
not the bust. The replica images' individual photographer credits and licence
terms were not established. No image files or image records were added; no
institution was contacted.

The four inspected HTML captures also embed those cultural images. They remain
in ignored `research-local/australian-museum/captures/`, named by source ID.
No Australian Museum HTML capture is committed or registered as shareable.
Source notes explain the preservation limitation; future access does not
depend on a silently missing file. The overview capture includes the expanded
sensory-model transcript. Reuse it locally instead of recapturing.

## Next action

Execute the expanded plan: complete public website coverage, investigate the
sensory models and fish-hook display, and search museum/publication inventory
routes in parallel. Integrate supported discoveries and replace this next action
with the precise remaining gap once those routes have outcomes.

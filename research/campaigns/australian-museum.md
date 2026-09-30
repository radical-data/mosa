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
| [Museum website search](https://australian.museum/ami/) | Keyword results reviewed separately from generated answers; exact bounds below. Known highlight pages recur, without a new object candidate. Changing result totals and stale page states prevent a complete-index claim. |
| [Annual report 2024–25](../../collection/sources/australian-museum-annual-report-2024-25.json) | Inspected the original PDF and case study on printed pp. 72–73. It identifies six contemporary acquisitions: the three existing highlight works and three petroglyphs. The original is retained locally because redistribution rights for its cultural images are unresolved. |
| [Fish-hook gallery](https://australian.museum/learn/cultures/pasifika-collections/fish-hooks/) | Reviewed the individual gallery captions on all 15 linked nation pages: 99 caption instances cover 94 distinct display numbers, all attributed to other places. Numbers 48, 58, 67 and 97 are absent from the captions; repeated numbers explain the difference between caption instances and distinct hooks. The advertised 98-hook display is therefore not fully accounted for, even though the captioned 94 are outside this pass. |

The keyword-index bounds below record observed pages, not object counts. The
counts changed during navigation; an attempted click with stale content is not a
reviewed page. Do not repeat the entire index pass to repair a single gap.

| Term | Reviewed pages | Unresolved boundary |
| --- | --- | --- |
| `Rapa Nui` | 1, 2, 3, 5 (41 results / 5 pages observed) | Page 4 not reliably verified |
| `Rapanui` | 1–5 (45 / 5 observed) | No further visible page at that observation |
| `Easter Island` | 1 and 4 | Counts shifted from 37 to 44 and 4 to 5 pages; pages 2, 3 and 5 not verified |
| `mata‘a` | 1–4 | Counts shifted between 32 / 4 and 48 / 5; page 5 not verified |
| `mataa` | 1–3 (29 / 3 observed) | No further visible page at that observation |
| `toki` | 1–5 | Counts shifted between 40 / 4 and 52 / 6; page 6 not verified |
| `adze` | 1–5 | Counts shifted between 37 / 4 and 51 / 6; page 6 not verified |
| `fish hook` | 1 | Remaining keyword pages unreviewed; separate gallery coverage above |

An additional `Isla de Pascua` first-page check returned unrelated results; its
remaining pages were not reviewed. Material-term results were predominantly
unrelated publications, species and visitor pages. These exclusions apply to
the inspected results, not to the museum's underlying holdings.

The [archives guide](https://australian.museum/learn/collections/museum-archives-library/museum-archives/)
identifies accession schedules (1879–1956), purchase schedules (1883–1924) and
exchange records (c. 1874–1926), but exposes no searchable inventory there. The
linked [research library catalogue](https://library.australian.museum/) loads and
searches publications; it is not an object catalogue. The collections page's ALA
link concerns natural-science specimens. The [Wansolmoana digitisation case study](https://australian.museum/learn/cultures/cultural-collection-enhancement-project/wansolmoana-digitisation/)
locates its collection interactive on a gallery touchscreen; no remote object
export was exposed by that page or the collection-enhancement overview. These
are concrete access routes to pursue, not proof that every public catalogue
route has been exhausted.

Historical discovery covered relevant AM journal, magazine and annual-report
results and the Geiseler/Weißer rei miro bibliography. Etheridge's paper, the
1927 Robins notice and the relevant Melka–Schoch passage were read in their
original PDFs. The museum's 2014 wooden-head caption was inspected in its HTML.
The initial [Project MUSE access challenge](https://muse.jhu.edu/article/716984)
was resolved for this research on 30 September 2026 when a human supplied the
original PDF of Torrence, Kononenko and White's *Revisiting Rapa Nui Matā*.
The [collection source](../../collection/sources/torrence-kononenko-white-2018-rapa-nui-mata.json)
now documents all twelve specimen identities, with selective table extraction
and explicit identifier discrepancies. Reuse the supplied original in ignored
`research-local/australian-museum/mata/project_muse_716984.pdf`; redistribution
and figure reuse are not cleared. No challenge was solved or institution contacted.
Thomsett's
[1993 history of the Pacific collections](https://www.jstor.org/stable/23409019)
is a further bibliographic lead; its full text was not reviewed.

The museum's [July 2026 return announcement](https://australian.museum/about/organisation/media-centre/australian-museum-returns-ancestors-to-rapa-nui/)
reports the return of 17 ancestors and a hair sample. These are outside this
cultural-object publication batch. There is no evidence that the overview's
approximate hundred-object count includes them; do not subtract them from that
count or treat historical holdings as current custody.

Web-index reconnaissance combined the museum domain with Rapa Nui/Easter Island,
`Catalogue Number`, `mataa`, `fish hook`, `adze` and `toki`, plus Pasifika
fish-hook and public catalogue/API searches. These searches produced the routes
above, not a complete institutional inventory.

## Candidate outcomes

The pre-pilot comparison against all collection JSON found one Australian Museum
entry, [rei-miro-australian-museum](../../collection/objects/rei-miro-australian-museum.json),
from the Arte table. The following contemporary works do not match it or the
existing historical moai and tablet records.

| Candidate | Identity outcome | Integration and remaining work |
| --- | --- | --- |
| Moai replica | New [object](../../collection/objects/moai-hoa-haka-nanaia-replica-australian-museum.json), distinct from [hoa-hakananai-a](../../collection/objects/hoa-hakananai-a.json) | [Article](../../collection/sources/australian-museum-moai-replica.json) and overview inspected and captured locally; object-specific claims extracted; image reuse unresolved. The original's history is outside this replica import. |
| Kōhau Roŋoroŋo replica | New [object](../../collection/objects/kohau-rongorongo-replica-australian-museum.json), not a historical original | [Article](../../collection/sources/australian-museum-kohau-rongorongo-replica.json) and overview inspected and captured locally; object-specific claims extracted; image reuse unresolved. |
| Nua María Aŋata bust | New [object](../../collection/objects/bust-nua-maria-angata-australian-museum.json), distinct from its sitter | [Article](../../collection/sources/australian-museum-nua-maria-angata-bust.json) and overview inspected and captured locally; object-specific claims extracted; image reuse unresolved. The lantern slide is a different work. |
| Three contemporary petroglyphs depicting Tahia Makemake, Manu Tara and Tangata Manu | New [Tahia Makemake](../../collection/objects/petroglyph-tahia-makemake-australian-museum.json), [Manu Tara](../../collection/objects/petroglyph-manu-tara-australian-museum.json) and [Tangata Manu](../../collection/objects/petroglyph-tangata-manu-australian-museum.json) records | The [annual report](../../collection/sources/australian-museum-annual-report-2024-25.json) differentiates three works by their depicted figures. Claims preserve its collective wording; individual materials, makers and accessions are not supplied. These are contemporary commissions, not the original Oroŋo carvings. No cleared individual images found. |
| Vaitiare Pakarati's Tahai sensory representation and accompanying island platform | Unresolved: one work or multiple components, and location outside Rapa Nui not established | Described in the overview's expanded transcript. The annual report, Wansolmoana exhibition and digitisation descriptions did not establish a museum-held physical work or its component boundaries. Obtain an acquisition record or object-specific exhibition label before creating records. |
| Rei miro, Australian Museum 18853 in Fischer’s inventory quotation | Unresolved match to the existing [Arte object](../../collection/objects/rei-miro-australian-museum.json); no duplicate created | [Melka and Schoch 2021](../../collection/sources/melka-schoch-2021-quest-part-i.json), p. 160, preserves an identifier, dimensions and references to earlier illustrations. The original PDF is registered under the publisher’s CC BY 4.0 policy. The Arte row has only type and holder; an accession crosswalk or distinctive illustrated match is still needed before assigning claims. |
| Fish-hook display | 94 caption-identified entries excluded; four display numbers unresolved | All 15 nation galleries reviewed. Missing caption numbers 48, 58, 67 and 97 require display-label evidence; no claim that all 98 advertised hooks are outside scope. |
| Wooden figure described in 1908 | New [historical object](../../collection/objects/wooden-figure-etheridge-1908-australian-museum.json) | [Etheridge 1908](../../collection/sources/etheridge-1908-yodda-valley.json), p. 25, singles out a figure with a distinctive base. One contextual claim preserves the historical account. The public-domain original PDF is registered; its plates depict New Guinea objects, not this figure. Present whereabouts and accession remain unknown. |
| [Wooden figure head photographed in 2014](https://australian.museum/blog-archive/science/our-global-neighbours-polynesian-brothers-and-sisters/) | Unresolved possible match to the 1908 figure; no additional object | Stan Florek’s article, dated 4 September 2014, captions a wooden figure head as Easter Island–Rapanui, twentieth century. No accession or matching base is supplied. The local HTML preserves the caption; image reuse is not cleared. Obtain the image’s object identifier before linking or separating it. |
| Twelve matā studied by Torrence, Kononenko and White | Twelve new records: A18926–28, E30734–41 and E65154 | The [supplied paper](../../collection/sources/torrence-kononenko-white-2018-rapa-nui-mata.json) identifies each specimen; no existing identifier or Australian Museum matā match was found. Extracted 96 claims covering identity, material, consistent acquisition rows, metrics/form and proposed use with confidence. E70735 in Table 2 is not silently substituted for E30735; that metric row is withheld. E65164 in Table 1 is not silently substituted for E65154; the Bard/cave acquisition is withheld. The original and figures remain private. |
| Robins Collection Easter Island material | Unresolved group; no individual objects created | The [Australian Museum Magazine III(2), April–June 1927](https://museum-publications.australian.museum/media/dd/Uploads/Documents/28589/AMS368_V3-2_lowres.bb47806.pdf), printed p. 40, names obsidian weapons and carved figures acquired through Sir Alfred Meeks, without counts or identifiers. Original PDF inspected and retained locally. The matā paper associates E30734–41 with Capt. J. F. Robins and gives 1920, whereas this notice is from 1927. Their relationship remains unverified; obtain the acquisition schedules before equating the lots or dates. The carved figures remain unidentified. |
| [“Lost and found” stone-tool article](https://australian.museum/learn/news/blog/lost-and-found-a-rapa-nui-stone-tool-finds-its-real-home/) | Excluded from this institution pass: concerns a Bishop Museum specimen reassigned to New Britain | It is not evidence of an Australian Museum object. |

The annual-report original remains in ignored
`research-local/australian-museum/modern/`; source notes explain its preservation
and identity limits. The two shareable scholarly originals are registered in
their sources; no second evidence inventory is maintained.

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

The initial expanded pass added four objects, three sources and eight claims,
with two scholarly originals preserved in Git LFS. The supplied matā paper then
added twelve objects, one source and 96 claims. This campaign now represents
**twenty objects**, including historical holdings; it is not a verified current
census of the approximate hundred reported holdings.

1. **Check the paper's inconsistent identifiers against museum records.**
   Confirm E30735/E70735 and E65154/E65164. Also resolve Figure 7’s reversed
   b/c captions for A18927 and A18928 against the visible object labels before
   using those images. The first number conflict blocks the disputed
   metric row; the E65154/E65164 conflict blocks assigning the Bard acquisition and cave
   findspot to E65154. Keep the existing twelve specimen records and attach
   new evidence rather than importing the study again.
2. **Obtain the museum's Rapa Nui inventory/export or relevant register pages.**
   The useful fields are registration number, object description, lot/component
   relationship, collection attribution, acquisition/provenance and current
   status. Prioritise the Robins acquisition and the rei miro reference 18853;
   include the historical wooden figure and 2014 photograph identifier in the
   crosswalk. A human-saved HTML or PDF can use the same local staging path.
   Institution contact requires a separate request.
3. **Resolve bounded remaining routes.** Repair the specific keyword-pagination
   gaps above if stable results become available; obtain labels for fish-hook
   display numbers 48, 58, 67 and 97 and acquisition evidence for the sensory
   models. Read Thomsett's history if accessible. Do not restart reviewed routes
   without new evidence.
4. **Complete the restricted preservation/image stages when clearance exists.**
   Reuse the inspected local originals; source notes own their particular limits.
   The supplied matā paper, annual report and contemporary HTML captures remain
   private, and no publishable object photographs have been added.

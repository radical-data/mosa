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

This first pass covers the overview, its three collection highlights, the linked
fish-hook gallery and relevant public cultural, Pasifika and archaeology access
routes. It includes contemporary Rapanui works and physical replicas, explicitly
distinguished from originals. Shop listings, incidental comparisons and images
mistaken for their depicted objects are outside this pass. Sensitive material
requires discussion before publication.

## Ordered plan

1. Compare existing Australian Museum attribution, identifiers and candidate
   names across MoSA; retain existing handles and unresolved historical matches.
2. Inspect the overview and all three highlighted object pages, then enumerate
   relevant entries in the fish-hook gallery. Follow directly cited object or
   inventory evidence, without expanding into unrelated Pasifika material.
3. Inspect cultural, Pasifika and archaeology routes for public catalogues or
   exports. Search `Rapa Nui`, `Rapanui` and `Easter Island` across available
   relevant fields, supplemented by `mata‘a`/`mataa`, `toki`/`adze` and
   `fish hook` with provenance clues. Record supported fields, pagination and
   access limits. General web searches are reconnaissance, not catalogue censuses.
4. Give every candidate an identity decision against the whole collection.
   Preserve usable substantive sources, extract the relevant object-specific
   claims faithfully, review image identity and reuse rights, and register
   cleared images. Use the [integration procedure](../../.agents/skills/incorporate-source/SKILL.md).
5. Review records and both language routes. Finish this pass when each planned
   route is examined or explicitly blocked and each candidate has an identity
   decision and integration outcome. Keep outstanding work visible; neither a
   blocked route nor an object file means full integration is complete.

## Coverage and decisions

Reviewed on 30 September 2026:

| Route | Coverage and limit |
| --- | --- |
| [Overview](../../collection/sources/australian-museum-rapa-nui-collections.json) and its three highlights | Read all four articles, expanded transcripts and image alternative text. Captured all four locally; sharing limits below prevent registering them in Git. The overview also describes sensory models; their holding location and item boundaries remain uncertain. |
| [Collections](https://australian.museum/learn/collections/), [Pasifika](https://australian.museum/learn/cultures/pasifika-collections/) and [archaeology](https://australian.museum/learn/collections/natural-science/australian-archaeology/) routes | Found explanatory pages, not a public accession-level cultural catalogue or export. The collections page describes registration-linked database records and ongoing digitisation. The archaeology route concerns Aboriginal archaeology in Australia. This does not establish that no other catalogue access exists. |
| [Museum website search](https://australian.museum/ami/) | First result page only for `Rapa Nui`, `Rapanui`, `Easter Island`, `mata‘a`, `mataa`, `toki`, `adze` and `fish hook`. This is a website keyword/AI index, not the museum database. Remaining result pages were not reviewed. No catalogue-completeness claim follows. |
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
| Vaitiare Pakarati's Tahai sensory representation and accompanying island platform | Unresolved: one work or multiple components, and location outside Rapa Nui not established | Described in the overview's expanded transcript. Use its local capture to investigate public exhibition/acquisition documentation before creating records. |
| Rei miro | Existing object; no new match established | This pass found no accession-level record that establishes whether the Arte entry is among current holdings. Continue with institutional inventory evidence. |
| Fish-hook index examples | Excluded from this pass: cards attribute examples to other nations | The full display remains unreviewed; no claim that all 98 hooks are outside scope. |
| [“Lost and found” stone-tool article](https://australian.museum/learn/news/blog/lost-and-found-a-rapa-nui-stone-tool-finds-its-real-home/) | Excluded from this institution pass: concerns a Bishop Museum specimen reassigned to New Britain | It is not evidence of an Australian Museum object. |

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

Investigate the sensory models in public Wansolmoana exhibition/acquisition
records, starting from the locally preserved overview transcript. Establish current
location and whether the platform is a separate object or component. This is
the next bounded discovery task, not a reason to re-run the highlight import.

A broader holdings pass needs a usable institutional inventory or catalogue
route. The website index's remaining pages and full fish-hook display have not
been covered. If the display remains inaccessible, a human can supply the
captioned image or saved HTML in local staging. Request contact or image
permissions only if the user authorises that work. Until these gaps are resolved,
this pilot demonstrates a partial collection import, not a completed census or
fully illustrated integration.

# Case 07: Hoa Hakananaiʻa provenance

## Purpose

Test a documented naval removal that is described differently by institutional, community, and secondary sources without disagreement about the event’s basic identity.

## Phase 1 entities

- **Item:** Hoa Hakananaiʻa (Phase 1 identity; catalogue `Oc1869,1005.1`)
- **Item or vessel:** HMS *Topaze*
- **Agents:** HMS *Topaze* expedition; Richard Ashmore Powell; British Admiralty; Queen Victoria; British Museum; Council of Elders; Ma’u Henua Indigenous Community
- **Places:** Rano Kao; Orongo; Rapa Nui; England; London; British Museum Room 24
- **Sources:** British Museum catalogue record; Paula Rossetti's note; Ma’u Henua report on Hoa Hakananaiʻa repatriation

## Provenance pressure

The item's removal in 1868 is relatively well documented, but sources characterise it differently. Include a characterisation only when an identified source uses or clearly asserts it. The competency case does not require every candidate term to appear.

The British Museum’s pages support wording including “removed,” “collected,” “offered,” “presented,” “donated,” and “gifted.” A direct community claim such as “stolen” should not be added until the fixture has the direct source, or an indirect source that clearly attributes that wording to an identifiable community authority.

The event model must preserve a shared historical anchor while allowing separately attributed characterisations and incomplete evidence about authority or consent.

## Candidate events

1. removal at Orongo during the HMS *Topaze* expedition in 1868;
2. transport from Rapa Nui to England via HMS *Topaze*, 1868–1869;
3. Admiralty presentation or offer to Queen Victoria, 1869;
4. Queen Victoria transfer to the British Museum, 1869.

Current custody and London location remain direct item claims, not provenance events.

The British Museum catalogue also distinguishes:

- likely production at Rano Kao;
- an approximate production period of 1000–1200;
- the Orongo findspot;
- current display in Room 24.

## Required distinctions

- The 1868 removal is one event; competing `described_as` claims are separately attributed characterisations of it, not event titles or event kinds.
- HMS *Topaze* is a vessel item; the expedition is the acting agent; Powell commands the ship via `HMS Topaze commanded_by Richard Ashmore Powell` and is not a generic removal participant.
- Transport uses `moved_via → HMS Topaze`; do not use `carried_out_by → HMS Topaze`.
- Transfer events use `transferred_item`; they use `moved_item` additionally only when physical movement is supported.
- Presentation to Queen Victoria and transfer to the British Museum remain separate events.
- Current custody must not imply ownership, lawful title, or legitimate removal.
- A position published directly by Ma’u Henua uses `supports`.
- A community position known only through Paula's note uses `mentions`.
- `made_at → Rano Kao` remains distinct from `found_at → Orongo` and the removal event's `moved_from → Orongo`.
- The catalogue wording “likely” qualifies the `made_at` claim through evidence; it does not create a `possibly_made_at` predicate.
- Current Room 24 display is a direct item state, not a provenance event.

## Questions

- Can one event carry several incompatible source-attributed descriptions?
- Can transport, presentation, and institutional transfer remain separate from current custody?
- Can a vessel, expedition, and commander remain structurally distinct and queryable?
- Can direct community evidence be distinguished from an indirectly reported community position?
- Can the explorer show multiple characterisations without presenting one wording as MoSA's conclusion?
- Can production place, findspot, removal origin and current location remain distinct?
- Can source qualification be preserved without multiplying predicate names?

## Pass condition

The 1868 removal is represented once as a stable event anchor with separately attributed characterisations and evidence. Subsequent transport, presentation, and transfer are not conflated. Current custody remains a direct item state. No claim implies ownership, consent, legality, or lawful title unless a source explicitly asserts it.

## Implementation findings

- One removal event carries multiple independently attributed `described_as` claims; none become the event title or `event_kind`.
- HMS *Topaze* is a vessel item; the expedition remains the acting agent; Powell is linked only through vessel `commanded_by`.
- Transport uses `moved_via → HMS Topaze` and stays separate from the Orongo removal.
- Transfer events use `transferred_item`; they use `moved_item` additionally only when physical movement is supported. Admiralty presentation and Queen-to-Museum donation are separate transfer events.
- A direct Ma’u Henua characterisation uses `supports` evidence from a Ma’u Henua-authored source.
- An indirect community characterisation uses `mentions` evidence from Paula’s note.
- Both characterisations attach to the same stable 1868 removal event.
- Current custody remains Phase 1 direct `held_by` / `located_at` item claims.
- Explorer discovery includes `transferred_item`; distinct descriptions surface as a generic “Multiple characterisations reported” notice.
- Database and explorer event titles both support `Transfer to X` when only `transferred_to` is present.
- `made_at → Rano Kao` has both supporting and qualifying British Museum evidence.
- `found_at → Orongo` remains distinct from production and movement claims.
- The approximate production period remains a structured literal.
- Item pages surface reported production and current recorded state before findspot and the event sequence.
- Source qualification such as “likely” is projected beside the production place value.
- The British Museum catalogue source uses a readable `has_name` for explorer labels; the URL remains on the source record.
- No disagreement table, conflict group, confidence score, ownership, legality, authority or consent predicate was required.

## Out of scope

- restitution requests, negotiations, or proposed exchanges;
- a legal determination that the removal was theft or lawful acquisition;
- accession or registration predicates;
- sensitivity and publication controls;
- resolving the preferred public narrative.
- a general claim-certainty or confidence ontology.

## Executable coverage

- [Fixture](../../supabase/fixtures/phase-2-hoa-hakananai-a.sql) and [SQL assertions](../../supabase/tests/database/phase-2-hoa-hakananai-a.test.sql).
- [Fixture](../../supabase/fixtures/phase-2-hoa-hakananai-a-community.sql) and [SQL assertions](../../supabase/tests/database/phase-2-hoa-hakananai-a-community.test.sql).
- [Fixture](../../supabase/fixtures/phase-2-hoa-hakananai-a-production.sql) and [SQL assertions](../../supabase/tests/database/phase-2-hoa-hakananai-a-production.test.sql).

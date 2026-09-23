# Case 06: Te Papa moai kavakava provenance

## Purpose

Test uncertain event attribution and date ranges when an institutional source presents a provenance hypothesis and then questions it.

## Phase 1 entities

- **Item:** Te Papa moai kavakava, inventory `OL000342`
- **Agents:** F. W. Beechey; HMS *Blossom* expedition; Oldman Collection; New Zealand Government; Museum of New Zealand Te Papa Tongarewa
- **Places:** Rapa Nui; England; Wellington
- **Sources:** Te Papa catalogue record; Paula Rossetti's note

## Provenance pressure

The catalogue states that the figure reached England in 1828 or 1835. It has been thought to have been collected during the HMS *Blossom* expedition in 1825, but the same account says this seems unlikely because the visit was brief and confrontational.

The model must represent an uncertain collection hypothesis, the source's qualification of that hypothesis, and later collection history without selecting one narrative as fact.

## Candidate events

1. a possible encounter, collection, or removal during the HMS *Blossom* visit in 1825;
2. arrival in England in either 1828 or 1835;
3. presence in the Oldman Collection as a holding episode;
4. transfer described as a gift from the New Zealand Government in 1992.

Current Te Papa custody and Wellington location remain direct item claims, not provenance events.

## Required distinctions

- The 1825 collection event is hypothetical, not established.
- The source's statement that the hypothesis seems unlikely must qualify the hypothesis claims rather than silently delete them.
- `1828 or 1835` must remain an alternative or uncertain date expression.
- Arrival in England is not automatically the same event as collection on Rapa Nui.
- `gift` is an attributed characterisation of the 1992 transfer.
- An expedition, vessel, person, government, collection, and museum must not be collapsed into one participant.
- Current custody is modelled with `held_by` and `located_at` on the item.

## Questions

- Can a source both report and weaken a provenance hypothesis?
- Can an event exist with an uncertain date and uncertain participant role?
- Can collection, arrival, collection membership and transfer remain separate from current custody?
- Can the model avoid turning the earliest known date into the collection date?

## Pass condition

The possible 1825 event remains explicitly uncertain and is qualified by the same institutional source. The alternative arrival dates remain visible. Later collection and transfer events are represented separately, with participant roles and evidence attached to the claims that establish them. Current custody remains a direct item state.

## Implementation findings

- The possible 1825 event remains active and qualified; claims are not withdrawn or superseded.
- The same source can report and weaken a proposition through evidence relationships (`mentions` and `qualifies`).
- Alternative dates such as "1828 or 1835" remain structured alternatives rather than being converted into a range or a selected date.
- Current custody is modelled as a direct item state (`held_by`, `located_at`), not as a provenance event.
- No `involved`, ordering predicate, confidence score or claim group was required.
- Arrival in England, possible collection on Rapa Nui, later collection membership, and institutional transfer are distinct events.
- An expedition, vessel, individual, collection, government and museum remain separate agents rather than being collapsed into one provenance actor.
- Terms such as "gift" remain source-attributed descriptions rather than becoming event types or factual transfer semantics.
- Event titles and display order are generated projections from structured claims and dates.
- The existing event + claim model was sufficient; no additional provenance-specific assertion layer was required.

## Out of scope

- deciding whether Beechey's expedition collected the figure;
- inferring unrecorded intermediate transfers;
- legal or ethical assessment of the removal;
- publication or restitution workflows.

## Executable coverage

- [Fixture](../../supabase/fixtures/phase-2-te-papa-moai-kavakava.sql) and [SQL assertions](../../supabase/tests/database/phase-2-te-papa-moai-kavakava.test.sql).

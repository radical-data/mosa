# Case 05: Mamari provenance

## Purpose

Test whether provenance accounts can be represented as structured, queryable event claims rather than leaving origins, destinations and participant roles embedded only in descriptive text.

## Phase 1 entities

- **Item:** one stable identity for the tablet
- **Names or designations:** Mamari; Text C
- **External identifier:** SSCC catalogue `P 003`
- **Classification:** rongorongo tablet
- **Agents:** Gaspar Zumbohm; Hippolyte Roussel; Tepano Jaussen; Congregation of the Sacred Hearts; Missionary Museum; French Navy as a reported participant in the 1892 account
- **Places:** Rapa Nui; Tahiti; Paris; Braine-le-Comte; Grottaferrata; Rome
- **Sources:** Paula Rossetti's note; the cited institutional records; the cited secondary and scholarly sources

Names and scholarly designations, external identifiers, and classifications must remain distinct in both the fixture and the explorer.

## Provenance pressure

The source packet contains more than one account of how Mamari left Rapa Nui and reached Tahiti. It also reports two provisional Paris deposit accounts with different actor-and-date pairings, followed by a sequence of institutional relocations.

A generic participant role and a prose `described_as` value are not sufficient. The database must be able to answer, without parsing prose:

- which item moved;
- where it moved from and to;
- who is reported to have carried out the event;
- who or which institution is reported to have received the item;
- where the event occurred, separately from the recipient institution;
- when the event is reported to have occurred;
- which source supports each statement.

## Candidate events

These are research anchors, not accepted historical facts:

1. Roussel account: movement from Rapa Nui to Tahiti and transfer to Jaussen;
2. Zumbohm account: movement from Rapa Nui to Tahiti and transfer to Jaussen around 1870;
3. Paris account — Jaussen, 1888;
4. Paris account — French Navy, 1892;
5. relocation to Braine-le-Comte in 1905;
6. relocation to Grottaferrata in 1953;
7. relocation to Rome in 1964.

The Roussel and Zumbohm accounts remain separate provisional anchors because the available material does not establish that they describe the same occurrence. The two Paris accounts are likewise separate provisional anchors whose historical identity remains unresolved. Display order for dated events is derived from structured date claims and does not assert a complete chronology.

A 1974 move by the congregation is not modelled as a Mamari event unless evidence directly connects the tablet or its holding collection to that move.

## Required distinctions

- `moved_from` and `moved_to` must be independently queryable.
- `carried_out_by` and `transferred_to` must be independently queryable.
- Each Paris provisional account must contain its own `moved_item → Mamari`, `occurred_at → Paris`, and `transferred_to → Missionary Museum` claims.
- The Paris deposit wording does not by itself justify `moved_to → Paris`; a physical movement destination is asserted only where the source supports it.
- Every provenance event must identify Mamari through `moved_item`.
- The Roussel and Zumbohm accounts must not share an event merely because both end in Tahiti or mention Jaussen.
- The two Paris accounts must not be merged merely because they share an item, place or recipient.
- `collected`, `removed`, `stolen`, `sold`, `sent`, and `deposited` remain source-attributed wording in `described_as` claims.
- Source excerpts must contain source wording or be null; internal event labels are not evidence excerpts.
- Later relocation claims do not imply ownership, lawful title, consent or authority.
- Event titles and display order are presentation projections.

## Questions

- Can SQL retrieve item, origin, movement destination, event location, actor, recipient, date and source without inspecting `described_as` text?
- Can uncertain event identity remain separate provisional anchors?
- Can the alternative Jaussen–1888 and French Navy–1892 accounts remain independently queryable?
- Can the original wording remain visible without carrying the only structured meaning?
- Can dated later events be displayed by reported date while earlier accounts remain unresolved?
- Can the explorer show generated titles, compact summaries and detailed evidence for each event?

## Pass condition

Mamari has one stable item identity. Seven event anchors represent two separate early accounts, two provisional Paris accounts and three supported later relocations. The structured claims answer the competency questions without parsing descriptive prose, and no unsupported 1974 object move, ownership, authority, consent or legal conclusion is introduced.

## Out of scope

- deciding which early or Paris account is historically correct;
- deciding whether the separately modelled early or Paris events describe the same real-world occurrences;
- a general participant-role table or complete provenance predicate vocabulary;
- formal source statements, evidence-unit identities, or explicit claim and conflict groups;
- resolving whether any transfer was lawful;
- restitution or return workflows;
- interpreting the rongorongo text.

## Implementation findings

- Provenance events work as stable research anchors when they share the existing entity identity space and are described through ordinary `knowledge.claim` rows.
- Important event details must be represented as structured claims rather than existing only in `described_as` text.
- The Mamari case established the need for the predicates `moved_item`, `moved_from`, `moved_to`, `occurred_at`, `carried_out_by`, and `transferred_to`.
- `occurred_at`, `moved_to`, and `transferred_to` answer different questions:
  - `occurred_at` identifies where an event happened;
  - `moved_to` identifies the geographical destination of a physical movement;
  - `transferred_to` identifies the person or organisation reported as receiving the item.
- The Missionary Museum and Paris must therefore be represented as separate claims on each Paris account event.
- Unresolved alternative accounts remain separate provisional event anchors. The project does not infer that the Jaussen–1888 and French Navy–1892 accounts describe one historical occurrence.
- The Roussel and Zumbohm accounts must remain separate rather than converging on one assumed Tahiti event.
- Event chains through `preceded_by` were removed; display order is derived from structured dates.
- Evidence-tuple grouping was removed; claims render independently with their own evidence.
- Event identity must be decided separately from uncertainty about properties claimed of an event.
- `described_as` remains useful for preserving original wording, uncertainty, and language, but it must not be the only place where queryable actors, places, recipients, or dates are recorded.
- Event details remain claims with their own status, asserting agent, editorial notes, and evidence. Friendly explorer headings are projections of those claims, not canonical event fields.
- Evidence excerpts should contain source wording or be null. Internal entity labels and event labels must not be used as though they were quotations from a source.
- The reported 1974 move of the congregation must not be represented as a movement of Mamari unless evidence explicitly connects the tablet or its holding collection to that move.
- Movement and transfer claims do not imply ownership, legal title, consent, authority, or lawful acquisition.

## Result

Pass. Seven provisional event anchors represent the Mamari accounts without stored event ordering, without evidence-tuple grouping, and without inventing ownership or legal conclusions.

## Executable coverage

- [Fixture](../../supabase/fixtures/phase-2-mamari.sql) and [SQL assertions](../../supabase/tests/database/phase-2-mamari.test.sql).

# Case 08: La Serena moai provenance

## Purpose

Test how the provenance model handles a sparse movement report without inventing actors, authority, dates, or legal conclusions. Absence is modeled by not asserting facts; the explorer makes known claims and gaps both visible.

## Phase 1 entities

- **Item:** Stone moai associated with the archaeological museum in La Serena
- **Agents:** Archaeological museum in La Serena
- **Places:** Rapa Nui; La Serena
- **Sources:** Paula Rossetti's note and any later direct institutional or archival sources

Unknown participants remain absent claims, not placeholder agents.

## Provenance pressure

The current note states that the moai was taken or carried in 1952 and that it is said to have been a gift from the Rapa Nui people.

This supports a provisional movement event, but not enough to identify the origin, destination, participants, authority, exact date, or legal character of any transfer.

## Candidate event

1. a provisional 1952 movement of the item, without inferring origin, destination or parties from later museum presence.

## Required distinctions

- `1952` may identify only a year, not an exact date.
- `fue llevado` supports `moved_item` and `event_kind = relocation` as operational grouping; it does not establish endpoints.
- `se dice que fue un regalo` is a reported characterisation, not `event_kind = transfer`.
- Do not invent a “Rapa Nui people” agent from source wording.
- The museum's later custody does not establish that it received the item directly in 1952.
- Do not add `moved_from`, `moved_to`, `transferred_from`, `transferred_to`, `occurred_at` or `carried_out_by` from this note alone.
- Prefer `moved_item` over `transferred_item` while the gift interpretation remains uncertain.
- Unknown participants, route, place of transfer, consent and authority must remain unasserted.
- Explorer overview cards omit absent fields and use at most one incompleteness notice. Do not enumerate every missing role as “Not recorded”.

## Questions

- Can an event be represented when most participants and details are unknown?
- Can a reported `gift` description remain an indirectly evidenced `described_as` claim with no asserting agent?
- Can year-level precision be preserved?
- Can later evidence extend the event without replacing or rewriting the original note?
- Can the explorer make known sparse claims and missing information both visible?

## Pass condition

A single provisional relocation event is represented with year-level precision and evidence from Paula’s note. The reported gift wording remains an indirectly evidenced `described_as` claim with no invented asserting agent. No origin, destination, participant, giver, recipient, authority, consent, ownership, or legal status is inferred. Later museum custody remains separate from the 1952 event.

## Implementation findings

- One provisional 1952 event uses `event_kind = relocation` with `moved_item`, year-precision `occurred_during`, and a null-attributed `described_as` claim.
- Paula’s note attaches to the gift characterisation through `mentions`, preserving “se dice” without inventing an underlying asserting agent.
- No “Rapa Nui people” agent is created from the wording.
- Current museum custody remains direct item `held_by` / `located_at` claims.
- Explorer titles sparse movements as “Reported movement of …”; overview shows the source report and source wording, with one compact notice that route and participants are not recorded.
- Detail projection shows only positively recorded facts, plus at most one incompleteness notice. Absent roles are omitted rather than listed as “Not recorded”.
- No ownership, consent, authority, legality or lawful-title predicates were required.

## Later evidence

When a direct archive or museum source is found, extend the same event only when the evidence clearly concerns the same 1952 occurrence. The original Paula-note claim and its `mentions` evidence remain intact. If later evidence describes a distinct handover after arrival, create a second event.

Do not infer `moved_to → La Serena` from later presence alone. Encode a destination only when the source wording supports it, and keep that interpretation visible in evidence locator and excerpt.

## Out of scope

- deciding whether the transfer was a gift;
- determining who had authority to give the item;
- reconstructing an unsupported route;
- restitution, legal review, or publication decisions.

## Executable coverage

- [Fixture](../../supabase/fixtures/phase-2-la-serena-moai.sql) and [SQL assertions](../../supabase/tests/database/phase-2-la-serena-moai.test.sql).

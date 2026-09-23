# Case 10: Return of the Aberdeen Head of an Oba

Status: implemented fixture and read-only explorer case.

## Purpose

Establish the minimum restitution case-management model through a completed process that was initiated proactively by the holding institution.

This case must prevent the initial schema from assuming that every restitution case begins with an unsolicited external request. It also establishes that outreach, formal claim, recommendation, decision and handover are separate administrative actions.

## Object

Create or reuse one stable item identity for the University of Aberdeen object commonly described as a Head of an Oba or Uhunmwu-Elao.

The restitution fixture may use Phase 1 entity and claim structures to give the item and participating agents usable identities and labels. Restitution actions themselves must not be represented as `knowledge.claim` rows.

This is a different object from the British Museum plaque used in Case 09.

## Case record

Suggested reference:

`RST-001`

Suggested title:

`Return of the Aberdeen Head of an Oba`

Operational status:

`closed`

The case must concern the Aberdeen item through a direct case-item link.

## Parties

The fixture should include, at minimum:

| Agent | Case role |
|---|---|
| University of Aberdeen | initiator |
| University of Aberdeen | respondent |
| Federal Ministry of Information and Culture, Nigeria | requester |
| National Commission for Museums and Monuments, Nigeria | advisor |
| National Commission for Museums and Monuments, Nigeria | recipient |
| University of Aberdeen advisory panel | advisor |
| University of Aberdeen Court | decision maker |
| Royal Court of the Oba of Benin | recipient |

The fixture may include Edo State or individual representatives when useful, but the first competency test should not require an exhaustive participant list.

Multiple roles for one agent must be stored as separate role assignments or an equivalent directly queryable structure.

Party roles are operational. They do not establish exclusive authority to represent Nigeria, Benin City, the Edo people or the object.

## Action history

### 1. Proactive outreach

Kind:

`outreach`

Date:

year-level `2020`

Actor:

University of Aberdeen

Description:

The University initiated discussions with relevant Nigerian parties after reviewing the object's provenance.

This action opens the case without requiring a requester.

### 2. Formal claim received

Kind:

`request`

Date:

unrecorded in the selected public sources

Actor:

Federal Ministry of Information and Culture, Nigeria

Recipient:

University of Aberdeen

Description:

Formal claim for the return of the object.

The action must remain distinct from the earlier outreach. Its date must remain unknown rather than being assigned an invented day or month. What was requested is answered from this description and any associated request document, not from a separate canonical remedy field.

### 3. Recommendation recorded

Kind:

`recommendation`

Date:

unrecorded in the selected public sources

Actor:

University of Aberdeen advisory panel

Description:

The panel unanimously recommended unconditional return.

The recommendation must not itself close the case or imply that the governing body had made a decision.

### 4. Decision recorded

Kind:

`decision`

Date:

exact date `2021-03-23`

Actor:

University of Aberdeen Court

Description:

The governing body supported the unconditional return of the object to Nigeria.

The public announcement was issued on 25 March 2021. The decision date is derived from the announcement's reference to the governing body's action on the preceding Tuesday.

If the implementation avoids derived exact dates, it may instead use month-level `2021-03`. It must not use October 2021 as the sole decision date without documenting the source discrepancy.

### 5. Handover in Aberdeen

Kind:

`handover`

Date:

exact date `2021-10-28`

Actor:

University of Aberdeen

Recipients:

- National Commission for Museums and Monuments, Nigeria;
- Nigerian representatives associated with the handover.

Description:

The object was handed to Nigerian representatives at a ceremony in Aberdeen.

This action records an administrative handover. It does not automatically create a provenance relocation or update the item's current custody.

### 6. Handover at the Oba's palace

Kind:

`handover`

Date:

exact date `2022-02-19`

Actor:

Nigerian representatives responsible for delivery

Recipient:

Royal Court of the Oba of Benin

Description:

The object was presented to Oba Ewuare II at the royal palace in Benin City.

This second handover must remain distinct from the October 2021 handover. Two handover actions in one case are valid.

### 7. Case closure

The case record may use:

- `status = closed`;
- `closed_on = 2022-02-19`.

A separate `case_closed` action is not required in the initial slice.

Closure is an internal MoSA workflow state. It does not need to reproduce language used by any external party.

## Documents

Associate at least these public records with the case. Every document is a case-level record; action links are optional and many-to-many.

1. University of Aberdeen, `Benin bronze to return`, 25 March 2021.
   - document role: institutional decision announcement;
   - related actions: recommendation and decision.
2. Museums Galleries Scotland, `Returning a Benin Bronze to its rightful place: Benin City`.
   - document role: process account;
   - related actions: outreach, request, recommendation, decision and both handovers.
3. A record of the October 2021 handover.
   - document role: handover record;
   - related action: handover in Aberdeen.
4. A record of the February 2022 palace handover.
   - document role: handover record;
   - related action: handover at the Oba's palace.

These records are case documents, not `knowledge.claim_evidence` rows.

## Competency questions

The database must be able to answer:

1. Which item does the case concern?
2. Is the case open or closed?
3. Who initiated the process?
4. Did the case begin with a request?
5. Who later made the formal claim?
6. Which parties acted as advisors, decision makers and recipients?
7. What was requested?
8. Which recommendation was recorded?
9. Which body made the decision?
10. How many handover actions were recorded?
11. When and where in the case narrative did each handover occur?
12. Which documents are associated with the decision and handovers?
13. Are any provenance events or current-state claims created automatically?

Question 7 is answered from the request action description and associated document. It must not require a controlled `requested_remedy` value.

## Required assertions

The competency test should require that:

- exactly one restitution case concerns the Aberdeen item;
- the case is `closed`;
- the University of Aberdeen is recorded as initiator;
- the Federal Ministry is recorded as requester;
- the case contains separate `outreach`, `request`, `recommendation`, `decision` and `handover` actions;
- the request action description records what was requested;
- the `outreach` action predates the formal request in the recorded process;
- the formal request may have no structured date;
- the recommendation and decision are different actions;
- exactly two handover actions exist;
- the two handovers have different dates and recipients;
- the case closes no earlier than the final handover;
- the case has associated documents;
- no restitution action is represented as a `knowledge.claim`;
- no provenance event is required to satisfy the restitution fixture;
- no `held_by`, `located_at`, `moved_item` or `transferred_item` record is created merely because a handover action exists.

## Must not infer

The fixture must not infer:

- that the University initiated the process because it had legal responsibility to do so;
- that any party was the exclusive or universally accepted claimant;
- rightful ownership;
- legal title;
- moral legitimacy;
- that the recommendation was itself a decision;
- that the March 2021 decision physically moved the object;
- that the October 2021 handover and February 2022 handover were the same action;
- current custody or storage location from the case record;
- a provenance event from either handover;
- claims or evidence relationships for routine case facts.

## Explorer expectation

The item page should list this case under a restitution section with title, reference, status and a link to the case. It should not narrate the process or count actions.

The case page should begin with title, reference, closed status and the concerned item, then show:

- parties grouped by role;
- a dated action history;
- two distinct handovers;
- related documents beneath their actions;
- any remaining case-level documents without action links.

The interface must not display a free-text case summary, `rightful owner`, `valid claim` or similar judgments.

## Source basis

- University of Aberdeen, `Benin bronze to return`, 25 March 2021:
  https://aberdeenuni-newsroom.prgloo.com/news/benin-bronze-to-return
- Museums Galleries Scotland, `Returning a Benin Bronze to its rightful place: Benin City`:
  https://www.museumsgalleriesscotland.org.uk/sector-story/returning-a-benin-bronze-to-its-rightful-place-benin-city/
- Channels Television, `Another UK University Officially Hands Over Looted Benin Bronze`, 29 October 2021:
  https://www.channelstv.com/2021/10/29/another-uk-university-officially-hands-over-looted-benin-bronze/
- Channels Television, `Oba Of Benin Takes Delivery Of Looted 'Okpa,' 'Ilahor' Returned From UK`, 19 February 2022:
  https://www.channelstv.com/2022/02/19/oba-of-benin-takes-delivery-of-looted-okpa-ilahor-returned-from-uk/

## Executable coverage

- [Fixture](../../supabase/fixtures/phase-3-aberdeen-head.sql) and [SQL assertions](../../supabase/tests/database/phase-3-aberdeen-head.test.sql).

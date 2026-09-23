# Case 11: Request for the return of Hoa Hakananaiʻa

Status: implemented fixture and read-only explorer case.

## Purpose

Extend the restitution case-management model with an open, request-led process involving several joint requesters and subsequent institutional engagement without a recorded decision or handover.

The case must prove that:

- multiple organisations can share the requester role;
- a request can be followed by meetings and reciprocal visits;
- engagement does not imply approval, refusal or implementation;
- the absence of a decision is not represented as a denial;
- an existing object can independently expose provenance and restitution records without direct links between those modules.

## Object

Reuse the stable Hoa Hakananaiʻa item identity established for Case 07.

Do not create a second Hoa Hakananaiʻa item for Phase 3.

The existing provenance events and claims remain unchanged. The restitution case is associated with Hoa through a direct case-item link only.

The initial fixture concerns Hoa Hakananaiʻa alone. Later discussions also included Moai Hava, but multi-item scope is not required for this competency case.

## Case record

Suggested reference:

`RST-002`

Suggested title:

`Request for the return of Hoa Hakananaiʻa`

Operational status:

`open`

The case must not use a stored status such as:

- pending approval;
- denied;
- accepted;
- successful;
- unresolved.

`open` is an internal workflow state. The explorer may explain positively that a request and later engagement are recorded while no decision or handover action is present.

## Parties

The fixture should include:

| Agent | Case role |
|---|---|
| Council of Elders of Rapa Nui | requester |
| CODEIPA | requester |
| Municipality of Rapa Nui | requester |
| British Museum | respondent |

The three requesters must remain distinct agent identities. They must not be collapsed into one invented `Rapa Nui people` requester.

The fixture may associate Rapanui delegations and British Museum staff with particular engagement actions without requiring every individual participant to be named.

Party roles do not establish exclusive authority, legal standing or community representativeness beyond the administrative record of the case.

## Action history

### 1. Written request received

Kind:

`request`

Date:

month-level `2018-07`

Actors:

- Council of Elders of Rapa Nui;
- CODEIPA;
- Municipality of Rapa Nui.

Recipient:

British Museum

Description:

Joint written request to begin talks concerning the return of Hoa Hakananaiʻa.

The three requesters must be directly queryable from the action or its participating parties. What was requested is answered from this description and the associated incoming request document, not from a separate canonical remedy field.

### 2. Rapanui delegation visit

Kind:

`engagement`

Date:

month-level `2018-11`

Participants:

- representatives of the Rapanui community;
- British Museum.

Description:

A delegation from Rapa Nui made an official visit to the British Museum following the written request.

This action is not a response decision.

### 3. Reciprocal visit to Rapa Nui

Kind:

`engagement`

Date:

month-level `2019-06`

Participants:

- British Museum staff;
- Rapanui counterparts.

Description:

British Museum staff visited Rapa Nui to continue discussions and learn about cultural sites, the significance of the statues and community aspirations.

This action is not a handover, transfer or commitment to return.

### 4. Collections research visit

Kind:

`engagement`

Date:

month-level `2019-08`

Participants:

- Rapanui research group;
- British Museum.

Description:

The Museum hosted a Rapanui group for a research visit in the collections.

This fourth action is useful for proving that several engagements may follow one request without changing the case status or implying a decision.

## Documents

Associate at least:

1. British Museum, `Moai`.
   - document role: public case-status account;
   - associated with the case.
2. A reference to the July 2018 written request.
   - document role: incoming request;
   - associated action: written request received.

If the original request document is not locally available, the fixture may store a reference described by the British Museum page rather than inventing document content.

Documents are administrative case records. They are not claim evidence in this competency case.

## Competency questions

The database must be able to answer:

1. Which existing item does the case concern?
2. Is the case open or closed?
3. Who jointly submitted the request?
4. To which institution was the request addressed?
5. What was requested?
6. When was the request received?
7. Which engagement actions followed it?
8. Does the case contain any recommendation?
9. Does the case contain any decision?
10. Does the case contain any handover?
11. Has the restitution fixture altered the existing provenance records?
12. Can the item explorer show provenance and restitution as separate sections joined only by the item identity?

Question 5 is answered from the request action description and associated document. It must not require a controlled `requested_remedy` value.

## Required assertions

The competency test should require that:

- exactly one restitution case links to the existing Hoa Hakananaiʻa item;
- no duplicate Hoa item is created;
- the case is `open`;
- exactly three distinct requester parties are recorded;
- the British Museum is recorded as respondent;
- one request action is recorded for July 2018;
- the request action has all three requesting organisations;
- the request action description records what was requested;
- an incoming request document is associated with the request action;
- at least three later engagement actions are recorded;
- the November 2018, June 2019 and August 2019 engagements remain distinct;
- no recommendation action exists;
- no decision action exists;
- no handover action exists;
- no closed date exists;
- no refusal or approval value is inferred;
- no restitution action is represented as a `knowledge.claim`;
- no direct relationship to a provenance event is required;
- existing Case 07 provenance rows remain unchanged.

## Must not infer

The fixture must not infer:

- one canonical representative of all Rapanui people;
- that the request was accepted;
- that the request was refused;
- that a decision is pending in an external legal or institutional sense;
- that the British Museum committed to return either statue;
- that meetings or collaboration constitute a transfer;
- that the item moved;
- that custody or location changed;
- that Moai Hava is automatically included in the initial case;
- a direct restitution-to-provenance-event link;
- claims, asserting agents or evidence relationships for routine case actions.

## Explorer expectation

The Hoa Hakananaiʻa item page should expose separate sections for:

- provenance;
- restitution cases.

The restitution case page should begin with title, reference, open status and Hoa as the concerned item, then show:

- three requesting organisations;
- the British Museum as respondent;
- request and engagement history;
- associated documents.

The interface must not invent a free-text case summary. Absence of decision or handover must be visible from the recorded actions. The interface must not label the case `denied`, `approved`, `successful`, `failed` or `completed`.

## Source basis

- British Museum, `Moai`:
  https://www.britishmuseum.org/about-us/british-museum-story/contested-objects-collection/moai

## Executable coverage

- [Fixture](../../supabase/fixtures/phase-3-hoa-hakananai-a.sql) and [SQL assertions](../../supabase/tests/database/phase-3-hoa-hakananai-a.test.sql).

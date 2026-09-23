# Case 09: Benin Ama provenance

## Purpose

Test whether the provenance model generalises beyond Rapa Nui to a documented
colonial military removal followed by government custody, a possible temporary
museum loan and a later institutional gift, while keeping object-level claims
distinct from collection-level contextual evidence.

## Phase 1 entities

- **Item:** British Museum plaque `Af1898,0115.30`, depicting an Oba with
  mudfish legs holding two leopards
- **Agents:** British expeditionary force to Benin City; British Foreign
  Office; Secretary of State for Foreign Affairs; British Museum; Digital Benin
- **Places:** Oba's palace in Benin City; Benin City; United Kingdom
- **Sources:** British Museum object record; British Museum account of the
  Benin Bronzes; Digital Benin catalogue

## Provenance pressure

The British Museum object record identifies the plaque with the February 1897
British expedition and states that objects were looted by British forces from
the royal palace. It records that more than 300 plaques were sent to Britain
and placed at the Foreign Office, that 304 plaques were temporarily lent to the
British Museum in 1897, and that this group included plaques later given to the
Museum by the Secretary of State for Foreign Affairs.

The wider British Museum account describes objects taken during the occupation
as official "spoils of war". That collection-level wording is relevant to this
identified plaque, but its broader scope must remain visible in the evidence
relationship rather than becoming a second object-level characterisation.

Digital Benin identifies the Edo designation `Ama`, while the British Museum
uses "relief plaque". Both classifications should coexist.

## Candidate events

1. removal from the Oba's palace during the British expedition in February
   1897;
2. reported movement from Benin City to Britain and placement in Foreign Office
   custody;
3. provisional temporary loan from the Foreign Office to the British Museum in
   1897, retained only while the object record associates this registration with
   the plaque group later gifted to the Museum;
4. gift from the Secretary of State for Foreign Affairs to the British Museum
   in 1898.

## Required distinctions

- Military removal, international transport with Foreign Office placement,
  temporary loan and permanent institutional transfer are separate events.
- `looted by British forces` remains an attributed description, not a canonical
  event kind or legal conclusion.
- Collection-level context may qualify or contextualise an object-level claim
  without being presented as an individual shipping receipt or a second
  `described_as` claim.
- Reserve `supports` for facts tied to this object by its registration record,
  acquisition record or another individual identifier. Use `provides_context`
  for group-level acquisition history and corpus-level wording.
- The combined Britain/Foreign Office episode uses both `moved_item` and
  `transferred_item` deliberately because the source reports sending to Britain
  and placing the plaques at the Foreign Office as one episode.
- The 1897 temporary loan uses both `moved_item` and `transferred_item`, but
  its structural claims remain group-scoped `provides_context` evidence unless
  stronger individual membership is established.
- The 1898 gift uses `transferred_item` without `moved_item`; the plaque was
  already physically at the Museum.
- `gift` characterises only the 1898 institutional transfer and must not
  characterise the 1897 palace removal.
- Display order is derived from structured dates. Do not store `preceded_by`
  chains. Two 1897 events may coexist without a sourced total order.
- `Ama` and `relief plaque` are parallel sourced classifications.
- Current British Museum custody does not imply ownership, lawful title or a
  known storage location.

## Questions

- Can explicit military looting be represented without a canonical `stolen`
  status?
- Can palace removal remain distinct from transport to Britain?
- Can government custody remain distinct from museum custody?
- Can a physical temporary loan and a later non-physical gift remain separate
  without inventing object-level certainty the source does not give?
- Can source wording about a later gift avoid contaminating the earlier
  removal?
- Can collection-level evidence retain its broader scope?
- Can Edo and museum classifications coexist without selecting one as the
  canonical type?
- Can presentation order the events from dates without manufacturing a stored
  chronology?

## Pass condition

One stable item is linked to four separately dated provenance events. The
February 1897 removal is described as looted, with direct object-record support,
while "spoils of war" remains collection-level context on that claim. Foreign
Office custody, provisional temporary British Museum loan and the 1898 gift are
distinct. Group-level acquisition history uses `provides_context`. No claim
invents ownership, lawful title, a precise current location, restitution status,
a legal determination that the object was stolen, or an explicit event-chain
order.

## Implementation findings

- Four event anchors remain: palace removal; Britain/Foreign Office episode;
  provisional temporary loan; 1898 gift.
- `preceded_by` claims were not created. Dates distinguish 1897-02, 1897 and
  1898; the two year-level 1897 events coexist without a stored total order.
- "Looted by British forces" is the only removal `described_as` claim, with
  object-record `supports` evidence. The contested-objects page attaches
  `provides_context` with excerpt `official "spoils of war"`.
- Event 2 keeps both `moved_item` and `transferred_item` under one relocation
  episode. Its structural claims are evidenced with `provides_context` because
  the notes describe the plaque cohort, not an individual FO number.
- Event 3 retains the temporary loan as a provisional object-linked event whose
  structural claims are likewise `provides_context`. The competency does not
  treat group loan wording as an individual loan receipt.
- Event 4 keeps transfer-only gift claims with object-level `supports` from the
  acquisition name and date on this registration.
- Dual `classified_as` claims coexist with different asserting agents and
  sources.
- No ownership, legality, consent, restitution or storage-location conclusions
  were required.

## Out of scope

- restitution requests, negotiations or returns;
- deciding legal ownership or title;
- modelling the Benin Bronzes as one aggregate item;
- reconstructing an unsupported individual shipping route;
- identifying a precise British Museum storage location;
- deciding which modern body should receive the object;
- reintroducing explicit event-chain predicates.

## Executable coverage

- [Fixture](../../supabase/fixtures/phase-2-benin-ama.sql) and [SQL assertions](../../supabase/tests/database/phase-2-benin-ama.test.sql).

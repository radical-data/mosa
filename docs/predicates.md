# Collection predicates

Claims are source-attributed textual statements about an object. The reduced
model accepts these predicates:

| Predicate | Meaning |
| --- | --- |
| `has_name` | A name used for the object by this source |
| `classified_as` | A classification or object type used by this source |
| `described_as` | Source wording that does not fit a narrower predicate |
| `made_of` | Material attributed by the source |
| `made_at` | Place of making or creation |
| `made_during` | Date or period of making, preserving the source's precision |
| `found_at` | Place where the object was found or documented as found |
| `held_by` | Holding institution or agent reported by the source |
| `located_at` | Location reported by the source, which may be historical |
| `catalogue_number` | Institution or source catalogue identifier |

Values preserve source wording as text. Do not collapse different source
accounts into one synthetic fact. Add another source and claim when accounts
conflict.

`made_at`, `found_at`, `located_at` and `held_by` are distinct. Holding
does not imply ownership, consent or cultural authority. A catalogue number does
not establish object identity by itself.

The current model deliberately omits event participants, movement endpoints,
custody transitions and restitution actions. Add a new
predicate only when a real public record requires it and the distinction can be
explained with a competency case or ADR.

Optional claim `locator` text identifies a source passage; it is citation metadata.

Foregrounding refers to a claim ID from the same object. It expresses MoSA's
editorial salience, not certainty, publication approval or truth ranking.

# Case 03: “Moai curvo” identity

## Purpose

Test uncertain identity between two records without merging them prematurely.

## Entities

- **Item A:** Kunstkamera object, inventory `МАЭ № 736-205`
- **Item B:** Object shown or discussed in _The Lost Gods of Easter Island_
- **Agents:** Kunstkamera; David Attenborough or the documentary producer, where relevant
- **Sources:** Kunstkamera catalogue record; documentary or documentary record

## Expected claims

- The Kunstkamera source `refers_to` Item A.
- The documentary source `depicts` Item B.
- Item A `possibly_same_as` Item B.
- Item A has external identifier `МАЭ № 736-205`.
- Any shared descriptive similarities are recorded as separate sourced claims.

## Questions

- Can two possible identities remain separate?
- Can a claim point from one item to another item?
- Can uncertainty be expressed without creating a duplicate merge?
- Can sparse audiovisual and catalogue sources be represented consistently?

## Pass condition

The database preserves two item identities and records their possible equivalence as a claim rather than a merge.

## Implementation findings

- Two provisional item identities remained separate.
- Their possible equivalence was represented as an entity-valued claim rather than a merge.
- One identity hypothesis can have evidence from multiple sources.
- The identity hypothesis is attributed to the specific team member who recorded it.
- `possibly_same_as` is conceptually symmetric, although it is stored in one direction.
- Queries must therefore inspect both the subject and object sides of identity claims.

## Result

Pass. No schema change required.

## Executable coverage

- [Fixture](../../supabase/fixtures/phase-1-cases.sql) and [SQL assertions](../../supabase/tests/database/phase-1-cases.test.sql).

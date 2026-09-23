# Case 01: Hoa Hakananaiʻa

## Purpose

Baseline case for a well-documented item with several names, sources, agents and places.

## Entities

- **Item:** Hoa Hakananaiʻa
- **Agents:** British Museum; relevant Rapa Nui community authority
- **Places:** Rapa Nui; Orongo; London
- **Sources:** British Museum catalogue record; Paula's note; one community or Chilean institutional source

## Expected claims

- Each source `refers_to` the item.
- The item `has_name` “Hoa Hakananaiʻa”.
- The item `has_name` “ancestor figure”, attributed to the museum source.
- The item is `classified_as` a moai.
- The item is `made_of` basalt.
- The material is identified as `maʻea pupura`, attributed to the relevant source.
- The item is `held_by` the British Museum.
- The item is `located_at` London.
- The British Museum catalogue record is `published_by` the British Museum.
- Paula’s note is `authored_by` Paula Rossetti.

## Questions

- Can several sources describe the same item without being merged?
- Can multiple names and classifications coexist?
- Can institutional and community claims remain separately attributed?
- Can every claim point to an exact source locator?

## Pass condition

The item has one stable identity, while all names, descriptions and associations remain distinct, sourced claims.

## Implementation findings

- The schema represented multiple names, classifications, sources and entity relationships without overwriting information.
- Sources remained distinct from the item they describe.
- Item-centred queries work cleanly.
- Some institutional claims are currently known only through Paula's note.
- Secondary references use `mentions`; direct source evidence uses `supports`.
- Direct catalogue field locators should replace or supplement secondary references when available.
- The attributed `moai` classification is selected as an example foregrounded claim without changing the claim or its evidence.

## Result

Pass. No schema change required.

## Executable coverage

- [Fixture](../../supabase/fixtures/phase-1-cases.sql) and [SQL assertions](../../supabase/tests/database/phase-1-cases.test.sql).

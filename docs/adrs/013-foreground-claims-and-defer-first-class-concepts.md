# 013: Foreground selected claims and defer first-class Concepts

## Status

Accepted. Foregrounded-claim storage and its active projection are implemented.
First-class Concepts remain deferred.

## Context

MoSA preserves different names, classifications and descriptions as attributed
claims. Plurality does not choose a starting point for readers. MoSA is a situated,
collaborative and reparative project and accepts responsibility for editorial
salience: particular perspectives can shape the first encounter with an item.

Foregrounding is MoSA's editorial act, distinct from the speaker's assertion.
It does not make a claim universally true, intrinsically primary, representative
of an entire community or authorised for publication. Other accounts retain their
wording, attribution, evidence and availability. This position is **attributed
plurality with accountable foregrounding**, not an automatic equality or ranking
of every account.

Terms such as moai, moai kavakava, ivi tupuna, ta‘oa, mana and sacred geography
raised a separate question about reusable Concept entities. The terms include
classifications, qualities, relationships and interpretations of place, not one
universal hierarchy. Cultural significance alone does not decide their schema.

## Decision

Use `presentation.foregrounded_claim`, with `claim_id` as its sole column and
primary key, referencing `knowledge.claim(id)` with cascading deletion. A row
means MoSA selects this particular claim for its default presentation.

- Retain ordinary claim attribution, evidence, status and supersession.
- Permit several selected claims per item; the selection provides no ordering.
- Return only `active` claims from the foregrounding projection.
- Select claim by claim, never from a general rule about a predicate, speaker,
  institution, community or literal value.
- Removing a selection does not change the claim. Removing a claim leaves no orphan.
- Do not derive care, access, ownership, legality, consent or restitution outcomes
  from a foregrounded classification.
- Defer actor, rationale, timestamps, history, context, role and ordering columns
  until demonstrated workflows need them. Current storage does not supply an audit trail.
- Do not introduce first-class Concepts for this feature.

The single default presentation can later gain a context key if separate views
need separate choices. That is a new migration/decision, not a hidden interpretation
of the current relation.

## Alternatives considered

| Alternative | Decision |
| --- | --- |
| Preserve claims without recording foregrounding | Does not express a deliberate, queryable editorial selection |
| Infer prominence from predicates, speakers or wording | Hides choices in general rules and implies wider authority |
| Add global claim/Concept priority or authority flags | Conflates presentation with epistemic or ontological priority |
| Introduce Concept entities now | Defers unproven identity, definition and mapping responsibilities |
| Separate minimal presentation relation | Selected: explicit, reversible selection without changing claim meaning |

## Competency requirements

The implementation demonstrates that a classification/description can be selected
without changing the claim, attribution or evidence; other accounts remain intact;
several selections imply no truth ranking; duplicate selections fail; inactive
claims are excluded; claim deletion leaves no orphan; and classification produces
no automatic care/access/ownership/restitution conclusion. See
[the SQL tests](../../supabase/tests/database/foregrounded-claims.test.sql).

## When to reconsider Concepts

A separate ADR needs a named competency that cannot be represented cleanly through
attributed literal claims, their evidence and contextual sources. Ask whether users need:

1. An independently addressable Concept record or shared attributed definitions.
2. Cross-item queries across terms, spellings or translations whose equivalence
   is itself a documented interpretation.
3. Definitions revised or contested separately from their application to items.
4. Structured, precise relationships among Concepts that sources/excerpts cannot answer.
5. An explicit protocol or decision referring to a shared category, rather than
   separately identified items.
6. Relief from demonstrated duplication, information loss or an unanswered query
   in the existing representation.

If justified, Concepts remain project records rather than universal consensus.
Names and descriptions remain attributed claims; applying a Concept requires
evidence; original literal wording survives mapping. No Concept is intrinsically
primary. Uncertain equivalence cannot justify merging identities. Relationships
need specific competency-derived predicates, not generic `related_to` links.
Classifications still do not determine treatment or authority. Candidate terms and
unconfirmed relationships are research inputs, not an approved Concept corpus.

## Consequences

The model makes editorial position explicit with one relation, supports situated
perspectives without erasing disagreement, and permits later Concepts without
replacing claims. It deliberately lacks selection history, ordering and multiple
contexts. General definitions can remain contextual sources until reuse requires
independent identities. Those limitations should stay visible rather than be
filled with speculative ontology or implied governance guarantees.

## Intellectual context

This decision draws on work that treats knowledge and description as situated,
accountable practices rather than neutral views from nowhere:

- Donna Haraway, [“Situated Knowledges: The Science Question in Feminism and
  the Privilege of Partial Perspective”](https://commons.princeton.edu/hum583-f21/wp-content/uploads/sites/283/2021/08/Haraway-Situated-Knowledges.pdf),
  *Feminist Studies* 14, no. 3 (1988).
- Alison Wylie, [“What Knowers Know Well: Standpoint Theory and Gender
  Archaeology”](https://revistas.usp.br/ss/en/article/view/133641),
  *Scientiae Studia* 15, no. 1 (2017).
- Stephanie Russo Carroll et al., [“The CARE Principles for Indigenous Data
  Governance”](https://doi.org/10.5334/dsj-2020-043), *Data Science Journal* 19
  (2020).
- Local Contexts, [“Traditional Knowledge
  Labels”](https://localcontexts.org/labels/traditional-knowledge-labels/).
- Tonia Sutherland and Alyssa Purcell, [“A Weapon and a Tool: Decolonizing
  Description and Embracing Redescription as Liberatory Archival
  Praxis”](https://www.jstor.org/stable/48645295), *The International Journal of
  Information, Diversity, & Inclusion* 5, no. 1 (2021).
- Linda Martín Alcoff, [“The Problem of Speaking for
  Others”](https://depts.washington.edu/egonline/wordpress/wp-content/uploads/2010/05/Alcoff-Reading.pdf),
  *Cultural Critique* 20 (1991–1992).

These sources inform the distinction between preserving plural claims,
recognising the epistemic significance of social position, supporting agency in
description and making accountable editorial choices. They do not determine
which particular MoSA claim should be foregrounded; that remains a situated
project decision.

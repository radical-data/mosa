# Data entry: ontology politics and input efficiency

A discussion brief for deciding how people should enter research data into MoSA.

This note is descriptive. It does not recommend an approach.

---

## 1. Purpose

The database ontology is designed around decolonial research commitments: attributed claims, source disagreement, custody without ownership assumptions, and provenance that does not collapse into institutional narrative. That design makes the model strong as a research store. It also makes filling it feel heavy compared with a simple multi-table spreadsheet.

The team needs a shared picture of:

- what we are trying to achieve
- what the current model protects
- what is hard about entering data today
- which decisions need to be made before changing tooling or process

This document is the basis for that discussion.

---

## 2. Goal

Combine, as far as possible:

1. **The politics of the ontology** — claim-first storage, evidence, predicate discipline, competing accounts, restitution as a separate domain.
2. **The efficiency of Airtable-like data input** — a small number of obvious tables, fast row creation, low ceremony for the facts researchers actually need first.

A “properly good database” here means both: principled storage *and* a path that people can actually populate with real dossiers.

---

## 3. The Airtable mental model

If the project had started with the simplest possible research spreadsheet, it would likely have looked like five tables:

| Table | Typical contents |
| --- | --- |
| **Objects** | One row per cultural object / item |
| **Sources** | Documents, catalogue pages, records about objects |
| **Claims** | Statements about objects (and related entities) |
| **Events** | Provenance movements, transfers, holdings |
| **Restitution processes** | Cases, parties, actions, documents |

That shape is what people reach for when entry feels too complicated. It is a useful contrast, not a description of the current Postgres model.

---

## 4. What the ontology is protecting

These commitments are already encoded in ADRs, predicates, and schema. They are the politics that any easier input path still has to respect—or consciously change.

### Records vs facts

- **ADR 000** — Separate records from artefacts using a claim-first model.
- **ADR 006** — Derive facts emergently from claims and evidence rather than encoding derived conclusions.
- **ADR 010** — Entities have no preferred-name or notes columns. Names and meaning live in attributed `has_name` (and related) claims; UI labels are projections.

Consequence for entry: creating an “object” does not by itself give it a name, origin, or location. Those are claims, usually with evidence.

### Predicate distinctions that must not collapse

From [docs/predicates.md](predicates.md) and ADR 011:

| Distinction | Why it matters |
| --- | --- |
| `made_at` ≠ `found_at` ≠ `located_at` ≠ `moved_from` | Production place, findspot, current place, and movement origin answer different questions |
| `held_by` ≠ ownership / title / lawful possession | Custody is not ownership |
| `moved_*` ≠ `transferred_*` | Physical movement and institutional/interpersonal transfer are separable |
| Competing claims coexist | Disagreement is data, not an error to flatten into one cell |

### Evidence and attribution

- Claims are attributed (optional asserting agent) and linked to sources via `claim_evidence` (relationship, locator, excerpt conventions).
- ADR 012 requires every summary claim in a dossier packet to carry evidence with a locator, and an excerpt unless the evidence is visual or whole-document.

### Modular domains

- **ADR 001 / 002** — Claims, provenance, and restitution are distinct domains.
- Provenance events are research anchors; event detail is still claims ([docs/predicates.md](predicates.md) Phase 2 conventions).
- Restitution is operational case management (separate tables), not a claim graph. Recording a case does not automatically rewrite custody/provenance claims.
- **ADR 011** — Restitution cases sit below provenance in object-facing presentation; restitution *documents* surface under documents.

### Presentation vs schema

- **ADR 011** — Origin → current location → documents → provenance → everything else is a **projection**, not new columns on `item`.
- Explicit rejection: do not invent schema columns for “origin”, “documents”, or similar rollups.

---

## 5. What is most important to record first

### Reader priority (ADR 011)

For object-facing views, information is ordered as:

1. **Origin** — `made_at`, `made_during`, `found_at` (grouped for reading; kept distinct as predicates)
2. **Current location** — `held_by`, `located_at`
3. **Documents** — sources that describe, depict, evidence, or administratively document the object
4. **Provenance** — `provenance.event` and related claims
5. **Everything else** — remaining claims, restitution summaries, identifiers, record metadata

### First population pass (ADR 012)

Real data enters as validated **object dossier** packets. The first importer’s intended summary set is:

- an object
- its external identifiers
- the sources that document it
- a small set of summary claims: name, reported origin, current location, current holder

Allowlisted predicates today: `has_name`, `made_at`, `found_at`, `located_at`, optionally `held_by`, plus source `refers_to` relationships.

ADR 012 also states: unknown “from” information must not be coerced into `made_at`; `made_at`, `found_at`, and `located_at` remain semantically distinct. Comprehensive claim extraction (including AI-assisted) is a later layer and must not block basic object registration.

---

## 6. How data enters today

| Path | Role | Audience |
| --- | --- | --- |
| `supabase/fixtures/*.sql` + `pnpm db:fixtures` | Deterministic competency / test data; reserved UUIDs; delete-then-reinsert | Local development and tests only |
| `supabase/seed.sql` | Tiny synthetic stub | Local; not the real-data path |
| Object-dossier packets + importer (ADR 012) | **Only write path for real data** | Staging / production population |
| Explorer (`apps/explorer`) | Read-only projections | Readers |
| Forms / CSV / Airtable / admin write UI | Not present | — |

### Packet importer rules (current)

- Packets are versioned JSON validated against [schemas/object-dossier-packet.schema.json](../schemas/object-dossier-packet.schema.json).
- Packets use symbolic local keys (e.g. `item:hoa-hakananai-a`); PostgreSQL generates canonical UUIDs; [ingestion](../supabase/migrations/20260728150000_create_object_dossier_ingestion.sql) bindings connect the two.
- Identity resolution: binding-first, then exact external identifier or exact source reference — **never by name**.
- One transaction per import; identical successful checksum re-run is a no-op.
- Bootstrap packets live under [packets/bootstrap/](../packets/bootstrap/); see [packets/bootstrap/README.md](../packets/bootstrap/README.md).

### Explicitly out of v1 importer scope

From the bootstrap README and ADR 012 deferred work:

- Provenance event graphs
- Restitution case records
- Many predicates present in fixtures (`classified_as`, `made_of`, `described_as`, `made_during`, etc.)
- Non-URL research notes and bare-file photographs (several fixture cases blocked until an absolute http(s) source exists)
- Full artifact preservation (ADR 005) and AI staging tables

So: the **schema** already supports more than the **real-data write path** can load.

---

## 7. Where friction comes from

### Multi-hop setup for one object fact

To state “this object is called X and is held by Y,” an author typically needs:

1. The item entity
2. Often a source entity (URL, kind, retrieved-at)
3. Often place and/or agent entities for location and holder
4. `has_name` claims for those places/agents (labels are not stored on the entity)
5. Summary claims on the item (`has_name`, `made_at` / `found_at`, `located_at`, `held_by`)
6. Evidence rows per claim (source, relationship, locator, excerpt)

The Hoa example packet ([schemas/examples/hoa-hakananai-a.packet.json](../schemas/examples/hoa-hakananai-a.packet.json)) illustrates the hop count for a single well-documented object.

### Authoring surface vs storage shape

| Airtable-like intuition | Current MoSA requirement |
| --- | --- |
| Object has a name field | Name is a `has_name` claim with evidence |
| Object has “from” | Must choose `made_at` and/or `found_at` (and not invent when unknown) |
| Object has location / museum | Split across `located_at` (place) and `held_by` (agent) |
| One claims table | Subject, predicate, object-entity XOR literal, asserted-by, status, supersession |
| One events table | Event entity + `event_kind` + many role-bearing claims + evidence |
| One restitution table | Case + items + parties + actions + action parties + documents + action documents |

### Importer narrower than the research model

Researchers following ADR 011 will want provenance (tier 4) and often restitution context. Those exist in schema, fixtures, and Explorer reads, but not yet in the dossier importer allowlist.

### Source constraints

v1 sources are URL-based. Cases evidenced only by local research notes or non-URL media cannot enter through the current real-data path without a different source strategy.

### Provenance modelling cost

A single movement or transfer is not one row: it is an event anchor plus a graph of role claims (`moved_item` / `transferred_item`, from/to, agents, dates, `described_as`, etc.), each with evidence. Wrong predicate choice is a modelling failure, not a database constraint error.

### Restitution modelling cost

Restitution uses multiple junction tables, fuzzy date shapes, and composite FK rules (e.g. action documents must belong to the same case). It is intentionally not claim-shaped, so it is a second write vocabulary beside the claim graph.

---

## 8. Relevant parts of the repo

| Area | Paths |
| --- | --- |
| Ontology / presentation ADRs | [docs/adrs/000](adrs/000-separate-records-and-artifacts.md)–[012](adrs/012-object-dossier-ingestion.md), especially [010](adrs/010-derive-entity-display-labels.md), [011](adrs/011-object-information-hierarchy.md), [012](adrs/012-object-dossier-ingestion.md) |
| Predicate vocabulary | [docs/predicates.md](predicates.md) |
| Phase boundaries | [docs/phase-1.md](phase-1.md), [phase-2.md](phase-2.md), [phase-3.md](phase-3.md) |
| Schema (entities, claims) | [supabase/migrations/20260717122312_create_phase_1_entities_and_claims.sql](../supabase/migrations/20260717122312_create_phase_1_entities_and_claims.sql), helpers/read models in `20260717140000_*` |
| Provenance events | [supabase/migrations/20260717160000_phase_2_provenance_events.sql](../supabase/migrations/20260717160000_phase_2_provenance_events.sql) |
| Restitution | [supabase/migrations/20260724140000_phase_3_restitution_case_management.sql](../supabase/migrations/20260724140000_phase_3_restitution_case_management.sql) |
| Ingestion bookkeeping | [supabase/migrations/20260728150000_create_object_dossier_ingestion.sql](../supabase/migrations/20260728150000_create_object_dossier_ingestion.sql) |
| Packet contract | [schemas/object-dossier-packet.schema.json](../schemas/object-dossier-packet.schema.json), [schemas/examples/hoa-hakananai-a.packet.json](../schemas/examples/hoa-hakananai-a.packet.json) |
| Importer | [scripts/import-object-dossier.ts](../scripts/import-object-dossier.ts), [scripts/lib/object-dossier/](../scripts/lib/object-dossier/) |
| Bootstrap real-data packets | [packets/bootstrap/](../packets/bootstrap/), [packets/bootstrap/README.md](../packets/bootstrap/README.md) |
| Test fixtures (not production content) | [supabase/fixtures/](../supabase/fixtures/) |
| Read UI | [apps/explorer/](../apps/explorer/) |

---

## 9. Tensions

These are paired pressures. The document does not resolve them.

| Tension | One pole | Other pole |
| --- | --- | --- |
| Politics vs speed | Preserve claim, evidence, and predicate discipline | Enter dossiers quickly with few steps |
| Storage vs mental model | Thin entities + claim graph in Postgres | Five familiar tables (objects, sources, claims, events, restitution) |
| Schema vs write path | Phase 2/3 schema and fixtures already express provenance and restitution | ADR 012 importer only loads summary dossier claims |
| Hierarchy vs entry shape | ADR 011 is a **read** order (origin → location → documents → provenance) | Authors may want an **entry** order that does not match storage hops |
| Explicitness vs sugar | Every entity, claim, and evidence row spelled out | Defaults, nesting, or compilers that expand short authoring forms |
| Attribution vs convenience | Every claim evidenced and attributed | Spreadsheet cells that feel like “the fact about the object” |
| Provenance vs restitution | Historical movement/transfer claims | Operational case management that must not silently rewrite history |
| Completeness vs honesty | Rich dossiers covering tiers 1–5 | Sparse objects with visible empty tiers (ADR 011) |
| Solo JSON vs multi-author tools | Hand-authored packets in git | Shared editors (forms, spreadsheets, Airtable, etc.) |
| URL sources vs research notes | Absolute http(s) sources with retrieval timestamps | Local notes, files, and non-URL evidence already used in fixtures |
| Identity safety vs ease of linking | Never match entities by name; bindings and external IDs | Authors naturally think in names and want autocomplete-by-label |
| Idempotent packets vs ongoing edit | Checksum no-op and binding-stable reloads | Correcting, superseding, and extending live dossiers over time |
| Test data vs canonical data | Destructive fixture reload with reserved UUIDs | Non-destructive real imports that must not be entangled with migrations |

---

## 10. Decisions to make

Open questions for the team. No answers implied.

### Authoring and tooling

1. **Authoring surface** — What should people type into first: raw packets, a more ergonomic packet/JSON shape, local spreadsheets/CSV, an external tool (e.g. Airtable), a form/admin UI, or something else?
2. **Who authors** — Solo maintainer, small research team, external collaborators, or mixed? Does that change the surface?
3. **Where authored files live** — In-repo (like bootstrap packets), private/out-of-repo sensitive packets, or only in an external system until import?
4. **Compiler vs direct write** — If the authoring shape is not the packet schema, is there an intermediate compile-to-packet step, or a separate write path into Postgres?

### Scope of “easy” entry

5. **v1 easy path coverage** — Which of ADR 011 tiers must be easy on day one: summary only (origin, location, documents), provenance events, restitution, or all five Airtable-like tables?
6. **Predicate breadth** — Stay on the ADR 012 allowlist, widen to more predicates already in [docs/predicates.md](predicates.md), or allow free-form predicates with review?
7. **Source kinds** — Remain URL-only for real imports, or admit research notes / files / non-http references (and under what preservation rules relative to ADR 005)?

### Fidelity and defaults

8. **How much expansion is acceptable** — May an authoring layer auto-create places/agents, `has_name` claims, evidence keys, or `refers_to` links from shorter input? If so, what must remain explicitly human-authored?
9. **Uncertainty and disagreement** — How should competing claims, `qualifies` evidence, and “unknown from” be entered without coercion into the wrong predicate?
10. **Identity UX** — How do authors link to existing entities without name-matching becoming a silent merge?

### Lifecycle

11. **Create vs update** — Is the first problem greenfield dossier creation only, or also correction, supersession, and incremental enrichment of already-imported objects?
12. **Events and restitution timing** — When do those domains join the real-data write path relative to summary dossiers?
13. **AI / extraction** — ADR 012 defers AI proposals to staging/review. Does that affect near-term authoring priorities?

### Success criteria

14. **What “efficient enough” means** — Time-to-first-dossier? Rows per hour? Ability for a non-engineer to add an object? Coverage of ADR 011 empty tiers? Something else?
15. **What must never be sacrificed** — Which ontology commitments are non-negotiable even if they cost entry speed?
16. **Evaluation cases** — Which real objects or fixture-derived dossiers define “we can fill the database”?

---

## 11. Appendix: what one summary dossier requires today

Illustrative shape from the Hoa Hakananaiʻa example packet (synthetic documentation example under `schemas/examples/`). Counts vary by object; this shows the *kinds* of records, not a fixed quota.

**Entities to declare**

- 1 item (the object), with external identifiers pointing at a source
- 1+ agents (e.g. holding institution; often also asserting party)
- 1+ places (production, findspot, current location — as applicable)
- 1+ sources (absolute URL, `source_kind`, `retrieved_at`, `about` the object)

**Claims typically required for a minimal ADR 012 summary**

- `has_name` on the item
- `has_name` on each agent/place that should display a label
- Origin: `made_at` and/or `found_at` when known (not coerced)
- Current state: `located_at` and/or `held_by` when known
- Each claim: evidence block (source, relationship, locator, excerpt as required)

**Not in that summary packet (but present elsewhere in the project)**

- Provenance event graphs (Phase 2 fixtures / Explorer)
- Restitution cases (Phase 3 fixtures / Explorer)
- Broader predicates (materials, classifications, descriptions, etc.)

Commands for the current real-data path are documented in [packets/bootstrap/README.md](../packets/bootstrap/README.md).

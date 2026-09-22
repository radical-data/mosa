# Load real data through a transactional object-dossier importer

## Status

Accepted

## Context

Until now, every record in the database has been deterministic test data: fixtures with reserved UUID ranges, loaded by scripts, designed to be deleted and reinserted. Real research data has no entry path. Writing it into `seed.sql` or migrations would entangle content with schema history; copying the fixture pattern would require hand-assigning canonical UUIDs and would make repeat loads destructive.

The project now needs to populate a database with actual object dossiers: an object, its external identifiers, the sources that document it, and a small set of summary claims (name, reported origin, current location, current holder). Comprehensive claim extraction — including AI-assisted extraction — is a later layer and must not block basic object registration.

ADR 005 commits the project to preserving and versioning external records on ingest. Full artifact preservation (downloaded files, content hashes, object storage) is more infrastructure than the first population pass needs.

## Decision

Real data enters the database through a small, transactional, idempotent importer that consumes validated "object dossier" packets. The importer is the only write path for real data; `seed.sql` and migrations remain schema-and-test-data only.

A packet is a versioned JSON document validated against `schemas/object-dossier-packet.schema.json`. It refers to records by symbolic local keys such as `item:hoa-hakananai-a` and never contains canonical UUIDs. PostgreSQL generates every canonical identifier via the existing `entities.create_*` functions and `insert ... returning id`.

Repeatability comes from bookkeeping tables in a new `ingestion` schema — `dataset`, `run`, and per-dataset bindings from local keys to canonical rows — not from deterministic UUIDs derived from keys.

Therefore:

- fixtures remain deterministic test data and are unchanged by ingestion;
- objects may exist before comprehensive claim extraction;
- sources are registered before, or together with, the summary claims they evidence;
- names and locations remain attributed claims, never columns on the object;
- the first importer supports only `has_name`, `made_at`, `found_at`, `located_at`, optionally `held_by`, and source `refers_to` relationships; unsupported predicates are rejected, not silently accepted;
- unknown "from" information must not be coerced into `made_at`; `made_at`, `found_at` and `located_at` remain semantically distinct;
- every summary claim carries evidence with a locator, and an excerpt unless the evidence is visual or whole-document;
- sources are URL-based for now: a `source_kind`, an absolute URL in `reference`, and a `retrieved_at` timestamp; evidence locators and excerpts preserve what the page said at retrieval time;
- entity identity is resolved binding-first, then by exact external identifier or exact source reference; never by name matching; an identifier that points to an incompatible entity type fails the import instead of creating a duplicate;
- each import is one database transaction guarded by a per-dataset advisory lock; a rerun of an already-succeeded packet checksum is a no-op;
- AI-generated claims will later enter a staging area for review, not canonical tables directly; the packet schema is the intended output contract for such proposals.

## Consequences

### 2026-09-22 extension: preserve catalogue wording semantics

Packet schema version 2 adds text-valued `classified_as` and `described_as` claims. The capture form distinguishes a name from an object type or description instead of coercing every catalogue label into `has_name`. Version 1 retains its original allowlist; existing packets remain valid and repeatable. Custody and identifiers may remain unresolved in research. The current public-card contract still requires an evidenced name, holder and identifier.

### Benefits

- Real data can be loaded, audited and reloaded without touching schema history or fixtures.
- Canonical UUIDs stay database-generated; packets stay portable and reviewable.
- Failed imports leave no partial dossiers; repeated imports create no duplicates.
- The packet schema gives later AI extraction a strict, validated contract.
- Private or sensitive packets can live outside the repository; only the schema and a synthetic example are committed.

### Costs

- A new `ingestion` schema and importer code must be maintained alongside fixtures.
- Bindings must be kept consistent with canonical rows.
- The strict predicate allowlist means richer dossiers need importer changes before they can be loaded.
- Source preservation is deferred: a changed or vanished web page leaves only the recorded URL, retrieval timestamp, locator and excerpt.

These costs are accepted because the alternative — hand-written SQL or fixture-style loads for real data — would either freeze content into migrations or normalise destructive reloads of canonical records.

## Deferred work

- **Artifact preservation** (ADR 005): an additive `ingestion.artifact_version` table recording downloaded files, content hashes, media types and storage URIs per source. No existing entities, sources, claims, evidence or UUIDs need to change when it arrives. Downloads happen outside the import transaction.
- **Bootstrap rollout**: bootstrap packets for URL-backed dossiers live under `packets/bootstrap/` (`dataset.key = mosa-bootstrap`). Remaining fixture cases without absolute http(s) sources, and all non-allowlisted claims (provenance events, restitution, classifications, etc.), stay deferred. Staging/production apply: validate with `just db-import-bootstrap-check`, dry-run then `--apply` against a write role, confirm an immediate re-run reports a no-op. Do not load fixture SQL into staging or production.
- **AI staging**: extracted claims land in staging tables for review before promotion to `knowledge.claim`.

## Alternatives considered

| Alternative | Reason rejected |
| --- | --- |
| Load real data via `seed.sql` or migrations | Entangles content with schema history; production applies migrations only and forward-only. |
| Extend the fixture pattern with reserved UUIDs | Fixture loads are delete-then-insert and hand-numbered; destructive and unscalable for canonical data. |
| Derive deterministic UUIDs from packet keys | Couples canonical identity to packet spelling; renaming a key would fork the entity. Bindings decouple them. |
| Allow arbitrary predicates in the first importer | Unvalidated claims would bypass the vocabulary discipline in `docs/predicates.md`. |
| Match existing entities by name | Names are attributed claims and collide; silent merges are worse than reviewable duplicates. |
| Build artifact storage now | URL plus retrieval timestamp plus evidence excerpts is sufficient for the first pass; storage is purely additive later. |

## Principle

> Real data enters through validated packets and one transaction. PostgreSQL owns every canonical identifier; packets own only symbolic keys; bindings connect the two.

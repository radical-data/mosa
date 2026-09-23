# 012: Load real data through a transactional object-dossier importer

## Status

Accepted; extended by packet v2/v3 and [local bundle preparation](017-local-research-bundles.md).

## Context

Synthetic fixtures use reserved UUIDs and destructive reloads. Using that pattern
for real research would make imports unsafe; putting research in migrations would
entangle content with schema history. Initial registration needed summary dossiers
without waiting for comprehensive extraction or source-file storage.

## Decision

Use one shared validator, identity resolver and transactional importer for canonical
dossiers, called by the CLI and research acceptance. The
[packet schema](../../schemas/object-dossier-packet.schema.json) defines supported writes.

- PostgreSQL creates canonical identities. Packets use symbolic entity keys;
  per-dataset bindings retain their canonical IDs across imports.
- Resolve bindings first, then exact catalogue identifiers for items and exact
  references for sources. Reject incompatible matches; names never merge identities.
  The capture service binds explicitly reviewed existing items/institutions before
  import. A common source URL does not prove object identity.
- Guard each import with a transaction and per-dataset advisory lock. A successful
  packet checksum replay is a no-op. Failed imports leave no partial dossier.
- Require evidence and preserve attribution. Distinguish names, classifications,
  descriptions, production, findspot, current location and custody; reject unsupported
  predicates instead of substituting a convenient one.
- Preserve bound claims/evidence on reimport. A changed packet is not a correction
  operation; supersession needs a separate controlled write contract.
- Keep fixtures/migrations separate from real research. Private packets stay outside
  Git; reviewed bootstrap candidates do not constitute publication approval.

## Contract evolution

| Version | Change |
| --- | --- |
| v1 | Initial URL sources and summary claims: `has_name`, `made_at`, `found_at`, `located_at`, `held_by`; importer derives source `refers_to` links |
| v2 | Adds `classified_as` and `described_as`, preserving catalogue wording rather than coercing it into a name |
| v3 | Adds immutable source/evidence-version references and internal document references; preserved-version UUIDs coexist with symbolic entity keys |

URL-only drafts produce v2; preserved-source drafts produce v3. Existing v1/v2
checksums and replay semantics remain unchanged. A later capture cannot prove what
an earlier unarchived URL contained. General provenance, restitution, materials,
dimensions and corrections remain outside the summary importer.

## Alternatives considered

| Alternative | Reason rejected |
| --- | --- |
| Real data in seeds/migrations or fixture-style reloads | Entangles content with schema changes and permits destructive reloads |
| Canonical UUIDs derived from packet keys | Renaming a key would change identity; bindings decouple them |
| Arbitrary predicates | Bypasses the validated write vocabulary |
| Matching by name | Colliding attributed names would cause silent merges |
| Source storage as an initial prerequisite | Delayed basic registration; v3 later added preservation without replacing identities |

## Consequences

Imports are repeatable and atomic, but bindings and a strict write contract need
maintenance. Richer authoring requires deliberate extensions; UI convenience cannot
bypass identity, evidence or transaction rules. URL-only evidence remains vulnerable
to upstream change, while preserved sources add storage/access responsibilities.
Research acceptance and public-card eligibility remain separate.

# 026: Share campaign documents and existing research registers

## Status

Accepted for implementation. The [research guide](../research.md) defines the
minimal delivery and the [roadmap](../roadmap.md#shared-research-programme)
tracks progress.

## Decision

Keep focused campaigns as ordinary Markdown documents in tracked `research/`.
Share the existing source-based progress registers and selected evidence there.
Use campaign prose for unresolved leads before objects exist, and retain the
register's identity, capture, claims and image stages for established objects.

Reuse public collection source identities, optional claim locators and captures
from [ADR 024](024-preserve-source-captures.md) and
[ADR 025](025-retain-competencies-in-the-git-collection.md). Research notes do not
create public objects or claims and add no publication approval stage.

Keep confidential material and uncleared assets in ignored local staging.
Repository access is disclosure even when files are excluded from the website.
Human assistance uses ordinary conversation and supplied files; agents handle
inspection, capture registration and progress recording.

Adapt the current CLI rather than add a research application. Shared registers
are authoritative; preserve old local copies without dual-writing. Keep research
out of the website and Docker context. Verify the IndiGen migration and one
bounded discovery pilot before extending the approach.

## Rationale and consequences

Local bundles lose useful decisions between contributors. A shared campaign
brief and the existing tested register solve the immediate problem with less
administration than separate campaign, lead and activity schemas. This replaces
the earlier unimplemented proposal for a general activity system.

The register remains one file per source, so concurrent changes may require Git
conflict resolution. Accept that cost until actual use justifies a different
structure. Do not migrate or classify every scratch file. Retain useful history
incrementally and leave private legacy material in place.

This does not revive the former database or bundle importer described in
[ADR 017](017-local-research-bundles.md).

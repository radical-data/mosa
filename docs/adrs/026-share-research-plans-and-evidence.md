# 026: Reuse collection sources and keep research coordination optional

## Status

Accepted and implemented. Revised on 2026-09-30 after the first shared-workspace
pilot exposed unnecessary duplication and review bookkeeping. The
[research guide](../research.md) defines the current workflow.

## Decision

Use collection sources as the single maintained record of attribution, claims
and source-specific research decisions. An examined publication can have a
source record before its objects are reconciled. Keep shareable source captures
in `source-files/`, with metadata in that same source, as defined by
[ADR 024](024-preserve-source-captures.md). No separate research source catalogue
or general evidence store is needed.

Use optional Markdown campaigns for bounded questions, unresolved work and next
actions. A source-entry inventory is a working aid, not a new record type or
required deliverable. Retain a shared attachment only when it saves repeated
work; reference the existing source instead of copying its metadata. Normal
imports need no campaign, separate report or progress register.

Retain the existing IndiGen register and its useful historical context. Registers
remain optional for substantial recurring follow-up. They describe scoped work,
not publication eligibility or universal object completeness. Source drift is
an advisory cue for the next relevant review, not a validation failure. Research
checks are explicit and do not gate website verification. Git and CI own change
and validation history; new research batches need not copy their logs.

Restricted originals, raw extracts and private correspondence stay in ignored
local staging. Review our factual transcriptions separately from restrictions
on redistributing originals. Human assistance uses ordinary conversation and
supplied files, without a handover subsystem. Repository visibility remains
distinct from website publication.

## Rationale and consequences

The initial implementation reused an existing register but added a general
research evidence directory, repeated source findings and made research drift
fail website CI. These created costs for a tiny team. This revision removes
those responsibilities rather than adding another abstraction to manage them.

Shared registers remain authoritative over legacy local copies; no dual-writing.
The IndiGen migration history is a frozen attachment, not a template for future
reporting. One file per register can require ordinary Git conflict resolution;
accept that until actual use justifies more tooling. Preserve useful historical
work without reconstructing every past session.

The collection model and claim locators from
[ADR 025](025-retain-competencies-in-the-git-collection.md) remain unchanged.
This does not revive the old bundle importer in
[ADR 017](017-local-research-bundles.md).

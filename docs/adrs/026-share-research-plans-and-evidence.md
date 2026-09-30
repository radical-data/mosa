# 026: Coordinate discovery and retain useful research evidence

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
or evidence schema is needed.

Use Markdown campaigns to coordinate systematic discovery of Rapa Nui cultural
material abroad. A campaign records its rationale and scope, planned search
routes and terms, dated coverage, concise candidate outcomes, links and
remaining integration. The incorporate-source skill owns the end-to-end
procedure; the research guide owns strategy and coordination; collection
authoring owns record rules. The default for an in-scope candidate is complete
integration. A narrower pass is permitted when stated explicitly. Object
creation alone does not complete an import.

A source-entry inventory is a working aid, not a new record type or required
deliverable. Do not copy accepted claims, catalogue fields or complete
inventories into a campaign. Search queries are not collection sources; a
substantive publication or catalogue may be registered with a relevance note
before object identity is established. Retain ordinary research files locally.
An optional `research/evidence/<campaign-id>/` file is justified only when it
supports an unresolved candidate or consequential decision, is difficult to recover, or prevents
substantial repeated work. Prefer a concise note with links.

Retain the existing IndiGen register and its useful historical context. Registers
remain optional for substantial recurring follow-up. They describe scoped work,
not publication eligibility or universal object completeness. Source drift is
an advisory cue for the next relevant review, not a validation failure. Research
checks are explicit and do not gate website verification. Git and CI own change
and validation history; new research batches need not copy their logs.

Restricted originals, raw extracts and private correspondence stay in ignored
local staging. Review our factual transcriptions separately from restrictions
on redistributing originals. Human assistance uses ordinary conversation and
supplied files, without a handover subsystem. Anonymous URL capture can be
staged before a source ID is known. Registered source captures are durable
verification evidence, separate from disposable research staging. Repository
visibility remains distinct from website publication.

## Rationale and consequences

The initial implementation reused an existing register but added a general
research evidence directory, repeated source findings and made research drift
fail website CI. These created costs for a tiny team. Removing all research evidence then
overloaded collection sources with search activity. The correction separates
substantive sources from campaign coverage and selectively retained evidence.
Systematic candidate
discovery still needs a durable shared plan so departments, terms, pagination,
candidate decisions and unfinished integration survive between sessions. A
campaign provides that coordination without becoming a parallel catalogue or
claim ledger. The optional evidence path has a high retention threshold and no
manifest or mandatory report.

Shared registers remain authoritative over legacy local copies; no dual-writing.
The IndiGen migration history is a frozen attachment, not a template for future
reporting. One file per register can require ordinary Git conflict resolution;
accept that until actual use justifies more tooling. Preserve useful historical
work without reconstructing every past session.

The collection model and claim locators from
[ADR 025](025-retain-competencies-in-the-git-collection.md) remain unchanged.
This does not revive the old bundle importer in
[ADR 017](017-local-research-bundles.md).

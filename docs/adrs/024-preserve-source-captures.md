# 024: Preserve source captures outside the website

## Status

Accepted. Implements [ADR 005](005-preserve-and-version-external-records.md) and
extends [ADR 020](020-use-a-git-backed-public-collection.md).

## Decision

Keep optional capture metadata inside the existing source JSON. Store original
PDFs, self-contained HTML captures and independent image files under
`source-files/<source-id>/`, tracked with Git LFS. Retain readable source handles
and the flat source-record namespace from ADR 022. Do not introduce a second
source manifest or bibliography.

Capture registration is separate from website publication. The archive stays out
of the Docker build context, public routes and collection search. A source link
and its claims retain the existing publication behaviour. Repository access still
grants access to the archive; confidential or unauthorised material remains in
ignored local research.

Use SingleFile through pinned repository tooling to prepare webpage captures in
ignored staging. Discovery may stage an anonymous URL capture before a source ID
is known; this does not create a collection source. Review the saved record
before registration. Registration under the identified source makes the capture
durable evidence for later verification. Preserve original PDF and image bytes.
Retain successive captures under distinct readable names;
reuse identical bytes within a source. Unknown historical capture dates remain
unknown. An exact archive URL can supplement a local capture or record an
archive-only fallback. A capture does not establish that a claim is supported.

## Alternatives and consequences

A separate research manifest duplicates source identity and attribution. A folder
per source would change the recently simplified record contract. Archive links
alone do not satisfy local preservation. The chosen arrangement adds one optional
source field and one binary directory without another service.

Website CI restores published images only. Capture checks accept well-formed LFS
pointers; explicit content checks require hydrated files. Full backups must include
LFS objects. Neither live websites nor a browser are dependencies of the build.

Candidate discovery is coordinated by optional campaigns under the research
guide. Object identification and publication remain governed by the collection
authoring guide. An examined publication can have a source record before object
reconciliation; a capture alone does not verify an object match. Registered
captures are retained source evidence, not disposable research working files.

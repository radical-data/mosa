# 005: Preserve and version external sources

Preserve and version external records on ingest so evidence can refer to the content that was inspected.

URL-only entry remains explicitly unarchived; a later capture cannot establish
what an earlier page contained.

## Implementation

Source capture metadata and repository-only Git LFS files implement this decision
under [ADR 024](024-preserve-source-captures.md). Capture registration preserves
known retrieval dates; a later capture is not evidence of an earlier page.

# 019: Publish reviewed objects from the database

## Status

Accepted.

## Context

The first public collection workflow committed an approved JSON snapshot to Git
and deployed a new static website image for every object. That protected the
publication boundary, but made routine research additions depend on a developer
and a hosting release. The intended local-agent workflow needs a researcher to
review a draft and publish it directly.

## Decision

- A researcher's **Publish** action accepts the reviewed revision and writes
  its strictly validated public projection in one database transaction.
- Keep private drafts, agent notes and preserved source files outside that
  projection. Legacy cards need complete public evidence; dossiers can retain
  explicitly unknown fields.
- The explorer exposes only visible public projections through a read-only JSON
  endpoint. The website renders collection pages from that endpoint on each
  request, without database credentials or a per-object build.
- Carry the records from the previously approved desired release into the new
  table at migration time. Retain the old release ledger as audit history.
- A publisher can hide an object immediately. A hidden record cannot be
  republished by a researcher until a maintainer clears it for a new review.

## Consequences

Acceptance now includes public-display consent, so reviewers must check exact
wording and evidence before clicking Publish. If the public feed is unavailable,
collection pages return 503 rather than showing a potentially withdrawn static
copy. Website code still deploys from Git, but content changes do not. Canonical
claim correction remains separate: replacing a public projection does not erase
older accepted claims.

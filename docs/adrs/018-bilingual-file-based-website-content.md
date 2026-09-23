# 018: Keep bilingual website content in local files

## Status

Accepted. The owner simplified the website editorial workflow on 2026-09-15,
replacing proposed translation-revision and approval gates with manual review.

## Context

MoSA needs complete Chilean Spanish and British English public pages with shared
layout, editable copy and explicit language selection. Initial English prose is
AI-assisted and still needs human review. Technical correctness is useful during
development without making every wording change wait for a formal editorial system.

## Decision

- Keep the public site static. Use `/es/` and `/en/` routes, with `es-CL` and `en-GB`
  content/formatting conventions and Spanish as default. Use ordinary links to
  equivalent pages without inferred-language redirects or cookies.
- Share templates and keep paired copy in local JSON files. Use one bilingual
  file per event under [ADR 016](016-events-as-single-content-files.md).
- Require message structure and non-empty values in both languages. Permit
  existing wording to change independently; track translation debt manually.
- Run technical build checks without content hashes, approval fields, revision
  state machines or special review builds. Review wording at release milestones.
- Preserve original names, source languages and date precision. Rapa Nui
  collaborators determine terminology, orthography and translation authority.
- Retain the existing funding acknowledgement/logo. A full Dutch or Rapa Nui
  interface is deferred; grant-specific commitments require project evidence.

## Alternatives and consequences

A CMS may help actual editors but adds hosting, permissions, preview and migration
work. Trial it only after a demonstrated editing need; no product is selected here.
Formal translation revision tracking may be appropriate for future research
publication, where source and translated revisions need their own authority.
It is not a requirement for ordinary website copy today.

Builds cannot certify linguistic quality, freshness or community approval. A
maintainer must track incomplete review and remove withdrawn copy from both
languages and repeated sections. Static event archiving changes on rebuild.
Research claims and public collection snapshots keep their distinct validated,
revision-specific publication process.

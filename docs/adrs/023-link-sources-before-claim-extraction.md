# 023: Link sources before claim extraction

## Status

Accepted and implemented. Extends
[ADR 020](020-use-a-git-backed-public-collection.md).

## Context

Museum catalogue records are useful public sources before MoSA has transcribed
their claims or obtained an image it can publish. The reduced Git collection
currently associates a source with an object only through claims and images.
That forces catalogue discovery and claim extraction into the same change, or
leaves a reviewed source invisible on the object page.

## Decision

Sources can contain an optional `objectIds` array. It records which objects the
source documents when no claim or image inside that source already supplies the
association. The validator rejects missing objects, duplicate IDs and an ID
repeated by a claim or image in the same source.

Candidate catalogue matches remain in `research-local/`. A source link is
published only after evidence identifies the specific object; matching an
institution and broad object type is not sufficient.

Object pages combine direct links with the links carried by claims and images,
and show each source once. A shared source link does not merge objects or assert
that they are equivalent.

## Consequences

Catalogue links can be reviewed and published independently of ontology work.
When claims or images are later added for a directly linked object, the redundant
`objectIds` entry must be removed in the same change. Direct links carry no
catalogue wording, custody, identity or truth claim beyond the editorial decision
that the source documents the object.

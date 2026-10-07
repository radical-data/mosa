# 029: Use short opaque object identifiers

## Status

Accepted on 2026-10-05. Not yet implemented.

Supersedes the object identifier decision in
[ADR 022](022-use-readable-collection-identifiers.md). Other record types keep
their existing identifier conventions.

## Context

Several objects can share a name such as “Ao”. To make unique identifiers them, we are currently adding qualifiers, that often include a museum, city or catalogue number. This permanently embeds one
institutional account in the URL. This is against the politics of MoSA of the separation of perspectives about an object from the object, particularly museum perspectives. It also risks making these things permanent features of how we talk about an object, even as the evidence or location of it changes.

## Decision

Give each object record a permanent random ID, independent of its name.
Initially generate four characters, chosen uniformly from this alphabet (following https://arks.org/about/running-minters-and-resolvers/):

```text
0123456789bcdfghjkmnpqrstvwxz
```

Use lowercase, with no prefix, separators or check character. No particular
mixture of letters and digits is required. Treat IDs as exact strings,
including leading zeroes.

The file name remains the ID, used in references and both language routes:

```text
collection/objects/k7m4.json
/en/collection/k7m4/
/es/coleccion/k7m4/
```

Do not add a separate stored ID or maintain a second readable handle.
Object, source and article namespaces remain separate.

Four characters provide 707,281 possible IDs. Generate longer IDs if more
capacity is needed; readers accept four or more characters. Existing IDs
never change, including when names, classifications or holdings change.

### Allocation and permanence

Generate IDs automatically. Check each candidate against all issued IDs and
reserve it before returning it. If it is taken, generate another. Never reuse
an issued ID, even after its record is deleted or merged.

Check for independent allocations of the same ID when combining branches.
Git conflicts are not sufficient: two branches can create identically named
files with identical contents for different objects and merge silently.
Resolve an unpublished collision by assigning one record a new ID and
updating its references.

When duplicate published records are merged, preserve the retired URL through
a redirect or explanatory page and retain the reconciliation history. If a
record is split, keep its URL as an explanatory page linking to its successors.
An ID must never be reassigned to unrelated material.

### Recognition and authoring

Keep names prominent, attributed wording intact and IDs secondary. Several
records may display “Ao”; use images and sourced context to distinguish them.
Make IDs searchable and full URLs easy to copy.

Provide contributor lookup by names, catalogue references and source evidence,
showing names alongside exact IDs. A unique ID does not prove that a newly
entered record describes a different object: identification and merging still
require evidence.

## Trade-offs

Readable handles are easier to recognise in URLs, files and reviews. Opaque
IDs remove that cue, so lookup and descriptive presentation are essential.
They also let names change without leaving an institutional label in the
address. This supports revisable, attributed accounts; it does not confer
ownership or community authority.

Four characters balance brevity and capacity. Three would require expansion
sooner; longer IDs offer little immediate benefit because allocation checks
reject collisions. The restricted alphabet reduces confusing characters and
accidental words without guaranteeing that every string is meaningless.

## Migration

Build allocation, permanent reservations, branch checks and lookup before
migrating records. Retain a reviewed mapping from every old handle to its new
ID, and update file names and all object references together. Preserve names,
claims, attribution, foregrounding and unresolved identity distinctions.

Preserve published URLs in both languages through permanent redirects or
explanatory pages. Update the architecture and authoring guidance with the implementation;
until then, those guides describe the current readable handles. Outstanding
work belongs in the [roadmap](../roadmap.md#accepted-work-awaiting-implementation).
Deployment remains separate.

Test collision handling, concurrent allocation, longer IDs, retired-ID
protection, reference preservation and old URLs. Run `just collection-check`,
`just verify` and the website HTTP checks for redirects.

## References

- [ARK Alliance: identifier alphabet and opacity](https://arks.org/about/running-minters-and-resolvers/)
- [Europeana: persistence and non-reuse](https://europeana.atlassian.net/wiki/spaces/EF/pages/3265626115/Policy%2Bfor%2Bpersistent%2Bidentifiers%2Bin%2Bthe%2Bdata%2Bspace)
- [W3C: descriptive link text and context](https://www.w3.org/WAI/WCAG22/Understanding/link-purpose-in-context.html)
- [CARE: Indigenous authority and data governance](https://www.gida-global.org/careprinciples)

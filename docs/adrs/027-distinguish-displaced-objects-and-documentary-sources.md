# 027: Distinguish displaced objects from documentary sources

## Status

Accepted. The collection model and migration are implemented; the public source
and editorial pages remain pending in the next commit. The source and image
contract is documented in the
[collection authoring guide](../collection-publication.md).

## Context

MoSA investigates the displacement of particular material and also investigates
the documentary body through which displacement, restitution and museums are
understood. The current website centres objects and uses sources to publish
attributed claims and images. That distinction is useful, but it does not yet
give sources their own public pages or a way to describe how one source relates
to another. In particular, an independently authored photograph currently sits
inside the source record for the page that publishes it.

The distinction serves MoSA's investigation; it is not an exhaustive
classification of reality. A source can be exhibited and critically examined
without becoming an object. The same physical thing can have both a documentary
identity and an object identity when the investigation requires both. Separate
records are warranted for independently identifiable things, not merely
because they have different curatorial uses.

For example, a scan is a representation of a letter, and a screenshot is a
capture of a webpage. Neither automatically becomes a distinct source or object.
A physical document or print warrants an object record when its own displacement
is investigated. Its documentary content can also have a source record when
that content is examined; the two identities must remain explicit.

Ancestral people and physical remains remain distinct, as recorded in
[ADR 009](009-human-remains.md). This decision does not collapse a person into
an object or infer that every displaced object represents a person.

## Decision

An **object** is particular material whose displacement MoSA investigates. Its
identity connects questions of origin, removal, separation, custody and return.
Object status does not assert that theft, origin or present whereabouts have
been established.

A material place is not an object merely because a source documents it. A site
on Rapa Nui remains outside the object collection when its displacement is not
under investigation. A catalogue webpage about a photograph of that site and
the photograph itself are separate sources; the photograph source can exist
without a publishable image file.

A **source** is an identifiable member of the documentary body through which
MoSA investigates displacement, restitution and museums themselves. A source
can concern particular objects, other sources or the subject in general.
Sources have their own editorial navigation titles and public pages. A title is
a navigation label; it does not assert an original title.

Sources can exist without object links, extracted claims or local files. Each
source requires an editorial navigation `title` and a `kind`; initial kinds are
`webpage`, `publication`, `photograph`, `artwork`, `correspondence`,
`audiovisual` and `other`. Optional descriptive date text preserves the
source's uncertainty. Optional topics begin with `displacement`, `restitution`,
`museum-practices` and `representations`. Keep existing attribution,
reference, language, claims, direct object links, notes and captures.
Methodological notes and capture metadata remain excluded from public rendering
and search. Keep structured claims inside their asserting sources and target
them at objects. Keep source analysis in metadata, relationships and authored
editorials for this release. A source's files, scans, captures and resized
renditions are representations or preservation evidence. They are not new
sources merely because they are separate files.

Use a shared reference that identifies exactly one object or source for
editorial subjects and directed source relationships. Support these
relationships: `depicts` from a source to an object; `reproduces` and `discusses`
from a source to a source; and `is_part_of` from an independently registered
source to a larger source. Relationships can carry locators. Store each
relationship once and derive incoming links during the build. Validate target
types, reject duplicates and self-links, and reject cycles in `is_part_of`.
Relationships do not transfer claims, authorship, rights or object identity.
Retain direct source-to-object links for documentation without extracted claims.

An editorial can concern multiple objects and sources, or have no record link.
Preserve editorial prose, authorship and language. Source pages show
bibliographic metadata, cleared representations, related objects, source
relationships, attributed claims with locators and relevant editorials. Object
pages retain their present information hierarchy, link to source pages, and
derive image galleries from explicit `depicts` relationships. The paired source
and editorial indexes and detail pages are bilingual; source and editorial
prose keeps its declared language.

For a photograph found through a British Museum catalogue webpage, the records
will be:

| Record | Owns |
| --- | --- |
| Object: the particular carving | Stable object identity and foregrounded claims |
| Source: British Museum catalogue webpage | Catalogue text, extracted claims and preserved webpage capture |
| Source: photograph of the carving | Photograph attribution, reference, image-specific rights and publishable image file |

The catalogue webpage **reproduces** the photograph. The photograph **depicts**
the object. It appears in the object's gallery and has its own source page with
credit, rights, depicted objects and links to publication contexts. Do not infer
the photographer from the hosting institution. Register an identified
photograph once when it appears in several publications, and link each
publication. A photograph source can lack a publishable local file. Keep image
bytes, paths, captions, credits and URLs. Keep preservation captures separate
from publishable representations. A letter scan remains with its letter source;
a webpage screenshot remains a capture unless independent source identity is
justified. Resized renditions remain files representing the same photograph.

Image entries represent their owning photograph source rather than naming
an `objectId`. Derive object-gallery membership from `depicts`; a photograph may
depict several objects. A document scan does not enter an artefact gallery just
because its source concerns that artefact. Preserve file-level alt text,
captions, credits, rights and original URLs.

The source index lists every source and supports text search and kind/topic
filters, with the complete listing available without JavaScript. Search titles,
authors, references and topics. The collection section label will be “Documents and images”
and “Documentos e imágenes”. Keep existing object URLs, add paired source and
editorial indexes and detail routes, and update canonical links, sitemap,
alternate-language metadata and language switching. Switching language retains
the corresponding record or article and supported index filters.

### In everyday work

| Task | What the researcher does |
|---|---|
| Register another displaced carving | Create an object with a stable identity; link documentary sources. |
| Add a museum catalogue | Create a source and extract its attributed object claims. |
| Separate an embedded photograph | Create a photograph source; connect it to the publishing source and depicted object. |
| Add a catalogue record for a photograph of a Rapa Nui site | Create webpage and photograph sources; do not create a site object when the site's displacement is not under investigation. |
| Examine a refusal letter | Create a correspondence source and an editorial about it; no object is required. |
| Discuss *Black Panther* | Create an audiovisual source, identify the relevant scene with a locator, and explain its relevance in an editorial. |
| Exhibit the refusal letter | Present its existing source record prominently; do not duplicate or convert it. |

Compare this with one record type that allows overlapping object and source
roles. A single type makes it easy to misread documentary identity as object
identity, and would invite files or curatorial uses to create duplicate entities.
Specialised records make the investigated identity explicit while relationships
allow sources and objects to be examined together. The cost is explicit links
and a migration of current embedded photograph metadata.

## Implementation and commit strategy

Implement on `objects-and-sources`, created from updated `main` after the
campaign merge. Verify the working tree and inspect the merged collection before
editing. Resolve Git LFS permission problems before relying on status or diff
results, and preserve unrelated work.

Use three main Conventional Commits in dependency order:

| Commit | Scope |
|---|---|
| `docs(collection): define objects and documentary sources` | This ADR and rationale. Keep the implementation status accurate. |
| `feat(collection)!: separate photograph sources` | Model and validation, full record migration, image ownership, editorial subjects, affected loaders and research tools, tests, and matching authoring and skill guidance. Schema, data and consumers change together. |
| `feat(website): publish sources and editorials` | Public indexes and pages, navigation, relationships, search, localisation, metadata, sitemap, HTTP coverage, and final presentation guidance. |

The breaking collection commit body and `BREAKING CHANGE` footer will describe
the new authoring contract and state that existing records migrate in the same
commit. Keep tests with the behaviour they verify. A pure-move commit is allowed
only if it passes independently and improves review; otherwise keep moves with
the owning change.

Preserve existing paths by default. Use `git mv` for tracked relocations and
renames. Keep image binaries at their current paths unless relocation has a
concrete purpose; separating photograph metadata normally adds a source JSON
file and edits the publishing source without moving or duplicating the binary.
If a pure move can be separated while leaving a valid intermediate state, keep
dependent reference updates with that move. Review with rename detection: Git
stores snapshots, so `git mv` does not guarantee how a later diff displays the
change.

For every commit, stage explicit files or hunks, exclude unrelated work and
local research, review the staged diff including deletions, moves and LFS
changes, and run the checks for that commit. Allow existing hooks to run;
inspect generated changes and repeat affected checks. Commit only a valid
intermediate state. Run documentation checks for the first commit. Run
collection and research checks plus `just verify` for each implementation
commit. Keep these boundaries in reviewable branch history. Pushing, merging
and deployment remain separate actions.

## Consequences

MoSA can publish and analyse documentary sources in their own right, while
maintaining a clear path from a photograph to its publication context and
depicted object. Sources can be discussed without asserting object identity.
The model still does not introduce a unified entity store, structured claims
about sources, institution authority records, restitution case management or a
new provenance-event model.

Migration must preserve object handles, claim IDs, wording, attribution,
qualifiers, locators, image bytes and metadata, capture ownership, and editorial
prose and authorship. Historical research batches, outcomes, dates and hashes
remain intact. Existing `source/image-file` evidence references can resolve
through the source's explicit `reproduces` relationship to the source owning
that exact file, with an unambiguous match and correct depicted object. New
research records refer directly to the photograph source. Automated fixtures
may demonstrate correspondence and audiovisual cases; they must not publish
invented letters, quotations, film locators or essays.

The migration must compare collection inventories before and after, account for
every original object, claim and image asset, and explain source-count increases.
Image paths and bytes remain unchanged except for reviewed moves. Verification
includes collection and research checks, `just verify`, `git diff --check`, a
production image and HTTP tests for new routes, plus review of representative
object, photograph, unlinked-source and editorial pages in both languages and
at narrow widths, with keyboard navigation and enlarged text.

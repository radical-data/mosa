# Publish and withdraw collection objects

## The researcher flow

A local agent finds and prepares sources. Uploading its bundle creates private
Drafts. A researcher checks the original source, every proposed claim, citation
and excerpt, and confirms object identity in the research workspace. **Publish**
accepts that reviewed revision into research and writes its validated public
record in the same database transaction. **Publish and next** does the same and
opens the next draft. Saving, deferring and rejecting never publish.

Publishing is the public decision. There is no separate release candidate,
JSON export, commit, PR or website deployment for each object. The review form
states that claims, citations and excerpts become public; agent notes and
preserved source files remain private. A legacy card needs its complete public
name, holder, speaker, identifier and evidence. A full dossier can retain
unknowns and needs only an evidenced name, classification, description or
identifier for its heading. An incomplete legacy draft stays a draft until it
can be published as a complete dossier or card.

The database stores one public projection per object in
`publication.published_record`. It is built with the same strict public contract
used by the former release exporter. The restricted capture writer may insert or
replace only a record backed by its own accepted draft. The public API reads only
visible projections; it never reads private drafts or source storage.

## What the public website reads

The explorer serves `/api/public-collection.json` from visible projections. It
returns a validated bilingual collection payload with a stable content revision.
The website requests this feed on each collection, institution, object, snapshot
and sitemap request. It has no database credentials. Collection and institution
responses use `Cache-Control: no-store`; if the feed is unavailable, they return
503 rather than a stale built copy. The public site is therefore current after
Publish without a rebuild.

Migration `20260923190000_published_collection.sql` carries the records from the
already approved desired release into the new projection. It contains no real
research content. Older release-ledger rows remain for audit, but the website no
longer uses them. Before the first website code deployment, check that the
explorer feed contains the expected public objects and no private notes.

## Withdraw an object

A maintainer can hide a public record immediately with the dedicated publisher
connection. This changes the database, so the website removes it on the next
request. Use the object UUID and record the actual decision-maker and reason:

```sh
just collection hide --item <object-uuid> --actor 'Actual operator' --authority 'Reason for withdrawal'
```

The action is recorded in `publication.record_action`. A hidden record cannot be
republished by a researcher. After a correction is ready, a maintainer may clear
the hidden projection, leaving it absent until a new draft is reviewed and
published:

```sh
just collection clear --item <object-uuid> --actor 'Actual operator' --authority 'Reason for allowing a new review'
```

The CLI requires `COLLECTION_DATABASE_URL` for the dedicated
`collection_publisher` login and `COLLECTION_DATABASE_SSL_CA` for a remote
connection. Keep both outside Git. Verify removal on both language listings,
the object URL, the public snapshot endpoint and the sitemap. Do not restore a
website image to undo publication: the database projection controls visibility.

## Deploy website code

The `Website` GitHub workflow deploys code from the current head of `main`. It
checks the research feed first, sets Coolify's Git SHA to that exact commit
through the API, and verifies the finished job and served collection pages.
Coolify automatic and preview deployments stay disabled. The website token needs
application read, update and deploy access. This code deployment is needed only
when the website changes, not when researchers publish objects.

```sh
just collection-website-verify
just test-db
```

The first command changes a synthetic feed while a built website remains
running, then checks publication, withdrawal and feed failure in both languages.
The second uses a disposable database to check capture transactions, the public
projection and role permissions. Neither proves hosted Auth, Storage or Coolify
is configured; verify the live origin after the one-time deployment.

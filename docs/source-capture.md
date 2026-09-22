# Source-first research capture

Slice 2 adds a private `/research` workspace to the existing explorer. A researcher saves a catalogue URL, records what the source says with evidence, confirms identity and accepts the reviewed revision into the research collection. Custody and attribution may remain unresolved. Publication remains a separate maintainer decision. The public pilot accepts at most two explicitly selected objects.

## Researcher flow

1. Sign in with an email code using an invited account.
2. Save a catalogue URL and optional working label. The app records the source reference and time; it does not fetch, archive or extract the page.
3. Choose a readable catalogue and copy its number exactly, or leave both fields empty. Copy a name, object type or description, identifying which it is. A copied catalogue field reuses its wording as evidence; alternatively quote a passage or cite the whole record without inventing a quotation.
4. Record a holder only when the source establishes one. Select existing institutions deliberately and reuse their evidenced names, or supply separate naming evidence for new records or different wording. Record custody evidence separately, or explicitly reuse the object evidence when it also supports custody. The catalogue publisher is not automatically the holder. Unknown attribution remains unknown; fields for another speaker appear only when needed.
5. Save and review. The app finds objects by exact catalogue identifier and known source URL. Confirm an existing object, explicitly create a new one when there are no matches, or defer the decision.
6. Accept the reviewed revision. The existing packet validator and importer perform the canonical writes. The accepted record opens in the explorer. A maintainer can separately review it for publication.

Editing invalidates the review state. A stale tab cannot accept a changed revision. Retrying acceptance returns the original result. Draft creation also has a request identity, so a retried form does not create another draft. Rejection, deferral and removal do not write canonical claims; removal hides the draft but retains its private revision history. This slice accepts the whole bounded proposal, rather than providing a general claim review queue.

Drafts and revisions are private to their author. Working labels, notes and interpretations never enter the canonical packet or public snapshot. Accepted research uses the explorer's existing reader visibility; the private draft and public website have separate access boundaries.

The form emits packet schema version 2, which adds `classified_as` and `described_as`. Version 1 retains its existing predicate allowlist and import behaviour. Older drafts keep their original name/quotation semantics. Selecting an existing institution reuses server-resolved supporting name evidence; acceptance checks that this evidence still matches the reviewed choice. It does not manufacture a new name claim from the custody quotation.

Save incomplete work with **Save draft** or **Save as unresolved**. Review and acceptance require evidence for the statements actually recorded. The review identifies missing public-card requirements without forcing researchers to reinterpret a classification as a name or infer a holder from a publisher.

## Production setup

The research app is deployed at `https://research.museumofstolenartefacts.org`, as confirmed by the project owner on 2026-09-22. The configuration procedure below remains the setup reference; inspect existing settings before changing them. `RESEARCH_ORIGIN` and the GitHub `production` environment's `PRODUCTION_URL` use that origin.

The researcher email selected for the initial rollout is configured outside Git. Deployment confirmation does not establish successful email-code sign-in, private draft saving or a live capture demonstration. Verify those outcomes next and record the results.

1. Configure the GitHub `production` environment with `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_ID`, `SUPABASE_DB_PASSWORD`, the **research application's** `COOLIFY_DEPLOY_WEBHOOK`, `COOLIFY_API_TOKEN` and `PRODUCTION_URL`. Restrict deployments to `main`. Do not reuse the public website webhook.
2. Apply migrations before deploying the new research image, including `20260922100000_capture_reuse_label_evidence.sql` for existing institution evidence. The original capture migration removes the broad grants to `authenticated`; authentication alone no longer permits direct research writes. The existing `explorer_reader` remains read-only.
3. Create a dedicated login outside Git and grant it `capture_writer`. Give it a small connection limit and short statement timeout. It may insert importer output and maintain ingestion bookkeeping. It cannot edit existing canonical claims, administer researchers or access the publication ledger. Keep the existing reader connection for reader routes.
4. Configure runtime-only `CAPTURE_DATABASE_URL`, the existing verified `DATABASE_SSL_CA`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` and `RESEARCH_ORIGIN` (the exact HTTPS origin without a trailing slash). Keep both database URLs out of browser output and build arguments.
5. Enable Supabase email OTP, disable public sign-ups and configure working SMTP. In the **Magic Link** email template, include `{{ .Token }}` as the sign-in code. This flow uses codes, not a magic-link callback. Create the invited Auth user with the admin interface and record their Auth user ID in `capture.researcher` with an administrative database connection. Never grant the user the server login or publisher role.
6. Confirm the account can sign in and create a private draft. Disable access by setting that researcher's `enabled` to false; every private request checks it. Sessions expire after at most one hour and require another code. No refresh token is stored by the app.

Use the normal explorer Dockerfile and deployment checks. Auth is verified with the configured Supabase `/auth/v1/user` endpoint on every private request. Forms require the configured origin; private responses use `Cache-Control: private, no-store`. Keep the research site behind HTTPS. Reader routes retain their existing behaviour.

## Maintainer publication

The accepted draft URL ends in its draft ID. A maintainer can prepare it directly, without assembling evidence IDs by hand:

```sh
just collection prepare --draft <draft-id> --retain --output /private/path/candidate.json
```

`--retain` includes the currently authorised card after checking its dependencies. Review the complete resulting candidate, then approve, export, commit and deploy as described in the [publication runbook](collection-publication.md). Classifications/descriptions without an evidenced name, unresolved holders, missing catalogue identifiers, unknown speakers, qualifying/contradicting evidence and changed dependencies block this simple public-card projection. Acceptance into research never implies publication authority.

The existing `--selection` argument also accepts an array of one or two explicit selections. A duplicate object or a third card is rejected. Existing single-card releases retain their original fingerprints.

To remove one card while retaining the other:

```sh
just collection withdraw --id <release-id> --item <item-id> --actor 'Actual operator' --authority 'Actual withdrawal reason'
just collection export --output apps/website/public/collection-snapshot.json
```

Commit and deploy the replacement through the same gate. If dependencies have changed, item-specific withdrawal fails rather than silently approving updated wording. Omit `--item` to withdraw the entire release and generate an empty snapshot. Neither operation changes what is served until deployment succeeds.

## Validation

`just test-db` runs the database capture checks, importer regressions and a built-app HTTP test. It resets the local test stack; use a disposable stack. The HTTP test uses a local Auth test server and synthetic data, with a real restricted database login. Production email delivery and Auth configuration require a live check.

The automated checks cover denied direct access, cross-user isolation, disabled accounts, missing evidence, stale revisions, duplicate requests, identity collisions, acceptance rollback, two-card publication and withdrawal. Source uploads, automatic extraction, AI, general permissions management and a broad editing interface remain outside this slice.

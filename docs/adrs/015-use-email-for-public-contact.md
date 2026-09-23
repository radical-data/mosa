# 015: Use email for public contact and defer a contact form

## Status

Accepted on 2026-09-13. The website implements the approved address,
`mosa@radicaldata.org`, as selectable text and a native email link. Mailbox operations,
privacy details and delivery verification remain separate work.

## Context

The original disabled website form could not start the conversations invited by
the site. An initial alternative proposed a short form, separate intake service,
durable delivery queue and restricted mailbox. Expected low contact volume was
an assumption, not a measurement. No demonstrated need justified structured
intake, automated routing or another service.

## Decision

Use email-only contact as a complete solution that can remain indefinitely. Keep
the public website static, without a contact endpoint, submission store, worker,
challenge provider or CRM. Defer a form until observed needs justify it.

The address must be readable/copyable and work as a `mailto:` link without
JavaScript. Invite enquiries about restitution, reconnection, collection information,
corrections and collaboration without requiring legal identity or institutional
representation. Ask for a general description before sensitive attachments or
restricted knowledge and agree a suitable channel separately.

Treat correspondence as private. Sending a message does not authorise publication,
research ingestion, partner sharing or external AI processing. An individual message
does not establish community authority. Keep correspondence separate from the
collection database unless an agreed contribution follows research review.

A responsible team must own the mailbox, replies, backup coverage, privacy notice
and retention. Publish only a response target the team has agreed to staff; five
working days and the old design's retention periods were proposals, not policy.
Ordinary email must not be advertised as anonymous or end-to-end confidential.
Staff answer directly; automated AI routing, summaries, translation and replies
are outside this decision.

## Alternatives considered

| Alternative | Assessment |
| --- | --- |
| Email-only | Minimal website infrastructure; sender usually retains a sent copy, but switching to email adds friction and delivery can fail |
| Short form plus email | Could reduce visitor friction and improve routing, but requires durable acceptance, retries, failure alerts, abuse controls and data handling |
| Managed form service | May reduce maintenance if a need emerges; still requires assessment of accessibility, exports/deletion, processor arrangements and delivery behaviour |

A future short form would require only reply address/message, with optional name/topic,
no initial attachments, accessible submission without JavaScript, reliable receipt
and an email fallback. Prefer assessing a managed service before a custom backend
if no service maintainer is available. No provider is selected.

## Consequences and reconsideration

Email gives visitors a usable contact route while the team concentrates on replies.
It cannot provide on-page receipts, enforce context or prevent unsolicited attachments.
Spam filtering and review remain necessary. Do not add tracking solely to count
email-link clicks: a click is not a delivered enquiry.

Revisit this decision only with evidence of recurring email-access barriers, missing
essential context, burdensome manual assignment, or a receipt/intake requirement
that the mailbox cannot meet. Record the affected audience, examples, benefit and
operational owner. Retain direct email if a form is added. Sensitive research intake
needs its own design; a general form does not establish a suitable channel.

## Procedure and verification

[Website content](../website-content.md#contact-and-release) owns the public editing
instructions; [operations](../operations.md#mailbox-operations) owns mailbox setup,
receipt/reply/backup verification and handling. The [roadmap](../roadmap.md#human-decisions)
tracks unresolved owners and policies. Verify the address on mobile/desktop, copying,
no-JavaScript use, actual delivery and a reply before claiming the service works.

The [CARE Principles](https://www.gida-global.org/careprinciples) inform the original
emphasis on people, purpose and Indigenous authority; they do not substitute for
Rapa Nui collaborators' decisions. The former form design remains in Git history.

# 015: Use email for public contact and defer a contact form

## Status

Accepted on 2026-09-13. The website contact page implements the email-only
decision using the project owner's approved address, `mosa@radicaldata.org`.
Mailbox operations and delivery verification remain separate work.

## Context

The public website invites visitors to contact MoSA about restitution,
reconnection, collection information, corrections, collaboration and press.
The current contact page contains a disabled form. Visitors cannot complete the
conversation that several pages invite them to start.

An initial [contact service design](../contact-design.md) proposed a short form,
a direct email alternative, a separate intake service, a durable delivery queue
and a restricted team mailbox. That design addresses delivery failures,
accessibility, abuse prevention, privacy and responsibility for replies.

The simpler alternative is to publish a dedicated project email address and
answer enquiries through a shared mailbox. Expected contact volume is low,
although this is an assumption rather than a measured fact. There is no
demonstrated requirement for structured intake, automated routing or an
additional service.

MoSA's immediate need is to begin conversations with people. Reliable replies
and accountable handling of correspondence provide most of the value under
either technical approach.

## Decision

Use email as the public contact channel. Treat email-only contact as a complete
solution that can remain in place indefinitely. Defer the website form until
observed visitor or operational needs justify it.

Keep the public website static and independent of the research database. Do not
introduce a contact endpoint, submission store, delivery worker, challenge
provider or CRM for the initial contact experience.

### Public contact page

- Display an approved project email address as selectable text and a `mailto:`
  link. Visitors can copy the address into webmail when no email application is
  configured. Do not make access depend on JavaScript, an image or a copy button.
- Replace the disabled form with a short invitation explaining the kinds of
  conversations MoSA welcomes. People do not need to represent an institution
  or provide a legal identity to make contact.
- Identify the team or role that receives correspondence. Publish a realistic
  first-response expectation only after the team agrees to staff it.
- Invite visitors to describe sensitive material generally before sending
  documents, images or restricted knowledge. Agree a suitable channel before
  requesting that material.
- Link to a concise privacy notice describing responsibility for the mailbox,
  the purpose of processing, recipients, retention and the route for exercising
  rights.
- Localise the invitation and privacy information with the website. Accept
  original-language correspondence and arrange human language support without
  promising coverage the team cannot provide.

### Inbox ownership

Use a dedicated project mailbox with individual staff access. Assign a primary
inbox steward and a backup. Use multi-factor authentication rather than shared
passwords. A distribution list alone does not establish who will reply.

The steward checks enquiries on staffed working days, assigns a responder and
tracks new, assigned, waiting and closed conversations using mailbox labels or
equivalent features. Include correction and removal requests in this workflow.
Make planned absences visible when they affect the published response target.

Five working days is a candidate target for a first human response, not an
approved service commitment or a deadline for resolving restitution enquiries.
The responsible team determines its actual target and working calendar.

Check the spam folder and verify actual receipt and replies before launch.
Domain authentication, mailbox security and delivery remain operational
responsibilities even though the website has no submission backend.

### Correspondence, privacy and cultural authority

Treat messages as private correspondence. Sending a message does not
automatically authorise publication, research ingestion, partner sharing or
external AI translation. Agree those uses separately, including attribution
and any relevant community authority. An individual message does not establish
authority to speak for an entire community.

Keep correspondence separate from the collection database. Any agreed research
contribution follows the project's research and publication process.

Email still processes personal data through mailbox providers and backups.
Identify the responsible organisation, assess its processing arrangements and
lawful basis, and approve a retention schedule that covers received messages,
sent replies and provider copies. The initial design's retention periods are
proposals, not adopted policy under this ADR.

Do not promise anonymity or end-to-end confidentiality for ordinary email.
Restrict access to unexpectedly sensitive material and agree further handling
with the sender. Staff answer correspondence directly; automatic AI routing,
summaries, translation and replies are outside the initial scope.

## Alternatives considered

| Consideration | Email-only contact | Website form plus email |
| --- | --- | --- |
| Visitor effort | Opens an email application or requires copying the address into webmail | Allows a visitor to write directly on the website |
| Delivery | Uses established email infrastructure; the sender normally keeps a sent copy | Requires acceptance, delivery, retry and failure behaviour |
| Maintenance | Mailbox administration and a static contact page | Adds a service, dependencies, monitoring and abuse controls |
| Privacy | Personal data remains in email infrastructure | Adds a processing step and potentially another stored copy |
| Organisation | Visitors describe enquiries naturally; staff route messages | Fields can collect a topic and aid routing |
| Accessibility | A visible address is straightforward; switching applications adds friction | Can reduce that friction if built and tested accessibly |
| Sensitive material | Senders can attach material before discussing how to share it | Can omit attachments and guide initial disclosure, but free text can still contain sensitive information |

### Short form with an independent contact service

The initial design would keep only reply email and message mandatory, with name
and topic optional. It would omit a separate subject field and attachments.
Accessible HTML submission would work without JavaScript. A private durable
queue would accept messages before displaying success, retry delivery failures
and alert an operator. The direct email address would remain available.

This option improves convenience for visitors without a configured email
application and can help when structured routing becomes useful. It also
creates software and data-handling responsibilities that current evidence does
not justify. Defer it rather than treating it as the inevitable next phase.

### Managed form backend

A managed service can reduce custom maintenance if a form becomes necessary.
It still requires assessment of accessible submission, durable storage,
delivery failures, exports, deletion, processor terms and international
transfers. A hosting-region label alone does not resolve those questions.

If the form requirement emerges without an available service maintainer, assess
this option before commissioning a custom backend. No provider is selected by
this ADR.

## Consequences

Visitors gain a working contact route with little website maintenance. The site
retains its static deployment and needs no contact-service credentials. The
team can invest its capacity in responding and building relationships.

The accepted cost is additional friction for visitors who cannot open email
from the browser. The website cannot provide an on-page receipt, enforce topic
selection or prevent unsolicited attachments. Publishing an address can
attract spam, so mailbox filtering and review remain necessary. Email delivery
can also fail; email-only contact is not a guarantee of receipt.

Do not add tracking solely to count clicks on the email link. A click is not a
delivered message. Assess the service through unanswered enquiries, response
times, delivery problems and direct visitor feedback, with minimal additional
personal data collection.

## Conditions for reconsideration

Revisit this decision when concrete evidence shows that:

1. Visitors cannot contact MoSA because opening or using email is a recurring
   barrier.
2. Enquiries repeatedly lack essential context, and a short form would reduce
   that problem without imposing unnecessary disclosure.
3. Contact volume makes manual assignment materially burdensome.
4. A defined workflow requires receipt tracking or structured intake that the
   shared mailbox cannot provide adequately.

Record the affected audience, examples, expected benefit and an operational
owner before selecting a form service. Retain the direct email alternative if
a form is introduced. Sensitive research intake requires a separate design;
adding a general contact form does not establish a suitable channel for it.

## Implementation boundary and verification

Before launch, establish the approved address, provider, responsible
organisation, primary and backup stewards, response expectation, privacy notice
and retention policy. Do not invent these values from design examples.

Verify that the address can be read and copied on mobile and desktop, the email
link contains the approved address, the page works without JavaScript and the
disabled form has been removed. Send a test enquiry, confirm its receipt and
complete a reply. Confirm that the backup can take over through individual
access. The website continues to build without mailbox or database credentials.

This ADR records the decision. It does not publish an address, provision a
mailbox or enable website contact by itself.

## Related documentation

- [Initial contact service design](../contact-design.md): retained as the
  deferred alternative; its form-first recommendation is superseded by this ADR.
- [ADR 014: Monorepo and application boundaries](014-monorepo-and-task-tooling.md).
- [Public website localisation strategy](../localisation-strategy.md).
- [CARE Principles](https://www.gida-global.org/careprinciples): context for
  people, purpose and Indigenous authority over data use; not a substitute for
  decisions by Rapa Nui collaborators.
- [EDPB data protection basics](https://www.edpb.europa.eu/sme/learn-the-basics/data-protection-basics_en):
  context for purpose limitation, minimisation and retention.
- [W3C form notifications](https://www.w3.org/WAI/tutorials/forms/notifications/):
  reference if a form is later introduced.

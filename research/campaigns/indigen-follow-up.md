# IndiGen museum follow-up

## Question and scope

Which objects linked to the IndiGen *Recollecting Rapa Nui* gallery can be
reconciled with institutional records, and which capture, claim and image work
remains? This follows existing identities; it is not a census of everything in
those institutions or a count of all objects abroad. The seed also includes
MAPSE material on Rapa Nui, so its totals must not be labelled objects abroad.

The current pass is complete when each selected institution or object has a
supported disposition and a useful next action for anything unresolved.
A blocked or deferred outcome records unfinished work, not completion.

## Current position

The [shared register](../progress/indigen-recollecting-rapa-nui-gallery.json)
preserves the 2026-09-30 history from the original local register. Use it for
current totals and object-level history, rather than maintaining another table:

```sh
just research status indigen-recollecting-rapa-nui-gallery --limit 10
just research status indigen-recollecting-rapa-nui-gallery --stage identity --status blocked --limit 10
just research check indigen-recollecting-rapa-nui-gallery
```

## Findings and evidence

Earlier work began with nine Te Papa, eight Met and nine Munich entries, then
expanded across the gallery's holders. It recorded both successful catalogue
matches and bounded searches that failed or were blocked. Later batches also
corrected earlier photograph comparisons and reviewed image rights separately.
Read an object's history before repeating a search or treating an earlier note
as the latest conclusion.

The [migration note](../evidence/indigen/README.md) explains what was shared and
what remains local. Existing source captures and published records remain the
primary evidence. Retained notes describe historical work; the migration did
not repeat the museum searches or certify every earlier interpretation.

## Unresolved leads and obstacles

Some institutions have inaccessible catalogues or no object-level catalogue
found within the recorded searches. Some verified records still lack complete
captures, claims or usable images. Review `evidenceLimitations` alongside the
stage outcomes: an outcome can remain historically recorded while its original
supporting screenshots or private working files are unavailable in a clone.

Historical holder wording and spelling variants remain as recorded. Do not
infer current custody, merge identities or collapse disagreeing classifications
from those labels alone. Consult the existing
[holder lookup recipes](../../.agents/skills/identify-objects/references/holder-lookups.md)
before trying catalogue access again.

## Next action

Choose one bounded group from the filtered queue and read its latest next
actions. For a useful first access test, inspect the Göttingen blocked identities
and the existing catalogue recipe. If access still fails, record that result and
continue another accessible group; request a privately supplied page only when
it would resolve a specific question. Record the resulting batch against the
current shared revision and update this campaign only when its direction or
findings change.

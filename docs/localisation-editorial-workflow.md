# Translation checklist

## Everyday development

1. Edit the relevant file in `apps/website/src/content/pages/`. Each file keeps Spanish (`es`) and English (`en`) together. Shared templates apply layout and feature changes to both languages.
2. Preview the change with `mise exec -- just website-dev`. Open `/es/` or `/en/` and use the language links to compare.
3. Update the other language when convenient. If it needs to wait, add a specific unchecked item below. New message keys need a value in both languages; existing wording can change independently.

There are no hashes, source revision references, approval fields or special review builds to maintain. The build checks technical correctness. This checklist is manual and never blocks development.

The initial Spanish copy came from the supplied designs; English was drafted with AI assistance. The project owner agreed to make it available before human review. That does not imply linguistic or community approval.

## Pending translation and review work

Add follow-up wording changes here as they occur, with the file and the passage or change to check. Tick an item when it has been addressed.

- [ ] Review Spanish and English homepage copy (`home.json`).
- [ ] Review the project description and team copy (`about.json`).
- [ ] Review collection explanations (`collection.json`).
- [ ] Review the visit overview (`visit.json`).
- [ ] Review events and programme descriptions (`events.json`, `programme.json`).
- [ ] Review resources and their summaries (`resources.json`, `resource-summaries.json`).
- [ ] Review the contact invitation and correspondence guidance (`contact.json`).
- [ ] Review navigation, controls and dynamic messages (`interface.json`, `src/i18n/messages.ts`).
- [ ] Review reference display labels and place names (`reference-labels.json`).
- [ ] Check retained Rapa Nui terms and orthography with collaborators, including `Ta'oa`, `Ivi tupuna`, `mana` and `Moai kavakava`.

## At a release milestone

Review the changed passages in both languages and address the relevant pending items. Check names, uncertainty, attribution and claims about removal, custody, restitution and ancestors carefully. Keep original spelling and historical date precision. Different-language passages use explicit `lang` attributes, including `rap` for Rapa Nui.

Check that navigation, language switching and collection filters still work. Run the normal website build and tests. Decide explicitly which remaining editorial tasks can wait before using the existing deployment workflow; the build does not make that decision.

If material must be withdrawn, remove it from both versions and any shared sections that repeat it. Do not silently serve Spanish copy under an English URL. A source-language contribution can be presented explicitly in its original language when that is the intended editorial choice.

Rapa Nui collaborators determine terminology, orthography and cultural authority. The current terms are inherited design wording, not a community-approved glossary. Research evidence and publication permissions remain in the separate research model; simplifying website copy does not change that boundary.

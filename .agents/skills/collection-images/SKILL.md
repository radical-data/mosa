---
name: collection-images
description: Acquire and register publishable object photographs from existing MoSA sources. Use for collection image batches, not source archiving or candidate museum matching.
---

# Add MoSA collection images

Read the [image authoring procedure](../../../docs/collection-publication.md#add-images)
and the selected source records. Work within the requested batch size.

1. Inspect existing captures and image records before downloading. Follow the
   source's image or download links to the original asset and its description
   page. A saved thumbnail is not necessarily the best available file.
2. Confirm the depicted object and image-specific reuse terms. Keep object
   acquisition credits separate from photographer credits; preserve conflicting
   or unknown attribution. A webpage's text licence does not cover every image.
   Preserve established object links; this task does not re-identify objects.
3. Stage originals under `research-local/`. Compare publisher checksums when
   available and check for duplicate files. Visually inspect the downloaded
   bytes for the correct object, view, completeness and usable resolution.
   Credit and licence belong in image metadata; keep any additional download URL,
   rights review context or unresolved issue in source notes. Keep restricted
   correspondence local. Do not require a separate audit that repeats metadata
   or file properties already available from the image and Git LFS.
4. Copy cleared originals unchanged into `collection/images/` and add image
   records to the source that documents them. Follow the guide's metadata and
   language rules. If an image now links an object listed in that source's
   `objectIds`, remove that redundant entry. Preserve claims and foregrounding.
5. Run `just collection-check`, relevant tests and `just build`; use `just verify`
   if website code or shared TypeScript also changed. Check Git LFS attributes
   for the new assets. Review image loading, credit, rights and layout on both
   language routes; metadata validation alone does not exercise optimisation.

Leave unresolved rights, attribution requirements or object matches in staging
and report the specific missing evidence. Do not infer clearance from public
access or keep retrying an inaccessible source without new evidence. Archival
captures belong to the [source-capture skill](../source-capture/SKILL.md).
Keep private material out of commits; commit or deploy only within the user's
requested scope.

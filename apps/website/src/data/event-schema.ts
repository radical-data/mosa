import { z } from "astro/zod";
import { hasUnsupportedMarkup } from "../i18n/markup";

// One event is one file under content/events/. Its facts and both languages stay
// together, so announcing or withdrawing an event is a single file operation.
const passage = z
  .string()
  .trim()
  .min(1)
  .refine((text) => !hasUnsupportedMarkup(text), "unsupported inline markup");
const eventCopy = z
  .object({
    title: passage,
    body: passage,
    note: passage.optional(),
    imageAlt: passage.optional(),
  })
  .strict();
const shared = { venue: z.string().trim().min(1).optional(), es: eventCopy, en: eventCopy };
const image = z
  .string()
  .regex(/^\/images\/[\w-]+\.(?:webp|jpg|png)$/)
  .optional();
// A zone determines the local calendar day even when the hour is unknown.
const timeZone = z
  .string()
  .trim()
  .min(1)
  .refine((value) => {
    if (/^[+-]/.test(value)) return false;
    try {
      new Intl.DateTimeFormat("en-GB", { timeZone: value });
      return true;
    } catch {
      return false;
    }
  }, "expected an IANA time zone");
const timedEvent = z
  .object({
    start: z.iso
      .datetime({ offset: true })
      .refine((value) => Number.isFinite(Date.parse(value)), "invalid instant"),
    timeZone,
    image,
    ...shared,
  })
  .strict();
const dayEvent = z
  .object({ date: z.iso.date(), timeZone: timeZone.optional(), image, ...shared })
  .strict();
export const eventSchema = z.union([timedEvent, dayEvent]).superRefine((event, context) => {
  const optional = (copy: z.infer<typeof eventCopy>) =>
    (["note", "imageAlt"] as const).filter((key) => key in copy).join(",");
  if (optional(event.es) !== optional(event.en))
    context.addIssue({
      code: "custom",
      message: "Spanish and English must carry the same optional fields",
    });
  if (Boolean(event.image) !== "imageAlt" in event.es)
    context.addIssue({
      code: "custom",
      message: "An image needs imageAlt in both languages, and imageAlt needs an image",
    });
});
export type EventData = z.infer<typeof eventSchema>;

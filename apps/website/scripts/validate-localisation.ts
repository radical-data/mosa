import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "astro/zod";
import { content } from "../src/content/content";

const bilingualCopy = z
  .object({
    es: z.record(z.string(), z.string().trim().min(1)),
    en: z.record(z.string(), z.string().trim().min(1)),
  })
  .strict();

// Technical checks only. Wording can change independently in either language.
export function validateLocalisation(entries: Record<string, unknown> = content) {
  for (const [name, entry] of Object.entries(entries)) {
    const result = bilingualCopy.safeParse(entry);
    if (!result.success)
      throw new Error(`${name}: both languages need non-empty messages\n${result.error.message}`);
    const { es, en } = result.data;
    const missing = Object.keys(es).filter((key) => !(key in en));
    const extra = Object.keys(en).filter((key) => !(key in es));
    if (missing.length || extra.length)
      throw new Error(
        `${name}: translation keys differ (missing English: ${missing.join(", ")}; missing Spanish: ${extra.join(", ")})`,
      );
    // Whole passages use a small set of trusted inline markup, never executable HTML.
    for (const [locale, copy] of Object.entries(result.data))
      for (const [key, text] of Object.entries(copy)) {
        const markup = text.match(/<[^>]*>/g) ?? [];
        if (
          /[<>]/.test(text.replace(/<[^>]*>/g, "")) ||
          markup.some(
            (tag) =>
              !/^<(?:br(?: class="desktop-break")?\s*\/?|span(?: (?:class="struck-text"|lang="(?:rap|mi|es-CL|en-GB)"))?|\/span)>$/.test(
                tag,
              ),
          )
        ) {
          throw new Error(`${name}.${locale}.${key}: unsupported inline markup`);
        }
      }
  }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateLocalisation();
  console.log("Checked bilingual message keys and content structure.");
}

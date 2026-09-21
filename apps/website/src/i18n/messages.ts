import { formatNumber } from "./format";
import { type Locale, locales } from "./routes";

// Typed whole messages: callers cannot omit or change the parameter contract.
const dynamicMessages = {
  es: {
    referenceCount: ({ count }: { count: number }) =>
      new Intl.PluralRules(locales.es.format).select(count) === "one"
        ? `${formatNumber(count, "es")} registro`
        : `${formatNumber(count, "es")} registros`,
    explore: ({ concept }: { concept: string }) => `Explorar ${concept}`,
  },
  en: {
    referenceCount: ({ count }: { count: number }) =>
      new Intl.PluralRules(locales.en.format).select(count) === "one"
        ? `${formatNumber(count, "en")} record`
        : `${formatNumber(count, "en")} records`,
    explore: ({ concept }: { concept: string }) => `Explore ${concept}`,
  },
} satisfies Record<
  Locale,
  {
    referenceCount: (parameters: { count: number }) => string;
    explore: (parameters: { concept: string }) => string;
  }
>;
export function referenceCount(locale: Locale, parameters: { count: number }): string {
  if (!Number.isSafeInteger(parameters.count) || parameters.count < 0)
    throw new Error("Invalid record count");
  return dynamicMessages[locale].referenceCount(parameters);
}
export const explore = (locale: Locale, parameters: { concept: string }) =>
  dynamicMessages[locale].explore(parameters);

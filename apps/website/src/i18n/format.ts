import { type Locale, locales } from "./routes";
export const formatNumber = (value: number, locale: Locale) =>
  new Intl.NumberFormat(locales[locale].format).format(value);
// Date-only and historical values retain their source precision; UTC prevents day drift.
export function formatHistoricalDate(value: string, locale: Locale): string {
  if (/^\d{4}$/.test(value)) return value;
  if (!/^\d{4}-\d{2}(-\d{2})?$/.test(value)) throw new Error(`Invalid date: ${value}`);
  const full = value.length === 7 ? `${value}-01` : value;
  const date = new Date(`${full}T12:00:00Z`);
  if (Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== full) {
    throw new Error(`Invalid date: ${value}`);
  }
  return new Intl.DateTimeFormat(locales[locale].format, {
    year: "numeric",
    month: "long",
    ...(value.length === 10 ? { day: "numeric" as const } : {}),
    timeZone: "UTC",
  }).format(date);
}
export function formatEventInstant(instant: string, timeZone: string, locale: Locale): string {
  if (!/(Z|[+-]\d{2}:\d{2})$/.test(instant)) throw new Error("Event instant needs an offset");
  return new Intl.DateTimeFormat(locales[locale].format, {
    dateStyle: "long",
    timeStyle: "short",
    timeZone,
  }).format(new Date(instant));
}

// Whole passages use a small set of trusted inline markup, never executable HTML.
// Shared so page copy and event copy are held to one standard.
const supportedTag =
  /^<(?:br(?: class="desktop-break")?\s*\/?|span(?: (?:class="struck-text"|lang="(?:rap|mi|es-CL|en-GB)"))?|\/span)>$/;
export function hasUnsupportedMarkup(text: string): boolean {
  const markup = text.match(/<[^>]*>/g) ?? [];
  return /[<>]/.test(text.replace(/<[^>]*>/g, "")) || markup.some((tag) => !supportedTag.test(tag));
}

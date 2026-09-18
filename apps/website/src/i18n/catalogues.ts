import catalogues from "../content/pages/interface.json";
import type { Locale } from "./routes";
export const messages = (locale: Locale) => catalogues[locale];

import { eventSchema } from "./event-schema";
import type { EventEntry } from "./events";

const files = import.meta.glob<unknown>("../content/events/*.json", {
  eager: true,
  import: "default",
});

export const storedEvents: EventEntry[] = Object.entries(files).map(([path, value]) => {
  const id = path.slice(path.lastIndexOf("/") + 1).replace(/\.json$/, "");
  const result = eventSchema.safeParse(value);
  if (!result.success) throw new Error(`${path} is invalid\n${result.error.message}`);
  return { id, data: result.data };
});

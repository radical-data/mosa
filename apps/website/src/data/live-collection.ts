import { type PublicCollection, parseCollection, productionFeed } from "@mosa/public-collection";

export async function liveCollection(): Promise<PublicCollection> {
  const url = process.env.PUBLIC_COLLECTION_URL ?? productionFeed;
  if (process.env.NODE_ENV !== "test" && new URL(url).protocol !== "https:")
    throw Error("The public collection feed must use HTTPS");
  const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(5000) });
  if (!response.ok) throw Error("The public collection feed is unavailable");
  return parseCollection(await response.json());
}

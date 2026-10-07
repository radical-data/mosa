import type { CollectionRecord, SourcedImage, SourceEntry } from "./collection";
import type { Holder, Predicate, Source } from "./collection-model";

export type CatalogueSection = "objects" | "sources";

export interface CatalogueDetail {
  label:
    | "classification"
    | "holder"
    | "catalogueNumber"
    | "author"
    | "date"
    | "about"
    | "documents";
  value: string;
  language?: string;
  hrefId?: string;
  sourceId?: string;
}

export interface ObjectFacets {
  id: string;
  holderIds: string[];
  holderCountries: Record<string, string>;
  classifications: string[];
}

export interface DocumentFacets {
  id: string;
  kind: Source["kind"];
  topics: string[];
}

export interface CatalogueItem {
  key: string;
  id: string;
  section: CatalogueSection;
  title: string;
  language?: string;
  kind: "object" | Source["kind"];
  image?: SourcedImage;
  hasImage: boolean;
  details: CatalogueDetail[];
  search: string;
  directSearch: string;
  holderIds: string[];
  holderCountries: Record<string, string>;
  classifications: string[];
  topics: string[];
  sourceCount: number;
  galleryOnly?: boolean;
  objectFacets?: ObjectFacets[];
  documentFacets?: DocumentFacets[];
}

/** Browser payload after the server has rendered image assets and detail rows. */
export type CatalogueBrowseItem = Omit<CatalogueItem, "image" | "details">;

export interface CatalogueHolder {
  id: string;
  name: string;
  countryCode?: string;
}

export function buildCatalogueHolders(holders: readonly Holder[]): CatalogueHolder[] {
  return holders.map(({ id, name, countryCode }) => ({ id, name, countryCode }));
}

function imageText(images: readonly SourcedImage[]): string[] {
  return images.flatMap(({ image, source }) => [
    source.title,
    image.alt,
    image.caption ?? "",
    image.credit ?? "",
    image.rights ?? "",
    image.originalUrl ?? "",
  ]);
}

function distinct(values: readonly string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function linkedObjectIds(source: Source): string[] {
  return distinct([
    ...(source.objectIds ?? []),
    ...source.claims.map((claim) => claim.objectId),
    ...(source.relationships ?? []).flatMap((relationship) =>
      relationship.target.type === "object" ? [relationship.target.id] : [],
    ),
  ]);
}

const claimDetailLabels: Partial<Record<Predicate, CatalogueDetail["label"]>> = {
  classified_as: "classification",
  held_by: "holder",
  catalogue_number: "catalogueNumber",
};

/** Project only public catalogue fields; notes and preserved captures stay out of search. */
export function buildCatalogueItems(
  records: readonly CollectionRecord[],
  sources: readonly SourceEntry[],
  holders: readonly Holder[],
  galleryOnlySourceIds: readonly string[] = [],
): CatalogueItem[] {
  const galleryOnly = new Set(galleryOnlySourceIds);
  for (const id of galleryOnly) {
    const source = sources.find((source) => source.id === id);
    if (
      source?.kind !== "photograph" ||
      !records.some((record) => record.images.some((image) => image.source.id === id))
    )
      throw new Error(
        `Gallery-only source "${id}" must be a photograph available in an object gallery.`,
      );
  }
  const objectNames = new Map(records.map(({ object }) => [object.id, object.name]));
  const sourceNames = new Map(sources.map(({ id, title }) => [id, title]));
  const holderById = new Map(holders.map((holder) => [holder.id, holder]));

  const objectFacetsById = new Map(
    records.map(({ object, claims }) => {
      const holderIds = distinct(
        claims.flatMap(({ claim }) =>
          claim.predicate === "held_by" && claim.holderId ? [claim.holderId] : [],
        ),
      );
      return [
        object.id,
        {
          id: object.id,
          holderIds,
          holderCountries: Object.fromEntries(
            holderIds.flatMap((id) => {
              const code = holderById.get(id)?.countryCode;
              return code ? [[id, code]] : [];
            }),
          ),
          classifications: distinct(
            claims.flatMap(({ claim }) =>
              claim.predicate === "classified_as" ? [claim.value] : [],
            ),
          ),
        } satisfies ObjectFacets,
      ] as const;
    }),
  );
  const documentFacetsById = new Map(
    sources.map(
      (source) =>
        [
          source.id,
          {
            id: source.id,
            kind: source.kind,
            topics: source.topics ?? [],
          } satisfies DocumentFacets,
        ] as const,
    ),
  );

  const objects: CatalogueItem[] = records.map((record) => {
    const { object, claims } = record;
    const facets = objectFacetsById.get(object.id);
    if (!facets) throw new Error(`Missing object facets for ${object.id}`);
    const { holderIds, holderCountries, classifications } = facets;
    const details: CatalogueDetail[] = claims.flatMap(({ claim, source }) => {
      const label = claimDetailLabels[claim.predicate];
      return label
        ? [
            {
              label,
              value: claim.value,
              language: claim.language ?? source.language,
              sourceId: source.id,
            },
          ]
        : [];
    });
    if (record.sources.length)
      details.push({ label: "documents", value: String(record.sources.length) });
    const directSearch = [
      object.id,
      object.name,
      ...claims.flatMap(({ claim }) => [claim.predicate, claim.value]),
    ].join(" ");
    return {
      key: `objects/${object.id}`,
      id: object.id,
      section: "objects",
      title: object.name,
      kind: "object",
      image: record.images[0],
      hasImage: Boolean(record.images[0]),
      details,
      directSearch,
      search: [
        directSearch,
        ...record.sources.flatMap((source) => [
          source.title,
          source.author ?? "",
          source.reference,
          source.date ?? "",
        ]),
        ...holderIds.flatMap((id) => {
          const holder = holderById.get(id);
          return holder
            ? [holder.name, holder.location?.name ?? "", ...(holder.aliases ?? [])]
            : [];
        }),
        ...imageText(record.images),
      ].join(" "),
      holderIds,
      holderCountries,
      classifications,
      topics: [],
      sourceCount: record.sources.length,
      objectFacets: [facets],
      documentFacets: record.sources.flatMap((source) => {
        const facet = documentFacetsById.get(source.id);
        return facet ? [facet] : [];
      }),
    };
  });

  const documents: CatalogueItem[] = sources.map((source) => {
    const aboutIds = linkedObjectIds(source);
    const relatedSourceIds = distinct([
      ...(source.relationships ?? []).flatMap((relationship) =>
        relationship.target.type === "source" ? [relationship.target.id] : [],
      ),
      ...sources.flatMap((candidate) =>
        (candidate.relationships ?? []).some(
          (relationship) =>
            relationship.target.type === "source" && relationship.target.id === source.id,
        )
          ? [candidate.id]
          : [],
      ),
    ]);
    const details: CatalogueDetail[] = [
      ...(source.author
        ? [{ label: "author" as const, value: source.author, language: source.language }]
        : []),
      ...(source.date
        ? [{ label: "date" as const, value: source.date, language: source.language }]
        : []),
      ...aboutIds.flatMap((id) => {
        const name = objectNames.get(id);
        return name ? [{ label: "about" as const, value: name, hrefId: id }] : [];
      }),
    ];
    const directSearch = [
      source.id,
      source.title,
      source.kind,
      source.author ?? "",
      source.reference,
      source.date ?? "",
      ...(source.topics ?? []),
      ...source.claims.flatMap((claim) => [claim.predicate, claim.value]),
      ...imageText(source.imagesWithAssets),
    ].join(" ");
    return {
      key: `sources/${source.id}`,
      id: source.id,
      section: "sources",
      galleryOnly: galleryOnly.has(source.id),
      title: source.title,
      language: source.language,
      kind: source.kind,
      image: source.imagesWithAssets[0],
      hasImage: Boolean(source.imagesWithAssets[0]),
      details,
      directSearch,
      search: [
        directSearch,
        ...aboutIds.map((id) => objectNames.get(id) ?? ""),
        ...relatedSourceIds.map((id) => sourceNames.get(id) ?? ""),
      ].join(" "),
      holderIds: [],
      holderCountries: {},
      classifications: [],
      topics: source.topics ?? [],
      sourceCount: 0,
      objectFacets: aboutIds.flatMap((id) => {
        const facet = objectFacetsById.get(id);
        return facet ? [facet] : [];
      }),
      documentFacets: [{ id: source.id, kind: source.kind, topics: source.topics ?? [] }],
    };
  });

  return [...objects, ...documents];
}

export interface BrowseState {
  scope: "all" | CatalogueSection;
  q: string;
  view: "grid" | "list";
  sort: "auto" | "name" | "name-desc";
  holder: string;
  country: string;
  kind: string;
  images: boolean;
  photos: boolean;
  limit: number;
}

const defaultLimit = 24;
const maximumLimit = 10_000;

export function readCatalogueState(
  parameters: URLSearchParams,
  defaultScope: BrowseState["scope"] = "all",
): BrowseState {
  const scope = parameters.get("scope");
  const sort = parameters.get("sort");
  const view = parameters.get("view");
  const requestedLimit = Number(parameters.get("limit"));
  return {
    scope: scope === "all" || scope === "objects" || scope === "sources" ? scope : defaultScope,
    q: parameters.get("q")?.trim() ?? "",
    view: view === "list" || view === "table" ? "list" : "grid",
    sort: sort === "name" || sort === "name-desc" ? sort : "auto",
    holder: parameters.get("holder") ?? "",
    country: parameters.get("country") ?? "",
    kind: parameters.get("kind") ?? "",
    images: parameters.get("images") === "1" || parameters.get("images") === "true",
    photos: parameters.get("photos") === "1",
    limit:
      Number.isFinite(requestedLimit) && requestedLimit > 0
        ? Math.min(maximumLimit, Math.floor(requestedLimit))
        : defaultLimit,
  };
}

export function catalogueParameters(state: BrowseState): URLSearchParams {
  const parameters = new URLSearchParams();
  if (state.scope !== "all") parameters.set("scope", state.scope);
  if (state.q.trim()) parameters.set("q", state.q.trim());
  if (state.view !== "grid") parameters.set("view", state.view);
  if (state.sort !== "auto") parameters.set("sort", state.sort);
  for (const key of ["holder", "country", "kind"] as const)
    if (state[key]) parameters.set(key, state[key]);
  if (state.images) parameters.set("images", "1");
  if (state.photos) parameters.set("photos", "1");
  if (state.limit !== defaultLimit)
    parameters.set("limit", String(Math.min(maximumLimit, Math.max(1, Math.floor(state.limit)))));
  return parameters;
}

const caseFold = (value: string) => value.normalize("NFC").toLowerCase();
const accentFold = (value: string) =>
  caseFold(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

function matchesQuery(item: CatalogueBrowseItem, query: string): boolean {
  if (!query) return true;
  const exact = caseFold(query);
  return (
    caseFold(item.search).includes(exact) || accentFold(item.title).includes(accentFold(query))
  );
}

function relevance(item: CatalogueBrowseItem, query: string): number {
  if (!query) return 0;
  const term = caseFold(query);
  const title = caseFold(item.title);
  const foldedTerm = accentFold(query);
  const foldedTitle = accentFold(item.title);
  if (title === term || foldedTitle === foldedTerm) return 4;
  if (title.startsWith(term) || foldedTitle.startsWith(foldedTerm)) return 3;
  if (caseFold(item.directSearch).includes(term)) return 2;
  return 1;
}

export function effectiveCatalogueSort(state: BrowseState): "relevance" | "name" | "name-desc" {
  return state.sort === "auto" ? (state.q.trim() ? "relevance" : "name") : state.sort;
}

function objectFacetsFor(item: CatalogueBrowseItem): ObjectFacets[] {
  if (item.objectFacets) return item.objectFacets;
  return item.section === "objects"
    ? [
        {
          id: item.id,
          holderIds: item.holderIds,
          holderCountries: item.holderCountries,
          classifications: item.classifications,
        },
      ]
    : [];
}

function documentFacetsFor(item: CatalogueBrowseItem): DocumentFacets[] {
  if (item.documentFacets) return item.documentFacets;
  return item.section === "sources"
    ? [{ id: item.id, kind: item.kind as Source["kind"], topics: item.topics }]
    : [];
}

function matchesFacets(item: CatalogueBrowseItem, state: BrowseState): boolean {
  if (state.holder || state.country) {
    const matchesObject = objectFacetsFor(item).some(
      (facets) =>
        (!state.holder || facets.holderIds.includes(state.holder)) &&
        (!state.country ||
          (state.holder
            ? facets.holderCountries[state.holder] === state.country
            : Object.values(facets.holderCountries).includes(state.country))),
    );
    if (!matchesObject) return false;
  }
  if (state.kind) return documentFacetsFor(item).some((facets) => facets.kind === state.kind);
  return true;
}

export function matchCatalogues<T extends CatalogueBrowseItem>(
  items: readonly T[],
  state: BrowseState,
  locale = "en",
): {
  items: T[];
  counts: { all: number; objects: number; sources: number };
  groupedPhotos: number;
} {
  const matching = items.filter(
    (item) =>
      matchesQuery(item, state.q.trim()) &&
      (!state.images || item.hasImage) &&
      matchesFacets(item, state),
  );
  const groupedPhotos = state.photos ? 0 : matching.filter((item) => item.galleryOnly).length;
  const filtered = state.photos ? matching : matching.filter((item) => !item.galleryOnly);
  const counts = {
    all: filtered.length,
    objects: filtered.filter((item) => item.section === "objects").length,
    sources: filtered.filter((item) => item.section === "sources").length,
  };
  const scoped = filtered.filter((item) => state.scope === "all" || item.section === state.scope);
  const collator = new Intl.Collator(locale, { sensitivity: "base" });
  const sort = effectiveCatalogueSort(state);
  scoped.sort((a, b) => {
    if (sort === "relevance") {
      const score = relevance(b, state.q.trim()) - relevance(a, state.q.trim());
      if (score) return score;
    }
    const name = collator.compare(a.title, b.title);
    if (name) return sort === "name-desc" ? -name : name;
    return a.key.localeCompare(b.key, locale);
  });
  return { items: scoped, counts, groupedPhotos };
}

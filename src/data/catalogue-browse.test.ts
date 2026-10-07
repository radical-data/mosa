import { describe, expect, it } from "vitest";
import {
  buildCatalogueHolders,
  buildCatalogueItems,
  type CatalogueBrowseItem,
  type CatalogueItem,
  catalogueParameters,
  effectiveCatalogueSort,
  matchCatalogues,
  type ObjectFacets,
  readCatalogueState,
} from "./catalogue-browse";
import type { CollectionRecord, SourcedImage, SourceEntry } from "./collection";
import type { Holder } from "./collection-model";

const state = (query = "") => readCatalogueState(new URLSearchParams(query));

const item = (
  key: string,
  title: string,
  section: "objects" | "sources",
  search = title,
): CatalogueItem => ({
  key,
  id: key.split("/")[1],
  section,
  title,
  kind: section === "objects" ? "object" : "publication",
  hasImage: false,
  details: [],
  search,
  directSearch: title,
  holderIds: [],
  holderCountries: {},
  classifications: [],
  topics: [],
  sourceCount: 0,
});

describe("catalogue browsing", () => {
  it("treats whitespace-only input as an empty search without changing the typed value", () => {
    const typed = { ...state(), q: "   " };
    expect(effectiveCatalogueSort(typed)).toBe("name");
    expect(matchCatalogues([item("objects/a", "A", "objects")], typed).counts.all).toBe(1);
    expect(catalogueParameters(typed).has("q")).toBe(false);
    expect(typed.q).toBe("   ");
  });

  it("keeps source-only matches visible and counts both sections independently of scope", () => {
    const items = [
      item("objects/stone", "Carved figure", "objects"),
      item(
        "sources/archive",
        "Harbour archive",
        "sources",
        "Harbour archive remote harbour record",
      ),
    ];
    const browserItems: CatalogueBrowseItem[] = items.map(
      ({ image: _image, details: _details, ...entry }) => entry,
    );
    expect(matchCatalogues(browserItems, state("q=harbour")).items.map(({ key }) => key)).toEqual([
      "sources/archive",
    ]);
    expect(matchCatalogues(items, state("q=harbour&scope=objects")).counts).toEqual({
      all: 1,
      objects: 0,
      sources: 1,
    });
  });

  it("uses directly associated objects and documents for the same facets in every scope", () => {
    const figure = {
      ...item("objects/figure", "Figure", "objects"),
      holderIds: ["holder-a", "holder-b"],
      holderCountries: { "holder-a": "GB", "holder-b": "FR" },
      classifications: ["moai", "stone figure"],
      documentFacets: [{ id: "photo", kind: "photograph" as const, topics: ["representations"] }],
    };
    const document = {
      ...item("sources/photo", "Photograph", "sources"),
      kind: "photograph" as const,
      topics: ["representations"],
      objectFacets: [
        {
          id: "figure",
          holderIds: ["holder-a", "holder-b"],
          holderCountries: { "holder-a": "GB", "holder-b": "FR" },
          classifications: ["moai", "stone figure"],
        },
      ],
    };
    const items = [figure, document];
    expect(
      matchCatalogues(items, state("holder=holder-b&country=FR&kind=photograph")).counts,
    ).toEqual({
      all: 2,
      objects: 1,
      sources: 1,
    });
    expect(matchCatalogues(items, state("scope=sources&holder=holder-b&country=FR")).items).toEqual(
      [document],
    );
    expect(matchCatalogues(items, state("scope=objects&kind=photograph")).items).toEqual([figure]);
    expect(matchCatalogues(items, state("holder=holder-a&country=FR")).counts).toEqual({
      all: 0,
      objects: 0,
      sources: 0,
    });
    expect(matchCatalogues(items, state("scope=sources&kind=publication")).counts.all).toBe(0);
  });

  it("requires institution and country to match the same related object", () => {
    const relatedObjects: ObjectFacets[] = [
      {
        id: "first",
        holderIds: ["museum"],
        holderCountries: { museum: "GB" },
        classifications: [],
      },
      { id: "second", holderIds: ["other"], holderCountries: { other: "FR" }, classifications: [] },
    ];
    const document = {
      ...item("sources/multiple", "Multiple objects", "sources"),
      objectFacets: relatedObjects,
    };
    expect(matchCatalogues([document], state("holder=museum&country=FR")).counts.all).toBe(0);
  });

  it("ignores retired classification and topic filters in bookmarks", () => {
    const restored = state("classification=figure&topic=representations&country=GB");
    const entry = {
      ...item("objects/figure", "Figure", "objects"),
      holderIds: ["museum"],
      holderCountries: { museum: "GB" },
    };
    expect(matchCatalogues([entry], restored).items).toEqual([entry]);
    expect(catalogueParameters(restored).toString()).toBe("country=GB");
  });

  it("ranks title and direct matches above relational matches, then sorts deterministically", () => {
    const direct = {
      ...item("sources/direct", "Record", "sources", "Record tidal"),
      directSearch: "Record tidal",
    };
    const relational = item("sources/related", "A document", "sources", "A document tidal");
    const title = item("objects/tidal", "Tidal figure", "objects");
    const items = [relational, direct, title];
    expect(matchCatalogues(items, state("q=tidal&view=list")).items.map(({ key }) => key)).toEqual([
      "objects/tidal",
      "sources/direct",
      "sources/related",
    ]);
    expect(
      matchCatalogues(items, state("q=tidal&view=grid&sort=name-desc")).items.map(({ key }) => key),
    ).toEqual(["objects/tidal", "sources/direct", "sources/related"]);
    expect(matchCatalogues(items, state("q=tidal&sort=name")).items.map(({ key }) => key)).toEqual([
      "sources/related",
      "sources/direct",
      "objects/tidal",
    ]);
    expect(matchCatalogues(items, state()).items.map(({ key }) => key)).toEqual([
      "sources/related",
      "sources/direct",
      "objects/tidal",
    ]);
    expect(effectiveCatalogueSort(state())).toBe("name");
    expect(effectiveCatalogueSort(state("q=tidal"))).toBe("relevance");
    expect(effectiveCatalogueSort(state("q=tidal&sort=name"))).toBe("name");
  });

  it("filters countries through the same institution and leaves unknown countries unassigned", () => {
    const known = {
      ...item("objects/known", "Known", "objects"),
      holderIds: ["british", "chilean"],
      holderCountries: { british: "GB", chilean: "CL" },
    };
    const unknown = { ...item("objects/unknown", "Unknown", "objects"), holderIds: ["private"] };
    const entries = [known, unknown];
    expect(matchCatalogues(entries, state("scope=objects&country=CL")).items).toEqual([known]);
    expect(
      matchCatalogues(entries, state("scope=objects&country=CL&holder=british")).items,
    ).toEqual([]);
    expect(
      matchCatalogues(entries, state("scope=objects&country=GB&holder=british")).items,
    ).toEqual([known]);
    expect(matchCatalogues(entries, state("scope=objects")).items).toHaveLength(2);
  });

  it("groups reviewed gallery photographs in All and Sources with additive counts", () => {
    const object = item("objects/figure", "Figure", "objects");
    const routine = {
      ...item("sources/gallery", "Unique portrait", "sources"),
      kind: "photograph" as const,
      galleryOnly: true,
      hasImage: true,
    };
    const historical = {
      ...item("sources/historic", "Historical photograph", "sources"),
      kind: "photograph" as const,
    };
    const entries = [object, routine, historical];
    const overview = matchCatalogues(entries, state());
    expect(overview.items).toEqual([object, historical]);
    expect(overview.counts).toEqual({ all: 2, objects: 1, sources: 1 });
    expect(overview.groupedPhotos).toBe(1);
    expect(matchCatalogues(entries, state("scope=sources")).items).toEqual([historical]);
    expect(matchCatalogues(entries, state("q=Unique")).counts).toEqual({
      all: 0,
      objects: 0,
      sources: 0,
    });
    expect(matchCatalogues(entries, state("q=Unique&photos=1")).items).toEqual([routine]);
    expect(matchCatalogues(entries, state("q=Unique&scope=sources")).items).toEqual([]);
    expect(matchCatalogues(entries, state("q=Unique&scope=sources")).groupedPhotos).toBe(1);
    expect(matchCatalogues(entries, state("images=1")).groupedPhotos).toBe(1);
    expect(matchCatalogues(entries, state("images=1")).counts.all).toBe(0);
    expect(matchCatalogues(entries, state("photos=1")).counts).toEqual({
      all: 3,
      objects: 1,
      sources: 2,
    });
    expect(matchCatalogues(entries, state("kind=publication")).groupedPhotos).toBe(0);
    const parameters = catalogueParameters(state("scope=objects&country=CL&photos=1"));
    expect(state(parameters.toString())).toMatchObject({ country: "CL", photos: true });
  });

  it("supports accent folding in titles while preserving exact matching elsewhere", () => {
    const items = [item("objects/moai", "Māori carving", "objects", "Māori carving Hā'a")];
    expect(matchCatalogues(items, state("q=Maori")).counts.all).toBe(1);
    expect(matchCatalogues(items, state("q=Ha'a")).counts.all).toBe(0);
    expect(matchCatalogues(items, state("q=Hā'a")).counts.all).toBe(1);
  });

  it("reads legacy table URLs, bounds limits and serialises non-default parameters", () => {
    const legacy = state("view=table&limit=999&q=%20moai%20&images=true&scope=sources");
    expect(legacy).toMatchObject({
      view: "list",
      limit: 999,
      q: "moai",
      images: true,
      scope: "sources",
    });
    expect(catalogueParameters(legacy).toString()).toBe(
      "scope=sources&q=moai&view=list&images=1&limit=999",
    );
    expect(state("limit=1285").limit).toBe(1285);
    expect(state(catalogueParameters(state("limit=1285")).toString()).limit).toBe(1285);
    expect(state("limit=10001").limit).toBe(10_000);
    expect(catalogueParameters(state()).toString()).toBe("");
    expect(state("sort=relevance").sort).toBe("auto");
    expect(catalogueParameters(state("sort=name")).toString()).toBe("sort=name");
    expect(catalogueParameters(state("q=moai&sort=name")).toString()).toBe("q=moai&sort=name");
    expect(state("limit=abc").limit).toBe(24);
    expect(readCatalogueState(new URLSearchParams(), "objects").scope).toBe("objects");
  });
});

describe("catalogue projection", () => {
  const holder = {
    id: "museum",
    countryCode: "GB",
    name: "Museum",
    location: {
      name: "Edinburgh, Scotland",
      precision: "locality",
      longitude: 0,
      latitude: 0,
      reference: "ref",
    },
  } as Holder;
  const archive = {
    id: "archive",
    title: "Hā'a image archive",
    kind: "photograph",
    author: "Photographer",
    reference: "archive-42",
    language: "en-GB",
    date: "1900",
    topics: ["representations"],
    objectIds: [],
    relationships: [{ type: "depicts", target: { type: "object", id: "figure" } }],
    claims: [],
    images: [],
    imagesWithAssets: [],
    notes: { text: "private research expression", language: "en-GB" },
    captures: [{ file: "secret-capture.pdf", capturedAt: null, method: "download" }],
    searchText: "",
  } as SourceEntry;
  const catalogue = {
    id: "catalogue",
    title: "Museum catalogue",
    kind: "webpage",
    author: "Museum author",
    reference: "https://museum.example/figure",
    language: "en-GB",
    date: "2001",
    objectIds: [],
    relationships: [{ type: "reproduces", target: { type: "source", id: "archive" } }],
    claims: [
      { id: "material", objectId: "figure", predicate: "made_of", value: "volcanic tuff" },
      { id: "classification", objectId: "figure", predicate: "classified_as", value: "moai" },
      {
        id: "holder",
        objectId: "figure",
        predicate: "held_by",
        value: "Museum (reported)",
        holderId: "museum",
      },
      { id: "number", objectId: "figure", predicate: "catalogue_number", value: "A-42" },
    ],
    images: [],
    imagesWithAssets: [],
    searchText: "",
  } as SourceEntry;
  const image: SourcedImage = {
    image: {
      file: "archive.jpg",
      alt: "Front view of the figure",
      caption: "Carved surface",
      credit: "Archive photographer",
      rights: "Public domain",
    },
    source: archive,
    asset: { src: "/archive.jpg", width: 1, height: 1, format: "jpg" },
  };
  archive.imagesWithAssets.push(image);
  const record = {
    object: { id: "figure", name: "Figure", foregroundedClaims: [] },
    sources: [catalogue, archive],
    claims: catalogue.claims.map((claim) => ({ claim, source: catalogue })),
    images: [image],
  } as unknown as CollectionRecord;

  it("rejects gallery grouping without an accessible object photograph", () => {
    expect(() =>
      buildCatalogueItems([record], [catalogue, archive], [holder], ["missing"]),
    ).toThrow("must be a photograph");
    expect(() =>
      buildCatalogueItems([record], [catalogue, archive], [holder], ["catalogue"]),
    ).toThrow("must be a photograph");
    const entries = buildCatalogueItems([record], [catalogue, archive], [holder], ["archive"]);
    expect(entries.find((entry) => entry.id === "archive")?.galleryOnly).toBe(true);
  });

  it("retains claim wording and searches public metadata without notes or captures", () => {
    const [object, source, photo] = buildCatalogueItems([record], [catalogue, archive], [holder]);
    expect(object.details).toEqual([
      { label: "classification", value: "moai", language: "en-GB", sourceId: "catalogue" },
      { label: "holder", value: "Museum (reported)", language: "en-GB", sourceId: "catalogue" },
      { label: "catalogueNumber", value: "A-42", language: "en-GB", sourceId: "catalogue" },
      { label: "documents", value: "2" },
    ]);
    expect(object.search).toContain("volcanic tuff");
    expect(object.search).toContain("Museum author");
    expect(object.search).toContain("Edinburgh, Scotland");
    expect(object.search).toContain("Carved surface");
    expect(object.holderIds).toEqual(["museum"]);
    expect(source.details).toContainEqual({ label: "about", value: "Figure", hrefId: "figure" });
    expect(source.details).toContainEqual({ label: "date", value: "2001", language: "en-GB" });
    expect(source.search).toContain("Hā'a image archive");
    expect(photo.search).toContain("Figure");
    expect(photo.search).toContain("Archive photographer");
    expect(photo.hasImage).toBe(true);
    expect(photo.search).not.toContain("private research expression");
    expect(photo.search).not.toContain("secret-capture.pdf");
    expect(photo.holderIds).toEqual([]);
    expect(photo.objectFacets).toEqual(object.objectFacets);
    expect(object.documentFacets).toEqual([
      { id: "catalogue", kind: "webpage", topics: [] },
      { id: "archive", kind: "photograph", topics: ["representations"] },
    ]);
    expect(object.holderCountries).toEqual({ museum: "GB" });
    expect(buildCatalogueHolders([holder])).toEqual([
      { id: "museum", name: "Museum", countryCode: "GB" },
    ]);
  });
});

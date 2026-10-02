import { parse as parseYaml } from "yaml";

export const predicates = [
  "has_name",
  "classified_as",
  "described_as",
  "made_of",
  "made_at",
  "made_during",
  "found_at",
  "held_by",
  "located_at",
  "catalogue_number",
] as const;

export type Predicate = (typeof predicates)[number];

export interface CollectionObject {
  id: string;
  name: string;
  foregroundedClaims: string[];
}

export interface Claim {
  id: string;
  objectId: string;
  predicate: Predicate;
  value: string;
  language?: string;
  locator?: string;
  holderId?: string;
}

export interface Holder {
  id: string;
  name: string;
  aliases?: string[];
  visitUrl?: string;
  location?: GeocodedLocation;
}

export type LocationPrecision = "site" | "locality" | "region" | "country";

export interface GeocodedLocation {
  name: string;
  precision: LocationPrecision;
  longitude: number;
  latitude: number;
  reference: string;
}

export type LocationStatus = "reported" | "historical" | "uncertain" | "unknown";

export interface ObjectLocation {
  id: string;
  status: LocationStatus;
  claimReferences: string[];
  holderId?: string;
  location?: GeocodedLocation;
  reviewedAt: string;
  note?: { text: string; language: string };
}

export interface CollectionImage {
  file: string;
  alt: string;
  depicts?: string[];
  originalUrl?: string;
  caption?: string;
  credit?: string;
  rights?: string;
}

export const sourceKinds = [
  "webpage",
  "publication",
  "photograph",
  "artwork",
  "correspondence",
  "audiovisual",
  "other",
] as const;

export type SourceKind = (typeof sourceKinds)[number];

export const sourceTopics = [
  "displacement",
  "restitution",
  "museum-practices",
  "representations",
] as const;

export type SourceTopic = (typeof sourceTopics)[number];

export interface RecordReference {
  type: "object" | "source";
  id: string;
}

export const sourceRelationshipTypes = [
  "depicts",
  "reproduces",
  "discusses",
  "is_part_of",
] as const;

export type SourceRelationshipType = (typeof sourceRelationshipTypes)[number];

export interface SourceRelationship {
  type: SourceRelationshipType;
  target: RecordReference;
  locator?: string;
}

export type SourceCaptureMethod = "singlefile" | "download" | "supplied-file" | "browser-pdf";

export interface SourceCapture {
  file?: string;
  originalUrl?: string;
  archiveUrl?: string;
  capturedAt: string | null;
  method: SourceCaptureMethod;
  note?: string;
}

export interface Source {
  id: string;
  title: string;
  kind: SourceKind;
  author: string | null;
  reference: string;
  language: string;
  date?: string;
  topics?: SourceTopic[];
  objectIds?: string[];
  relationships?: SourceRelationship[];
  notes?: { text: string; language: string };
  captures?: SourceCapture[];
  claims: Claim[];
  images: CollectionImage[];
}

export interface ArticleMetadata {
  id: string;
  subjects?: RecordReference[];
  title: string;
  summary?: string;
  author: string | null;
  language: string;
}

export interface CollectionData {
  objects: CollectionObject[];
  sources: Source[];
  holders?: Holder[];
  locations?: ObjectLocation[];
}

const identifier = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const claimReference = /^[a-z0-9]+(?:-[a-z0-9]+)*\/[a-z0-9]+(?:-[a-z0-9]+)*$/;
const language = /^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/;
const imagePath = /^(?!\/)(?!.*(?:^|\/)\.\.(?:\/|$)).+\.(?:avif|jpe?g|png|webp)$/i;
const captureMethods: SourceCaptureMethod[] = [
  "singlefile",
  "download",
  "supplied-file",
  "browser-pdf",
];
const objectKeys = ["foregroundedClaims", "name"];
const sourceKeys = [
  "author",
  "captures",
  "claims",
  "date",
  "images",
  "kind",
  "language",
  "notes",
  "objectIds",
  "reference",
  "relationships",
  "title",
  "topics",
];
const claimKeys = ["id", "objectId", "predicate", "value", "language", "locator", "holderId"];
const imageKeys = ["alt", "caption", "credit", "depicts", "file", "originalUrl", "rights"];
const relationshipKeys = ["locator", "target", "type"];
const recordReferenceKeys = ["id", "type"];
const captureKeys = ["archiveUrl", "capturedAt", "file", "method", "note", "originalUrl"];
const captureExtensions = "html|pdf|jpg|jpeg|png|webp|avif|tif|tiff";
const locationPrecisions: LocationPrecision[] = ["site", "locality", "region", "country"];
const locationStatuses: LocationStatus[] = ["reported", "historical", "uncertain", "unknown"];

const isObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);
const sameKeys = (value: Record<string, unknown>, allowed: string[]) =>
  Object.keys(value).every((key) => allowed.includes(key));
const text = (value: unknown) => typeof value === "string" && value.trim().length > 0;
const id = (value: unknown) => typeof value === "string" && identifier.test(value);
const reference = (value: unknown) => typeof value === "string" && claimReference.test(value);
const validUtcTimestamp = (value: unknown) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(value))
    return false;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return false;
  return date.toISOString().slice(0, 19) === value.slice(0, 19);
};
const validHttpUrl = (value: unknown) => {
  if (typeof value !== "string" || !/^https?:\/\//i.test(value)) return false;
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
};
const validArchiveUrl = (value: unknown) => {
  if (typeof value !== "string") return false;
  const match = /^https:\/\/web\.archive\.org\/web\/(\d{14})(?:id_|if_)?\/(https?:\/\/.+)$/.exec(
    value,
  );
  if (!match) return false;
  const [, timestamp, originalUrl] = match;
  const capturedAt = `${timestamp.slice(0, 4)}-${timestamp.slice(4, 6)}-${timestamp.slice(6, 8)}T${timestamp.slice(8, 10)}:${timestamp.slice(10, 12)}:${timestamp.slice(12, 14)}Z`;
  return validUtcTimestamp(capturedAt) && validHttpUrl(originalUrl);
};
const add = (errors: string[], condition: boolean, message: string) => {
  if (!condition) errors.push(message);
};

const fileId = (file: string, extension: string) => {
  const match = new RegExp(`^([a-z0-9]+(?:-[a-z0-9]+)*)\\.${extension}$`).exec(file);
  if (!match) throw Error(`${file}: filename is not a valid identifier`);
  return match[1];
};

export const qualifyClaim = (sourceId: string, claimId: string) => `${sourceId}/${claimId}`;

export function parseObject(value: unknown, file: string): CollectionObject {
  const errors: string[] = [];
  const objectId = fileId(file, "json");
  add(errors, isObject(value), `${file}: expected an object`);
  if (!isObject(value)) throw Error(errors.join("\n"));
  add(errors, sameKeys(value, objectKeys), `${file}: contains an unsupported field`);
  add(errors, text(value.name), `${file}: name is required`);
  add(
    errors,
    Array.isArray(value.foregroundedClaims),
    `${file}: foregroundedClaims must be an array`,
  );
  if (Array.isArray(value.foregroundedClaims)) {
    add(
      errors,
      value.foregroundedClaims.every(reference),
      `${file}: foregroundedClaims contains an invalid claim reference`,
    );
    add(
      errors,
      new Set(value.foregroundedClaims).size === value.foregroundedClaims.length,
      `${file}: foregroundedClaims contains duplicates`,
    );
  }
  if (errors.length) throw Error(errors.join("\n"));
  return { ...(value as Omit<CollectionObject, "id">), id: objectId };
}

function parseGeocodedLocation(value: unknown, at: string, errors: string[]) {
  add(errors, isObject(value), `${at} must be an object`);
  if (!isObject(value)) return;
  add(
    errors,
    sameKeys(value, ["name", "precision", "longitude", "latitude", "reference"]),
    `${at} contains an unsupported field`,
  );
  add(errors, text(value.name), `${at}.name is required`);
  add(
    errors,
    locationPrecisions.includes(value.precision as LocationPrecision),
    `${at}.precision is unsupported`,
  );
  add(
    errors,
    typeof value.longitude === "number" &&
      Number.isFinite(value.longitude) &&
      value.longitude >= -180 &&
      value.longitude <= 180,
    `${at}.longitude must be between -180 and 180`,
  );
  add(
    errors,
    typeof value.latitude === "number" &&
      Number.isFinite(value.latitude) &&
      value.latitude >= -90 &&
      value.latitude <= 90,
    `${at}.latitude must be between -90 and 90`,
  );
  add(errors, validHttpUrl(value.reference), `${at}.reference must be an http(s) URL`);
}

export function parseHolder(value: unknown, file: string): Holder {
  const errors: string[] = [];
  const holderId = fileId(file, "json");
  add(errors, isObject(value), `${file}: expected an object`);
  if (!isObject(value)) throw Error(errors.join("\n"));
  add(
    errors,
    sameKeys(value, ["name", "aliases", "location", "visitUrl"]),
    `${file}: contains an unsupported field`,
  );
  add(errors, text(value.name), `${file}: name is required`);
  if ("aliases" in value) {
    add(errors, Array.isArray(value.aliases), `${file}: aliases must be an array`);
    if (Array.isArray(value.aliases)) {
      add(errors, value.aliases.every(text), `${file}: aliases contains an invalid alias`);
      add(
        errors,
        new Set(value.aliases).size === value.aliases.length,
        `${file}: aliases contains duplicates`,
      );
    }
  }
  if ("location" in value) parseGeocodedLocation(value.location, `${file}: location`, errors);
  if ("visitUrl" in value)
    add(errors, validHttpUrl(value.visitUrl), `${file}: visitUrl must be an http(s) URL`);
  if (errors.length) throw Error(errors.join("\n"));
  return { ...(value as Omit<Holder, "id">), id: holderId };
}

export function parseLocation(value: unknown, file: string): ObjectLocation {
  const errors: string[] = [];
  const objectId = fileId(file, "json");
  add(errors, isObject(value), `${file}: expected an object`);
  if (!isObject(value)) throw Error(errors.join("\n"));
  add(
    errors,
    sameKeys(value, ["status", "claimReferences", "holderId", "location", "reviewedAt", "note"]),
    `${file}: contains an unsupported field`,
  );
  add(
    errors,
    locationStatuses.includes(value.status as LocationStatus),
    `${file}: status is unsupported`,
  );
  add(errors, Array.isArray(value.claimReferences), `${file}: claimReferences must be an array`);
  if (Array.isArray(value.claimReferences)) {
    add(
      errors,
      value.claimReferences.every(reference),
      `${file}: claimReferences contains an invalid claim reference`,
    );
    add(
      errors,
      new Set(value.claimReferences).size === value.claimReferences.length,
      `${file}: claimReferences contains duplicates`,
    );
  }
  if ("holderId" in value) add(errors, id(value.holderId), `${file}: holderId is invalid`);
  if ("location" in value) parseGeocodedLocation(value.location, `${file}: location`, errors);
  add(
    errors,
    typeof value.reviewedAt === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(value.reviewedAt) &&
      Number.isFinite(Date.parse(`${value.reviewedAt}T00:00:00Z`)) &&
      new Date(`${value.reviewedAt}T00:00:00Z`).toISOString().slice(0, 10) === value.reviewedAt,
    `${file}: reviewedAt must be a valid YYYY-MM-DD date`,
  );
  if ("note" in value) {
    add(errors, isObject(value.note), `${file}: note must be an object`);
    if (isObject(value.note)) {
      add(
        errors,
        sameKeys(value.note, ["text", "language"]),
        `${file}: note contains an unsupported field`,
      );
      add(errors, text(value.note.text), `${file}: note.text is required`);
      add(
        errors,
        typeof value.note.language === "string" && language.test(value.note.language),
        `${file}: note.language is invalid`,
      );
    }
  }
  if (value.status === "unknown")
    add(errors, !("location" in value), `${file}: unknown location cannot have a location`);
  if (["historical", "uncertain"].includes(String(value.status)))
    add(errors, "note" in value, `${file}: ${value.status} location requires a note`);
  if (errors.length) throw Error(errors.join("\n"));
  return { ...(value as Omit<ObjectLocation, "id">), id: objectId };
}

export function parseSource(value: unknown, file: string): Source {
  const errors: string[] = [];
  const sourceId = fileId(file, "json");
  add(errors, isObject(value), `${file}: expected an object`);
  if (!isObject(value)) throw Error(errors.join("\n"));
  add(errors, sameKeys(value, sourceKeys), `${file}: contains an unsupported field`);
  add(errors, text(value.title), `${file}: title is required`);
  add(errors, sourceKinds.includes(value.kind as SourceKind), `${file}: kind is unsupported`);
  add(errors, value.author === null || text(value.author), `${file}: author must be text or null`);
  add(errors, text(value.reference), `${file}: reference is required`);
  add(
    errors,
    typeof value.language === "string" && language.test(value.language),
    `${file}: language is invalid`,
  );
  if ("date" in value) add(errors, text(value.date), `${file}: date must be non-empty text`);
  if ("topics" in value) {
    add(errors, Array.isArray(value.topics), `${file}: topics must be an array`);
    if (Array.isArray(value.topics)) {
      add(
        errors,
        value.topics.every((topic) => sourceTopics.includes(topic as SourceTopic)),
        `${file}: topics contains an unsupported topic`,
      );
      add(
        errors,
        new Set(value.topics).size === value.topics.length,
        `${file}: topics contains duplicates`,
      );
    }
  }
  add(errors, Array.isArray(value.claims), `${file}: claims must be an array`);
  add(errors, Array.isArray(value.images), `${file}: images must be an array`);
  if ("objectIds" in value) {
    add(errors, Array.isArray(value.objectIds), `${file}: objectIds must be an array`);
    if (Array.isArray(value.objectIds)) {
      add(errors, value.objectIds.length > 0, `${file}: objectIds cannot be empty`);
      add(errors, value.objectIds.every(id), `${file}: objectIds contains an invalid object ID`);
      add(
        errors,
        new Set(value.objectIds).size === value.objectIds.length,
        `${file}: objectIds contains duplicates`,
      );
    }
  }
  if ("relationships" in value) {
    add(errors, Array.isArray(value.relationships), `${file}: relationships must be an array`);
    if (Array.isArray(value.relationships)) {
      value.relationships.forEach((relationship, index) => {
        const at = `${file}: relationships[${index}]`;
        add(errors, isObject(relationship), `${at} must be an object`);
        if (!isObject(relationship)) return;
        add(
          errors,
          sameKeys(relationship, relationshipKeys),
          `${at} contains an unsupported field`,
        );
        add(
          errors,
          sourceRelationshipTypes.includes(relationship.type as SourceRelationshipType),
          `${at}.type is unsupported`,
        );
        add(errors, isObject(relationship.target), `${at}.target must be an object reference`);
        if (isObject(relationship.target)) {
          add(
            errors,
            sameKeys(relationship.target, recordReferenceKeys),
            `${at}.target contains an unsupported field`,
          );
          add(
            errors,
            ["object", "source"].includes(String(relationship.target.type)),
            `${at}.target.type is unsupported`,
          );
          add(errors, id(relationship.target.id), `${at}.target.id is invalid`);
        }
        if ("locator" in relationship)
          add(errors, text(relationship.locator), `${at}.locator must be non-empty text`);
        if (relationship.type === "depicts" && isObject(relationship.target))
          add(errors, relationship.target.type === "object", `${at}.depicts must target an object`);
        if (
          ["reproduces", "discusses", "is_part_of"].includes(String(relationship.type)) &&
          isObject(relationship.target)
        )
          add(
            errors,
            relationship.target.type === "source",
            `${at}.${relationship.type} must target a source`,
          );
      });
    }
  }
  if ("notes" in value) {
    add(errors, isObject(value.notes), `${file}: notes must be an object`);
    if (isObject(value.notes)) {
      add(
        errors,
        sameKeys(value.notes, ["text", "language"]),
        `${file}: notes contains an unsupported field`,
      );
      add(errors, text(value.notes.text), `${file}: notes.text is required`);
      add(
        errors,
        typeof value.notes.language === "string" && language.test(value.notes.language),
        `${file}: notes.language is invalid`,
      );
    }
  }
  if ("captures" in value) {
    add(errors, Array.isArray(value.captures), `${file}: captures must be an array`);
    if (Array.isArray(value.captures)) {
      const captureFiles = new Set<string>();
      const archiveUrls = new Set<string>();
      value.captures.forEach((capture, index) => {
        const at = `${file}: captures[${index}]`;
        add(errors, isObject(capture), `${at} must be an object`);
        if (!isObject(capture)) return;
        add(errors, sameKeys(capture, captureKeys), `${at} contains an unsupported field`);
        add(
          errors,
          "file" in capture || "archiveUrl" in capture,
          `${at} requires file or archiveUrl`,
        );
        if ("file" in capture) {
          const safeFile =
            typeof capture.file === "string" &&
            new RegExp(`^[a-z0-9]+(?:-[a-z0-9]+)*\\.(?:${captureExtensions})$`).test(capture.file);
          add(errors, safeFile, `${at}.file must be a plain capture filename`);
          if (typeof capture.file === "string") {
            add(
              errors,
              !captureFiles.has(capture.file),
              `${at}.file duplicates capture file ${capture.file}`,
            );
            captureFiles.add(capture.file);
          }
        }
        if ("originalUrl" in capture)
          add(errors, validHttpUrl(capture.originalUrl), `${at}.originalUrl must use http(s)`);
        if ("archiveUrl" in capture) {
          add(
            errors,
            validArchiveUrl(capture.archiveUrl),
            `${at}.archiveUrl must be an exact timestamped web.archive.org snapshot URL`,
          );
          if (typeof capture.archiveUrl === "string") {
            add(
              errors,
              !archiveUrls.has(capture.archiveUrl),
              `${at}.archiveUrl duplicates capture archive URL`,
            );
            archiveUrls.add(capture.archiveUrl);
          }
        }
        add(
          errors,
          capture.capturedAt === null || validUtcTimestamp(capture.capturedAt),
          `${at}.capturedAt must be a UTC timestamp or null`,
        );
        add(
          errors,
          captureMethods.includes(capture.method as SourceCaptureMethod),
          `${at}.method is unsupported`,
        );
        if ("note" in capture) add(errors, text(capture.note), `${at}.note cannot be empty`);
      });
    }
  }
  if (Array.isArray(value.claims))
    value.claims.forEach((claim, index) => {
      const at = `${file}: claims[${index}]`;
      add(errors, isObject(claim), `${at} must be an object`);
      if (!isObject(claim)) return;
      add(errors, sameKeys(claim, claimKeys), `${at} contains an unsupported field`);
      add(errors, id(claim.id), `${at}.id is invalid`);
      add(errors, id(claim.objectId), `${at}.objectId is invalid`);
      add(
        errors,
        predicates.includes(claim.predicate as Predicate),
        `${at}.predicate is unsupported`,
      );
      add(errors, text(claim.value), `${at}.value is required`);
      if ("language" in claim)
        add(
          errors,
          typeof claim.language === "string" && language.test(claim.language),
          `${at}.language is invalid`,
        );
      if ("locator" in claim)
        add(errors, text(claim.locator), `${at}.locator must be non-empty text`);
      if ("holderId" in claim) {
        add(errors, id(claim.holderId), `${at}.holderId is invalid`);
        add(
          errors,
          claim.predicate === "held_by",
          `${at}.holderId is only allowed for held_by claims`,
        );
      }
    });
  if (Array.isArray(value.images))
    value.images.forEach((entry, index) => {
      const at = `${file}: images[${index}]`;
      add(errors, isObject(entry), `${at} must be an object`);
      if (!isObject(entry)) return;
      add(errors, sameKeys(entry, imageKeys), `${at} contains an unsupported field`);
      add(
        errors,
        typeof entry.file === "string" && imagePath.test(entry.file),
        `${at}.file must be a safe collection image path`,
      );
      add(errors, typeof entry.alt === "string", `${at}.alt is required`);
      if ("depicts" in entry) {
        add(errors, Array.isArray(entry.depicts), `${at}.depicts must be an array`);
        if (Array.isArray(entry.depicts)) {
          add(errors, entry.depicts.every(id), `${at}.depicts contains an invalid object ID`);
          add(
            errors,
            new Set(entry.depicts).size === entry.depicts.length,
            `${at}.depicts contains duplicates`,
          );
        }
      }
      for (const field of ["caption", "credit", "rights"])
        if (field in entry) add(errors, text(entry[field]), `${at}.${field} cannot be empty`);
      if ("originalUrl" in entry) {
        try {
          const url = new URL(String(entry.originalUrl));
          add(
            errors,
            ["http:", "https:"].includes(url.protocol),
            `${at}.originalUrl must use http(s)`,
          );
        } catch {
          errors.push(`${at}.originalUrl is invalid`);
        }
      }
    });
  if (errors.length) throw Error(errors.join("\n"));
  return { ...(value as unknown as Omit<Source, "id">), id: sourceId };
}

export function validateCollection(
  data: CollectionData,
  options: {
    imageFiles?: Set<string>;
  } = {},
) {
  const errors: string[] = [];
  const objects = new Map<string, CollectionObject>();
  const claims = new Map<string, Claim>();
  const sources = new Set<string>();
  const holders = new Map<string, Holder>();
  const locations = new Map<string, ObjectLocation>();
  for (const object of data.objects) {
    if (objects.has(object.id)) errors.push(`duplicate object id: ${object.id}`);
    objects.set(object.id, object);
  }
  for (const source of data.sources) {
    if (sources.has(source.id)) errors.push(`duplicate source id: ${source.id}`);
    sources.add(source.id);
    const claimedObjects = new Set(source.claims.map((claim) => claim.objectId));
    const depictedObjects = new Set(
      (source.relationships ?? [])
        .filter(
          (relationship) =>
            relationship.type === "depicts" && relationship.target.type === "object",
        )
        .map((relationship) => relationship.target.id),
    );
    for (const [index, image] of source.images.entries()) {
      for (const objectId of image.depicts ?? []) {
        if (!objects.has(objectId))
          errors.push(
            `${source.id}.json: images[${index}].depicts refers to missing object ${objectId}`,
          );
        if (!depictedObjects.has(objectId))
          errors.push(
            `${source.id}.json: images[${index}].depicts object ${objectId} is not depicted by the source`,
          );
      }
    }
    for (const objectId of source.objectIds ?? []) {
      if (!objects.has(objectId))
        errors.push(`${source.id}.json: objectIds refers to missing object ${objectId}`);
      if (claimedObjects.has(objectId) || depictedObjects.has(objectId))
        errors.push(
          `${source.id}.json: redundant objectId ${objectId} is already linked by a claim or depicts relationship`,
        );
    }
    const sourceClaims = new Set<string>();
    const sourceImages = new Set<string>();
    for (const claim of source.claims) {
      const claimId = qualifyClaim(source.id, claim.id);
      if (sourceClaims.has(claim.id))
        errors.push(`${source.id}.json: duplicate claim id: ${claim.id}`);
      sourceClaims.add(claim.id);
      claims.set(claimId, claim);
      if (!objects.has(claim.objectId))
        errors.push(`claim ${claimId} refers to missing object ${claim.objectId}`);
    }
    for (const image of source.images) {
      if (sourceImages.has(image.file))
        errors.push(`${source.id}.json: duplicate image file: ${image.file}`);
      sourceImages.add(image.file);
      if (options.imageFiles && !options.imageFiles.has(image.file))
        errors.push(`image ${source.id}/${image.file} refers to missing file ${image.file}`);
    }
    const relationshipKeys = new Set<string>();
    for (const relationship of source.relationships ?? []) {
      const { type, target } = relationship;
      const key = `${type}:${target.type}:${target.id}`;
      if (relationshipKeys.has(key))
        errors.push(`${source.id}.json: duplicate relationship ${key}`);
      relationshipKeys.add(key);
      if (target.type === "object" && !objects.has(target.id))
        errors.push(`${source.id}.json: ${type} refers to missing object ${target.id}`);
      if (
        target.type === "source" &&
        !sources.has(target.id) &&
        !data.sources.some((entry) => entry.id === target.id)
      )
        errors.push(`${source.id}.json: ${type} refers to missing source ${target.id}`);
      if (target.type === "source" && target.id === source.id)
        errors.push(`${source.id}.json: ${type} cannot target itself`);
    }
  }
  for (const holder of data.holders ?? []) {
    if (holders.has(holder.id)) errors.push(`duplicate holder id: ${holder.id}`);
    holders.set(holder.id, holder);
  }
  for (const location of data.locations ?? []) {
    if (locations.has(location.id))
      errors.push(`duplicate location assessment for object: ${location.id}`);
    locations.set(location.id, location);
  }
  for (const source of data.sources)
    for (const claim of source.claims)
      if (claim.holderId && !holders.has(claim.holderId))
        errors.push(
          `${source.id}/${claim.id}: holderId refers to missing holder ${claim.holderId}`,
        );
  for (const location of locations.values()) {
    if (!objects.has(location.id))
      errors.push(
        `${location.id}.json: location assessment refers to missing object ${location.id}`,
      );
    if (location.holderId && !holders.has(location.holderId))
      errors.push(`${location.id}.json: holderId refers to missing holder ${location.holderId}`);
    let resolvesHolder = Boolean(location.holderId);
    for (const claimRef of location.claimReferences) {
      const claim = claims.get(claimRef);
      if (!claim)
        errors.push(`${location.id}.json: claimReferences refers to missing claim ${claimRef}`);
      else {
        if (claim.objectId !== location.id)
          errors.push(
            `${location.id}.json: claimReferences claim ${claimRef} is about ${claim.objectId}`,
          );
        if (claim.holderId) resolvesHolder = true;
      }
    }
    if (location.status !== "unknown" && !location.location && !resolvesHolder)
      errors.push(
        `${location.id}.json: ${location.status} assessment must select a mapped location or resolved holder claim`,
      );
  }
  const parentSources = new Map<string, string[]>();
  for (const source of data.sources)
    for (const relationship of source.relationships ?? [])
      if (relationship.type === "is_part_of" && relationship.target.type === "source") {
        const parents = parentSources.get(source.id) ?? [];
        parents.push(relationship.target.id);
        parentSources.set(source.id, parents);
      }
  const visited = new Set<string>();
  const active = new Set<string>();
  const visit = (sourceId: string) => {
    if (active.has(sourceId)) {
      errors.push(`is_part_of relationships contain a cycle at ${sourceId}`);
      return;
    }
    if (visited.has(sourceId)) return;
    active.add(sourceId);
    for (const parent of parentSources.get(sourceId) ?? []) visit(parent);
    active.delete(sourceId);
    visited.add(sourceId);
  };
  for (const sourceId of parentSources.keys()) visit(sourceId);
  for (const object of data.objects)
    for (const claimId of object.foregroundedClaims) {
      const claim = claims.get(claimId);
      if (!claim) errors.push(`object ${object.id} foregrounds missing claim ${claimId}`);
      else if (claim.objectId !== object.id)
        errors.push(`object ${object.id} foregrounds claim ${claimId} about ${claim.objectId}`);
    }
  if (errors.length) throw Error(errors.join("\n"));
  return {
    objects: [...objects.values()].sort((a, b) => a.id.localeCompare(b.id)),
    sources: [...data.sources].sort((a, b) => a.id.localeCompare(b.id)),
    holders: [...holders.values()].sort((a, b) => a.id.localeCompare(b.id)),
    locations: [...locations.values()].sort((a, b) => a.id.localeCompare(b.id)),
    claims,
  };
}

export function parseArticleFrontmatter(value: string, file: string): ArticleMetadata {
  const articleId = fileId(file, "md");
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(value);
  if (!match) throw Error(`${file}: article requires YAML front matter`);
  let parsed: unknown;
  try {
    parsed = parseYaml(match[1]);
  } catch (error) {
    throw Error(`${file}: invalid article YAML front matter: ${String(error)}`);
  }
  if (!isObject(parsed)) throw Error(`${file}: article front matter must be a YAML mapping`);
  const allowed = new Set(["subjects", "title", "summary", "author", "language"]);
  if ([...Object.keys(parsed)].some((key) => !allowed.has(key)))
    throw Error(`${file}: article contains an unsupported field`);
  const metadata = parsed as unknown as Omit<ArticleMetadata, "id">;
  const validSubjects = (subjects: unknown): subjects is RecordReference[] =>
    Array.isArray(subjects) &&
    subjects.every(
      (subject) =>
        isObject(subject) &&
        sameKeys(subject, recordReferenceKeys) &&
        ["object", "source"].includes(String(subject.type)) &&
        id(subject.id),
    ) &&
    new Set(subjects.map((subject) => `${subject.type}:${subject.id}`)).size === subjects.length;
  if (
    !text(metadata.title) ||
    ("summary" in metadata && !text(metadata.summary)) ||
    !(metadata.author === null || text(metadata.author)) ||
    typeof metadata.language !== "string" ||
    !language.test(metadata.language) ||
    ("subjects" in metadata && !validSubjects(metadata.subjects))
  )
    throw Error(`${file}: article front matter is incomplete or invalid`);
  return { ...metadata, id: articleId };
}

export function validateArticleSubjects(
  metadata: ArticleMetadata,
  data: CollectionData,
  file: string,
) {
  const objectIds = new Set(data.objects.map((object) => object.id));
  const sourceIds = new Set(data.sources.map((source) => source.id));
  for (const subject of metadata.subjects ?? []) {
    const exists =
      subject.type === "object" ? objectIds.has(subject.id) : sourceIds.has(subject.id);
    if (!exists) throw Error(`${file}: refers to missing ${subject.type} ${subject.id}`);
  }
}

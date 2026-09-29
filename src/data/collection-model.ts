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
}

export interface CollectionImage {
  objectId: string;
  file: string;
  alt: string;
  originalUrl?: string;
  caption?: string;
  credit?: string;
  rights?: string;
}

export type SourceCaptureMethod = "singlefile" | "download" | "supplied-file" | "browser-pdf";

export interface SourceCapture {
  file?: string;
  originalUrl?: string;
  archiveUrl?: string;
  capturedAt: string | null;
  addedAt: string;
  method: SourceCaptureMethod;
  note?: string;
}

export interface Source {
  id: string;
  author: string | null;
  reference: string;
  language: string;
  objectIds?: string[];
  notes?: { text: string; language: string };
  captures?: SourceCapture[];
  claims: Claim[];
  images: CollectionImage[];
}

export interface EditorialMetadata {
  id: string;
  objectId: string;
  title: string;
  author: string | null;
  language: string;
}

export interface CollectionData {
  objects: CollectionObject[];
  sources: Source[];
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
  "images",
  "language",
  "notes",
  "objectIds",
  "reference",
];
const claimKeys = ["id", "objectId", "predicate", "value"];
const imageKeys = ["alt", "caption", "credit", "file", "objectId", "originalUrl", "rights"];
const captureKeys = [
  "addedAt",
  "archiveUrl",
  "capturedAt",
  "file",
  "method",
  "note",
  "originalUrl",
];
const captureExtensions = "html|pdf|jpg|jpeg|png|webp|avif|tif|tiff";

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
  const parts = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/.exec(value);
  if (!parts) return false;
  const [, year, month, day, hour, minute, second] = parts;
  const utc = new Date(
    Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second),
    ),
  );
  return (
    utc.getUTCFullYear() === Number(year) &&
    utc.getUTCMonth() + 1 === Number(month) &&
    utc.getUTCDate() === Number(day) &&
    Number(hour) <= 23 &&
    Number(minute) <= 59 &&
    Number(second) <= 59
  );
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

export function parseSource(value: unknown, file: string): Source {
  const errors: string[] = [];
  const sourceId = fileId(file, "json");
  add(errors, isObject(value), `${file}: expected an object`);
  if (!isObject(value)) throw Error(errors.join("\n"));
  add(errors, sameKeys(value, sourceKeys), `${file}: contains an unsupported field`);
  add(errors, value.author === null || text(value.author), `${file}: author must be text or null`);
  add(errors, text(value.reference), `${file}: reference is required`);
  add(
    errors,
    typeof value.language === "string" && language.test(value.language),
    `${file}: language is invalid`,
  );
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
            new RegExp(`^${sourceId}/[a-z0-9]+(?:-[a-z0-9]+)*\\.(?:${captureExtensions})$`).test(
              capture.file,
            );
          add(errors, safeFile, `${at}.file must be a safe source-files path for ${sourceId}`);
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
        add(errors, validUtcTimestamp(capture.addedAt), `${at}.addedAt must be a UTC timestamp`);
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
    });
  if (Array.isArray(value.images))
    value.images.forEach((entry, index) => {
      const at = `${file}: images[${index}]`;
      add(errors, isObject(entry), `${at} must be an object`);
      if (!isObject(entry)) return;
      add(errors, sameKeys(entry, imageKeys), `${at} contains an unsupported field`);
      add(errors, id(entry.objectId), `${at}.objectId is invalid`);
      add(
        errors,
        typeof entry.file === "string" && imagePath.test(entry.file),
        `${at}.file must be a safe collection image path`,
      );
      add(errors, typeof entry.alt === "string", `${at}.alt is required`);
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
  for (const object of data.objects) {
    if (objects.has(object.id)) errors.push(`duplicate object id: ${object.id}`);
    objects.set(object.id, object);
  }
  for (const source of data.sources) {
    if (sources.has(source.id)) errors.push(`duplicate source id: ${source.id}`);
    sources.add(source.id);
    const claimedObjects = new Set(source.claims.map((claim) => claim.objectId));
    const imagedObjects = new Set(source.images.map((image) => image.objectId));
    for (const objectId of source.objectIds ?? []) {
      if (!objects.has(objectId))
        errors.push(`${source.id}.json: objectIds refers to missing object ${objectId}`);
      if (claimedObjects.has(objectId) || imagedObjects.has(objectId))
        errors.push(
          `${source.id}.json: redundant objectId ${objectId} is already linked by a claim or image`,
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
      const imageId = `${image.objectId}/${image.file}`;
      if (sourceImages.has(imageId))
        errors.push(`${source.id}.json: duplicate image for ${image.objectId}: ${image.file}`);
      sourceImages.add(imageId);
      if (!objects.has(image.objectId))
        errors.push(`image ${source.id}/${image.file} refers to missing object ${image.objectId}`);
      if (options.imageFiles && !options.imageFiles.has(image.file))
        errors.push(`image ${source.id}/${image.file} refers to missing file ${image.file}`);
    }
  }
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
    claims,
  };
}

export function parseEditorialFrontmatter(value: string, file: string): EditorialMetadata {
  const editorialId = fileId(file, "md");
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(value);
  if (!match) throw Error(`${file}: editorial requires YAML front matter`);
  const fields = new Map<string, string | null>();
  for (const line of match[1].split(/\r?\n/)) {
    if (!line.trim()) continue;
    const field = /^([A-Za-z][A-Za-z0-9]*):(?:\s+(.*))?$/.exec(line);
    if (!field) throw Error(`${file}: editorial front matter accepts scalar fields only`);
    const raw = field[2]?.trim() ?? "";
    fields.set(
      field[1],
      raw === "null" || raw === "~" || raw === ""
        ? null
        : raw.replace(/^(?:"(.*)"|'(.*)')$/, "$1$2"),
    );
  }
  const allowed = new Set(["objectId", "title", "author", "language"]);
  if ([...fields.keys()].some((key) => !allowed.has(key)))
    throw Error(`${file}: editorial contains an unsupported field`);
  const metadata = Object.fromEntries(fields) as unknown as EditorialMetadata;
  if (
    !id(metadata.objectId) ||
    !text(metadata.title) ||
    !(metadata.author === null || text(metadata.author)) ||
    !language.test(metadata.language)
  )
    throw Error(`${file}: editorial front matter is incomplete or invalid`);
  return { ...metadata, id: editorialId };
}

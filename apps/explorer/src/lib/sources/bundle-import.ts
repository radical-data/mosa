import type { PoolClient } from "pg";
import { createDossierDraft } from "../capture/dossier.js";
import { CaptureError, type Content, normaliseContent } from "../capture/model.js";
import { createDraft } from "../capture/store.js";
import { bundleRecordId, type CheckedBundle } from "./bundle.js";
import { proposalPacket } from "./dossier-proposal.js";
import type { SourceStorage } from "./storage.js";
import type { SourceVersion } from "./store.js";

export interface SavedBundle {
  id: string;
  checksum: string;
  state: "uploading" | "ready";
  manifest: CheckedBundle["manifest"];
  drafts: { key: string; id: string }[];
  created_at: string;
}
export type ResearchTransaction = <T>(action: (client: PoolClient) => Promise<T>) => Promise<T>;
export async function importBundle(
  checked: CheckedBundle,
  actor: string,
  transaction: ResearchTransaction,
  storage: SourceStorage,
) {
  const { bundle, checksum, manifest } = checked;
  const lock = async (c: PoolClient) => {
    await c.query("select pg_advisory_xact_lock(hashtextextended($1,0))", [
      `bundle:${actor}:${bundle.id}`,
    ]);
    return (
      await c.query<SavedBundle>("select * from capture.bundle where owner_id=$1 and id=$2", [
        actor,
        bundle.id,
      ])
    ).rows[0];
  };
  const reserved = await transaction(async (c) => {
    const prior = await lock(c);
    if (prior && prior.checksum !== checksum)
      throw new CaptureError(
        "This bundle ID already belongs to different content. Give the revised bundle a new ID.",
      );
    if (prior?.state === "ready") return { saved: prior, versions: [] };
    if (!prior)
      await c.query(
        "insert into capture.bundle(owner_id,id,checksum,manifest) values($1,$2,$3,$4)",
        [actor, bundle.id, checksum, manifest],
      );
    const versions: SourceVersion[] = [];
    for (const source of checked.sources) {
      const s = source.input;
      const versionId = bundleRecordId(actor, bundle.id, `version:${s.key}`);
      let version = (
        await c.query<SourceVersion>("select * from capture.source_version where id=$1", [
          versionId,
        ])
      ).rows[0];
      if (!version) {
        let sourceId = bundleRecordId(actor, bundle.id, `source:${s.key}`);
        await c.query(
          `insert into capture.source(id,owner_id,citation,author,document_date,original_url)
          values($1,$2,$3,$4,$5,$6) on conflict(owner_id,original_url) where original_url is not null do nothing`,
          [sourceId, actor, s.citation, s.author, s.documentDate, s.url || null],
        );
        if (s.url)
          sourceId = (
            await c.query<{ id: string }>(
              "select id from capture.source where owner_id=$1 and original_url=$2",
              [actor, s.url],
            )
          ).rows[0].id;
        version = (
          await c.query<SourceVersion>(
            `insert into capture.source_version(id,source_id,filename,media_type,byte_count,sha256,storage_key,readable_text,manifest)
          values($1,$2,$3,$4,$5,$6,$7,$8,$9) returning *`,
            [
              versionId,
              sourceId,
              s.filename,
              source.mediaType,
              source.bytes.length,
              s.sha256,
              `${actor}/${sourceId}/${versionId}`,
              source.text,
              {
                bundleId: bundle.id,
                sourceKey: s.key,
                citation: s.citation,
                retrievedAt: s.retrievedAt,
                originalUrl: s.url,
                contentType: s.contentType,
                suppliedBy: bundle.preparedBy,
                method: bundle.method,
                tool: bundle.tool,
                extractor: source.text === null ? null : "mosa-readable-v1",
              },
            ],
          )
        ).rows[0];
      }
      versions.push(version);
    }
    return { saved: null, versions };
  });
  if (reserved.saved) return reserved.saved;
  // Network operations never hold a database transaction or a row lock.
  for (let i = 0; i < reserved.versions.length; i++) {
    const version = reserved.versions[i];
    await storage.put(version.storage_key, checked.sources[i].bytes, version.media_type);
  }
  return transaction(async (c) => {
    const current = await lock(c);
    if (!current || current.checksum !== checksum)
      throw new CaptureError("Bundle reservation changed. Retry the original file.");
    if (current.state === "ready") return current;
    await c.query("update capture.source_version set state='ready' where id=any($1::uuid[])", [
      reserved.versions.map((v) => v.id),
    ]);
    const drafts: SavedBundle["drafts"] = [];
    for (const candidate of bundle.candidates) {
      const draft = await createDraft(
        c,
        actor,
        bundleRecordId(actor, bundle.id, `candidate:${candidate.key}`),
        normaliseContent({
          bundleId: bundle.id,
          sourceVersion: bundleRecordId(actor, bundle.id, `version:${candidate.sourceKey}`),
          label: candidate.value.slice(0, 200),
          name: candidate.value,
          nameBasis: candidate.predicate,
          nameExcerpt: candidate.quotation,
          nameLocator: candidate.locator,
          sourceRegions: candidate.regions,
          nameEvidenceMode: "excerpt",
          holderStatus: "unknown",
          speakerMode: "unknown",
          note: candidate.notes,
          researchConsent: "",
        } as Content),
      );
      drafts.push({ key: candidate.key, id: draft.id });
    }
    const identities = new Map(
      reserved.versions.map((version, index) => [
        bundle.sources[index].key,
        { source_id: version.source_id, id: version.id },
      ]),
    );
    for (const dossier of bundle.dossiers ?? []) {
      const draft = await createDossierDraft(
        c,
        actor,
        bundleRecordId(actor, bundle.id, `dossier:${dossier.key}`),
        {
          kind: "dossier",
          bundleId: bundle.id,
          label: dossier.label,
          notes: dossier.notes,
          packet: proposalPacket(bundle, dossier, identities, actor),
        },
      );
      drafts.push({ key: dossier.key, id: draft.id });
    }
    return (
      await c.query<SavedBundle>(
        "update capture.bundle set state='ready',drafts=$3 where owner_id=$1 and id=$2 returning *",
        [actor, bundle.id, JSON.stringify(drafts)],
      )
    ).rows[0];
  });
}

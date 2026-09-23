import { randomUUID } from "node:crypto";
import { importInTransaction, lockImport } from "@mosa/object-dossier/import";
import type { DossierPacket } from "@mosa/object-dossier/packet";
import { validatePacket } from "@mosa/object-dossier/validate";
import type { ClientBase } from "pg";
import { CaptureError, uuid } from "./model.js";

export interface DossierContent {
  kind: "dossier";
  bundleId: string;
  label: string;
  notes: string;
  packet: DossierPacket;
}
export interface DossierDraft {
  id: string;
  owner_id: string;
  revision: number;
  status: string;
  content: DossierContent;
  item_id: string | null;
}

export async function createDossierDraft(
  client: ClientBase,
  actor: string,
  requestId: string,
  content: DossierContent,
) {
  const row =
    (
      await client.query<DossierDraft>(
        `insert into capture.draft(id,owner_id,request_id,content)
     values($1,$2,$3,$4) on conflict(owner_id,request_id) do nothing returning *`,
        [randomUUID(), actor, requestId, content],
      )
    ).rows[0] ??
    (
      await client.query<DossierDraft>(
        "select * from capture.draft where owner_id=$1 and request_id=$2",
        [actor, requestId],
      )
    ).rows[0];
  if (row.revision === 1 && row.status === "draft")
    await client.query(
      `insert into capture.revision(draft_id,revision,actor_id,status,content)
       values($1,$2,$3,$4,$5) on conflict do nothing`,
      [row.id, row.revision, actor, row.status, row.content],
    );
  return row;
}

export async function getDossierDraft(client: ClientBase, actor: string, id: string, lock = false) {
  if (!uuid.test(id)) throw new CaptureError("Dossier not found.");
  const draft = (
    await client.query<DossierDraft>(
      `select * from capture.draft where id=$1 and owner_id=$2 ${lock ? "for update" : ""}`,
      [id, actor],
    )
  ).rows[0];
  if (draft?.content.kind !== "dossier") throw new CaptureError("Dossier not found.");
  return draft;
}

export async function dossierIdentityMatches(client: ClientBase, packet: DossierPacket) {
  const object = packet.objects[0];
  const identifiers = object.externalIdentifiers ?? [];
  const pairs = identifiers.map((identifier) => `${identifier.namespace}:${identifier.value}`);
  const results = await client.query<{ id: string; label: string; reason: string; exact: boolean }>(
    `with matches as (
       select i.entity_id id, true exact, i.namespace||': '||i.value reason
       from entities.external_identifier i
       where (i.namespace,i.value) in
         (select x.namespace,x.value from jsonb_to_recordset($1::jsonb) as x(namespace text,value text))
       union all
       select c.object_entity_id id,false exact,'Shared source' reason
       from knowledge.claim c join entities.source s on s.id=c.subject_id
       where c.predicate='refers_to' and c.status='active'
         and s.reference=any($2::text[]) and c.object_entity_id is not null
     )
     select m.id,(entities.entity_display_label(m.id)).display_label label,
       string_agg(distinct m.reason,', ') reason,bool_or(m.exact) exact
     from matches m join entities.item i on i.id=m.id group by m.id
     order by bool_or(m.exact) desc,m.id`,
    [JSON.stringify(identifiers), packet.sources.map((source) => source.reference ?? source.url)],
  );
  if (new Set(results.rows.filter((row) => row.exact).map((row) => row.id)).size > 1)
    throw new CaptureError(`Catalogue identifiers ${pairs.join(", ")} point to different objects.`);
  return results.rows;
}

async function checkPreservedQuotations(client: ClientBase, packet: DossierPacket) {
  for (const source of packet.sources) {
    if (!source.version) continue;
    const result = await client.query<{ readable_text: string | null; media_type: string }>(
      "select readable_text,media_type from capture.source_version where id=$1 and state='ready'",
      [source.version],
    );
    if (!result.rows[0]) throw new CaptureError("A preserved source is unavailable.");
    if (result.rows[0].media_type === "application/pdf") continue;
    for (const claim of packet.claims)
      for (const evidence of Array.isArray(claim.evidence) ? claim.evidence : [claim.evidence])
        if (
          evidence.source === source.key &&
          evidence.excerpt &&
          !result.rows[0].readable_text?.includes(evidence.excerpt)
        )
          throw new CaptureError(`Evidence ${evidence.key} is absent from the saved source.`);
  }
}

export async function changeDossierDraft(
  client: ClientBase,
  actor: string,
  id: string,
  revision: number,
  action: "save" | "accept" | "defer" | "reject",
  packet?: unknown,
  identity?: string,
) {
  const draft = await getDossierDraft(client, actor, id, true);
  if (draft.status === "accepted" && action === "accept") return draft;
  if (draft.revision !== revision)
    throw new CaptureError("This dossier changed. Reload it before continuing.");
  if (["accepted", "rejected", "deleted"].includes(draft.status))
    throw new CaptureError("This dossier is closed.");
  let itemId: string | null = null;
  if (action === "save" || action === "accept") {
    const validation = validatePacket(packet);
    if (!validation.packet) throw new CaptureError(validation.errors.join("; "));
    if (
      validation.packet.objects.length !== 1 ||
      validation.packet.objects[0].key !== draft.content.packet.objects[0].key ||
      validation.packet.dataset.key !== draft.content.packet.dataset.key ||
      validation.packet.sources.length !== draft.content.packet.sources.length ||
      validation.packet.sources.some(
        (source, index) =>
          source.key !== draft.content.packet.sources[index]?.key ||
          source.reference !== draft.content.packet.sources[index]?.reference ||
          source.version !== draft.content.packet.sources[index]?.version,
      )
    )
      throw new CaptureError(
        "The dossier object and preserved sources cannot be replaced during review.",
      );
    await checkPreservedQuotations(client, validation.packet);
    draft.content.packet = validation.packet;
    if (action === "accept") {
      await lockImport(client);
      const matches = await dossierIdentityMatches(client, validation.packet);
      if (identity === "new" && matches.some((match) => match.exact))
        throw new CaptureError("An exact catalogue match exists. Confirm it instead.");
      if (identity !== "new" && !matches.some((match) => match.id === identity))
        throw new CaptureError("Confirm the object's identity or defer this dossier.");
      const bindings =
        identity === "new" ? {} : { [validation.packet.objects[0].key]: identity as string };
      await importInTransaction(client, validation.packet, bindings);
      itemId = (
        await client.query<{ entity_id: string }>(
          `select b.entity_id from ingestion.entity_binding b
         join ingestion.dataset d on d.id=b.dataset_id
         where d.key=$1 and b.local_key=$2`,
          [validation.packet.dataset.key, validation.packet.objects[0].key],
        )
      ).rows[0].entity_id;
    }
  }
  const status =
    action === "accept"
      ? "accepted"
      : action === "save"
        ? "draft"
        : action === "defer"
          ? "deferred"
          : "rejected";
  const updated = (
    await client.query<DossierDraft>(
      `update capture.draft set content=$3,status=$4,item_id=$5,revision=revision+1,updated_at=now()
     where id=$1 and owner_id=$2 returning *`,
      [id, actor, draft.content, status, itemId],
    )
  ).rows[0];
  await client.query(
    "insert into capture.revision(draft_id,revision,actor_id,status,content) values($1,$2,$3,$4,$5)",
    [id, updated.revision, actor, updated.status, updated.content],
  );
  return updated;
}

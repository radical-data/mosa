import { randomUUID } from "node:crypto";
import { importInTransaction, lockImport } from "@mosa/object-dossier/import";
import type { ClientBase } from "pg";
import { CaptureError, type Content, normaliseContent, packetFor, uuid } from "./model.js";

export interface Draft {
  id: string;
  owner_id: string;
  revision: number;
  status: string;
  content: Content;
  item_id: string | null;
}
export interface Match {
  id: string;
  label: string;
  reason: string;
  identifier: string | null;
  holder: string | null;
}
export async function requireResearcher(client: ClientBase, actor: string) {
  if (!uuid.test(actor)) throw new CaptureError("Researcher access is required.");
  const allowed = await client.query(
    "select 1 from capture.researcher where user_id=$1 and enabled",
    [actor],
  );
  if (!allowed.rowCount) throw new CaptureError("Researcher access is required.");
  await client.query("select set_config('capture.actor',$1,true)", [actor]);
}
export async function getDraft(
  client: ClientBase,
  actor: string,
  id: string,
  lock = false,
): Promise<Draft> {
  if (!uuid.test(id)) throw new CaptureError("Draft not found.");
  const result = await client.query<Draft>(
    `select * from capture.draft where id=$1 and owner_id=$2 ${lock ? "for update" : ""}`,
    [id, actor],
  );
  if (!result.rows[0]) throw new CaptureError("Draft not found.");
  return { ...result.rows[0], content: normaliseContent(result.rows[0].content) };
}
async function recordRevision(client: ClientBase, draft: Draft) {
  await client.query(
    "insert into capture.revision(draft_id,revision,actor_id,status,content) values($1,$2,$3,$4,$5)",
    [draft.id, draft.revision, draft.owner_id, draft.status, draft.content],
  );
}
export async function createDraft(
  client: ClientBase,
  actor: string,
  requestId: string,
  content: Content,
) {
  if (!uuid.test(requestId)) throw new CaptureError("Reload the form before saving.");
  const result = await client.query<Draft>(
    `insert into capture.draft(id,owner_id,request_id,content) values($1,$2,$3,$4)
    on conflict(owner_id,request_id) do nothing returning *`,
    [randomUUID(), actor, requestId, content],
  );
  if (result.rows[0]) {
    await recordRevision(client, result.rows[0]);
    return result.rows[0];
  }
  return (
    await client.query<Draft>("select * from capture.draft where owner_id=$1 and request_id=$2", [
      actor,
      requestId,
    ])
  ).rows[0];
}
export async function identityMatches(client: ClientBase, c: Content): Promise<Match[]> {
  return (
    await client.query<Match>(
      `with matches as (
    select entity_id id,'Exact catalogue identifier' reason from entities.external_identifier where namespace=$1 and value=$2
    union select c.object_entity_id,'Same source URL' from entities.source s join knowledge.claim c on c.subject_id=s.id
      where btrim(s.reference)=$3 and c.predicate='refers_to' and c.status='active'
  ) select m.id,(entities.entity_display_label(m.id)).display_label label,string_agg(distinct m.reason,', ') reason,
    (select string_agg(namespace||': '||value,', ') from entities.external_identifier where entity_id=m.id) identifier,
    (select (entities.entity_display_label(object_entity_id)).display_label from knowledge.claim where subject_id=m.id and predicate='held_by' and status='active' order by id limit 1) holder
    from matches m join entities.item i on i.id=m.id group by m.id order by m.id`,
      [c.namespace, c.identifier, c.url],
    )
  ).rows;
}
export interface AgentChoice {
  id: string;
  label: string;
  evidenceId: string | null;
}
export async function agentChoices(client: ClientBase): Promise<AgentChoice[]> {
  return (
    await client.query<AgentChoice>(`
    select a.id, display.display_label label, evidence.id::text as "evidenceId"
    from entities.agent a
    join entities.entity_display display on display.id=a.id
    left join lateral (
      select e.id from knowledge.claim_evidence e
      join knowledge.claim c on c.id=e.claim_id
      where c.id=display.display_label_claim_id and c.status='active'
        and c.predicate='has_name' and e.relationship='supports'
      order by e.id limit 1
    ) evidence on true
    order by display.display_label,a.id
  `)
  ).rows;
}
// Select existing evidence once during review. The researcher confirms the
// readable label; the server records the exact evidence used for publication.
async function resolveAgentLabels(client: ClientBase, value: Content): Promise<Content> {
  const c = normaliseContent(value);
  delete c.holderNameEvidenceId;
  delete c.speakerNameEvidenceId;
  const agents = await agentChoices(client);
  for (const prefix of ["holder", "speaker"] as const) {
    if (prefix === "holder" ? c.holderStatus === "unknown" : c.speakerMode !== "other") continue;
    const id = c[`${prefix}Identity`];
    if (id === "new") continue;
    const agent = agents.find((a) => a.id === id);
    if (!agent)
      throw new CaptureError(
        "The selected person or institution is no longer available.",
        `${prefix}Identity`,
      );
    if (!c[prefix] || c[prefix] === agent.label) {
      c[prefix] = agent.label;
      if (agent.evidenceId) c[`${prefix}NameEvidenceId`] = agent.evidenceId;
    }
  }
  return c;
}
export async function changeDraft(
  client: ClientBase,
  actor: string,
  id: string,
  revision: number,
  action: string,
  content?: Content,
  identity?: string,
) {
  const draft = await getDraft(client, actor, id, true);
  // A retried acceptance returns the original result, never a second import.
  if (draft.status === "accepted" && action === "accept") return draft;
  if (draft.revision !== revision)
    throw new CaptureError("This draft changed in another tab. Reload it before continuing.");
  if (["accepted", "deleted"].includes(draft.status))
    throw new CaptureError("This draft can no longer be changed.");
  let status: string;
  let item: string | null = null;
  if (action === "save" || action === "review") {
    if (!content) throw new CaptureError("Draft content is required.");
    draft.content = action === "review" ? await resolveAgentLabels(client, content) : content;
    if (action === "review") packetFor(id, revision + 1, draft.content);
    status = action === "review" ? "review" : "draft";
  } else if (["defer", "reject", "delete"].includes(action)) {
    if (action === "defer" && content) draft.content = content;
    status = action === "defer" ? "deferred" : action === "reject" ? "rejected" : "deleted";
  } else if (action === "accept") {
    if (draft.status !== "review")
      throw new CaptureError("Review this revision before accepting it.");
    await lockImport(client);
    const matches = await identityMatches(client, draft.content);
    if (identity === "new" && matches.length)
      throw new CaptureError("A matching object now exists. Review its identity before accepting.");
    if (identity !== "new" && !matches.some((m) => m.id === identity))
      throw new CaptureError("Confirm the object identity or defer this draft.");
    const resolved = await resolveAgentLabels(client, draft.content);
    if (
      resolved.holderNameEvidenceId !== draft.content.holderNameEvidenceId ||
      resolved.speakerNameEvidenceId !== draft.content.speakerNameEvidenceId ||
      resolved.holder !== draft.content.holder ||
      resolved.speaker !== draft.content.speaker
    )
      throw new CaptureError(
        "An institution label or its evidence changed. Save and review this draft again.",
      );
    const packet = packetFor(id, revision, draft.content);
    const bindings: Record<string, string> = {};
    if (identity !== "new") bindings["item:object"] = identity as string;
    for (const [key, value] of [
      ...(draft.content.holderStatus === "reported"
        ? [["agent:holder", draft.content.holderIdentity]]
        : []),
      ...(draft.content.speakerMode === "other"
        ? [["agent:speaker", draft.content.speakerIdentity]]
        : []),
    ]) {
      if (value !== "new") {
        if (!(await client.query("select 1 from entities.agent where id=$1", [value])).rowCount)
          throw new CaptureError("The selected institution is no longer available.");
        bindings[key] = value;
      }
    }
    // Preserve the existing source's kind when the exact reference is already known.
    const source = await client.query(
      "select source_kind from entities.source where btrim(reference)=$1",
      [draft.content.url],
    );
    if (source.rows.length === 1) packet.sources[0].kind = source.rows[0].source_kind;
    await importInTransaction(client, packet, bindings);
    item = (
      await client.query(
        `select b.entity_id from ingestion.entity_binding b join ingestion.dataset d on d.id=b.dataset_id where d.key=$1 and b.local_key='item:object'`,
        [packet.dataset.key],
      )
    ).rows[0].entity_id;
    status = "accepted";
  } else throw new CaptureError("Unknown draft action.");
  const updated = (
    await client.query<Draft>(
      `update capture.draft set content=$3,status=$4,item_id=$5,revision=revision+1,updated_at=now() where id=$1 and owner_id=$2 returning *`,
      [id, actor, draft.content, status, item],
    )
  ).rows[0];
  await recordRevision(client, updated);
  return updated;
}

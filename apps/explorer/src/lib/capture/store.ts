import { randomUUID } from "node:crypto";
import { importInTransaction, lockImport } from "@mosa/object-dossier/import";
import type { ClientBase } from "pg";
import { requireCatalogue } from "./catalogues.js";
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
  exact: boolean;
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
  await requireCatalogue(client, content.namespace);
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
    select entity_id id,'Exact catalogue identifier' reason,true exact from entities.external_identifier where namespace=$1 and value=$2
    union select c.object_entity_id,'Same source URL',false from entities.source s join knowledge.claim c on c.subject_id=s.id
      where btrim(s.reference)=$3 and c.predicate='refers_to' and c.status='active'
   ) select m.id,(entities.entity_display_label(m.id)).display_label label,string_agg(distinct m.reason,', ') reason,bool_or(m.exact) exact,
    (select string_agg(namespace||': '||value,', ') from entities.external_identifier where entity_id=m.id) identifier,
    (select (entities.entity_display_label(object_entity_id)).display_label from knowledge.claim where subject_id=m.id and predicate='held_by' and status='active' order by id limit 1) holder
    from matches m join entities.item i on i.id=m.id group by m.id order by bool_or(m.exact) desc,m.id`,
      [c.namespace, c.identifier, c.url],
    )
  ).rows;
}
export interface NameCitation {
  id: string;
  source: string;
  locator: string;
  excerpt: string | null;
}
export interface AgentChoice {
  id: string;
  label: string;
  evidenceId: string | null;
  context: string;
  citations: NameCitation[];
}
export async function agentChoices(client: ClientBase): Promise<AgentChoice[]> {
  const result = await client.query<Omit<AgentChoice, "evidenceId">>(`
    select a.id, display.display_label label,
      concat_ws(' · ', nullif(a.agent_kind,''), evidence.sources) context,
      coalesce(evidence.citations, '[]'::jsonb) citations
    from entities.agent a
    join entities.entity_display display on display.id=a.id
    left join lateral (
       select jsonb_agg(jsonb_build_object('id', e.id, 'source', s.reference,
         'locator', e.locator, 'excerpt', e.excerpt) order by s.reference, e.locator, e.id) citations,
         string_agg(distinct s.reference, ' · ' order by s.reference) sources
       from knowledge.claim_evidence e
       join knowledge.claim c on c.id=e.claim_id
       join entities.source s on s.id=e.source_id
       where c.id=display.display_label_claim_id and c.status='active'
         and c.predicate='has_name' and e.relationship='supports'
    ) evidence on true
    order by display.display_label,a.id
  `);
  return result.rows.map((agent) => ({
    ...agent,
    evidenceId: agent.citations.length === 1 ? agent.citations[0].id : null,
  }));
}
// Submitted citation IDs are requests, not trusted canonical references.
// Resolve them against the selected record's active supporting name evidence.
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
      const requested = c[`${prefix}NameCitation`];
      const citation = requested
        ? agent.citations.find((entry) => entry.id === requested)
        : agent.citations.length === 1
          ? agent.citations[0]
          : undefined;
      if (requested && !citation)
        throw new CaptureError(
          "The name evidence changed or belongs to another record. Choose its citation again.",
          `${prefix}NameCitation`,
        );
      if (!citation && agent.citations.length > 1)
        throw new CaptureError(
          "Choose which existing citation supports this name.",
          `${prefix}NameCitation`,
        );
      if (citation) {
        c[`${prefix}NameEvidenceId`] = citation.id;
        c[`${prefix}NameCitation`] = citation.id;
      }
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
  if (content) await requireCatalogue(client, content.namespace);
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
    if (identity === "new" && matches.some((match) => match.exact))
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
    const evidenceBindings = await client.query<{ local_key: string; claim_evidence_id: string }>(
      `select local_key,claim_evidence_id from ingestion.evidence_binding
       where dataset_id=(select id from ingestion.dataset where key=$1)
         and local_key=any($2::text[])`,
      [
        packet.dataset.key,
        ["evidence:name", "evidence:holder", "evidence:holder-name", "evidence:speaker-name"],
      ],
    );
    const evidence = new Map(
      evidenceBindings.rows.map((row) => [row.local_key, row.claim_evidence_id]),
    );
    const holderName =
      evidence.get("evidence:holder-name") ?? draft.content.holderNameEvidenceId ?? null;
    const speakerName =
      evidence.get("evidence:speaker-name") ?? draft.content.speakerNameEvidenceId ?? null;
    const identifier = draft.content.identifier
      ? ((
          await client.query<{ id: string }>(
            "select id from entities.external_identifier where entity_id=$1 and namespace=$2 and value=$3",
            [item, draft.content.namespace, draft.content.identifier],
          )
        ).rows[0]?.id ?? null)
      : null;
    await client.query(
      `insert into capture.acceptance(
        draft_id,name_evidence_id,holder_evidence_id,holder_name_evidence_id,
        name_speaker_evidence_id,holder_speaker_evidence_id,identifier_id,catalogue_namespace
      ) values($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        draft.id,
        evidence.get("evidence:name") ?? null,
        evidence.get("evidence:holder") ?? null,
        holderName,
        draft.content.speakerMode === "holder" ? holderName : speakerName,
        draft.content.speakerMode === "holder" ? holderName : speakerName,
        identifier,
        draft.content.namespace || null,
      ],
    );
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

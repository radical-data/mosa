import { createHash } from "node:crypto";
import {
  object,
  type PublicCollection,
  parseCollection,
  sourceURL,
  text,
  uuid,
} from "@mosa/public-collection";
import type { ClientBase } from "pg";

// Each value identifies ONE evidence link, thus also its claim and source.
export interface Selection {
  itemId: string;
  name: string;
  holder: string;
  holderName: string;
  nameSpeaker: string;
  holderSpeaker: string;
  identifier: string;
}
export function parseSelection(value: unknown): Selection {
  const selected = object(value, [
    "itemId",
    "name",
    "holder",
    "holderName",
    "nameSpeaker",
    "holderSpeaker",
    "identifier",
  ]);
  for (const id of Object.values(selected))
    if (typeof id !== "string" || !uuid.test(id))
      throw Error("Selection requires UUIDs for every explicit reference");
  return selected as unknown as Selection;
}
export function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object")
    return `{${Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`)
      .join(",")}}`;
  return JSON.stringify(value);
}
export const digest = (value: unknown) =>
  createHash("sha256").update(canonical(value)).digest("hex");
interface EvidenceRow {
  id: string;
  claim_id: string;
  subject_id: string;
  predicate: string;
  object_entity_id: string | null;
  literal_value: { type?: string; value?: string; language?: string } | null;
  asserted_by_agent_id: string | null;
  status: string;
  relationship: string;
  reference: string;
  locator: string;
  excerpt: string | null;
  dependencies: unknown;
  complex: boolean;
}
export async function candidate(
  client: ClientBase,
  selection: Selection,
  releaseId: string,
): Promise<{ snapshot: PublicCollection; fingerprint: string }> {
  const item = await client.query("select id from entities.item where id=$1", [selection.itemId]);
  if (item.rowCount !== 1) throw Error("Selected item does not exist");
  const dependencies: unknown[] = [];
  async function evidence(id: string): Promise<EvidenceRow> {
    const result = await client.query<EvidenceRow>(
      `
      select e.id, c.id claim_id, c.subject_id, c.predicate, c.object_entity_id,
             c.literal_value, c.asserted_by_agent_id, c.status, e.relationship,
             s.reference, e.locator, e.excerpt,
             jsonb_build_array(to_jsonb(c), to_jsonb(e), to_jsonb(s)) dependencies,
             exists(select 1 from knowledge.claim_evidence extra
                    where extra.claim_id=c.id and extra.relationship in ('qualifies','contradicts')) complex
      from knowledge.claim_evidence e join knowledge.claim c on c.id=e.claim_id
      join entities.source s on s.id=e.source_id where e.id=$1`,
      [id],
    );
    const row = result.rows[0];
    if (row?.status !== "active" || row.relationship !== "supports" || row.complex)
      throw Error("Public cards require active claims with unqualified supporting evidence");
    sourceURL(row.reference);
    text(row.locator);
    dependencies.push(row.dependencies);
    return row;
  }
  function name(row: EvidenceRow, subject: string) {
    if (
      row.subject_id !== subject ||
      row.predicate !== "has_name" ||
      row.literal_value?.type !== "text" ||
      row.object_entity_id
    )
      throw Error("Selected name does not name the required entity");
    return { text: text(row.literal_value.value), language: row.literal_value.language ?? null };
  }
  const n = await evidence(selection.name);
  const h = await evidence(selection.holder);
  if (
    h.subject_id !== selection.itemId ||
    h.predicate !== "held_by" ||
    !h.object_entity_id ||
    h.literal_value
  )
    throw Error("Selected custody claim does not describe this item");
  const agent = await client.query("select id from entities.agent where id=$1", [
    h.object_entity_id,
  ]);
  if (!agent.rowCount) throw Error("Custodian must be an agent");
  const hn = await evidence(selection.holderName);
  const ns = await evidence(selection.nameSpeaker);
  const hs = await evidence(selection.holderSpeaker);
  if (!n.asserted_by_agent_id || !h.asserted_by_agent_id)
    throw Error("Public cards require identified speakers");
  const identifier = await client.query<{
    namespace: string;
    value: string;
    reference: string;
    dependencies: unknown;
  }>(
    `
    select i.namespace, i.value, s.reference, jsonb_build_array(to_jsonb(i),to_jsonb(s)) dependencies
    from entities.external_identifier i join entities.source s on s.id=i.source_id
    where i.id=$1 and i.entity_id=$2`,
    [selection.identifier, selection.itemId],
  );
  const ident = identifier.rows[0];
  if (!ident) throw Error("Identifier must belong to this item and have a source");
  dependencies.push(ident.dependencies);
  const snapshot = parseCollection({
    schemaVersion: 1,
    releaseId,
    records: [
      {
        id: selection.itemId,
        name: {
          ...name(n, selection.itemId),
          attributedTo: name(ns, n.asserted_by_agent_id).text,
          sources: [...new Set([n.reference, ns.reference])],
        },
        holder: {
          ...name(hn, h.object_entity_id),
          attributedTo: name(hs, h.asserted_by_agent_id).text,
          sources: [...new Set([h.reference, hn.reference, hs.reference])],
        },
        identifier: { namespace: ident.namespace, value: ident.value, source: ident.reference },
      },
    ],
  });
  return { snapshot, fingerprint: digest({ selection, dependencies }) };
}

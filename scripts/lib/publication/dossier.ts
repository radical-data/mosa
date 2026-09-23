import { claimEvidenceList } from "@mosa/object-dossier/packet";
import { validatePacket } from "@mosa/object-dossier/validate";
import {
  type PublicCollection,
  type PublicDossier,
  parseCollection,
} from "@mosa/public-collection";
import type { ClientBase } from "pg";
import { digest } from "./candidate";

export interface DossierSelection {
  draftId: string;
  itemId: string;
}
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function isDossierSelection(value: unknown): value is DossierSelection {
  return (
    !!value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.keys(value).sort().join() === "draftId,itemId" &&
    uuid.test(String((value as DossierSelection).draftId)) &&
    uuid.test(String((value as DossierSelection).itemId))
  );
}

export async function dossierCandidate(
  client: ClientBase,
  selected: DossierSelection,
  releaseId: string,
) {
  const row = (
    await client.query<{ item_id: string; packet: unknown }>(
      "select item_id,packet from capture.public_dossier_candidate where draft_id=$1",
      [selected.draftId],
    )
  ).rows[0];
  if (!row || row.item_id !== selected.itemId)
    throw Error("The accepted dossier is unavailable or its object changed");
  const checked = validatePacket(row.packet);
  if (checked.packet?.schemaVersion !== 4 || checked.packet.objects.length !== 1)
    throw Error(`Invalid accepted dossier: ${checked.errors.join("; ")}`);
  const packet = checked.packet;
  const dataset = (
    await client.query<{ id: string }>("select id from ingestion.dataset where key=$1", [
      packet.dataset.key,
    ])
  ).rows[0];
  if (!dataset) throw Error("Accepted dossier has no canonical import");
  const item = (
    await client.query<{ entity_id: string }>(
      "select entity_id from ingestion.entity_binding where dataset_id=$1 and local_key=$2",
      [dataset.id, packet.objects[0].key],
    )
  ).rows[0];
  if (item?.entity_id !== selected.itemId) throw Error("Dossier object binding changed");

  const canonicalClaims = (
    await client.query<{ local_key: string; claim: { status: string } }>(
      `select b.local_key,to_jsonb(c) claim from ingestion.claim_binding b
     join knowledge.claim c on c.id=b.claim_id
     where b.dataset_id=$1 and b.local_key=any($2::text[]) order by b.local_key`,
      [dataset.id, packet.claims.map((claim) => claim.key)],
    )
  ).rows;
  if (
    canonicalClaims.length !== packet.claims.length ||
    canonicalClaims.some((row) => row.claim.status !== "active")
  )
    throw Error("A reviewed claim is missing or inactive");
  const evidenceKeys = packet.claims.flatMap((claim) =>
    claimEvidenceList(claim).map((evidence) => evidence.key),
  );
  const canonicalEvidence = (
    await client.query<{ local_key: string; evidence: unknown; source: unknown }>(
      `select b.local_key,to_jsonb(e) evidence,to_jsonb(s) source
     from ingestion.evidence_binding b
     join knowledge.claim_evidence e on e.id=b.claim_evidence_id
     join entities.source s on s.id=e.source_id
     where b.dataset_id=$1 and b.local_key=any($2::text[]) order by b.local_key`,
      [dataset.id, evidenceKeys],
    )
  ).rows;
  if (canonicalEvidence.length !== evidenceKeys.length) throw Error("Reviewed evidence is missing");
  const recordBindings = (
    await client.query<{ local_key: string; record_kind: string; record_id: string }>(
      "select local_key,record_kind,record_id from ingestion.record_binding where dataset_id=$1 order by local_key",
      [dataset.id],
    )
  ).rows;
  const expectedRecordCount = (packet.restitutionCases ?? []).reduce(
    (count, record) => count + 1 + record.documents.length + record.actions.length,
    0,
  );
  if (recordBindings.length !== expectedRecordCount)
    throw Error("Restitution import is incomplete");
  const caseRows: unknown[] = [];
  for (const binding of recordBindings) {
    const table =
      binding.record_kind === "case"
        ? "case_record"
        : binding.record_kind === "action"
          ? "case_action"
          : "case_document";
    const result = await client.query<{ record: unknown }>(
      `select to_jsonb(r) record from restitution.${table} r where r.id=$1`,
      [binding.record_id],
    );
    if (!result.rows[0]) throw Error("A reviewed restitution record is missing");
    caseRows.push([binding.local_key, result.rows[0].record]);
  }
  const sources = new Map(packet.sources.map((source) => [source.key, source]));
  const names = new Map(
    packet.claims
      .filter((claim) => claim.predicate === "has_name" && claim.literal?.type === "text")
      .map((claim) => [claim.subject, (claim.literal as { value: string }).value]),
  );
  const kinds = new Map([
    ...packet.objects.map((entry) => [entry.key, "item"] as const),
    ...packet.agents.map((entry) => [entry.key, "agent"] as const),
    ...packet.places.map((entry) => [entry.key, "place"] as const),
    ...packet.sources.map((entry) => [entry.key, "source"] as const),
    ...(packet.events ?? []).map((entry) => [entry.key, "event"] as const),
  ]);
  const labelFor = (key: string) =>
    names.get(key) ??
    packet.objects.find((object) => object.key === key)?.externalIdentifiers?.[0]?.value ??
    (kinds.get(key) === "event"
      ? "Recorded event"
      : kinds.get(key) === "agent"
        ? "Unnamed person or organisation"
        : kinds.get(key) === "place"
          ? "Unnamed place"
          : kinds.get(key) === "source"
            ? (sources.get(key)?.citation ?? "Source")
            : "Unnamed object");
  const objectKey = packet.objects[0].key;
  const main = packet.claims.find(
    (claim) =>
      claim.subject === objectKey &&
      ["has_name", "classified_as", "described_as"].includes(claim.predicate) &&
      claim.literal?.type === "text",
  );
  const mainLabel =
    main?.literal?.type === "text"
      ? main.literal.value
      : packet.objects[0].externalIdentifiers?.[0]?.value;
  if (!mainLabel)
    throw Error(
      "The public dossier needs an evidenced name, classification, description or identifier",
    );
  const citation = (key: string) => {
    const source = sources.get(key);
    if (!source?.citation)
      throw Error(`Source ${key} needs a reviewed citation before publication`);
    return { citation: source.citation, ...(source.publicUrl ? { url: source.publicUrl } : {}) };
  };
  const record: PublicDossier = {
    kind: "dossier",
    id: selected.itemId,
    label: mainLabel,
    identifiers: (packet.objects[0].externalIdentifiers ?? []).map((identifier) => {
      if (!identifier.source) throw Error("A public identifier requires its source");
      return {
        namespace: identifier.namespace,
        value: identifier.value,
        ...citation(identifier.source),
      };
    }),
    claims: packet.claims.map((claim) => ({
      predicate: claim.predicate,
      subject: {
        key: claim.subject,
        kind: kinds.get(claim.subject) ?? "entity",
        label: labelFor(claim.subject),
      },
      value:
        claim.literal?.type === "text"
          ? {
              kind: "text" as const,
              text: claim.literal.value,
              ...(claim.literal.language ? { language: claim.literal.language } : {}),
            }
          : claim.literal?.type === "date_interval"
            ? { kind: "date" as const, text: claim.literal.verbatim }
            : { kind: "entity" as const, text: labelFor(claim.object ?? "") },
      attributedTo: claim.assertedBy ? (names.get(claim.assertedBy) ?? null) : null,
      evidence: claimEvidenceList(claim).map((evidence) => ({
        relationship: evidence.relationship,
        ...citation(evidence.source),
        locator: evidence.locator,
        ...(evidence.excerpt ? { excerpt: evidence.excerpt } : {}),
      })),
    })),
    events: (packet.events ?? []).map((event) => ({ key: event.key, kind: event.kind })),
    cases: (packet.restitutionCases ?? []).map((record) => ({
      reference: record.reference,
      title: record.title,
      status: record.status,
      actions: record.actions.map((action) => ({
        kind: action.kind,
        description: action.description,
        ...(action.occurred ? { date: `${action.occurred.start}–${action.occurred.end}` } : {}),
      })),
      documents: record.documents.map((document) => ({
        ...citation(document.source),
        role: document.role,
      })),
    })),
  };
  const snapshot: PublicCollection = parseCollection({
    schemaVersion: 2,
    releaseId,
    records: [record],
  });
  return {
    snapshot,
    fingerprint: digest({ selected, packet, canonicalClaims, canonicalEvidence, caseRows }),
  };
}

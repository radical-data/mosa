import type { ClientBase } from "pg";
import type { DossierPacket, PacketCaseDate } from "./packet";

// Case administration belongs to restitution, not to knowledge.claim. Packet
// bindings make a repeated import safe without treating a shared title as identity.
export async function importRestitution(
  client: ClientBase,
  packet: DossierPacket,
  datasetId: string,
  entities: Map<string, string>,
) {
  const bindings = new Map<string, string>(
    (
      await client.query<{ local_key: string; record_id: string }>(
        "select local_key,record_id from ingestion.record_binding where dataset_id=$1",
        [datasetId],
      )
    ).rows.map((row) => [row.local_key, row.record_id]),
  );
  const entity = (key: string) => {
    const id = entities.get(key);
    if (!id) throw Error(`Missing packet entity ${key}`);
    return id;
  };
  const date = (value?: PacketCaseDate) =>
    value ? [value.start, value.end, value.precision] : [null, null, null];
  async function bind(key: string, kind: "case" | "action" | "document", id: string) {
    await client.query(
      "insert into ingestion.record_binding(dataset_id,local_key,record_kind,record_id) values($1,$2,$3,$4)",
      [datasetId, key, kind, id],
    );
    bindings.set(key, id);
  }

  for (const record of packet.restitutionCases ?? []) {
    let caseId = bindings.get(record.key);
    if (!caseId) {
      caseId = (
        await client.query<{ id: string }>(
          `insert into restitution.case_record
          (reference,title,status,opened_start,opened_end,opened_precision,
           closed_start,closed_end,closed_precision)
         values($1,$2,$3,$4,$5,$6,$7,$8,$9) returning id`,
          [
            record.reference,
            record.title,
            record.status,
            ...date(record.opened),
            ...date(record.closed),
          ],
        )
      ).rows[0].id;
      await bind(record.key, "case", caseId);
      for (const item of record.items)
        await client.query("insert into restitution.case_item(case_id,item_id) values($1,$2)", [
          caseId,
          entity(item),
        ]);
      for (const party of record.parties)
        await client.query(
          "insert into restitution.case_party(case_id,agent_id,role) values($1,$2,$3)",
          [caseId, entity(party.agent), party.role],
        );
    }
    for (const document of record.documents) {
      if (bindings.has(document.key)) continue;
      const id = (
        await client.query<{ id: string }>(
          "insert into restitution.case_document(case_id,source_id,document_role) values($1,$2,$3) returning id",
          [caseId, entity(document.source), document.role],
        )
      ).rows[0].id;
      await bind(document.key, "document", id);
    }
    for (const action of record.actions) {
      let actionId = bindings.get(action.key);
      if (!actionId) {
        actionId = (
          await client.query<{ id: string }>(
            `insert into restitution.case_action
            (case_id,sequence_number,action_kind,description,occurred_start,occurred_end,occurred_precision)
           values($1,$2,$3,$4,$5,$6,$7) returning id`,
            [
              caseId,
              action.sequenceNumber,
              action.kind,
              action.description,
              ...date(action.occurred),
            ],
          )
        ).rows[0].id;
        await bind(action.key, "action", actionId);
        for (const party of action.parties)
          await client.query(
            "insert into restitution.action_party(action_id,agent_id,role) values($1,$2,$3)",
            [actionId, entity(party.agent), party.role],
          );
        for (const document of action.documents)
          await client.query(
            "insert into restitution.action_document(action_id,document_id,case_id,relationship) values($1,$2,$3,$4)",
            [actionId, bindings.get(document.document), caseId, document.relationship ?? null],
          );
      }
    }
  }
}

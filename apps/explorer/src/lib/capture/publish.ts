import { candidate, parseSelection } from "@mosa/public-collection/candidate";
import { dossierCandidate } from "@mosa/public-collection/dossier";
import type { ClientBase } from "pg";
import { CaptureError } from "./model.js";

const projectionId = "00000000-0000-4000-8000-000000000000";

export async function publishAcceptedDraft(client: ClientBase, draftId: string, itemId: string) {
  const dossier = (
    await client.query<{ draft_id: string; item_id: string }>(
      "select draft_id,item_id from capture.public_dossier_candidate where draft_id=$1",
      [draftId],
    )
  ).rows[0];
  const projected = dossier
    ? await dossierCandidate(client, { draftId, itemId }, projectionId)
    : await (async () => {
        const row = (
          await client.query<{ selection: unknown }>(
            "select selection from capture.publication_candidate where draft_id=$1",
            [draftId],
          )
        ).rows[0];
        if (!row)
          throw new CaptureError("Add the missing public wording and evidence before publishing.");
        return candidate(client, parseSelection(row.selection), projectionId);
      })();
  const record = projected.snapshot.records[0];
  if (record.id !== itemId) throw new CaptureError("The public object identity changed.");
  const saved = await client.query(
    `insert into publication.published_record(item_id,draft_id,record)
     values($1,$2,$3)
     on conflict(item_id) do update set draft_id=excluded.draft_id,
       record=excluded.record,published_at=now()
     where published_record.visible
     returning item_id`,
    [itemId, draftId, record],
  );
  if (!saved.rowCount)
    throw new CaptureError(
      "This object is withdrawn from the public site. Ask a maintainer to review it.",
    );
}

import { parseArgs } from "node:util";
import { text, uuid } from "@mosa/public-collection";
import { Client } from "pg";

async function main() {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    options: {
      item: { type: "string" },
      actor: { type: "string" },
      authority: { type: "string" },
    },
  });
  const command = positionals[0];
  if (positionals.length !== 1 || !["hide", "clear", "status"].includes(command))
    throw Error("Use hide, clear or status. See docs/collection-publication.md.");
  const item = command === "status" ? undefined : values.item;
  if (command !== "status" && (!item || !uuid.test(item)))
    throw Error("Use --item with a public object UUID");
  const actor = command === "status" ? undefined : text(values.actor);
  const reason = command === "status" ? undefined : text(values.authority);
  const connectionString = process.env.COLLECTION_DATABASE_URL;
  if (!connectionString)
    throw Error("Set COLLECTION_DATABASE_URL for the private maintainer service");
  const url = new URL(connectionString);
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  const ca = process.env.COLLECTION_DATABASE_SSL_CA;
  if (!local && !ca)
    throw Error("Remote publication connections require COLLECTION_DATABASE_SSL_CA");
  for (const key of ["sslmode", "sslcert", "sslkey", "sslrootcert"]) url.searchParams.delete(key);
  const client = new Client({
    connectionString: url.toString(),
    ssl: local ? false : { ca, rejectUnauthorized: true },
    connectionTimeoutMillis: 10000,
    application_name: "mosa-collection-maintainer",
  });
  await client.connect();
  try {
    await client.query("set statement_timeout='30s'");
    if (command === "status") {
      const result = await client.query(
        "select item_id,draft_id,published_at,visible from publication.published_record order by published_at,item_id",
      );
      console.log(JSON.stringify(result.rows));
      return;
    }
    await client.query("begin");
    try {
      const changed =
        command === "hide"
          ? await client.query(
              "update publication.published_record set visible=false where item_id=$1 and visible returning item_id",
              [item],
            )
          : await client.query(
              "delete from publication.published_record where item_id=$1 and not visible returning item_id",
              [item],
            );
      if (!changed.rowCount)
        throw Error(
          command === "hide" ? "Object is absent or already hidden" : "Object is not hidden",
        );
      await client.query(
        "insert into publication.record_action(item_id,action,actor,reason) values($1,$2,$3,$4)",
        [item, command, actor, reason],
      );
      await client.query("commit");
      console.log(`${command} complete: ${item}`);
    } catch (error) {
      await client.query("rollback");
      throw error;
    }
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(
    error instanceof Error && !("severity" in error)
      ? error.message
      : "Publication database operation failed; inspect private database logs.",
  );
  process.exitCode = 1;
});

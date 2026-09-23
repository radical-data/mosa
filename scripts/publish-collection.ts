import { execFileSync } from "node:child_process";
import { readFile, rename, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parseArgs } from "node:util";
import { parseCollection, text } from "@mosa/public-collection";
import { Client } from "pg";
import { canonical } from "./lib/publication/candidate";
import { deploy } from "./lib/publication/deploy";
import {
  approve,
  currentRelease,
  locked,
  prepare,
  recover,
  transaction,
  withdraw,
} from "./lib/publication/store";

async function main() {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    options: {
      selection: { type: "string" },
      draft: { type: "string" },
      drafts: { type: "string" },
      retain: { type: "boolean", default: false },
      commit: { type: "string" },
      snapshot: { type: "string" },
      output: { type: "string" },
      id: { type: "string" },
      item: { type: "string" },
      actor: { type: "string" },
      authority: { type: "string" },
    },
  });
  const command = positionals[0];
  if (
    positionals.length !== 1 ||
    !["prepare", "approve", "export", "withdraw", "check", "deploy", "status", "recover"].includes(
      command,
    )
  )
    throw Error(
      "Use prepare|approve|export|withdraw|check|deploy|status|recover. See docs/collection-publication.md.",
    );
  if (["prepare", "export"].includes(command) && !values.output)
    throw Error("--output is required");
  const connectionString = process.env.COLLECTION_DATABASE_URL;
  if (!connectionString)
    throw Error("Set COLLECTION_DATABASE_URL for the private maintainer service");
  const url = new URL(connectionString);
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  const ca = process.env.COLLECTION_DATABASE_SSL_CA;
  if (!local && !ca)
    throw Error("Remote publication connections require COLLECTION_DATABASE_SSL_CA");
  // Prevent connection-string SSL settings from overriding verified TLS.
  for (const key of ["sslmode", "sslcert", "sslkey", "sslrootcert"]) url.searchParams.delete(key);
  const client = new Client({
    connectionString: url.toString(),
    ssl: local ? false : { ca, rejectUnauthorized: true },
    connectionTimeoutMillis: 10000,
    application_name: "mosa-collection-publisher",
  });
  await client.connect();
  try {
    await client.query("set statement_timeout='30s'");
    await locked(client, async () => {
      if (command === "deploy") {
        if (!values.snapshot) throw Error("--snapshot is required");
        const expected = parseCollection(JSON.parse(await readFile(values.snapshot, "utf8")));
        const webhook = process.env.COOLIFY_DEPLOY_WEBHOOK;
        const token = process.env.COOLIFY_API_TOKEN;
        const productionURL = process.env.PRODUCTION_URL;
        if (!webhook || !token || !productionURL)
          throw Error("Set hosting webhook, token and production URL");
        const commit = values.commit ?? process.env.GITHUB_SHA;
        if (!commit || !/^[a-f0-9]{40}$/.test(commit))
          throw Error("Use --commit with the reviewed 40-character Git revision");
        const committed = parseCollection(
          JSON.parse(
            execFileSync(
              "git",
              ["show", `${commit}:apps/website/public/collection-snapshot.json`],
              { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
            ),
          ),
        );
        if (canonical(committed) !== canonical(expected))
          throw Error("Snapshot differs from the reviewed commit");
        await deploy(client, expected, { webhook, token, productionURL, commit });
        console.log(`Verified live release ${expected.releaseId}`);
        return;
      }
      const result = await transaction(client, async () => {
        switch (command) {
          case "prepare": {
            if ([values.selection, values.draft, values.drafts].filter(Boolean).length !== 1)
              throw Error("Use exactly one of --selection, --draft or --drafts");
            const selectionForDraft = async (id: string) => {
              const dossier = (
                await client.query(
                  "select draft_id,item_id from capture.public_dossier_candidate where draft_id=$1",
                  [id],
                )
              ).rows[0];
              const draft =
                dossier ??
                (
                  await client.query(
                    "select selection from capture.publication_candidate where draft_id=$1",
                    [id],
                  )
                ).rows[0];
              if (!draft) throw Error(`Draft ${id} is not an accepted public candidate`);
              return dossier
                ? { draftId: dossier.draft_id, itemId: dossier.item_id }
                : draft.selection;
            };
            let selection: unknown;
            if (values.draft) selection = await selectionForDraft(values.draft);
            else if (values.drafts) {
              const ids = JSON.parse(await readFile(values.drafts, "utf8"));
              if (
                !Array.isArray(ids) ||
                ids.length < 1 ||
                ids.length > 100 ||
                ids.some((id) => typeof id !== "string")
              )
                throw Error("Use a JSON array of 1–100 accepted draft IDs");
              selection = await Promise.all(ids.map(selectionForDraft));
            } else selection = JSON.parse(await readFile(values.selection as string, "utf8"));
            if (values.retain) {
              await currentRelease(client);
              const previous = (
                await client.query(
                  "select r.selection from publication.state s join publication.release r on r.id=s.desired_release_id where singleton",
                )
              ).rows[0].selection;
              selection = [
                ...(previous ? (Array.isArray(previous) ? previous : [previous]) : []),
                ...(Array.isArray(selection) ? selection : [selection]),
              ];
            }
            return prepare(client, selection);
          }
          case "approve":
            return approve(client, text(values.id), text(values.actor), text(values.authority));
          case "recover":
            return recover(client, text(values.id), text(values.actor), text(values.authority));
          case "withdraw":
            return withdraw(
              client,
              text(values.id),
              text(values.actor),
              text(values.authority),
              values.item ? text(values.item) : undefined,
            );
          case "export":
            return currentRelease(client);
          case "check":
            if (!values.snapshot) throw Error("--snapshot is required");
            return currentRelease(
              client,
              parseCollection(JSON.parse(await readFile(values.snapshot, "utf8"))),
            );
          case "status":
            return (await client.query("select * from publication.state")).rows[0];
        }
      });
      if (values.output) {
        const target = resolve(values.output);
        const tmp = `${target}.${process.pid}.tmp`;
        await writeFile(tmp, `${JSON.stringify(result, null, 2)}\n`, { mode: 0o600 });
        await rename(tmp, target);
        console.log(`Wrote ${command} result to ${target}`);
      } else
        console.log(
          command === "status"
            ? JSON.stringify(result)
            : `${command} complete: ${result.releaseId}`,
        );
    });
  } finally {
    await client.end();
  }
}
main().catch((error) => {
  // Database error details/connection URLs can contain private research or credentials.
  console.error(
    error instanceof Error && !("severity" in error)
      ? error.message
      : "Publication database operation failed; inspect private database logs.",
  );
  process.exitCode = 1;
});

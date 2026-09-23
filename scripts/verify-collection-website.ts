import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { runCommand } from "./lib/run-command";
import { withVerificationWorkspace } from "./lib/verification-workspace";

async function verify() {
  await withVerificationWorkspace(path.resolve(__dirname, ".."), async (workspace, signal) => {
    const file = path.join(workspace, "apps/website/public/collection-snapshot.json");
    const statement = {
      text: "PUBLIC-OBJECT-SENTINEL",
      language: "rap",
      attributedTo: "Synthetic museum",
      sources: ["https://example.org/source"],
    };
    const snapshot = {
      schemaVersion: 1,
      releaseId: "11111111-1111-4111-8111-111111111111",
      records: [
        {
          id: "22222222-2222-4222-8222-222222222222",
          name: statement,
          holder: { ...statement, text: "PUBLIC-HOLDER-SENTINEL", language: "en" },
          identifier: {
            namespace: "test",
            label: "Test catalogue",
            value: "PUBLIC-ID-SENTINEL",
            source: "https://example.org/source",
          },
        },
      ],
    };
    snapshot.records.push({
      ...snapshot.records[0],
      id: "44444444-4444-4444-8444-444444444444",
      name: { ...statement, text: "SECOND-OBJECT-SENTINEL" },
      identifier: { ...snapshot.records[0].identifier, value: "SECOND-ID-SENTINEL" },
    });
    const dossier = {
      kind: "dossier" as const,
      id: "55555555-5555-4555-8555-555555555555",
      label: "FULL-DOSSIER-SENTINEL",
      identifiers: [],
      claims: [
        {
          predicate: "described_as",
          subject: { key: "item:one", kind: "item", label: "FULL-DOSSIER-SENTINEL" },
          value: { kind: "text", text: "PUBLIC-DESCRIPTION-SENTINEL" },
          attributedTo: null,
          evidence: [
            {
              relationship: "supports",
              citation: "Original PDF, page 12",
              locator: "Page 12: row 3",
              excerpt: "PUBLIC-DESCRIPTION-SENTINEL",
            },
          ],
        },
        {
          predicate: "moved_item",
          subject: { key: "event:one", kind: "event", label: "Recorded event" },
          value: { kind: "entity", text: "FULL-DOSSIER-SENTINEL" },
          attributedTo: null,
          evidence: [
            {
              relationship: "mentions",
              citation: "Original PDF, page 13",
              locator: "Page 13: history",
            },
          ],
        },
      ],
      events: [{ key: "event:one", kind: "relocation" }],
      cases: [
        {
          reference: "case-1",
          title: "PUBLIC-CASE-SENTINEL",
          status: "open" as const,
          actions: [{ kind: "request", description: "PUBLIC-REQUEST-SENTINEL" }],
          documents: [{ citation: "Original PDF, page 14", role: "case record" }],
        },
      ],
    };
    const build = () =>
      runCommand("pnpm", ["--filter", "@mosa/website", "build"], { cwd: workspace, signal });
    await writeFile(file, `${JSON.stringify(snapshot)}\n`);
    await build();
    for (const page of ["es/coleccion", "en/collection"]) {
      const html = await readFile(
        path.join(workspace, `apps/website/dist/${page}/index.html`),
        "utf8",
      );
      for (const value of [
        statement.text,
        "PUBLIC-HOLDER-SENTINEL",
        "PUBLIC-ID-SENTINEL",
        "SECOND-OBJECT-SENTINEL",
        "SECOND-ID-SENTINEL",
        "https://example.org/source",
      ])
        assert(html.includes(value));
      assert(!html.includes("collection-mamari"));
    }
    const expanded = { ...snapshot, schemaVersion: 2, records: [...snapshot.records, dossier] };
    await writeFile(file, `${JSON.stringify(expanded)}\n`);
    await build();
    for (const page of ["es/coleccion", "en/collection"]) {
      const list = await readFile(
        path.join(workspace, `apps/website/dist/${page}/index.html`),
        "utf8",
      );
      const detail = await readFile(
        path.join(workspace, `apps/website/dist/${page}/${dossier.id}/index.html`),
        "utf8",
      );
      assert(list.includes(dossier.label));
      for (const value of [
        dossier.label,
        "PUBLIC-DESCRIPTION-SENTINEL",
        "PUBLIC-CASE-SENTINEL",
        "PUBLIC-REQUEST-SENTINEL",
        "Original PDF, page 12",
      ])
        assert(detail.includes(value));
      assert(!detail.includes("PRIVATE"));
    }
    await writeFile(file, JSON.stringify({ ...expanded, records: snapshot.records }));
    await build();
    for (const page of ["es/coleccion", "en/collection"]) {
      const list = await readFile(
        path.join(workspace, `apps/website/dist/${page}/index.html`),
        "utf8",
      );
      assert(!list.includes(dossier.label));
      assert(
        !existsSync(path.join(workspace, `apps/website/dist/${page}/${dossier.id}/index.html`)),
      );
    }
    await writeFile(file, JSON.stringify({ ...snapshot, records: [snapshot.records[0]] }));
    await build();
    for (const page of ["es/coleccion", "en/collection"]) {
      const html = await readFile(
        path.join(workspace, `apps/website/dist/${page}/index.html`),
        "utf8",
      );
      assert(html.includes("PUBLIC-OBJECT-SENTINEL") && !html.includes("SECOND-OBJECT-SENTINEL"));
    }
    await writeFile(
      file,
      JSON.stringify({
        ...snapshot,
        releaseId: "33333333-3333-4333-8333-333333333333",
        records: [],
      }),
    );
    await build();
    for (const page of ["es/coleccion", "en/collection", "es/visita", "en/visit"]) {
      const html = await readFile(
        path.join(workspace, `apps/website/dist/${page}/index.html`),
        "utf8",
      );
      assert(!html.includes("PUBLIC-OBJECT-SENTINEL") && !html.includes("PUBLIC-HOLDER-SENTINEL"));
      assert(html.includes("33333333-3333-4333-8333-333333333333"));
    }
    console.log("Verified populated and withdrawn website releases in both languages.");
  });
}
verify().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import path from "node:path";
import type { PublicCollection } from "@mosa/public-collection";
import { runCommand } from "./lib/run-command";
import { availablePort, withVerificationWorkspace } from "./lib/verification-workspace";

const first: PublicCollection = {
  schemaVersion: 2,
  releaseId: "11111111-1111-4111-8111-111111111111",
  records: [
    {
      id: "22222222-2222-4222-8222-222222222222",
      name: {
        text: "PUBLIC-OBJECT-SENTINEL",
        language: "rap",
        attributedTo: "Museum",
        sources: ["https://example.org/source"],
      },
      holder: {
        text: "PUBLIC-HOLDER-SENTINEL",
        language: "en",
        attributedTo: "Museum",
        sources: ["https://example.org/source"],
      },
      identifier: {
        namespace: "test",
        value: "PUBLIC-ID-SENTINEL",
        source: "https://example.org/source",
      },
    },
    {
      kind: "dossier",
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
              locator: "Page 12",
              excerpt: "PUBLIC-DESCRIPTION-SENTINEL",
            },
          ],
        },
      ],
      events: [],
      cases: [],
    },
  ],
};

async function verify() {
  await withVerificationWorkspace(path.resolve(__dirname, ".."), async (workspace, signal) => {
    await runCommand("pnpm", ["--filter", "@mosa/website", "build"], { cwd: workspace, signal });
    let current = first;
    let available = true;
    const feed = createServer((_request, response) => {
      response.setHeader("Content-Type", "application/json");
      response.statusCode = available ? 200 : 503;
      response.end(available ? JSON.stringify(current) : "Unavailable");
    });
    await new Promise<void>((resolve) => feed.listen(0, "127.0.0.1", resolve));
    const address = feed.address();
    if (!address || typeof address === "string") throw Error("Missing test feed port");
    const port = await availablePort();
    const site = spawn(process.execPath, ["dist/server/entry.mjs"], {
      cwd: path.join(workspace, "apps/website"),
      env: {
        ...process.env,
        NODE_ENV: "test",
        HOST: "127.0.0.1",
        PORT: String(port),
        PUBLIC_COLLECTION_URL: `http://127.0.0.1:${address.port}/`,
      },
      stdio: "inherit",
    });
    const origin = `http://127.0.0.1:${port}`;
    const get = (route: string) => fetch(new URL(route, origin), { cache: "no-store" });
    try {
      let ready = false;
      for (let attempt = 0; attempt < 40; attempt++) {
        try {
          if ((await get("/es/")).ok) {
            ready = true;
            break;
          }
        } catch {
          /* starting */
        }
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
      assert(ready, "Website server did not start");
      for (const route of ["/es/coleccion/", "/en/collection/"]) {
        const page = await get(route);
        const html = await page.text();
        assert.equal(page.status, 200);
        assert.equal(page.headers.get("cache-control"), "no-store");
        assert(html.includes("PUBLIC-OBJECT-SENTINEL") && html.includes("FULL-DOSSIER-SENTINEL"));
      }
      for (const route of ["/es/coleccion/", "/en/collection/"]) {
        const detail = await get(`${route}${first.records[1].id}/`);
        const html = await detail.text();
        assert.equal(detail.status, 200);
        assert(
          html.includes("PUBLIC-DESCRIPTION-SENTINEL") && html.includes("Original PDF, page 12"),
        );
      }
      assert((await (await get("/sitemap-index.xml")).text()).includes(`${first.records[1].id}/`));
      current = {
        ...first,
        releaseId: "33333333-3333-4333-8333-333333333333",
        records: [first.records[0]],
      };
      for (const route of ["/es/coleccion/", "/en/collection/", "/es/visita/", "/en/visit/"]) {
        const html = await (await get(route)).text();
        assert(!html.includes("FULL-DOSSIER-SENTINEL"));
        assert(html.includes(current.releaseId));
      }
      assert.equal((await get(`/en/collection/${first.records[1].id}/`)).status, 404);
      current = { ...first, releaseId: "44444444-4444-4444-8444-444444444444", records: [] };
      assert(!(await (await get("/es/coleccion/")).text()).includes("PUBLIC-OBJECT-SENTINEL"));
      available = false;
      assert.equal((await get("/collection-snapshot.json")).status, 503);
      assert.equal((await get("/en/collection/")).status, 503);
      console.log(
        "Verified live publication, withdrawal and feed failure without a website rebuild.",
      );
    } finally {
      if (site.exitCode === null) {
        site.kill("SIGTERM");
        await new Promise<void>((resolve) => site.once("close", () => resolve()));
      }
      await new Promise<void>((resolve, reject) =>
        feed.close((error) => (error ? reject(error) : resolve())),
      );
    }
  });
}
verify().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

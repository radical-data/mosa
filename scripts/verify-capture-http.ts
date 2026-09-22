import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { createServer } from "node:http";
import { Client } from "pg";
import { getLocalDatabaseUrl } from "./lib/supabase-local";

async function verify() {
  const databaseUrl =
    process.env.CAPTURE_TEST_DATABASE_URL ?? (await getLocalDatabaseUrl(process.cwd()));
  if (!["localhost", "127.0.0.1", "[::1]"].includes(new URL(databaseUrl).hostname))
    throw Error("HTTP tests require a disposable local database");
  const db = new Client({ connectionString: databaseUrl });
  await db.connect();
  const actor = randomUUID(),
    outsider = randomUUID(),
    login = `capture_test_${randomUUID().replaceAll("-", "")}`,
    password = randomUUID();
  await db.query(`create role ${login} login password '${password}'`);
  await db.query(`grant capture_writer to ${login}`);
  await db.query("insert into capture.researcher(user_id) values($1)", [actor]);
  const auth = createServer((req, res) => {
    res.setHeader("content-type", "application/json");
    if (req.url === "/auth/v1/user" && req.headers.authorization === "Bearer allowed")
      res.end(JSON.stringify({ id: actor }));
    else if (req.url === "/auth/v1/user" && req.headers.authorization === "Bearer outsider")
      res.end(JSON.stringify({ id: outsider }));
    else if (req.url === "/auth/v1/otp") res.end("{}");
    else if (req.url === "/auth/v1/verify")
      res.end(JSON.stringify({ access_token: "allowed", expires_in: 3600, user: { id: actor } }));
    else {
      res.statusCode = 401;
      res.end("{}");
    }
  });
  await new Promise<void>((resolve) => auth.listen(0, "127.0.0.1", resolve));
  const address = auth.address();
  assert(address && typeof address !== "string");
  const port = 44321,
    origin = `http://127.0.0.1:${port}`;
  const captureUrl = new URL(databaseUrl);
  captureUrl.username = login;
  captureUrl.password = password;
  const child = spawn("node", ["apps/explorer/dist/server/entry.mjs"], {
    env: {
      ...process.env,
      NODE_ENV: "test",
      HOST: "127.0.0.1",
      PORT: String(port),
      DATABASE_URL: databaseUrl,
      CAPTURE_DATABASE_URL: captureUrl.toString(),
      SUPABASE_URL: `http://127.0.0.1:${address.port}`,
      SUPABASE_PUBLISHABLE_KEY: "local-test",
      RESEARCH_ORIGIN: origin,
    },
    stdio: "ignore",
  });
  const request = (path: string, token = "allowed", body?: Record<string, string>) =>
    fetch(origin + path, {
      redirect: "manual",
      headers: {
        cookie: `mosa-research=${token}`,
        ...(body ? { origin, "content-type": "application/x-www-form-urlencoded" } : {}),
      },
      ...(body ? { method: "POST", body: new URLSearchParams(body) } : {}),
    });
  try {
    let ready = false;
    for (let i = 0; i < 40; i++) {
      try {
        await request("/research/sign-in");
        ready = true;
        break;
      } catch {
        await new Promise((r) => setTimeout(r, 100));
      }
    }
    assert(ready, "Built explorer must start");
    const signIn = await request("/research/sign-in", "invalid", {
      action: "verify",
      email: "researcher@example.org",
      code: "123456",
    });
    assert.equal(signIn.status, 303);
    assert.match(signIn.headers.get("set-cookie") ?? "", /HttpOnly/i);
    assert.match(signIn.headers.get("set-cookie") ?? "", /SameSite=Strict/i);
    assert.equal((await request("/research", "invalid")).status, 303);
    assert.equal((await request("/research", "outsider")).status, 403);
    assert.equal((await request("/research/catalogues", "outsider")).status, 403);
    const cross = await fetch(`${origin}/research`, {
      method: "POST",
      headers: {
        cookie: "mosa-research=allowed",
        origin: "https://wrong.example",
        "content-type": "application/x-www-form-urlencoded",
      },
      body: "url=https://example.org",
    });
    assert.equal(cross.status, 403);
    const home = await request("/research");
    assert.equal(home.status, 200);
    assert.equal(home.headers.get("cache-control"), "private, no-store");
    const html = await home.text();
    const catalogueName = `HTTP catalogue ${actor}`;
    assert.equal(
      (await request("/research/catalogues", "allowed", { label: catalogueName })).status,
      303,
    );
    const catalogue = (
      await db.query("select namespace from entities.catalogue where label=$1", [catalogueName])
    ).rows[0];
    assert(catalogue);
    const duplicateCatalogue = await request("/research/catalogues", "allowed", {
      label: catalogueName,
    });
    assert((await duplicateCatalogue.text()).includes("already exists"));
    const requestId = html.match(/name="requestId" value="([^"]+)"/)?.[1];
    assert(requestId);
    const created = await request("/research", "allowed", {
      requestId,
      url: `https://example.org/http-${actor}`,
      label: "HTTP pilot",
    });
    assert.equal(created.status, 303);
    const location = created.headers.get("location");
    assert(location);
    const retry = await request("/research", "allowed", {
      requestId,
      url: `https://example.org/http-${actor}`,
    });
    assert.equal(retry.headers.get("location"), location);
    const edit = await request(location);
    assert.equal(edit.status, 200);
    const editPage = await edit.text();
    assert(editPage.includes("Which catalogue assigns this number?"));
    assert(editPage.includes(catalogueName));
    assert(!editPage.includes("customNamespace"));
    assert(editPage.includes('data-when="speakerMode"'));
    assert(editPage.includes("Not established from this source"));
    const invalid = await request(location, "allowed", {
      revision: "1",
      action: "review",
      url: "not-a-url",
      name: "Keep my copied wording",
      catalogue: catalogue.namespace,
      identifier: "Oc,+.2595",
    });
    const invalidPage = await invalid.text();
    assert(invalidPage.includes('href="#url"'));
    assert(invalidPage.includes('value="Keep my copied wording"'));
    assert(invalidPage.includes(`value="${catalogue.namespace}" selected`));
    const manage = await request(location, "allowed", {
      revision: "1",
      action: "catalogues",
      url: `https://example.org/http-${actor}`,
      name: "Work preserved before catalogue editing",
      catalogue: catalogue.namespace,
    });
    assert.equal(manage.status, 303);
    assert.equal(
      manage.headers.get("location"),
      `/research/catalogues?draft=${location.split("/").at(-1)}`,
    );
    const catalogueLocation = manage.headers.get("location");
    assert(catalogueLocation);
    const cataloguePage = await request(catalogueLocation);
    assert((await cataloguePage.text()).includes("Return to your saved draft"));
    assert(
      (await (await request(location)).text()).includes("Work preserved before catalogue editing"),
    );
    const fields = {
      revision: "2",
      action: "review",
      url: `https://example.org/http-${actor}`,
      name: "HTTP object",
      holder: "HTTP museum",
      holderIdentity: "new",
      holderStatus: "reported",
      nameEvidenceMode: "excerpt",
      catalogue: catalogue.namespace,
      identifier: actor,
      nameLocator: "Title",
      nameExcerpt: "HTTP object",
      holderLocator: "Holder",
      holderExcerpt: "HTTP museum",
      holderNameLocator: "Publisher heading",
      holderNameExcerpt: "HTTP museum",
      speakerMode: "holder",
      note: "PRIVATE-HTTP-NOTE",
    };
    assert.equal((await request(location, "allowed", fields)).status, 303);
    const review = await request(location);
    assert((await review.text()).includes("Confirm the object identity"));
    assert.equal(
      (await request(location, "allowed", { revision: "3", action: "accept", identity: "new" }))
        .status,
      303,
    );
    assert.equal(
      (await request(location, "allowed", { revision: "3", action: "accept", identity: "new" }))
        .status,
      303,
    );
    const accepted = await request(location);
    const acceptedPage = await accepted.text();
    assert(acceptedPage.includes("Saved to the research collection"));
    assert(!acceptedPage.includes("PRIVATE-HTTP-NOTE"));
    const result = await db.query("select item_id from capture.draft where owner_id=$1", [actor]);
    assert.equal(result.rowCount, 1);
    assert(result.rows[0].item_id);
    const publicAccess = await request(location, "invalid");
    assert.equal(publicAccess.status, 303);
    console.log(
      "Verified built HTTP flow: authentication, CSRF, private draft, review, acceptance and retry.",
    );
  } finally {
    child.kill("SIGTERM");
    await new Promise<void>((resolve) => child.once("exit", () => resolve()));
    await new Promise<void>((resolve) => auth.close(() => resolve()));
    await db.query(`drop role ${login}`);
    await db.end();
  }
}
verify().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

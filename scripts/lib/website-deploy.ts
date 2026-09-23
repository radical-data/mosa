import { parseCollection, productionFeed } from "@mosa/public-collection";
import { canonical } from "@mosa/public-collection/candidate";

export interface WebsiteDeployment {
  webhook: string;
  token: string;
  productionURL: string;
  commit: string;
}

export async function deployWebsite(config: WebsiteDeployment) {
  for (const value of [config.webhook, config.productionURL]) {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password)
      throw Error("Production URLs must use HTTPS without embedded credentials");
  }
  if (!/^[a-f0-9]{40}$/.test(config.commit)) throw Error("A full main commit is required");
  const webhook = new URL(config.webhook);
  const applicationId = webhook.searchParams.get("uuid");
  if (
    !applicationId ||
    !/^[a-zA-Z0-9-]+$/.test(applicationId) ||
    ["tag", "pr", "pull_request_id"].some((key) => webhook.searchParams.has(key))
  )
    throw Error("Use one website application's production webhook");
  const headers = { Authorization: `Bearer ${config.token}` };
  const request = (url: URL | string, options: RequestInit = {}) =>
    fetch(url, {
      redirect: "error",
      signal: AbortSignal.timeout(10000),
      ...options,
    });
  const feed = await request(productionFeed, { cache: "no-store" });
  if (!feed.ok) throw Error("The research public collection feed is not ready");
  parseCollection(await feed.json());

  const applicationURL = new URL(`/api/v1/applications/${applicationId}`, webhook);
  async function application() {
    const response = await request(applicationURL, { headers });
    if (!response.ok) throw Error("Cannot inspect website hosting application");
    const app = (await response.json()) as {
      git_branch?: string;
      git_commit_sha?: string;
      settings?: {
        is_auto_deploy_enabled?: boolean;
        is_preview_deployments_enabled?: boolean;
      };
    };
    if (
      app.git_branch !== "main" ||
      app.settings?.is_auto_deploy_enabled !== false ||
      app.settings?.is_preview_deployments_enabled !== false
    )
      throw Error("Website hosting must use main with automatic and preview deployments disabled");
    return app;
  }
  const app = await application();
  if (app.git_commit_sha !== config.commit) {
    const update = await request(applicationURL, {
      method: "PATCH",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ git_commit_sha: config.commit }),
    });
    if (!update.ok)
      throw Error("Cannot set website hosting commit; token needs application update access");
    if ((await application()).git_commit_sha !== config.commit)
      throw Error("Website hosting did not retain the main commit");
  }
  const started = await request(config.webhook, { method: "POST", headers });
  if (!started.ok) throw Error(`Website deployment request failed (HTTP ${started.status})`);
  const accepted = (await started.json()) as {
    deployments?: Array<{ resource_uuid?: string; deployment_uuid?: string }>;
  };
  const job = accepted.deployments?.[0];
  if (
    accepted.deployments?.length !== 1 ||
    job?.resource_uuid !== applicationId ||
    !job.deployment_uuid ||
    !/^[a-zA-Z0-9-]+$/.test(job.deployment_uuid)
  )
    throw Error("Hosting did not identify exactly one website deployment");
  const jobURL = new URL(`/api/v1/deployments/${job.deployment_uuid}`, webhook);
  const deadline = Date.now() + 180000;
  while (Date.now() < deadline) {
    const status = await request(jobURL, { headers });
    if (!status.ok) throw Error("Cannot inspect website deployment job");
    const result = (await status.json()) as { status?: string; commit?: string };
    if (result.status === "finished") {
      if (result.commit !== config.commit) throw Error("Website job built a different commit");
      const latest = await request(productionFeed, { cache: "no-store" });
      if (!latest.ok) throw Error("The research public collection feed is unavailable");
      const expected = parseCollection(await latest.json());
      const served = await request(
        new URL(`/collection-snapshot.json?verify=${Date.now()}`, config.productionURL),
        { cache: "no-store" },
      );
      if (served.ok && canonical(parseCollection(await served.json())) === canonical(expected)) {
        let pagesMatch = true;
        for (const route of ["/es/coleccion/", "/en/collection/", "/es/visita/", "/en/visit/"]) {
          const page = await request(
            new URL(`${route}?verify=${Date.now()}`, config.productionURL),
            { cache: "no-store" },
          );
          if (
            !page.ok ||
            !(await page.text()).includes(`data-release-id="${expected.releaseId}"`)
          ) {
            pagesMatch = false;
            break;
          }
        }
        if (pagesMatch) return expected;
      }
    } else if (["failed", "cancelled"].includes(result.status ?? ""))
      throw Error(`Website deployment ${result.status}`);
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
  throw Error("Website deployment could not be verified within 180 seconds");
}

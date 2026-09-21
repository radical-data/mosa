import { type PublicCollection, parseCollection } from "@mosa/public-collection";
import type { Client } from "pg";
import { canonical } from "./candidate";
import { currentRelease, requireIdle, transaction } from "./store";

export interface DeploymentConfig {
  webhook: string;
  token: string;
  productionURL: string;
  commit: string;
}
export async function deploy(client: Client, expected: PublicCollection, config: DeploymentConfig) {
  // Caller holds the session publisher lock through verification. Withdrawal cannot
  // interleave with a deployment; the next withdrawal invalidates this release.
  for (const value of [config.webhook, config.productionURL]) {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password)
      throw Error("Production URLs must use HTTPS without embedded credentials");
  }
  if (!/^[a-f0-9]{40}$/.test(config.commit)) throw Error("A full, reviewed Git commit is required");
  const webhook = new URL(config.webhook);
  const applicationId = webhook.searchParams.get("uuid");
  if (
    !applicationId ||
    !/^[a-zA-Z0-9-]+$/.test(applicationId) ||
    ["tag", "pr", "pull_request_id"].some((key) => webhook.searchParams.has(key))
  )
    throw Error("Use one application's production webhook");
  const applicationURL = new URL(`/api/v1/applications/${applicationId}`, webhook);
  const appResponse = await fetch(applicationURL, {
    headers: { Authorization: `Bearer ${config.token}` },
    redirect: "error",
    signal: AbortSignal.timeout(10000),
  });
  if (!appResponse.ok)
    throw Error("Cannot verify hosting configuration; token needs read and deploy permissions");
  const app = (await appResponse.json()) as {
    git_commit_sha?: string;
    settings?: { is_auto_deploy_enabled?: boolean; is_preview_deployments_enabled?: boolean };
  };
  if (
    app.git_commit_sha !== config.commit ||
    app.settings?.is_auto_deploy_enabled !== false ||
    app.settings?.is_preview_deployments_enabled !== false
  )
    throw Error(
      "Pin the hosting application to the reviewed commit and disable automatic/preview deployments first",
    );
  await transaction(client, async () => {
    await requireIdle(client);
    await currentRelease(client, expected);
    await client.query(
      "update publication.state set pending_release_id=$1,pending_started_at=now() where singleton",
      [expected.releaseId],
    );
  });
  const response = await fetch(config.webhook, {
    method: "POST",
    headers: { Authorization: `Bearer ${config.token}` },
    redirect: "error",
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok)
    throw Error(
      `Hosting deployment request failed (HTTP ${response.status}); inspect the hosting dashboard`,
    );
  const accepted = (await response.json()) as {
    deployments?: Array<{ resource_uuid?: string; deployment_uuid?: string }>;
  };
  const jobs = accepted.deployments;
  if (
    jobs?.length !== 1 ||
    jobs[0].resource_uuid !== applicationId ||
    !jobs[0].deployment_uuid ||
    !/^[a-zA-Z0-9-]+$/.test(jobs[0].deployment_uuid)
  )
    throw Error("Hosting did not identify exactly one deployment; resolve it before retrying");
  const deploymentURL = new URL(`/api/v1/deployments/${jobs[0].deployment_uuid}`, webhook);
  const deadline = Date.now() + 180000;
  while (Date.now() < deadline) {
    try {
      const jobResponse = await fetch(deploymentURL, {
        headers: { Authorization: `Bearer ${config.token}` },
        redirect: "error",
        signal: AbortSignal.timeout(10000),
      });
      if (!jobResponse.ok) throw Error("Cannot confirm hosting job");
      const job = (await jobResponse.json()) as { status?: string; commit?: string };
      if (job.status !== "finished" || job.commit !== config.commit)
        throw Error("Hosting job has not finished at the reviewed commit");
      const marker = new URL("/collection-snapshot.json", config.productionURL);
      marker.searchParams.set("verify", `${expected.releaseId}-${Date.now()}`);
      const served = await fetch(marker, {
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(10000),
      });
      if (!served.ok || canonical(parseCollection(await served.json())) !== canonical(expected))
        throw Error("Not live yet");
      for (const route of ["/es/coleccion/", "/en/collection/", "/es/visita/", "/en/visit/"]) {
        const url = new URL(route, config.productionURL);
        url.searchParams.set("verify", `${expected.releaseId}-${Date.now()}`);
        const page = await fetch(url, {
          cache: "no-store",
          redirect: "error",
          signal: AbortSignal.timeout(10000),
        });
        if (!page.ok || !(await page.text()).includes(`data-release-id="${expected.releaseId}"`))
          throw Error("Served pages do not match snapshot");
      }
      await transaction(client, async () => {
        await currentRelease(client, expected);
        await client.query(
          "update publication.state set live_release_id=$1,live_verified_at=now(),pending_release_id=null,pending_started_at=null where singleton",
          [expected.releaseId],
        );
      });
      return;
    } catch {
      // Network/rolling-deployment failures are not evidence of publication.
    }
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
  throw Error(
    "Deployment not verified within 180 seconds. Resolve/cancel the hosting job before another release; do not report withdrawal complete.",
  );
}

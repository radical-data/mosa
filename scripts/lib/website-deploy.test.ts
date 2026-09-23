import { afterEach, describe, expect, it, vi } from "vitest";
import { deployWebsite } from "./website-deploy";

const config = {
  webhook: "https://hosting.example/api/v1/deploy?uuid=website",
  token: "SECRET-TOKEN",
  productionURL: "https://museum.example",
  commit: "a".repeat(40),
};
const collection = {
  schemaVersion: 2,
  releaseId: "11111111-1111-4111-8111-111111111111",
  records: [],
};
const app = (commit: string, branch = "main") =>
  Response.json({
    git_branch: branch,
    git_commit_sha: commit,
    settings: { is_auto_deploy_enabled: false, is_preview_deployments_enabled: false },
  });
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("website code deployment", () => {
  it("refuses another hosting branch before changing it", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(Response.json(collection))
      .mockResolvedValueOnce(app("b".repeat(40), "staging"));
    vi.stubGlobal("fetch", fetch);
    await expect(deployWebsite(config)).rejects.toThrow("must use main");
    expect(fetch).toHaveBeenCalledTimes(2);
  });
  it("fails before deployment when Coolify cannot set the main commit", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(Response.json(collection))
      .mockResolvedValueOnce(app("b".repeat(40)))
      .mockResolvedValueOnce(new Response("forbidden", { status: 403 }));
    vi.stubGlobal("fetch", fetch);
    await expect(deployWebsite(config)).rejects.toThrow("application update access");
    expect(fetch).toHaveBeenCalledTimes(3);
  });
  it("verifies the served collection and both language listings", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(Response.json(collection))
      .mockResolvedValueOnce(app("b".repeat(40)))
      .mockResolvedValueOnce(Response.json({}))
      .mockResolvedValueOnce(app(config.commit))
      .mockResolvedValueOnce(
        Response.json({ deployments: [{ resource_uuid: "website", deployment_uuid: "job-1" }] }),
      )
      .mockResolvedValueOnce(Response.json({ status: "finished", commit: config.commit }))
      .mockResolvedValueOnce(Response.json(collection))
      .mockResolvedValueOnce(Response.json(collection));
    for (let i = 0; i < 4; i++)
      fetch.mockResolvedValueOnce(
        new Response(`<section data-release-id="${collection.releaseId}">`),
      );
    vi.stubGlobal("fetch", fetch);
    await expect(deployWebsite(config)).resolves.toEqual(collection);
    expect(fetch).toHaveBeenNthCalledWith(
      3,
      expect.any(URL),
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ git_commit_sha: config.commit }),
      }),
    );
    expect(fetch).toHaveBeenCalledTimes(12);
  });
});

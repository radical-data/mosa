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
const app = (commit = "HEAD", branch = "main") =>
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
  it("refuses another hosting branch before deployment", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(Response.json(collection))
      .mockResolvedValueOnce(app("b".repeat(40), "staging"));
    vi.stubGlobal("fetch", fetch);
    await expect(deployWebsite(config)).rejects.toThrow("must use main");
    expect(fetch).toHaveBeenCalledTimes(2);
  });
  it("requires main at HEAD before deployment", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(Response.json(collection))
      .mockResolvedValueOnce(app("b".repeat(40)));
    vi.stubGlobal("fetch", fetch);
    await expect(deployWebsite(config)).rejects.toThrow("Commit SHA to HEAD");
    expect(fetch).toHaveBeenCalledTimes(2);
  });
  it("verifies the served collection and both language listings", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(Response.json(collection))
      .mockResolvedValueOnce(app())
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
    expect(fetch.mock.calls.some(([, options]) => options?.method === "PATCH")).toBe(false);
    expect(fetch).toHaveBeenCalledTimes(10);
  });
});

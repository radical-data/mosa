import { afterEach, describe, expect, it, vi } from "vitest";
import { deployWebsite } from "./website-deploy";
import { verifyWebsiteHttp } from "./website-http";

vi.mock("./website-http", () => ({ verifyWebsiteHttp: vi.fn() }));

const config = {
  webhook: "https://hosting.example/api/v1/deploy?uuid=website",
  token: "SECRET-TOKEN",
  productionURL: "https://museum.example",
  commit: "a".repeat(40),
};
const deployed = { commit: config.commit };
const app = (settings: Record<string, boolean> = {}) =>
  Response.json({
    git_branch: "main",
    git_commit_sha: "HEAD",
    settings: {
      is_auto_deploy_enabled: false,
      is_preview_deployments_enabled: false,
      is_git_lfs_enabled: true,
      ...settings,
    },
  });

afterEach(() => {
  vi.resetAllMocks();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("website deployment", () => {
  it("requires Git LFS before deployment", async () => {
    const fetch = vi.fn().mockResolvedValueOnce(app({ is_git_lfs_enabled: false }));
    vi.stubGlobal("fetch", fetch);
    await expect(deployWebsite(config)).rejects.toThrow("Enable Git LFS");
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("verifies the deployed commit before running the shared public HTTP checks", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(app())
      .mockResolvedValueOnce(
        Response.json({ deployments: [{ resource_uuid: "website", deployment_uuid: "job-1" }] }),
      )
      .mockResolvedValueOnce(Response.json({ status: "finished", commit: config.commit }));
    vi.stubGlobal("fetch", fetch);
    await expect(deployWebsite(config)).resolves.toEqual(deployed);
    expect(fetch).toHaveBeenCalledTimes(3);
    expect(verifyWebsiteHttp).toHaveBeenCalledExactlyOnceWith(config.productionURL);
  });

  it("fails the release when public HTTP verification fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(app())
        .mockResolvedValueOnce(
          Response.json({ deployments: [{ resource_uuid: "website", deployment_uuid: "job-1" }] }),
        )
        .mockResolvedValueOnce(Response.json({ status: "finished", commit: config.commit })),
    );
    vi.mocked(verifyWebsiteHttp).mockRejectedValueOnce(new Error("Broken public redirect"));
    await expect(deployWebsite(config)).rejects.toThrow("Broken public redirect");
  });

  it("rejects a different deployed commit before checking HTTP", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(app())
        .mockResolvedValueOnce(
          Response.json({ deployments: [{ resource_uuid: "website", deployment_uuid: "job-1" }] }),
        )
        .mockResolvedValueOnce(Response.json({ status: "finished", commit: "b".repeat(40) })),
    );
    await expect(deployWebsite(config)).rejects.toThrow("different commit");
    expect(verifyWebsiteHttp).not.toHaveBeenCalled();
  });
});

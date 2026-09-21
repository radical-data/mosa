import type { PublicCollection } from "@mosa/public-collection";
import type { Client } from "pg";
import { afterEach, describe, expect, it, vi } from "vitest";
import { deploy } from "./deploy";
import { currentRelease, requireIdle } from "./store";

vi.mock("./store", () => ({
  currentRelease: vi.fn(),
  requireIdle: vi.fn(),
  transaction: vi.fn(async (_client, fn) => fn()),
}));
const snapshot: PublicCollection = {
  schemaVersion: 1,
  releaseId: "11111111-1111-4111-8111-111111111111",
  records: [],
};
const config = {
  webhook: "https://hosting.example/api/v1/deploy?uuid=website",
  token: "SECRET-TOKEN",
  productionURL: "https://museum.example",
  commit: "a".repeat(40),
};
const query = vi.fn(async (_sql: string, _parameters?: unknown[]) => ({ rows: [] }));
const client = { query } as unknown as Client;
function hosting(commit = config.commit) {
  return Response.json({
    git_commit_sha: commit,
    settings: { is_auto_deploy_enabled: false, is_preview_deployments_enabled: false },
  });
}
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});
describe("publication deployment gate", () => {
  it("rejects a moving hosting branch before requesting deployment", async () => {
    const fetch = vi.fn(async () => hosting("HEAD"));
    vi.stubGlobal("fetch", fetch);
    await expect(deploy(client, snapshot, config)).rejects.toThrow("Pin the hosting");
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(query).not.toHaveBeenCalled();
  });
  it("rejects a stale release without triggering the webhook", async () => {
    vi.mocked(currentRelease).mockRejectedValueOnce(Error("Stale release"));
    const fetch = vi.fn(async () => hosting());
    vi.stubGlobal("fetch", fetch);
    await expect(deploy(client, snapshot, config)).rejects.toThrow("Stale release");
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it("keeps failed hosting requests unresolved instead of recording them live", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(hosting())
      .mockResolvedValueOnce(new Response("failure", { status: 500 }));
    vi.stubGlobal("fetch", fetch);
    await expect(deploy(client, snapshot, config)).rejects.toThrow("deployment request failed");
    expect(query.mock.calls.some(([sql]) => String(sql).includes("pending_release_id=$1"))).toBe(
      true,
    );
    expect(query.mock.calls.some(([sql]) => String(sql).includes("live_release_id=$1"))).toBe(
      false,
    );
  });
  it("does not mistake an already served snapshot for a finished new job", async () => {
    vi.useFakeTimers();
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(hosting())
      .mockResolvedValueOnce(
        Response.json({ deployments: [{ resource_uuid: "website", deployment_uuid: "job-1" }] }),
      )
      .mockImplementation(async () =>
        Response.json({ status: "in_progress", commit: config.commit }),
      );
    vi.stubGlobal("fetch", fetch);
    const result = deploy(client, snapshot, config).catch((error) => error);
    await vi.advanceTimersByTimeAsync(184000);
    expect(await result).toBeInstanceOf(Error);
    expect(fetch.mock.calls.some(([url]) => String(url).includes("collection-snapshot"))).toBe(
      false,
    );
    expect(query.mock.calls.some(([sql]) => sql.includes("live_release_id=$1"))).toBe(false);
  });
  it("marks live only after matching the snapshot and both language listings", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(hosting())
      .mockResolvedValueOnce(
        Response.json({ deployments: [{ resource_uuid: "website", deployment_uuid: "job-1" }] }),
      )
      .mockResolvedValueOnce(Response.json({ status: "finished", commit: config.commit }))
      .mockResolvedValueOnce(Response.json(snapshot));
    for (let i = 0; i < 4; i++)
      fetch.mockResolvedValueOnce(
        new Response(`<section data-release-id="${snapshot.releaseId}">`),
      );
    vi.stubGlobal("fetch", fetch);
    await deploy(client, snapshot, config);
    expect(fetch).toHaveBeenCalledTimes(8);
    expect(requireIdle).toHaveBeenCalled();
    expect(currentRelease).toHaveBeenCalledTimes(2);
    expect(query.mock.calls.some(([sql]) => String(sql).includes("live_release_id=$1"))).toBe(true);
  });
});

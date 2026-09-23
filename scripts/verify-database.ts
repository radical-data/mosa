import { randomUUID } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { runCommand } from "./lib/run-command";
import { getSupabaseExecutable } from "./lib/supabase-local";
import { availablePort, withVerificationWorkspace } from "./lib/verification-workspace";

async function verify(): Promise<void> {
  const { parse, stringify } = await import("smol-toml");
  const root = path.resolve(__dirname, "..");
  await withVerificationWorkspace(root, async (workspace, signal) => {
    const projectId = `mosa-verify-${randomUUID().replaceAll("-", "").slice(0, 24)}`;
    const configPath = path.join(workspace, "supabase/config.toml");
    const config = parse(await readFile(configPath, "utf8"));
    const port = await availablePort();
    config.project_id = projectId;
    config.db = {
      ...(config.db as object),
      port,
      shadow_port: await availablePort(),
      seed: { enabled: false },
    };
    config.studio = { enabled: false };
    await writeFile(configPath, stringify(config));
    const databaseUrl = `postgresql://postgres:postgres@127.0.0.1:${port}/postgres`;
    const env = {
      LOCAL_DATABASE_URL: databaseUrl,
      SUPABASE_DB_URL: databaseUrl,
      DATABASE_URL: databaseUrl,
      CAPTURE_TEST_DATABASE_URL: databaseUrl,
      PUBLICATION_TEST_DATABASE_URL: databaseUrl,
      DATABASE_SSL_CA: undefined,
      SOURCE_STORAGE_URL: undefined,
      RESEARCH_BUNDLE_TEST_FILE: undefined,
    };
    const supabase = getSupabaseExecutable(root);
    console.log(`Verifying in disposable stack ${projectId} (port ${port}).`);
    try {
      await runCommand(
        supabase,
        [
          "start",
          "--exclude",
          "analytics,edge-runtime,functions,imgproxy,inbucket,kong,meta,realtime,rest,storage,studio,vector",
        ],
        { cwd: workspace, env, signal },
      );
      await runCommand(
        process.execPath,
        ["--import", "tsx", "scripts/lib/verify-database-suite.ts"],
        {
          cwd: workspace,
          env,
          signal,
        },
      );
    } finally {
      // Use the unique ID explicitly, including after a partial start or interruption.
      await runCommand(supabase, ["stop", "--project-id", projectId, "--no-backup"], {
        cwd: workspace,
      });
    }
  });
}

verify().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

import { Pool } from "pg";

async function main() {
  const { runOne } = await import("../apps/explorer/src/lib/sources/jobs.js");
  const connectionString = process.env.RESEARCH_WORKER_DATABASE_URL;
  if (!connectionString)
    throw new Error("Configure RESEARCH_WORKER_DATABASE_URL with a capture_worker login.");
  const pool = new Pool({ connectionString, max: 2 });
  try {
    for (;;) {
      const worked = await runOne(pool);
      if (process.argv.includes("--once")) break;
      if (!worked) await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  } finally {
    await pool.end();
  }
}
main().catch((e) => {
  console.error(e instanceof Error ? e.message : "Worker failed");
  process.exitCode = 1;
});

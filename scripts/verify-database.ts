import path from "node:path";
import { runCommand } from "./lib/run-command";
import { getSupabaseExecutable } from "./lib/supabase-local";
import { loadPhase1Fixtures } from "./load-phase-1-fixtures";
import { loadPhase2Fixtures } from "./load-phase-2-fixtures";
import { loadPhase3Fixtures } from "./load-phase-3-fixtures";
import { verifyObjectDossierImport } from "./verify-object-dossier-import";

const projectRoot = path.resolve(__dirname, "..");
const supabase = getSupabaseExecutable(projectRoot);

async function verifyDatabase(): Promise<void> {
  await runCommand(supabase, ["start"], { cwd: projectRoot });
  await runCommand(supabase, ["db", "reset", "--local", "--no-seed"], { cwd: projectRoot });

  await runCommand("pnpm", ["exec", "tsx", "scripts/verify-collection-publication.ts"], {
    cwd: projectRoot,
  });

  await runCommand("pnpm", ["exec", "tsx", "scripts/verify-source-capture.ts"], {
    cwd: projectRoot,
  });

  await loadPhase1Fixtures();
  await loadPhase2Fixtures();
  await loadPhase3Fixtures();

  await runCommand(supabase, ["db", "lint", "--local", "--level", "error"], { cwd: projectRoot });
  await runCommand(
    supabase,
    ["test", "db", "supabase/tests/database/phase-1-cases.test.sql", "--local"],
    { cwd: projectRoot },
  );
  await runCommand(
    supabase,
    ["test", "db", "supabase/tests/database/phase-2-mamari.test.sql", "--local"],
    { cwd: projectRoot },
  );
  await runCommand(
    supabase,
    ["test", "db", "supabase/tests/database/phase-2-te-papa-moai-kavakava.test.sql", "--local"],
    { cwd: projectRoot },
  );
  await runCommand(
    supabase,
    ["test", "db", "supabase/tests/database/phase-2-hoa-hakananai-a.test.sql", "--local"],
    { cwd: projectRoot },
  );
  await runCommand(
    supabase,
    ["test", "db", "supabase/tests/database/phase-2-hoa-hakananai-a-community.test.sql", "--local"],
    { cwd: projectRoot },
  );
  await runCommand(
    supabase,
    [
      "test",
      "db",
      "supabase/tests/database/phase-2-hoa-hakananai-a-production.test.sql",
      "--local",
    ],
    { cwd: projectRoot },
  );
  await runCommand(
    supabase,
    ["test", "db", "supabase/tests/database/phase-2-la-serena-moai.test.sql", "--local"],
    { cwd: projectRoot },
  );
  await runCommand(
    supabase,
    ["test", "db", "supabase/tests/database/phase-2-benin-ama.test.sql", "--local"],
    { cwd: projectRoot },
  );
  await runCommand(
    supabase,
    ["test", "db", "supabase/tests/database/phase-3-aberdeen-head.test.sql", "--local"],
    { cwd: projectRoot },
  );
  await runCommand(
    supabase,
    ["test", "db", "supabase/tests/database/phase-3-hoa-hakananai-a.test.sql", "--local"],
    { cwd: projectRoot },
  );
  await runCommand(
    supabase,
    ["test", "db", "supabase/tests/database/explorer-reader-role.test.sql", "--local"],
    { cwd: projectRoot },
  );
  await runCommand(
    supabase,
    ["test", "db", "supabase/tests/database/foregrounded-claims.test.sql", "--local"],
    { cwd: projectRoot },
  );

  // Runs last because it writes canonical rows the pgTAP fixtures tests
  // must not see.
  await verifyObjectDossierImport();
  await runCommand("pnpm", ["--filter", "@mosa/explorer", "build"], { cwd: projectRoot });
  await runCommand("pnpm", ["exec", "tsx", "scripts/verify-capture-http.ts"], { cwd: projectRoot });
}

async function main(): Promise<void> {
  try {
    await verifyDatabase();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`error: ${message}\n`);
    process.exitCode = 1;
  }
}

void main();

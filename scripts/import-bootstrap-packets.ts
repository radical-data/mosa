import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import { runImport } from "@mosa/object-dossier/import";
import { readPacketFile } from "@mosa/object-dossier/packet";
import { validatePacket } from "@mosa/object-dossier/validate";
import { formatOutcome } from "./lib/object-dossier/report";
import { resolveImportDatabaseUrl } from "./lib/supabase-local";

const projectRoot = path.resolve(__dirname, "..");
const bootstrapDir = path.join(projectRoot, "packets", "bootstrap");
const manifestPath = path.join(bootstrapDir, "manifest.json");

interface BootstrapManifest {
  datasetKey: string;
  version: string;
  packets: string[];
}

const USAGE = `Usage: tsx scripts/import-bootstrap-packets.ts [options]

Imports every packet listed in packets/bootstrap/manifest.json in order,
under dataset key mosa-bootstrap.

Options:
  --check               Validate packets only; do not connect to a database.
  --apply               Write each packet (default is dry-run).
  --linked              Use the project from \`supabase link\` plus
                        SUPABASE_DB_PASSWORD (same pattern as \`db push\`).
  --database-url <url>  Explicit target database URL. Defaults to
                        LOCAL_DATABASE_URL, SUPABASE_DB_URL or the local stack.
  --help                Show this message.
`;

async function loadManifest(): Promise<BootstrapManifest> {
  const raw = JSON.parse(await readFile(manifestPath, "utf8")) as BootstrapManifest;
  if (!Array.isArray(raw.packets) || raw.packets.length === 0) {
    throw new Error(`Bootstrap manifest has no packets: ${manifestPath}`);
  }
  return raw;
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    args: process.argv.slice(2).filter((arg) => arg !== "--"),
    allowPositionals: false,
    options: {
      check: { type: "boolean", default: false },
      apply: { type: "boolean", default: false },
      linked: { type: "boolean", default: false },
      "database-url": { type: "string" },
      help: { type: "boolean", default: false },
    },
  });

  if (values.help) {
    process.stdout.write(USAGE);
    return;
  }

  if (values.check && values.apply) {
    process.stderr.write("error: --check and --apply are mutually exclusive.\n");
    process.exitCode = 1;
    return;
  }

  const manifest = await loadManifest();
  const packetPaths = manifest.packets.map((name) => path.join(bootstrapDir, name));

  // Fail fast if a listed file is missing or an unlisted .packet.json appears.
  const onDisk = (await readdir(bootstrapDir)).filter((name) => name.endsWith(".packet.json"));
  const listed = new Set(manifest.packets);
  for (const name of onDisk) {
    if (!listed.has(name)) {
      process.stderr.write(
        `warning: ${name} exists in packets/bootstrap but is not listed in manifest.json\n`,
      );
    }
  }

  const databaseUrl = values.check
    ? undefined
    : await resolveImportDatabaseUrl(projectRoot, {
        databaseUrl: values["database-url"],
        linked: values.linked,
      });

  for (const packetPath of packetPaths) {
    const raw = await readPacketFile(packetPath);
    const validation = validatePacket(raw);

    if (validation.errors.length > 0 || !validation.packet) {
      process.stderr.write(`Packet ${packetPath} is invalid:\n`);
      for (const error of validation.errors) {
        process.stderr.write(`  - ${error}\n`);
      }
      process.exitCode = 1;
      return;
    }

    if (validation.packet.dataset.key !== manifest.datasetKey) {
      process.stderr.write(
        `error: ${packetPath} dataset.key is ${validation.packet.dataset.key}, expected ${manifest.datasetKey}\n`,
      );
      process.exitCode = 1;
      return;
    }

    if (values.check) {
      process.stdout.write(`OK ${path.relative(projectRoot, packetPath)}\n`);
      continue;
    }

    process.stdout.write(`\n=== ${path.relative(projectRoot, packetPath)} ===\n`);
    const outcome = await runImport(validation.packet, {
      databaseUrl: databaseUrl as string,
      apply: values.apply,
      applicationName: "mosa-bootstrap-importer",
    });
    process.stdout.write(`${formatOutcome(outcome)}\n`);
  }

  if (values.check) {
    process.stdout.write(`Validated ${packetPaths.length} bootstrap packets.\n`);
  }
}

if (require.main === module) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`error: ${message}\n`);
    process.exitCode = 1;
  });
}

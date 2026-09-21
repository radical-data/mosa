import type { ImportOutcome, ImportPlan, WorkStatus } from "@mosa/object-dossier/import";
import type { EntityResolution, PacketEntityKind } from "@mosa/object-dossier/resolve";

const ENTITY_KIND_ORDER: PacketEntityKind[] = ["object", "agent", "place", "source"];

function countByAction(resolutions: EntityResolution[]): Record<string, number> {
  const counts: Record<string, number> = { create: 0, matched: 0, bound: 0 };
  for (const resolution of resolutions) {
    counts[resolution.action] += 1;
  }
  return counts;
}

function countWork(items: WorkStatus[]): { create: number; bound: number } {
  let create = 0;
  let bound = 0;
  for (const item of items) {
    if (item.action === "create") {
      create += 1;
    } else {
      bound += 1;
    }
  }
  return { create, bound };
}

function formatPlan(plan: ImportPlan): string {
  const lines: string[] = [];

  lines.push(`Dataset: ${plan.datasetKey} (packet version ${plan.packetVersion})`);
  lines.push(`Packet checksum: sha256 ${plan.sha256}`);
  lines.push(
    plan.datasetId
      ? `Dataset record: existing (${plan.datasetId})`
      : "Dataset record: will be created",
  );
  lines.push("");

  const resolutions = [...plan.resolution.entities.values()];
  for (const kind of ENTITY_KIND_ORDER) {
    const ofKind = resolutions.filter((resolution) => resolution.kind === kind);
    if (ofKind.length === 0) {
      continue;
    }
    const counts = countByAction(ofKind);
    lines.push(
      `${kind}s: ${ofKind.length} total — ${counts.create} to create, ${counts.matched} matched existing, ${counts.bound} already bound`,
    );
    for (const resolution of ofKind) {
      const detail = resolution.detail ? ` (${resolution.detail})` : "";
      const target = resolution.entityId ? ` -> ${resolution.entityId}` : "";
      lines.push(`  ${resolution.action.padEnd(7)} ${resolution.key}${target}${detail}`);
    }
  }

  const claims = countWork(plan.claims);
  const evidence = countWork(plan.evidence);
  lines.push("");
  lines.push(
    `claims: ${plan.claims.length} total (including derived refers_to) — ${claims.create} to create, ${claims.bound} already bound`,
  );
  lines.push(
    `evidence: ${plan.evidence.length} total — ${evidence.create} to create, ${evidence.bound} already bound`,
  );

  if (plan.resolution.warnings.length > 0) {
    lines.push("");
    lines.push("Warnings:");
    for (const warning of plan.resolution.warnings) {
      lines.push(`  - ${warning}`);
    }
  }

  return lines.join("\n");
}

export function formatOutcome(outcome: ImportOutcome): string {
  const lines: string[] = [];

  lines.push(formatPlan(outcome.plan));
  lines.push("");

  if (outcome.noop) {
    lines.push(
      "No-op: this packet checksum has already been imported successfully for this dataset.",
    );
    return lines.join("\n");
  }

  if (!outcome.applied) {
    lines.push("Dry run only. Re-run with --apply to write these records.");
    return lines.join("\n");
  }

  lines.push(
    `Applied (run ${outcome.runId}): created ${outcome.created.entities} entities, ${outcome.created.identifiers} external identifiers, ${outcome.created.claims} claims, ${outcome.created.evidence} evidence rows.`,
  );

  return lines.join("\n");
}

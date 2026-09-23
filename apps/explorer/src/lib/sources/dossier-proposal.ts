import type { DossierPacket, PacketSource } from "@mosa/object-dossier/packet";
import { validatePacket } from "@mosa/object-dossier/validate";
import { CaptureError } from "../capture/model.js";
import { type BundleSource, bundleRecordId, type ResearchBundle } from "./bundle.js";

export interface BundleDossier {
  key: string;
  label: string;
  notes: string;
  objects: DossierPacket["objects"];
  agents: DossierPacket["agents"];
  places: DossierPacket["places"];
  events: NonNullable<DossierPacket["events"]>;
  claims: DossierPacket["claims"];
  restitutionCases: NonNullable<DossierPacket["restitutionCases"]>;
}

export interface SourceIdentity {
  source_id: string;
  id: string;
}

// A bundle may hold many sources for many objects. Keep only the sources this
// dossier actually cites, so its reviewer sees the relevant evidence.
export function proposalPacket(
  bundle: ResearchBundle,
  dossier: BundleDossier,
  identities: Map<string, SourceIdentity>,
  actor: string,
): DossierPacket {
  const citedSources = new Set<string>();
  for (const object of dossier.objects)
    for (const identifier of object.externalIdentifiers ?? [])
      if (identifier.source) citedSources.add(identifier.source);
  for (const claim of dossier.claims) {
    citedSources.add(claim.subject);
    if (claim.object) citedSources.add(claim.object);
    for (const evidence of Array.isArray(claim.evidence) ? claim.evidence : [claim.evidence])
      citedSources.add(evidence.source);
  }
  for (const caseRecord of dossier.restitutionCases)
    for (const document of caseRecord.documents) citedSources.add(document.source);
  const sources: PacketSource[] = bundle.sources
    .filter((source) => citedSources.has(source.key))
    .map((source) => {
      const identity = identities.get(source.key);
      if (!identity) throw new CaptureError(`Missing preserved source ${source.key}.`);
      return {
        key: source.key,
        kind: source.contentType.startsWith("application/pdf")
          ? "document"
          : "institutional_record",
        reference: `urn:mosa:source:${identity.source_id}`,
        version: identity.id,
        retrievedAt: source.retrievedAt,
        citation: source.citation,
        ...(source.url ? { publicUrl: source.url } : {}),
        about: dossier.objects
          .filter((object) =>
            dossier.claims.some(
              (claim) =>
                claim.subject === object.key &&
                (Array.isArray(claim.evidence) ? claim.evidence : [claim.evidence]).some(
                  (evidence) => evidence.source === source.key,
                ),
            ),
          )
          .map((object) => object.key),
      };
    });
  const packet: DossierPacket = {
    schemaVersion: 4,
    dataset: {
      key: `bundle-${actor}-${bundle.id}-${dossier.key}`,
      version: "1",
      title: dossier.label,
    },
    objects: dossier.objects,
    agents: dossier.agents,
    places: dossier.places,
    events: dossier.events,
    restitutionCases: dossier.restitutionCases,
    sources,
    claims: dossier.claims,
  };
  const validated = validatePacket(packet);
  if (!validated.packet)
    throw new CaptureError(`Dossier ${dossier.key}: ${validated.errors.join("; ")}`);
  return validated.packet;
}

export function placeholderIdentities(bundle: ResearchBundle) {
  return new Map<string, SourceIdentity>(
    bundle.sources.map((source: BundleSource) => [
      source.key,
      {
        source_id: bundleRecordId("proposal", bundle.id, `source:${source.key}`),
        id: bundleRecordId("proposal", bundle.id, `version:${source.key}`),
      },
    ]),
  );
}

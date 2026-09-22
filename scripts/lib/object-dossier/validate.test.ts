import { readFileSync } from "node:fs";
import path from "node:path";
import type { DossierPacket } from "@mosa/object-dossier/packet";
import { validatePacket } from "@mosa/object-dossier/validate";
import { describe, expect, it } from "vitest";

const EXAMPLE_PACKET_PATH = path.resolve(
  __dirname,
  "../../../schemas/examples/hoa-hakananai-a.packet.json",
);

function minimalPacket(): DossierPacket {
  return {
    schemaVersion: 1,
    dataset: { key: "test-dataset", version: "1" },
    objects: [{ key: "item:x", kind: "artefact" }],
    agents: [{ key: "agent:x", kind: "organisation" }],
    places: [{ key: "place:x", kind: "city" }],
    sources: [
      {
        key: "source:x",
        kind: "institutional_record",
        url: "https://example.org/record/1",
        retrievedAt: "2026-07-28T00:00:00Z",
        about: ["item:x"],
      },
    ],
    claims: [
      {
        key: "claim:x:name",
        subject: "item:x",
        predicate: "has_name",
        literal: { type: "text", value: "X" },
        assertedBy: "agent:x",
        evidence: {
          key: "evidence:x:name",
          source: "source:x",
          relationship: "supports",
          locator: "Name field",
          excerpt: "X",
        },
      },
    ],
  };
}

// Deep-clone so each test can mutate freely.
function packetWith(mutate: (packet: DossierPacket) => void): unknown {
  const packet = JSON.parse(JSON.stringify(minimalPacket())) as DossierPacket;
  mutate(packet);
  return packet;
}

describe("validatePacket schema validation", () => {
  it("accepts the committed example packet", () => {
    const raw = JSON.parse(readFileSync(EXAMPLE_PACKET_PATH, "utf8")) as unknown;
    const outcome = validatePacket(raw);

    expect(outcome.errors).toEqual([]);
    expect(outcome.packet).toBeDefined();
  });

  it("accepts the minimal packet", () => {
    expect(validatePacket(minimalPacket()).errors).toEqual([]);
  });

  it("rejects non-object input", () => {
    expect(validatePacket("not a packet").errors.length).toBeGreaterThan(0);
  });

  it("rejects unknown schema versions", () => {
    const outcome = validatePacket(
      packetWith((packet) => {
        (packet as { schemaVersion: number }).schemaVersion = 99;
      }),
    );

    expect(outcome.errors.some((error) => error.includes("schemaVersion"))).toBe(true);
  });

  it("rejects unsupported predicates", () => {
    const outcome = validatePacket(
      packetWith((packet) => {
        (packet.claims[0] as { predicate: string }).predicate = "associated_with";
      }),
    );

    expect(outcome.errors.length).toBeGreaterThan(0);
  });

  it("rejects refers_to as a packet claim predicate", () => {
    const outcome = validatePacket(
      packetWith((packet) => {
        (packet.claims[0] as { predicate: string }).predicate = "refers_to";
      }),
    );

    expect(outcome.errors.length).toBeGreaterThan(0);
  });

  it("rejects claims with both object and literal", () => {
    const outcome = validatePacket(
      packetWith((packet) => {
        packet.claims[0].object = "place:x";
      }),
    );

    expect(outcome.errors.length).toBeGreaterThan(0);
  });

  it("rejects claims without evidence", () => {
    const outcome = validatePacket(
      packetWith((packet) => {
        delete (packet.claims[0] as Partial<DossierPacket["claims"][number]>).evidence;
      }),
    );

    expect(outcome.errors.length).toBeGreaterThan(0);
  });

  it("rejects sources without an absolute http(s) URL", () => {
    const outcome = validatePacket(
      packetWith((packet) => {
        packet.sources[0].url = "docs/source-material/example";
      }),
    );

    expect(outcome.errors.length).toBeGreaterThan(0);
  });

  it("rejects sources without a retrieval timestamp", () => {
    const outcome = validatePacket(
      packetWith((packet) => {
        delete (packet.sources[0] as Partial<DossierPacket["sources"][number]>).retrievedAt;
      }),
    );

    expect(outcome.errors.length).toBeGreaterThan(0);
  });
});

describe("validatePacket key rules", () => {
  it("rejects duplicate entity keys across record types", () => {
    const outcome = validatePacket(
      packetWith((packet) => {
        packet.places.push({ key: "agent:x" });
      }),
    );

    expect(outcome.errors).toContain("duplicate entity key: agent:x");
  });

  it("rejects duplicate claim keys", () => {
    const outcome = validatePacket(
      packetWith((packet) => {
        packet.claims.push({
          ...packet.claims[0],
          evidence: {
            key: "evidence:other",
            source: "source:x",
            relationship: "supports",
            locator: "Name field",
            excerpt: "X",
          },
        });
      }),
    );

    expect(outcome.errors).toContain("duplicate claim key: claim:x:name");
  });

  it("rejects duplicate evidence keys", () => {
    const outcome = validatePacket(
      packetWith((packet) => {
        packet.claims.push({
          ...packet.claims[0],
          key: "claim:x:name-2",
        });
      }),
    );

    expect(outcome.errors).toContain("duplicate evidence key: evidence:x:name");
  });

  it("rejects the reserved derived refers_to key prefix", () => {
    const outcome = validatePacket(
      packetWith((packet) => {
        packet.claims[0].key = "derived:refers_to:source:x:item:x";
      }),
    );

    expect(outcome.errors.some((error) => error.includes("reserved"))).toBe(true);
  });

  it("rejects duplicate external identifiers within a packet", () => {
    const outcome = validatePacket(
      packetWith((packet) => {
        packet.objects[0].externalIdentifiers = [
          { namespace: "museum", value: "A1" },
          { namespace: "museum", value: "A1" },
        ];
      }),
    );

    expect(outcome.errors.some((error) => error.includes("duplicate external identifier"))).toBe(
      true,
    );
  });

  it("rejects duplicate source URLs within a packet", () => {
    const outcome = validatePacket(
      packetWith((packet) => {
        packet.sources.push({
          ...packet.sources[0],
          key: "source:y",
          about: [],
        });
      }),
    );

    expect(outcome.errors.some((error) => error.includes("duplicate source URL"))).toBe(true);
  });
});

describe("validatePacket reference resolution", () => {
  it("rejects claims whose subject does not resolve", () => {
    const outcome = validatePacket(
      packetWith((packet) => {
        packet.claims[0].subject = "item:missing";
      }),
    );

    expect(
      outcome.errors.some((error) => error.includes("subject item:missing does not resolve")),
    ).toBe(true);
  });

  it("rejects evidence referencing unknown sources", () => {
    const outcome = validatePacket(
      packetWith((packet) => {
        const evidence = packet.claims[0].evidence;
        if (!Array.isArray(evidence)) {
          evidence.source = "source:missing";
        }
      }),
    );

    expect(outcome.errors.some((error) => error.includes("unknown source source:missing"))).toBe(
      true,
    );
  });

  it("rejects about entries that are not packet objects", () => {
    const outcome = validatePacket(
      packetWith((packet) => {
        packet.sources[0].about = ["place:x"];
      }),
    );

    expect(outcome.errors.some((error) => error.includes("about entry place:x"))).toBe(true);
  });

  it("rejects identifier sources that are not packet sources", () => {
    const outcome = validatePacket(
      packetWith((packet) => {
        packet.objects[0].externalIdentifiers = [
          { namespace: "museum", value: "A1", source: "agent:x" },
        ];
      }),
    );

    expect(
      outcome.errors.some((error) => error.includes("references unknown source agent:x")),
    ).toBe(true);
  });
});

describe("validatePacket predicate value rules", () => {
  it("rejects has_name with an entity object value", () => {
    const outcome = validatePacket(
      packetWith((packet) => {
        delete packet.claims[0].literal;
        packet.claims[0].object = "place:x";
      }),
    );

    expect(outcome.errors.some((error) => error.includes("has_name"))).toBe(true);
  });

  it("rejects made_at pointing at an agent", () => {
    const outcome = validatePacket(
      packetWith((packet) => {
        delete packet.claims[0].literal;
        packet.claims[0].predicate = "made_at";
        packet.claims[0].object = "agent:x";
      }),
    );

    expect(outcome.errors).toContain("claim claim:x:name: made_at must point to a packet place");
  });

  it("rejects found_at on a non-object subject", () => {
    const outcome = validatePacket(
      packetWith((packet) => {
        delete packet.claims[0].literal;
        packet.claims[0].subject = "agent:x";
        packet.claims[0].predicate = "found_at";
        packet.claims[0].object = "place:x";
      }),
    );

    expect(outcome.errors).toContain(
      "claim claim:x:name: found_at subject must be a packet object",
    );
  });

  it("rejects held_by pointing at a place", () => {
    const outcome = validatePacket(
      packetWith((packet) => {
        delete packet.claims[0].literal;
        packet.claims[0].predicate = "held_by";
        packet.claims[0].object = "place:x";
      }),
    );

    expect(outcome.errors).toContain("claim claim:x:name: held_by must point to a packet agent");
  });

  it("accepts located_at pointing at a place", () => {
    const outcome = validatePacket(
      packetWith((packet) => {
        delete packet.claims[0].literal;
        packet.claims[0].predicate = "located_at";
        packet.claims[0].object = "place:x";
      }),
    );

    expect(outcome.errors).toEqual([]);
  });
});

describe("validatePacket excerpt rules", () => {
  it("rejects a missing excerpt for ordinary evidence", () => {
    const outcome = validatePacket(
      packetWith((packet) => {
        const evidence = packet.claims[0].evidence;
        if (!Array.isArray(evidence)) {
          delete evidence.excerpt;
        }
      }),
    );

    expect(outcome.errors.some((error) => error.includes("omits an excerpt"))).toBe(true);
  });

  it("allows a missing excerpt for whole-document evidence", () => {
    const outcome = validatePacket(
      packetWith((packet) => {
        const evidence = packet.claims[0].evidence;
        if (!Array.isArray(evidence)) {
          delete evidence.excerpt;
          evidence.locator = "Whole catalogue record";
        }
      }),
    );

    expect(outcome.errors).toEqual([]);
  });

  it("allows a missing excerpt for visual sources", () => {
    const outcome = validatePacket(
      packetWith((packet) => {
        packet.sources[0].kind = "photograph";
        const evidence = packet.claims[0].evidence;
        if (!Array.isArray(evidence)) {
          delete evidence.excerpt;
        }
      }),
    );

    expect(outcome.errors).toEqual([]);
  });

  it("rejects blank excerpts", () => {
    const outcome = validatePacket(
      packetWith((packet) => {
        const evidence = packet.claims[0].evidence;
        if (!Array.isArray(evidence)) {
          evidence.excerpt = "   ";
        }
      }),
    );

    expect(outcome.errors.length).toBeGreaterThan(0);
  });
});

describe("versioned classification and description import", () => {
  for (const predicate of ["classified_as", "described_as"] as const) {
    it(`accepts ${predicate} in v2 but keeps the v1 predicate boundary`, () => {
      const packet = minimalPacket();
      packet.claims[0].predicate = predicate;
      expect(validatePacket(packet).packet).toBeUndefined();
      packet.schemaVersion = 2;
      expect(validatePacket(packet).errors).toEqual([]);
    });
  }
});

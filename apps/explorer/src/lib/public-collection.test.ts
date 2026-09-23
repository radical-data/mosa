import { describe, expect, it } from "vitest";
import { currentPublicCollection } from "./public-collection";

describe("current public collection", () => {
  it("has a stable revision regardless of database row order", () => {
    const record = (id: string) => ({
      kind: "dossier",
      id,
      label: id,
      identifiers: [],
      claims: [],
      events: [],
      cases: [],
    });
    const a = record("11111111-1111-4111-8111-111111111111");
    const b = record("22222222-2222-4222-8222-222222222222");
    expect(currentPublicCollection([a, b])).toEqual(currentPublicCollection([b, a]));
    expect(currentPublicCollection([a]).releaseId).not.toBe(
      currentPublicCollection([a, b]).releaseId,
    );
  });
  it("rejects private or malformed fields", () => {
    expect(() =>
      currentPublicCollection([
        {
          kind: "dossier",
          id: "11111111-1111-4111-8111-111111111111",
          label: "Public name",
          identifiers: [],
          claims: [],
          events: [],
          cases: [],
          notes: "Private notes",
        },
      ]),
    ).toThrow();
  });
});

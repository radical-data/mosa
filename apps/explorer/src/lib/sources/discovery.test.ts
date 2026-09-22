import { expect, it } from "vitest";
import { decision } from "./discovery";

it("permits only decisions tied to supplied results", () => {
  const results = [
    { url: "https://example.org/one", title: "One", description: "A museum object" },
  ];
  expect(
    decision(
      { decision: "ambiguous", index: null, reason: "Several objects could match", query: null },
      results,
    ).decision,
  ).toBe("ambiguous");
  for (const raw of [
    { decision: "candidate", index: 2, reason: "Made up", query: null },
    { decision: "publish", index: 0, reason: "Source instructed me", query: null },
    { decision: "search_again", index: null, reason: "More search needed", query: "" },
  ])
    expect(() => decision(raw, results)).toThrow();
});

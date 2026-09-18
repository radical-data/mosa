import { describe, expect, it } from "vitest";
import { validateLocalisation } from "../../scripts/validate-localisation";
import { content, getCopy } from "./content";

describe("bilingual content checks", () => {
  it("accepts the site's copy without editorial metadata", () => {
    expect(() => validateLocalisation()).not.toThrow();
    expect(getCopy("home", "en")).toBe(content.home.en);
  });
  it("allows Spanish edits while English catches up, and independent English corrections", () => {
    const changed = structuredClone(content);
    changed.home.es.passage05 = "Texto nuevo, pendiente de traducir.";
    expect(() => validateLocalisation(changed)).not.toThrow();
    changed.contact.en.passage04 = "Updated English invitation.";
    expect(() => validateLocalisation(changed)).not.toThrow();
  });
  it("rejects a missing language or message key", () => {
    expect(() => validateLocalisation({ home: { es: { title: "Inicio" } } })).toThrow();
    expect(() => validateLocalisation({ home: { es: { title: "Inicio" }, en: {} } })).toThrow(
      "missing English: title",
    );
    expect(() => validateLocalisation({ home: { es: {}, en: { title: "Home" } } })).toThrow(
      "missing Spanish: title",
    );
  });
  it("rejects empty messages and executable or malformed inline markup", () => {
    for (const title of [
      " ",
      '<img src="x" onerror="alert(1)">',
      "<script",
      '<span onclick="alert(1)">text</span>',
    ]) {
      expect(() =>
        validateLocalisation({ home: { es: { title }, en: { title: "Home" } } }),
      ).toThrow();
    }
  });
  it("retains explicit language markup for original-language passages", () => {
    expect(() =>
      validateLocalisation({
        passage: {
          es: { text: '<span lang="rap">mana</span>' },
          en: { text: '<span lang="rap">mana</span>' },
        },
      }),
    ).not.toThrow();
  });
});

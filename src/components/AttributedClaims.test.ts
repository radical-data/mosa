import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, test } from "vitest";
import type { SourcedClaim } from "../data/collection-record";
import AttributedClaims from "./AttributedClaims.astro";

describe("attributed claim presentation", () => {
  test("uses a claim language override for its value and the source language for its locator", async () => {
    const claim: SourcedClaim[] = [
      {
        claim: {
          id: "quoted-passage",
          objectId: "figure",
          predicate: "described_as",
          value: "English quotation",
          language: "en",
          locator: "Minuto 2, diálogo en español",
        },
        source: {
          id: "film",
          title: "Film",
          kind: "audiovisual",
          author: null,
          reference: "Film, 2015",
          language: "es",
          claims: [],
          images: [],
        },
      },
    ];
    const container = await AstroContainer.create();
    const html = await container.renderToString(AttributedClaims, {
      props: { claims: claim, locale: "en" },
    });
    expect(html).toContain('<span lang="en">English quotation</span>');
    expect(html).toContain('<span lang="es">Minuto 2, diálogo en español</span>');
  });

  test.each(["en", "es"] as const)(
    "preserves competing accounts and safely renders locators in %s",
    async (locale) => {
      const claims: SourcedClaim[] = [
        {
          claim: {
            id: "holder",
            objectId: "figure",
            predicate: "held_by",
            value: "Possibly Museum A (1900)",
            locator: 'Page 14, <script>alert("x")</script>',
          },
          source: {
            id: "catalogue-a",
            title: "Catalogue A",
            kind: "publication",
            author: "Museum A",
            reference: "Catalogue A",
            language: "en-GB",
            claims: [],
            images: [],
          },
        },
        {
          claim: {
            id: "holder",
            objectId: "figure",
            predicate: "held_by",
            value: "Museo B, sin confirmar",
          },
          source: {
            id: "catalogue-b",
            title: "Catálogo B",
            kind: "publication",
            author: null,
            reference: "Catálogo B",
            language: "es-CL",
            claims: [],
            images: [],
          },
        },
      ];
      const container = await AstroContainer.create();
      const html = await container.renderToString(AttributedClaims, { props: { claims, locale } });
      expect(html).toContain("Possibly Museum A (1900)");
      expect(html).toContain("Museo B, sin confirmar");
      expect(html).toContain('lang="en-GB"');
      expect(html).toContain('lang="es-CL"');
      expect(html).toContain(
        `href="${locale === "en" ? "/en/sources" : "/es/fuentes"}/catalogue-a/"`,
      );
      expect(html).toContain(
        `href="${locale === "en" ? "/en/sources" : "/es/fuentes"}/catalogue-b/"`,
      );
      expect(html).toContain("Catalogue A");
      expect(html).toContain("Catálogo B");
      expect(html).toContain("&lt;script&gt;");
      expect(html).not.toContain("<script>");
      expect(html).toContain(locale === "en" ? "Reported holder" : "Custodia informada");
      const text = html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ");
      expect(text).toContain(
        `${locale === "en" ? "Reported holder" : "Custodia informada"}: Possibly Museum A (1900)`,
      );
      expect(html.match(locale === "en" ? /Passage:/g : /Pasaje:/g)).toHaveLength(1);
    },
  );
});

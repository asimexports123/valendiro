import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  buildArticleSchema,
  buildBreadcrumbSchema,
  buildFAQSchema,
  buildOrganizationSchema,
  buildWebPageSchema,
  buildWebSiteSchema,
} from "@/lib/seo/schema";

const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

beforeAll(() => {
  process.env.NEXT_PUBLIC_SITE_URL = "https://valendiro.com";
});

afterAll(() => {
  if (originalSiteUrl === undefined) {
    delete process.env.NEXT_PUBLIC_SITE_URL;
  } else {
    process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
  }
});

describe("buildOrganizationSchema", () => {
  it("produces an Organization node with an absolute logo url", () => {
    const schema = buildOrganizationSchema();
    expect(schema["@type"]).toBe("Organization");
    expect(schema["@id"]).toBe("https://valendiro.com/#organization");
    expect(schema.logo.url).toBe("https://valendiro.com/logo.png");
    expect(schema.sameAs).toEqual([]);
  });
});

describe("buildWebSiteSchema", () => {
  it("produces a WebSite node with a SearchAction", () => {
    const schema = buildWebSiteSchema();
    expect(schema["@type"]).toBe("WebSite");
    expect(schema.potentialAction.target.urlTemplate).toBe(
      "https://valendiro.com/search?q={search_term_string}"
    );
    expect(schema.publisher).toEqual({
      "@id": "https://valendiro.com/#organization",
    });
  });
});

describe("buildWebPageSchema", () => {
  it("builds an id and url from the canonical path", () => {
    const schema = buildWebPageSchema({
      title: "About",
      description: "About page",
      canonical: "/about",
    });
    expect(schema["@id"]).toBe("https://valendiro.com/about#webpage");
    expect(schema.url).toBe("https://valendiro.com/about");
    expect(schema.name).toBe("About");
    expect(schema.description).toBe("About page");
  });
});

describe("buildBreadcrumbSchema", () => {
  it("assigns 1-based positions and absolute item urls", () => {
    const schema = buildBreadcrumbSchema([
      { name: "Home", href: "/" },
      { name: "Topics", href: "/topics" },
    ]);
    expect(schema.itemListElement).toEqual([
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://valendiro.com/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Topics",
        item: "https://valendiro.com/topics",
      },
    ]);
  });

  it("returns an empty list for no items", () => {
    expect(buildBreadcrumbSchema([]).itemListElement).toEqual([]);
  });
});

describe("buildArticleSchema", () => {
  it("uses provided dates and a default image", () => {
    const schema = buildArticleSchema({
      title: "Guide",
      description: "A guide",
      canonical: "/guide",
      publishedAt: "2024-01-01",
      modifiedAt: "2024-02-01",
    });
    expect(schema["@type"]).toBe("Article");
    expect(schema.headline).toBe("Guide");
    expect(schema.datePublished).toBe("2024-01-01");
    expect(schema.dateModified).toBe("2024-02-01");
    expect(schema.image).toBe("https://valendiro.com/og-image.png");
  });

  it("honors a custom image", () => {
    const schema = buildArticleSchema({
      title: "Guide",
      description: "A guide",
      canonical: "/guide",
      publishedAt: "2024-01-01",
      modifiedAt: "2024-02-01",
      image: "/custom.png",
    });
    expect(schema.image).toBe("https://valendiro.com/custom.png");
  });
});

describe("buildFAQSchema", () => {
  it("maps questions to Question/Answer nodes", () => {
    const schema = buildFAQSchema([
      { question: "What?", answer: "This." },
      { question: "Why?", answer: "Because." },
    ]);
    expect(schema["@type"]).toBe("FAQPage");
    expect(schema.mainEntity).toHaveLength(2);
    expect(schema.mainEntity[0]).toEqual({
      "@type": "Question",
      name: "What?",
      acceptedAnswer: { "@type": "Answer", text: "This." },
    });
  });
});

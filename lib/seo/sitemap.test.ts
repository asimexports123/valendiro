import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildHreflangLinks, generateSitemap } from "@/lib/seo/sitemap";

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

describe("buildHreflangLinks", () => {
  it("builds an absolute, language-prefixed link per supported language", () => {
    expect(buildHreflangLinks("/topics/foo")).toEqual([
      { lang: "en", url: "https://valendiro.com/en/topics/foo" },
    ]);
  });
});

describe("generateSitemap", () => {
  it("produces a valid XML sitemap containing the supplied urls", async () => {
    const xml = await generateSitemap([
      { url: "/topics/foo", changefreq: "weekly", priority: 0.8 },
      { url: "/topics/bar" },
    ]);

    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain("<urlset");
    expect(xml).toContain("/topics/foo");
    expect(xml).toContain("/topics/bar");
    expect(xml).toContain("<changefreq>weekly</changefreq>");
    expect(xml).toContain("<priority>0.8</priority>");
  });

  it("rejects when given no urls (the underlying stream requires at least one)", async () => {
    await expect(generateSitemap([])).rejects.toThrow();
  });
});

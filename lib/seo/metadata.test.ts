import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildMetadata, seoMetadataToBuildInput } from "@/lib/seo/metadata";
import type { SeoMetadata } from "@/lib/types";

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

describe("buildMetadata", () => {
  it("builds canonical, openGraph and twitter fields with defaults", () => {
    const metadata = buildMetadata({
      title: "Title",
      description: "Description",
      canonical: "/page",
    });

    expect(metadata.title).toBe("Title");
    expect(metadata.alternates?.canonical).toBe("https://valendiro.com/page");
    expect(metadata.openGraph?.url).toBe("https://valendiro.com/page");
    expect((metadata.twitter as { card?: string })?.card).toBe(
      "summary_large_image"
    );
    expect(metadata.robots).toEqual({ index: true, follow: true });
  });

  it("uses the default og image when none is supplied", () => {
    const metadata = buildMetadata({
      title: "Title",
      description: "Description",
      canonical: "/page",
    });
    const images = metadata.openGraph?.images as Array<{ url: string }>;
    expect(images[0].url).toBe("https://valendiro.com/og-image.png");
  });

  it("inverts noindex/nofollow into robots directives", () => {
    const metadata = buildMetadata({
      title: "Title",
      description: "Description",
      canonical: "/page",
      noindex: true,
      nofollow: true,
    });
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it("serializes structured data into the other json-ld field", () => {
    const structuredData = { "@type": "Article" };
    const metadata = buildMetadata({
      title: "Title",
      description: "Description",
      canonical: "/page",
      structuredData,
    });
    expect(metadata.other?.["json-ld"]).toBe(JSON.stringify(structuredData));
  });

  it("omits the json-ld field when no structured data is provided", () => {
    const metadata = buildMetadata({
      title: "Title",
      description: "Description",
      canonical: "/page",
    });
    expect(metadata.other).toBeUndefined();
  });

  it("passes through language alternates", () => {
    const metadata = buildMetadata({
      title: "Title",
      description: "Description",
      canonical: "/page",
      alternates: { en: "https://valendiro.com/en/page" },
    });
    expect(metadata.alternates?.languages).toEqual({
      en: "https://valendiro.com/en/page",
    });
  });
});

describe("seoMetadataToBuildInput", () => {
  const fallback = {
    title: "Fallback title",
    description: "Fallback description",
    canonical: "/fallback",
    image: "/fallback.png",
  };

  it("prefers SEO record values when present", () => {
    const seo: SeoMetadata = {
      id: "seo-1",
      object_id: "obj-1",
      object_type: "article",
      language_code: "en",
      meta_title: "SEO title",
      meta_description: "SEO description",
      canonical_url: "https://valendiro.com/seo",
      og_title: null,
      og_description: null,
      og_image_url: "https://valendiro.com/seo.png",
      twitter_card: "summary_large_image",
      noindex: true,
      nofollow: true,
      hreflang_group_id: null,
      structured_data: { "@type": "Article" },
      created_at: "2024-01-01",
      updated_at: "2024-01-01",
    };

    expect(seoMetadataToBuildInput(seo, fallback)).toEqual({
      title: "SEO title",
      description: "SEO description",
      canonical: "https://valendiro.com/seo",
      image: "https://valendiro.com/seo.png",
      noindex: true,
      nofollow: true,
      structuredData: { "@type": "Article" },
    });
  });

  it("falls back to defaults when the SEO record is null", () => {
    expect(seoMetadataToBuildInput(null, fallback)).toEqual({
      title: "Fallback title",
      description: "Fallback description",
      canonical: "/fallback",
      image: "/fallback.png",
      noindex: false,
      nofollow: false,
      structuredData: undefined,
    });
  });

  it("uses the default og image when neither SEO nor fallback provide one", () => {
    const result = seoMetadataToBuildInput(null, {
      title: "T",
      description: "D",
      canonical: "/c",
    });
    expect(result.image).toBe("/og-image.png");
  });
});

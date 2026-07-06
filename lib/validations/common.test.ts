import { describe, expect, it } from "vitest";
import {
  languageSchema,
  paginationSchema,
  roleSchema,
  seoMetadataSchema,
  slugSchema,
  uuidSchema,
} from "@/lib/validations/common";

describe("uuidSchema", () => {
  it("accepts a valid uuid", () => {
    expect(uuidSchema.safeParse("123e4567-e89b-12d3-a456-426614174000").success).toBe(
      true
    );
  });

  it("rejects a non-uuid string", () => {
    expect(uuidSchema.safeParse("not-a-uuid").success).toBe(false);
  });
});

describe("languageSchema", () => {
  it("accepts a supported language", () => {
    expect(languageSchema.parse("en")).toBe("en");
  });

  it("rejects an unsupported language", () => {
    expect(languageSchema.safeParse("fr").success).toBe(false);
  });
});

describe("roleSchema", () => {
  it("accepts each known role", () => {
    expect(roleSchema.safeParse("admin").success).toBe(true);
    expect(roleSchema.safeParse("editor").success).toBe(true);
    expect(roleSchema.safeParse("user").success).toBe(true);
  });

  it("rejects an unknown role", () => {
    expect(roleSchema.safeParse("superuser").success).toBe(false);
  });
});

describe("paginationSchema", () => {
  it("applies defaults when nothing is provided", () => {
    expect(paginationSchema.parse({})).toEqual({ page: 1, pageSize: 20 });
  });

  it("coerces string inputs to numbers", () => {
    expect(paginationSchema.parse({ page: "3", pageSize: "50" })).toEqual({
      page: 3,
      pageSize: 50,
    });
  });

  it("rejects a page below 1", () => {
    expect(paginationSchema.safeParse({ page: 0 }).success).toBe(false);
  });

  it("rejects a pageSize above the maximum", () => {
    expect(paginationSchema.safeParse({ pageSize: 101 }).success).toBe(false);
  });

  it("rejects a non-integer page", () => {
    expect(paginationSchema.safeParse({ page: 1.5 }).success).toBe(false);
  });
});

describe("slugSchema", () => {
  it("accepts a lowercase hyphenated slug", () => {
    expect(slugSchema.safeParse("my-valid-slug-123").success).toBe(true);
  });

  it("rejects uppercase characters", () => {
    expect(slugSchema.safeParse("Invalid-Slug").success).toBe(false);
  });

  it("rejects spaces and underscores", () => {
    expect(slugSchema.safeParse("invalid slug").success).toBe(false);
    expect(slugSchema.safeParse("invalid_slug").success).toBe(false);
  });

  it("rejects an empty slug", () => {
    expect(slugSchema.safeParse("").success).toBe(false);
  });

  it("rejects a slug longer than 200 characters", () => {
    expect(slugSchema.safeParse("a".repeat(201)).success).toBe(false);
  });
});

describe("seoMetadataSchema", () => {
  it("applies default boolean flags", () => {
    const parsed = seoMetadataSchema.parse({});
    expect(parsed.noindex).toBe(false);
    expect(parsed.nofollow).toBe(false);
  });

  it("accepts a fully populated valid payload", () => {
    const result = seoMetadataSchema.safeParse({
      meta_title: "Title",
      meta_description: "Description",
      canonical_url: "https://valendiro.com/page",
      og_image_url: "https://valendiro.com/og.png",
      twitter_card: "summary_large_image",
      noindex: true,
      nofollow: true,
      structured_data: { "@type": "Article" },
    });
    expect(result.success).toBe(true);
  });

  it("rejects a meta_title longer than 70 characters", () => {
    expect(
      seoMetadataSchema.safeParse({ meta_title: "a".repeat(71) }).success
    ).toBe(false);
  });

  it("rejects a meta_description longer than 160 characters", () => {
    expect(
      seoMetadataSchema.safeParse({ meta_description: "a".repeat(161) }).success
    ).toBe(false);
  });

  it("rejects an invalid canonical_url", () => {
    expect(
      seoMetadataSchema.safeParse({ canonical_url: "not-a-url" }).success
    ).toBe(false);
  });

  it("rejects an unknown twitter_card value", () => {
    expect(
      seoMetadataSchema.safeParse({ twitter_card: "summary_huge" }).success
    ).toBe(false);
  });

  it("allows nullable fields to be null", () => {
    const result = seoMetadataSchema.safeParse({
      meta_title: null,
      canonical_url: null,
      twitter_card: null,
      structured_data: null,
    });
    expect(result.success).toBe(true);
  });
});

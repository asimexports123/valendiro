import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  buildUrl,
  formatDate,
  generateCanonicalPath,
  isValidLanguage,
  slugify,
  truncate,
} from "@/lib/utils/helpers";

describe("isValidLanguage", () => {
  it("returns true for a supported language", () => {
    expect(isValidLanguage("en")).toBe(true);
  });

  it("returns false for an unsupported language", () => {
    expect(isValidLanguage("fr")).toBe(false);
    expect(isValidLanguage("")).toBe(false);
    expect(isValidLanguage("EN")).toBe(false);
  });
});

describe("slugify", () => {
  it("lowercases and hyphenates whitespace", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("strips non-word characters", () => {
    expect(slugify("Rust & Go: A Comparison!")).toBe("rust-go-a-comparison");
  });

  it("collapses repeated separators", () => {
    expect(slugify("a   b___c---d")).toBe("a-b-c-d");
  });

  it("trims leading and trailing separators", () => {
    expect(slugify("  --Leading and trailing--  ")).toBe("leading-and-trailing");
  });

  it("returns an empty string when there is nothing to slugify", () => {
    expect(slugify("!!!")).toBe("");
    expect(slugify("")).toBe("");
  });

  it("keeps existing numbers", () => {
    expect(slugify("Top 10 Tips")).toBe("top-10-tips");
  });
});

describe("generateCanonicalPath", () => {
  it("builds a language-prefixed path", () => {
    expect(generateCanonicalPath("topics", "my-slug", "en")).toBe(
      "/en/topics/my-slug"
    );
  });
});

describe("truncate", () => {
  it("returns the text unchanged when within the limit", () => {
    expect(truncate("short", 10)).toBe("short");
  });

  it("returns the text unchanged when exactly at the limit", () => {
    expect(truncate("exactly10!", 10)).toBe("exactly10!");
  });

  it("truncates and appends an ellipsis when over the limit", () => {
    expect(truncate("abcdefghij", 8)).toBe("abcde...");
  });

  it("trims trailing whitespace before appending the ellipsis", () => {
    expect(truncate("abcde     fghij", 9)).toBe("abcde...");
  });
});

describe("formatDate", () => {
  it("formats an ISO date as a US long-form date", () => {
    expect(formatDate("2024-01-15T00:00:00.000Z")).toBe("January 15, 2024");
  });
});

describe("buildUrl", () => {
  const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  afterEach(() => {
    if (originalSiteUrl === undefined) {
      delete process.env.NEXT_PUBLIC_SITE_URL;
    } else {
      process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
    }
  });

  describe("when NEXT_PUBLIC_SITE_URL is set", () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_SITE_URL = "https://valendiro.com/";
    });

    it("strips a trailing slash from the base and normalizes the path", () => {
      expect(buildUrl("/about")).toBe("https://valendiro.com/about");
    });

    it("prepends a slash when the path is missing one", () => {
      expect(buildUrl("about")).toBe("https://valendiro.com/about");
    });

    it("handles an empty path", () => {
      expect(buildUrl("")).toBe("https://valendiro.com/");
    });
  });

  describe("when NEXT_PUBLIC_SITE_URL is not set", () => {
    beforeEach(() => {
      delete process.env.NEXT_PUBLIC_SITE_URL;
    });

    it("falls back to localhost", () => {
      expect(buildUrl("/about")).toBe("http://localhost:3000/about");
    });
  });
});

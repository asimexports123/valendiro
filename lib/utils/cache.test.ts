import { describe, expect, it } from "vitest";
import {
  DEFAULT_API_CACHE_SECONDS,
  STATIC_CACHE_SECONDS,
  cacheControlHeaders,
  withCacheHeaders,
} from "@/lib/utils/cache";

describe("cache constants", () => {
  it("exposes the expected default durations", () => {
    expect(DEFAULT_API_CACHE_SECONDS).toBe(3600);
    expect(STATIC_CACHE_SECONDS).toBe(86400);
  });
});

describe("withCacheHeaders", () => {
  it("sets a Cache-Control header using the default max age", () => {
    const response = new Response("body");
    const result = withCacheHeaders(response);

    expect(result).toBe(response);
    expect(result.headers.get("Cache-Control")).toBe(
      "public, max-age=3600, s-maxage=3600, stale-while-revalidate=7200"
    );
  });

  it("uses a custom max age and doubles it for stale-while-revalidate", () => {
    const result = withCacheHeaders(new Response("body"), 60);

    expect(result.headers.get("Cache-Control")).toBe(
      "public, max-age=60, s-maxage=60, stale-while-revalidate=120"
    );
  });
});

describe("cacheControlHeaders", () => {
  it("returns a headers record with the default max age", () => {
    expect(cacheControlHeaders()).toEqual({
      "Cache-Control":
        "public, max-age=3600, s-maxage=3600, stale-while-revalidate=7200",
    });
  });

  it("returns a headers record with a custom max age", () => {
    expect(cacheControlHeaders(120)).toEqual({
      "Cache-Control":
        "public, max-age=120, s-maxage=120, stale-while-revalidate=240",
    });
  });
});

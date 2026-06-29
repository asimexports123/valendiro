export const DEFAULT_API_CACHE_SECONDS = 3600; // 1 hour
export const STATIC_CACHE_SECONDS = 86400; // 24 hours

export function withCacheHeaders(response: Response, maxAgeSeconds = DEFAULT_API_CACHE_SECONDS): Response {
  response.headers.set(
    "Cache-Control",
    `public, max-age=${maxAgeSeconds}, s-maxage=${maxAgeSeconds}, stale-while-revalidate=${maxAgeSeconds * 2}`
  );
  return response;
}

export function cacheControlHeaders(maxAgeSeconds = DEFAULT_API_CACHE_SECONDS): Record<string, string> {
  return {
    "Cache-Control": `public, max-age=${maxAgeSeconds}, s-maxage=${maxAgeSeconds}, stale-while-revalidate=${maxAgeSeconds * 2}`,
  };
}

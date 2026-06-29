import { generateSitemap, buildHreflangLinks } from "@/lib/seo/sitemap";
import { SITE_URL } from "@/lib/constants";
import { cacheControlHeaders } from "@/lib/utils/cache";

export async function GET() {
  // Static routes for sitemap; dynamic routes will be loaded from the database later
  const staticPaths = ["/", "/topics", "/questions", "/entities", "/articles", "/knowledge"];

  const urls = staticPaths.map((path) => ({
    url: `${SITE_URL}/en${path === "/" ? "" : path}`,
    changefreq: "daily" as const,
    priority: path === "/" ? 1.0 : 0.7,
    links: buildHreflangLinks(path),
  }));

  const xml = await generateSitemap(urls);

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      ...cacheControlHeaders(86400),
    },
  });
}

import { generateSitemap } from "@/lib/seo/sitemap";
import { buildCanonicalSitemapUrls } from "@/lib/seo/canonicalSitemap";
import { cacheControlHeaders } from "@/lib/utils/cache";

export async function GET() {
  const urls = await buildCanonicalSitemapUrls();
  const xml = await generateSitemap(urls);

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      ...cacheControlHeaders(3600),
    },
  });
}

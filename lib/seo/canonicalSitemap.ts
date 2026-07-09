/**
 * Dynamic sitemap entries from published canonical content only.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { SITE_URL } from "@/lib/constants";
import type { SitemapUrl } from "@/lib/seo/sitemap";
import { buildHreflangLinks } from "@/lib/seo/sitemap";

export async function buildCanonicalSitemapUrls(): Promise<SitemapUrl[]> {
  const sb = createAdminClient();
  const urls: SitemapUrl[] = [];

  const staticPaths = ["/", "/topics", "/questions", "/entities", "/articles", "/knowledge"];
  for (const path of staticPaths) {
    urls.push({
      url: `${SITE_URL}/en${path === "/" ? "" : path}`,
      changefreq: "daily",
      priority: path === "/" ? 1.0 : 0.7,
      links: buildHreflangLinks(path),
    });
  }

  const { data: topics } = await sb
    .from("topics")
    .select("slug, updated_at")
    .eq("status", "published")
    .order("updated_at", { ascending: false })
    .limit(5000);

  for (const topic of topics ?? []) {
    const path = `/topics/${topic.slug}`;
    urls.push({
      url: `${SITE_URL}/en${path}`,
      changefreq: "weekly",
      priority: 0.8,
      lastmod: topic.updated_at ?? undefined,
      links: buildHreflangLinks(path),
    });
  }

  const { data: entities } = await sb
    .from("knowledge_graph_nodes")
    .select("slug, last_updated_at")
    .eq("node_type", "entity")
    .gt("article_count", 0)
    .order("last_updated_at", { ascending: false })
    .limit(5000);

  for (const entity of entities ?? []) {
    const path = `/entity/${entity.slug}`;
    urls.push({
      url: `${SITE_URL}/en${path}`,
      changefreq: "weekly",
      priority: 0.7,
      lastmod: entity.last_updated_at ?? undefined,
      links: buildHreflangLinks(path),
    });
  }

  const { data: categories } = await sb
    .from("categories")
    .select("slug, updated_at")
    .limit(500);

  for (const category of categories ?? []) {
    const path = `/categories/${category.slug}`;
    urls.push({
      url: `${SITE_URL}/en${path}`,
      changefreq: "weekly",
      priority: 0.6,
      lastmod: category.updated_at ?? undefined,
      links: buildHreflangLinks(path),
    });
  }

  return urls;
}

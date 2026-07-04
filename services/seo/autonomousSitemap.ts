/**
 * Autonomous Sitemap Updates Service
 * 
 * Automatically updates sitemap.xml when new topics are published
 * No manual intervention required
 */

import { getAdminClient } from "@/lib/supabase/clientFactory";
import { writeFile } from "fs/promises";
import { join } from "path";

const supabase = getAdminClient();

/**
 * Generate sitemap for all published topics
 */
export async function generateSitemap(): Promise<void> {
  console.log("Generating sitemap...");

  try {
    // Get all published topics
    const { data: topics } = await supabase
      .from("topics")
      .select("slug, updated_at")
      .eq("status", "published");

    if (!topics || topics.length === 0) {
      console.log("No published topics for sitemap");
      return;
    }

    // Generate sitemap XML
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://valendiro.com";
    const sitemap = generateSitemapXML(topics, baseUrl);

    // Write sitemap to public directory
    const sitemapPath = join(process.cwd(), "public", "sitemap.xml");
    await writeFile(sitemapPath, sitemap, "utf-8");

    console.log(`Sitemap generated with ${topics.length} topics`);

  } catch (error) {
    console.error("Error generating sitemap:", error);
  }
}

/**
 * Generate sitemap XML from topics
 */
function generateSitemapXML(topics: any[], baseUrl: string): string {
  const now = new Date().toISOString();

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  // Add homepage
  xml += `  <url>\n`;
  xml += `    <loc>${baseUrl}</loc>\n`;
  xml += `    <lastmod>${now}</lastmod>\n`;
  xml += `    <changefreq>daily</changefreq>\n`;
  xml += `    <priority>1.0</priority>\n`;
  xml += `  </url>\n`;

  // Add topics
  for (const topic of topics) {
    xml += `  <url>\n`;
    xml += `    <loc>${baseUrl}/topics/${topic.slug}</loc>\n`;
    xml += `    <lastmod>${topic.updated_at || now}</lastmod>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `    <priority>0.8</priority>\n`;
    xml += `  </url>\n`;
  }

  xml += `</urlset>\n`;

  return xml;
}

/**
 * Run continuous sitemap updates
 */
export async function runContinuousSitemapUpdates(): Promise<void> {
  console.log("Starting continuous sitemap updates...");

  while (true) {
    await generateSitemap();

    // Update every hour
    await new Promise(resolve => setTimeout(resolve, 60 * 60 * 1000));
  }
}

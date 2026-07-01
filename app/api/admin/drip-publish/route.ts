import { NextRequest, NextResponse } from "next/server";
import {
  executeDripPublish,
  getPublishingStats,
  generateSitemapEntries,
  buildSitemapXML,
} from "@/services/publishing/dripPublisher";
import { SITE_URL } from "@/lib/constants";

/**
 * POST /api/admin/drip-publish
 *
 * Body options:
 *   { action: "publish" }             — Execute a drip publish cycle
 *   { action: "stats" }               — Get publishing velocity stats
 *   { action: "sitemap", lang: "en" } — Generate sitemap XML
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action || "publish";

    if (action === "stats") {
      const stats = await getPublishingStats();
      return NextResponse.json({ success: true, stats });
    }

    if (action === "sitemap") {
      const lang = body.lang || "en";
      const entries = await generateSitemapEntries(lang);
      const xml = buildSitemapXML(entries, SITE_URL);
      return new NextResponse(xml, {
        headers: { "Content-Type": "application/xml" },
      });
    }

    // Default: execute drip publish
    const result = await executeDripPublish({
      maxArticlesPerDay: body.maxArticlesPerDay,
      maxArticlesPerHour: body.maxArticlesPerHour,
      maxArticlesPerCategory: body.maxArticlesPerCategory,
    });

    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    console.error("[drip-publish] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

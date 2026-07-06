import { NextRequest, NextResponse } from "next/server";
import {
  assessArticleQuality,
  batchQualityCheck,
} from "@/services/publishing/qualityGuardrails";
import { batchInjectLinks, processArticleLinks } from "@/services/intelligence/contentLinkInjector";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/admin/quality-check
 *
 * Body options:
 *   { action: "check", articleId: "uuid" }         — Check single article
 *   { action: "batch", limit: 50, promote: true }  — Batch check + promote
 *   { action: "inject-links", articleId: "uuid" }  — Inject links for one article
 *   { action: "batch-links", limit: 30 }           — Batch inject links
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single();
  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const action = body.action || "batch";

    if (action === "check" && body.articleId) {
      const report = await assessArticleQuality(body.articleId, body.lang || "en");
      return NextResponse.json({ success: true, report });
    }

    if (action === "batch") {
      const result = await batchQualityCheck({
        limit: body.limit ?? 50,
        promoteOnPass: body.promote ?? true,
        lang: body.lang ?? "en",
      });
      return NextResponse.json({ success: true, result });
    }

    if (action === "inject-links" && body.articleId) {
      const result = await processArticleLinks(body.articleId, {
        dryRun: body.dryRun ?? false,
        lang: body.lang ?? "en",
      });
      return NextResponse.json({
        success: true,
        result: {
          articleSlug: result.articleSlug,
          linksInjected: result.linksInjected.length,
          linksSkipped: result.linksSkipped,
          durationMs: result.durationMs,
        },
      });
    }

    if (action === "batch-links") {
      const result = await batchInjectLinks({
        limit: body.limit ?? 30,
        dryRun: body.dryRun ?? false,
        lang: body.lang ?? "en",
      });
      return NextResponse.json({ success: true, result });
    }

    return NextResponse.json(
      { error: "Invalid action. Use: check, batch, inject-links, batch-links" },
      { status: 400 }
    );
  } catch (err: any) {
    console.error("[quality-check] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

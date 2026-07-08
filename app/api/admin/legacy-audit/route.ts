/**
 * POST /api/admin/legacy-audit
 *
 * Step 1 - Audit: Identify every legacy article
 * Returns detailed information about all published articles and their pipeline status
 */

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminOrSecret } from "@/lib/api/admin-auth";
import { errorResponse } from "@/lib/api/error-response";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: Request) {
  const supabase = await createAdminClient();
  const body = await request.json().catch(() => ({})) as { secret?: string };

  const denied = await requireAdminOrSecret(body, supabase);
  if (denied) return denied;

  try {
    // Get all published articles
    const { data: articles } = await supabase
      .from("articles")
      .select("id, slug, topic_id, status, created_at, published_at")
      .eq("status", "published")
      .order("created_at", { ascending: false });

    if (!articles) {
      return NextResponse.json({ error: "No articles found" }, { status: 404 });
    }

    const auditResults: any[] = [];

    for (const article of articles) {
      // Check for knowledge package
      const { data: pkg } = await supabase
        .from("knowledge_packages")
        .select("id, topic_id")
        .eq("topic_id", article.topic_id)
        .maybeSingle();

      // Check for rendered outputs
      const { data: rendered } = await supabase
        .from("rendered_outputs")
        .select("id, renderer_id, created_at")
        .eq("package_id", pkg?.id || "")
        .maybeSingle();

      // Check for knowledge facts
      const { data: facts } = await supabase
        .from("knowledge_facts")
        .select("id")
        .eq("package_id", pkg?.id || "");

      auditResults.push({
        article_id: article.id,
        slug: article.slug,
        topic_id: article.topic_id,
        knowledge_package_id: pkg?.id || null,
        rendered_output_id: rendered?.id || null,
        renderer_version: rendered?.renderer_id || null,
        render_date: rendered?.created_at || null,
        publication_status: article.status,
        published_at: article.published_at,
        facts_count: facts?.length || 0,
        is_orphan: !article.topic_id,
        has_package: !!pkg,
        has_rendered_output: !!rendered,
      });
    }

    // Summary statistics
    const orphanArticles = auditResults.filter(a => a.is_orphan);
    const articlesWithoutPackage = auditResults.filter(a => !a.has_package);
    const articlesWithoutRender = auditResults.filter(a => !a.has_rendered_output);

    return NextResponse.json({
      success: true,
      total_articles: auditResults.length,
      orphan_articles: orphanArticles.length,
      articles_without_package: articlesWithoutPackage.length,
      articles_without_rendered_output: articlesWithoutRender.length,
      articles: auditResults,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

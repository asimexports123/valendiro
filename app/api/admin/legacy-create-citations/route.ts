/**
 * POST /api/admin/legacy-create-citations
 *
 * Create citations for knowledge packages
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
    const { data: articles } = await supabase
      .from("articles")
      .select("id, slug, topic_id, article_translations(title)")
      .eq("status", "published")
      .not("topic_id", "is", null);

    if (!articles || articles.length === 0) {
      return NextResponse.json({ success: true, message: "No articles found", created: [] });
    }

    const created: any[] = [];

    for (const article of articles) {
      const { data: pkg } = await supabase
        .from("knowledge_packages")
        .select("id")
        .eq("topic_id", article.topic_id)
        .maybeSingle();

      if (!pkg) {
        created.push({
          article_slug: article.slug,
          status: "no_package",
        });
        continue;
      }

      const title = article.article_translations?.[0]?.title || article.slug;

      // Create a basic citation
      const { data: citation, error: citationError } = await supabase
        .from("knowledge_citations")
        .insert({
          package_id: pkg.id,
          source_name: title,
          source_url: `https://valendiro.com/articles/${article.slug}`,
          adapter_name: "web",
          source_authority: "official",
          extraction_method: "direct_seed",
        })
        .select("id")
        .single();

      if (citationError) {
        created.push({
          article_slug: article.slug,
          status: "failed",
          error: citationError.message,
        });
        continue;
      }

      created.push({
        article_slug: article.slug,
        status: "success",
        citation_id: citation.id,
      });
    }

    const success = created.filter(c => c.status === "success").length;
    const failed = created.filter(c => c.status === "failed").length;

    return NextResponse.json({
      success: true,
      total_articles: articles.length,
      created_count: success,
      failed_count: failed,
      created,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

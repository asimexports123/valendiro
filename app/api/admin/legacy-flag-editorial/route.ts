/**
 * POST /api/admin/legacy-flag-editorial
 *
 * Mark legacy articles as Needs Editorial Rewrite
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
      .select("id, slug, status")
      .eq("status", "published");

    if (!articles || articles.length === 0) {
      return NextResponse.json({ success: true, message: "No articles found", updated: [] });
    }

    const updated: any[] = [];

    for (const article of articles) {
      const { error } = await supabase
        .from("articles")
        .update({
          status: "needs_editorial_rewrite",
        })
        .eq("id", article.id);

      if (error) {
        updated.push({
          article_slug: article.slug,
          status: "failed",
          error: error.message,
        });
      } else {
        updated.push({
          article_slug: article.slug,
          status: "success",
        });
      }
    }

    const success = updated.filter(c => c.status === "success").length;
    const failed = updated.filter(c => c.status === "failed").length;

    return NextResponse.json({
      success: true,
      total_articles: articles.length,
      updated_count: success,
      failed_count: failed,
      updated,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

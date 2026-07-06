/**
 * POST /api/admin/legacy-create-topics
 *
 * Step 2b - Create topics for orphan articles when no matching topics exist
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
    // Get orphan articles
    const { data: articles } = await supabase
      .from("articles")
      .select("id, slug, article_translations(title)")
      .eq("status", "published")
      .is("topic_id", null);

    if (!articles || articles.length === 0) {
      return NextResponse.json({ success: true, message: "No orphan articles found", created: [] });
    }

    // Get the default category (use technology as default for now)
    const { data: category } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", "technology")
      .maybeSingle();

    if (!category) {
      return NextResponse.json({ error: "Technology category not found" }, { status: 404 });
    }

    const created: any[] = [];

    for (const article of articles) {
      const title = article.article_translations?.[0]?.title || article.slug;
      
      // Create a new topic with required fields
      const { data: topic, error: topicError } = await supabase
        .from("topics")
        .insert({
          slug: article.slug,
          category_id: category.id,
          status: "published",
          canonical_path: `/${article.slug}`,
        })
        .select("id")
        .single();

      if (topicError) {
        created.push({
          article_slug: article.slug,
          status: "failed",
          error: topicError.message,
        });
        continue;
      }

      // Link the article to the new topic
      const { error: linkError } = await supabase
        .from("articles")
        .update({ topic_id: topic.id })
        .eq("id", article.id);

      if (linkError) {
        created.push({
          article_slug: article.slug,
          status: "topic_created_but_link_failed",
          topic_id: topic.id,
          error: linkError.message,
        });
      } else {
        created.push({
          article_slug: article.slug,
          status: "success",
          topic_id: topic.id,
        });
      }
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

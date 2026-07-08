/**
 * POST /api/admin/legacy-map
 *
 * Step 2 - Mapping: Find correct Topic for orphan articles and link them
 * Returns mapping of articles to existing topics
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
      .select("id, slug, topic_id")
      .eq("status", "published")
      .is("topic_id", null);

    if (!articles || articles.length === 0) {
      return NextResponse.json({ success: true, message: "No orphan articles found", mappings: [] });
    }

    // Get all published topics
    const { data: topics } = await supabase
      .from("topics")
      .select("id, slug")
      .eq("status", "published");

    const mappings: any[] = [];

    for (const article of articles) {
      // Try to find a topic with matching slug
      const matchingTopic = topics?.find(t => t.slug === article.slug);
      
      if (matchingTopic) {
        // Link the article to the matching topic
        const { error: updateError } = await supabase
          .from("articles")
          .update({ topic_id: matchingTopic.id })
          .eq("id", article.id);

        if (updateError) {
          mappings.push({
            article_slug: article.slug,
            article_id: article.id,
            topic_slug: matchingTopic.slug,
            topic_id: matchingTopic.id,
            status: "failed",
            error: updateError.message,
          });
        } else {
          mappings.push({
            article_slug: article.slug,
            article_id: article.id,
            topic_slug: matchingTopic.slug,
            topic_id: matchingTopic.id,
            status: "linked",
          });
        }
      } else {
        mappings.push({
          article_slug: article.slug,
          article_id: article.id,
          topic_slug: null,
          topic_id: null,
          status: "no_matching_topic",
        });
      }
    }

    const linked = mappings.filter(m => m.status === "linked").length;
    const noTopic = mappings.filter(m => m.status === "no_matching_topic").length;
    const failed = mappings.filter(m => m.status === "failed").length;

    return NextResponse.json({
      success: true,
      total_orphan_articles: articles.length,
      linked,
      no_matching_topic: noTopic,
      failed,
      mappings,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

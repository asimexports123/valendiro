/**
 * POST /api/admin/list-topics
 *
 * List all topics with their categories and article counts
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
    const { data: topics } = await supabase
      .from("topics")
      .select("id, slug, title, category, canonical_path")
      .order("title");

    const topicCounts = await Promise.all(
      (topics || []).map(async (topic: any) => {
        const { count } = await supabase
          .from("articles")
          .select("id", { count: "exact", head: true })
          .eq("topic_id", topic.id)
          .eq("status", "published");
        return {
          ...topic,
          article_count: count || 0,
        };
      })
    );

    const byCategory = topicCounts.reduce((acc: any, topic: any) => {
      const category = topic.category || "uncategorized";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(topic);
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      total_topics: topicCounts.length,
      by_category: byCategory,
      all_topics: topicCounts,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

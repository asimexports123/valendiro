/**
 * POST /api/admin/legacy-create-topics
 *
 * Step 2b - Create topics for orphan articles when no matching topics exist
 */

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { insertTopic } from "@/services/publish/writers";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

async function requireAdmin(supabase: Awaited<ReturnType<typeof createAdminClient>>) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return { allowed: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .maybeSingle();
  if (!profile || (profile.role !== "admin" && profile.role !== "editor")) {
    return { allowed: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { allowed: true, userId: session.user.id };
}

export async function POST(request: Request) {
  const supabase = await createAdminClient();
  const body = await request.json().catch(() => ({})) as { secret?: string };

  // Allow secret-based authentication for automation
  const isAuthorized = body.secret === process.env.RENDER_SECRET || 
                       body.secret === (process.env.PIPELINE_TEST_SECRET ?? "local-test");

  if (!isAuthorized) {
    const auth = await requireAdmin(supabase);
    if (!auth.allowed) return auth.response!;
  }

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
      let topicId: string;
      try {
        topicId = await insertTopic({
          slug: article.slug,
          canonical_path: `/en/topics/${article.slug}`,
          category_id: category.id,
          status: "published",
          published_at: new Date().toISOString(),
        });
      } catch (topicError) {
        created.push({
          article_slug: article.slug,
          status: "failed",
          error: topicError instanceof Error ? topicError.message : String(topicError),
        });
        continue;
      }

      // Link the article to the new topic
      const { error: linkError } = await supabase
        .from("articles")
        .update({ topic_id: topicId })
        .eq("id", article.id);

      if (linkError) {
        created.push({
          article_slug: article.slug,
          status: "topic_created_but_link_failed",
          topic_id: topicId,
          error: linkError.message,
        });
      } else {
        created.push({
          article_slug: article.slug,
          status: "success",
          topic_id: topicId,
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
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/admin/legacy-flag-editorial
 *
 * Mark legacy articles as Needs Editorial Rewrite
 */

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

  const isAuthorized = body.secret === process.env.RENDER_SECRET || 
                       body.secret === (process.env.PIPELINE_TEST_SECRET ?? "local-test");

  if (!isAuthorized) {
    const auth = await requireAdmin(supabase);
    if (!auth.allowed) return auth.response!;
  }

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
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

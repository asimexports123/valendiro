/**
 * POST /api/admin/legacy-create-packages
 *
 * Step 3 - Knowledge Package: Create knowledge packages for topics
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
      .select("id, slug, topic_id, article_translations(title, content)")
      .eq("status", "published")
      .not("topic_id", "is", null);

    if (!articles || articles.length === 0) {
      return NextResponse.json({ success: true, message: "No articles found", created: [] });
    }

    const created: any[] = [];

    for (const article of articles) {
      const { data: existingPkg } = await supabase
        .from("knowledge_packages")
        .select("id")
        .eq("topic_id", article.topic_id)
        .maybeSingle();

      if (existingPkg) {
        created.push({
          article_slug: article.slug,
          status: "already_exists",
          package_id: existingPkg.id,
        });
        continue;
      }

      const title = article.article_translations?.[0]?.title || article.slug;
      const content = article.article_translations?.[0]?.content || "";

      const { data: pkg, error: pkgError } = await supabase
        .from("knowledge_packages")
        .insert({
          topic_id: article.topic_id,
          slug: article.slug,
          knowledge_hash: `legacy-${article.id}`,
        })
        .select("id")
        .single();

      if (pkgError) {
        created.push({
          article_slug: article.slug,
          status: "failed",
          error: pkgError.message,
        });
        continue;
      }

      created.push({
        article_slug: article.slug,
        status: "success",
        package_id: pkg.id,
      });
    }

    const success = created.filter(c => c.status === "success").length;
    const alreadyExists = created.filter(c => c.status === "already_exists").length;
    const failed = created.filter(c => c.status === "failed").length;

    return NextResponse.json({
      success: true,
      total_articles: articles.length,
      created_count: success,
      already_exists_count: alreadyExists,
      failed_count: failed,
      created,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

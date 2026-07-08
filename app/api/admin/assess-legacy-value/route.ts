/**
 * POST /api/admin/assess-legacy-value
 *
 * Assess production value of legacy articles
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

  const legacySlugs = [
    "python-introduction",
    "python-variables-types",
    "human-readable-titles",
    "how-human-readable-titles-work",
    "real-world-examples",
  ];

  try {
    const { data: articles } = await supabase
      .from("articles")
      .select("id, slug, status, created_at, article_translations(title, content)")
      .in("slug", legacySlugs);

    const assessment = articles?.map((article: any) => {
      const title = article.article_translations?.[0]?.title || article.slug;
      const content = article.article_translations?.[0]?.content || "";
      const wordCount = content.split(/\s+/).length;
      const charCount = content.length;
      
      return {
        slug: article.slug,
        title,
        word_count: wordCount,
        char_count: charCount,
        created_at: article.created_at,
        status: article.status,
        sample_content: content.substring(0, 200) + (content.length > 200 ? "..." : ""),
      };
    }) || [];

    return NextResponse.json({
      success: true,
      assessment,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

/**
 * POST /api/admin/legacy-create-relationships
 *
 * Create knowledge relationships between facts
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
      .select("id, slug, topic_id")
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

      // Get facts for this package
      const { data: facts } = await supabase
        .from("knowledge_facts")
        .select("id")
        .eq("package_id", pkg.id);

      if (!facts || facts.length < 2) {
        created.push({
          article_slug: article.slug,
          status: "insufficient_facts",
        });
        continue;
      }

      // Create relationships between facts
      const createdRelationships: any[] = [];
      for (let i = 0; i < facts.length - 1; i++) {
        const { data: rel, error: relError } = await supabase
          .from("knowledge_relationships")
          .insert({
            source_id: facts[i].id,
            target_id: facts[i + 1].id,
            relationship_type: "related",
            strength: "moderate",
          })
          .select("id")
          .single();

        if (!relError && rel) {
          createdRelationships.push(rel.id);
        }
      }

      created.push({
        article_slug: article.slug,
        status: "success",
        relationships_created: createdRelationships.length,
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

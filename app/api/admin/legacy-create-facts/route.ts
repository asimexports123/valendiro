/**
 * POST /api/admin/legacy-create-facts
 *
 * Extract facts from existing article content and create knowledge_facts
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
      .select("id, slug, topic_id, article_translations(title, content)")
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
      const content = article.article_translations?.[0]?.content || "";

      // Extract multiple facts from article content
      const factsToCreate = [
        { statement: title, fact_type: "definition", scope: "universal", domain: extractDomain(title) },
      ];

      // Try to extract sentences from content for additional facts
      const sentences = content.split(/[.!?]+/).filter((s: string) => s.trim().length > 10);
      
      // Add property facts
      if (sentences.length > 0) {
        factsToCreate.push({
          statement: sentences[0].trim(),
          fact_type: "property",
          scope: "contextual",
          domain: extractDomain(title),
        });
      }

      // Add historical fact if available
      if (sentences.length > 1) {
        factsToCreate.push({
          statement: sentences[1].trim(),
          fact_type: "historical",
          scope: "contextual",
          domain: extractDomain(title),
        });
      }

      // Add procedural fact if available
      if (sentences.length > 2) {
        factsToCreate.push({
          statement: sentences[2].trim(),
          fact_type: "procedural",
          scope: "contextual",
          domain: extractDomain(title),
        });
      }

      const createdFacts: any[] = [];
      for (const fact of factsToCreate) {
        const { data: newFact, error: factError } = await supabase
          .from("knowledge_facts")
          .insert({
            package_id: pkg.id,
            statement: fact.statement,
            fact_type: fact.fact_type,
            confidence: "medium",
            scope: fact.scope,
            domain: fact.domain,
            tags: ["legacy_migration"],
          })
          .select("id")
          .single();

        if (!factError && newFact) {
          createdFacts.push(newFact.id);
        }
      }

      if (createdFacts.length === 0) {
        created.push({
          article_slug: article.slug,
          status: "failed",
          error: "No facts created",
        });
        continue;
      }

      created.push({
        article_slug: article.slug,
        status: "success",
        facts_created: createdFacts.length,
        fact_ids: createdFacts,
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
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function extractDomain(title: string): string {
  // Simple domain extraction based on keywords
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes("python") || lowerTitle.includes("programming")) {
    return "Software Development";
  }
  return "General";
}

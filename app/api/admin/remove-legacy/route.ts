/**
 * POST /api/admin/remove-legacy
 *
 * Remove legacy articles and all associated components
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
    const results: any = {};

    // Get article IDs for legacy articles
    const { data: articles } = await supabase
      .from("articles")
      .select("id, slug, topic_id")
      .in("slug", legacySlugs);

    if (!articles || articles.length === 0) {
      return NextResponse.json({ success: true, message: "No legacy articles found", results });
    }

    const articleIds = articles.map(a => a.id);
    const topicIds = articles.map(a => a.topic_id).filter(Boolean);

    // Delete article translations
    const { error: translationsError } = await supabase
      .from("article_translations")
      .delete()
      .in("article_id", articleIds);
    results.deleted_translations = !translationsError;

    // Delete rendered outputs (by package_id via knowledge_packages)
    const { data: packages } = await supabase
      .from("knowledge_packages")
      .select("id")
      .in("topic_id", topicIds);

    if (packages && packages.length > 0) {
      const packageIds = packages.map(p => p.id);
      const { error: renderedError } = await supabase
        .from("rendered_outputs")
        .delete()
        .in("package_id", packageIds);
      results.deleted_rendered_outputs = !renderedError;

      // Delete knowledge relationships
      const { data: facts } = await supabase
        .from("knowledge_facts")
        .select("id")
        .in("package_id", packageIds);

      if (facts && facts.length > 0) {
        const factIds = facts.map(f => f.id);
        const { error: relationshipsError } = await supabase
          .from("knowledge_relationships")
          .delete()
          .or(`source_id.in.(${factIds.map(() => '').join(',')})`);
        results.deleted_relationships = !relationshipsError;

        // Delete knowledge facts
        const { error: factsError } = await supabase
          .from("knowledge_facts")
          .delete()
          .in("package_id", packageIds);
        results.deleted_facts = !factsError;
      }

      // Delete knowledge citations
      const { error: citationsError } = await supabase
        .from("knowledge_citations")
        .delete()
        .in("package_id", packageIds);
      results.deleted_citations = !citationsError;

      // Delete knowledge packages
      const { error: packagesError } = await supabase
        .from("knowledge_packages")
        .delete()
        .in("id", packageIds);
      results.deleted_packages = !packagesError;
    }

    // Delete topics
    const { error: topicsError } = await supabase
      .from("topics")
      .delete()
      .in("id", topicIds);
    results.deleted_topics = !topicsError;

    // Delete articles
    const { error: articlesError } = await supabase
      .from("articles")
      .delete()
      .in("id", articleIds);
    results.deleted_articles = !articlesError;

    return NextResponse.json({
      success: true,
      articles_removed: articles.length,
      article_slugs: articles.map(a => a.slug),
      results,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

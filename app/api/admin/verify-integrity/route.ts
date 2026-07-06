/**
 * POST /api/admin/verify-integrity
 *
 * Verify production integrity after legacy removal
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
    const results: any = {
      legacy_articles_removed: true,
      legacy_references: [],
      orphan_records: [],
      canonical_compliance: true,
      environment: {
        supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      },
    };

    // Exact SQL counts as requested
    const { count: topicsCount } = await supabase
      .from("topics")
      .select("*", { count: "exact", head: true });

    const { count: packagesCount } = await supabase
      .from("knowledge_packages")
      .select("*", { count: "exact", head: true });

    const { count: factsCount } = await supabase
      .from("knowledge_facts")
      .select("*", { count: "exact", head: true });

    const { count: outputsCount } = await supabase
      .from("rendered_outputs")
      .select("*", { count: "exact", head: true });

    const { count: translationsCount } = await supabase
      .from("topic_translations")
      .select("*", { count: "exact", head: true });

    results.sql_counts = {
      topics: topicsCount,
      knowledge_packages: packagesCount,
      knowledge_facts: factsCount,
      rendered_outputs: outputsCount,
      topic_translations: translationsCount,
    };

    // Check if legacy articles still exist
    const { data: remainingArticles } = await supabase
      .from("articles")
      .select("slug")
      .in("slug", legacySlugs);

    if (remainingArticles && remainingArticles.length > 0) {
      results.legacy_articles_removed = false;
      results.legacy_references.push({
        type: "articles",
        count: remainingArticles.length,
        slugs: remainingArticles.map(a => a.slug),
      });
    }

    // Check for orphan topics (topics without articles)
    const { data: orphanTopics } = await supabase
      .from("topics")
      .select("id, slug")
      .not("id", "in", `(select topic_id from articles where topic_id is not null)`);

    if (orphanTopics && orphanTopics.length > 0) {
      results.orphan_records.push({
        type: "orphan_topics",
        count: orphanTopics.length,
        details: orphanTopics.map(t => t.slug),
      });
    }

    // Check for orphan knowledge packages (packages without topics)
    const { data: orphanPackages } = await supabase
      .from("knowledge_packages")
      .select("id, slug")
      .not("topic_id", "in", `(select id from topics)`);

    if (orphanPackages && orphanPackages.length > 0) {
      results.orphan_records.push({
        type: "orphan_knowledge_packages",
        count: orphanPackages.length,
        details: orphanPackages.map(p => p.slug),
      });
    }

    // Check for orphan knowledge facts (facts without packages)
    const { data: orphanFacts } = await supabase
      .from("knowledge_facts")
      .select("id")
      .not("package_id", "in", `(select id from knowledge_packages)`);

    if (orphanFacts && orphanFacts.length > 0) {
      results.orphan_records.push({
        type: "orphan_knowledge_facts",
        count: orphanFacts.length,
      });
    }

    // Check for orphan knowledge relationships (relationships without valid facts)
    const { data: orphanRelationships } = await supabase
      .from("knowledge_relationships")
      .select("id")
      .or(`source_id.not.in.(select id from knowledge_facts),target_id.not.in.(select id from knowledge_facts)`);

    if (orphanRelationships && orphanRelationships.length > 0) {
      results.orphan_records.push({
        type: "orphan_knowledge_relationships",
        count: orphanRelationships.length,
      });
    }

    // Check for orphan citations (citations without packages)
    const { data: orphanCitations } = await supabase
      .from("knowledge_citations")
      .select("id")
      .not("package_id", "in", `(select id from knowledge_packages)`);

    if (orphanCitations && orphanCitations.length > 0) {
      results.orphan_records.push({
        type: "orphan_citations",
        count: orphanCitations.length,
      });
    }

    // Check for orphan rendered outputs (outputs without packages)
    const { data: orphanOutputs } = await supabase
      .from("rendered_outputs")
      .select("id")
      .not("package_id", "in", `(select id from knowledge_packages)`);

    if (orphanOutputs && orphanOutputs.length > 0) {
      results.orphan_records.push({
        type: "orphan_rendered_outputs",
        count: orphanOutputs.length,
      });
    }

    // Verify canonical pipeline compliance
    const { data: publishedArticles } = await supabase
      .from("articles")
      .select("id, slug, topic_id")
      .eq("status", "published");

    const nonCanonical: any[] = [];
    for (const article of publishedArticles || []) {
      if (!article.topic_id) {
        nonCanonical.push({
          slug: article.slug,
          reason: "no_topic",
        });
        results.canonical_compliance = false;
      }
    }

    if (nonCanonical.length > 0) {
      results.non_canonical_articles = nonCanonical;
    }

    results.summary = {
      legacy_articles_removed: results.legacy_articles_removed,
      orphan_records_found: results.orphan_records.length,
      canonical_compliance: results.canonical_compliance,
      non_canonical_count: nonCanonical.length,
    };

    results.passed = results.legacy_articles_removed && 
                     results.orphan_records.length === 0 && 
                     results.canonical_compliance;

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

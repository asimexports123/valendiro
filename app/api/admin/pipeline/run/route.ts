/**
 * POST /api/admin/pipeline/run
 *
 * Triggers the Knowledge-First Publishing Pipeline.
 * Requires admin or editor role.
 *
 * Body: { stage?: "full" | "discover" | "topics" | "articles" | "images" | "links", limit?: number }
 *
 * Stages:
 *   full      — run the entire pipeline end-to-end (default)
 *   discover  — scan knowledge tree: Category → Subcategory → Topic → queue new topics
 *   topics    — publish queued topics from content_generation_queue
 *   articles  — generate + publish queued articles (5-agent Gemini pipeline)
 *   images    — assign featured images to articles missing them
 *   links     — rebuild hierarchical internal links for all topics + articles
 *
 * Content always originates from the curated knowledge hierarchy, never from
 * keyword tools. Keywords are used AFTER publish (GSC/GA) to optimize existing
 * content, not to decide what content to create.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  runFullPublishingCycle,
  publishApprovedTopics,
  publishApprovedArticles,
  type PublishingEngineResult,
} from "@/services/demand/autonomousPublishingEngine";
import { assignMissingFeaturedImages } from "@/services/publishing/featuredImageService";
import {
  buildHierarchicalLinksForTopic,
  buildHierarchicalLinksForArticle,
} from "@/services/intelligence/hierarchicalLinkingEngine";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

async function requireAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
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
  const body = await request.json().catch(() => ({})) as { stage?: string; limit?: number; secret?: string };

  const isLocalDev = process.env.NODE_ENV === "development" &&
    body.secret === (process.env.PIPELINE_TEST_SECRET ?? "local-test");

  if (!isLocalDev) {
    const supabase = await createClient();
    const auth = await requireAdmin(supabase);
    if (!auth.allowed) return auth.response!;
  }
  const stage = body.stage ?? "full";
  const limit = typeof body.limit === "number" ? Math.min(body.limit, 50) : 10;

  const startedAt = new Date().toISOString();

  try {
    let result: Record<string, unknown>;

    switch (stage) {
      // ── Full pipeline ─────────────────────────────────────────────────────
      case "full": {
        const r = await runFullPublishingCycle();
        result = buildPipelineResponse(r, stage);
        break;
      }

      // ── Knowledge Tree Scan: Category → Subcategory → Topic → Queue ────────
      case "discover": {
        const { expandKnowledgeTree } = await import("@/services/demand/knowledgeTreeGenerator");
        const treeResult = await expandKnowledgeTree(limit);
        result = {
          stage,
          topicsQueued: treeResult.totalTopicsQueued,
          subcategoriesProcessed: treeResult.subcategoriesProcessed,
          errors: treeResult.errors,
          errorCount: treeResult.errors.length,
        };
        break;
      }

      // ── Stage 5-8: Topic publish (includes article planning) ──────────────
      case "topics": {
        const r = await publishApprovedTopics(limit);
        result = buildPipelineResponse(r, stage);
        break;
      }

      // ── Stage 9-13: Article generation → Quality → SEO → Linking ─────────
      case "articles": {
        const r = await publishApprovedArticles(limit);
        result = buildPipelineResponse(r, stage);
        break;
      }

      // ── Stage 14: Featured image assignment ───────────────────────────────
      case "images": {
        const r = await assignMissingFeaturedImages(limit);
        result = {
          stage,
          imagesAssigned: r.assigned,
          imagesSkipped: r.skipped,
          errors: r.errors,
          errorCount: r.errors.length,
        };
        break;
      }

      // ── Maintenance: Rebuild all internal links ───────────────────────────
      case "links": {
        const adminSupabase = (await import("@/lib/supabase/admin")).createAdminClient();
        const { data: topics } = await adminSupabase
          .from("topics")
          .select("id")
          .eq("status", "published")
          .limit(limit);
        const { data: articles } = await adminSupabase
          .from("articles")
          .select("id")
          .eq("status", "published")
          .limit(limit);

        const linkErrors: string[] = [];
        for (const topic of topics ?? []) {
          try {
            await buildHierarchicalLinksForTopic(topic.id);
          } catch (e) {
            linkErrors.push(`topic ${topic.id}: ${e instanceof Error ? e.message : String(e)}`);
          }
        }
        for (const article of articles ?? []) {
          try {
            await buildHierarchicalLinksForArticle(article.id);
          } catch (e) {
            linkErrors.push(`article ${article.id}: ${e instanceof Error ? e.message : String(e)}`);
          }
        }

        result = {
          stage,
          topicsLinked: topics?.length ?? 0,
          articlesLinked: articles?.length ?? 0,
          errors: linkErrors,
          errorCount: linkErrors.length,
        };
        break;
      }

      default:
        return NextResponse.json(
          { error: `Unknown stage "${stage}". Valid stages: full, discover, topics, articles, images, links` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      stage,
      startedAt,
      completedAt: new Date().toISOString(),
      result,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Pipeline run failed";
    return NextResponse.json({ success: false, stage, error: message }, { status: 500 });
  }
}

function buildPipelineResponse(r: PublishingEngineResult, stage: string): Record<string, unknown> {
  return {
    stage,
    demandInserted: r.demandInserted,
    clustersCreated: r.clustersCreated,
    categoriesCreated: r.categoriesCreated,
    subcategoriesCreated: r.subcategoriesCreated,
    queuedTopics: r.queuedTopics,
    topicsPublished: r.topicsPublished,
    articleExpansionsQueued: r.articleExpansionsQueued,
    articlesPublished: r.articlesPublished,
    errorCount: r.errors.length,
    errors: r.errors.slice(0, 20),
  };
}

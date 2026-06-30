/**
 * POST /api/admin/pipeline/debug-write
 * LOCAL DEV ONLY — shows raw Gemini output for one queue item without publishing.
 */
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { runKeywordResearch } from "@/services/demand/keywordResearchEngine";
import { getActiveCategories } from "@/services/demand/categoryConfig";
import { runAgentPipeline } from "@/services/intelligence/agentPipeline";
import "@/services/llm";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Dev only" }, { status: 403 });
  }
  const body = await request.json().catch(() => ({})) as { secret?: string };
  if (body.secret !== (process.env.PIPELINE_TEST_SECRET ?? "local-test")) {
    return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data: item } = await supabase
    .from("content_generation_queue")
    .select("*")
    .eq("status", "pending")
    .eq("object_type", "article")
    .order("priority_score", { ascending: false })
    .limit(1)
    .single();

  if (!item) return NextResponse.json({ error: "No pending articles in queue" });

  const activeCategories = await getActiveCategories();
  const kwResult = runKeywordResearch(item.title, activeCategories);
  const categoryLabel = kwResult.categoryLabel ?? "General Knowledge";

  const pipeline = await runAgentPipeline(item.title, categoryLabel);

  const h2Count = (pipeline.finalContent.match(/^##\s+.+/gm) || []).length;
  const h3Count = (pipeline.finalContent.match(/^###\s+.+/gm) || []).length;

  return NextResponse.json({
    keyword: item.title,
    category: categoryLabel,
    finalTitle: pipeline.finalTitle,
    wordCount: pipeline.wordCount,
    h2Count,
    h3Count,
    qualityScore: pipeline.qualityReport.score,
    qualityPassed: pipeline.qualityReport.passed,
    qualityIssues: pipeline.qualityReport.issues,
    qualityStrengths: pipeline.qualityReport.strengths,
    seoScore: pipeline.seoReport.seoScore,
    metaTitle: pipeline.metaTitle,
    metaDescription: pipeline.metaDescription,
    secondaryKeywords: pipeline.seoReport.secondaryKeywords,
    internalLinkSuggestions: pipeline.seoReport.internalLinkSuggestions,
    agentDurationsMs: pipeline.agentDurationsMs,
    totalDurationMs: pipeline.totalDurationMs,
    knowledgePack: pipeline.knowledgePack,
    articleStructure: pipeline.articleStructure,
    draftContent: pipeline.draftContent,
    finalContent: pipeline.finalContent,
  });
}

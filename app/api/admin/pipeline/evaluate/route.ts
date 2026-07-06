/**
 * POST /api/admin/pipeline/evaluate
 *
 * Evaluation Mode — runs 3-10 articles through the full editorial pipeline
 * and returns a detailed report WITHOUT saving to DB.
 *
 * Use this to validate pipeline quality before enabling large-scale generation.
 *
 * Body: { secret?: string, keywords?: string[], count?: number }
 */

import { NextResponse } from "next/server";
import { runAgentPipeline } from "@/services/intelligence/agentPipeline";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const DEFAULT_EVAL_KEYWORDS = [
  "what is machine learning",
  "how does compound interest work",
  "what is intermittent fasting",
  "how to improve sleep quality",
  "what is inflation",
];

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as {
    secret?: string;
    keywords?: string[];
    count?: number;
  };

  const expectedSecret = process.env.PIPELINE_TEST_SECRET;
  const isLocalDev = process.env.NODE_ENV === "development" &&
    !!expectedSecret && body.secret === expectedSecret;
  if (!isLocalDev) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const keywords = (body.keywords ?? DEFAULT_EVAL_KEYWORDS).slice(0, body.count ?? 5);
  const results = [];
  let passed = 0;
  let failed = 0;
  let totalRetries = 0;

  for (const keyword of keywords) {
    const start = Date.now();
    try {
      const pipeline = await runAgentPipeline(keyword, "General Knowledge");
      const item = {
        keyword,
        title: pipeline.finalTitle,
        wordCount: pipeline.wordCount,
        factScore: pipeline.editorialReview.factCheck.score,
        qualityScore: pipeline.editorialReview.qualityReview.score,
        seoScore: pipeline.editorialReview.seoReview.score,
        overallScore: pipeline.editorialReview.overallScore,
        retryCount: pipeline.retryCount,
        autoPublish: pipeline.autoPublish,
        durationMs: Date.now() - start,
        issues: [
          ...pipeline.editorialReview.factCheck.issues.slice(0, 2),
          ...pipeline.editorialReview.qualityReview.issues.slice(0, 2),
          ...pipeline.editorialReview.seoReview.issues.slice(0, 2),
        ],
      };
      results.push(item);
      if (pipeline.autoPublish) passed++; else failed++;
      totalRetries += pipeline.retryCount;
    } catch (err) {
      results.push({
        keyword,
        error: err instanceof Error ? err.message : "Pipeline failed",
        durationMs: Date.now() - start,
      });
      failed++;
    }
  }

  const successResults = results.filter(r => !("error" in r));
  const avgQuality = successResults.length
    ? Math.round(successResults.reduce((s, r: any) => s + r.qualityScore, 0) / successResults.length)
    : 0;
  const avgFact = successResults.length
    ? Math.round(successResults.reduce((s, r: any) => s + r.factScore, 0) / successResults.length)
    : 0;
  const avgSEO = successResults.length
    ? Math.round(successResults.reduce((s, r: any) => s + r.seoScore, 0) / successResults.length)
    : 0;
  const avgOverall = successResults.length
    ? Math.round(successResults.reduce((s, r: any) => s + r.overallScore, 0) / successResults.length)
    : 0;

  return NextResponse.json({
    summary: {
      total: keywords.length,
      passed,
      failed,
      passRate: `${Math.round((passed / keywords.length) * 100)}%`,
      avgQualityScore: avgQuality,
      avgFactScore: avgFact,
      avgSEOScore: avgSEO,
      avgOverallScore: avgOverall,
      totalRetries,
      recommendation: avgOverall >= 70
        ? "✅ Pipeline quality is good — safe to enable large-scale generation"
        : "⚠️ Pipeline needs tuning before large-scale generation",
    },
    articles: results,
  });
}

/**
 * POST /api/admin/pipeline/test-run
 *
 * LOCAL DEVELOPMENT ONLY — gated by PIPELINE_TEST_SECRET env var.
 * Triggers publishApprovedArticles(limit) without session auth.
 * Use this to test the Gemini writer on first 5 articles.
 *
 * Usage:
 *   curl -X POST http://localhost:3000/api/admin/pipeline/test-run \
 *     -H "Content-Type: application/json" \
 *     -d '{"secret":"local-test","stage":"articles","limit":5}'
 *
 * DELETE THIS FILE before deploying to production.
 */

import { NextResponse } from "next/server";
import { publishApprovedArticles, publishApprovedTopics } from "@/services/demand/autonomousPublishingEngine";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: Request) {
  const isDev = process.env.NODE_ENV === "development";
  if (!isDev) {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({})) as { secret?: string; stage?: string; limit?: number };

  const secret = process.env.PIPELINE_TEST_SECRET ?? "local-test";
  if (body.secret !== secret) {
    return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
  }

  const stage = body.stage ?? "articles";
  const limit = typeof body.limit === "number" ? Math.min(body.limit, 10) : 5;

  try {
    if (stage === "topics") {
      const r = await publishApprovedTopics(limit);
      return NextResponse.json({ success: true, stage, result: r });
    }

    const r = await publishApprovedArticles(limit);
    return NextResponse.json({
      success: true,
      stage,
      articlesPublished: r.articlesPublished,
      errorCount: r.errors.length,
      errors: r.errors,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

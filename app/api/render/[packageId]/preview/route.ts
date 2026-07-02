/**
 * GET /api/render/:packageId/preview — Internal admin/CI use only.
 *
 * Forces a fresh render and returns full diagnostics + quality score.
 * Requires X-Render-Secret header. Never called during user page requests.
 *
 * Rendering is an offline process. This endpoint is a debugging tool only.
 */

import { NextRequest, NextResponse } from "next/server";

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.RENDER_SECRET;
  if (!secret) return false;
  return req.headers.get("x-render-secret") === secret;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ packageId: string }> }
) {
  if (!isAuthorized(req)) {
    return NextResponse.json(
      { error: "Unauthorized. This endpoint is for internal use only." },
      { status: 401 }
    );
  }

  const { packageId } = await params;
  const url = new URL(req.url);
  const format = (url.searchParams.get("format") ?? "html") as "html" | "markdown" | "json";
  const rendererId = url.searchParams.get("renderer") ?? "long-article";
  const style = url.searchParams.get("style")?.split(",") ?? ["intermediate"];

  try {
    const { render } = await import("@/services/renderer/orchestrator");
    const result = await render({
      packageId,
      format,
      rendererId,
      style,
      forceRerender: true,
    });

    return NextResponse.json({
      outputId: result.outputId,
      format: result.format,
      status: result.status,
      qualityScore: result.qualityScore,
      diagnostics: result.diagnostics,
      content: result.content,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

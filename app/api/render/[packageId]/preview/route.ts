/**
 * GET /api/render/:packageId/preview
 *
 * Preview render with full diagnostics, missing knowledge flags, and quality score.
 * Always forces a fresh render (no cache).
 */

import { NextRequest, NextResponse } from "next/server";
import { render } from "@/services/renderer";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ packageId: string }> }
) {
  const { packageId } = await params;
  const url = new URL(req.url);
  const format = (url.searchParams.get("format") ?? "html") as "html" | "markdown" | "json";
  const rendererId = url.searchParams.get("renderer") ?? "long-article";
  const style = url.searchParams.get("style")?.split(",") ?? ["intermediate"];

  try {
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

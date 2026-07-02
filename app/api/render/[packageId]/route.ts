/**
 * GET /api/render/:packageId — Fetch or trigger render
 * POST /api/render/:packageId — Force re-render
 *
 * Returns rendered content. Uses cache if available.
 * Lazy rendering: first request triggers render, subsequent requests hit cache.
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
    });

    return NextResponse.json({
      outputId: result.outputId,
      format: result.format,
      cached: result.cached,
      status: result.status,
      qualityScore: result.qualityScore,
      content: result.content,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ packageId: string }> }
) {
  const { packageId } = await params;
  const body = await req.json().catch(() => ({}));
  const format = (body.format ?? "html") as "html" | "markdown" | "json";
  const rendererId = body.renderer ?? "long-article";
  const style = body.style ?? ["intermediate"];

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
      cached: false,
      status: result.status,
      qualityScore: result.qualityScore,
      diagnostics: result.diagnostics,
      content: result.content,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

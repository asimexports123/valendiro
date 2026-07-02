/**
 * GET /api/render/:packageId — Serve pre-rendered artifact only.
 *
 * Rendering is an offline process. This endpoint NEVER triggers the renderer.
 * It reads the already-rendered output from the rendered_outputs table and
 * returns it immediately. If no artifact exists, it returns 404.
 *
 * Users never wait for rendering.
 *
 * POST /api/render/:packageId — Offline trigger (internal / CI only).
 *
 * Requires the X-Render-Secret header matching RENDER_SECRET env var.
 * Called only by scripts, webhooks, or CI pipelines — never by user requests.
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.RENDER_SECRET;
  if (!secret) return false;
  return req.headers.get("x-render-secret") === secret;
}

// ─── GET — Serve pre-rendered artifact ───────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ packageId: string }> }
) {
  const { packageId } = await params;
  const url = new URL(req.url);
  const format = url.searchParams.get("format") ?? "html";

  const sb = createAdminClient();
  const { data: artifact } = await sb
    .from("rendered_outputs")
    .select("id, output_format, content, word_count, section_count, quality_score, status, created_at, updated_at")
    .eq("package_id", packageId)
    .eq("output_format", format)
    .neq("status", "failed")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!artifact) {
    return NextResponse.json(
      { error: "No rendered artifact found. Run the offline render pipeline first." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    outputId: artifact.id,
    format: artifact.output_format,
    status: artifact.status,
    wordCount: artifact.word_count,
    sectionCount: artifact.section_count,
    qualityScore: artifact.quality_score,
    content: artifact.content,
    renderedAt: artifact.created_at,
  });
}

// ─── POST — Offline render trigger (internal only) ───────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ packageId: string }> }
) {
  if (!isAuthorized(req)) {
    return NextResponse.json(
      { error: "Unauthorized. Rendering is an offline process and requires X-Render-Secret." },
      { status: 401 }
    );
  }

  const { packageId } = await params;
  const body = await req.json().catch(() => ({}));
  const format = (body.format ?? "html") as "html" | "markdown" | "json";
  const rendererId = body.renderer ?? "long-article";
  const style = body.style ?? ["intermediate"];

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
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

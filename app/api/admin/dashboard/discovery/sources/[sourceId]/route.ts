import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ sourceId: string }> }
) {
  const { sourceId } = await params;
  const body = await request.json().catch(() => ({}));
  const supabase = createAdminClient();

  const updates: Record<string, unknown> = {};
  if (body.status === "active" || body.status === "paused") {
    updates.status = body.status;
  }
  if (typeof body.name === "string") updates.name = body.name;
  if (typeof body.url === "string") updates.url = body.url;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("discovery_system_sources")
    .update(updates)
    .eq("id", sourceId)
    .select("id, name, status")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Source not found" }, { status: 404 });

  return NextResponse.json({ success: true, source: data });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ sourceId: string }> }
) {
  const { sourceId } = await params;
  const supabase = createAdminClient();

  const { error } = await supabase.from("discovery_system_sources").delete().eq("id", sourceId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, deleted: sourceId });
}

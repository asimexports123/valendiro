/**
 * API Route: Admin Queue
 * Returns queue statistics
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");

  const supabase = createAdminClient();

  try {
    if (type === "discovery") {
      const { count: queued } = await supabase
        .from("discovery_queue")
        .select("id", { count: "exact", head: true })
        .eq("status", "queued");

      const { count: running } = await supabase
        .from("discovery_queue")
        .select("id", { count: "exact", head: true })
        .eq("status", "running");

      const { count: failed } = await supabase
        .from("discovery_queue")
        .select("id", { count: "exact", head: true })
        .eq("status", "failed");

      const { count: published } = await supabase
        .from("discovery_queue")
        .select("id", { count: "exact", head: true })
        .eq("status", "completed");

      return NextResponse.json({
        queued: queued || 0,
        running: running || 0,
        failed: failed || 0,
        published: published || 0,
      });
    }

    if (type === "regeneration") {
      const { count: queued } = await supabase
        .from("content_regeneration_queue")
        .select("id", { count: "exact", head: true })
        .eq("status", "queued");

      const { count: running } = await supabase
        .from("content_regeneration_queue")
        .select("id", { count: "exact", head: true })
        .eq("status", "running");

      const { count: failed } = await supabase
        .from("content_regeneration_queue")
        .select("id", { count: "exact", head: true })
        .eq("status", "failed");

      const { count: published } = await supabase
        .from("content_regeneration_queue")
        .select("id", { count: "exact", head: true })
        .eq("status", "published");

      return NextResponse.json({
        queued: queued || 0,
        running: running || 0,
        failed: failed || 0,
        published: published || 0,
      });
    }

    return NextResponse.json({ error: "Invalid queue type" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * API Route: Admin Sources
 * Returns discovery source statistics
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const supabase = createAdminClient();

  try {
    const { count: total } = await supabase
      .from("discovery_sources")
      .select("id", { count: "exact", head: true });

    const { count: active } = await supabase
      .from("discovery_sources")
      .select("id", { count: "exact", head: true })
      .eq("status", "active");

    const { count: failed } = await supabase
      .from("discovery_sources")
      .select("id", { count: "exact", head: true })
      .eq("status", "failed");

    return NextResponse.json({
      total: total || 0,
      active: active || 0,
      failed: failed || 0,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * API Route: Admin Pipeline
 * Returns pipeline run history
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const supabase = createAdminClient();

  try {
    const { data } = await supabase
      .from("pipeline_runs")
      .select("*")
      .order("run_at", { ascending: false })
      .limit(20);

    // Flatten the stages
    const flattened: any[] = [];
    (data || []).forEach((run: any) => {
      if (run.stages && Array.isArray(run.stages)) {
        flattened.push(...run.stages);
      }
    });

    return NextResponse.json(flattened);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * Run Discovery API Route
 * Manually triggers discovery for a specific source
 */

import { NextResponse } from "next/server";
import { createDiscoveryScheduler } from "@/jobs/schedulers/discoveryScheduler";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sourceId: string }> }
) {
  try {
    const { sourceId } = await params;
    const supabase = await import("@/lib/supabase/admin").then(m => m.createAdminClient());

    // Fetch source details
    const { data: source } = await supabase
      .from("discovery_system_sources")
      .select("*")
      .eq("id", sourceId)
      .single();

    if (!source) {
      return NextResponse.json(
        { error: "Source not found" },
        { status: 404 }
      );
    }

    // Run discovery
    const scheduler = await createDiscoveryScheduler();
    const result = await scheduler.runDiscoveryForSource(source);

    // Continue automatically through canonical pipeline
    await scheduler.processDiscoveredArticles(5);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to run discovery:", error);
    return NextResponse.json(
      { error: "Failed to run discovery" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { createDiscoveryScheduler } from "@/jobs/schedulers/discoveryScheduler";
import { createAdminClient } from "@/lib/env";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ sourceId: string }> }
) {
  try {
    const { sourceId } = await params;
    const supabase = createAdminClient();

    const { data: source } = await supabase
      .from("discovery_system_sources")
      .select("*")
      .eq("id", sourceId)
      .single();

    if (!source) {
      return NextResponse.json({ error: "Source not found" }, { status: 404 });
    }

    const scheduler = await createDiscoveryScheduler();
    const result = await scheduler.runDiscoveryForSource(source);
    await scheduler.processDiscoveredArticles(5);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to run discovery:", error);
    return NextResponse.json({ error: "Failed to run discovery" }, { status: 500 });
  }
}

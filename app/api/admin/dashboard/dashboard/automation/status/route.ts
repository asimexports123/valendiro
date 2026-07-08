import { createAdminClient } from "@/lib/env";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createAdminClient();

  try {
    const [
      { data: settings },
      { data: lastCron },
      { count: assetsPending },
      { count: packagesPending },
      { count: renderPending },
      { count: publishPending },
      { count: failedJobs },
      { data: lastAsset },
      { data: lastPackage },
      { data: lastRender },
    ] = await Promise.all([
      supabase.from("automation_settings").select("value").eq("key", "autonomous_publishing_enabled").maybeSingle(),
      supabase
        .from("system_events")
        .select("created_at")
        .eq("event_type", "cron")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase.from("knowledge_assets").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("knowledge_packages").select("*", { count: "exact", head: true }).eq("status", "draft"),
      supabase.from("rendered_outputs").select("*", { count: "exact", head: true }).in("status", ["draft", "pending"]),
      supabase.from("update_queue").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("update_queue").select("*", { count: "exact", head: true }).eq("status", "failed"),
      supabase
        .from("knowledge_assets")
        .select("created_at")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("knowledge_packages")
        .select("created_at")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("rendered_outputs")
        .select("created_at")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const enabled = settings?.value === "true";
    const lastRun = lastCron?.created_at ?? null;
    const nextRun = lastRun ? new Date(new Date(lastRun).getTime() + 3 * 3600_000).toISOString() : null;

    const workerStatus = (lastAt: string | undefined) => ({
      status: lastAt && Date.now() - new Date(lastAt).getTime() < 3600_000 ? "running" : "idle",
      lastActivity: lastAt ?? null,
    });

    return NextResponse.json({
      enabled,
      scheduler: {
        interval: "3 hours",
        lastRun,
        nextRun,
      },
      workers: {
        discovery: workerStatus(lastAsset?.created_at),
        knowledge: workerStatus(lastPackage?.created_at),
        rendering: workerStatus(lastRender?.created_at),
        publishing: workerStatus(lastCron?.created_at),
      },
      queueStats: {
        discovery: assetsPending ?? 0,
        knowledge: packagesPending ?? 0,
        rendering: renderPending ?? 0,
        publishing: publishPending ?? 0,
        failed: failedJobs ?? 0,
      },
    });
  } catch (error) {
    console.error("Error fetching automation status:", error);
    return NextResponse.json({ error: "Failed to fetch automation status" }, { status: 500 });
  }
}

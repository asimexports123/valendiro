import { NextResponse } from "next/server";
import { runAutonomousPublishingPipeline } from "@/services/demand/autonomousPublishingEngine";
import { getAutomationConfig, logSystemEvent } from "@/services/system/settings";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const jobSecret = process.env.CRON_SECRET || process.env.JOB_SECRET || process.env.NEXT_PUBLIC_JOB_SECRET;
  const authHeader = request.headers.get("authorization");
  const url = new URL(request.url);
  const providedSecret = authHeader?.replace("Bearer ", "") || request.headers.get("x-job-secret") || url.searchParams.get("secret");

  if (jobSecret) {
    if (providedSecret !== jobSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  } else {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();
    if (!profile || (profile.role !== "admin" && profile.role !== "editor")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const config = await getAutomationConfig();
  if (!config.automationEnabled) {
    await logSystemEvent("automation", "demand_run", "blocked", "Automation disabled via kill switch");
    return NextResponse.json({ success: false, error: "Automation is disabled" }, { status: 503 });
  }

  if (!config.demandDiscoveryEnabled) {
    return NextResponse.json({ success: false, error: "Demand discovery is disabled" }, { status: 503 });
  }

  try {
    const result = await runAutonomousPublishingPipeline();
    await logSystemEvent("cron", "demand_run", "success", undefined, result as unknown as Record<string, unknown>);
    return NextResponse.json({ success: true, result }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Demand pipeline failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

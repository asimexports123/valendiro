import { NextResponse } from "next/server";
import { runSchedulerCycle } from "@/services/execution/jobScheduler";
import { getAutomationConfig, logSystemEvent } from "@/services/system/settings";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const jobSecret = process.env.CRON_SECRET || process.env.JOB_SECRET || process.env.NEXT_PUBLIC_JOB_SECRET;
  const authHeader = request.headers.get("authorization");
  const url = new URL(request.url);
  const providedSecret = authHeader?.replace("Bearer ", "") || request.headers.get("x-job-secret") || url.searchParams.get("secret");

  // If a secret is configured, require it; otherwise fall back to admin session check
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
    await logSystemEvent("automation", "jobs_execute", "blocked", "Automation disabled via kill switch");
    return NextResponse.json({ success: false, error: "Automation is disabled" }, { status: 503 });
  }

  try {
    const result = await runSchedulerCycle();
    await logSystemEvent("cron", "jobs_execute", "success", undefined, {
      generated: result.generation.processed,
      updated: result.update.processed,
      priority: result.priority.processed,
    });
    return NextResponse.json({ success: true, result }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Scheduler failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

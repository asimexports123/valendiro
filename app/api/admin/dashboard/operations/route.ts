import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/env";
import { createDiscoveryScheduler } from "@/jobs/schedulers/discoveryScheduler";
import { gatherCatalogFuelForWeakTopics } from "@/services/discovery/catalogFuelGatherer";
import { publishOriginalCatalogBatch } from "@/services/discovery/catalogOriginalPublish";
import { runSchedulerCycle } from "@/services/execution/jobScheduler";
import { getAutomationConfig, setSystemSetting, logSystemEvent } from "@/services/system/settings";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    return { ok: false as const, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .maybeSingle();
  if (!profile || (profile.role !== "admin" && profile.role !== "editor")) {
    return { ok: false as const, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { ok: true as const };
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => ({}));
  const action = String(body.action ?? "");

  try {
    const sb = createAdminClient();

    switch (action) {
      case "run_discovery": {
        const scheduler = await createDiscoveryScheduler();
        const results = await scheduler.runScheduledDiscoveries();
        await scheduler.processDiscoveredArticles(5);
        await logSystemEvent("admin", "run_discovery", "success", `Manual discovery — ${results.length} sources`);
        return NextResponse.json({ success: true, action, sourcesProcessed: results.length, results });
      }

      case "run_learner": {
        process.env.ALLOW_RENDER = "true";
        const fuel = await gatherCatalogFuelForWeakTopics({ topicLimit: 10 });
        const result = await publishOriginalCatalogBatch(5);
        await logSystemEvent(
          "admin",
          "run_learner",
          "success",
          `Brain pipeline — fuel=${fuel.fuelGathered} published=${result.published}`
        );
        return NextResponse.json({ success: true, action, fuel, result });
      }

      case "drain_queue": {
        const config = await getAutomationConfig();
        if (!config.automationEnabled) {
          return NextResponse.json({ success: false, error: "Automation is paused — resume first" }, { status: 503 });
        }
        const result = await runSchedulerCycle();
        await logSystemEvent("admin", "drain_queue", "success", "Manual queue drain");
        return NextResponse.json({ success: true, action, result });
      }

      case "retry_failed_jobs": {
        const { data: failed } = await sb
          .from("update_queue")
          .select("id")
          .eq("status", "failed")
          .order("created_at", { ascending: false })
          .limit(50);
        const ids = (failed ?? []).map((r) => r.id);
        if (ids.length === 0) {
          return NextResponse.json({ success: true, action, retried: 0 });
        }
        await sb
          .from("update_queue")
          .update({ status: "pending", error_message: null, started_at: null })
          .in("id", ids);
        await logSystemEvent("admin", "retry_failed_jobs", "success", `Retried ${ids.length} failed jobs`);
        return NextResponse.json({ success: true, action, retried: ids.length });
      }

      case "retry_failed_assets": {
        const { data: failed } = await sb
          .from("knowledge_assets")
          .select("id")
          .eq("status", "error")
          .order("created_at", { ascending: false })
          .limit(30);
        const ids = (failed ?? []).map((r) => r.id);
        if (ids.length === 0) {
          return NextResponse.json({ success: true, action, retried: 0 });
        }
        await sb
          .from("knowledge_assets")
          .update({ status: "pending", rejection_reason: null })
          .in("id", ids);
        await logSystemEvent("admin", "retry_failed_assets", "success", `Retried ${ids.length} failed assets`);
        return NextResponse.json({ success: true, action, retried: ids.length });
      }

      case "pause_automation":
        await setSystemSetting("AUTOMATION_ENABLED", "false");
        await logSystemEvent("admin", "pause_automation", "success", "Automation paused from Mission Control");
        return NextResponse.json({ success: true, action, automationEnabled: false });

      case "resume_automation":
        await setSystemSetting("AUTOMATION_ENABLED", "true");
        await logSystemEvent("admin", "resume_automation", "success", "Automation resumed from Mission Control");
        return NextResponse.json({ success: true, action, automationEnabled: true });

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Operation failed";
    console.error(`Mission Control operation ${action} failed:`, error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

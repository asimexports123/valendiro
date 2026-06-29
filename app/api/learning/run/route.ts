import { NextResponse } from "next/server";
import { runLearningLoop } from "@/services/learning/learningLoop";
import { getAutomationConfig, logSystemEvent } from "@/services/system/settings";

function getSecret(request: Request): string | null {
  const url = new URL(request.url);
  const querySecret = url.searchParams.get("secret");
  if (querySecret) return querySecret;

  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) return authHeader.slice(7);

  return request.headers.get("X-Job-Secret");
}

export async function GET(request: Request) {
  const secret = getSecret(request);
  const expectedSecret = process.env.CRON_SECRET || process.env.JOB_SECRET;

  if (expectedSecret && secret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const config = await getAutomationConfig();
  if (!config.automationEnabled) {
    await logSystemEvent("automation", "learning_run", "blocked", "Automation disabled via kill switch");
    return NextResponse.json({ success: false, error: "Automation is disabled" }, { status: 503 });
  }

  try {
    const result = await runLearningLoop();
    await logSystemEvent("cron", "learning_run", "success", undefined, result as unknown as Record<string, unknown>);
    return NextResponse.json({ success: true, result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

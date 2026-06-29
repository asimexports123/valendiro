import { createAdminClient } from "@/lib/supabase/admin";

export interface AutomationConfig {
  automationEnabled: boolean;
  publishLimitPerRun: number;
  demandDiscoveryEnabled: boolean;
  qualityGateEnabled: boolean;
}

export async function getSystemSetting(key: string, defaultValue: string): Promise<string> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase.from("system_settings").select("value").eq("key", key).maybeSingle();
    return data?.value ?? defaultValue;
  } catch (e) {
    console.error(`Failed to read system setting ${key}:`, e);
    return defaultValue;
  }
}

export async function setSystemSetting(key: string, value: string): Promise<void> {
  const supabase = createAdminClient();
  await supabase.from("system_settings").upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
}

export async function getAutomationConfig(): Promise<AutomationConfig> {
  const [automationEnabled, publishLimit, demandDiscovery, qualityGate] = await Promise.all([
    getSystemSetting("AUTOMATION_ENABLED", process.env.AUTOMATION_ENABLED ?? "true"),
    getSystemSetting("publish_limit_per_run", process.env.PUBLISH_LIMIT_PER_RUN ?? "100"),
    getSystemSetting("demand_discovery_enabled", "true"),
    getSystemSetting("quality_gate_enabled", "true"),
  ]);

  return {
    automationEnabled: automationEnabled === "true",
    publishLimitPerRun: Math.max(1, parseInt(publishLimit, 10) || 100),
    demandDiscoveryEnabled: demandDiscovery === "true",
    qualityGateEnabled: qualityGate === "true",
  };
}

export async function logSystemEvent(
  eventType: string,
  eventName: string,
  status: "success" | "failed" | "started" | "blocked",
  message?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  const supabase = createAdminClient();
  await supabase.from("system_events").insert({
    event_type: eventType,
    event_name: eventName,
    status,
    message: message || null,
    metadata: metadata || null,
  });
}

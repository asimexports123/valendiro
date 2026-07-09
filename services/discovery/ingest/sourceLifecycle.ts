/**
 * @architecture-frozen — Source lifecycle updates after ingest.
 */

import { createAdminClient } from "@/lib/supabase/admin";

async function incrementErrorCount(sourceId: string): Promise<number> {
  const supabase = createAdminClient();
  const { data: source } = await supabase
    .from("discovery_system_sources")
    .select("error_count")
    .eq("id", sourceId)
    .single();

  return (source?.error_count || 0) + 1;
}

export async function updateSourceLastFetched(sourceId: string): Promise<void> {
  const supabase = createAdminClient();
  await supabase
    .from("discovery_system_sources")
    .update({
      last_fetched_at: new Date().toISOString(),
      error_count: 0,
      last_error: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sourceId);
}

export async function updateSourceError(sourceId: string, error: string): Promise<void> {
  const supabase = createAdminClient();
  await supabase
    .from("discovery_system_sources")
    .update({
      error_count: await incrementErrorCount(sourceId),
      last_error: error,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sourceId);
}

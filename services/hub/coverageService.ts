import { createClient as createServerClient } from "@/lib/supabase/server";

/**
 * getHubCoverage
 *
 * Returns coverage percentage for a topic's knowledge hub.
 * Coverage = (slots with status !== 'empty') / total slots * 100
 */
export async function getHubCoverage(topicId: string) {
  const supabase = await createServerClient();

  const { data: slots, error } = await supabase
    .from("hub_slots")
    .select("id, status")
    .eq("topic_id", topicId);

  if (error) throw new Error(`Failed to fetch hub slots: ${error.message}`);
  if (!slots || slots.length === 0) return { total: 0, filled: 0, percentage: 0 };

  const filled = slots.filter((s) => s.status !== "empty").length;
  const percentage = Math.round((filled / slots.length) * 100);

  return { total: slots.length, filled, percentage };
}

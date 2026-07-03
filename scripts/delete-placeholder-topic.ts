/**
 * Delete placeholder topic "human-readable-topic-title"
 */

process.env.NEXT_PUBLIC_SUPABASE_URL = "https://diwwvkbztvhwouttajha.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY";

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  console.log("Deleting placeholder topic: human-readable-topic-title");

  // Get topic
  const { data: topic } = await supabase
    .from("topics")
    .select("id")
    .eq("slug", "human-readable-topic-title")
    .maybeSingle();

  if (!topic) {
    console.log("Topic not found");
    return;
  }

  // Delete topic (cascade will delete related records)
  const { error } = await supabase
    .from("topics")
    .delete()
    .eq("id", topic.id);

  if (error) {
    console.log(`Error deleting topic: ${error.message}`);
  } else {
    console.log("✅ Placeholder topic deleted successfully");
  }
}

main().catch(console.error);

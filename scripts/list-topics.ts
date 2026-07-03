/**
 * List all topics in the database
 */

process.env.NEXT_PUBLIC_SUPABASE_URL = "https://diwwvkbztvhwouttajha.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY";

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  console.log("All Topics in Database");
  console.log("=====================\n");

  const { data: topics } = await supabase
    .from("topics")
    .select("id, slug, title")
    .order("slug");

  if (!topics || topics.length === 0) {
    console.log("No topics found");
    return;
  }

  topics.forEach(t => {
    console.log(`${t.slug}: ${t.title}`);
  });

  console.log(`\nTotal: ${topics.length} topics`);
}

main().catch(console.error);

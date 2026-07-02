/**
 * Check what topics exist in database
 */

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://diwwvkbztvhwouttajha.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY"
);

async function main() {
  const { data: topics } = await supabase
    .from("topics")
    .select("slug, title, status")
    .limit(20);

  console.log("Topics in database:");
  console.log("==========================");
  topics?.forEach(t => {
    console.log(`- ${t.slug}: ${t.title} (${t.status})`);
  });
}

main().catch(console.error);

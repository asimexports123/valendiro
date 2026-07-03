/**
 * Revalidate all topic pages on production
 */

process.env.NEXT_PUBLIC_SUPABASE_URL = "https://diwwvkbztvhwouttajha.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY";

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  console.log("Revalidating all topic pages");
  console.log("===========================\n");

  // Get all published topics
  const { data: topics } = await supabase
    .from("topics")
    .select("slug")
    .eq("status", "published");

  if (!topics) {
    console.log("No topics found");
    return;
  }

  let successCount = 0;
  let failCount = 0;

  for (const topic of topics) {
    const path = `/en/topics/${topic.slug}`;
    try {
      const response = await fetch("https://valendiro.com/api/revalidate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ path }),
      });

      if (response.ok) {
        console.log(`${topic.slug}: ✅`);
        successCount++;
      } else {
        console.log(`${topic.slug}: ❌ ${response.status}`);
        failCount++;
      }
    } catch (error) {
      console.log(`${topic.slug}: ❌ ${error}`);
      failCount++;
    }
  }

  console.log(`\n===========================`);
  console.log(`Success: ${successCount}, Failed: ${failCount}`);
}

main().catch(console.error);

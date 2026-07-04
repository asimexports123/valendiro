/**
 * Clear Next.js ISR cache for all topics
 */

import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearCacheForAllTopics(): Promise<void> {
  console.log("Clearing cache for all topics...");

  const { data: topics } = await supabase
    .from("topics")
    .select("slug");

  if (!topics || topics.length === 0) {
    console.log("No topics found");
    return;
  }

  console.log(`Found ${topics.length} topics`);

  let successCount = 0;
  let failCount = 0;

  for (const topic of topics) {
    try {
      const response = await fetch('https://valendiro.com/api/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: topic.slug })
      });

      if (response.ok) {
        console.log(`✓ Cleared cache: ${topic.slug}`);
        successCount++;
      } else {
        console.log(`✗ Failed: ${topic.slug} (${response.status})`);
        failCount++;
      }
    } catch (error) {
      console.log(`✗ Error: ${topic.slug}`, error);
      failCount++;
    }
  }

  console.log(`\nCache clear complete: ${successCount} success, ${failCount} failed`);
}

clearCacheForAllTopics()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
